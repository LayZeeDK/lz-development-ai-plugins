# Architecture Patterns: v1.1 Integration Analysis

**Domain:** GAN-inspired autonomous application development plugin -- hardening after first real-world test
**Researched:** 2026-03-29
**Confidence:** HIGH (based on direct codebase analysis of all 8 core plugin files)

## Executive Summary

The v1.1 features fall into five integration categories: (1) SPEC-TEMPLATE.md extension for acceptance test plan, (2) verdict computation migration from Evaluator to CLI, (3) scoring dimension restructuring in EVALUATION-TEMPLATE.md and SCORING-CALIBRATION.md, (4) CLI subcommand changes for new data flow, and (5) Evaluator information barrier enforcement. Each category has a different blast radius -- from template-only changes (low risk) to data flow restructuring (medium risk). The critical dependency chain is: scoring dimensions first (changes the regex contract), then CLI verdict computation (depends on new dimensions), then template updates (propagate new contract), then agent updates (consume new templates).

All v1.1 changes are modifications to existing files. No new files are created. This is consistent with "hardening" -- the architecture is sound, the content needs refinement.

---

## Question 1: Where Does the Acceptance Test Plan Fit in SPEC-TEMPLATE.md?

### Current State

SPEC-TEMPLATE.md has these top-level sections (in order):
1. Overview
2. Visual Design Language
3. User Journey
4. Constraints and Non-Goals
5. Features (with user stories and data models per feature)
6. AI Integration
7. Non-Functional Considerations

The Evaluator currently derives its test oracle from SPEC.md: user stories, feature descriptions, and design language descriptions. There is no structured, machine-readable test plan -- the Evaluator invents its test strategy at runtime.

### Recommended Integration Point

**Add `## Acceptance Test Plan` as a new section between `## Features` and `## AI Integration`.**

Rationale:
- It depends on Features (tests verify features) so it must come after
- It is independent of AI Integration (AI features are also features with their own test criteria)
- Placing it before AI Integration keeps the "what to build" sections (Features) grouped before the "how to verify" section, then the "special implementation concerns" sections (AI, Non-Functional)

### Section Structure

The acceptance test plan should be Planner-authored, not Generator-authored. The Planner already understands the product domain and features. Acceptance criteria should be:
- **Feature-level**: one test plan entry per numbered feature
- **Behavioral**: describe what a user should be able to do, not implementation details
- **Measurable**: each criterion has a binary pass/fail outcome
- **Evaluator-consumable**: the Evaluator reads these as its structured test oracle instead of deriving tests ad hoc

```
## Acceptance Test Plan

For each feature, the acceptance criteria define the minimum bar for "Implemented" status
in the evaluation. A feature is Partial if some criteria pass but others fail. A feature
is Broken if the core criterion fails.

### 1. <Feature Name>

**Core criterion:** <The one thing that must work for this feature to count as functional>
**Additional criteria:**
- <Measurable acceptance criterion>
- <Measurable acceptance criterion>
- ...
```

### Impact on Existing Components

| Component | Change Type | Description |
|-----------|-------------|-------------|
| SPEC-TEMPLATE.md | **New section** | Add `## Acceptance Test Plan` section with per-feature structure |
| planner.md | **Modify** | Add instruction to populate acceptance test plan; add to self-verification checklist |
| evaluator.md | **Modify** | Step 1 (Understand the Spec): read acceptance test plan. Step 6 (Test Features): use acceptance criteria as structured test oracle |
| EVALUATION-TEMPLATE.md | **Modify** (minor) | Feature status table could reference acceptance criteria pass/fail counts |
| SKILL.md (orchestrator) | **No change** | Binary check ("SPEC.md contains `## Features`") does not need to check for test plan -- Planner self-verifies |

### Dependency

This is a **leaf change** -- it feeds into existing data flows but does not restructure them. Can be implemented independently of scoring or verdict changes.

---

## Question 2: How Does CLI Verdict Computation Change the Data Flow?

### Current Data Flow (v1.0)

```
Evaluator writes EVALUATION.md
  |-- Contains "## Verdict: PASS/FAIL" (Evaluator decides)
  |-- Contains scores table with per-criterion PASS/FAIL status
  '-- Evaluator computes verdict: FAIL if ANY criterion below threshold
       |
       v
appdev-cli.mjs extractScores()
  |-- Parses scores via regex: /\|\s*(Product Depth|...)\s*\|\s*(\d+)\/10/gi
  |-- Parses verdict via regex: /##\s*Verdict:\s*(PASS|FAIL)/
  '-- Returns { scores, verdict }
       |
       v
appdev-cli.mjs cmdRoundComplete()
  |-- Stores scores + verdict in state
  |-- Computes escalation (E-0 through E-IV)
  '-- Determines exit condition (PASS/PLATEAU/REGRESSION/SAFETY_CAP)
```

The problem: **The Evaluator decides its own verdict**, which is the fox guarding the henhouse. The Dutch art museum test showed the Evaluator passed at 28/40 (all 7s) after only 2 rounds. The Evaluator "anchored" scores to thresholds -- giving exactly 7/10 on each dimension to issue a PASS verdict.

### Proposed Data Flow (v1.1)

```
Evaluator writes EVALUATION.md
  |-- Contains scores table (Evaluator decides scores)
  |-- Contains per-criterion assessment (Evaluator's analysis)
  |-- Does NOT contain verdict (removed from Evaluator's responsibility)
  '-- May contain a "recommended verdict" but this is advisory only
       |
       v
appdev-cli.mjs extractScores()
  |-- Parses scores via regex (UPDATED for new dimension names)
  |-- Does NOT parse verdict from report
  '-- Returns { scores } (no verdict field from report)
       |
       v
appdev-cli.mjs cmdRoundComplete()
  |-- COMPUTES verdict mechanically from scores vs thresholds
  |-- Stores scores + computed verdict in state
  |-- Computes escalation
  '-- Determines exit condition
```

### Key Architectural Change

The **verdict computation moves from Evaluator to CLI**. This is a GAN principle enforcement: the discriminator (Evaluator) provides signal (scores), but the convergence decision (verdict) is made by the orchestration layer. The Evaluator cannot game the verdict by anchoring scores to thresholds because the thresholds are enforced mechanically in the CLI.

### Implementation Details

**appdev-cli.mjs changes:**

1. `extractScores()` -- Update regex pattern for new dimension names (see Question 3). Remove verdict parsing from this function. Return `{ scores }` only (no verdict).

2. Add `computeVerdict(scores)` function:
   ```javascript
   function computeVerdict(scores) {
     const thresholds = {
       product_depth: 7,
       functionality: 7,
       visual_coherence: 6,  // renamed from visual_design
       robustness: 6,        // renamed from code_quality
     };

     for (const [key, threshold] of Object.entries(thresholds)) {
       if (scores[key] < threshold) {
         return "FAIL";
       }
     }

     return "PASS";
   }
   ```

3. `cmdRoundComplete()` -- Use `computeVerdict(extracted.scores)` instead of `extracted.verdict`. The entry stored in `state.rounds[]` gets `verdict` from `computeVerdict()`, not from the report.

4. `determineExit()` -- Already consumes `current.verdict` from the rounds array. No change needed here because `cmdRoundComplete()` populates the array with the computed verdict.

**EVALUATION-TEMPLATE.md changes:**

- Remove `## Verdict: <PASS or FAIL>` heading
- Remove the `REGEX-SENSITIVE` comment about verdict parsing
- Keep the scores table (still regex-parsed)
- The `Status` column in the scores table (PASS/FAIL per criterion) remains -- this is informational for the Generator to know which dimensions need work

**evaluator.md changes:**

- Remove responsibility for computing overall verdict
- Remove self-verification check #8 ("Verdict is FAIL if any Core feature Missing/Broken") -- this rule moves to CLI threshold logic
- Remove self-verification check #9 ("Verdict is FAIL if >50% features Missing/Broken/Partial") -- this becomes a Product Depth ceiling rule in SCORING-CALIBRATION.md
- Evaluator still computes per-criterion PASS/FAIL status in the table (score vs threshold comparison is trivial and useful for the Generator)

**SKILL.md (orchestrator) changes:**

- Binary check for EVALUATION.md: change from checking for `## Verdict` to checking for `## Scores`
- No other orchestrator changes -- it already acts solely on CLI JSON output

### Risk Assessment

This is a **medium-risk structural change** because it modifies the data flow contract between Evaluator, CLI, and Orchestrator. However, the blast radius is contained: the Orchestrator already relies exclusively on CLI JSON (not the report), so removing the verdict from the report does not affect orchestration logic. The CLI simply computes what it previously read.

### Dependency

Depends on Question 3 (scoring dimension names must be finalized before regex patterns are updated in extractScores).

---

## Question 3: How Do New Scoring Dimensions Affect Templates and Calibration?

### Current Dimensions (v1.0)

| Dimension | Threshold | What It Measures |
|-----------|-----------|------------------|
| Product Depth | 7 | Feature completeness vs spec |
| Functionality | 7 | Does the app work when used? |
| Visual Design | 6 | Design identity matching spec |
| Code Quality | 6 | Code structure, patterns, security |

### Proposed Dimensions (v1.1)

| Dimension | Threshold | What It Measures | Change Type |
|-----------|-----------|------------------|-------------|
| Product Depth | 7 | Feature completeness vs spec | **Unchanged** |
| Functionality | 7 | Does the app work when used? | **Unchanged** |
| Visual Coherence | 6 | Expanded: design identity + cross-page consistency + responsive coherence | **Renamed + expanded** |
| Robustness | 6 | Replaces Code Quality: build stability, error handling, dependency health, test coverage | **Renamed + refocused** |

### Changes to EVALUATION-TEMPLATE.md

**Scores table:**
```markdown
| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Product Depth | X/10 | 7 | PASS/FAIL |
| Functionality | X/10 | 7 | PASS/FAIL |
| Visual Coherence | X/10 | 6 | PASS/FAIL |
| Robustness | X/10 | 6 | PASS/FAIL |
```

**REGEX-SENSITIVE comment update:**
```
<!-- REGEX-SENSITIVE: The following table is parsed by appdev-cli.mjs
     using the pattern /\|\s*(Product Depth|Functionality|Visual Coherence|Robustness)\s*\|\s*(\d+)\/10/gi
     Do not change the criterion names, column structure, or score format. -->
```

**Score Justifications table:** Update criterion names.

**Section renaming:**
- `## Visual Design Assessment` -> `## Visual Coherence Assessment`
- `## Code Quality Assessment` -> `## Robustness Assessment`

**New Visual Coherence Assessment scope:**
- Cross-page design consistency (does navigation, typography, spacing stay consistent across pages?)
- Responsive coherence (do breakpoints maintain design identity, not just layout?)
- Design language match with spec (existing from Visual Design)
- AI slop detection (existing)
- Cross-feature visual interaction (do features visually coexist, or does each look like a different app?)

**New Robustness Assessment scope:**
- Build health (does it compile, does the dev server start?)
- Error handling patterns (existing from Code Quality -- but assessed through behavioral observation)
- Dependency freshness (are dependencies current and non-deprecated?)
- Test coverage (does the Generator's test suite exist and pass?)
- Console error count (existing from separate section, now also scored here)
- Network error rate during normal usage
- Note: project structure and code organization assessment drops out because the GAN information barrier (Question 5 / feature [G]) prevents the Evaluator from reading source code

### Changes to SCORING-CALIBRATION.md

**Ceiling rules -- Visual Coherence** (renamed from Visual Design):

| Condition | Ceiling |
|-----------|---------|
| All images placeholder | max 3 |
| No design language match | max 5 |
| Layout broken on mobile | max 5 |
| Cross-page style inconsistency (>3 pages differ) | max 5 (new) |
| Responsive identity loss (design breaks at breakpoints) | max 5 (new) |

**Ceiling rules -- Robustness** (renamed from Code Quality):

| Condition | Ceiling |
|-----------|---------|
| Security vulnerability (observable: XSS, exposed secrets in network) | max 4 |
| Build fails (app does not start) | max 3 (new) |
| No test coverage at all | max 5 (new) |
| No error handling anywhere (observable: crashes on invalid input) | max 5 |
| >10 console errors on page load | max 5 (new) |
| All dependencies deprecated (observable: npm audit output) | max 5 (new) |
| Dead code >30% of codebase | REMOVED (requires source code reading, violates GAN barrier) |

**Calibration scenarios:** Need new scenarios for both renamed dimensions. The existing 12 scenarios for Visual Design and Code Quality provide starting structure but names, focus areas, and observable evidence must shift. This is the heaviest single editing task in v1.1.

### Changes to appdev-cli.mjs

**extractScores() regex update:**
```javascript
const scorePattern = /\|\s*(Product Depth|Functionality|Visual Coherence|Robustness)\s*\|\s*(\d+)\/10/gi;
```

**Key normalization update:**
```javascript
const key = match[1].toLowerCase().replace(/\s+/g, "_");
// Now produces: product_depth, functionality, visual_coherence, robustness
```

**Missing-dimension check update:**
```javascript
const expected = ["product_depth", "functionality", "visual_coherence", "robustness"];
```

**Total computation unchanged:** Still `scores.total = sum of 4 dimensions`.

### Changes to evaluator.md

- Step 12 rubric: rename dimension descriptions and expand scope
- Product Depth and Functionality descriptors unchanged
- Visual Coherence: expand descriptors to include cross-page consistency and responsive coherence
- Robustness: refocus descriptors entirely on behaviorally observable signals (build, tests, errors, dependency health)
- Remove all instructions that require reading Generator source code for Robustness scoring

### Risk Assessment

This is a **high-impact change** because it touches the regex parse contract (the most fragile part of the system). However, the change is mechanical -- regex pattern string update + key name update. The existing architecture (HTML comments marking regex-sensitive sections) makes this safe because the contract is explicitly documented inline and easy to find.

### Dependency

This is the **foundation change** -- verdict computation, evaluator scoring, and calibration all depend on the dimension names being finalized first.

---

## Question 4: What Changes to appdev-cli.mjs Subcommands Are Needed?

### Current Subcommands (v1.0)

| Subcommand | Purpose | Lines |
|------------|---------|-------|
| `init` | Create state file with prompt | 226-248 |
| `get` | Read and output state | 250-253 |
| `update` | Update step/round/status | 255-299 |
| `round-complete` | Extract scores, compute escalation, determine exit | 301-388 |
| `get-trajectory` | Output score trajectory | 390-417 |
| `complete` | Mark workflow complete | 419-441 |
| `delete` | Remove state file | 443-449 |
| `exists` | Check if state file exists | 451-453 |
| `check-assets` | Validate external asset URLs | 617-664 |

### Required Changes

#### `round-complete` (MODIFY -- major)

This subcommand undergoes the largest change because verdict computation moves here.

1. **Update `extractScores()`** -- New regex for dimension names (Visual Coherence, Robustness). Remove verdict extraction from report entirely.
2. **Add `computeVerdict(scores)` function** -- Mechanical verdict computation from scores vs thresholds. Returns PASS/FAIL.
3. **Update `cmdRoundComplete()`** -- Use `computeVerdict()` instead of `extracted.verdict`. Remove the error path for missing verdict in the report.
4. **Update score validation** -- Check for 4 new expected dimension names.

#### `init` (NO CHANGE for v1.1)

The session resume issue ("Orchestrator failed to detect completed steps on session resume") is an orchestrator logic bug, not a CLI data model bug. Current state shape already contains enough information for resume:

```json
{
  "prompt": "...",
  "step": "evaluate",  // <-- tells orchestrator where it was
  "round": 2,          // <-- tells orchestrator which round
  "status": "in_progress",
  "exit_condition": null,
  "rounds": [...]      // <-- tells orchestrator what completed
}
```

If `rounds` has N entries, rounds 1..N evaluation is complete. The `step` + `round` tells the orchestrator whether it was mid-generate or mid-evaluate when it crashed. The fix is in SKILL.md's Step 0 resume logic, not in the CLI.

#### No New Subcommands Needed

The existing subcommand surface is sufficient. The `round-complete` changes handle verdict computation. No new CLI capabilities are required.

### Subcommands NOT Affected

| Subcommand | Why Unchanged |
|------------|---------------|
| `get` | Reads state -- shape changes are backward-compatible (new dimension keys flow through automatically) |
| `update` | Step/round/status update -- no scoring involvement |
| `get-trajectory` | Reads from stored rounds -- new dimension names flow through automatically |
| `complete` | Exit condition marking -- no change |
| `delete` | File deletion -- no change |
| `exists` | Boolean check -- no change |
| `check-assets` | Asset URL validation -- no change |

---

## Question 5: Suggested Build Order Considering Dependencies

### Dependency Graph

```
[A] Scoring Dimensions (EVALUATION-TEMPLATE.md, SCORING-CALIBRATION.md)
  |
  +--> [B] CLI Verdict Computation (appdev-cli.mjs extractScores + computeVerdict)
  |      |
  |      +--> [D] Orchestrator Verdict Flow (SKILL.md binary check update)
  |      |
  |      +--> [E] Evaluator Agent Update (evaluator.md -- remove verdict, use new dims)
  |
  +--> [C] Evaluator Scoring Rubric (evaluator.md Step 12 descriptors, new dim focus)

[F] Acceptance Test Plan (SPEC-TEMPLATE.md + planner.md + evaluator.md test oracle)
    |-- Independent of [A]-[E]
    |-- Touches evaluator.md (Step 1 + Step 6) but different sections than [C]/[E]

[G] GAN Information Barrier (evaluator.md -- remove Step 10 code review)
    |-- Related to [C] (Robustness must be scorable without source code)
    |-- Should be done in same phase as [C] and [E]

[H] Session Resume Recovery (SKILL.md Step 0 logic)
    |-- Independent of all others
    |-- Touches SKILL.md but different section than [D]

[I] Generator Improvements (Vite+, dependency freshness, browser-agnostic AI, test style)
    |-- Independent of evaluation-side changes
    |-- generator.md modifications only

[J] Cross-Feature Interaction Testing (evaluator.md testing methodology)
    |-- Independent of scoring changes
    |-- Touches evaluator.md Step 6 but additive, not conflicting

[K] Edge-First Browser (evaluator.md browser preference)
    |-- Independent, tiny change
    |-- Touches evaluator.md Step 4
```

### Suggested Build Order

**Phase 1: Scoring Foundation** -- [A]
- Rename dimensions in EVALUATION-TEMPLATE.md
- Update regex-sensitive comments
- Rewrite ceiling rules in SCORING-CALIBRATION.md (add new ceilings, remove dead-code ceiling)
- Write new calibration scenarios for Visual Coherence and Robustness
- **Rationale:** Everything else in the scoring pipeline depends on dimension names being stable

**Phase 2: CLI Verdict Pipeline** -- [B] + [D]
- Update `extractScores()` regex pattern and expected dimensions
- Add `computeVerdict()` function with threshold table
- Update `cmdRoundComplete()` to use computed verdict, remove verdict parsing from report
- Update SKILL.md binary check from `## Verdict` to `## Scores`
- **Rationale:** Depends on Phase 1 dimension names; [D] is small enough to bundle with [B]

**Phase 3: Evaluator Overhaul** -- [C] + [E] + [G] + [J] + [K]
- Update Step 12 rubric descriptors for Visual Coherence and Robustness
- Remove verdict computation and associated self-verification checks
- Restructure/remove Step 10 (code review) -- GAN information barrier
- Refocus Robustness on behaviorally observable signals
- Add cross-feature interaction testing to Step 6
- Add Edge-first browser preference to Step 4
- Expand Visual Coherence to include cross-page consistency testing
- **Rationale:** All touch evaluator.md. Doing them together prevents 3-4 separate rewrites of a 392-line file. The GAN barrier and Robustness refocus are tightly coupled (Robustness must be scorable without source code).

**Phase 4: Spec and Planner Enhancement** -- [F]
- Add `## Acceptance Test Plan` section to SPEC-TEMPLATE.md
- Update planner.md to generate acceptance criteria per feature
- Update planner.md self-verification checklist
- Update evaluator.md Steps 1 and 6 to consume structured test plan
- **Rationale:** Independent leaf change. Evaluator.md touches are in different sections (Steps 1, 6) than Phase 3 changes (Steps 4, 6-methodology, 10, 12, 13, 14). The Step 6 overlap (testing methodology) can be managed by Phase 3 adding cross-feature interaction paragraphs and Phase 4 adding acceptance criteria consumption -- additive, not conflicting.

**Phase 5: Generator Improvements** -- [I]
- Stronger Vite+ adoption nudge
- Dependency freshness instruction
- Browser-agnostic LanguageModel API guidance (not Chrome-specific)
- Test style improvements
- **Rationale:** Generator is independent of evaluation pipeline changes

**Phase 6: Orchestrator Recovery** -- [H]
- Fix Step 0 resume logic in SKILL.md
- Add crash detection (state says "evaluate round 2" but no evaluation/round-2/ exists)
- Add step completion inference from filesystem state + rounds array
- **Rationale:** Lowest dependency, lowest priority (UX polish, not quality gate)

### Phase Dependency Graph

```
Phase 1 --> Phase 2 --> Phase 3
                          |
Phase 4 (independent) ----' (minor Step 6 coordination)
Phase 5 (independent)
Phase 6 (independent)
```

### Parallel Execution Options

If parallelization is desired (config.json has `"parallelization": true`):

```
Track A (sequential): Phase 1 -> Phase 2 -> Phase 3
Track B (parallel):   Phase 4 (after Phase 3 completes, or coordinate Step 6)
Track C (parallel):   Phase 5 (anytime)
Track D (parallel):   Phase 6 (anytime)
```

Tracks C and D can run fully in parallel with Track A. Track B can start anytime but should merge after Track A completes to avoid evaluator.md conflicts.

---

## Component Boundary Analysis

### Files Modified (No Files Created)

| File | Change Scope | Phases |
|------|-------------|--------|
| EVALUATION-TEMPLATE.md | Rename dimensions, remove verdict heading, update sections | 1, 2 |
| SCORING-CALIBRATION.md | Rename dimensions, add/remove ceiling rules, new scenarios | 1 |
| appdev-cli.mjs | Update regex, add computeVerdict(), update key names | 2 |
| SKILL.md | Update binary check, fix resume logic | 2, 6 |
| evaluator.md | Remove verdict, update rubric, add info barrier, update test oracle, add cross-feature testing | 3, 4 |
| planner.md | Add acceptance test plan generation | 4 |
| generator.md | Vite+ nudge, dependency freshness, browser-agnostic AI | 5 |
| SPEC-TEMPLATE.md | Add Acceptance Test Plan section | 4 |

### Cross-File Contract Changes

| Contract | v1.0 | v1.1 | Files Affected |
|----------|------|------|----------------|
| Score dimension names | Product Depth, Functionality, Visual Design, Code Quality | Product Depth, Functionality, Visual Coherence, Robustness | EVALUATION-TEMPLATE.md, SCORING-CALIBRATION.md, appdev-cli.mjs, evaluator.md |
| Verdict location | In EVALUATION.md (Evaluator writes) | In CLI (computed from scores) | EVALUATION-TEMPLATE.md, appdev-cli.mjs, evaluator.md, SKILL.md |
| Orchestrator binary check | `## Verdict` in EVALUATION.md | `## Scores` in EVALUATION.md | SKILL.md |
| Test oracle | Ad hoc from SPEC.md features/user stories | Structured acceptance criteria in SPEC.md | SPEC-TEMPLATE.md, planner.md, evaluator.md |
| Evaluator code access | Reads source code (Step 10) | No source code access (GAN barrier) | evaluator.md |

### Data Flow Diagram (v1.1)

```
User Prompt
    |
    v
Planner --> SPEC.md (now includes Acceptance Test Plan)
    |
    v
Generator (reads SPEC.md round 1, EVALUATION.md rounds 2+)
    |-- Builds application
    |-- Commits feature-by-feature
    |-- Runs diagnostic battery
    '-- Hands off to Evaluator
         |
         v
Evaluator (reads SPEC.md + runs app via playwright-cli)
    |-- NO source code access (GAN information barrier)
    |-- Tests against acceptance criteria from SPEC.md
    |-- Tests cross-feature interactions
    |-- Scores: Product Depth, Functionality, Visual Coherence, Robustness
    |-- Does NOT compute overall verdict
    '-- Writes evaluation/round-N/EVALUATION.md (scores + assessment)
         |
         v
appdev-cli.mjs round-complete
    |-- Extracts scores (regex on new dimension names)
    |-- COMPUTES verdict (scores vs thresholds -- mechanical)
    |-- Computes escalation (E-0 through E-IV)
    '-- Returns JSON to Orchestrator
         |
         v
Orchestrator (SKILL.md)
    |-- Acts on CLI JSON only (exit_condition, should_continue)
    |-- Tags rounds
    '-- Loops or exits to Summary
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Partial Regex Contract Migration

**What:** Updating dimension names in EVALUATION-TEMPLATE.md but forgetting to update the regex in appdev-cli.mjs (or vice versa).
**Why bad:** extractScores() returns `{ error: "Could not extract all 4 scores" }`, treated as Evaluator failure, triggers infinite retry loop.
**Prevention:** Phase 1 and Phase 2 must be treated as an atomic contract change. Update template + regex + expected keys together. Test with a mock EVALUATION.md containing the new dimension names.
**Detection:** Run appdev-cli.mjs unit tests (7 existing from v1.0 check-assets) -- add regression tests for extractScores() with new dimension names.

### Anti-Pattern 2: Evaluator Still Computing Verdict

**What:** Removing the `## Verdict:` heading from the template but leaving verdict computation logic in evaluator.md self-verification.
**Why bad:** Evaluator fails self-verification because it cannot write a verdict heading that no longer exists in the template. Or worse, Evaluator writes the heading anyway (ignoring the template) and CLI parses it, defeating the purpose.
**Prevention:** Phase 3 removes verdict from evaluator.md self-verification checks entirely. The Evaluator should not reference overall verdict at all -- only per-criterion PASS/FAIL status in the scores table.

### Anti-Pattern 3: Information Barrier Leaks

**What:** Removing Step 10 (code review) but leaving source-code-dependent instructions elsewhere in evaluator.md.
**Why bad:** Evaluator still reads source code through instructions like "Check for dead code, TODOs, stubs" (currently in Step 10, but also referenced in Step 11 listing). The GAN barrier is undermined.
**Prevention:** Audit ALL evaluator.md steps for any instruction that requires reading the Generator's source files. The only legitimate code reading is the Evaluator reading its OWN evaluation artifacts (evaluation/round-N/). Robustness must be scorable entirely through behavioral observation.
**Specific risk spots:**
- Step 10 (Code Review) -- primary target, must be removed or restructured
- Step 11 (List All Findings) mentions "Code quality observations" -- rename to "Robustness observations"
- Step 14 self-verification -- remove any checks that reference code structure

### Anti-Pattern 4: Robustness Without Observable Signals

**What:** Renaming Code Quality to Robustness but keeping the same code-inspection assessment approach.
**Why bad:** Robustness measured by reading source code violates the GAN information barrier.
**Prevention:** Define the Robustness rubric entirely in terms of observable signals:
1. Build success/failure (`npm run build` output)
2. Console error count (playwright-cli console output)
3. Test suite pass/fail (`npm test` output -- Evaluator can run tests without reading test code)
4. Dependency audit (`npm audit` output)
5. Network error count during feature testing
6. Crash/freeze behavior during normal and edge-case usage
7. Error handling quality (how does the app respond to invalid input, empty states, network failures?)
All of these are observable through Bash commands and playwright-cli, without reading a single source file.

---

## Scalability Considerations

| Concern | v1.0 | After v1.1 | Future |
|---------|------|------------|--------|
| Score dimensions | 4 hardcoded in regex + CLI | 4 with new names -- still hardcoded | Consider dimensions config file or JSON schema for extensibility |
| Verdict logic | In Evaluator (distributed) | In CLI (centralized) -- better for consistency | CLI is the right long-term home |
| Test oracle | Ad hoc from SPEC.md | Structured acceptance criteria in SPEC.md | Could evolve into separate TEST-PLAN.md if specs grow large |
| Template validation | Regex-based | Regex-based | Consider JSON sidecar for scores (EVALUATION.json alongside EVALUATION.md) for reliability |
| GAN barrier | Evaluator reads source | Evaluator behavioral-only | Barrier could be tool-enforced with PreToolUse hooks in v2 |

---

## Sources

- Direct codebase analysis of all 8 core plugin files (HIGH confidence):
  - SKILL.md (415 lines) -- orchestrator workflow and data flow
  - appdev-cli.mjs (709 lines) -- CLI state management, score extraction, escalation, exit logic
  - SPEC-TEMPLATE.md (86 lines) -- current spec section structure
  - EVALUATION-TEMPLATE.md (199 lines) -- current evaluation structure with regex-sensitive comments
  - SCORING-CALIBRATION.md (230 lines) -- current ceiling rules, calibration scenarios, conflict resolution
  - evaluator.md (392 lines) -- 15-step evaluation workflow, self-verification, scoring rubric
  - planner.md (98 lines) -- planning workflow, self-verification
  - generator.md (253 lines) -- build process, fix-only mode, testing decision framework
- STATE.md -- v1.1 context: Dutch art museum test issues (threshold anchoring, GAN violation, resume failure)
- RETROSPECTIVE.md -- v1.0 lessons: template extraction value, research-before-planning, audit catches real issues
- PROJECT.md -- v1.1 target features list, design principles, constraints
