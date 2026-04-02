---
phase: 12-convergence-logic-hardening
plan: 01
subsystem: convergence
tags: [ema, escalation, threshold-scaling, dual-path-signal, schmitt-trigger]

# Dependency graph
requires:
  - phase: 11-scoring-foundation
    provides: 4-dimension DIMENSIONS constant and robustness scoring
provides:
  - computeEMA pure helper function for EMA-smoothed trajectory
  - Scaled threshold formulas derived from DIMENSIONS.length * 10
  - Dual-path signal architecture (safety/hybrid/trend) in computeEscalation
  - Asymmetric Schmitt trigger hysteresis (2.5% progressing vs 5% plateau)
affects: [12-02 per-dimension output, phase-13 convergence tuning]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-path signal architecture, EMA smoothing, formula-derived thresholds]

key-files:
  created: []
  modified:
    - plugins/application-dev/scripts/appdev-cli.mjs
    - plugins/application-dev/scripts/test-appdev-cli.mjs

key-decisions:
  - "EMA alpha=0.4 default with opts parameter for testability"
  - "Asymmetric E-0/E-II thresholds (2.5% vs 5%) per Schmitt trigger hysteresis"
  - "E-II plateau threshold at N=3 changes from <=1 to <=2 (intentional per ISA-18.2 5% deadband)"
  - "Formula verification tests at N=3 and N=4 via direct computation (not DIMENSIONS override)"

patterns-established:
  - "Dual-path signal architecture: safety=raw, hybrid=raw+EMA, trend=EMA"
  - "Threshold derivation from DIMENSIONS.length * 10 with percentage constants"
  - "computeEMA as pure function (no state mutation, computed on-the-fly)"

requirements-completed: [CONV-01, CONV-02, CONV-05]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 12 Plan 01: Threshold Scaling + EMA Smoothing Summary

**EMA-smoothed convergence detection with scaled thresholds derived from DIMENSIONS.length and dual-path signal architecture (safety/hybrid/trend)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T11:20:16Z
- **Completed:** 2026-04-02T11:24:17Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Replaced all hardcoded magic numbers in computeEscalation with formula-derived thresholds: crisis floor ceil(maxTotal*0.15), plateau ceil(maxTotal*0.05), progressing ceil(maxTotal*0.025)
- Added computeEMA(totals, alpha) pure helper with alpha=0.4 default and alpha=1.0 backward compatibility
- Implemented dual-path signal architecture: safety path (raw) for E-IV and PASS, hybrid path (raw AND EMA) for E-III, trend path (EMA) for E-II/E-I/E-0
- Added 19 new tests covering threshold scaling at N=3 and N=4, EMA computation, dual-path routing, and backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Add computeEMA helper and threshold scaling tests (RED + GREEN)** - `064dc3a` (feat)

## Files Created/Modified
- `plugins/application-dev/scripts/appdev-cli.mjs` - Added computeEMA pure function, refactored computeEscalation with scaled thresholds and dual-path signal architecture
- `plugins/application-dev/scripts/test-appdev-cli.mjs` - Added 4 new describe blocks (computeEMA, threshold scaling, formula verification, dual-path architecture) with 19 tests

## Decisions Made
- Used opts parameter on computeEscalation for alpha testability (default 0.4, allows future tuning)
- Asymmetric E-0/E-II thresholds (2.5% vs 5%) implement Schmitt trigger hysteresis pattern to compensate for EMA dampening
- E-II plateau threshold at N=3 intentionally changes from <=1 to <=2 per ISA-18.2 5% deadband practice (the old <=1 was coincidental)
- Formula verification tests compute ceil(N*10*pct) inline at both N=3 and N=4 rather than attempting to override the DIMENSIONS constant in subprocess tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- computeEscalation now uses formula-derived thresholds and EMA smoothing, ready for Plan 02 (per-dimension output: dimension_status in round-complete, dimensions in get-trajectory)
- The opts parameter on computeEscalation allows future alpha tuning without code changes
- All 78 tests passing (59 existing + 19 new)

## Self-Check: PASSED

- [x] plugins/application-dev/scripts/appdev-cli.mjs exists
- [x] plugins/application-dev/scripts/test-appdev-cli.mjs exists
- [x] .planning/phases/12-convergence-logic-hardening/12-01-SUMMARY.md exists
- [x] Commit 064dc3a exists in git log

---
*Phase: 12-convergence-logic-hardening*
*Completed: 2026-04-02*
