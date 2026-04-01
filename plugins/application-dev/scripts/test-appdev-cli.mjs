#!/usr/bin/env node

/**
 * Tests for appdev-cli.mjs Phase 7 changes:
 * - extractScores() updated from 4 to 3 dimensions
 * - computeVerdict() new function
 * - compile-evaluation subcommand
 * - install-dep subcommand
 * - roundComplete integration with 3 dimensions
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
  utimesSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const CLI_PATH = join(import.meta.dirname, "appdev-cli.mjs");

// Helper: run CLI subcommand and capture output
function runCLI(args, options) {
  const opts = Object.assign(
    { encoding: "utf8", timeout: 15000 },
    options || {}
  );

  try {
    const stdout = execSync("node " + JSON.stringify(CLI_PATH) + " " + args, opts);

    return { stdout: stdout, stderr: "", exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      exitCode: err.status || 1,
    };
  }
}

// Helper: create a temporary directory for test fixtures
function makeTempDir(name) {
  const dir = join(import.meta.dirname, ".test-tmp-" + name + "-" + Date.now());
  mkdirSync(dir, { recursive: true });

  return dir;
}

// Helper: clean up temp directory
function cleanTempDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Helper: create a 3-dimension EVALUATION.md report
function make3DimReport(pd, fn, vd) {
  return [
    "# Evaluation Report",
    "",
    "## Verdict: PASS",
    "",
    "## Scores",
    "",
    "| Criterion | Score | Threshold | Status |",
    "|-----------|-------|-----------|--------|",
    "| Product Depth | " + pd + "/10 | 7 | " + (pd >= 7 ? "PASS" : "FAIL") + " |",
    "| Functionality | " + fn + "/10 | 7 | " + (fn >= 7 ? "PASS" : "FAIL") + " |",
    "| Visual Design | " + vd + "/10 | 6 | " + (vd >= 6 ? "PASS" : "FAIL") + " |",
    "",
  ].join("\n");
}

// Helper: create a 4-dimension report (old format)
function make4DimReport(pd, fn, vd, cq) {
  return [
    "# Evaluation Report",
    "",
    "## Verdict: PASS",
    "",
    "## Scores",
    "",
    "| Criterion | Score | Threshold | Status |",
    "|-----------|-------|-----------|--------|",
    "| Product Depth | " + pd + "/10 | 7 | PASS |",
    "| Functionality | " + fn + "/10 | 7 | PASS |",
    "| Visual Design | " + vd + "/10 | 6 | PASS |",
    "| Code Quality | " + cq + "/10 | 6 | PASS |",
    "",
  ].join("\n");
}

// Helper: create a summary.json for perceptual critic
function makePerceptualSummary(score, findings) {
  return {
    critic: "perceptual",
    dimension: "Visual Design",
    score: score,
    threshold: 6,
    pass: score >= 6,
    findings: findings || [],
    ceiling_applied: null,
    justification: "Visual Design " + score + "/10",
    off_spec_features: [],
  };
}

// Helper: create a summary.json for projection critic
function makeProjectionSummary(score, tests, findings) {
  return {
    critic: "projection",
    dimension: "Functionality",
    score: score,
    threshold: 7,
    pass: score >= 7,
    findings: findings || [],
    ceiling_applied: null,
    justification: "Functionality " + score + "/10",
    off_spec_features: [],
    acceptance_tests: tests || { total: 10, passed: 8, failed: 2, skipped: 0, results: [] },
  };
}

// =============================================================================
// extractScores -- 3-dimension update
// =============================================================================

describe("extractScores", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("extractScores");
  });

  afterEach(function () {
    cleanTempDir(tmpDir);
  });

  it("should parse 3 dimensions (PD 7, Fn 7, VD 6) and return scores with total 20", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    writeFileSync(reportPath, make3DimReport(7, 7, 6));

    const result = runCLI("extract-scores --report " + JSON.stringify(reportPath));
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.scores.product_depth, 7);
    assert.equal(parsed.scores.functionality, 7);
    assert.equal(parsed.scores.visual_design, 6);
    assert.equal(parsed.scores.total, 20);
    assert.equal(result.exitCode, 0);
  });

  it("should reject old 4-dimension report with Code Quality", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    writeFileSync(reportPath, make4DimReport(7, 7, 6, 8));

    const result = runCLI("extract-scores --report " + JSON.stringify(reportPath));
    const parsed = JSON.parse(result.stderr || result.stdout);

    assert.ok(
      parsed.error && parsed.error.includes("3 scores"),
      "Error message should mention 3 scores, got: " + JSON.stringify(parsed)
    );
  });

  it("should return error listing missing dimension when only 2 present", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    const content = [
      "## Scores",
      "| Criterion | Score |",
      "|-----------|-------|",
      "| Product Depth | 7/10 |",
      "| Functionality | 7/10 |",
    ].join("\n");
    writeFileSync(reportPath, content);

    const result = runCLI("extract-scores --report " + JSON.stringify(reportPath));
    const parsed = JSON.parse(result.stderr || result.stdout);

    assert.ok(parsed.error, "Should have error");
    assert.ok(
      parsed.error.includes("visual_design"),
      "Error should list missing dimension: visual_design, got: " + parsed.error
    );
  });

  it("should not extract verdict from report (scores only, no verdict field)", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    writeFileSync(reportPath, make3DimReport(7, 7, 6));

    const result = runCLI("extract-scores --report " + JSON.stringify(reportPath));
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.verdict, undefined, "Should not have verdict field");
    assert.ok(parsed.scores, "Should have scores field");
  });

  it("should compute total = product_depth + functionality + visual_design (max 30)", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    writeFileSync(reportPath, make3DimReport(10, 10, 10));

    const result = runCLI("extract-scores --report " + JSON.stringify(reportPath));
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.scores.total, 30, "Max total should be 30");
  });
});

// =============================================================================
// computeVerdict
// =============================================================================

describe("computeVerdict", function () {
  it("should return PASS when all scores at or above thresholds", function () {
    const result = runCLI("compute-verdict --pd 7 --fn 7 --vd 6");
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.verdict, "PASS");
  });

  it("should return FAIL when PD=6 (below 7 threshold)", function () {
    const result = runCLI("compute-verdict --pd 6 --fn 7 --vd 6");
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.verdict, "FAIL");
  });

  it("should return FAIL when Fn=6 (below 7 threshold)", function () {
    const result = runCLI("compute-verdict --pd 7 --fn 6 --vd 6");
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.verdict, "FAIL");
  });

  it("should return FAIL when VD=5 (below 6 threshold)", function () {
    const result = runCLI("compute-verdict --pd 7 --fn 7 --vd 5");
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.verdict, "FAIL");
  });

  it("should return PASS at exact threshold scores (PD=7, Fn=7, VD=6)", function () {
    const result = runCLI("compute-verdict --pd 7 --fn 7 --vd 6");
    const parsed = JSON.parse(result.stdout);

    assert.equal(parsed.verdict, "PASS");
  });
});

// =============================================================================
// compile-evaluation
// =============================================================================

describe("compile-evaluation", function () {
  let tmpDir;
  let origCwd;

  beforeEach(function () {
    tmpDir = makeTempDir("compileEval");
    origCwd = process.cwd();
  });

  afterEach(function () {
    process.chdir(origCwd);
    cleanTempDir(tmpDir);
  });

  function setupRound(roundNum, perceptualData, projectionData) {
    const roundDir = join(tmpDir, "evaluation", "round-" + roundNum);
    const perceptualDir = join(roundDir, "perceptual");
    const projectionDir = join(roundDir, "projection");

    mkdirSync(perceptualDir, { recursive: true });
    mkdirSync(projectionDir, { recursive: true });

    writeFileSync(
      join(perceptualDir, "summary.json"),
      JSON.stringify(perceptualData, null, 2)
    );
    writeFileSync(
      join(projectionDir, "summary.json"),
      JSON.stringify(projectionData, null, 2)
    );

    return roundDir;
  }

  it("should produce EVALUATION.md from perceptual and projection summary.json", function () {
    const perceptual = makePerceptualSummary(6);
    const projection = makeProjectionSummary(7, {
      total: 10,
      passed: 8,
      failed: 2,
      skipped: 0,
      results: [
        { feature: "Login", criteria: "User can log in", status: "passed", details: null },
        { feature: "Search", criteria: "User can search", status: "passed", details: null },
      ],
    });

    setupRound(1, perceptual, projection);

    const result = runCLI("compile-evaluation --round 1", { cwd: tmpDir });

    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const evalPath = join(tmpDir, "evaluation", "round-1", "EVALUATION.md");
    assert.ok(existsSync(evalPath), "EVALUATION.md should exist");

    const content = readFileSync(evalPath, "utf8");
    assert.ok(content.includes("## Scores"), "Should contain Scores section");
    assert.ok(content.includes("Visual Design"), "Should contain Visual Design");
    assert.ok(content.includes("Functionality"), "Should contain Functionality");
    assert.ok(content.includes("Product Depth"), "Should contain Product Depth");
  });

  it("should produce EVALUATION.md parseable by extractScores()", function () {
    const perceptual = makePerceptualSummary(7);
    const projection = makeProjectionSummary(8, {
      total: 10,
      passed: 9,
      failed: 1,
      skipped: 0,
      results: [
        { feature: "Login", criteria: "User can log in", status: "passed", details: null },
      ],
    });

    setupRound(2, perceptual, projection);

    const compileResult = runCLI("compile-evaluation --round 2", { cwd: tmpDir });
    assert.equal(compileResult.exitCode, 0, "compile-evaluation should succeed");

    const evalPath = join(tmpDir, "evaluation", "round-2", "EVALUATION.md");

    // Now test that extractScores can parse it
    const extractResult = runCLI("extract-scores --report " + JSON.stringify(evalPath));
    const parsed = JSON.parse(extractResult.stdout);

    assert.ok(parsed.scores, "extractScores should return scores. Got: " + extractResult.stdout);
    assert.equal(typeof parsed.scores.product_depth, "number");
    assert.equal(typeof parsed.scores.functionality, "number");
    assert.equal(typeof parsed.scores.visual_design, "number");
  });

  it("should compute Product Depth from acceptance_tests pass rate", function () {
    const projection = makeProjectionSummary(7, {
      total: 10,
      passed: 8,
      failed: 2,
      skipped: 0,
      results: [
        { feature: "A", criteria: "c1", status: "passed", details: null },
        { feature: "B", criteria: "c2", status: "passed", details: null },
        { feature: "C", criteria: "c3", status: "failed", details: "missing" },
      ],
    });
    const perceptual = makePerceptualSummary(6);

    setupRound(3, perceptual, projection);

    const result = runCLI("compile-evaluation --round 3", { cwd: tmpDir });
    assert.equal(result.exitCode, 0);

    const evalPath = join(tmpDir, "evaluation", "round-3", "EVALUATION.md");
    const content = readFileSync(evalPath, "utf8");

    assert.ok(
      content.includes("Product Depth"),
      "EVALUATION.md should contain Product Depth score"
    );

    // Verify it has a parseable Product Depth score
    const pdMatch = content.match(/\|\s*Product Depth\s*\|\s*(\d+)\/10/i);
    assert.ok(pdMatch, "Product Depth should be in scores table");
    const pdScore = parseInt(pdMatch[1], 10);
    assert.ok(pdScore >= 1 && pdScore <= 10, "PD score should be 1-10, got " + pdScore);
  });

  it("should apply Product Depth ceiling: >50% features failing -> max 5", function () {
    const projection = makeProjectionSummary(7, {
      total: 6,
      passed: 2,
      failed: 4,
      skipped: 0,
      results: [
        { feature: "A", criteria: "c1", status: "passed", details: null },
        { feature: "B", criteria: "c2", status: "failed", details: "missing" },
        { feature: "C", criteria: "c3", status: "failed", details: "missing" },
        { feature: "D", criteria: "c4", status: "failed", details: "missing" },
        { feature: "E", criteria: "c5", status: "failed", details: "missing" },
        { feature: "F", criteria: "c6", status: "passed", details: null },
      ],
    });
    const perceptual = makePerceptualSummary(6);

    setupRound(4, perceptual, projection);

    const result = runCLI("compile-evaluation --round 4", { cwd: tmpDir });
    assert.equal(result.exitCode, 0);

    const evalPath = join(tmpDir, "evaluation", "round-4", "EVALUATION.md");
    const content = readFileSync(evalPath, "utf8");

    const pdMatch = content.match(/\|\s*Product Depth\s*\|\s*(\d+)\/10/i);
    assert.ok(pdMatch, "Product Depth should be in scores table");
    const pdScore = parseInt(pdMatch[1], 10);
    assert.ok(pdScore <= 5, "PD score should be capped at 5 when >50% features fail, got " + pdScore);
  });

  it("should apply Product Depth ceiling: canned AI finding with Major severity -> max 5", function () {
    const projection = makeProjectionSummary(
      7,
      {
        total: 10,
        passed: 10,
        failed: 0,
        skipped: 0,
        results: [
          { feature: "A", criteria: "c1", status: "passed", details: null },
        ],
      },
      [
        {
          id: "FN-1",
          severity: "Major",
          title: "Canned AI placeholder content detected",
          description: "Feature uses hardcoded sample data",
          affects_dimensions: ["Functionality"],
        },
      ]
    );
    const perceptual = makePerceptualSummary(6);

    setupRound(5, perceptual, projection);

    const result = runCLI("compile-evaluation --round 5", { cwd: tmpDir });
    assert.equal(result.exitCode, 0);

    const evalPath = join(tmpDir, "evaluation", "round-5", "EVALUATION.md");
    const content = readFileSync(evalPath, "utf8");

    const pdMatch = content.match(/\|\s*Product Depth\s*\|\s*(\d+)\/10/i);
    assert.ok(pdMatch, "Product Depth should be in scores table");
    const pdScore = parseInt(pdMatch[1], 10);
    assert.ok(pdScore <= 5, "PD score should be capped at 5 with canned AI Major finding, got " + pdScore);
  });

  it("should order priority fixes by severity descending", function () {
    const perceptual = makePerceptualSummary(5, [
      {
        id: "VD-1",
        severity: "Minor",
        title: "Slight color mismatch",
        description: "Header color off by 10%",
        affects_dimensions: ["Visual Design"],
      },
      {
        id: "VD-2",
        severity: "Critical",
        title: "Missing hero image",
        description: "Hero section has no image",
        affects_dimensions: ["Visual Design"],
      },
    ]);
    const projection = makeProjectionSummary(6, {
      total: 5,
      passed: 3,
      failed: 2,
      skipped: 0,
      results: [],
    }, [
      {
        id: "FN-1",
        severity: "Major",
        title: "Login form broken",
        description: "Submit button does nothing",
        affects_dimensions: ["Functionality"],
      },
    ]);

    setupRound(6, perceptual, projection);

    const result = runCLI("compile-evaluation --round 6", { cwd: tmpDir });
    assert.equal(result.exitCode, 0);

    const evalPath = join(tmpDir, "evaluation", "round-6", "EVALUATION.md");
    const content = readFileSync(evalPath, "utf8");

    // Critical should appear before Major, Major before Minor
    const criticalIdx = content.indexOf("Critical");
    const majorIdx = content.indexOf("Major");
    const minorIdx = content.indexOf("Minor");

    assert.ok(criticalIdx >= 0, "Should contain Critical finding");
    assert.ok(majorIdx >= 0, "Should contain Major finding");
    assert.ok(minorIdx >= 0, "Should contain Minor finding");
    assert.ok(criticalIdx < majorIdx, "Critical should appear before Major");
    assert.ok(majorIdx < minorIdx, "Major should appear before Minor");
  });

  it("should auto-discover any */summary.json directories (extensibility)", function () {
    const roundDir = join(tmpDir, "evaluation", "round-7");
    const perceptualDir = join(roundDir, "perceptual");
    const projectionDir = join(roundDir, "projection");
    const spectralDir = join(roundDir, "spectral");

    mkdirSync(perceptualDir, { recursive: true });
    mkdirSync(projectionDir, { recursive: true });
    mkdirSync(spectralDir, { recursive: true });

    writeFileSync(
      join(perceptualDir, "summary.json"),
      JSON.stringify(makePerceptualSummary(7))
    );
    writeFileSync(
      join(projectionDir, "summary.json"),
      JSON.stringify(makeProjectionSummary(8, {
        total: 10,
        passed: 9,
        failed: 1,
        skipped: 0,
        results: [{ feature: "A", criteria: "c1", status: "passed", details: null }],
      }))
    );
    // Third critic (future extensibility)
    writeFileSync(
      join(spectralDir, "summary.json"),
      JSON.stringify({
        critic: "spectral",
        dimension: "Robustness",
        score: 8,
        threshold: 7,
        pass: true,
        findings: [],
        ceiling_applied: null,
        justification: "Robustness 8/10",
        off_spec_features: [],
      })
    );

    const result = runCLI("compile-evaluation --round 7", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed with 3 critics. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.compiled, true, "Should report compiled: true");
  });

  it("should exit with error when round directory does not exist", function () {
    const result = runCLI("compile-evaluation --round 99", { cwd: tmpDir });

    assert.notEqual(result.exitCode, 0, "Should fail");

    const parsed = JSON.parse(result.stderr || result.stdout);
    assert.ok(parsed.error, "Should have error message");
  });

  it("should exit with error when no summary.json files found", function () {
    const roundDir = join(tmpDir, "evaluation", "round-8");
    mkdirSync(roundDir, { recursive: true });
    // Empty round directory -- no summary.json files

    const result = runCLI("compile-evaluation --round 8", { cwd: tmpDir });

    assert.notEqual(result.exitCode, 0, "Should fail");

    const parsed = JSON.parse(result.stderr || result.stdout);
    assert.ok(parsed.error, "Should have error message");
  });
});

// =============================================================================
// install-dep
// =============================================================================

describe("install-dep", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("installDep");
    // Create a minimal package.json so npm install works
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ name: "test-install-dep", version: "1.0.0" }, null, 2)
    );
  });

  afterEach(function () {
    cleanTempDir(tmpDir);
  });

  it("should create lock directory before running npm install", function () {
    const lockDir = join(tmpDir, ".appdev-install-lock");

    // Use a dry-run approach: install a tiny package
    const result = runCLI("install-dep --package is-odd --cwd " + JSON.stringify(tmpDir));

    // Lock should be released after completion
    assert.ok(!existsSync(lockDir), "Lock directory should be removed after install");
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);
  });

  it("should remove lock directory after successful install", function () {
    const lockDir = join(tmpDir, ".appdev-install-lock");

    const result = runCLI("install-dep --package is-odd --cwd " + JSON.stringify(tmpDir));

    assert.equal(result.exitCode, 0);
    assert.ok(!existsSync(lockDir), "Lock directory should be cleaned up");
  });

  it("should remove lock directory even if npm install fails", function () {
    const lockDir = join(tmpDir, ".appdev-install-lock");

    // Install a non-existent package to force npm error
    const result = runCLI(
      "install-dep --package this-package-definitely-does-not-exist-xyz123 --cwd " +
        JSON.stringify(tmpDir)
    );

    assert.ok(!existsSync(lockDir), "Lock directory should be cleaned up even on failure");
  });

  it("should wait and retry when lock directory already exists", function () {
    const lockDir = join(tmpDir, ".appdev-install-lock");

    // Create lock directory that will be "stale" (we make it immediately stale)
    mkdirSync(lockDir, { recursive: true });

    // Since the lock is fresh (mtime is now), install-dep should wait.
    // But we need it to not timeout -- we will set mtime to old to trigger stale detection.
    // Force stale by using a really old mtime
    const oldTime = new Date(Date.now() - 120000); // 120 seconds ago

    // Touch the directory mtime to make it stale
    utimesSync(lockDir, oldTime, oldTime);

    const result = runCLI("install-dep --package is-odd --cwd " + JSON.stringify(tmpDir));

    // Should succeed because it cleared the stale lock
    assert.equal(result.exitCode, 0, "Should succeed after clearing stale lock");
    assert.ok(!existsSync(lockDir), "Lock should be cleaned up");
  });

  it("should clear stale lock (mtime > 60s) and retry", function () {
    const lockDir = join(tmpDir, ".appdev-install-lock");
    mkdirSync(lockDir, { recursive: true });

    // Make the lock directory stale (mtime > 60s ago)
    const oldTime = new Date(Date.now() - 90000); // 90 seconds ago

    utimesSync(lockDir, oldTime, oldTime);

    const result = runCLI("install-dep --package is-odd --cwd " + JSON.stringify(tmpDir));

    assert.equal(result.exitCode, 0, "Should succeed after clearing stale lock");
  });
});

// =============================================================================
// roundComplete integration
// =============================================================================

describe("roundComplete integration with 3 dimensions", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("roundComplete");
    // Initialize state file
    const stateFile = join(tmpDir, ".appdev-state.json");
    writeFileSync(
      stateFile,
      JSON.stringify({
        prompt: "Test app",
        step: "evaluate",
        round: 0,
        status: "in_progress",
        exit_condition: null,
        rounds: [],
      })
    );
  });

  afterEach(function () {
    cleanTempDir(tmpDir);
  });

  it("should use computeVerdict() instead of extracting verdict from report", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    // Create a 3-dim report WITHOUT a verdict heading
    const content = [
      "# Evaluation Report",
      "",
      "## Scores",
      "",
      "| Criterion | Score | Threshold | Status |",
      "|-----------|-------|-----------|--------|",
      "| Product Depth | 7/10 | 7 | PASS |",
      "| Functionality | 7/10 | 7 | PASS |",
      "| Visual Design | 6/10 | 6 | PASS |",
      "",
    ].join("\n");
    writeFileSync(reportPath, content);

    const result = runCLI(
      "round-complete --round 1 --report " + JSON.stringify(reportPath),
      { cwd: tmpDir }
    );

    assert.equal(result.exitCode, 0, "Should succeed without verdict heading. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.verdict, "PASS", "Should compute PASS from scores");
  });

  it("should work with 3-dimension reports (max total 30)", function () {
    const reportPath = join(tmpDir, "EVALUATION.md");
    writeFileSync(reportPath, make3DimReport(8, 9, 7));

    const result = runCLI(
      "round-complete --round 1 --report " + JSON.stringify(reportPath),
      { cwd: tmpDir }
    );

    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.scores.total, 24, "Total should be 8+9+7=24 (max 30)");
    assert.equal(parsed.scores.product_depth, 8);
    assert.equal(parsed.scores.functionality, 9);
    assert.equal(parsed.scores.visual_design, 7);
    assert.equal(parsed.scores.code_quality, undefined, "Should not have code_quality");
  });
});

// =============================================================================
// resume-check subcommand
// =============================================================================

describe("resume-check", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("resumeCheck");
  });

  afterEach(function () {
    cleanTempDir(tmpDir);
  });

  function writeState(state) {
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify(state, null, 2)
    );
  }

  it("should return next_action=plan when step is plan and SPEC.md missing", function () {
    writeState({ prompt: "Test", step: "plan", round: 0, status: "in_progress", exit_condition: null, rounds: [] });

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "plan");
  });

  it("should return next_action=generate when step is plan and SPEC.md exists with ## Features", function () {
    writeState({ prompt: "Test", step: "plan", round: 0, status: "in_progress", exit_condition: null, rounds: [] });
    writeFileSync(join(tmpDir, "SPEC.md"), "# Spec\n\n## Features\n\n- Feature 1\n");

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "generate");
  });

  it("should return next_action=generate when step is generate and build output missing", function () {
    writeState({ prompt: "Test", step: "generate", round: 1, status: "in_progress", exit_condition: null, rounds: [] });

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "generate");
  });

  it("should return next_action=evaluate when step is generate and build output exists", function () {
    writeState({ prompt: "Test", step: "generate", round: 1, status: "in_progress", exit_condition: null, rounds: [], build_dir: "dist" });
    mkdirSync(join(tmpDir, "dist"), { recursive: true });

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "evaluate");
  });

  it("should return next_action=spawn-both-critics when step is evaluate and no valid summaries", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });
    // No evaluation directory at all

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-both-critics");
  });

  it("should return spawn-perceptual-critic when projection valid but perceptual missing", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const projDir = join(roundDir, "projection");
    mkdirSync(projDir, { recursive: true });
    writeFileSync(join(projDir, "summary.json"), JSON.stringify({
      critic: "projection", dimension: "Functionality", score: 7,
    }));

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-perceptual-critic");
  });

  it("should return spawn-projection-critic when perceptual valid but projection missing", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const percDir = join(roundDir, "perceptual");
    mkdirSync(percDir, { recursive: true });
    writeFileSync(join(percDir, "summary.json"), JSON.stringify({
      critic: "perceptual", dimension: "Visual Design", score: 6,
    }));

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-projection-critic");
  });

  it("should return compile-evaluation when both summaries valid but EVALUATION.md missing", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const percDir = join(roundDir, "perceptual");
    const projDir = join(roundDir, "projection");
    mkdirSync(percDir, { recursive: true });
    mkdirSync(projDir, { recursive: true });
    writeFileSync(join(percDir, "summary.json"), JSON.stringify({
      critic: "perceptual", dimension: "Visual Design", score: 6,
    }));
    writeFileSync(join(projDir, "summary.json"), JSON.stringify({
      critic: "projection", dimension: "Functionality", score: 7,
    }));

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "compile-evaluation");
  });

  it("should return round-complete when EVALUATION.md valid but git tag missing", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const percDir = join(roundDir, "perceptual");
    const projDir = join(roundDir, "projection");
    mkdirSync(percDir, { recursive: true });
    mkdirSync(projDir, { recursive: true });
    writeFileSync(join(percDir, "summary.json"), JSON.stringify({
      critic: "perceptual", dimension: "Visual Design", score: 6,
    }));
    writeFileSync(join(projDir, "summary.json"), JSON.stringify({
      critic: "projection", dimension: "Functionality", score: 7,
    }));
    writeFileSync(join(roundDir, "EVALUATION.md"), "# Eval\n\n## Scores\n\n| Criterion | Score |\n");

    // Initialize a git repo in tmpDir so git tag -l works
    execSync("git init", { cwd: tmpDir, stdio: "pipe" });

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "round-complete");
  });

  it("should return generate with round+1 when current round fully complete", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const percDir = join(roundDir, "perceptual");
    const projDir = join(roundDir, "projection");
    mkdirSync(percDir, { recursive: true });
    mkdirSync(projDir, { recursive: true });
    writeFileSync(join(percDir, "summary.json"), JSON.stringify({
      critic: "perceptual", dimension: "Visual Design", score: 6,
    }));
    writeFileSync(join(projDir, "summary.json"), JSON.stringify({
      critic: "projection", dimension: "Functionality", score: 7,
    }));
    writeFileSync(join(roundDir, "EVALUATION.md"), "# Eval\n\n## Scores\n\n| Criterion | Score |\n");

    // Initialize git repo, create initial commit, then tag
    execSync("git init", { cwd: tmpDir, stdio: "pipe" });
    execSync("git add .", { cwd: tmpDir, stdio: "pipe" });
    execSync("git commit -m init --allow-empty", { cwd: tmpDir, stdio: "pipe" });
    execSync("git tag appdev/round-1", { cwd: tmpDir, stdio: "pipe" });

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "generate");
    assert.equal(parsed.round, 2, "Should advance to round 2");
  });

  it("should read expected critics from state.critics (not hardcoded)", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["alpha", "beta"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const alphaDir = join(roundDir, "alpha");
    mkdirSync(alphaDir, { recursive: true });
    writeFileSync(join(alphaDir, "summary.json"), JSON.stringify({
      critic: "alpha", dimension: "Quality", score: 8,
    }));

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-beta-critic", "Should use critic name from state.critics");
  });

  it("should clean up corrupt critic directory when summary.json is invalid JSON", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const percDir = join(roundDir, "perceptual");
    const projDir = join(roundDir, "projection");
    mkdirSync(percDir, { recursive: true });
    mkdirSync(projDir, { recursive: true });

    // Write valid projection summary
    writeFileSync(join(projDir, "summary.json"), JSON.stringify({
      critic: "projection", dimension: "Functionality", score: 7,
    }));

    // Write corrupt perceptual summary (truncated JSON)
    writeFileSync(join(percDir, "summary.json"), '{"critic": "perceptual", "dimens');

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-perceptual-critic");
    assert.ok(!existsSync(percDir), "Corrupt perceptual directory should be deleted");
  });

  it("should clean up critic directory when summary.json is missing required fields", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [], critics: ["perceptual", "projection"] });

    const roundDir = join(tmpDir, "evaluation", "round-1");
    const percDir = join(roundDir, "perceptual");
    const projDir = join(roundDir, "projection");
    mkdirSync(percDir, { recursive: true });
    mkdirSync(projDir, { recursive: true });

    // Write valid projection summary
    writeFileSync(join(projDir, "summary.json"), JSON.stringify({
      critic: "projection", dimension: "Functionality", score: 7,
    }));

    // Write perceptual summary missing required 'score' field
    writeFileSync(join(percDir, "summary.json"), JSON.stringify({
      critic: "perceptual", dimension: "Visual Design",
    }));

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-perceptual-critic");
    assert.ok(!existsSync(percDir), "Perceptual directory with missing fields should be deleted");
  });

  it("should return next_action=summary when step is summary", function () {
    writeState({ prompt: "Test", step: "summary", round: 3, status: "in_progress", exit_condition: null, rounds: [] });

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "summary");
  });

  it("should default critics to [perceptual, projection] when state.critics is unset", function () {
    writeState({ prompt: "Test", step: "evaluate", round: 1, status: "in_progress", exit_condition: null, rounds: [] });
    // No critics field in state

    const result = runCLI("resume-check", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.next_action, "spawn-both-critics", "Should default to both critics");
  });
});

// =============================================================================
// update extensions (--build-dir, --spa, --critics)
// =============================================================================

describe("update extensions", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("updateExt");
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify({
        prompt: "Test",
        step: "generate",
        round: 1,
        status: "in_progress",
        exit_condition: null,
        rounds: [],
      })
    );
  });

  afterEach(function () {
    cleanTempDir(tmpDir);
  });

  it("should set state.build_dir when --build-dir is provided", function () {
    const result = runCLI("update --step generate --build-dir dist", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.build_dir, "dist");
  });

  it("should set state.spa to true when --spa true is provided", function () {
    const result = runCLI("update --step generate --spa true", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.spa, true);
  });

  it("should set state.spa to false when --spa false is provided", function () {
    const result = runCLI("update --step generate --spa false", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.spa, false);
  });

  it("should set state.critics as comma-split array when --critics is provided", function () {
    const result = runCLI("update --step evaluate --critics perceptual,projection", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.deepEqual(parsed.critics, ["perceptual", "projection"]);
  });

  it("should allow update without --step when --build-dir is provided", function () {
    const result = runCLI("update --build-dir dist", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed without --step. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.build_dir, "dist");
    assert.equal(parsed.step, "generate", "Step should remain unchanged");
  });

  it("should allow update without --step when --spa is provided", function () {
    const result = runCLI("update --spa true", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed without --step. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.spa, true);
  });

  it("should allow update without --step when --critics is provided", function () {
    const result = runCLI("update --critics perceptual,projection", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed without --step. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.deepEqual(parsed.critics, ["perceptual", "projection"]);
  });
});

// =============================================================================
// delete/complete server cleanup
// =============================================================================

describe("delete/complete server cleanup", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("serverCleanup");
  });

  afterEach(function () {
    cleanTempDir(tmpDir);
  });

  it("should clear servers array when completing", function () {
    // Write state with servers array (PIDs will be dead, that is fine)
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify({
        prompt: "Test",
        step: "summary",
        round: 3,
        status: "in_progress",
        exit_condition: null,
        rounds: [],
        servers: [{ dir: "dist", pid: 99999, port: 5173, spa: true }],
      })
    );

    const result = runCLI("complete --exit-condition PASS", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.deepEqual(parsed.servers, [], "Servers should be cleared after complete");
  });

  it("should attempt to stop servers before deleting state", function () {
    // Write state with servers array
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify({
        prompt: "Test",
        step: "evaluate",
        round: 1,
        status: "in_progress",
        exit_condition: null,
        rounds: [],
        servers: [{ dir: "dist", pid: 99999, port: 5173, spa: true }],
      })
    );

    const result = runCLI("delete", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.deleted, true);
    // State file should be gone
    assert.ok(!existsSync(join(tmpDir, ".appdev-state.json")), "State file should be deleted");
  });
});

// =============================================================================
// static-serve subcommand
// =============================================================================

describe("static-serve", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = makeTempDir("staticServe");
    // Create state file
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify({
        prompt: "Test",
        step: "evaluate",
        round: 1,
        status: "in_progress",
        exit_condition: null,
        rounds: [],
        servers: [],
      })
    );
    // Create a dist directory with a minimal index.html
    mkdirSync(join(tmpDir, "dist"), { recursive: true });
    writeFileSync(join(tmpDir, "dist", "index.html"), "<html><body>Hello</body></html>");
  });

  afterEach(function () {
    // Stop any servers that were started
    try {
      runCLI("static-serve --stop", { cwd: tmpDir });
    } catch (e) {
      // Ignore
    }

    cleanTempDir(tmpDir);
  });

  it("should return error when --dir is not provided and not stopping", function () {
    const result = runCLI("static-serve", { cwd: tmpDir });

    assert.notEqual(result.exitCode, 0, "Should fail without --dir");

    const parsed = JSON.parse(result.stderr || result.stdout);
    assert.ok(parsed.error, "Should have error message");
  });

  it("should stop all servers and clear state.servers when --stop is provided", function () {
    // Write state with a fake server entry (dead PID is fine)
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify({
        prompt: "Test",
        step: "evaluate",
        round: 1,
        status: "in_progress",
        exit_condition: null,
        rounds: [],
        servers: [{ dir: "dist", pid: 99999, port: 5173, spa: false }],
      })
    );

    const result = runCLI("static-serve --stop", { cwd: tmpDir });
    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.deepEqual(parsed.servers, [], "Servers array should be empty after stop");
    assert.equal(parsed.stopped, true, "Should report stopped: true");
  });

  it("should return error when --dir points to non-existent directory", function () {
    const result = runCLI("static-serve --dir nonexistent", { cwd: tmpDir });

    assert.notEqual(result.exitCode, 0, "Should fail for non-existent dir");

    const parsed = JSON.parse(result.stderr || result.stdout);
    assert.ok(parsed.error, "Should have error message");
  });

  it("should recognize the static-serve subcommand (not unknown)", function () {
    // Even if it fails for other reasons, it should not say 'Unknown subcommand'
    const result = runCLI("static-serve --stop", { cwd: tmpDir });
    const allOutput = (result.stdout || "") + (result.stderr || "");
    assert.ok(!allOutput.includes("Unknown subcommand"), "Should recognize static-serve subcommand");
  });

  it("should record server entry in state.servers[] when server starts successfully", function () {
    // Arrange: beforeEach provides state with servers=[] and dist/index.html
    // Act: start server against the dist directory
    // The health check polls up to 5s; use a longer timeout to accommodate
    const result = runCLI("static-serve --dir dist", { cwd: tmpDir, timeout: 20000 });

    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.started, true, "Should report started: true");
    assert.ok(parsed.server, "Should return a server entry");
    assert.equal(parsed.server.dir, "dist", "Server entry should record the dir");
    assert.equal(typeof parsed.server.pid, "number", "Server entry should record a numeric pid");
    assert.equal(typeof parsed.server.port, "number", "Server entry should record a numeric port");
    assert.equal(parsed.server.spa, false, "Server entry should record spa: false by default");

    // Verify state file was updated
    const stateAfter = JSON.parse(readFileSync(join(tmpDir, ".appdev-state.json"), "utf8"));
    assert.equal(stateAfter.servers.length, 1, "State should have one server entry");
    assert.equal(stateAfter.servers[0].dir, "dist", "State server entry should record the dir");
  });

  it("should return existing server entry without spawning a new process when server is already running for that dir", function () {
    // Arrange: write state with an existing server entry using the test runner's own PID
    // (which is guaranteed to be alive while this test runs)
    const alivePid = process.pid;
    const stateWithServer = {
      prompt: "Test",
      step: "evaluate",
      round: 1,
      status: "in_progress",
      exit_condition: null,
      rounds: [],
      servers: [{ dir: "dist", pid: alivePid, port: 5173, spa: false }],
    };

    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify(stateWithServer)
    );

    // Act: call static-serve for the same dir -- should detect alive PID and reuse
    const result = runCLI("static-serve --dir dist", { cwd: tmpDir, timeout: 10000 });

    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.reused, true, "Should report reused: true for idempotent call");
    assert.ok(parsed.server, "Should return the existing server entry");
    assert.equal(parsed.server.pid, alivePid, "Should return the original PID, not a new one");
    assert.equal(parsed.server.dir, "dist", "Should return the original dir");

    // Clear servers array so afterEach --stop does not attempt to kill the test runner process
    writeFileSync(
      join(tmpDir, ".appdev-state.json"),
      JSON.stringify({ ...stateWithServer, servers: [] })
    );
  });

  it("should set spa: true in state.servers[] entry when --spa true flag is provided", function () {
    // Arrange: beforeEach provides state with servers=[] and dist/index.html
    // Act: start server with SPA mode enabled
    const result = runCLI("static-serve --dir dist --spa true", { cwd: tmpDir, timeout: 20000 });

    assert.equal(result.exitCode, 0, "Should succeed. stderr: " + result.stderr);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.started, true, "Should report started: true");
    assert.ok(parsed.server, "Should return a server entry");
    assert.equal(parsed.server.spa, true, "Server entry should record spa: true when --spa true passed");

    // Verify state file reflects spa: true
    const stateAfter = JSON.parse(readFileSync(join(tmpDir, ".appdev-state.json"), "utf8"));
    assert.equal(stateAfter.servers.length, 1, "State should have one server entry");
    assert.equal(stateAfter.servers[0].spa, true, "State server entry should record spa: true");
  });
});
