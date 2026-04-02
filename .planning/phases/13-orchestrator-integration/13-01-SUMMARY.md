---
phase: 13-orchestrator-integration
plan: 01
subsystem: cli
tags: [appdev-cli, resume-check, n-critic, dispatch-table, tdd]

# Dependency graph
requires:
  - phase: 11-scoring-foundation
    provides: DIMENSIONS constant with 4 entries including robustness
provides:
  - 3-critic default in resume-check (perceptual, projection, perturbation)
  - spawn-all-critics action string for >= 2 missing critics
  - spawn-{name}-critic action string for exactly 1 missing critic
  - SKILL.md dispatch table with spawn-all-critics and spawn-perturbation-critic entries
affects: [13-02-PLAN, orchestrator-integration, perturbation-critic]

# Tech tracking
tech-stack:
  added: []
  patterns: [N-critic threshold logic, atomic CLI+dispatch-table commits]

key-files:
  created: []
  modified:
    - plugins/application-dev/scripts/appdev-cli.mjs
    - plugins/application-dev/scripts/test-appdev-cli.mjs
    - plugins/application-dev/skills/application-dev/SKILL.md

key-decisions:
  - ">= 2 invalid threshold instead of === expectedCritics.length for spawn-all-critics"
  - "skip array passes valid critics (not empty) even when all invalid (valid is empty in that case)"

patterns-established:
  - "N-critic resume-check: >= 2 missing -> spawn-all-critics with skip, === 1 missing -> spawn-{name}-critic"

requirements-completed: [ORCH-02, ORCH-03]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 13 Plan 01: N-Critic Resume-Check Summary

**Generalized resume-check from 2-critic to N-critic with spawn-all-critics action and atomic dispatch table update**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T17:24:18Z
- **Completed:** 2026-04-02T17:29:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Default critics list now includes perturbation alongside perceptual and projection
- resume-check outputs spawn-all-critics when >= 2 critics are missing (not just when all are missing)
- resume-check outputs spawn-{name}-critic when exactly 1 critic is missing
- SKILL.md dispatch table updated atomically to prevent crash recovery breakage
- Full TDD cycle: 3 failing tests (RED), implementation (GREEN), all 88 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Update tests for 3-critic resume-check** - `3c53d52` (test)
2. **Task 2: Implement 3-critic CLI changes and dispatch table update** - `cd7616e` (feat)

## Files Created/Modified
- `plugins/application-dev/scripts/appdev-cli.mjs` - 3-critic default, spawn-all-critics rename, >= 2 conditional threshold
- `plugins/application-dev/scripts/test-appdev-cli.mjs` - 5 test updates/additions for 3-critic resume-check coverage
- `plugins/application-dev/skills/application-dev/SKILL.md` - Dispatch table with spawn-all-critics and spawn-perturbation-critic

## Decisions Made
- Used >= 2 invalid threshold instead of === expectedCritics.length to trigger spawn-all-critics. This means with 3 critics, if 2 are missing we re-spawn all rather than just the 2 missing ones. The skip array preserves valid summaries so no work is wasted.
- skip array set to valid[] (not empty []) even in spawn-all-critics path. When all are invalid, valid is empty anyway, so behavior is identical but code is consistent.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI and dispatch table are aligned for 3-critic orchestration
- Plan 13-02 can proceed to integrate perturbation critic spawning in the orchestrator workflow

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 13-orchestrator-integration*
*Completed: 2026-04-02*
