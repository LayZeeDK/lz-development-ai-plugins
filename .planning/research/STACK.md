# Stack Research: v1.1 Hardening

**Domain:** Claude Code plugin -- autonomous application development (GAN-inspired)
**Researched:** 2026-03-29
**Confidence:** HIGH (verified against official docs and npm registry)

This research covers ONLY the stack additions/changes needed for v1.1 hardening
features. The existing v1.0 stack (plugin system, agent definitions, appdev-cli.mjs,
six bundled skills) is validated and not re-researched.

## Recommended Stack Additions

### 1. Convergence Logic Hardening (appdev-cli.mjs)

**No new npm dependencies needed.** Use `simple-statistics` only if the
implementation proves unwieldy with inline code. The convergence logic runs in
appdev-cli.mjs which is a zero-dependency Node.js script today -- keeping it
dependency-free is preferred.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js built-in `Math` | N/A | Z-score, IQR, standard deviation | The formulas are trivial (5-15 lines each). Adding a dependency for `zScore = (x - mean) / stdDev` is over-engineering. appdev-cli.mjs already computes deltas and trajectories without dependencies. |
| `simple-statistics` | 7.8.8 | Fallback if stats code grows beyond ~50 lines | Zero-dependency, 316 npm dependents, well-tested. Provides `zScore()`, `standardDeviation()`, `mean()`, `interquartileRange()`, `quantile()`, `medianAbsoluteDeviation()`. Only adopt if cross-validation or anomaly detection logic exceeds inline complexity threshold. |

#### Anomaly Detection Strategy (inline, no dependencies)

The v1.1 convergence hardening needs three statistical capabilities:

1. **Cross-validation of scores:** Detect when an Evaluator anchors all dimensions
   to the same value (the 7/7/7/7 mode collapse from the Dutch art museum test).
   Implementation: compute standard deviation of the 4 dimension scores. If
   `stdDev < 0.5` for any round, flag as potential anchoring. This is one line of
   math, not a library call.

2. **Rising thresholds:** Ensure minimum improvement per round. Already partially
   implemented via escalation levels (E-0 through E-IV). Enhancement: enforce
   minimum rounds before PASS (e.g., round 1 cannot PASS even with all thresholds
   met -- the first evaluation is uncalibrated). This is a simple `if` guard, no
   statistics.

3. **Anomaly detection on score trajectory:** Flag suspicious patterns like
   a score jumping from 3 to 9 in one round (likely hallucinated evaluation).
   Implementation: compute z-score of the latest delta against the trajectory's
   mean delta. Flag if `|z| > 2.0`. Formula: `z = (delta - meanDelta) / stdDevDelta`.
   Requires >= 3 rounds of data.

All three are 5-15 lines of inline JavaScript. The z-score formula:
```javascript
function zScore(value, values) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n);

  if (stdDev === 0) {
    return 0;
  }

  return (value - mean) / stdDev;
}
```

**Decision: Do NOT add `simple-statistics` unless the implementation grows beyond
50 lines of stats code.** The current appdev-cli.mjs pattern is zero-dependency
Node.js -- this is a strength for a distributed plugin where users install via
git clone. Every dependency is friction.

### 2. Playwright CLI for Acceptance Test Execution

The plugin already depends on `@playwright/cli` (installed in Step 0.5). The
v1.1 changes are about how it is used, not what is installed.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@playwright/cli` | 0.1.1+ (latest) | Evaluator browser automation, acceptance test execution | Already a dependency. Token-efficient (27K vs 114K tokens for MCP). Saves snapshots/screenshots to disk. Evaluator already uses it extensively (Steps 5-8). |
| `@playwright/test` | 1.58+ (latest) | Generator writes e2e tests, Evaluator can execute acceptance test plans | Already recommended in playwright-testing skill. Provides `expect()`, test runner, config. Used by Generator for e2e tests, can be used by Evaluator for acceptance test plan execution. |

#### Acceptance Test Plan Execution Architecture

The v1.1 feature "acceptance test plan in SPEC.md" works as follows:

- **Planner** writes abstract acceptance scenarios in SPEC.md (Given/When/Then
  or similar structured format)
- **Evaluator** translates these into concrete playwright-cli commands at
  evaluation time and executes them

This does NOT require any new packages. The Evaluator already has Bash access
and uses `npx playwright-cli` commands (click, fill, snapshot, screenshot, etc.)
to interact with the running app. The acceptance test plan is a structured
section in SPEC.md that the Evaluator reads and operationalizes.

**No changes to npm dependencies needed for acceptance test execution.**

#### playwright-cli Browser Channel for Edge

The Evaluator currently defaults to Chrome/Chromium. For Edge-first testing:

```bash
# Method 1: CLI flag
npx playwright-cli open --browser=msedge http://localhost:5173

# Method 2: Configuration file (.playwright-cli/config.json)
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "channel": "msedge"
    }
  }
}
```

The `PLAYWRIGHT_MCP_BROWSER=msedge` environment variable may also work but is
not documented for `@playwright/cli` specifically (it is documented for
`@playwright/mcp`). Prefer the `--browser=msedge` flag or config file approach.

For Playwright Test (Generator's e2e tests), Edge channel is configured in
`playwright.config.ts`:

```typescript
projects: [
  {
    name: 'Microsoft Edge',
    use: { ...devices['Desktop Edge'], channel: 'msedge' },
  },
],
```

### 3. Edge Browser for AI Features

**No new npm packages needed.** The change is in how skills reference the
LanguageModel API across browsers.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Microsoft Edge (Canary/Dev) | 138.0.3309.2+ | On-device AI via Prompt API with Phi-4-mini | First browser with documented Phi-4-mini integration. Same LanguageModel API as Chrome (W3C WebML CG standard). Prompt API in Edge supports structured output, tool use, streaming. |
| `@types/dom-chromium-ai` | Latest | TypeScript types for LanguageModel API | Already referenced in browser-prompt-api skill. Works for both Chrome and Edge since they share the same API surface. |

#### LanguageModel API: Browser-Agnostic Pattern

The existing `browser-prompt-api` skill already documents the LanguageModel API
correctly. The skill notes Edge as "not yet documented" -- this has changed.
Edge now has official documentation (learn.microsoft.com/en-us/microsoft-edge/
web-platform/prompt-api, updated 2026-02-04).

Key update for v1.1: The LanguageModel API is the SAME across Chrome and Edge.
Same `LanguageModel.availability()`, same `LanguageModel.create()`, same
`session.prompt()` / `session.promptStreaming()`. The underlying model differs
(Gemini Nano on Chrome, Phi-4-mini on Edge) but the API surface is identical.
This is by design -- both implement the W3C Web Machine Learning CG proposal at
github.com/webmachinelearning/prompt-api.

**v1.1 action:** Update browser-prompt-api skill to document Edge as officially
supported (not "not yet documented"), add Edge hardware requirements (5.5 GB
VRAM, 20 GB storage), and note the `edge://flags/#prompt-api-for-phi-mini`
setup step.

#### Edge-Specific Requirements

| Requirement | Chrome | Edge |
|-------------|--------|------|
| Min version | 138+ | 138.0.3309.2+ |
| Channel | Stable (extensions), Origin trial (web) | Canary or Dev only |
| Model | Gemini Nano | Phi-4-mini (3.5B params) |
| Storage | ~22 GB | >= 20 GB |
| GPU VRAM | >= 4 GB | >= 5.5 GB |
| Setup | chrome://flags | edge://flags, edge://on-device-internals |
| Inference | GPU | GPU (NPU planned, not yet active) |

### 4. Scoring Analysis Tools

**No new npm packages needed.** The scoring analysis is part of appdev-cli.mjs
convergence logic hardening (Section 1 above).

| Analysis Need | Implementation | Why Not a Library |
|---------------|---------------|-------------------|
| Score variance across dimensions | `stdDev` of 4 scores (1 line) | Trivial math |
| Score trajectory anomaly detection | Z-score of latest delta (5 lines) | Single formula |
| Cross-validation (dimension independence) | Pairwise correlation check (10 lines) | Only 4 dimensions, 6 pairs |
| Minimum round enforcement | Conditional guard in `determineExit()` | Boolean logic, not statistics |
| Rising thresholds | Round-indexed threshold lookup | Array indexing |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `simple-statistics` (as initial dependency) | Over-engineering for 5-15 lines of inline math. Adds npm dependency to a zero-dependency CLI script. Plugin users install via git clone -- every dependency is friction. | Inline z-score, stdDev, mean functions in appdev-cli.mjs |
| `@playwright/mcp` | MCP is 4x more token-expensive than CLI (114K vs 27K tokens). The plugin already uses CLI. MCP's persistent state model conflicts with the Evaluator's per-round evaluation pattern. | `@playwright/cli` (already installed) |
| `mathjs` | 500 KB, massive scope (matrices, complex numbers, units). Absurd for computing z-scores on arrays of 4-10 numbers. | Inline statistics in appdev-cli.mjs |
| `outlier-detection` / `anomalib` / similar ML libraries | Machine learning anomaly detection is overkill. We have at most 10 rounds of 4 scores each. Classical statistics (z-score, IQR) is the right tool. | Inline z-score with threshold |
| `@playwright/test` as new dependency | Already recommended in the playwright-testing skill and installed by the Generator. Evaluator does not need it -- Evaluator uses playwright-cli commands, not Playwright Test runner. | `npx playwright-cli` (already installed) |
| Separate scoring analysis package/script | Fragmentation. All convergence logic belongs in appdev-cli.mjs where it is already centralized. | New subcommands in appdev-cli.mjs |
| `puppeteer` | Playwright is the standard. Plugin already depends on it. Puppeteer is Chrome-only, no Edge channel support as clean as Playwright's. | `@playwright/cli` |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Inline z-score/stdDev in appdev-cli.mjs | `simple-statistics` 7.8.8 | If convergence logic grows beyond ~50 lines of statistics code. Milestone: when adding IQR-based outlier removal, MAD, or linear regression to trajectory analysis. |
| `@playwright/cli --browser=msedge` | `PLAYWRIGHT_MCP_BROWSER=msedge` env var | If the Evaluator workflow switches from CLI to MCP (unlikely -- CLI is 4x more token-efficient). |
| Edge Canary/Dev for AI features | Chrome Stable + extensions | When AI features do not require Phi-4-mini specifically, or when target users are on Chrome. The LanguageModel API is the same -- only the model differs. |
| `@types/dom-chromium-ai` for TS types | Manual type declarations | Never -- the community types package tracks the W3C spec and covers both Chrome and Edge. |

## Stack Patterns by Feature

**If implementing CLI-decided verdict (moving verdict from Evaluator to CLI):**
- No new dependencies. Enhance `round-complete` subcommand in appdev-cli.mjs to
  compute verdict from scores + thresholds instead of parsing `## Verdict:` from
  EVALUATION.md. The Evaluator still writes scores; the CLI decides PASS/FAIL.

**If implementing minimum rounds before PASS:**
- No new dependencies. Add `minRounds` parameter to `determineExit()` in
  appdev-cli.mjs. Guard: `if (round < minRounds) return { should_continue: true }`.

**If implementing score anomaly detection:**
- No new dependencies (see Section 1). Add `detectAnomaly()` function to
  appdev-cli.mjs. Called from `round-complete` after score extraction.
  Returns `{ anomaly: boolean, reason: string }`.

**If implementing cross-validation of dimension scores:**
- No new dependencies. Add `detectAnchoring()` function to appdev-cli.mjs.
  Computes stdDev of the 4 dimension scores. If < 0.5, warns of potential
  score anchoring. This is one line of math.

**If implementing Edge-first browser for AI features:**
- Update `browser-prompt-api` skill to document Edge officially.
- Update `playwright-testing` skill config example to include Edge project.
- Update Evaluator to use `--browser=msedge` when SPEC.md indicates AI features.
- No new npm packages.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@playwright/cli` 0.1.1+ | Node.js 18+ | Minimum Node version |
| `@playwright/cli` 0.1.1+ | Edge 138+ | Via `--browser=msedge` flag |
| `@playwright/test` 1.58+ | Edge 138+ | Via `channel: 'msedge'` in config |
| `simple-statistics` 7.8.8 | Node.js 14+ (ESM and CJS) | Only if needed as fallback |
| `@types/dom-chromium-ai` | TypeScript 5.0+ | Types for LanguageModel API, covers Chrome and Edge |

## Installation

No new installation steps for v1.1. The existing Step 0.5 workspace setup is
sufficient:

```bash
# Already in Step 0.5 (no changes needed)
npm init -y
npm install --save-dev @playwright/cli
```

If `simple-statistics` becomes needed later:
```bash
# Only if inline stats code exceeds ~50 lines
npm install simple-statistics
```

## Scoring Dimension Changes (Code Impact)

The v1.1 scoring dimension restructuring (Robustness replaces Code Quality,
Visual Coherence expands Visual Design) impacts appdev-cli.mjs score extraction:

```javascript
// Current v1.0 pattern in extractScores()
const scorePattern = /\|\s*(Product Depth|Functionality|Visual Design|Code Quality)\s*\|\s*(\d+)\/10/gi;

// v1.1 pattern (Robustness replaces Code Quality, Visual Coherence replaces Visual Design)
const scorePattern = /\|\s*(Product Depth|Functionality|Visual Coherence|Robustness)\s*\|\s*(\d+)\/10/gi;
```

The `scores` object keys would change from `code_quality` and `visual_design`
to `robustness` and `visual_coherence`. All other convergence logic
(escalation, exit conditions, trajectory) operates on `scores.total` and is
unaffected by dimension name changes.

## Sources

### Official Documentation (HIGH confidence)
- [Microsoft Edge Prompt API](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api) -- LanguageModel API for Edge, Phi-4-mini, hardware requirements
- [Playwright Browsers](https://playwright.dev/docs/browsers) -- Edge channel support, msedge configuration
- [Playwright CLI GitHub](https://github.com/microsoft/playwright-cli) -- CLI architecture, config file format, --browser flag
- [W3C Prompt API Spec](https://github.com/webmachinelearning/prompt-api) -- Shared API standard for Chrome and Edge
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp) -- MCP vs CLI comparison, PLAYWRIGHT_MCP_BROWSER env var

### npm Registry (HIGH confidence)
- [@playwright/cli 0.1.1](https://www.npmjs.com/package/@playwright/cli) -- Latest version, token-efficiency benchmarks
- [simple-statistics 7.8.8](https://www.npmjs.com/package/simple-statistics) -- API reference, zero-dependency
- [simple-statistics docs](https://simple-statistics.github.io/) -- Function list including zScore, standardDeviation, interquartileRange

### Ecosystem (MEDIUM confidence)
- [Playwright CLI Deep Dive (TestDino)](https://testdino.com/blog/playwright-cli/) -- CLI vs MCP token comparison (114K vs 27K)
- [Playwright CLI as Alternative (TestCollab)](https://testcollab.com/blog/playwright-cli) -- Skill-based workflow pattern
- [Edge Phi-4 Mini Integration (WindowsLatest)](https://www.windowslatest.com/2025/05/19/microsoft-edge-could-integrate-phi-4-mini-to-enable-on-device-ai-on-windows-11/) -- GPU-only inference (NPU not yet active)
- [Edge Blog: Prompt and Writing Assistance APIs](https://blogs.windows.com/msedgedev/2025/05/19/introducing-the-prompt-and-writing-assistance-apis/) -- Official announcement

---
*Stack research for: application-dev plugin v1.1 hardening*
*Researched: 2026-03-29*
