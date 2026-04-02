# Phase 7: Ensemble Discriminator Architecture - Research

**Researched:** 2026-03-31
**Domain:** GAN ensemble discriminator architecture -- replacing monolithic evaluator with parallel WGAN critics + deterministic CLI aggregator
**Confidence:** HIGH

## Summary

Phase 7 replaces the monolithic Evaluator agent (392 lines, 15 steps, crashes at ~200
tool calls / ~400K tokens) with a GAN ensemble of 2 specialized WGAN critics
(`perceptual-critic` and `projection-critic`) plus a deterministic CLI ensemble
aggregator (`compile-evaluation`). Each critic operates in its own isolated context
(~60K tokens max), scoring one dimension. The CLI computes Product Depth from
acceptance test results, applies ceiling rules, and writes EVALUATION.md. No single
agent exceeds safe context limits.

The architecture follows three GAN taxonomy patterns: GMAN (12.1) for the ensemble
aggregator pattern (individual discriminator signals aggregated before feedback to
generator), ProjectedGAN (7.1) for uniform interface between each discriminator and
the aggregator (summary.json contract), and the naming convention maps agents to their
primary discriminator technique from the taxonomy (Perceptual 7.3, Projection 3.3).

The critical integration complexity lies in the atomicity of the scoring dimension
change: the regex contract between EVALUATION-TEMPLATE.md and appdev-cli.mjs must be
updated simultaneously with the Code Quality retirement, the new 3-dimension scoring
model, the CLI `compile-evaluation` subcommand, and the orchestrator evaluation phase
flow. The `install-dep` mutex is a contained problem solvable with zero dependencies
via `fs.mkdirSync` atomic directory creation.

**Primary recommendation:** Build bottom-up: summary.json schema and CLI subcommands
first (testable in isolation), then critic agent definitions (consume the schema),
then orchestrator integration (consumes the new evaluation phase flow).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Naming convention:** Technique-based from GAN taxonomy. `perceptual-critic` (Section 7.3: Perceptual + Multi-Scale + Style) scores Visual Design. `projection-critic` (Section 3.3: Projection + ProjectedGAN 7.1) scores Functionality. Directory names match GAN technique names. Future agents follow the same convention (spectral-critic v1.2, semantic-critic v2.0).
- **Critic count:** Exactly 2 critic agents for Phase 7, plus CLI `compile-evaluation`.
- **Evaluator capability decomposition:** Monolithic evaluator's 15 steps decompose across the ensemble per the mapping in CONTEXT.md. No dedicated steps survive -- capabilities emerge from each actor's methodology.
- **New skill: playwright-api-testing** -- projection-critic uses both `playwright-testing` (browser-based) and `playwright-api-testing` (browserless APIRequestContext) skills. Scope may straddle Phase 7 and Phase 8.
- **Code Quality dimension: retired entirely.** 3 dimensions: Product Depth (7), Functionality (7), Visual Design (6). No redistribution of ceiling rules. GAN information barrier rationale.
- **Generator feedback format: unified EVALUATION.md.** CLI `compile-evaluation` produces a single EVALUATION.md. Generator never sees summary.json. Ensemble is invisible to Generator.
- **summary.json contract: fixed outer schema, flexible inner content.** Universal fields + projection-critic extension for acceptance_tests. `compile-evaluation` globs `evaluation/round-N/*/summary.json`. Directory names = GAN technique names.

### Claude's Discretion

- Exact summary.json field names and JSON structure (schema in CONTEXT.md is guidance, not specification)
- perceptual-critic and projection-critic agent definition structure and line count (target: <150 lines each)
- `compile-evaluation` Product Depth scoring formula (must be deterministic from acceptance test pass/fail)
- `install-dep` mutex implementation details (file-based, ENSEMBLE-04)
- EVALUATION-TEMPLATE.md redesign for CLI-compiled output
- SCORING-CALIBRATION.md updates for 3 dimensions
- Priority Fixes ordering algorithm details

### Deferred Ideas (OUT OF SCOPE)

- Generator internal CI extension for code quality coverage -- future phases/milestones
- AI probing as standalone critic (`infogan-critic`) -- v2.0+ consideration
- Hybrid API+browser cross-validation patterns -- deferred to Phase 8 Playwright patterns

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENSEMBLE-01 | New `perceptual-critic` agent -- scores Visual Design | Agent definition patterns, eval-first methodology, reference file decomposition from ASSET-VALIDATION-PROTOCOL.md + AI-SLOP-CHECKLIST.md |
| ENSEMBLE-02 | New `projection-critic` agent -- scores Functionality | Agent definition patterns, write-and-run methodology, playwright-testing skill integration, AI-PROBING-REFERENCE.md |
| ENSEMBLE-03 | `appdev-cli compile-evaluation` subcommand | CLI architecture patterns, zero-dependency constraint, score computation formula, EVALUATION-TEMPLATE.md redesign |
| ENSEMBLE-04 | `appdev-cli install-dep` subcommand with file-based mutex | `fs.mkdirSync` atomic lock pattern, stale lock detection, zero-dependency implementation |
| ENSEMBLE-05 | Remove monolithic `evaluator.md` | Not a delete -- replaced by perceptual-critic + projection-critic. Original evaluator.md preserved in git history |
| ENSEMBLE-06 | 3 scoring dimensions | extractScores() regex update, total computation change (max 30), threshold table |
| ENSEMBLE-07 | EVALUATION-TEMPLATE.md redesigned as CLI-compiled output | New template with provenance sections, regex-sensitive patterns for 3 dimensions |
| ENSEMBLE-08 | SCORING-CALIBRATION.md updated for 3 dimensions | Remove Code Quality ceiling rules + calibration scenarios, keep Product Depth/Functionality/Visual Design |
| ENSEMBLE-09 | summary.json schema as extensible contract | JSON schema design, glob-based discovery, directory naming convention |
| ENSEMBLE-10 | Orchestrator evaluation phase: parallel critic spawns | SKILL.md workflow rewrite for evaluation phase, binary checks, CLI compile step |
| BARRIER-01 | Neither critic reads application source code | Tool allowlists (no Read for .js/.ts/.css/.html), prompt guards in agent definitions |
| BARRIER-02 | Findings describe behavioral symptoms, not code diagnoses | Agent instruction patterns, finding template structure |
| BARRIER-03 | Critics do not modify application source | Tool allowlists restrict Write to evaluation/ directory only |
| BARRIER-04 | Generator's dev tests and critic's acceptance tests are independent | Separate test directories (tests/ vs evaluation/round-N/), separate purposes |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs | Node.js built-in | File I/O for CLI, summary.json, mutex | Zero-dependency CLI pattern (established) |
| node:path | Node.js built-in | Path manipulation | Zero-dependency CLI pattern (established) |
| node:child_process | Node.js built-in | Not used -- CLI is sync | Avoided per established pattern |
| @playwright/cli | devDependency | Browser interaction for both critics | Already installed in workspace setup |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | devDependency | Image analysis (perceptual-critic asset validation) | Installed by perceptual-critic at evaluation start |
| imghash | devDependency | Perceptual hash for duplicate detection | Installed by perceptual-critic at evaluation start |
| leven | devDependency | Hash distance comparison | Installed by perceptual-critic at evaluation start |
| ajv | devDependency | JSON schema validation (projection-critic API testing) | Installed by projection-critic if app has API endpoints |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fs.mkdirSync` mutex | `proper-lockfile` npm package | Adds a dependency -- violates zero-dependency CLI constraint |
| Manual JSON assembly in CLI | `handlebars` template engine | Adds dependency; EVALUATION.md structure is simple enough for string concatenation |
| JSON Schema for summary.json | TypeScript interfaces | CLI is plain .mjs -- no TypeScript build step. JSON Schema validated at read time |

**Installation:**
```bash
# No new packages for CLI -- zero-dependency
# Critics install their tooling via appdev-cli install-dep:
node appdev-cli.mjs install-dep --dev sharp imghash leven
node appdev-cli.mjs install-dep --dev ajv
```

## Architecture Patterns

### Recommended Project Structure (within plugin)

```
plugins/application-dev/
|-- agents/
|   |-- perceptual-critic.md    # Visual Design critic (<150 lines)
|   |-- projection-critic.md    # Functionality critic (<150 lines)
|   |-- evaluator.md            # REMOVED (ENSEMBLE-05)
|   |-- generator.md            # Unchanged
|   '-- planner.md              # Unchanged
|-- scripts/
|   '-- appdev-cli.mjs          # +2 subcommands: compile-evaluation, install-dep
|-- skills/
|   '-- application-dev/
|       |-- SKILL.md            # Updated evaluation phase flow
|       '-- references/
|           |-- evaluator/
|           |   |-- EVALUATION-TEMPLATE.md    # Redesigned for CLI compilation
|           |   |-- SCORING-CALIBRATION.md    # Updated for 3 dimensions
|           |   |-- AI-SLOP-CHECKLIST.md      # Unchanged (perceptual-critic ref)
|           |   |-- AI-PROBING-REFERENCE.md   # Unchanged (projection-critic ref)
|           |   '-- ASSET-VALIDATION-PROTOCOL.md  # Decomposed reference
|           '-- SPEC-TEMPLATE.md             # Unchanged in Phase 7
```

### Runtime directory structure (per evaluation round)

```
evaluation/round-N/
|-- perceptual/
|   |-- summary.json            # perceptual-critic writes
|   '-- screenshots/            # perceptual-critic screenshots
|-- projection/
|   |-- summary.json            # projection-critic writes
|   '-- acceptance-tests.spec.ts  # projection-critic writes (Phase 8)
'-- EVALUATION.md               # CLI compiles from both summaries
```

### Pattern 1: summary.json Contract (ProjectedGAN 7.1)

**What:** Uniform interface between each discriminator and the CLI aggregator.
**When to use:** Every critic writes the same outer schema. CLI reads via glob.

```javascript
// Universal schema (every critic writes these fields)
{
  "critic": "perceptual",           // GAN technique name
  "dimension": "Visual Design",     // Scoring dimension
  "score": 6,                       // 1-10 continuous WGAN score
  "threshold": 6,                   // Pass threshold
  "pass": true,                     // score >= threshold
  "findings": [
    {
      "id": "VD-1",
      "severity": "Major",
      "title": "Generic card grid layout",
      "description": "Dashboard uses default Tailwind 3-column card grid with no custom styling -- spec called for brutalist aesthetic",
      "affects_dimensions": ["Visual Design"]
    }
  ],
  "ceiling_applied": null,          // Which ceiling rule capped the score
  "justification": "Score 6: meets threshold. Design direction matches spec (VD-1 is only Major finding).",
  "off_spec_features": []
}

// Projection-critic extension (for Product Depth computation)
{
  // ... universal fields ...
  "acceptance_tests": {
    "total": 12,
    "passed": 9,
    "failed": 2,
    "skipped": 1,
    "results": [
      {
        "feature": "Task creation",
        "criteria": "User can create a task with title and due date",
        "status": "passed",
        "details": null
      },
      {
        "feature": "Task filtering",
        "criteria": "Filters combine status and category",
        "status": "failed",
        "details": "Category filter not present in UI"
      }
    ]
  }
}
```

**Source:** CONTEXT.md locked decision on summary.json schema.

### Pattern 2: CLI compile-evaluation (GMAN 12.1 Ensemble Aggregator)

**What:** Deterministic aggregation of per-critic summaries into unified EVALUATION.md.
**When to use:** After both critics complete their evaluation.

```javascript
// compile-evaluation pseudocode
function cmdCompileEvaluation(argv) {
  const args = parseArgs(argv);
  const round = parseInt(args.round, 10);
  const roundDir = join(process.cwd(), "evaluation", "round-" + round);

  // 1. Glob all */summary.json (extensible -- works for N critics)
  const summaryDirs = readdirSync(roundDir).filter(d =>
    existsSync(join(roundDir, d, "summary.json"))
  );

  // 2. Read and validate each summary
  const summaries = summaryDirs.map(dir => {
    const raw = readFileSync(join(roundDir, dir, "summary.json"), "utf8");
    return JSON.parse(raw);
  });

  // 3. Compute Product Depth from acceptance_tests
  const projectionSummary = summaries.find(s => s.acceptance_tests);
  const productDepth = computeProductDepth(projectionSummary);

  // 4. Compute verdict mechanically
  const allScores = {
    product_depth: productDepth.score,
    functionality: summaries.find(s => s.dimension === "Functionality").score,
    visual_design: summaries.find(s => s.dimension === "Visual Design").score,
  };
  const verdict = computeVerdict(allScores);

  // 5. Assemble Priority Fixes (merged, severity-ordered)
  const fixes = assemblePriorityFixes(summaries);

  // 6. Write EVALUATION.md from template
  const md = compileTemplate(verdict, allScores, summaries, productDepth, fixes);
  writeFileSync(join(roundDir, "EVALUATION.md"), md);

  output({ round, verdict, scores: allScores, compiled: true });
}
```

### Pattern 3: File-Based Mutex for install-dep (ENSEMBLE-04)

**What:** Cross-process mutex using atomic `fs.mkdirSync` for concurrent npm installs.
**When to use:** Both critics call `install-dep` simultaneously for evaluation tooling.

```javascript
// install-dep mutex pattern
const LOCK_DIR = join(process.cwd(), ".appdev-install-lock");
const STALE_MS = 60000; // 60 seconds (npm install can be slow)
const POLL_MS = 500;
const MAX_WAIT_MS = 120000; // 2 minutes

function acquireLock() {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      mkdirSync(LOCK_DIR);

      return true; // Lock acquired
    } catch (err) {
      if (err.code === "EEXIST") {
        // Check for stale lock
        try {
          const stat = statSync(LOCK_DIR);

          if (Date.now() - stat.mtimeMs > STALE_MS) {
            rmdirSync(LOCK_DIR);

            continue; // Retry after clearing stale lock
          }
        } catch (e) {
          continue; // Lock was removed between checks
        }

        // Wait and retry
        const waitUntil = Date.now() + POLL_MS;

        while (Date.now() < waitUntil) {
          // Busy wait (synchronous CLI)
        }

        continue;
      }

      throw err;
    }
  }

  fail("Timed out waiting for install lock after " + MAX_WAIT_MS + "ms");
}

function releaseLock() {
  try {
    rmdirSync(LOCK_DIR);
  } catch (e) {
    // Already released
  }
}

function cmdInstallDep(argv) {
  const args = parseArgs(argv);
  const packages = args._.join(" "); // remaining positional args

  acquireLock();

  try {
    execSync("npm install --save-dev " + packages, {
      stdio: "pipe",
      timeout: 120000,
    });
    output({ installed: packages, success: true });
  } finally {
    releaseLock();
  }
}
```

**Note:** This requires adding `node:child_process` (for `execSync`) to appdev-cli.mjs.
The zero-dependency constraint applies to npm packages, not Node.js built-in modules.

### Pattern 4: Product Depth Scoring Formula

**What:** Deterministic computation from acceptance test pass/fail results.
**When to use:** CLI `compile-evaluation` computes Product Depth score.

```javascript
function computeProductDepth(projectionSummary) {
  if (!projectionSummary || !projectionSummary.acceptance_tests) {
    return { score: 1, justification: "No acceptance test data available" };
  }

  const tests = projectionSummary.acceptance_tests;
  const passRate = tests.total > 0 ? tests.passed / tests.total : 0;

  // Map pass rate to 1-10 scale
  // 0% = 1, 30% = 3, 50% = 5, 70% = 7 (threshold), 90% = 9, 100% = 10
  let score = Math.round(passRate * 9) + 1;

  if (score > 10) {
    score = 10;
  }

  // Apply ceiling rules
  const failedFeatures = tests.results.filter(r => r.status === "failed");
  const totalFeatures = new Set(tests.results.map(r => r.feature)).size;
  const failedFeatureNames = new Set(failedFeatures.map(r => r.feature));
  const failedFeatureCount = failedFeatureNames.size;

  let ceiling = 10;
  let ceilingRule = null;

  // >50% features have failed tests -> max 5
  if (failedFeatureCount > totalFeatures * 0.5) {
    ceiling = 5;
    ceilingRule = ">50% features have failing acceptance tests";
  }

  // Canned AI feature detected (from projection-critic findings)
  const cannedAI = projectionSummary.findings.some(
    f => f.title.toLowerCase().includes("canned") && f.severity === "Major"
  );

  if (cannedAI && ceiling > 5) {
    ceiling = 5;
    ceilingRule = "Canned AI feature detected";
  }

  if (score > ceiling) {
    score = ceiling;
  }

  return {
    score,
    threshold: 7,
    pass: score >= 7,
    ceiling_applied: ceilingRule,
    pass_rate: passRate,
    justification: "Product Depth " + score + "/10 -- " +
      tests.passed + "/" + tests.total + " acceptance tests passed (" +
      Math.round(passRate * 100) + "%). " +
      (ceilingRule ? "Ceiling: " + ceilingRule + "." : "No ceiling applied.")
  };
}
```

### Pattern 5: Orchestrator Evaluation Phase (ENSEMBLE-10)

**What:** Orchestrator spawns 2 critics in parallel, waits for both, then CLI compiles.
**When to use:** Every evaluation round in the generation/evaluation loop.

```
#### Evaluation Phase (each round N)

Update state:
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs update --step evaluate --round N)

Spawn both critics in parallel:
Agent(subagent_type: "application-dev:perceptual-critic", prompt: "This is evaluation round N.")
Agent(subagent_type: "application-dev:projection-critic", prompt: "This is evaluation round N.")

Binary checks:
- evaluation/round-N/perceptual/summary.json exists
- evaluation/round-N/projection/summary.json exists

Compile evaluation:
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs compile-evaluation --round N)

Binary check: evaluation/round-N/EVALUATION.md exists and contains ## Scores

Convergence check:
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs round-complete --round N --report evaluation/round-N/EVALUATION.md)
```

### Pattern 6: Critic Agent Definition Structure

**What:** Compact agent definitions following SkillsBench patterns.
**When to use:** Both critic agent .md files.

Agent frontmatter constrains tools via allowlists. The `tools` array in the
frontmatter is the first enforcement layer. Prompt guards in the body are the
second layer.

```yaml
---
name: perceptual-critic
description: |
  Use this agent to evaluate a running application's visual design quality.
  Spawned by the application-dev orchestrator during evaluation phase.
  Should not be triggered directly by users.
model: inherit
color: yellow
tools: ["Read", "Write", "Bash(npx playwright-cli *)", "Bash(node *appdev-cli* install-dep *)"]
---
```

Key patterns for agent body:
- **Progressive disclosure:** Heavy protocol content lives in reference files
  (AI-SLOP-CHECKLIST.md, ASSET-VALIDATION-PROTOCOL.md decomposed parts).
  Agent definition says "Read reference X for the full protocol."
- **WHY-based rationale:** Instructions explain why, not just what. This
  produces better compliance than ALL-CAPS emphasis.
- **Methodology over steps:** Instead of 15 numbered steps (monolithic
  evaluator), each critic has a methodology (~5 phases) that emerges from
  its discriminator technique.
- **Hard boundary statements:** "You MUST NOT read application source code
  files (.js, .ts, .css, .html, .json except package.json and summary.json).
  Your evaluation is product-surface only."

### Anti-Patterns to Avoid

- **Critic reading source code:** Violates BARRIER-01. Tool allowlists must
  not include `Read` for source files. The critic can Read SPEC.md,
  evaluation artifacts, and reference files only.
- **Critic writing application files:** Violates BARRIER-03. Write restricted
  to `evaluation/round-N/{critic-name}/` directory only.
- **CLI using LLM for any computation:** `compile-evaluation` must be fully
  deterministic. No `Agent()` calls, no prompt construction, no "ask Claude
  to summarize." String concatenation and arithmetic only.
- **Generator seeing summary.json:** Generator reads EVALUATION.md only.
  The ensemble is invisible to the Generator per GMAN (12.1).
- **Monolithic evaluation template:** The old EVALUATION-TEMPLATE.md had
  sections written by a single agent. The new template has provenance
  markers (Source: Perceptual Critic, Source: Projection Critic, Source:
  CLI Ensemble) to trace each section to its origin.
- **Partial regex contract migration:** EVALUATION-TEMPLATE.md dimension
  names and appdev-cli.mjs regex MUST be updated atomically (Pitfall 1
  from PITFALLS.md).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-process file mutex | Custom advisory lock with `fs.open` O_EXCL | `fs.mkdirSync` atomic directory creation | `O_EXCL` is broken on NFS; `mkdir` is atomic on all filesystems |
| JSON schema validation | Manual field-by-field checks in CLI | Validate structurally in CLI (check required keys exist, types match) | Full JSON Schema validation (ajv) is overkill for CLI; simple key existence + type checks suffice |
| Markdown template rendering | Template engine (handlebars, ejs) | String concatenation in appdev-cli.mjs | Zero-dependency CLI constraint; EVALUATION.md structure is regular enough for template literals |
| Score regex parsing | Full markdown table parser | Continue using regex pattern (updated for 3 dims) | Existing pattern works; changing to a table parser adds complexity for no gain |
| Priority Fixes ordering | LLM-based severity ranking | Deterministic sort: severity enum (Critical=0, Major=1, Minor=2) then distance below threshold | Fully deterministic, zero LLM tokens |

**Key insight:** The CLI aggregator must remain fully deterministic and zero-dependency.
Every "smart" feature (ordering, scoring, ceiling rules) is implemented as arithmetic
and string comparison, never as LLM inference. This is the fundamental design constraint
that separates the CLI aggregator from the critic agents.

## Common Pitfalls

### Pitfall 1: Breaking Score Regex When Changing from 4 to 3 Dimensions

**What goes wrong:** The current `extractScores()` in appdev-cli.mjs expects exactly
4 dimensions and validates `Object.keys(scores).length !== 4`. Changing to 3 dimensions
requires updating: (1) the regex pattern string, (2) the expected count, (3) the
expected key names, (4) the total computation, (5) EVALUATION-TEMPLATE.md, and (6)
SCORING-CALIBRATION.md. Missing any one causes the CLI to reject valid reports.

**Why it happens:** Six files share the dimension name contract through regex, HTML
comments, and prose text. No automated check verifies they are in sync.

**How to avoid:** Update all six touch-points in a single plan/commit. The compile-evaluation
subcommand should be the canonical source of dimension names -- extract them from a
constant array that both `extractScores()` and `compile-evaluation` reference.

**Warning signs:** `round-complete` returns `{"error": "Could not extract all N scores..."}`.

### Pitfall 2: Critic Context Bloat Defeating the Ensemble Purpose

**What goes wrong:** A critic that reads full accessibility snapshots into context,
takes many screenshots, or runs too many interactive browser commands will exceed the
~60K token budget, defeating the purpose of splitting the monolithic evaluator.

**Why it happens:** The monolithic evaluator's 15 steps included extensive browser
interaction. If critic agent definitions copy too much of this methodology, they
inherit the context bloat problem.

**How to avoid:**
- perceptual-critic: eval-first (structured JSON via `eval`), screenshots at key
  viewpoints only (not every scroll position), `console error` (filtered)
- projection-critic: write-and-run (tests outside context), ~5 tool calls replace
  ~30+ interactive calls, `console error` (filtered)
- Both critics: write structured summary.json to file, keep only summaries in
  context, raw data discarded on agent completion (hard GC via process destruction)

**Warning signs:** Critic agent sessions approaching 200 tool calls or 200K tokens.

### Pitfall 3: compile-evaluation Producing Unparseable EVALUATION.md

**What goes wrong:** The CLI-compiled EVALUATION.md must be parseable by the existing
`extractScores()` function AND readable by the Generator as actionable feedback. If
the template is too mechanical (just JSON dumps), the Generator cannot act on it. If
the template is too free-form, `extractScores()` cannot parse scores.

**Why it happens:** Tension between machine-parseability (regex) and human-readability
(Generator is an LLM that needs actionable prose).

**How to avoid:** The CLI compiles EVALUATION.md with:
1. A regex-sensitive Scores table (machine-parseable, same format as before)
2. Prose assessment sections copied verbatim from summary.json `findings[]` and
   `justification` fields (human-readable, attributable to source critic)
3. Priority Fixes section assembled by CLI from merged findings

### Pitfall 4: install-dep Race Condition with Stale Lock

**What goes wrong:** If a critic process crashes while holding the install lock, the
lock file persists. The other critic waits forever (or until timeout).

**Why it happens:** Process termination does not call cleanup code. The `finally`
block in install-dep only runs for normal or error exits, not SIGKILL.

**How to avoid:** Stale lock detection via `statSync` mtime check. Lock directory
older than STALE_MS (60 seconds) is force-removed. The 60-second threshold is
generous -- `npm install --save-dev sharp` typically completes in 10-30 seconds.

**Warning signs:** Critic error output mentions "Timed out waiting for install lock."

### Pitfall 5: Orchestrator Not Waiting for Both Critics

**What goes wrong:** Claude Code's Agent tool may return before the sub-agent fully
completes (classifyHandoffIfNeeded bug, documented in SKILL.md Error Recovery). If
the orchestrator checks for summary.json immediately after Agent() returns, the file
may not exist yet.

**Why it happens:** Agent tool's success/failure status may be unreliable. The existing
SKILL.md documents this bug and prescribes binary file-exists checks regardless of
reported status.

**How to avoid:** The orchestrator must check for both `perceptual/summary.json` AND
`projection/summary.json` via file-exists checks after BOTH Agent() calls return. If
either is missing, apply the retry pattern from SKILL.md Error Recovery section.

**Warning signs:** `compile-evaluation` fails with "summary.json not found" even
though the critic Agent() call reported success.

## Code Examples

### Verified: extractScores() Update for 3 Dimensions

```javascript
// Source: appdev-cli.mjs lines 79-124 (modified for Phase 7)
function extractScores(reportPath) {
  // ... file reading unchanged ...

  // UPDATED: 3 dimensions instead of 4
  const scorePattern = /\|\s*(Product Depth|Functionality|Visual Design)\s*\|\s*(\d+)\/10/gi;
  const scores = {};
  let match;

  while ((match = scorePattern.exec(content)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, "_");
    scores[key] = parseInt(match[2], 10);
  }

  // UPDATED: expect 3, not 4
  if (Object.keys(scores).length !== 3) {
    const found = Object.keys(scores);
    const expected = ["product_depth", "functionality", "visual_design"];
    const missing = expected.filter(function (k) {
      return !found.includes(k);
    });

    return {
      error: "Could not extract all 3 scores from report. Missing: " +
        missing.join(", ") + ". Found: " + found.join(", "),
    };
  }

  // UPDATED: total of 3 dimensions (max 30)
  scores.total = scores.product_depth + scores.functionality + scores.visual_design;

  // Verdict is now COMPUTED, not extracted from report
  return { scores };
}
```

### Verified: computeVerdict() for 3 Dimensions

```javascript
// Source: new function for appdev-cli.mjs
function computeVerdict(scores) {
  const thresholds = {
    product_depth: 7,
    functionality: 7,
    visual_design: 6,
  };

  for (const [key, threshold] of Object.entries(thresholds)) {
    if (scores[key] < threshold) {
      return "FAIL";
    }
  }

  return "PASS";
}
```

### EVALUATION-TEMPLATE.md Redesign (CLI-Compiled Output)

```markdown
<!--
WARNING: The scores table format is parsed by appdev-cli.mjs
(extractScores function). Do not change the table column structure,
criterion names, score format (N/10).
Verdict is computed by the CLI, not written by any agent.
-->

# Evaluation Report -- {product_name}

## Generation Round: {round}

## Verdict: {verdict}

<!-- REGEX-SENSITIVE: parsed by
/\|\s*(Product Depth|Functionality|Visual Design)\s*\|\s*(\d+)\/10/gi -->
## Scores

| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Product Depth | {pd_score}/10 | 7 | {pd_status} |
| Functionality | {fn_score}/10 | 7 | {fn_status} |
| Visual Design | {vd_score}/10 | 6 | {vd_status} |

## Score Justifications

| Criterion | Justification |
|-----------|---------------|
| Product Depth | ({pd_score} of 10) -- {pd_justification} |
| Functionality | ({fn_score} of 10) -- {fn_justification} |
| Visual Design | ({vd_score} of 10) -- {vd_justification} |

## Product Depth Assessment
*Source: CLI Ensemble (computed from acceptance test results)*

{product_depth_assessment}

## Functionality Assessment
*Source: Projection Critic*

{functionality_assessment}

## Visual Design Assessment
*Source: Perceptual Critic*

{visual_design_assessment}

## Priority Fixes for Next Round
*Source: CLI Ensemble (merged from both critics, severity-ordered)*

{priority_fixes}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic evaluator (392 lines, 15 steps) | 2 parallel critics + CLI aggregator | Phase 7 (v1.1) | Context usage drops from ~400K to ~60K per critic |
| 4 scoring dimensions (PD, Fn, VD, CQ) | 3 dimensions (PD, Fn, VD) | Phase 7 (v1.1) | Code Quality retired per GAN information barrier |
| Evaluator computes verdict | CLI computes verdict mechanically | Phase 7 (v1.1) | Eliminates threshold anchoring bias |
| Evaluator reads source code (Step 10) | Neither critic reads source code | Phase 7 (v1.1) | GAN information barrier enforced |
| Single EVALUATION.md written by evaluator | CLI compiles EVALUATION.md from summary.json files | Phase 7 (v1.1) | Deterministic, extensible, provenance-tracked |
| `extractScores()` expects 4 dimensions | `extractScores()` expects 3 dimensions | Phase 7 (v1.1) | Regex + expected count + total computation all change |

**Deprecated/outdated:**
- `evaluator.md` agent: Replaced by `perceptual-critic.md` + `projection-critic.md`
- Code Quality dimension: Retired entirely (GAN information barrier)
- `## Verdict:` written by evaluator: Verdict now CLI-computed
- `extractScores()` verdict parsing: Removed -- verdict comes from `computeVerdict()`

## Open Questions

1. **Busy-wait in synchronous mutex**
   - What we know: The `install-dep` subcommand runs synchronously. Node.js has no
     `sleep()`. Busy-wait with a while loop burns CPU.
   - What's unclear: Whether `Atomics.wait` on SharedArrayBuffer or
     `child_process.spawnSync('sleep', ['0.5'])` is a better sleep alternative.
   - Recommendation: Use `spawnSync('sleep', ['0.5'])` for the polling interval.
     Simple, works on all platforms, and the CLI already needs child_process for
     `npm install`. On Windows Git Bash, `sleep` is available.

2. **playwright-api-testing skill scope**
   - What we know: CONTEXT.md says "Skill creation may straddle Phase 7 and Phase 8."
   - What's unclear: Whether the projection-critic needs this skill in Phase 7 or
     if it can use existing `playwright-testing` skill for all testing.
   - Recommendation: Phase 7 planner should scope the projection-critic to use
     `playwright-testing` skill only. The `playwright-api-testing` skill is
     Phase 8 scope per CONTEXT.md guidance. Projection-critic can be enhanced in
     Phase 8 to also use the API testing skill.

3. **ASSET-VALIDATION-PROTOCOL.md decomposition**
   - What we know: Visual quality parts go to perceptual-critic reference, coverage
     parts handled by projection-critic acceptance tests, URL checking stays in CLI.
   - What's unclear: Whether to create a new reference file for perceptual-critic
     or modify the existing one.
   - Recommendation: Create a focused `PERCEPTUAL-EVALUATION.md` reference that
     extracts visual-quality-relevant content from ASSET-VALIDATION-PROTOCOL.md.
     The original file can be deprecated or kept as an archive. This follows the
     progressive disclosure pattern.

4. **Round-complete interaction with compile-evaluation**
   - What we know: Currently `round-complete` reads EVALUATION.md directly for
     score extraction. With CLI compilation, `compile-evaluation` writes EVALUATION.md
     first, then `round-complete` reads it.
   - What's unclear: Whether to combine these into a single subcommand or keep them
     separate.
   - Recommendation: Keep them separate. `compile-evaluation` writes the report.
     `round-complete` reads it and updates state/escalation. Separation of concerns:
     compilation is a write operation, round-complete is a read+state-update operation.
     The orchestrator calls them sequentially.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) or manual test scripts |
| Config file | none -- appdev-cli.mjs has no test infrastructure yet |
| Quick run command | `node test-appdev-cli.mjs` |
| Full suite command | `node test-appdev-cli.mjs` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENSEMBLE-03 | compile-evaluation reads summary.json files and produces EVALUATION.md | unit | `node test-compile-evaluation.mjs` | -- Wave 0 |
| ENSEMBLE-04 | install-dep mutex prevents concurrent npm install corruption | unit | `node test-install-dep-mutex.mjs` | -- Wave 0 |
| ENSEMBLE-06 | extractScores() parses 3 dimensions (not 4) | unit | `node test-extract-scores.mjs` | -- Wave 0 |
| ENSEMBLE-06 | computeVerdict() returns PASS/FAIL from 3-dim thresholds | unit | `node test-compute-verdict.mjs` | -- Wave 0 |
| ENSEMBLE-07 | CLI-compiled EVALUATION.md is parseable by extractScores() | integration | `node test-compile-roundtrip.mjs` | -- Wave 0 |
| ENSEMBLE-09 | compile-evaluation auto-discovers new */summary.json dirs | unit | `node test-summary-glob.mjs` | -- Wave 0 |
| ENSEMBLE-01 | perceptual-critic agent definition has correct tool allowlist | manual-only | Review perceptual-critic.md frontmatter | N/A |
| ENSEMBLE-02 | projection-critic agent definition has correct tool allowlist | manual-only | Review projection-critic.md frontmatter | N/A |
| ENSEMBLE-05 | evaluator.md is removed | manual-only | `ls plugins/application-dev/agents/evaluator.md` returns not found | N/A |
| ENSEMBLE-10 | Orchestrator evaluation phase spawns 2 critics + CLI compile | manual-only | Review SKILL.md evaluation phase section | N/A |
| BARRIER-01 | Neither critic can read source code files | manual-only | Review tool allowlists in both critic .md files | N/A |
| BARRIER-02 | Findings use behavioral symptom language | manual-only | Review finding templates in critic instructions | N/A |
| BARRIER-03 | Critics cannot write outside evaluation/ directory | manual-only | Review tool allowlists + Write restrictions | N/A |
| BARRIER-04 | Generator tests and critic tests are independent suites | manual-only | Review directory structure documentation | N/A |

### Sampling Rate

- **Per task commit:** `node test-appdev-cli.mjs` (covers all unit tests)
- **Per wave merge:** Full suite + manual review of agent definitions
- **Phase gate:** All automated tests green + manual agent definition review

### Wave 0 Gaps

- [ ] `test-compile-evaluation.mjs` -- covers ENSEMBLE-03, ENSEMBLE-09
- [ ] `test-install-dep-mutex.mjs` -- covers ENSEMBLE-04
- [ ] `test-extract-scores.mjs` -- covers ENSEMBLE-06 (3-dim parsing)
- [ ] `test-compute-verdict.mjs` -- covers ENSEMBLE-06 (verdict computation)
- [ ] `test-compile-roundtrip.mjs` -- covers ENSEMBLE-07 (compile -> parse roundtrip)
- [ ] Test fixture: sample summary.json files for perceptual and projection critics
- [ ] Test fixture: sample EVALUATION.md with 3 dimensions for extractScores() regression

## Sources

### Primary (HIGH confidence)

- `plugins/application-dev/scripts/appdev-cli.mjs` (709 lines) -- full CLI codebase analysis, extractScores() regex on line 92, computeEscalation(), determineExit()
- `plugins/application-dev/agents/evaluator.md` (392 lines) -- full monolithic evaluator, 15 steps, tool allowlist, scoring rubric
- `plugins/application-dev/skills/application-dev/SKILL.md` -- orchestrator workflow, evaluation phase, error recovery
- `plugins/application-dev/skills/application-dev/references/evaluator/EVALUATION-TEMPLATE.md` -- current template with REGEX-SENSITIVE comments
- `plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md` -- ceiling rules, calibration scenarios, 4-dimension thresholds
- `plugins/application-dev/skills/application-dev/references/evaluator/AI-PROBING-REFERENCE.md` -- probe battery for projection-critic
- `plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md` -- slop patterns for perceptual-critic
- `plugins/application-dev/skills/application-dev/references/evaluator/ASSET-VALIDATION-PROTOCOL.md` -- asset validation decomposition
- `.planning/phases/07-ensemble-discriminator-architecture/07-CONTEXT.md` -- locked decisions
- `.planning/REQUIREMENTS.md` -- ENSEMBLE-01..10, BARRIER-01..04 specifications
- `.planning/research/gan-discriminator-taxonomy.md` -- GMAN 12.1, ProjectedGAN 7.1, Perceptual 7.3, Projection 3.3
- `.planning/research/PITFALLS.md` -- Pitfalls 1 (regex contract), 2 (behavioral regression), 5 (acceptance test ceiling)
- `.planning/research/ARCHITECTURE.md` -- data flow analysis, dependency graph, build order
- `.planning/research/playwright-token-efficiency.md` -- eval-first, write-and-run, run-code patterns

### Secondary (MEDIUM confidence)

- [Playwright API Testing docs](https://playwright.dev/docs/api-testing) -- APIRequestContext patterns, storageState sharing
- [proper-lockfile approach](https://www.npmjs.com/package/proper-lockfile) -- `mkdir` as atomic lock operation, stale detection via mtime
- [Node.js file locking patterns](https://blog.logrocket.com/understanding-node-js-file-locking/) -- `mkdirSync` vs `O_EXCL` tradeoffs
- [mutex-node](https://github.com/ttiny/mutex-node) -- cross-process file-based mutex reference

### Tertiary (LOW confidence)

- None -- all findings verified against primary sources (codebase analysis) or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dependency CLI pattern established, all libraries already in use
- Architecture: HIGH -- patterns directly derived from codebase analysis + locked CONTEXT.md decisions
- Pitfalls: HIGH -- pitfalls derived from reading actual code (regex patterns, validation logic, data flow)
- Validation: MEDIUM -- no existing test infrastructure for appdev-cli.mjs; Wave 0 gaps must be filled

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain -- plugin architecture, not fast-moving external dependencies)
