#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(process.cwd(), ".appdev-state.json");

const VALID_STEPS = ["plan", "generate", "evaluate", "summary", "complete"];
const VALID_STATUSES = ["in_progress", "error", "complete"];
const VALID_EXIT_CONDITIONS = ["PASS", "PLATEAU", "REGRESSION", "SAFETY_CAP"];
const VALID_VERDICTS = ["PASS", "FAIL"];

function fail(message) {
  process.stderr.write(JSON.stringify({ error: message }) + "\n");
  process.exit(1);
}

function output(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    fail("State file does not exist. Run 'init' first.");
  }

  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (err) {
    fail("Failed to parse state file: " + err.message);
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
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

// --- Subcommands ---

function cmdInit(argv) {
  const args = parseArgs(argv);

  if (!args.prompt || typeof args.prompt !== "string" || args.prompt.trim() === "") {
    fail("Missing required argument: --prompt <text>");
  }

  if (fs.existsSync(STATE_FILE)) {
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

  if (args.verdict === undefined || args.verdict === true) {
    fail("Missing required argument: --verdict <PASS|FAIL>");
  }

  const round = parseInt(args.round, 10);

  if (isNaN(round) || round < 0) {
    fail("Invalid round: must be an integer >= 0");
  }

  if (!VALID_VERDICTS.includes(args.verdict)) {
    fail(
      "Invalid verdict: " +
        args.verdict +
        ". Valid verdicts: " +
        VALID_VERDICTS.join(", ")
    );
  }

  let scores = null;

  if (args.scores !== undefined && args.scores !== true) {
    try {
      scores = JSON.parse(args.scores);
    } catch (err) {
      fail("Invalid scores JSON: " + err.message);
    }
  }

  let featureCount = null;

  if (
    args["feature-count"] !== undefined &&
    args["feature-count"] !== true
  ) {
    featureCount = parseInt(args["feature-count"], 10);

    if (isNaN(featureCount) || featureCount < 0) {
      fail("Invalid feature-count: must be a non-negative integer");
    }
  }

  const state = readState();

  const entry = {
    round: round,
    verdict: args.verdict,
    scores: scores,
    feature_count: featureCount,
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

  writeState(state);
  output(state);
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
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }

  output({ deleted: true });
}

function cmdExists() {
  output({ exists: fs.existsSync(STATE_FILE) });
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
      fail("No subcommand provided. Valid subcommands: init, get, update, round-complete, complete, delete, exists");
    } else {
      fail(
        "Unknown subcommand: " +
          subcommand +
          ". Valid subcommands: init, get, update, round-complete, complete, delete, exists"
      );
    }
}
