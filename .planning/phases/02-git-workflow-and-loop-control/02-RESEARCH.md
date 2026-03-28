# Phase 2: Git Workflow and Loop Control - Research

**Researched:** 2026-03-28
**Domain:** Git version control in Claude Code agent workflows, score-based convergence detection, CLI extension patterns, GAN ubiquitous language
**Confidence:** HIGH (most decisions locked in CONTEXT.md; implementation patterns well-understood from Phase 1)

## Summary

Phase 2 adds two major capabilities to the application-dev plugin: (1) every agent commits its own artifacts to git with the orchestrator managing milestone tags, and (2) the orchestrator delegates score-based convergence detection to an extended CLI tool (`appdev-cli.mjs`) that computes escalation levels, plateau detection, and regression detection. The orchestrator remains "dumb" -- it never reads EVALUATION.md directly (except for Summary presentation) and acts only on the JSON returned by appdev-cli.

The implementation surface spans five files to modify (SKILL.md, generator.md, evaluator.md, planner.md, appdev-state.mjs renamed to appdev-cli.mjs), one new file to create (docs/ARCHITECTURE.md), and a GAN ubiquitous language rename that touches all agent definitions, the orchestrator skill, and the CLI (QA -> evaluation, QA-REPORT.md -> EVALUATION.md, qa/ -> evaluation/). The `allowed-tools` on the orchestrator skill expands from `Bash(node *appdev-state*)` to include specific git and npm Bash patterns.

A critical finding: the CONTEXT.md specifies `npm install --save-dev playwright-cli` but the `playwright-cli` npm package is deprecated. The correct package is `@playwright/cli` (latest 0.1.1, published Feb 2026). The binary name remains `playwright-cli`, so all evaluator commands remain valid -- only the install command changes.

**Primary recommendation:** Execute in three waves: (1) CLI rename + extension with convergence logic, (2) agent definitions and orchestrator SKILL.md rewrite with git workflow and loop control, (3) docs/ARCHITECTURE.md. The GAN ubiquitous language rename should be woven into waves 1 and 2 rather than a separate wave, since every file is already being modified.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Orchestrator never reads EVALUATION.md directly (except Summary step for presentation)
- appdev-cli parses EVALUATION.md: extracts scores, verdict, and returns structured JSON
- Orchestrator calls `appdev-cli round-complete --round N --report EVALUATION.md` and acts on the returned JSON
- If EVALUATION.md is missing or malformed, appdev-cli returns an error state; orchestrator delegates to error recovery
- appdev-cli computes ALL convergence logic: plateau detection, regression detection, escalation levels
- appdev-cli returns `exit_condition`, `should_continue`, `escalation` in its JSON response
- Orchestrator acts on `should_continue` and `exit_condition` names -- never interprets scores itself
- Phase 1's binary file-exists check is replaced by "did appdev-cli return valid JSON?"
- CLI rename: appdev-state.mjs -> appdev-cli.mjs; Bash pattern: `Bash(node *appdev-cli*)`; state file remains `.appdev-state.json`
- Scope of appdev-cli: workflow state, score extraction, convergence detection, escalation levels
- NOT in scope for appdev-cli: git operations (agents commit, orchestrator tags via Bash(git ...))
- Escalation vocabulary: E-0 Progressing, E-I Decelerating, E-II Plateau, E-III Regression, E-IV Catastrophic
- Exit condition behaviors: PASS (stop+summary), PLATEAU (stop immediately), REGRESSION (stop+rollback to best round via git reset --hard), SAFETY_CAP (one extra wrap-up round beyond cap)
- Feature watchdog (LOOP-06) moved to Phase 3 as Evaluator responsibility
- Minimal orchestrator prompts: Generator gets "This is generation round N.", Evaluator gets "This is evaluation round N."
- LOOP-07 (fix-only mode) and LOOP-08 (read EVALUATION.md before SPEC.md) live in Generator agent definition only
- Score trajectory (LOOP-09) satisfied by .appdev-state.json rounds[].scores + escalation levels; appdev-cli get-trajectory subcommand formats on demand
- GAN ubiquitous language rename: QA-REPORT.md -> EVALUATION.md, qa/ -> evaluation/, all "QA" terminology removed
- Agents commit their own work (Planner: SPEC.md, Generator: feature-by-feature, Evaluator: evaluation/round-N/)
- Orchestrator creates milestone tags: appdev/planning-complete, appdev/round-N, appdev/final
- Commit message convention: conventional commits with feature as scope
- Git workspace setup (Step 0.5): check for existing git repo, npm init -y, install playwright-cli, seed .gitignore, initial commit
- Orchestrator allowed-tools: `Agent Read Write Bash(node *appdev-cli*) Bash(git init*) Bash(git rev-parse *) Bash(git add *) Bash(git commit *) Bash(git tag *) Bash(git reset *) Bash(npm init*) Bash(npm install*)`
- Per-round evaluation folder: evaluation/round-N/ with EVALUATION.md, screenshots/, console.log, network.log
- No root-level EVALUATION.md copy -- Generator derives path from round number
- docs/ARCHITECTURE.md is a Phase 2 deliverable at repo root (not distributed with plugin)

### Claude's Discretion
- appdev-cli subcommand interface details (exact flags, output format beyond documented schema)
- Exact escalation level thresholds for E-IV (>50% drop is starting point, can adjust)
- Workspace setup ordering (npm init before/after git init)
- Git tag message content (lightweight vs annotated tags)
- Console/network log capture format in evaluation folders
- docs/ARCHITECTURE.md structure and depth of coverage

### Deferred Ideas (OUT OF SCOPE)
- LOOP-06 feature watchdog -- moved to Phase 3 as Evaluator responsibility
- Abort-with-git-rollback -- from Phase 1 deferred ideas. Now possible with milestone tags from GIT-05.
- `/application-dev:resume` and `/application-dev:pause` commands -- explicit entry points for state management, future enhancement.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GIT-01 | Planner commits SPEC.md to git after generating it | Planner agent definition gets git commit instruction; Planner tools already include Bash (NO -- Planner only has Read, Write; orchestrator tags after plan step instead, or Planner needs Bash added) |
| GIT-02 | Generator commits frequently (feature-by-feature) | Generator agent definition already has Bash; add conventional commit instructions with feature scope |
| GIT-03 | Generator adds/updates .gitignore | Generator agent definition instruction; already has Write/Edit tools |
| GIT-04 | Evaluator commits report and artifacts into evaluation/round-N/ | Evaluator agent definition gets git commit instruction; Evaluator already has Bash |
| GIT-05 | Milestone git tags at key points | Orchestrator creates tags via `Bash(git tag *)` -- annotated tags recommended for metadata |
| LOOP-01 | Score-based exit with plateau detection | appdev-cli round-complete computes escalation levels; E-II Plateau: <=1 point over 3-round window |
| LOOP-02 | 10-round safety cap | Orchestrator loop condition checks round count; appdev-cli returns SAFETY_CAP exit condition |
| LOOP-03 | Wrap-up phase on safety cap | Orchestrator runs one extra round (generation+evaluation) beyond cap when SAFETY_CAP fires |
| LOOP-04 | Four exit conditions (PASS, PLATEAU, REGRESSION, SAFETY_CAP) | appdev-cli returns `exit_condition` name; orchestrator dispatches behavior by name |
| LOOP-05 | Escalation vocabulary (E-0 through E-IV) | appdev-cli computes per-round escalation, stores in state file, shown in progress output |
| LOOP-06 | Feature count watchdog | DEFERRED to Phase 3 per CONTEXT.md -- Evaluator responsibility, not orchestrator's |
| LOOP-07 | Generator fix-only mode in rounds 2+ | Generator agent definition instruction (damping principle); NOT in orchestrator prompt |
| LOOP-08 | Context loading order (EVALUATION.md before SPEC.md in rounds 2+) | Generator agent definition instruction; Generator reads evaluation/round-{N-1}/EVALUATION.md first |
| LOOP-09 | Score trajectory tracking | .appdev-state.json rounds[] array + appdev-cli get-trajectory subcommand |
</phase_requirements>

## Critical Finding: GIT-01 (Planner Commits)

The Planner agent currently has `tools: ["Read", "Write"]` -- it does NOT have Bash access and therefore cannot run git commands. The CONTEXT.md decision says "Agents commit their own work" and lists the Planner committing SPEC.md. There are three options:

1. **Add Bash to Planner tools** -- Breaks the minimal-tools principle from Phase 1 (Planner should only read references and write SPEC.md)
2. **Orchestrator commits SPEC.md after Planner completes** -- Orchestrator already has `Bash(git add *)` and `Bash(git commit *)` in its new allowed-tools. This maintains the Planner's minimal tool surface.
3. **Add only `Bash(git *)` to Planner tools** -- Gives Planner git access without full Bash

**Recommendation:** Option 2 (orchestrator commits after Planner). The orchestrator already does the binary check on SPEC.md after the Planner completes -- it can commit right after confirming the file exists. This keeps the Planner's tool surface minimal and follows the "orchestrator owns milestone tags" principle naturally. The commit message can still use conventional commits: `docs(spec): product specification`.

## Critical Finding: playwright-cli Package Deprecation

The CONTEXT.md specifies `npm install --save-dev playwright-cli` for workspace setup. However:

- The `playwright-cli` npm package (v0.262.0) is **deprecated** with the message "use @playwright/cli instead"
- `@playwright/cli` v0.1.1 was published February 14, 2026 by Microsoft
- The binary name exposed by `@playwright/cli` is still `playwright-cli`
- All existing evaluator commands (`playwright-cli open`, `playwright-cli snapshot`, etc.) remain valid

**Recommendation:** Use `npm install --save-dev @playwright/cli` instead of the deprecated package. The binary name and all commands are identical. The `.playwright-cli/` gitignore entry is still correct (the CLI writes snapshots to this directory).

## Standard Stack

### Core
| Component | Version/Format | Purpose | Why Standard |
|-----------|---------------|---------|--------------|
| appdev-cli.mjs | Node.js ESM | Score extraction, convergence detection, escalation, state management | Extended from Phase 1's appdev-state.mjs; zero-dependency ESM script |
| SKILL.md (markdown) | YAML frontmatter + markdown | Orchestrator workflow with git + loop control | Claude Code skill format |
| Agent definitions (.md) | YAML frontmatter + markdown | Git commit instructions, GAN language, fix-only mode | Claude Code agent format |
| docs/ARCHITECTURE.md | Markdown | GAN architecture documentation | Repo-root documentation (not distributed with plugin) |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `@playwright/cli` | Browser-based QA testing | Installed in workspace setup (Step 0.5); used by Evaluator |
| `.appdev-state.json` | Workflow state with round scores and escalation | Managed exclusively by appdev-cli.mjs |
| `evaluation/round-N/` | Per-round evaluation artifacts | Created by Evaluator; read by Generator in subsequent rounds |
| git tags (`appdev/*`) | Milestone markers and rollback points | Created by orchestrator; used for REGRESSION rollback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Annotated git tags | Lightweight tags | Annotated carry tagger/date metadata; lightweight are simpler. Annotated recommended for `git describe` compatibility and audit trail |
| appdev-cli file parsing | Orchestrator reading EVALUATION.md | Breaks "dumb orchestrator" principle; appdev-cli centralizes all intelligence |
| Separate progress file (LOOP-09) | State file rounds[] array | State file already stores per-round scores; get-trajectory subcommand formats on demand |

**Installation (workspace setup):**
```bash
git init
npm init -y
npm install --save-dev @playwright/cli
```

## Architecture Patterns

### Plugin Directory Structure (After Phase 2)
```
plugins/application-dev/
|-- .claude-plugin/plugin.json
|-- commands/application-dev.md
|-- skills/
|   '-- application-dev/
|       |-- SKILL.md                   (MODIFIED: git workflow, loop control, escalation)
|       '-- references/
|           '-- frontend-design-principles.md
|-- agents/
|   |-- planner.md                     (MODIFIED: GAN language rename)
|   |-- generator.md                   (MODIFIED: git commits, fix-only, evaluation path)
|   '-- evaluator.md                   (MODIFIED: git commits, evaluation/ path, GAN rename)
|-- scripts/
|   '-- appdev-cli.mjs                 (RENAMED+EXTENDED: convergence, escalation, score extraction)
|-- skills/browser-prompt-api/
|-- skills/browser-webllm/
|-- skills/browser-webnn/
'-- README.md

docs/
'-- ARCHITECTURE.md                    (NEW: GAN architecture documentation, repo root)
```

### Generated Project Structure (workspace after Step 0.5)
```
<user's working directory>/
|-- .git/                              (initialized by orchestrator)
|-- .gitignore                         (seeded by orchestrator, extended by Generator)
|-- .appdev-state.json                 (managed by appdev-cli, gitignored)
|-- node_modules/                      (gitignored)
|-- package.json                       (npm init -y)
|-- SPEC.md                            (committed after Planner)
|-- evaluation/
|   |-- round-1/
|   |   |-- EVALUATION.md
|   |   |-- screenshots/
|   |   |-- console.log
|   |   '-- network.log
|   '-- round-2/
|       '-- ...
'-- <application source files>         (committed feature-by-feature by Generator)
```

### Pattern 1: appdev-cli round-complete with Score Extraction

**What:** The appdev-cli round-complete subcommand reads EVALUATION.md, extracts scores, computes convergence metrics, and returns a JSON response the orchestrator acts on.

**When to use:** After every Evaluator completes.

**Input:**
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs round-complete --round 2 --report evaluation/round-2/EVALUATION.md
```

**Output schema (recommendation):**
```json
{
  "round": 2,
  "verdict": "FAIL",
  "scores": {
    "product_depth": 6,
    "functionality": 5,
    "visual_design": 4,
    "code_quality": 7,
    "total": 22
  },
  "escalation": "E-I",
  "escalation_label": "Decelerating",
  "exit_condition": null,
  "should_continue": true,
  "trajectory": [
    { "round": 1, "total": 18, "escalation": "E-0" },
    { "round": 2, "total": 22, "escalation": "E-I" }
  ]
}
```

**When exit triggers:**
```json
{
  "round": 5,
  "verdict": "FAIL",
  "scores": { "total": 23 },
  "escalation": "E-II",
  "escalation_label": "Plateau",
  "exit_condition": "PLATEAU",
  "should_continue": false,
  "best_round": 4,
  "trajectory": [...]
}
```

**Score extraction approach:** Parse EVALUATION.md for the scores table using regex. The table format is well-defined in the Evaluator's template:
```
| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Product Depth | X/10 | 7 | PASS/FAIL |
```

Extract `X` from each `X/10` cell. If parsing fails, return error JSON.

### Pattern 2: Escalation Level Computation

**What:** Each round gets an escalation level based on score trajectory.

**Algorithm:**
```
Given rounds[] with total scores:

E-IV Catastrophic: single-round drop >50% of previous total, OR total <= 5
E-III Regression: 2 consecutive total-score declines
E-II Plateau: <=1 point improvement over 3-round window (rounds N, N-1, N-2)
E-I Decelerating: score improved but delta is smaller than previous delta
E-0 Progressing: score improved >1 point
```

**Priority:** E-IV > E-III > E-II > E-I > E-0 (check in this order, first match wins)

**Exit condition mapping:**
| Escalation | Exit Condition | Behavior |
|------------|----------------|----------|
| E-0, E-I | none | Continue |
| E-II | PLATEAU | Stop immediately, summary |
| E-III | REGRESSION | Stop, rollback to best round |
| E-IV | REGRESSION | Stop immediately, rollback to best round |

**Special cases:**
- Round 1: Always E-0 (no prior data)
- Round 2: Can be E-0, E-I, E-III, or E-IV (no 3-round window for plateau)
- PASS verdict: Exit with PASS regardless of escalation
- Round 10: If not already exited, exit with SAFETY_CAP

### Pattern 3: Orchestrator Loop Structure

**What:** The orchestrator's Build/QA Loop restructured for score-based convergence.

**Pseudocode:**
```
for round in 1..10:
  spawn Generator("This is generation round {round}.")
  binary check: project files exist
  orchestrator: git tag appdev/round-{round}-gen (optional intermediate)

  spawn Evaluator("This is evaluation round {round}.")

  result = appdev-cli round-complete --round {round} --report evaluation/round-{round}/EVALUATION.md

  if result.exit_condition == "PASS":
    git tag appdev/round-{round}
    break -> summary

  if result.exit_condition == "PLATEAU":
    git tag appdev/round-{round}
    break -> summary

  if result.exit_condition == "REGRESSION":
    best = result.best_round
    git reset --hard appdev/round-{best}
    git tag appdev/round-{round} (tag the regression point before rollback? or skip?)
    break -> summary (using best round's evaluation)

  git tag appdev/round-{round}
  output escalation level
  continue

if round == 10 and no exit:
  result = appdev-cli round-complete ... (check round 10)
  if not exited:
    exit_condition = SAFETY_CAP
    run one extra wrap-up round (round 11, not counted toward cap)
    git tag appdev/final
    break -> summary
```

### Pattern 4: Git Workspace Setup (Step 0.5)

**What:** Orchestrator initializes a git-enabled workspace before spawning any agents.

**Sequence:**
```bash
# 1. Check for existing git repo
git rev-parse --git-dir 2>/dev/null || git init

# 2. Initialize package.json
npm init -y

# 3. Install @playwright/cli as dev dependency
npm install --save-dev @playwright/cli

# 4. Seed .gitignore
# (use Write tool to create .gitignore with:)
# .appdev-state.json
# .playwright-cli/
# node_modules/

# 5. Initial commit
git add .gitignore package.json package-lock.json
git commit -m "chore: initialize appdev workspace"
```

**Note:** The Generator extends .gitignore with tech-stack entries (e.g., `dist/`, `.env`) during its project setup. The seed .gitignore only covers harness infrastructure.

### Pattern 5: REGRESSION Rollback via Git Tags

**What:** When E-III or E-IV fires, roll back to the best previous round using git tags as recovery points.

**How:**
```bash
# appdev-cli returns best_round in its JSON response
git reset --hard appdev/round-{best_round}
```

**Important:** The regression commits remain reachable via their tags. The rollback preserves history while restoring a known-good state.

**Edge case:** If regression happens on round 2 (only round 1 exists), roll back to round 1. The orchestrator must handle the case where `best_round` might be the planning-complete state if round 1 also regressed (unlikely but handle gracefully).

### Pattern 6: GAN Ubiquitous Language Rename

**What:** All references to "QA" terminology are replaced with "evaluation" terminology.

**Mapping:**
| Old | New |
|-----|-----|
| QA-REPORT.md | EVALUATION.md |
| qa/ | evaluation/ |
| qa/round-N/ | evaluation/round-N/ |
| "QA round" | "evaluation round" |
| "QA feedback" | "Evaluator's feedback" |
| "build round" | "generation round" |
| "Building" | "Generating" |
| "QA engineer" | (remove from evaluator.md identity) |
| Bash(node *appdev-state*) | Bash(node *appdev-cli*) |

**Scope:** All agent definitions, SKILL.md, appdev-cli.mjs. Applied during the same edits that add git and loop features, not as a separate pass.

### Anti-Patterns to Avoid
- **Orchestrator parsing EVALUATION.md directly:** All score extraction and convergence logic belongs in appdev-cli. The orchestrator acts on JSON, not markdown.
- **Orchestrator adding convergence hints to agent prompts:** The prompt templates are minimal ("This is generation/evaluation round N."). No escalation context, no score history.
- **Using lightweight git tags for milestones:** Annotated tags are preferred for audit trail and `git describe` compatibility. Lightweight tags lack metadata.
- **Installing deprecated `playwright-cli` package:** Use `@playwright/cli` instead. The binary name is unchanged.
- **Giving Planner Bash access for git commits:** Keep Planner minimal (Read, Write). Orchestrator commits SPEC.md after the binary check.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score extraction from EVALUATION.md | Regex in SKILL.md prose | appdev-cli round-complete | Centralizes parsing logic; handles malformed reports gracefully; returns structured JSON |
| Convergence detection | If/else chains in SKILL.md | appdev-cli escalation computation | Complex 3-round window logic with multiple edge cases; belongs in testable code, not prose |
| Score trajectory formatting | Manual string building | appdev-cli get-trajectory | Consistent format; survives context compaction via state file |
| Git workspace detection | Inline bash conditionals | `git rev-parse --git-dir` | Standard git idiom; returns exit code 128 if not a repo |
| Playwright installation | System PATH dependency | `npm install --save-dev @playwright/cli` | Turn-key; no system dependency; `npx playwright-cli` fallback |

**Key insight:** The "dumb orchestrator" principle means all intelligence (score parsing, convergence detection, escalation classification) lives in appdev-cli.mjs. The orchestrator is a state machine that transitions based on JSON fields.

## Common Pitfalls

### Pitfall 1: Planner Cannot Commit (No Bash Access)
**What goes wrong:** CONTEXT.md says "Planner: `git add SPEC.md && git commit`" but Planner only has Read and Write tools.
**Why it happens:** The git commit decision was made without checking the Planner's existing tool allowlist.
**How to avoid:** Orchestrator commits SPEC.md after the binary check confirms it exists. This follows the "orchestrator owns milestones" pattern.
**Warning signs:** Planner agent fails or gets permission errors trying to run git commands.

### Pitfall 2: Deprecated playwright-cli Package
**What goes wrong:** `npm install --save-dev playwright-cli` installs a deprecated package that may not receive updates.
**Why it happens:** The old package name was used in CONTEXT.md.
**How to avoid:** Use `@playwright/cli` instead. Binary name (`playwright-cli`) is unchanged.
**Warning signs:** npm deprecation warnings during install.

### Pitfall 3: EVALUATION.md Parsing Fragility
**What goes wrong:** The score extraction regex breaks when the Evaluator formats the table slightly differently (extra spaces, different column order, markdown rendering variations).
**Why it happens:** LLM-generated markdown is not perfectly consistent.
**How to avoid:** Design robust parsing: match `Product Depth`, `Functionality`, `Visual Design`, `Code Quality` labels by name, extract `X/10` pattern from same row. Accept whitespace variations. Return error JSON (not crash) on parse failure.
**Warning signs:** appdev-cli returns error state when EVALUATION.md exists but scores are unparseable.

### Pitfall 4: Git Operations During Agent Execution
**What goes wrong:** Git operations fail because a dev server is running or files are locked.
**Why it happens:** Agents may have background processes running when they try to commit.
**How to avoid:** Agents should ensure no file locks before committing. Generator stops dev server before committing. Evaluator closes playwright-cli before committing.
**Warning signs:** `git add` fails with file lock errors.

### Pitfall 5: REGRESSION Rollback Destroys Uncommitted Work
**What goes wrong:** `git reset --hard appdev/round-N` discards any uncommitted changes.
**Why it happens:** If the Generator or Evaluator failed to commit their work before the regression was detected.
**How to avoid:** Regression detection happens AFTER the Evaluator commits its report. All agent work should be committed before appdev-cli round-complete runs. The orchestrator's loop structure ensures: Generator commits -> Evaluator commits -> appdev-cli analyzes -> rollback if needed.
**Warning signs:** Lost work after regression rollback.

### Pitfall 6: allowed-tools Pattern with Shell Operators
**What goes wrong:** Commands like `git add .gitignore && git commit -m "..."` don't match `Bash(git add *)` because the full command string includes `&&`.
**Why it happens:** Claude Code's Bash pattern matching checks the full command string, and shell operators make it not match the `git add *` prefix.
**How to avoid:** Run git commands as separate Bash calls, not chained with `&&`. Each `Bash(git add ...)` and `Bash(git commit ...)` is a separate tool call.
**Warning signs:** Permission denied errors when orchestrator tries compound git commands.

### Pitfall 7: Annotated Tag Requires Commit Message
**What goes wrong:** `git tag -a appdev/round-1` without `-m` opens an editor (which hangs in agent context).
**Why it happens:** Annotated tags require a message; without `-m`, git opens `$EDITOR`.
**How to avoid:** Always use `git tag -a appdev/round-1 -m "Round 1 complete"` with an inline message.
**Warning signs:** Agent or orchestrator hangs waiting for editor input.

### Pitfall 8: Round Number Off-by-One in Evaluation Path
**What goes wrong:** Generator in round N reads `evaluation/round-N/EVALUATION.md` instead of `evaluation/round-{N-1}/EVALUATION.md`.
**Why it happens:** The prompt says "This is generation round N" and the Generator derives the evaluation path from round number.
**How to avoid:** Generator agent definition must explicitly state: "Generation round N reads `evaluation/round-{N-1}/EVALUATION.md`". Make this a clear rule, not implied from round number math.
**Warning signs:** Generator reads nonexistent evaluation file or reads its own round's (not yet written) evaluation.

## Code Examples

### appdev-cli.mjs round-complete Subcommand (Score Extraction)
```javascript
// Source: Based on existing appdev-state.mjs patterns + CONTEXT.md decisions
function extractScores(reportPath) {
  const content = readFileSync(reportPath, "utf8");

  const scorePattern = /\|\s*(Product Depth|Functionality|Visual Design|Code Quality)\s*\|\s*(\d+)\/10/g;
  const scores = {};
  let match;

  while ((match = scorePattern.exec(content)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, "_");
    scores[key] = parseInt(match[2], 10);
  }

  if (Object.keys(scores).length !== 4) {
    return { error: "Could not extract all 4 scores from report" };
  }

  scores.total = scores.product_depth + scores.functionality
    + scores.visual_design + scores.code_quality;

  // Extract verdict
  const verdictMatch = content.match(/##\s*Verdict:\s*(PASS|FAIL)/);
  const verdict = verdictMatch ? verdictMatch[1] : null;

  if (!verdict) {
    return { error: "Could not extract verdict from report" };
  }

  return { scores, verdict };
}
```

### Escalation Level Computation
```javascript
// Source: CONTEXT.md escalation vocabulary decisions
function computeEscalation(rounds) {
  const current = rounds[rounds.length - 1];
  const prev = rounds.length > 1 ? rounds[rounds.length - 2] : null;
  const prevPrev = rounds.length > 2 ? rounds[rounds.length - 3] : null;

  // Round 1: always E-0
  if (!prev) {
    return { level: "E-0", label: "Progressing" };
  }

  const delta = current.scores.total - prev.scores.total;
  const prevDelta = prevPrev
    ? prev.scores.total - prevPrev.scores.total
    : null;

  // E-IV Catastrophic: >50% single-round drop OR total <= 5
  if (current.scores.total <= 5
    || (delta < 0 && Math.abs(delta) > prev.scores.total * 0.5)) {
    return { level: "E-IV", label: "Catastrophic" };
  }

  // E-III Regression: 2 consecutive declines
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

  // Edge case: improved by exactly 1 (not quite plateau without 3-round window)
  if (delta >= 0) {
    return { level: "E-I", label: "Decelerating" };
  }

  // Single decline (not 2 consecutive)
  return { level: "E-I", label: "Decelerating" };
}
```

### Exit Condition Determination
```javascript
// Source: CONTEXT.md exit condition behaviors
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

function findBestRound(rounds) {
  return rounds.reduce(function (best, r) {
    return r.scores.total > best.scores.total ? r : best;
  });
}
```

### Orchestrator Git Tag Pattern
```bash
# After planning complete (orchestrator creates tag)
git tag -a appdev/planning-complete -m "Planning complete: SPEC.md committed"

# After each round (orchestrator creates tag)
git tag -a appdev/round-1 -m "Round 1 complete"

# After final result (orchestrator creates tag)
git tag -a appdev/final -m "Final result"

# REGRESSION rollback (orchestrator executes)
git reset --hard appdev/round-3
```

### Workspace .gitignore Seed
```
# appdev harness infrastructure
.appdev-state.json
.playwright-cli/
node_modules/
```

## State of the Art

| Old Approach (Phase 1) | New Approach (Phase 2) | What Changes | Impact |
|-------------------------|------------------------|--------------|--------|
| appdev-state.mjs | appdev-cli.mjs | Rename + extend with round-complete (score extraction), get-trajectory, escalation computation | CLI becomes the brain; orchestrator becomes dumber |
| Bash(node *appdev-state*) | Bash(node *appdev-cli*) | allowed-tools pattern updated | All skill/agent references must change |
| QA-REPORT.md | EVALUATION.md | GAN language rename | All agent definitions, SKILL.md updated |
| qa/round-N/ | evaluation/round-N/ | Folder rename | Evaluator and Generator path references updated |
| Binary verdict check (PASS/FAIL) | appdev-cli JSON response | Orchestrator no longer reads EVALUATION.md for verdict | Single integration point: appdev-cli round-complete |
| 3-round fixed limit | 10-round cap with convergence detection | Loop logic completely rewritten | SKILL.md workflow section major rewrite |
| No git commits | Agents commit, orchestrator tags | New Step 0.5, agent git instructions | All agent definitions + SKILL.md updated |
| `playwright-cli` on system PATH | `@playwright/cli` as project devDependency | Turn-key installation | No system PATH dependency |
| "Build round N" prompt | "This is generation round N." prompt | Minimal prompts with GAN language | SKILL.md agent prompt protocol updated |

**Deprecated/outdated:**
- `appdev-state.mjs` filename: renamed to `appdev-cli.mjs`
- `QA-REPORT.md` filename: renamed to `EVALUATION.md`
- `qa/` folder: renamed to `evaluation/`
- `playwright-cli` npm package: deprecated, use `@playwright/cli`
- Fixed 3-round loop: replaced by convergence detection

## Open Questions

1. **GIT-01: How does the Planner commit SPEC.md?**
   - What we know: Planner has only Read and Write tools. CONTEXT.md says agents commit their own work.
   - What's unclear: Whether to add Bash to Planner or have orchestrator commit.
   - Recommendation: Orchestrator commits SPEC.md after binary check. Keeps Planner minimal. Document this as a deviation from CONTEXT.md's agent-commits-own-work principle, justified by tool surface minimization.

2. **REGRESSION rollback and evaluation folder state**
   - What we know: `git reset --hard appdev/round-N` rolls back all files. The evaluation/ folders from later rounds are in committed history.
   - What's unclear: After rollback, the evaluation/ folder for the best round exists, but later rounds' evaluation folders are gone. The state file (.appdev-state.json) is gitignored, so it survives the rollback.
   - Recommendation: appdev-cli returns `best_round` in JSON. Orchestrator uses best round's evaluation for summary. The state file in memory still has all rounds' scores for trajectory display.

3. **SAFETY_CAP wrap-up round numbering**
   - What we know: CONTEXT.md says "one extra wrap-up round beyond the cap (not counted toward 10)."
   - What's unclear: Is this round 11? Does it get a tag? Does the Evaluator write to `evaluation/round-11/`?
   - Recommendation: It is round 11 in numbering. It gets tag `appdev/round-11`. Evaluator writes to `evaluation/round-11/`. The appdev-cli tracks it as round 11 but marks it as `wrap_up: true` in state.

4. **E-IV threshold sensitivity**
   - What we know: CONTEXT.md says ">50% drop is the starting point, can adjust."
   - What's unclear: Whether 50% is the right threshold. A drop from 20 to 9 is 55% -- catastrophic. A drop from 10 to 4 is 60% -- also catastrophic. But a drop from 30 to 14 is 53% -- might be recoverable.
   - Recommendation: Start with >50% as defined. This is Claude's discretion per CONTEXT.md. Can be tuned after real-world runs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation + smoke tests (plugin behavior testing) |
| Config file | none -- plugin modifications are markdown/ESM, not a test-framework project |
| Quick run command | `node plugins/application-dev/scripts/appdev-cli.mjs get` |
| Full suite command | Manual: run `/application-dev` with test prompt, verify git log, tags, evaluation folders, and convergence behavior |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GIT-01 | Planner's SPEC.md committed to git | smoke | `git log --oneline -- SPEC.md` after test run | N/A |
| GIT-02 | Generator commits feature-by-feature | smoke | `git log --oneline` shows multiple Generator commits | N/A |
| GIT-03 | Generator updates .gitignore | smoke | `git grep "node_modules" .gitignore` | N/A |
| GIT-04 | Evaluator commits to evaluation/round-N/ | smoke | `git log --oneline -- "evaluation/"` | N/A |
| GIT-05 | Milestone tags exist | smoke | `git tag -l "appdev/*"` shows planning-complete, round-N, final | N/A |
| LOOP-01 | Score-based exit with plateau detection | unit | `node plugins/application-dev/scripts/appdev-cli.mjs round-complete --round 1 --report test-eval.md` (with test fixture) | No Wave 0 |
| LOOP-02 | 10-round safety cap | manual | Verify SKILL.md loop condition | N/A |
| LOOP-03 | Wrap-up on safety cap | manual | Verify SKILL.md SAFETY_CAP behavior | N/A |
| LOOP-04 | Four exit conditions | unit | Test appdev-cli with various score sequences | No Wave 0 |
| LOOP-05 | Escalation vocabulary | unit | Test appdev-cli escalation computation | No Wave 0 |
| LOOP-06 | Feature count watchdog | N/A | DEFERRED to Phase 3 | N/A |
| LOOP-07 | Fix-only mode in rounds 2+ | manual | Review generator.md for fix-only instructions | N/A |
| LOOP-08 | Context loading order | manual | Review generator.md for EVALUATION.md-before-SPEC.md instruction | N/A |
| LOOP-09 | Score trajectory tracking | unit | `node plugins/application-dev/scripts/appdev-cli.mjs get-trajectory` (with test state) | No Wave 0 |

### Sampling Rate
- **Per task commit:** Verify modified files parse correctly (YAML frontmatter, ESM syntax); run `node appdev-cli.mjs get` to confirm CLI still works
- **Per wave merge:** Run appdev-cli subcommands with test data; verify SKILL.md reads coherently end-to-end
- **Phase gate:** Full manual test: `/application-dev "Build a todo app"` -- verify git log shows agent commits, milestone tags, and convergence-based loop exit

### Wave 0 Gaps
- [ ] `scripts/appdev-cli.mjs` -- rename from appdev-state.mjs (covers CLI foundation for all LOOP-* requirements)
- [ ] Score extraction test: create a minimal EVALUATION.md fixture and verify `round-complete` parses it correctly
- [ ] Escalation computation test: run appdev-cli with multi-round state data and verify escalation levels
- [ ] Verify `Bash(node *appdev-cli*)` pattern works after rename (same pattern structure as Phase 1's `*appdev-state*`)
- [ ] Verify orchestrator `Bash(git tag -a *)` matches `Bash(git tag *)` allowed-tools pattern

## Sources

### Primary (HIGH confidence)
- Existing codebase: `plugins/application-dev/scripts/appdev-state.mjs` -- current CLI implementation to extend
- Existing codebase: `plugins/application-dev/skills/application-dev/SKILL.md` -- current orchestrator to modify
- Existing codebase: agent definitions (planner.md, generator.md, evaluator.md) -- current agents to modify
- [Claude Code permissions docs](https://code.claude.com/docs/en/permissions) -- Bash pattern matching syntax
- [npm registry: @playwright/cli](https://registry.npmjs.org/@playwright/cli) -- v0.1.1, Feb 2026, replacement for deprecated playwright-cli
- [npm registry: playwright-cli](https://registry.npmjs.org/playwright-cli) -- v0.262.0, deprecated

### Secondary (MEDIUM confidence)
- [Claude Code allowed-tools blog posts](https://ai.plainenglish.io/claude-code-will-do-anything-you-let-it-heres-how-to-control-what-that-is-f2037ff9f704) -- Bash pattern matching examples confirmed by multiple sources
- [Git tag best practices](https://safjan.com/git-annotated-vs-lightweight-tags/) -- annotated vs lightweight; annotated preferred for milestones
- Phase 1 Research and Summary documents -- established patterns and decisions

### Tertiary (LOW confidence)
- `Bash(git tag *)` pattern matching with `-a` flag -- not explicitly tested; should match since `*` matches any args after `git tag`
- E-IV threshold (>50% drop) -- starting point per CONTEXT.md, may need calibration after real runs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing code being extended or renamed
- Architecture: HIGH -- CONTEXT.md decisions are very prescriptive; minimal ambiguity
- Pitfalls: HIGH -- identified concrete issues (Planner tools, playwright-cli deprecation, pattern matching)
- Convergence logic: MEDIUM -- algorithm is well-defined but edge cases need runtime validation
- docs/ARCHITECTURE.md: MEDIUM -- content scope is Claude's discretion; no complex technical unknowns

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (30 days -- plugin system stable; @playwright/cli may release updates)
