# Architecture Patterns: v1.2 Integration Analysis

**Domain:** GAN-inspired autonomous application development plugin -- adding perturbation-critic, convergence hardening, enhanced critic dimensions, and architecture documentation
**Researched:** 2026-04-02
**Confidence:** HIGH (based on direct codebase analysis of all 30 shipped plugin files)

## Executive Summary

The v1.2 features integrate with the existing ensemble architecture at five distinct levels: (1) a new perturbation-critic agent that plugs into the existing parallel-spawn + CLI-aggregation pipeline, (2) convergence logic restructuring in appdev-cli.mjs that hardens the existing escalation/exit machinery, (3) dimension changes that affect the DIMENSIONS constant and score regex contract, (4) orchestrator loop changes for 3+ critics, and (5) architecture documentation as a new reference file within the plugin.

The critical insight is that the v1.1 ensemble architecture was explicitly designed for N-critic extensibility. The `compile-evaluation` subcommand already auto-discovers `*/summary.json` directories via `readdirSync` glob (verified in test-appdev-cli.mjs line 510-555, test: "should auto-discover any */summary.json directories (extensibility)"). Adding perturbation-critic requires no changes to compile-evaluation's discovery logic -- only to the DIMENSIONS constant and the orchestrator's critic spawn list.

The dependency chain for v1.2 is: DIMENSIONS constant changes first (affects regex contract, verdict computation, and all downstream consumers), then perturbation-critic agent definition (depends on new dimension name being in DIMENSIONS), then orchestrator loop updates (depends on critic agent existing), then convergence logic hardening (independent but should land after dimensions stabilize), then Generator improvements and architecture documentation (both independent).

---

## Question 1: Where Does perturbation-critic Fit in the Agent Spawn Sequence and CLI Aggregation?

### Current Agent Spawn Sequence (v1.1)

```
Orchestrator Step 2 Evaluation Phase:
  1. Update state: --step evaluate --critics perceptual,projection --round N
  2. Spawn in parallel:
     Agent("application-dev:perceptual-critic", "This is evaluation round N.")
     Agent("application-dev:projection-critic", "This is evaluation round N.")
  3. Binary checks: perceptual/summary.json, projection/summary.json
  4. compile-evaluation --round N  (auto-discovers both summaries)
  5. round-complete --round N      (extracts scores, computes verdict)
```

### Integration Point for perturbation-critic

**perturbation-critic spawns in parallel with the existing two critics.** It writes to `evaluation/round-N/perturbation/summary.json`. The compile-evaluation auto-discovery mechanism (`readdirSync` + `existsSync` for `summary.json`) will find it without modification.

Updated spawn sequence:

```
Orchestrator Step 2 Evaluation Phase (v1.2):
  1. Update state: --step evaluate --critics perceptual,projection,perturbation --round N
  2. Spawn in parallel:
     Agent("application-dev:perceptual-critic", "This is evaluation round N.")
     Agent("application-dev:projection-critic", "This is evaluation round N.")
     Agent("application-dev:perturbation-critic", "This is evaluation round N.")
  3. Binary checks: perceptual/summary.json, projection/summary.json, perturbation/summary.json
  4. compile-evaluation --round N  (auto-discovers all 3 summaries)
  5. round-complete --round N      (extracts scores including Robustness, computes verdict)
```

### Why Parallel Spawning Works

Each critic operates in an isolated context (~60K tokens max), evaluates the same static production build, and writes to its own subdirectory. Critics do not communicate with each other. The static-serve command is idempotent (verified in appdev-cli.mjs lines 855-861) -- all three critics can call it without conflict.

### CLI Aggregation Changes

**compile-evaluation needs no discovery logic changes** -- it already globs `*/summary.json`. However, the EVALUATION.md template assembly code needs awareness of the new Robustness dimension:

1. **DIMENSIONS constant** -- Add `{ name: "Robustness", key: "robustness", threshold: 6 }` (see Question 3)
2. **Assessment sections array** (lines 1336-1340 in appdev-cli.mjs) -- Add a Robustness entry mapping to the perturbation-critic
3. **Score table rows loop** (lines 1322-1333) -- Already iterates over DIMENSIONS constant; no change needed
4. **extractScores regex** (line 115) -- Built dynamically from DIMENSIONS.map(d => d.name).join("|"); no manual regex update needed

The v1.1 architecture's decision to build the regex from the DIMENSIONS constant (Pitfall 1 prevention from 07-RESEARCH.md) means adding a new dimension is a single-point change to the constant, not a multi-file regex migration.

### perturbation-critic Agent Definition

The perturbation-critic follows the same structural pattern as the existing critics:

| Aspect | perceptual-critic | projection-critic | perturbation-critic |
|--------|-------------------|-------------------|---------------------|
| Dimension scored | Visual Design | Functionality | Robustness |
| Primary technique | Visual inspection via playwright-cli screenshots/eval | Write-and-run acceptance tests via Playwright Test | Adversarial perturbation via viewport resizing, network throttling, rapid navigation, invalid inputs |
| GAN taxonomy | Perceptual (7.3) | Projection (3.3) | Perturbation (novel -- adversarial robustness testing) |
| Tool allowlist | Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(node *appdev-cli* check-assets *), Bash(node *appdev-cli* static-serve*) | Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(npx playwright test *), Bash(node *appdev-cli* static-serve*) | Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(npx playwright test *), Bash(node *appdev-cli* static-serve*) |
| Information barrier | No source code | No source code | No source code |
| Output directory | evaluation/round-N/perceptual/ | evaluation/round-N/projection/ | evaluation/round-N/perturbation/ |
| Token budget | ~60K | ~60K | ~60K |

### perturbation-critic Methodology

The perturbation-critic evaluates Robustness through adversarial interaction:

1. **UNDERSTAND** -- Read SPEC.md to identify features, expected error states, and graceful degradation requirements
2. **STRESS** -- Apply perturbations:
   - Viewport extremes (320px, 4K) via `npx playwright-cli viewport`
   - Rapid navigation (back/forward/reload sequences)
   - Console error monitoring under stress via `npx playwright-cli console error`
   - Invalid form inputs (empty submissions, XSS-like strings, extremely long values)
   - JavaScript disabled behavior (basic structure present without JS)
3. **PROBE** -- Test error recovery:
   - Network offline and slow network simulation
   - Missing asset handling (do broken images show fallback UI?)
   - Browser API unavailability (LanguageModel/WebGPU not present)
4. **SCORE** -- Apply Robustness ceiling rules from SCORING-CALIBRATION.md
5. **REPORT** -- Write `evaluation/round-N/perturbation/summary.json` with universal schema

### Finding ID Convention

Each critic uses a prefix for finding IDs: VD- (Visual Design), FN- (Functionality). The perturbation-critic uses **RB-** (Robustness) for finding IDs.

### Resume-Check Integration

The `resume-check` subcommand (lines 725-818) already reads `state.critics` to determine expected critic names. The orchestrator sets `--critics perceptual,projection,perturbation` in the state update. If perturbation-critic's summary.json is missing, resume-check returns `spawn-perturbation-critic` -- no code change needed because the logic is already generic:

```javascript
// Line 781 -- already generic: constructs action name from critic name
output({ next_action: "spawn-" + invalid[0] + "-critic", ... });
```

---

## Question 2: How Should Convergence Logic Be Restructured in appdev-cli.mjs?

### Current Convergence Logic (v1.1)

The convergence pipeline has three layers:

1. **computeVerdict(scores)** -- PASS if all dimensions meet thresholds
2. **computeEscalation(rounds)** -- E-0 through E-IV based on score trajectory
3. **determineExit(rounds, escalation, maxRounds)** -- 4 exit conditions

Current issues identified from the Dutch art museum test:

- **Plateau threshold (<=1 point over 3-round window)** may be too sensitive with 3 dimensions (max total 30, meaningful improvement delta is 1-2 points per dimension). With 4 dimensions (max total 40), a 1-point total improvement over 3 rounds is genuinely stagnant. But with more dimensions and the same <=1 threshold, natural variance could trigger false plateaus.
- **Escalation level E-I Decelerating** is assigned on single-round deltas, which can oscillate round-to-round
- **No per-dimension trajectory analysis** -- only total score is tracked for escalation, so a dimension going from 3 to 7 while another drops from 8 to 6 looks like flat total (misleadingly labeled E-II Plateau)

### Recommended Restructuring

#### 2a. Scale Plateau Threshold with Dimension Count

Replace the hardcoded `<= 1` threshold with a fraction of the maximum possible total:

```javascript
// Current (hardcoded)
if (windowDelta <= 1) {
  return { level: "E-II", label: "Plateau" };
}

// Proposed (scaled to dimension count)
const maxTotal = DIMENSIONS.length * 10;
const plateauThreshold = Math.ceil(maxTotal * 0.05);  // 5% of max total
// 3 dims (max 30): threshold = 2
// 4 dims (max 40): threshold = 2
// 5 dims (max 50): threshold = 3

if (windowDelta <= plateauThreshold) {
  return { level: "E-II", label: "Plateau" };
}
```

This ensures the plateau threshold scales with scoring capacity rather than being a magic number.

#### 2b. Per-Dimension Trajectory in State

Currently, `state.rounds[].scores` stores individual dimension scores, but `computeEscalation()` only examines `scores.total`. Add per-dimension trajectory analysis:

```javascript
function computeEscalation(rounds) {
  const current = rounds[rounds.length - 1];
  const prev = rounds.length > 1 ? rounds[rounds.length - 2] : null;
  const prevPrev = rounds.length > 2 ? rounds[rounds.length - 3] : null;

  if (!prev) {
    return { level: "E-0", label: "Progressing" };
  }

  const delta = current.scores.total - prev.scores.total;

  // E-IV Catastrophic: >50% single-round drop OR total below crisis threshold
  const maxTotal = DIMENSIONS.length * 10;
  const crisisThreshold = Math.ceil(maxTotal * 0.2);  // 20% of max

  if (current.scores.total <= crisisThreshold ||
      (delta < 0 && Math.abs(delta) > prev.scores.total * 0.5)) {
    return { level: "E-IV", label: "Catastrophic" };
  }

  // E-III Regression: 2 consecutive total-score declines
  const prevDelta = prevPrev ? prev.scores.total - prevPrev.scores.total : null;

  if (delta < 0 && prevDelta !== null && prevDelta < 0) {
    return { level: "E-III", label: "Regression" };
  }

  // E-II Plateau: scaled threshold over 3-round window
  const plateauThreshold = Math.ceil(maxTotal * 0.05);

  if (prevPrev) {
    const windowDelta = current.scores.total - prevPrev.scores.total;

    if (windowDelta <= plateauThreshold) {
      return { level: "E-II", label: "Plateau" };
    }
  }

  // E-I Decelerating: improved but delta shrinking
  if (delta > 0 && prevDelta !== null && delta < prevDelta) {
    return { level: "E-I", label: "Decelerating" };
  }

  // E-0 Progressing
  if (delta > 1) {
    return { level: "E-0", label: "Progressing" };
  }

  // Edge cases
  if (delta >= 0) {
    return { level: "E-I", label: "Decelerating" };
  }

  return { level: "E-I", label: "Decelerating" };
}
```

#### 2c. Enrich round-complete Output with Per-Dimension Status

Add per-dimension pass/fail status to the round-complete JSON response so the orchestrator (and the Generator via EVALUATION.md) can see which dimensions are failing:

```javascript
// In cmdRoundComplete(), add to result:
result.dimension_status = DIMENSIONS.map(function(d) {
  return {
    name: d.name,
    key: d.key,
    score: extracted.scores[d.key],
    threshold: d.threshold,
    pass: extracted.scores[d.key] >= d.threshold
  };
});
```

This is informational only -- the orchestrator does not act on per-dimension data (that would break the delegation principle). But it enriches the trajectory output for the Summary step.

#### 2d. get-trajectory Enhancement

Add dimension-level trajectory to get-trajectory so the Summary step can show which dimensions improved/regressed:

```javascript
// Per-round trajectory entry enrichment:
{
  round: r.round,
  total: r.scores ? r.scores.total : null,
  scores: r.scores,  // Include individual dimension scores
  escalation: r.escalation || null,
  escalation_label: r.escalation_label || null,
  verdict: r.verdict,
}
```

### Impact Analysis

| Function | Change Type | Risk |
|----------|-------------|------|
| computeEscalation() | Modify plateau threshold calculation | LOW -- existing tests verify behavior, new test for scaled threshold |
| computeVerdict() | No change (already iterates DIMENSIONS) | None |
| determineExit() | No change (consumes escalation level) | None |
| cmdRoundComplete() | Add dimension_status to output | LOW -- additive field |
| cmdGetTrajectory() | Add per-dimension scores to trajectory | LOW -- additive field |
| extractScores() | Regex auto-built from DIMENSIONS; total auto-summed | LOW -- governed by DIMENSIONS constant |

---

## Question 3: How Do Enhanced Critic Dimensions Affect DIMENSIONS Constant and Score Thresholds?

### Current DIMENSIONS Constant (v1.1)

```javascript
const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
];
```

Max total: 30. Thresholds sum: 20 (67% of max).

### v1.2 Dimension Changes

Two types of changes: (1) adding a new Robustness dimension for perturbation-critic, and (2) enhancing existing dimensions' scope without renaming them.

#### Option A: Add Robustness, Keep Existing Names

```javascript
const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
  { name: "Robustness", key: "robustness", threshold: 6 },
];
```

Max total: 40. Thresholds sum: 26 (65% of max).

#### Option B: Add Robustness and Rename Visual Design to Visual Coherence

The v1.1 ARCHITECTURE.md research (line 206-224) originally proposed renaming Visual Design to Visual Coherence to reflect the expanded scope (cross-page consistency, responsive coherence). This was deferred in v1.1 because the ensemble shipped with 3 dimensions, retiring Code Quality instead.

**Recommendation: Option A -- Add Robustness, keep Visual Design name.**

Rationale:
- The perceptual-critic already scores "Visual Design" and writes `"dimension": "Visual Design"` in its summary.json. Renaming creates a breaking change across the critic agent, summary.json contract, DIMENSIONS constant, EVALUATION-TEMPLATE regex-sensitive comments, SCORING-CALIBRATION.md, and test fixtures -- for no functional benefit.
- The enhanced scope (cross-page consistency) can be added to the perceptual-critic's methodology instructions without renaming the dimension. The dimension name "Visual Design" is broad enough to encompass visual coherence.
- Renaming was proposed when 4 dimensions were planned including "Visual Coherence" and "Robustness" (the original v1.1 research). The actual v1.1 shipped with 3 dimensions and "Visual Design." Renaming now would be gratuitous churn.

#### Robustness Threshold: 6

Robustness gets threshold 6 (same as Visual Design) because:
- It measures quality attributes (error handling, stability) not core functionality
- A strict threshold (7) would cause FAIL verdicts for apps that work correctly but have imperfect error handling -- punishing the Generator for edge cases while core features are unfinished
- The Anthropic harness design article prioritizes functional convergence; robustness is a secondary quality gate

### Impact on Score-Dependent Logic

| Concern | v1.1 (3 dims) | v1.2 (4 dims) | Code Change Needed |
|---------|----------------|----------------|-------------------|
| extractScores regex | `(Product Depth|Functionality|Visual Design)` | `(Product Depth|Functionality|Visual Design|Robustness)` | **None** -- regex is built from `DIMENSIONS.map(d => d.name).join("|")` (line 112-113) |
| Expected dimension count | 3 | 4 | **None** -- uses `DIMENSIONS.length` (line 128) |
| Total computation | max 30 | max 40 | **None** -- loops over DIMENSIONS (line 139-141) |
| computeVerdict | Checks 3 thresholds | Checks 4 thresholds | **None** -- loops over DIMENSIONS (line 150-157) |
| Plateau threshold | `<= 1` (hardcoded) | Should scale with max total | **Yes** -- see Question 2 |
| E-IV crisis threshold | `total <= 5` (hardcoded) | Should scale with max total | **Yes** -- see Question 2 |
| EVALUATION-TEMPLATE.md | 3 score rows | 4 score rows | **None** -- compiled by CLI from DIMENSIONS loop |
| Assessment sections | 3 sections | 4 sections | **Yes** -- add Robustness entry to `assessmentSections` array |

### Scoring Calibration Updates

SCORING-CALIBRATION.md needs new Robustness ceiling rules and calibration scenarios:

**Robustness Ceiling Rules:**

| Condition | Ceiling | Observable Signal |
|-----------|---------|-------------------|
| App crashes on valid user action | max 4 | Playwright console error + page unresponsive |
| >10 console errors on page load | max 5 | `npx playwright-cli console error` output |
| No error handling (crashes on invalid input) | max 5 | Submit empty forms, enter bogus data |
| Build fails (production build does not produce output) | max 3 | App cannot be served at all |
| Viewport < 320px renders blank/broken | max 5 | `npx playwright-cli viewport 320 800` + screenshot |
| Browser AI unavailable causes full app failure | max 4 | Test without LanguageModel API present |

**Robustness Calibration Scenarios** (abbreviated):

- **Below threshold (4/10):** App crashes when submitting an empty form, shows blank page at mobile viewport, >15 console errors on every page load, no error states shown anywhere.
- **At threshold (6/10):** App handles empty form gracefully (shows validation message), renders at mobile viewport with minor layout issues, <5 console errors, most error states show messages.
- **Above threshold (8/10):** App handles all invalid inputs gracefully, responsive down to 320px, zero console errors, comprehensive error states, graceful AI API degradation.

### Enhanced Visual Design Scope

The perceptual-critic's methodology is enhanced to include cross-page consistency checks without renaming the dimension:

- **Existing:** Design language match, AI slop detection, responsive testing at key breakpoints
- **New:** Cross-page element consistency (navigation, typography, spacing, color palette consistent across all pages), responsive identity preservation (design direction maintained at all breakpoints, not just layout adaptation)

These are instruction-level changes to perceptual-critic.md, not dimension name changes.

### Enhanced Functionality Scope

The projection-critic's methodology is enhanced to include deeper navigation testing:

- **Existing:** Write-and-run acceptance tests, AI probing, feature completeness
- **New:** Multi-step navigation sequences (A->B->A round-trip, deep link access, back button behavior), state persistence across navigation (create item, navigate away, return -- is it still there?)

These are instruction-level changes to projection-critic.md.

---

## Question 4: What Changes to the Orchestrator Loop Are Needed for 4+ Critics?

### Current Orchestrator Loop (SKILL.md)

The orchestrator evaluation phase is hardcoded for 2 critics:

1. `--critics perceptual,projection` in state update
2. Two `Agent()` calls in the spawn step
3. Two `ls` binary checks (one per critic)
4. Retry logic mentions "retry the SPECIFIC critic that failed (not both)"
5. Resume-check handles `spawn-both-critics`, `spawn-perceptual-critic`, `spawn-projection-critic`

### Required Changes

#### 4a. State Update -- Add perturbation to critics list

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs update --step evaluate --critics perceptual,projection,perturbation --round N)
```

#### 4b. Agent Spawn -- Add third parallel spawn

```
Agent(subagent_type: "application-dev:perceptual-critic", prompt: "This is evaluation round N.")
Agent(subagent_type: "application-dev:projection-critic", prompt: "This is evaluation round N.")
Agent(subagent_type: "application-dev:perturbation-critic", prompt: "This is evaluation round N.")
```

#### 4c. Binary Checks -- Add third check

```
Bash(ls evaluation/round-N/perceptual/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/projection/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/perturbation/summary.json 2>/dev/null)
```

#### 4d. Retry Logic -- Generalize for N critics

The current retry logic says "retry the SPECIFIC critic that failed (not both)". This generalizes naturally to: "if any critic's summary.json is missing, retry that specific critic with the same prompt."

The orchestrator text needs to be updated from:

> If either summary.json is missing, retry the SPECIFIC critic that failed (not both) with the same prompt.

To:

> If any summary.json is missing, retry each failed critic individually with the same prompt (do not retry critics that already produced valid summary.json). Each failed critic counts toward its own 2-retry limit.

#### 4e. SAFETY_CAP Wrap-Up Round -- Add third critic spawn

The SAFETY_CAP exit condition triggers a wrap-up round that re-spawns all critics. This must include the perturbation-critic.

#### 4f. Agent Prompt Protocol Section -- Add perturbation-critic

Add to the "Agent Prompt Protocol" section:

> **Perturbation Critic (all rounds):** `This is evaluation round N.` -- the orchestrator fills in only the round number.

#### 4g. Architecture Section -- Update from 4 to 5 agents

The "Architecture" section lists "Four agents with distinct roles." This becomes five:

- **Planner**: Expands the user's prompt into an ambitious product specification
- **Generator**: Builds the full application from the spec
- **Perceptual Critic**: Evaluates visual design quality from the product surface (scores Visual Design)
- **Projection Critic**: Evaluates functional coverage via write-and-run acceptance tests (scores Functionality, provides Product Depth test data)
- **Perturbation Critic**: Evaluates robustness via adversarial testing (scores Robustness)

#### 4h. File-Based Communication Section -- Add perturbation-critic artifact

Add:

> - `evaluation/round-N/perturbation/summary.json` -- Perturbation Critic writes per round, CLI reads it during compile-evaluation

#### 4i. Resume-Check Integration

The resume-check already handles N critics generically. With `--critics perceptual,projection,perturbation`, it will:
- Return `spawn-perturbation-critic` if only perturbation is missing
- Return `spawn-both-critics` if all 3 are missing (this naming becomes inaccurate with 3 critics)

**Naming issue:** The resume-check returns `spawn-both-critics` when all critics are missing. With 3 critics, this should be `spawn-all-critics`. The orchestrator dispatches on this action string, so both the CLI output and SKILL.md dispatch table need updating.

Current dispatch (line 775 of appdev-cli.mjs):
```javascript
if (invalid.length === expectedCritics.length) {
  output({ next_action: "spawn-both-critics", ... });
}
```

Should become:
```javascript
if (invalid.length === expectedCritics.length) {
  output({ next_action: "spawn-all-critics", ... });
}
```

And SKILL.md Step 0 dispatch table adds:
- `spawn-all-critics` -> Step 2 Evaluation Phase (spawn all critics)

### Summary of Orchestrator Changes

| Section | Change | Risk |
|---------|--------|------|
| Step 2 state update | Add "perturbation" to --critics | LOW |
| Step 2 spawn | Add third Agent() call | LOW |
| Step 2 binary checks | Add third ls check | LOW |
| Step 2 retry logic | Generalize language from "both" to "each failed" | LOW |
| SAFETY_CAP wrap-up | Add third critic spawn | LOW |
| Agent Prompt Protocol | Add perturbation-critic entry | LOW |
| Architecture section | Update from 4 to 5 agents | LOW |
| File-Based Communication | Add perturbation summary.json | LOW |
| Resume-check dispatch | Change spawn-both-critics to spawn-all-critics | MEDIUM -- affects resume behavior |

---

## Question 5: How Does Architecture Documentation Fit into the Plugin Structure?

### Placement

Architecture documentation belongs in the plugin's reference files:

```
plugins/application-dev/
  skills/application-dev/
    references/
      architecture-principles.md      # NEW -- GAN/Cybernetics/Turing test grounding
```

### Rationale

- Lives in `references/` because it is loaded on demand by agents who need architectural context (planner when designing specs, generator when making tech choices)
- Not in `agents/` (not an agent definition)
- Not in `scripts/` (not executable code)
- Not in `evaluator/` subdirectory (not evaluation-specific)
- Follows the progressive disclosure pattern: only loaded when an agent explicitly reads it

### Content Structure

The architecture documentation should ground the plugin's design in the theoretical principles it draws from:

1. **GAN Principles** -- How the Generator/Critic separation maps to GAN architecture, why information barriers exist, how convergence detection maps to GAN training stability
2. **Cybernetics** -- Damping principle (fix-only mode), requisite variety (multiple critics for multiple dimensions), feedback loop structure (score-based convergence vs round-counting)
3. **Turing Test Framing** -- Critics as interrogators, product surface as the evaluation boundary, behavioral symptom language as the communication protocol
4. **Ensemble Architecture** -- Why 3+ critics instead of 1 monolithic evaluator, how GMAN (12.1) aggregation works, why CLI is deterministic, how ProjectedGAN (7.1) uniform interface enables extensibility

### Loading Points

- **Planner** -- Could read architecture-principles.md to understand why the product spec matters (it is the GAN training objective). Optional -- only if spec quality issues recur.
- **Generator** -- Does not need to read it. The Generator operates independently of the evaluation architecture.
- **Critics** -- Do not need to read it. Their behavior is specified in their agent definitions.
- **Orchestrator** -- Does not read reference files (delegation-only role).
- **Users** -- Primary audience. The README.md can reference it for users who want to understand the design philosophy.

### Token Budget Impact

A well-written architecture reference file should be 150-250 lines (~3-5K tokens). This is comparable to existing reference files (SCORING-CALIBRATION.md is 198 lines, PLAYWRIGHT-EVALUATION.md is ~120 lines). Loaded on demand, not injected into every agent context.

---

## Component Boundaries: New vs Modified Components

### New Components

| Component | Type | Lines (est.) | Depends On |
|-----------|------|--------------|------------|
| `agents/perturbation-critic.md` | Agent definition | ~140 | DIMENSIONS constant (Robustness dimension), summary.json contract, SCORING-CALIBRATION.md ceiling rules |
| `references/architecture-principles.md` | Reference file | ~200 | None (documentation only) |

### Modified Components

| Component | Change Scope | Risk | Phases |
|-----------|-------------|------|--------|
| `scripts/appdev-cli.mjs` -- DIMENSIONS constant | Add Robustness entry | LOW -- single-point change, all consumers loop over DIMENSIONS | 1 |
| `scripts/appdev-cli.mjs` -- computeEscalation() | Scale plateau/crisis thresholds with dimension count | MEDIUM -- affects convergence behavior | 2 |
| `scripts/appdev-cli.mjs` -- cmdRoundComplete() | Add dimension_status to output | LOW -- additive field | 2 |
| `scripts/appdev-cli.mjs` -- cmdGetTrajectory() | Add per-dimension scores | LOW -- additive field | 2 |
| `scripts/appdev-cli.mjs` -- cmdCompileEvaluation() assessmentSections | Add Robustness entry | LOW -- follows existing pattern | 1 |
| `scripts/appdev-cli.mjs` -- cmdResumeCheck() | Change spawn-both-critics to spawn-all-critics | MEDIUM -- resume behavior | 3 |
| `skills/application-dev/SKILL.md` | Add perturbation-critic to spawn/check/retry/resume, update architecture section | MEDIUM -- orchestrator is central | 3 |
| `agents/perceptual-critic.md` | Enhance methodology for cross-page consistency | LOW -- instruction additions | 4 |
| `agents/projection-critic.md` | Enhance methodology for deeper navigation testing | LOW -- instruction additions | 4 |
| `agents/generator.md` | Vite+ adoption, dependency freshness, browser-agnostic LanguageModel | LOW -- instruction additions | 5 |
| `references/evaluator/SCORING-CALIBRATION.md` | Add Robustness ceiling rules and calibration scenarios | MEDIUM -- scoring contract | 1 |
| `references/evaluator/EVALUATION-TEMPLATE.md` | Add Robustness row to template | LOW -- template update | 1 |
| `scripts/test-appdev-cli.mjs` | Add tests for 4-dimension scoring, scaled plateau, perturbation summary | MEDIUM -- test coverage | 1-3 |

### Unchanged Components

| Component | Why Unchanged |
|-----------|---------------|
| `agents/planner.md` | No v1.2 planner changes |
| `commands/application-dev.md` | Command interface unchanged |
| `.claude-plugin/plugin.json` | Plugin manifest unchanged (unless description update desired) |
| `skills/browser-prompt-api/SKILL.md` | AI skill unchanged |
| `skills/browser-webllm/SKILL.md` | AI skill unchanged |
| `skills/browser-webnn/SKILL.md` | AI skill unchanged |
| `skills/playwright-testing/SKILL.md` | Testing skill unchanged |
| `skills/vitest-browser/SKILL.md` | Testing skill unchanged |
| `skills/vite-plus/SKILL.md` | Vite+ skill unchanged (Generator adoption is instruction-level) |
| `references/SPEC-TEMPLATE.md` | Spec template unchanged |
| `references/ASSETS-TEMPLATE.md` | Assets template unchanged |
| `references/acceptance-criteria-guide.md` | Criteria guide unchanged |
| `references/frontend-design-principles.md` | Design principles unchanged |
| `references/evaluator/AI-PROBING-REFERENCE.md` | AI probing unchanged |
| `references/evaluator/AI-SLOP-CHECKLIST.md` | Slop checklist unchanged |
| `references/evaluator/PLAYWRIGHT-EVALUATION.md` | Playwright patterns unchanged |

---

## Suggested Build Order

### Dependency Graph

```
[A] DIMENSIONS constant + scoring contract (appdev-cli.mjs, SCORING-CALIBRATION.md, EVALUATION-TEMPLATE.md)
  |
  +--> [B] perturbation-critic agent definition (depends on Robustness being in DIMENSIONS)
  |      |
  |      +--> [C] Orchestrator loop updates (depends on perturbation-critic agent existing)
  |
  +--> [D] Convergence logic hardening (depends on DIMENSIONS for scaled thresholds)

[E] Enhanced perceptual-critic (independent -- instruction additions to existing agent)

[F] Enhanced projection-critic (independent -- instruction additions to existing agent)

[G] Generator improvements (independent -- instruction additions to existing agent)

[H] Architecture documentation (independent -- new reference file)
```

### Recommended Phase Structure

**Phase 1: Scoring Foundation + Perturbation Critic Definition**

- Add Robustness to DIMENSIONS constant
- Add Robustness ceiling rules to SCORING-CALIBRATION.md
- Add Robustness calibration scenarios to SCORING-CALIBRATION.md
- Update EVALUATION-TEMPLATE.md (documentation only -- the CLI compiles the actual template)
- Add assessmentSections entry for Robustness in compile-evaluation
- Create perturbation-critic.md agent definition
- Add tests for 4-dimension scoring

Rationale: DIMENSIONS is the foundation. perturbation-critic bundles here because it is the primary consumer of the new dimension and can be tested in isolation.

**Phase 2: Convergence Logic Hardening**

- Scale plateau threshold with dimension count
- Scale E-IV crisis threshold with dimension count
- Add per-dimension status to round-complete output
- Enrich get-trajectory with per-dimension scores
- Add tests for scaled thresholds and new output fields

Rationale: Depends on DIMENSIONS being stable (Phase 1). Independent of orchestrator changes.

**Phase 3: Orchestrator Integration**

- Update SKILL.md evaluation phase for 3 critics
- Update resume-check (spawn-both-critics -> spawn-all-critics)
- Update error recovery text for N critics
- Update architecture section (4 -> 5 agents)
- Update file-based communication section
- Update agent prompt protocol section
- Update SAFETY_CAP wrap-up round

Rationale: Depends on perturbation-critic existing (Phase 1). This is the integration phase.

**Phase 4: Enhanced Existing Critics**

- Enhance perceptual-critic for cross-page Visual Coherence checks
- Enhance projection-critic for deeper A->B->A navigation testing

Rationale: Independent of Phases 1-3. Could run in parallel with Phase 2-3 but ordered here to avoid concurrent edits to critic agent files.

**Phase 5: Generator Improvements**

- Strengthen Vite+ adoption guidance
- Add dependency freshness instructions
- Add browser-agnostic LanguageModel guidance (not Chrome-specific)

Rationale: Fully independent. Generator operates independently of evaluation pipeline.

**Phase 6: Architecture Documentation**

- Create references/architecture-principles.md
- Ground in GAN, Cybernetics, and Turing test principles

Rationale: Fully independent. Documentation-only. Could be Phase 1 if desired for roadmap clarity.

### Phase Dependency Graph

```
Phase 1 --> Phase 2 (needs stable DIMENSIONS)
Phase 1 --> Phase 3 (needs perturbation-critic agent)
Phase 4 (independent -- can parallel with 2-3)
Phase 5 (independent -- can parallel with 1-5)
Phase 6 (independent -- can be anywhere)
```

### Parallel Execution Options

```
Track A (sequential): Phase 1 -> Phase 2 -> Phase 3
Track B (parallel):   Phase 4 (after Phase 1, or independent)
Track C (parallel):   Phase 5 (anytime)
Track D (parallel):   Phase 6 (anytime)
```

---

## Data Flow Diagram (v1.2)

```
User Prompt
    |
    v
Planner --> SPEC.md (with acceptance criteria per feature)
    |
    v
Generator (reads SPEC.md round 1, EVALUATION.md rounds 2+)
    |-- Builds application with Vite+ preference
    |-- Browser-agnostic LanguageModel for AI features
    |-- Commits feature-by-feature
    |-- Runs diagnostic battery (build, lint, typecheck, tests)
    |-- Records build_dir and spa via appdev-cli update
    '-- Hands off to evaluation ensemble
         |
         v
    +----+----+----+
    |         |         |
    v         v         v
perceptual  projection  perturbation
  critic      critic      critic
    |         |         |
    |  Visual |  Func   | Robust-
    |  Design |  tionality| ness
    |         |  + PD data|
    v         v         v
summary.json summary.json summary.json
    |         |         |
    '----+----+----+----'
         |
         v
    appdev-cli compile-evaluation
         |-- Reads all */summary.json (auto-discovery)
         |-- Computes Product Depth from acceptance_tests
         |-- Assembles scores table (4 dimensions)
         |-- Merges findings by severity
         |-- Writes EVALUATION.md
         |
         v
    appdev-cli round-complete
         |-- Extracts scores from EVALUATION.md (regex from DIMENSIONS)
         |-- Computes verdict mechanically (all dims >= thresholds)
         |-- Computes escalation (E-0 through E-IV, scaled thresholds)
         |-- Determines exit condition (PASS/PLATEAU/REGRESSION/SAFETY_CAP)
         '-- Returns JSON to Orchestrator
              |
              v
    Orchestrator (SKILL.md)
         |-- Acts on CLI JSON only
         |-- Tags rounds
         |-- Stops static servers between rounds
         '-- Loops or exits to Summary
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Dimension Count in Escalation Logic

**What:** Using magic numbers like `<= 1` for plateau threshold or `<= 5` for crisis threshold when the dimension count changes from 3 to 4.
**Why bad:** With 4 dimensions (max total 40), `total <= 5` is 12.5% of max. With 3 dimensions (max 30), it was 16.7%. The behavioral threshold changes meaning as dimensions scale.
**Prevention:** Derive all thresholds from `DIMENSIONS.length * 10`.

### Anti-Pattern 2: Renaming Visual Design to Visual Coherence

**What:** Changing the dimension name to reflect expanded scope.
**Why bad:** Multi-file breaking change (DIMENSIONS constant, summary.json contract, EVALUATION-TEMPLATE.md, SCORING-CALIBRATION.md, perceptual-critic.md, test fixtures) for no functional benefit. The scope expansion is an instruction-level change, not a contract change.
**Prevention:** Expand the perceptual-critic's methodology instructions. Leave the dimension name as "Visual Design."

### Anti-Pattern 3: compile-evaluation Dimension Hardcoding

**What:** Hardcoding dimension-specific logic in compile-evaluation instead of iterating over DIMENSIONS.
**Why bad:** Adding a 5th dimension in v2 requires another surgical edit.
**Prevention:** The current code already uses loops. Maintain this pattern when adding the Robustness assessment section. The `assessmentSections` array (lines 1336-1340) is the one place that maps dimension keys to source labels -- this is intentional (the mapping of which critic produces which dimension cannot be derived from the DIMENSIONS constant alone).

### Anti-Pattern 4: perturbation-critic Reading Source Code for Robustness Assessment

**What:** Allowing the perturbation-critic to read JavaScript files to assess error handling patterns.
**Why bad:** Violates the GAN information barrier. Robustness must be assessed through behavioral observation only.
**Prevention:** Tool allowlist excludes source file reading. All robustness signals come through playwright-cli (console errors, page crashes, visual inspection of error states, viewport behavior).

### Anti-Pattern 5: Orchestrator Diagnosing Which Critic to Spawn Based on Score Analysis

**What:** Orchestrator looking at scores to decide whether to re-spawn a specific critic for improvement.
**Why bad:** Violates the delegation principle. The orchestrator acts on binary file-exists checks and CLI JSON, not on qualitative assessment of scores.
**Prevention:** Retry logic remains purely binary: summary.json exists -> skip; missing -> respawn.

---

## Scalability Considerations

| Concern | v1.1 (3 dims, 2 critics) | v1.2 (4 dims, 3 critics) | Future (N dims, N critics) |
|---------|--------------------------|--------------------------|---------------------------|
| Parallel critic spawns | 2 Agent() calls | 3 Agent() calls | N Agent() calls -- Claude Code handles parallelism |
| Context per critic | ~60K tokens each | ~60K tokens each | ~60K tokens each -- independent contexts |
| compile-evaluation | Auto-discovers 2 summaries | Auto-discovers 3 summaries | Auto-discovers N summaries -- already generic |
| DIMENSIONS constant | 3 entries | 4 entries | N entries -- all consumers loop |
| Convergence thresholds | Hardcoded magic numbers | Scaled from DIMENSIONS.length | Already scaled -- no future changes needed |
| Resume-check | spawn-both-critics / spawn-{name}-critic | spawn-all-critics / spawn-{name}-critic | spawn-all-critics / spawn-{name}-critic -- already generic |
| Total context budget | 2 * 60K = ~120K for evaluation | 3 * 60K = ~180K for evaluation | N * 60K -- linear scaling |
| EVALUATION.md size | ~150 lines (3 assessment sections) | ~200 lines (4 assessment sections) | Linear with dimension count |

---

## Sources

### Primary (HIGH confidence)

- `plugins/application-dev/scripts/appdev-cli.mjs` (1525 lines) -- full CLI codebase analysis: DIMENSIONS constant (line 14-18), extractScores() regex construction (line 112-116), computeVerdict() (line 149-159), computeEscalation() (line 257-306), determineExit() (line 322-353), cmdCompileEvaluation() (line 1211-1380), cmdResumeCheck() (line 725-818)
- `plugins/application-dev/scripts/test-appdev-cli.mjs` (1331 lines) -- test suite including extensibility test (line 510-555: "should auto-discover any */summary.json directories")
- `plugins/application-dev/skills/application-dev/SKILL.md` (556 lines) -- orchestrator workflow, evaluation phase, resume logic, error recovery
- `plugins/application-dev/agents/perceptual-critic.md` (137 lines) -- Visual Design critic definition, tool allowlist, methodology
- `plugins/application-dev/agents/projection-critic.md` (189 lines) -- Functionality critic definition, write-and-run methodology
- `plugins/application-dev/agents/generator.md` (280 lines) -- Generator agent, fix-only mode, testing framework
- `plugins/application-dev/agents/planner.md` (109 lines) -- Planner agent, spec generation
- `plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md` (198 lines) -- ceiling rules, calibration scenarios
- `plugins/application-dev/skills/application-dev/references/evaluator/EVALUATION-TEMPLATE.md` (71 lines) -- template with regex-sensitive comments
- `.planning/research/ARCHITECTURE.md` (v1.1 analysis) -- dependency graph, build order, anti-patterns
- `.planning/milestones/v1.1-phases/07-ensemble-discriminator-architecture/07-RESEARCH.md` -- ensemble design patterns, summary.json contract, install-dep mutex
- `.planning/PROJECT.md` -- v1.2 target features, current state, design principles
