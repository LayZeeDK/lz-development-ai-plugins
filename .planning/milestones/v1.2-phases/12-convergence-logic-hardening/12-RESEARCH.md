# Phase 12: Convergence Logic Hardening - Research

**Researched:** 2026-04-02
**Domain:** Convergence detection scaling, EMA smoothing, per-dimension CLI output
**Confidence:** HIGH

## Summary

Phase 12 hardens the convergence detection logic in `appdev-cli.mjs` to scale correctly with any number of scoring dimensions and adds per-dimension trajectory visibility. The CONTEXT.md provides exhaustive, locked implementation decisions with theoretical grounding from statistical process control, cybernetics, and GAN training literature. The codebase is a single ~1500-line Node.js ESM file with zero npm dependencies, tested via `node:test` built-in runner (59 tests, all passing).

The core change set is localized to four functions and two output commands: (1) replace hardcoded magic numbers in `computeEscalation()` with formulas derived from `DIMENSIONS.length * 10`, (2) introduce a pure `computeEMA()` helper for EMA-smoothed trajectory, (3) add `dimension_status` array to `cmdRoundComplete()` output, and (4) add per-dimension `dimensions` object to `cmdGetTrajectory()` output. No state schema migration is needed -- per-dimension data is already stored in state rounds, and EMA is computed on-the-fly.

**Primary recommendation:** Implement in two plans -- Plan 1: threshold scaling + EMA (CONV-01, CONV-02, CONV-05), Plan 2: per-dimension output (CONV-03, CONV-04) -- because the scaling/EMA changes modify `computeEscalation()` internals while the output changes are additive and can be independently verified.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Threshold scaling formulas: crisis floor `ceil(maxTotal * 0.15)`, plateau `ceil(maxTotal * 0.05)`, progressing `ceil(maxTotal * 0.025)`. Asymmetric E-0/E-II thresholds (2.5% vs 5%, ratio 2:1). E-IV 50% drop and E-I/E-III direction checks are already dimensionless and unchanged.
- Per-dimension output shape: `dimension_status` array in round-complete (MYT decomposition pattern), `dimensions` keyed object in get-trajectory (MOEA Pareto front pattern). Array format for round-complete (self-describing with metadata), object format for trajectory (compact for trend extraction).
- EMA smoothing: alpha=0.4 default, alpha=1.0 backward-compatible degeneration. Total-only EMA (not per-dimension MEWMA). Initialization: EMA_0 = round 1 total. No bias correction. Computed on-the-fly (not stored in state).
- Dual-path signal architecture (Safety Filter pattern): Safety path uses raw scores (PASS verdict, E-IV floor, E-IV 50% drop). Hybrid path requires raw AND EMA agreement (E-III regression). Trend path uses EMA (E-II plateau, E-I decelerating, E-0 progressing).
- The `scores` object in round-complete is preserved for backward compatibility. `dimension_status` is additive overlay.

### Claude's Discretion
- Implementation of `computeEMA(totals, alpha)` helper function
- Whether `computeEscalation()` takes an `{ alpha }` options parameter or reads from a constant
- Test structure for 3-dim vs 4-dim parameterized verification
- Refactoring order (extract maxTotal first, then thresholds, then EMA, then per-dimension output)
- Exact placement of `dimension_status` computation in `cmdRoundComplete`
- Whether `dimensions` in get-trajectory reuses the stored `scores` object directly or builds a new one without `total`

### Deferred Ideas (OUT OF SCOPE)
- Per-dimension EMA (MEWMA): Track EMA per dimension independently for dimension-level stagnation detection. Deferred to v1.3 (CONV-06 candidate).
- Formal hysteresis state machine: Different entry/exit thresholds per escalation level with state memory.
- CDC dual-alpha: CDC uses w1=0.4 (gradual) AND w2=0.9 (sudden) simultaneously.
- Z-score anomaly detection: Already planned as CONV-06 in v1.3.
- Rising thresholds: Round-indexed threshold escalation (CONV-07 in v1.3).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONV-01 | Plateau threshold scaled with DIMENSIONS.length (derived from maxTotal, not hardcoded <= 1) | Threshold formula `ceil(maxTotal * 0.05)` verified: N=3 yields 2, N=4 yields 2. Current hardcoded `<= 1` on line 285. E-0 progressing uses asymmetric `ceil(maxTotal * 0.025)` yielding >1 for both N=3 and N=4. |
| CONV-02 | Crisis threshold (E-IV Catastrophic) scaled with DIMENSIONS.length (derived from maxTotal, not hardcoded <= 5) | Threshold formula `ceil(maxTotal * 0.15)` verified: N=3 yields 5 (backward compatible), N=4 yields 6. Current hardcoded `<= 5` on line 272. |
| CONV-03 | Per-dimension pass/fail status included in round-complete output (informational, not gating) | `dimension_status` array shape locked in CONTEXT.md. Maps from `extracted.scores` + DIMENSIONS constant. Placement: after `computeVerdict()`, before building result object. |
| CONV-04 | Per-dimension scores included in get-trajectory output for Summary step enrichment | `dimensions` keyed object shape locked in CONTEXT.md. Maps from `r.scores` excluding `total` key. Placement: inside trajectory map function. |
| CONV-05 | EMA-smoothed score trajectory for convergence detection (backward-compatible: alpha=1.0 degenerates to raw scores) | `computeEMA(totals, alpha)` pure function. Dual-path signal architecture: safety checks use raw, hybrid E-III uses raw AND EMA, trend checks (E-II, E-I, E-0) use EMA. Alpha=1.0 degeneration mathematically verified. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | >=18 (node:test available) | Runtime | Zero-dependency CLI; project uses no npm packages in appdev-cli.mjs |
| node:test | Built-in | Test framework | Already used for 59 existing tests in test-appdev-cli.mjs |
| node:assert/strict | Built-in | Assertions | Already used throughout test file |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs | Built-in | File I/O for state | Already used for state file read/write |
| node:child_process | Built-in | CLI execution in tests | execSync pattern for subprocess testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure function EMA | State-stored EMA | Pure function allows alpha tuning without state migration; no benefit to storage since computation is O(n) for n<=10 rounds |
| Options object `{ alpha }` | Module constant | Options object more testable (different alpha per call); constant less flexible but simpler. Recommend options object. |

**Installation:**
```bash
# No installation needed -- zero npm dependencies
```

## Architecture Patterns

### Current File Structure
```
plugins/application-dev/scripts/
|-- appdev-cli.mjs          # ~1528 lines, single-file CLI
'-- test-appdev-cli.mjs     # ~1378 lines, node:test-based tests
```

### Pattern 1: Threshold Constants Derived from DIMENSIONS
**What:** Replace all hardcoded magic numbers with formulas using `DIMENSIONS.length * 10` as `maxTotal`.
**When to use:** Every threshold comparison in `computeEscalation()`.
**Example:**
```javascript
// Source: CONTEXT.md locked decision + verified computation
const maxTotal = DIMENSIONS.length * 10;
const CRISIS_PCT = 0.15;
const PLATEAU_PCT = 0.05;
const PROGRESSING_PCT = 0.025;

// In computeEscalation:
const crisisFloor = Math.ceil(maxTotal * CRISIS_PCT);     // N=3: 5, N=4: 6
const plateauThreshold = Math.ceil(maxTotal * PLATEAU_PCT); // N=3: 2, N=4: 2
const progressingThreshold = Math.ceil(maxTotal * PROGRESSING_PCT); // N=3: 1, N=4: 1
```

### Pattern 2: Pure Function EMA
**What:** `computeEMA(totals, alpha)` returns array of smoothed values with no side effects.
**When to use:** Inside `computeEscalation()` to derive smoothed trajectory for trend-based escalation levels.
**Example:**
```javascript
// Source: CONTEXT.md locked decision (NIST initialization, no bias correction)
function computeEMA(totals, alpha) {
  if (totals.length === 0) {
    return [];
  }

  var ema = [totals[0]]; // EMA_0 = first value

  for (var i = 1; i < totals.length; i++) {
    ema.push(alpha * totals[i] + (1 - alpha) * ema[i - 1]);
  }

  return ema;
}
```

### Pattern 3: Dual-Path Signal Architecture
**What:** Different escalation levels use different signal sources (raw vs EMA vs hybrid).
**When to use:** In the refactored `computeEscalation()` function.
**Example:**
```javascript
// Safety path: raw scores, no smoothing
// E-IV crisis floor: raw total <= crisisFloor
// E-IV 50% drop: raw delta < 0 && |rawDelta| > prev.total * 0.5
// PASS verdict: raw scores against thresholds

// Hybrid path: raw AND EMA must agree
// E-III regression: rawDelta < 0 AND prevRawDelta < 0 AND emaDelta < 0

// Trend path: EMA-smoothed
// E-II plateau: emaWindowDelta <= plateauThreshold (3-round window)
// E-I decelerating: emaDelta > 0 but shrinking
// E-0 progressing: emaDelta > progressingThreshold
```

### Pattern 4: Additive Output Extension
**What:** New fields are added alongside existing fields, never replacing them.
**When to use:** When adding `dimension_status` to round-complete and `dimensions` to get-trajectory.
**Example:**
```javascript
// round-complete: dimension_status array alongside existing scores object
var dimensionStatus = DIMENSIONS.map(function (dim) {
  return {
    name: dim.name,
    key: dim.key,
    score: extracted.scores[dim.key],
    threshold: dim.threshold,
    pass: extracted.scores[dim.key] >= dim.threshold,
  };
});
result.dimension_status = dimensionStatus;

// get-trajectory: dimensions object alongside existing total
var dimensions = {};
for (var ki = 0; ki < DIMENSIONS.length; ki++) {
  var dim = DIMENSIONS[ki];
  if (r.scores && r.scores[dim.key] !== undefined) {
    dimensions[dim.key] = r.scores[dim.key];
  }
}
```

### Anti-Patterns to Avoid
- **Storing EMA in state:** EMA is a pure function of raw scores + alpha. Storing it creates a state migration burden and prevents alpha tuning without migration.
- **Using EMA for safety checks:** E-IV and PASS verdict must use raw scores. Smoothing a catastrophic score drop delays emergency response.
- **Replacing `scores` with `dimension_status`:** The `scores` object is consumed by existing code (extractScores, determineExit). `dimension_status` is an additive overlay.
- **Per-dimension exit conditions:** Exit remains total-score-based. Per-dimension tracking is advisory only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EMA computation | Custom weighted moving average | Standard EMA formula: `S_t = alpha * x_t + (1-alpha) * S_{t-1}` | The recursive formula is the standard. Any variation introduces bugs. |
| Test parameterization (3-dim vs 4-dim) | Duplicate test suites | `node:test` describe blocks with setup helpers that mock DIMENSIONS | Avoid test code duplication. Since DIMENSIONS is a module constant, tests should verify formula output at known N values. |
| Threshold derivation | Lookup tables | `Math.ceil(maxTotal * PCT)` | Formula is self-documenting and auto-scales to any N. Lookup tables become stale. |

**Key insight:** The entire phase is about replacing hardcoded constants with formulas. Every magic number has a derivation formula in CONTEXT.md. The formulas are mathematically simple -- the complexity is in getting the dual-path signal routing right.

## Common Pitfalls

### Pitfall 1: Magic Numbers Wrong with 4 Dimensions (PRIMARY)
**What goes wrong:** Hardcoded `<= 5` crisis floor is correct for N=3 (maxTotal=30) but wrong for N=4 (maxTotal=40). A 15% crisis floor at N=4 should be `<= 6`, not `<= 5`.
**Why it happens:** The original implementation was written for 3 dimensions and used literal values that happened to match the 15%/5%/2.5% formulas at N=3.
**How to avoid:** Derive ALL thresholds from `DIMENSIONS.length * 10`. Test at both N=3 and N=4 to verify scaling.
**Warning signs:** Any numeric literal in `computeEscalation()` that isn't a percentage or ratio.

### Pitfall 2: EMA Applied to Safety Checks
**What goes wrong:** If EMA smoothing is applied to E-IV crisis floor or PASS verdict, catastrophic drops are dampened and emergency exit is delayed.
**Why it happens:** Natural tendency to apply the same smoothing everywhere for "consistency."
**How to avoid:** Follow the dual-path architecture strictly. Safety path = raw, Hybrid path = raw AND EMA, Trend path = EMA only. Code comments should label each path.
**Warning signs:** Any E-IV or PASS check referencing `ema` variables.

### Pitfall 3: Symmetric E-0/E-II Thresholds
**What goes wrong:** Using the same deadband (e.g., 5%) for both plateau detection (E-II) and progress detection (E-0) creates a dead zone where a 4-point raw improvement (10% of maxTotal=40) is classified as "Decelerating" because EMA dampens it to 1.6 which is below a 5% threshold of 2.
**Why it happens:** Intuition says thresholds should be symmetric.
**How to avoid:** E-0 uses 2.5% (progressing threshold), E-II uses 5% (plateau threshold). This is the Schmitt trigger hysteresis pattern (2:1 ratio).
**Warning signs:** `progressingThreshold === plateauThreshold` or both using the same percentage.

### Pitfall 4: Off-by-One in EMA Window for E-II Plateau
**What goes wrong:** E-II plateau checks a 3-round window improvement. With EMA, this becomes `ema[current] - ema[current-2]`. If the index is wrong, plateau is checked against the wrong window.
**Why it happens:** EMA array indices must align with rounds array indices.
**How to avoid:** `computeEMA()` returns an array of the same length as the input totals. Use `ema[ema.length - 1] - ema[ema.length - 3]` for the 3-round window.
**Warning signs:** EMA array length differs from rounds array length.

### Pitfall 5: Testing N=3 Requires DIMENSIONS Override
**What goes wrong:** Tests that verify N=3 behavior cannot simply modify the DIMENSIONS constant because it is a module-level `const` in appdev-cli.mjs. The test file uses subprocess execution via `execSync`.
**Why it happens:** The CLI is tested as a subprocess, not as an imported module.
**How to avoid:** Two approaches: (1) Verify the formula produces correct values for any N by testing `computeEMA` and threshold math independently, OR (2) create test fixtures with known total scores that exercise the threshold boundaries at N=4 (the actual production dimension count). For the "3-dim vs 4-dim" success criterion, verify the FORMULA itself is correct at both N values, not that the CLI runtime runs with N=3.
**Warning signs:** Tests that only work at N=4 and claim to verify N=3 behavior.

### Pitfall 6: E-III Hybrid Check Order
**What goes wrong:** The hybrid E-III check requires `rawDelta < 0 AND prevRawDelta < 0 AND emaDelta < 0`. If the EMA check is evaluated first and short-circuits, the raw safety check is bypassed.
**Why it happens:** JavaScript's `&&` operator short-circuits left-to-right, but the ordering doesn't matter for correctness (all three must be true). The real pitfall is accidentally using `||` instead of `&&`.
**How to avoid:** Ensure all three conditions are AND-ed. The raw check catches real regression; the EMA check filters noise-induced false regression.
**Warning signs:** `||` operator in the E-III hybrid check.

## Code Examples

### Exact Hardcoded Values to Replace

```javascript
// Source: appdev-cli.mjs lines 258-307, verified by reading source

// LINE 272: E-IV crisis floor -- CHANGE from hardcoded to formula
// BEFORE: current.scores.total <= 5
// AFTER:  current.scores.total <= Math.ceil(maxTotal * 0.15)
//         N=3: <= 5 (same), N=4: <= 6

// LINE 285: E-II plateau -- CHANGE from hardcoded to formula
// BEFORE: windowDelta <= 1
// AFTER:  windowDelta <= plateauThreshold  (where plateauThreshold = Math.ceil(maxTotal * 0.05))
//         N=3: <= 2 (DIFFERENT from current <= 1), N=4: <= 2

// LINE 296: E-0 progressing -- CHANGE from hardcoded to formula
// BEFORE: delta > 1
// AFTER:  emaDelta > progressingThreshold  (where progressingThreshold = Math.ceil(maxTotal * 0.025))
//         N=3: > 1 (same), N=4: > 1
// NOTE: This also switches from raw delta to EMA delta (trend path)
```

### computeEMA Helper

```javascript
// Source: CONTEXT.md locked decision, NIST EWMA standard
function computeEMA(totals, alpha) {
  if (totals.length === 0) {
    return [];
  }

  var ema = [totals[0]]; // EMA_0 = first value (NIST standard, no bias correction)

  for (var i = 1; i < totals.length; i++) {
    ema.push(alpha * totals[i] + (1 - alpha) * ema[i - 1]);
  }

  return ema;
}
```

### Refactored computeEscalation Signature

```javascript
// Source: CONTEXT.md integration points
// Options parameter allows testability with different alpha values
function computeEscalation(rounds, opts) {
  var alpha = (opts && opts.alpha !== undefined) ? opts.alpha : 0.4;
  var maxTotal = DIMENSIONS.length * 10;
  var crisisFloor = Math.ceil(maxTotal * 0.15);
  var plateauThreshold = Math.ceil(maxTotal * 0.05);
  var progressingThreshold = Math.ceil(maxTotal * 0.025);

  // ... rest of implementation with dual-path signal architecture
}
```

### dimension_status in cmdRoundComplete

```javascript
// Source: CONTEXT.md locked output shape
// Placement: after computeVerdict, before building result
var dimensionStatus = DIMENSIONS.map(function (dim) {
  return {
    name: dim.name,
    key: dim.key,
    score: extracted.scores[dim.key],
    threshold: dim.threshold,
    pass: extracted.scores[dim.key] >= dim.threshold,
  };
});

// Add to result object
result.dimension_status = dimensionStatus;
```

### dimensions in cmdGetTrajectory

```javascript
// Source: CONTEXT.md locked output shape
// Placement: inside trajectory map function
var dimensions = {};
for (var ki = 0; ki < DIMENSIONS.length; ki++) {
  var dim = DIMENSIONS[ki];
  if (r.scores && r.scores[dim.key] !== undefined) {
    dimensions[dim.key] = r.scores[dim.key];
  }
}
// trajectory entry gets: dimensions: dimensions
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded thresholds (`<= 5`, `<= 1`, `> 1`) | Formula-derived (`ceil(maxTotal * pct)`) | Phase 12 (this phase) | Scales to any dimension count |
| Raw total for all escalation checks | Dual-path: raw for safety, EMA for trends | Phase 12 (this phase) | Reduces false plateau/regression from noise |
| Scalar total in trajectory | Per-dimension scores + total | Phase 12 (this phase) | Generator sees which dimensions are failing |

**Deprecated/outdated:**
- Hardcoded `<= 5` crisis floor: replaced by `ceil(maxTotal * 0.15)`
- Hardcoded `<= 1` plateau: replaced by `ceil(maxTotal * 0.05)`
- Hardcoded `> 1` progressing: replaced by `ceil(maxTotal * 0.025)` with EMA delta

## Open Questions

1. **DIMENSIONS override for N=3 testing**
   - What we know: The CLI tests run via subprocess (`execSync`), so modifying the `DIMENSIONS` constant at runtime is not trivial. The success criterion says "verified by tests running against both 3-dimension and 4-dimension configurations."
   - What's unclear: Whether to (a) factor out the formula into a testable exported function, (b) use environment variable override, or (c) test the formula math in unit tests that compute `ceil(N * 10 * pct)` for N=3 and N=4 without actually changing DIMENSIONS.
   - Recommendation: Option (c) -- test that the threshold formula `ceil(maxTotal * pct)` produces correct values at N=3 and N=4 via direct computation tests, plus test the full CLI at N=4 (production config) for integration coverage. This satisfies the success criterion without fragile mocking. A dedicated `describe` block can validate formula correctness for arbitrary N by computing expected thresholds and comparing against the percentage constants.

2. **E-II plateau threshold changes at N=3 from 1 to 2**
   - What we know: Current hardcoded `<= 1` maps to `ceil(30 * 0.05) = 2` at N=3. This means the plateau detection threshold becomes MORE lenient (improvement of 2 points within 3 rounds is now plateau, whereas before it required only 1 point of stagnation).
   - What's unclear: Whether this behavioral change at N=3 is intentional.
   - Recommendation: It IS intentional per CONTEXT.md. The 5% deadband is grounded in DCS practice (ISA-18.2). The old `<= 1` was a coincidence, not a principled threshold. Document this behavioral change in commit message.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js >=18) |
| Config file | none -- uses `node --test` CLI directly |
| Quick run command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| Full suite command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-01 | Plateau threshold derived from DIMENSIONS.length | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| CONV-02 | Crisis threshold derived from DIMENSIONS.length | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| CONV-03 | round-complete output includes dimension_status | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| CONV-04 | get-trajectory output includes dimensions | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| CONV-05 | EMA smoothing with alpha=1.0 backward compat | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Per wave merge:** `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test-appdev-cli.mjs` needs new `describe("computeEscalation threshold scaling")` block -- covers CONV-01, CONV-02
- [ ] `test-appdev-cli.mjs` needs new `describe("computeEMA")` block -- covers CONV-05
- [ ] `test-appdev-cli.mjs` needs new `describe("EMA-integrated escalation")` block -- covers CONV-05 (dual-path, hybrid E-III)
- [ ] `test-appdev-cli.mjs` needs new `describe("round-complete dimension_status")` block -- covers CONV-03
- [ ] `test-appdev-cli.mjs` needs new `describe("get-trajectory dimensions")` block -- covers CONV-04
- [ ] `test-appdev-cli.mjs` needs formula verification tests for N=3 and N=4 -- covers success criterion #1

## Sources

### Primary (HIGH confidence)
- `appdev-cli.mjs` source code (read lines 1-1528) -- verified all hardcoded thresholds, function signatures, and state shape
- `test-appdev-cli.mjs` source code (read lines 1-1378) -- verified test framework, patterns, all 59 tests passing
- `12-CONTEXT.md` (read in full) -- locked implementation decisions with theoretical grounding
- REQUIREMENTS.md (read in full) -- CONV-01..05 requirement definitions
- Mathematical verification via Node.js -- confirmed threshold formulas at N=3 and N=4, EMA degeneration at alpha=1.0

### Secondary (MEDIUM confidence)
- EMA formula is standard (textbook: `S_t = alpha * x_t + (1-alpha) * S_{t-1}`). NIST EWMA initialization is EMA_0 = first observation.
- Threshold percentage values from CONTEXT.md reference CDC EWMA, NIST handbook, ISA-18.2, and Schmitt trigger literature.

### Tertiary (LOW confidence)
- None. All findings verified from source code and locked decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero dependencies, all built-in Node.js APIs, verified by running existing test suite
- Architecture: HIGH -- all integration points identified from source code reading, all hardcoded values catalogued
- Pitfalls: HIGH -- primary pitfall (magic numbers wrong with 4 dimensions) is the core problem this phase solves; all others derived from code analysis

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- internal CLI with no external dependency updates)
