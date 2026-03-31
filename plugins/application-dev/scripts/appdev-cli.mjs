#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, mkdirSync, rmdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync as nodeExecSync, spawnSync } from "node:child_process";

const STATE_FILE = join(process.cwd(), ".appdev-state.json");

const VALID_STEPS = ["plan", "generate", "evaluate", "summary", "complete"];
const VALID_STATUSES = ["in_progress", "error", "complete"];
const VALID_EXIT_CONDITIONS = ["PASS", "PLATEAU", "REGRESSION", "SAFETY_CAP"];

const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
];

const SEVERITY_ORDER = { Critical: 0, Major: 1, Minor: 2 };

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

  // Detect old 4-dimension format: reject if Code Quality is present
  const extraDimPattern = /\|\s*Code Quality\s*\|\s*\d+\/10/gi;

  if (extraDimPattern.test(content)) {
    return {
      error: "Could not extract all " + DIMENSIONS.length + " scores from report. Report contains retired dimension 'Code Quality'. Expected " + DIMENSIONS.length + " dimensions: " + DIMENSIONS.map(function (d) { return d.name; }).join(", "),
    };
  }

  // Build regex from DIMENSIONS constant to prevent contract drift (Pitfall 1)
  const dimNames = DIMENSIONS.map(function (d) {
    return d.name;
  }).join("|");
  const scorePattern = new RegExp("\\|\\s*(" + dimNames + ")\\s*\\|\\s*(\\d+)\\/10", "gi");
  const scores = {};
  let match;

  while ((match = scorePattern.exec(content)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, "_");
    scores[key] = parseInt(match[2], 10);
  }

  const expectedKeys = DIMENSIONS.map(function (d) {
    return d.key;
  });

  if (Object.keys(scores).length !== DIMENSIONS.length) {
    const found = Object.keys(scores);
    const missing = expectedKeys.filter(function (k) {
      return !found.includes(k);
    });

    return {
      error: "Could not extract all " + DIMENSIONS.length + " scores from report. Missing: " + missing.join(", ") + ". Found: " + found.join(", "),
    };
  }

  scores.total = 0;

  for (let i = 0; i < expectedKeys.length; i++) {
    scores.total += scores[expectedKeys[i]];
  }

  // Verdict is now CLI-computed via computeVerdict(), not extracted from report
  return { scores };
}

function computeVerdict(scores) {
  for (let i = 0; i < DIMENSIONS.length; i++) {
    var dim = DIMENSIONS[i];

    if (scores[dim.key] < dim.threshold) {
      return "FAIL";
    }
  }

  return "PASS";
}

function computeProductDepth(projectionSummary) {
  if (!projectionSummary || !projectionSummary.acceptance_tests) {
    return { score: 1, threshold: 7, pass: false, ceiling_applied: null, pass_rate: 0, justification: "No acceptance test data available" };
  }

  var tests = projectionSummary.acceptance_tests;
  var passRate = tests.total > 0 ? tests.passed / tests.total : 0;

  // Map pass rate to 1-10 scale
  var score = Math.round(passRate * 9) + 1;

  if (score > 10) {
    score = 10;
  }

  // Apply ceiling rules
  var ceiling = 10;
  var ceilingRule = null;

  // >50% features have failed tests -> max 5
  if (tests.results && tests.results.length > 0) {
    var featureNames = [];
    var failedFeatureNames = [];

    for (var i = 0; i < tests.results.length; i++) {
      var r = tests.results[i];

      if (featureNames.indexOf(r.feature) === -1) {
        featureNames.push(r.feature);
      }

      if (r.status === "failed" && failedFeatureNames.indexOf(r.feature) === -1) {
        failedFeatureNames.push(r.feature);
      }
    }

    if (failedFeatureNames.length > featureNames.length * 0.5) {
      ceiling = 5;
      ceilingRule = ">50% features have failing acceptance tests";
    }
  }

  // Canned AI feature detected (from projection-critic findings)
  if (projectionSummary.findings) {
    for (var j = 0; j < projectionSummary.findings.length; j++) {
      var f = projectionSummary.findings[j];

      if (f.title && f.title.toLowerCase().includes("canned") && f.severity === "Major") {
        if (ceiling > 5) {
          ceiling = 5;
          ceilingRule = "Canned AI feature detected";
        }

        break;
      }
    }
  }

  if (score > ceiling) {
    score = ceiling;
  }

  return {
    score: score,
    threshold: 7,
    pass: score >= 7,
    ceiling_applied: ceilingRule,
    pass_rate: passRate,
    justification: "Product Depth " + score + "/10 -- " + tests.passed + "/" + tests.total + " acceptance tests passed (" + Math.round(passRate * 100) + "%). " + (ceilingRule ? "Ceiling: " + ceilingRule + "." : "No ceiling applied."),
  };
}

function assemblePriorityFixes(summaries) {
  var allFindings = [];

  for (var i = 0; i < summaries.length; i++) {
    var s = summaries[i];

    if (s.findings) {
      for (var j = 0; j < s.findings.length; j++) {
        allFindings.push(s.findings[j]);
      }
    }
  }

  // Sort by severity (Critical first, then Major, then Minor)
  allFindings.sort(function (a, b) {
    var sa = SEVERITY_ORDER[a.severity] !== undefined ? SEVERITY_ORDER[a.severity] : 3;
    var sb = SEVERITY_ORDER[b.severity] !== undefined ? SEVERITY_ORDER[b.severity] : 3;

    return sa - sb;
  });

  return allFindings;
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

  // Extract scores from the report file
  const extracted = extractScores(args.report);

  if (extracted.error) {
    output({ error: extracted.error });
    process.exit(1);
  }

  // Compute verdict mechanically from scores (no longer extracted from report)
  const computedVerdict = computeVerdict(extracted.scores);

  const state = readState();

  const entry = {
    round: round,
    verdict: computedVerdict,
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
    verdict: computedVerdict,
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

// --- Asset checking ---

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp", ".avif"];
const SKIP_URL_VALUES = ["local", "n/a", ""];

function parseAssetsTable(content) {
  const lines = content.split("\n");
  const assets = [];
  let urlColIndex = -1;
  let assetColIndex = -1;
  let foundHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .map(function (c) {
        return c.trim();
      })
      .filter(function (c, idx, arr) {
        // Split on | produces empty strings at start and end
        return idx > 0 && idx < arr.length - 1;
      });

    if (!foundHeader) {
      // Look for header row with "URL" column
      urlColIndex = cells.findIndex(function (c) {
        return c.toLowerCase() === "url";
      });

      assetColIndex = cells.findIndex(function (c) {
        return c.toLowerCase() === "asset";
      });

      if (urlColIndex >= 0) {
        foundHeader = true;
      }

      continue;
    }

    // Skip separator row (contains only dashes and colons)
    if (/^[|\s:-]+$/.test(line)) {
      continue;
    }

    if (urlColIndex >= cells.length) {
      continue;
    }

    const url = cells[urlColIndex] || "";
    const asset = assetColIndex >= 0 && assetColIndex < cells.length ? cells[assetColIndex] : "";

    // Skip local/N/A/empty URLs
    if (SKIP_URL_VALUES.includes(url.toLowerCase())) {
      continue;
    }

    // Only include http/https URLs
    if (url.startsWith("http://") || url.startsWith("https://")) {
      assets.push({ asset: asset, url: url });
    }
  }

  return assets;
}

function isImageUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();

    return IMAGE_EXTENSIONS.some(function (ext) {
      return pathname.endsWith(ext);
    });
  } catch {
    return false;
  }
}

async function checkUrl(url, timeout) {
  if (timeout === undefined) {
    timeout = 5000;
  }

  const result = { url: url, status: null, ok: false, contentType: null, soft404: false, error: null };

  async function doFetch(method) {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, timeout);

    try {
      const opts = {
        method: method,
        signal: controller.signal,
        redirect: "follow",
        headers: {},
      };

      if (method === "GET") {
        opts.headers["User-Agent"] = "appdev-cli/1.0 asset-checker";
      }

      const response = await fetch(url, opts);
      clearTimeout(timer);

      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  try {
    let response;

    try {
      response = await doFetch("HEAD");
    } catch (headErr) {
      // If HEAD fails entirely, try GET
      response = await doFetch("GET");
    }

    // If HEAD returned 403 or 405, retry with GET
    if (response.status === 403 || response.status === 405) {
      try {
        response = await doFetch("GET");
      } catch {
        // Keep the HEAD response if GET also fails
      }
    }

    result.status = response.status;
    result.ok = response.status >= 200 && response.status < 400;
    result.contentType = response.headers.get("content-type") || null;

    // Soft-404 detection: image URL returning non-image content-type
    if (isImageUrl(url) && result.ok && result.contentType) {
      const ct = result.contentType.toLowerCase();

      if (!ct.startsWith("image/")) {
        result.soft404 = true;
        result.ok = false;
      }
    }
  } catch (err) {
    if (err.name === "AbortError" || err.message.includes("abort")) {
      result.error = "Timeout after " + timeout + "ms";
    } else {
      result.error = err.message || String(err);
    }
  }

  return result;
}

async function cmdCheckAssets(argv) {
  const args = parseArgs(argv);
  const filePath = args.file || join(process.cwd(), "ASSETS.md");

  if (!existsSync(filePath)) {
    output({ error: "ASSETS.md not found: " + filePath });
    process.exit(1);
  }

  let content;

  try {
    content = readFileSync(filePath, "utf8");
  } catch (err) {
    output({ error: "Failed to read ASSETS.md: " + err.message });
    process.exit(1);
  }

  const assets = parseAssetsTable(content);
  const results = [];

  // Sequential to avoid rate limiting
  for (const asset of assets) {
    const result = await checkUrl(asset.url);
    results.push(result);
  }

  const passed = results.filter(function (r) {
    return r.ok;
  }).length;

  const failed = results.filter(function (r) {
    return !r.ok;
  }).length;

  const warnings = results.filter(function (r) {
    return r.soft404;
  }).length;

  output({
    total: assets.length,
    checked: assets.length,
    passed: passed,
    failed: failed,
    warnings: warnings,
    results: results,
  });
}

// --- CLI wrappers for extractScores and computeVerdict ---

function cmdExtractScores(argv) {
  const args = parseArgs(argv);

  if (!args.report || args.report === true) {
    fail("Missing required argument: --report <path>");
  }

  const result = extractScores(args.report);

  if (result.error) {
    output({ error: result.error });
    process.exit(1);
  }

  output(result);
}

function cmdComputeVerdict(argv) {
  const args = parseArgs(argv);
  var pd = parseInt(args.pd, 10);
  var fn = parseInt(args.fn, 10);
  var vd = parseInt(args.vd, 10);

  if (isNaN(pd) || isNaN(fn) || isNaN(vd)) {
    fail("Missing required arguments: --pd <N> --fn <N> --vd <N>");
  }

  var scores = { product_depth: pd, functionality: fn, visual_design: vd };
  var verdict = computeVerdict(scores);

  output({ verdict: verdict, scores: scores });
}

// --- compile-evaluation subcommand ---

function cmdCompileEvaluation(argv) {
  const args = parseArgs(argv);

  if (args.round === undefined || args.round === true) {
    fail("Missing required argument: --round <N>");
  }

  var round = parseInt(args.round, 10);

  if (isNaN(round) || round < 0) {
    fail("Invalid round: must be an integer >= 0");
  }

  var roundDir = join(process.cwd(), "evaluation", "round-" + round);

  if (!existsSync(roundDir)) {
    output({ error: "Round directory does not exist: " + roundDir });
    process.exit(1);
  }

  // Auto-discover all */summary.json (extensible for N critics)
  var entries = readdirSync(roundDir);
  var summaryDirs = [];

  for (var i = 0; i < entries.length; i++) {
    var candidatePath = join(roundDir, entries[i], "summary.json");

    if (existsSync(candidatePath)) {
      summaryDirs.push(entries[i]);
    }
  }

  if (summaryDirs.length === 0) {
    output({ error: "No summary.json files found in " + roundDir });
    process.exit(1);
  }

  // Read and parse all summaries
  var summaries = [];

  for (var si = 0; si < summaryDirs.length; si++) {
    var raw = readFileSync(join(roundDir, summaryDirs[si], "summary.json"), "utf8");
    summaries.push(JSON.parse(raw));
  }

  // Find projection summary (has acceptance_tests) for Product Depth
  var projectionSummary = null;

  for (var pi = 0; pi < summaries.length; pi++) {
    if (summaries[pi].acceptance_tests) {
      projectionSummary = summaries[pi];

      break;
    }
  }

  var pdResult = computeProductDepth(projectionSummary);

  // Gather scores and justifications from summaries, keyed by dimension name
  var dimScores = {};
  var dimJustifications = {};

  for (var di = 0; di < summaries.length; di++) {
    var dimName = summaries[di].dimension;

    if (dimName) {
      dimScores[dimName] = summaries[di].score;
      dimJustifications[dimName] = summaries[di].justification || "";
    }
  }

  // Build allScores from DIMENSIONS constant (Pitfall 1 prevention)
  var allScores = {};

  for (var ki = 0; ki < DIMENSIONS.length; ki++) {
    var dim = DIMENSIONS[ki];

    if (dim.key === "product_depth") {
      allScores[dim.key] = pdResult.score;
    } else if (dimScores[dim.name] !== undefined) {
      allScores[dim.key] = dimScores[dim.name];
    } else {
      allScores[dim.key] = 1;
      dimJustifications[dim.name] = "No " + dim.name + " summary found";
    }
  }

  var verdict = computeVerdict(allScores);

  // Assemble priority fixes
  var fixes = assemblePriorityFixes(summaries);

  // Build status string helper
  function statusStr(score, threshold) {
    return score >= threshold ? "PASS" : "FAIL";
  }

  // Build priority fixes markdown
  var fixesMd = "";

  if (fixes.length === 0) {
    fixesMd = "No findings reported.\n";
  } else {
    fixesMd = "| # | Severity | ID | Title | Description |\n";
    fixesMd += "|---|----------|----|-------|-------------|\n";

    for (var fi = 0; fi < fixes.length; fi++) {
      fixesMd += "| " + (fi + 1) + " | " + fixes[fi].severity + " | " + fixes[fi].id + " | " + fixes[fi].title + " | " + fixes[fi].description + " |\n";
    }
  }

  // Build scores table rows from DIMENSIONS constant (Pitfall 1 prevention)
  var scoresTableRows = "";
  var justTableRows = "";

  for (var ti = 0; ti < DIMENSIONS.length; ti++) {
    var d = DIMENSIONS[ti];
    var score = allScores[d.key];
    var justification = d.key === "product_depth" ? pdResult.justification : (dimJustifications[d.name] || "");

    scoresTableRows += "| " + d.name + " | " + score + "/10 | " + d.threshold + " | " + statusStr(score, d.threshold) + " |\n";
    justTableRows += "| " + d.name + " | (" + score + " of 10) -- " + justification + " |\n";
  }

  // Assessment sections map: dimension key -> { source label, justification }
  var assessmentSections = [
    { key: "product_depth", name: "Product Depth", source: "CLI Ensemble (computed from acceptance test results)", justification: pdResult.justification, ceiling: pdResult.ceiling_applied },
    { key: "functionality", name: "Functionality", source: "Projection Critic", justification: dimJustifications["Functionality"] || "" },
    { key: "visual_design", name: "Visual Design", source: "Perceptual Critic", justification: dimJustifications["Visual Design"] || "" },
  ];

  // Build EVALUATION.md content
  var md = "";
  md += "<!--\n";
  md += "WARNING: The scores table format is parsed by appdev-cli.mjs\n";
  md += "(extractScores function). Do not change the table column structure,\n";
  md += "criterion names, score format (N/10).\n";
  md += "Verdict is computed by the CLI, not written by any agent.\n";
  md += "-->\n\n";
  md += "# Evaluation Report\n\n";
  md += "## Generation Round: " + round + "\n\n";
  md += "## Verdict: " + verdict + "\n\n";
  md += "## Scores\n\n";
  md += "| Criterion | Score | Threshold | Status |\n";
  md += "|-----------|-------|-----------|--------|\n";
  md += scoresTableRows + "\n";
  md += "## Score Justifications\n\n";
  md += "| Criterion | Justification |\n";
  md += "|-----------|---------------|\n";
  md += justTableRows + "\n";

  for (var ai = 0; ai < assessmentSections.length; ai++) {
    var sect = assessmentSections[ai];
    md += "## " + sect.name + " Assessment\n";
    md += "*Source: " + sect.source + "*\n\n";
    md += sect.justification + "\n\n";

    if (sect.ceiling) {
      md += "Ceiling applied: " + sect.ceiling + "\n\n";
    }
  }

  md += "## Priority Fixes for Next Round\n";
  md += "*Source: CLI Ensemble (merged from both critics, severity-ordered)*\n\n";
  md += fixesMd;

  writeFileSync(join(roundDir, "EVALUATION.md"), md, "utf8");

  output({ round: round, verdict: verdict, scores: allScores, compiled: true });
}

// --- install-dep subcommand ---

function cmdInstallDep(argv) {
  const args = parseArgs(argv);
  var packageName = args["package"] || "";
  var cwd = args.cwd || process.cwd();
  var lockDir = join(cwd, ".appdev-install-lock");
  var STALE_MS = 60000;
  var POLL_MS = 500;
  var MAX_WAIT_MS = 120000;

  if (!packageName) {
    fail("Missing required argument: --package <name>");
  }

  // Acquire lock
  var start = Date.now();
  var acquired = false;

  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      mkdirSync(lockDir);
      acquired = true;

      break;
    } catch (err) {
      if (err.code === "EEXIST") {
        // Check for stale lock
        try {
          var stat = statSync(lockDir);

          if (Date.now() - stat.mtimeMs > STALE_MS) {
            rmdirSync(lockDir);

            continue;
          }
        } catch (e) {
          // Lock was removed between checks
          continue;
        }

        // Wait (synchronous sleep via spawnSync)
        spawnSync("sleep", ["0.5"], { timeout: 2000 });

        continue;
      }

      throw err;
    }
  }

  if (!acquired) {
    fail("Timed out waiting for install lock after " + MAX_WAIT_MS + "ms");
  }

  var installError = null;

  try {
    nodeExecSync("npm install --save-dev " + packageName, {
      stdio: "pipe",
      timeout: 120000,
      cwd: cwd,
    });
  } catch (err) {
    installError = err;
  } finally {
    try {
      rmdirSync(lockDir);
    } catch (e) {
      // Already released
    }
  }

  if (installError) {
    output({ error: "npm install failed: " + (installError.message || String(installError)), installed: packageName, success: false });
    process.exit(1);
  }

  output({ installed: packageName, success: true });
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
  case "check-assets":
    cmdCheckAssets(subArgs);
    break;
  case "extract-scores":
    cmdExtractScores(subArgs);
    break;
  case "compute-verdict":
    cmdComputeVerdict(subArgs);
    break;
  case "compile-evaluation":
    cmdCompileEvaluation(subArgs);
    break;
  case "install-dep":
    cmdInstallDep(subArgs);
    break;
  default:
    if (!subcommand) {
      fail("No subcommand provided. Valid subcommands: init, get, update, round-complete, get-trajectory, complete, delete, exists, check-assets, extract-scores, compute-verdict, compile-evaluation, install-dep");
    } else {
      fail(
        "Unknown subcommand: " +
          subcommand +
          ". Valid subcommands: init, get, update, round-complete, get-trajectory, complete, delete, exists, check-assets, extract-scores, compute-verdict, compile-evaluation, install-dep"
      );
    }
}
