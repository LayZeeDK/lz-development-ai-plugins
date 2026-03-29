import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI_PATH = join(
  import.meta.dirname,
  "..",
  "plugins",
  "application-dev",
  "scripts",
  "appdev-cli.mjs"
);

function runCli(args, cwd) {
  try {
    const stdout = execFileSync("node", [CLI_PATH, ...args], {
      encoding: "utf8",
      cwd: cwd || process.cwd(),
      timeout: 15000,
    });

    return { stdout, exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      exitCode: err.status,
    };
  }
}

function makeTempDir() {
  const dir = join(
    tmpdir(),
    "appdev-convergence-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)
  );
  mkdirSync(dir, { recursive: true });

  return dir;
}

function makeEvalReport({ productDepth, functionality, visualDesign, codeQuality, verdict }) {
  return [
    "# QA Report -- Test App",
    "",
    "## Verdict: " + verdict,
    "",
    "## Scores",
    "",
    "| Criterion | Score | Threshold | Status |",
    "|-----------|-------|-----------|--------|",
    "| Product Depth | " + productDepth + "/10 | 7 | " + (productDepth >= 7 ? "PASS" : "FAIL") + " |",
    "| Functionality | " + functionality + "/10 | 7 | " + (functionality >= 7 ? "PASS" : "FAIL") + " |",
    "| Visual Design | " + visualDesign + "/10 | 6 | " + (visualDesign >= 6 ? "PASS" : "FAIL") + " |",
    "| Code Quality | " + codeQuality + "/10 | 6 | " + (codeQuality >= 6 ? "PASS" : "FAIL") + " |",
    "",
    "## Summary",
    "Test evaluation summary.",
  ].join("\n");
}

function initState(cwd) {
  runCli(["init", "--prompt", "test app"], cwd);
}

// -------------------------------------------------------------------------
// Gap LOOP-01: extractScores() -- parse EVALUATION.md markdown tables
// -------------------------------------------------------------------------

describe("LOOP-01: round-complete extracts scores from EVALUATION.md", function () {
  let tempDir;

  beforeEach(function () {
    tempDir = makeTempDir();
    initState(tempDir);
  });

  afterEach(function () {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("extracts all 4 criterion scores, total, and verdict from a valid EVALUATION.md", function () {
    const reportPath = join(tempDir, "EVALUATION.md");
    writeFileSync(
      reportPath,
      makeEvalReport({ productDepth: 6, functionality: 5, visualDesign: 4, codeQuality: 7, verdict: "FAIL" }),
      "utf8"
    );

    const result = runCli(["round-complete", "--round", "1", "--report", reportPath], tempDir);

    assert.equal(result.exitCode, 0, "Should exit with code 0 for valid report");

    const parsed = JSON.parse(result.stdout);
    assert.deepEqual(
      parsed.scores,
      { product_depth: 6, functionality: 5, visual_design: 4, code_quality: 7, total: 22 },
      "Should extract all 4 scores and compute total"
    );
    assert.equal(parsed.verdict, "FAIL", "Should extract FAIL verdict");
  });

  it("returns error JSON with exit code 1 when report file does not exist", function () {
    const missingPath = join(tempDir, "nonexistent", "EVALUATION.md");

    const result = runCli(["round-complete", "--round", "1", "--report", missingPath], tempDir);

    assert.equal(result.exitCode, 1, "Should exit with code 1 for missing report");

    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.error, "Should return error field");
    assert.ok(
      parsed.error.toLowerCase().includes("not found") || parsed.error.toLowerCase().includes("report"),
      "Error should mention report file not found"
    );
  });

  it("returns error JSON with exit code 1 when criteria are missing from the report", function () {
    const reportPath = join(tempDir, "EVALUATION-missing.md");
    // Missing Visual Design and Code Quality rows
    const partial = [
      "# QA Report -- Test App",
      "",
      "## Verdict: FAIL",
      "",
      "## Scores",
      "",
      "| Criterion | Score | Threshold | Status |",
      "|-----------|-------|-----------|--------|",
      "| Product Depth | 6/10 | 7 | FAIL |",
      "| Functionality | 5/10 | 7 | FAIL |",
    ].join("\n");

    writeFileSync(reportPath, partial, "utf8");

    const result = runCli(["round-complete", "--round", "1", "--report", reportPath], tempDir);

    assert.equal(result.exitCode, 1, "Should exit with code 1 for missing criteria");

    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.error, "Should return error field");
    assert.ok(
      parsed.error.toLowerCase().includes("missing") || parsed.error.toLowerCase().includes("extract"),
      "Error should mention missing scores"
    );
  });

  it("returns error JSON with exit code 1 when verdict line is absent from the report", function () {
    const reportPath = join(tempDir, "EVALUATION-no-verdict.md");
    const noVerdict = [
      "# QA Report -- Test App",
      "",
      "## Scores",
      "",
      "| Criterion | Score | Threshold | Status |",
      "|-----------|-------|-----------|--------|",
      "| Product Depth | 6/10 | 7 | FAIL |",
      "| Functionality | 5/10 | 7 | FAIL |",
      "| Visual Design | 4/10 | 6 | FAIL |",
      "| Code Quality | 7/10 | 6 | PASS |",
    ].join("\n");

    writeFileSync(reportPath, noVerdict, "utf8");

    const result = runCli(["round-complete", "--round", "1", "--report", reportPath], tempDir);

    assert.equal(result.exitCode, 1, "Should exit with code 1 for missing verdict");

    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.error, "Should return error field");
    assert.ok(
      parsed.error.toLowerCase().includes("verdict") || parsed.error.toLowerCase().includes("extract"),
      "Error should mention verdict"
    );
  });
});

// -------------------------------------------------------------------------
// Gap LOOP-04: round-complete with various score sequences
// -------------------------------------------------------------------------

describe("LOOP-04: round-complete convergence detection with multi-round score trajectories", function () {
  let tempDir;

  beforeEach(function () {
    tempDir = makeTempDir();
    initState(tempDir);
  });

  afterEach(function () {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function writeAndComplete(cwd, round, scores, verdict) {
    const reportDir = join(cwd, "evaluation", "round-" + round);
    mkdirSync(reportDir, { recursive: true });
    const reportPath = join(reportDir, "EVALUATION.md");
    writeFileSync(
      reportPath,
      makeEvalReport({ ...scores, verdict }),
      "utf8"
    );

    return runCli(["round-complete", "--round", String(round), "--report", reportPath], cwd);
  }

  it("returns should_continue=true and E-0 for improving scores in round 1", function () {
    const result = writeAndComplete(tempDir, 1,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.should_continue, true, "Round 1 FAIL should continue");
    assert.equal(parsed.exit_condition, null, "No exit condition on round 1");
    assert.equal(parsed.escalation, "E-0", "Round 1 always escalation E-0");
  });

  it("returns should_continue=false and exit_condition=PASS when verdict is PASS", function () {
    // Round 1: FAIL
    writeAndComplete(tempDir, 1,
      { productDepth: 6, functionality: 6, visualDesign: 6, codeQuality: 6 },
      "FAIL"
    );

    // Round 2: PASS
    const result = writeAndComplete(tempDir, 2,
      { productDepth: 8, functionality: 8, visualDesign: 8, codeQuality: 8 },
      "PASS"
    );

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.exit_condition, "PASS", "PASS verdict should trigger PASS exit");
    assert.equal(parsed.should_continue, false, "Should not continue after PASS");
  });

  it("returns PLATEAU exit when scores are stuck over 3 rounds (<=1 point improvement in window)", function () {
    // Scores: 20, 21, 20 -- delta over window (round3 - round1) = 0 => Plateau
    writeAndComplete(tempDir, 1,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );
    writeAndComplete(tempDir, 2,
      { productDepth: 6, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );
    const result = writeAndComplete(tempDir, 3,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.exit_condition, "PLATEAU", "Plateau scores should trigger PLATEAU exit");
    assert.equal(parsed.should_continue, false, "Should not continue after PLATEAU");
  });

  it("returns REGRESSION exit and best_round for two consecutive score declines", function () {
    // Round 1: 30, Round 2: 25, Round 3: 20 -- two consecutive declines => E-III => REGRESSION
    writeAndComplete(tempDir, 1,
      { productDepth: 8, functionality: 8, visualDesign: 7, codeQuality: 7 },
      "FAIL"
    );
    writeAndComplete(tempDir, 2,
      { productDepth: 7, functionality: 6, visualDesign: 6, codeQuality: 6 },
      "FAIL"
    );
    const result = writeAndComplete(tempDir, 3,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.exit_condition, "REGRESSION", "Consecutive declines should trigger REGRESSION exit");
    assert.equal(parsed.should_continue, false, "Should not continue after REGRESSION");
    assert.ok(typeof parsed.best_round === "number", "REGRESSION response should include best_round");
    assert.equal(parsed.best_round, 1, "Best round should be round 1 (highest score 30)");
  });

  it("returns should_continue=true with E-I Decelerating for improving-but-slowing scores", function () {
    // Round 1: 20, Round 2: 28 (+8), Round 3: 30 (+2) -- delta shrinks => E-I
    writeAndComplete(tempDir, 1,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );
    writeAndComplete(tempDir, 2,
      { productDepth: 7, functionality: 7, visualDesign: 7, codeQuality: 7 },
      "FAIL"
    );
    const result = writeAndComplete(tempDir, 3,
      { productDepth: 8, functionality: 8, visualDesign: 7, codeQuality: 7 },
      "FAIL"
    );

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-I", "Decelerating improvement should be E-I");
    assert.equal(parsed.escalation_label, "Decelerating", "E-I label should be Decelerating");
    assert.equal(parsed.should_continue, true, "E-I should continue looping");
  });

  it("returns trajectory array with all completed rounds", function () {
    writeAndComplete(tempDir, 1,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );
    writeAndComplete(tempDir, 2,
      { productDepth: 6, functionality: 6, visualDesign: 6, codeQuality: 6 },
      "FAIL"
    );
    const result = writeAndComplete(tempDir, 3,
      { productDepth: 7, functionality: 7, visualDesign: 7, codeQuality: 7 },
      "FAIL"
    );

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed.trajectory), "Response should include trajectory array");
    assert.equal(parsed.trajectory.length, 3, "Trajectory should have 3 entries after 3 rounds");
    assert.equal(parsed.trajectory[0].round, 1, "First trajectory entry should be round 1");
    assert.equal(parsed.trajectory[0].total, 20, "Round 1 total should be 20");
    assert.equal(parsed.trajectory[2].round, 3, "Third trajectory entry should be round 3");
  });
});

// -------------------------------------------------------------------------
// Gap LOOP-05: computeEscalation() -- escalation levels E-0 through E-IV
// -------------------------------------------------------------------------

describe("LOOP-05: escalation computation produces correct E-0 through E-IV levels", function () {
  let tempDir;

  beforeEach(function () {
    tempDir = makeTempDir();
    initState(tempDir);
  });

  afterEach(function () {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function completeRound(cwd, roundNum, total, verdict) {
    // Distribute total evenly across 4 criteria (remainder goes to product_depth)
    const base = Math.floor(total / 4);
    const rem = total % 4;
    const scores = {
      productDepth: base + rem,
      functionality: base,
      visualDesign: base,
      codeQuality: base,
    };
    const reportDir = join(cwd, "evaluation", "round-" + roundNum);
    mkdirSync(reportDir, { recursive: true });
    const reportPath = join(reportDir, "EVALUATION.md");
    writeFileSync(reportPath, makeEvalReport({ ...scores, verdict }), "utf8");

    return runCli(["round-complete", "--round", String(roundNum), "--report", reportPath], cwd);
  }

  it("returns E-0 Progressing on round 1 regardless of score", function () {
    const result = completeRound(tempDir, 1, 20, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-0", "Round 1 should always be E-0");
    assert.equal(parsed.escalation_label, "Progressing", "E-0 label should be Progressing");
  });

  it("returns E-0 Progressing when score improves by more than 1 point", function () {
    completeRound(tempDir, 1, 18, "FAIL");
    const result = completeRound(tempDir, 2, 24, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-0", "Improvement >1 point should be E-0");
    assert.equal(parsed.escalation_label, "Progressing");
  });

  it("returns E-I Decelerating when improvement delta shrinks between rounds", function () {
    // Round 1->2: +8, Round 2->3: +2 => delta shrinks
    completeRound(tempDir, 1, 16, "FAIL");
    completeRound(tempDir, 2, 24, "FAIL");
    const result = completeRound(tempDir, 3, 26, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-I", "Shrinking delta should be E-I");
    assert.equal(parsed.escalation_label, "Decelerating");
  });

  it("returns E-I Decelerating for a single-round score decline (not two consecutive)", function () {
    // Round 1: 24, Round 2: 20 -- single decline, no prevPrev => E-I
    completeRound(tempDir, 1, 24, "FAIL");
    const result = completeRound(tempDir, 2, 20, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-I", "Single decline should be E-I (not E-III)");
    assert.equal(parsed.escalation_label, "Decelerating");
  });

  it("returns E-II Plateau when total improves by <=1 over a 3-round window", function () {
    // Round 1: 20, Round 2: 21, Round 3: 20 => window delta = 0 => E-II
    completeRound(tempDir, 1, 20, "FAIL");
    completeRound(tempDir, 2, 21, "FAIL");
    const result = completeRound(tempDir, 3, 20, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-II", "<=1 improvement over 3 rounds should be E-II");
    assert.equal(parsed.escalation_label, "Plateau");
  });

  it("returns E-III Regression for two consecutive total-score declines", function () {
    // Round 1: 30, Round 2: 24, Round 3: 18 => two consecutive declines
    completeRound(tempDir, 1, 30, "FAIL");
    completeRound(tempDir, 2, 24, "FAIL");
    const result = completeRound(tempDir, 3, 18, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-III", "Two consecutive declines should be E-III");
    assert.equal(parsed.escalation_label, "Regression");
  });

  it("returns E-IV Catastrophic when total drops by more than 50% from previous round", function () {
    // Round 1: 28, Round 2: 12 => drop of 16 which is >50% of 28 (>14) => E-IV
    completeRound(tempDir, 1, 28, "FAIL");
    const result = completeRound(tempDir, 2, 12, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-IV", "Drop >50% should be E-IV Catastrophic");
    assert.equal(parsed.escalation_label, "Catastrophic");
  });

  it("returns E-IV Catastrophic when total is <= 5", function () {
    completeRound(tempDir, 1, 18, "FAIL");
    const result = completeRound(tempDir, 2, 4, "FAIL");

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.escalation, "E-IV", "Total <= 5 should be E-IV Catastrophic");
    assert.equal(parsed.escalation_label, "Catastrophic");
  });
});

// -------------------------------------------------------------------------
// Gap LOOP-09: get-trajectory subcommand
// -------------------------------------------------------------------------

describe("LOOP-09: get-trajectory returns formatted trajectory from state", function () {
  let tempDir;

  beforeEach(function () {
    tempDir = makeTempDir();
    initState(tempDir);
  });

  afterEach(function () {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function completeRoundForTrajectory(cwd, roundNum, scores, verdict) {
    const reportDir = join(cwd, "evaluation", "round-" + roundNum);
    mkdirSync(reportDir, { recursive: true });
    const reportPath = join(reportDir, "EVALUATION.md");
    writeFileSync(reportPath, makeEvalReport({ ...scores, verdict }), "utf8");

    return runCli(["round-complete", "--round", String(roundNum), "--report", reportPath], cwd);
  }

  it("returns empty trajectory with message when no rounds are completed", function () {
    const result = runCli(["get-trajectory"], tempDir);

    assert.equal(result.exitCode, 0, "Should exit with code 0");

    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed.trajectory), "Should have trajectory array");
    assert.equal(parsed.trajectory.length, 0, "Trajectory should be empty before any rounds");
    assert.ok(parsed.message, "Should include a message for empty trajectory");
  });

  it("returns trajectory with correct fields after one completed round", function () {
    completeRoundForTrajectory(
      tempDir,
      1,
      { productDepth: 6, functionality: 5, visualDesign: 4, codeQuality: 7 },
      "FAIL"
    );

    const result = runCli(["get-trajectory"], tempDir);

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed.trajectory), "Should have trajectory array");
    assert.equal(parsed.trajectory.length, 1, "Trajectory should have 1 entry");

    const entry = parsed.trajectory[0];
    assert.equal(entry.round, 1, "Entry should have round field");
    assert.equal(entry.total, 22, "Entry should have total score");
    assert.ok("escalation" in entry, "Entry should have escalation field");
    assert.ok("escalation_label" in entry, "Entry should have escalation_label field");
    assert.ok("verdict" in entry, "Entry should have verdict field");
  });

  it("returns latest_round, latest_escalation, and latest_escalation_label fields", function () {
    completeRoundForTrajectory(
      tempDir,
      1,
      { productDepth: 6, functionality: 5, visualDesign: 4, codeQuality: 7 },
      "FAIL"
    );
    completeRoundForTrajectory(
      tempDir,
      2,
      { productDepth: 7, functionality: 7, visualDesign: 6, codeQuality: 7 },
      "FAIL"
    );

    const result = runCli(["get-trajectory"], tempDir);

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.latest_round, 2, "latest_round should be 2 after 2 rounds");
    assert.ok("latest_escalation" in parsed, "Should have latest_escalation field");
    assert.ok("latest_escalation_label" in parsed, "Should have latest_escalation_label field");
  });

  it("returns all rounds in trajectory array with correct round numbers and totals", function () {
    completeRoundForTrajectory(
      tempDir,
      1,
      { productDepth: 5, functionality: 5, visualDesign: 5, codeQuality: 5 },
      "FAIL"
    );
    completeRoundForTrajectory(
      tempDir,
      2,
      { productDepth: 6, functionality: 6, visualDesign: 6, codeQuality: 6 },
      "FAIL"
    );
    completeRoundForTrajectory(
      tempDir,
      3,
      { productDepth: 7, functionality: 7, visualDesign: 7, codeQuality: 7 },
      "FAIL"
    );

    const result = runCli(["get-trajectory"], tempDir);

    assert.equal(result.exitCode, 0);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.trajectory.length, 3, "Trajectory should have 3 entries");
    assert.equal(parsed.trajectory[0].total, 20, "Round 1 total should be 20");
    assert.equal(parsed.trajectory[1].total, 24, "Round 2 total should be 24");
    assert.equal(parsed.trajectory[2].total, 28, "Round 3 total should be 28");
    assert.equal(parsed.latest_round, 3, "latest_round should be 3");
  });
});
