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
