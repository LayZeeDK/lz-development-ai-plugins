---
phase: 11-scoring-foundation-perturbation-critic
plan: 02
subsystem: evaluator
tags: [robustness, adversarial-testing, scoring-calibration, perturbation-critic, playwright]

# Dependency graph
requires:
  - phase: v1.1
    provides: existing critic agent patterns (projection-critic, perceptual-critic) and SCORING-CALIBRATION.md structure
provides:
  - Robustness ceiling rules and calibration scenarios in SCORING-CALIBRATION.md
  - perturbation-critic agent definition with adversarial testing methodology
  - Methodology boundary rule distinguishing within-spec (perceptual/projection) from beyond-spec (perturbation)
affects: [12-dimensions-constant-tests, 13-orchestrator-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [chaos-engineering-methodology, R-FID-analog-adversarial-evaluation, concurrent-console-monitoring]

key-files:
  created:
    - plugins/application-dev/agents/perturbation-critic.md
  modified:
    - plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md

key-decisions:
  - "Robustness threshold set to 6 (matching Visual Design) -- lower than Functionality/Product Depth (7) because adversarial resilience is a secondary quality signal"
  - "Console monitoring runs DURING other perturbation activities (concurrent, not sequential) -- spectral/R-FID analog pattern"
  - "Methodology boundary: within-spec conditions belong to perceptual/projection, beyond-spec conditions belong to perturbation"
  - "Finding ID prefix RB- for Robustness dimension"

patterns-established:
  - "Within-spec vs beyond-spec boundary rule: spec-described conditions -> perceptual/projection, beyond-spec conditions -> perturbation"
  - "Adversarial test priority ordering: input perturbation > console monitoring > rapid navigation > viewport extremes > error recovery"
  - "Concurrent console monitoring pattern: error monitoring runs during all perturbation activities, not as a separate step"

requirements-completed: [CRITIC-01, CRITIC-03, CRITIC-04]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 11 Plan 02: Robustness Scoring Calibration + Perturbation-Critic Summary

**Robustness ceiling rules (5 conditions) with calibration scenarios and perturbation-critic agent definition using chaos engineering methodology boundaries**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T09:10:21Z
- **Completed:** 2026-04-02T09:14:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added Robustness ceiling rules table (crash=max4, unrecoverable=max5, no-error-handling=max5, 3+-exceptions=max6, warnings=max7) and 3 calibration scenarios (5/10, 7/10, 9/10) with boundary explanations to SCORING-CALIBRATION.md
- Created perturbation-critic agent definition with YAML frontmatter, Information Barrier, Write Restriction, Step 0, methodology boundary rule, and 5 methodology sections (UNDERSTAND, PERTURB, MONITOR, SCORE, REPORT)
- Established clear methodology boundary: within-spec conditions belong to perceptual/projection critics, beyond-spec conditions belong to perturbation-critic

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Robustness ceiling rules and calibration scenarios to SCORING-CALIBRATION.md** - `7387868` (feat)
2. **Task 2: Create perturbation-critic agent definition with methodology boundaries** - `ad5b458` (feat)

## Files Created/Modified
- `plugins/application-dev/agents/perturbation-critic.md` - New agent definition for adversarial resilience testing (180 lines)
- `plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md` - Added Robustness ceiling rules, threshold, and calibration scenarios

## Decisions Made
- Robustness threshold set to 6 (matching Visual Design), lower than Functionality/Product Depth (7) -- adversarial resilience is secondary to core functional correctness
- Console monitoring runs concurrently during all perturbation activities (spectral/R-FID analog) rather than as a separate sequential step
- Methodology boundary rule: within-spec = perceptual/projection, beyond-spec = perturbation (chaos engineering layer)
- Finding ID prefix RB- for Robustness dimension findings
- Tool allowlist identical to projection-critic (Read, Write, Playwright CLI, playwright test, install-dep, static-serve) -- does NOT include check-assets (perceptual-critic only)

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness
- SCORING-CALIBRATION.md now covers all 4 dimensions (Functionality, Product Depth, Visual Design, Robustness)
- perturbation-critic agent definition ready for orchestrator integration (Phase 13)
- DIMENSIONS constant update and test modifications needed (Phase 11 Plan 01 or Phase 12)

---
*Phase: 11-scoring-foundation-perturbation-critic*
*Completed: 2026-04-02*
