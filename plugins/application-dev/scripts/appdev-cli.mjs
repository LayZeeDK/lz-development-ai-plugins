#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const STATE_FILE = join(process.cwd(), ".appdev-state.json");

const VALID_STEPS = ["plan", "generate", "evaluate", "summary", "complete"];
const VALID_STATUSES = ["in_progress", "error", "complete"];
const VALID_EXIT_CONDITIONS = ["PASS", "PLATEAU", "REGRESSION", "SAFETY_CAP"];

function fail(message) {
  process.stderr.write(JSON.stringify({ error: message }) + "\n");
  process.exit(1);
}

function output(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function readState() {
  if (!existsSync(STATE_FILE)) {
    fail("State file does not exist. Run 'init' first.");
  }

  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch (err) {
    fail("Failed to parse state file: " + err.message);
  }
}

function writeState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function parseArgs(argv) {
  const args = {};
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);

      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        args[key] = true;
        i++;
        continue;
      }

      // For --prompt, consume all tokens until next --flag or end
      if (key === "prompt") {
        const parts = [];
        i++;

        while (i < argv.length && !argv[i].startsWith("--")) {
          parts.push(argv[i]);
          i++;
        }

        args[key] = parts.join(" ");
        continue;
      }

      args[key] = argv[i + 1];
      i += 2;
    } else {
      i++;
    }
  }

  return args;
}

// --- Score extraction and convergence logic ---

function extractScores(reportPath) {
  if (!existsSync(reportPath)) {
    return { error: "Report file not found: " + reportPath };
  }

  let content;

  try {
    content = readFileSync(reportPath, "utf8");
  } catch (err) {
    return { error: "Failed to read report file: " + err.message };
  }

  const scorePattern = /\|\s*(Product Depth|Functionality|Visual Design|Code Quality)\s*\|\s*(\d+)\/10/gi;
  const scores = {};
  let match;

  while ((match = scorePattern.exec(content)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, "_");
    scores[key] = parseInt(match[2], 10);
  }

  if (Object.keys(scores).length !== 4) {
    const found = Object.keys(scores);
    const expected = ["product_depth", "functionality", "visual_design", "code_quality"];
    const missing = expected.filter(function (k) {
      return !found.includes(k);
    });

    return {
      error: "Could not extract all 4 scores from report. Missing: " + missing.join(", ") + ". Found: " + found.join(", "),
    };
  }

  scores.total = scores.product_depth + scores.functionality + scores.visual_design + scores.code_quality;

  // Extract verdict
  const verdictMatch = content.match(/##\s*Verdict:\s*(PASS|FAIL)/);
  const verdict = verdictMatch ? verdictMatch[1] : null;

  if (!verdict) {
    return { error: "Could not extract verdict from report. Expected '## Verdict: PASS' or '## Verdict: FAIL'" };
  }

  return { scores, verdict };
}

function computeEscalation(rounds) {
  const current = rounds[rounds.length - 1];
  const prev = rounds.length > 1 ? rounds[rounds.length - 2] : null;
  const prevPrev = rounds.length > 2 ? rounds[rounds.length - 3] : null;

  // Round 1: always E-0
  if (!prev) {
    return { level: "E-0", label: "Progressing" };
  }

  const delta = current.scores.total - prev.scores.total;
  const prevDelta = prevPrev ? prev.scores.total - prevPrev.scores.total : null;

  // E-IV Catastrophic: >50% single-round drop OR total <= 5
  if (current.scores.total <= 5 || (delta < 0 && Math.abs(delta) > prev.scores.total * 0.5)) {
    return { level: "E-IV", label: "Catastrophic" };
  }

  // E-III Regression: 2 consecutive total-score declines
  if (delta < 0 && prevDelta !== null && prevDelta < 0) {
    return { level: "E-III", label: "Regression" };
  }

  // E-II Plateau: <=1 point improvement over 3-round window
  if (prevPrev) {
    const windowDelta = current.scores.total - prevPrev.scores.total;

    if (windowDelta <= 1) {
      return { level: "E-II", label: "Plateau" };
    }
  }

  // E-I Decelerating: improved but delta shrinking
  if (delta > 0 && prevDelta !== null && delta < prevDelta) {
    return { level: "E-I", label: "Decelerating" };
  }

  // E-0 Progressing: improved >1 point
  if (delta > 1) {
    return { level: "E-0", label: "Progressing" };
  }

  // Edge case: improved by exactly 0 or 1 without 3-round window -> E-I Decelerating
  if (delta >= 0) {
    return { level: "E-I", label: "Decelerating" };
  }

  // Single decline (not 2 consecutive) -> E-I Decelerating
  return { level: "E-I", label: "Decelerating" };
}

function findBestRound(rounds) {
  return rounds.reduce(function (best, r) {
    if (!best || !best.scores) {
      return r;
    }

    if (!r.scores) {
      return best;
    }

    return r.scores.total > best.scores.total ? r : best;
  });
}

function determineExit(rounds, escalation, maxRounds) {
  const current = rounds[rounds.length - 1];

  // PASS: all criteria meet thresholds
  if (current.verdict === "PASS") {
    return { exit_condition: "PASS", should_continue: false };
  }

  // PLATEAU
  if (escalation.level === "E-II") {
    return { exit_condition: "PLATEAU", should_continue: false };
  }

  // REGRESSION (E-III or E-IV)
  if (escalation.level === "E-III" || escalation.level === "E-IV") {
    const bestRound = findBestRound(rounds);

    return {
      exit_condition: "REGRESSION",
      should_continue: false,
      best_round: bestRound.round,
    };
  }

  // SAFETY_CAP
  if (current.round >= maxRounds) {
    return { exit_condition: "SAFETY_CAP", should_continue: false };
  }

  // Continue
  return { exit_condition: null, should_continue: true };
}

// --- Subcommands ---

function cmdInit(argv) {
  const args = parseArgs(argv);

  if (!args.prompt || typeof args.prompt !== "string" || args.prompt.trim() === "") {
    fail("Missing required argument: --prompt <text>");
  }

  if (existsSync(STATE_FILE)) {
    fail("State file already exists. Delete it first or use 'delete' subcommand.");
  }

  const state = {
    prompt: args.prompt,
    step: "plan",
    round: 0,
    status: "in_progress",
    exit_condition: null,
    rounds: [],
  };

  writeState(state);
  output(state);
}

function cmdGet() {
  const state = readState();
  output(state);
}

function cmdUpdate(argv) {
  const args = parseArgs(argv);

  if (!args.step) {
    fail("Missing required argument: --step <step>");
  }

  if (!VALID_STEPS.includes(args.step)) {
    fail(
      "Invalid step: " +
        args.step +
        ". Valid steps: " +
        VALID_STEPS.join(", ")
    );
  }

  const state = readState();
  state.step = args.step;

  if (args.round !== undefined && args.round !== true) {
    const round = parseInt(args.round, 10);

    if (isNaN(round) || round < 0) {
      fail("Invalid round: must be an integer >= 0");
    }

    state.round = round;
  }

  if (args.status !== undefined && args.status !== true) {
    if (!VALID_STATUSES.includes(args.status)) {
      fail(
        "Invalid status: " +
          args.status +
          ". Valid statuses: " +
          VALID_STATUSES.join(", ")
      );
    }

    state.status = args.status;
  }

  writeState(state);
  output(state);
}

function cmdRoundComplete(argv) {
  const args = parseArgs(argv);

  if (args.round === undefined || args.round === true) {
    fail("Missing required argument: --round <N>");
  }

  if (!args.report || args.report === true) {
    fail("Missing required argument: --report <path>");
  }

  const round = parseInt(args.round, 10);

  if (isNaN(round) || round < 0) {
    fail("Invalid round: must be an integer >= 0");
  }

  // Extract scores and verdict from the report file
  const extracted = extractScores(args.report);

  if (extracted.error) {
    output({ error: extracted.error });
    process.exit(1);
  }

  const state = readState();

  const entry = {
    round: round,
    verdict: extracted.verdict,
    scores: extracted.scores,
    escalation: null,
    escalation_label: null,
  };

  // Find existing entry for this round number, or append
  const existingIndex = state.rounds.findIndex(function (r) {
    return r.round === round;
  });

  if (existingIndex >= 0) {
    state.rounds[existingIndex] = entry;
  } else {
    state.rounds.push(entry);
  }

  // Sort rounds by round number to ensure correct ordering
  state.rounds.sort(function (a, b) {
    return a.round - b.round;
  });

  // Compute escalation for the current round
  const escalation = computeEscalation(state.rounds);
  entry.escalation = escalation.level;
  entry.escalation_label = escalation.label;

  // Determine exit condition
  const exitResult = determineExit(state.rounds, escalation, 10);

  // Build trajectory
  const trajectory = state.rounds.map(function (r) {
    return {
      round: r.round,
      total: r.scores ? r.scores.total : null,
      escalation: r.escalation,
    };
  });

  writeState(state);

  // Build output
  const result = {
    round: round,
    verdict: extracted.verdict,
    scores: extracted.scores,
    escalation: escalation.level,
    escalation_label: escalation.label,
    exit_condition: exitResult.exit_condition,
    should_continue: exitResult.should_continue,
    trajectory: trajectory,
  };

  if (exitResult.best_round !== undefined) {
    result.best_round = exitResult.best_round;
  }

  output(result);
}

function cmdGetTrajectory() {
  const state = readState();

  if (state.rounds.length === 0) {
    output({ trajectory: [], message: "No rounds completed yet" });

    return;
  }

  const trajectory = state.rounds.map(function (r) {
    return {
      round: r.round,
      total: r.scores ? r.scores.total : null,
      escalation: r.escalation || null,
      escalation_label: r.escalation_label || null,
      verdict: r.verdict,
    };
  });

  const latest = state.rounds[state.rounds.length - 1];

  output({
    trajectory: trajectory,
    latest_round: latest.round,
    latest_escalation: latest.escalation || null,
    latest_escalation_label: latest.escalation_label || null,
  });
}

function cmdComplete(argv) {
  const args = parseArgs(argv);

  if (!args["exit-condition"]) {
    fail("Missing required argument: --exit-condition <condition>");
  }

  if (!VALID_EXIT_CONDITIONS.includes(args["exit-condition"])) {
    fail(
      "Invalid exit-condition: " +
        args["exit-condition"] +
        ". Valid conditions: " +
        VALID_EXIT_CONDITIONS.join(", ")
    );
  }

  const state = readState();
  state.status = "complete";
  state.exit_condition = args["exit-condition"];

  writeState(state);
  output(state);
}

function cmdDelete() {
  if (existsSync(STATE_FILE)) {
    unlinkSync(STATE_FILE);
  }

  output({ deleted: true });
}

function cmdExists() {
  output({ exists: existsSync(STATE_FILE) });
}

// --- Main ---

const subcommand = process.argv[2];
const subArgs = process.argv.slice(3);

switch (subcommand) {
  case "init":
    cmdInit(subArgs);
    break;
  case "get":
    cmdGet();
    break;
  case "update":
    cmdUpdate(subArgs);
    break;
  case "round-complete":
    cmdRoundComplete(subArgs);
    break;
  case "get-trajectory":
    cmdGetTrajectory();
    break;
  case "complete":
    cmdComplete(subArgs);
    break;
  case "delete":
    cmdDelete();
    break;
  case "exists":
    cmdExists();
    break;
  default:
    if (!subcommand) {
      fail("No subcommand provided. Valid subcommands: init, get, update, round-complete, get-trajectory, complete, delete, exists");
    } else {
      fail(
        "Unknown subcommand: " +
          subcommand +
          ". Valid subcommands: init, get, update, round-complete, get-trajectory, complete, delete, exists"
      );
    }
}
