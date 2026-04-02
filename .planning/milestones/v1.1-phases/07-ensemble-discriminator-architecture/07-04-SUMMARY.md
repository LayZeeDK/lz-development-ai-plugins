---
phase: 07-ensemble-discriminator-architecture
plan: 04
subsystem: orchestrator
tags: [ensemble, critics, SKILL.md, evaluation-phase, compile-evaluation]

# Dependency graph
requires:
  - phase: 07-01
    provides: CLI compile-evaluation subcommand and scoring update
  - phase: 07-03
    provides: Perceptual and projection critic agent definitions
provides:
  - Updated SKILL.md orchestrator with ensemble evaluation phase
  - Parallel critic spawning in evaluation workflow
  - Per-critic error recovery and binary file-exists checks
affects: [08-crash-recovery, 09-parallel-track]

# Tech tracking
tech-stack:
  added: []
  patterns: [ensemble-evaluation-phase, per-critic-retry, compile-then-converge]

key-files:
  created: []
  modified:
    - plugins/application-dev/skills/application-dev/SKILL.md

key-decisions:
  - "Per-critic retry on failure instead of retrying both critics"
  - "Binary checks for summary.json before compile-evaluation, then binary check for EVALUATION.md after compile"
  - "SAFETY_CAP wrap-up round also uses ensemble pattern (consistency)"

patterns-established:
  - "Ensemble evaluation: spawn critics -> check artifacts -> CLI compile -> round-complete"
  - "Per-critic error recovery: retry only the specific critic whose summary.json is missing"

requirements-completed: [ENSEMBLE-10]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 7 Plan 4: Orchestrator Ensemble Wiring Summary

**Rewired SKILL.md evaluation phase to spawn parallel perceptual + projection critics, check both summary.json artifacts, then CLI compile-evaluation before round-complete**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T13:14:52Z
- **Completed:** 2026-03-31T13:17:31Z
- **Tasks:** 1 of 2 (Task 2 is a human-verify checkpoint deferred to orchestrator)
- **Files modified:** 1

## Accomplishments
- Replaced monolithic evaluator spawn with parallel perceptual-critic + projection-critic spawns
- Added binary file-exists checks for both perceptual/summary.json and projection/summary.json
- Inserted compile-evaluation CLI call between critic checks and round-complete
- Updated error recovery to per-critic retry instead of whole-evaluator retry
- Updated architecture, agent prompt protocol, and file-based communication sections
- Updated SAFETY_CAP wrap-up round to use ensemble pattern consistently
- Removed all references to "application-dev:evaluator" agent from SKILL.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite SKILL.md evaluation phase for ensemble architecture** - `e68ee23` (feat)

**Task 2: Final review of complete ensemble discriminator architecture** -- checkpoint:human-verify, deferred to orchestrator for user review.

**Plan metadata:** (pending)

## Files Created/Modified
- `plugins/application-dev/skills/application-dev/SKILL.md` - Updated orchestrator with ensemble evaluation phase (frontmatter, evaluation phase, error recovery, agent prompt protocol, file-based communication, architecture sections)

## Decisions Made
- Per-critic retry on failure: when a summary.json is missing, only the specific critic that failed is retried, not both. This avoids redundant work and keeps retry budgets independent.
- Binary check for EVALUATION.md verifies `## Scores` (not `## Verdict`) since the CLI now compiles the report mechanically with a Scores heading.
- SAFETY_CAP wrap-up round updated to use the same ensemble pattern for consistency -- it would be confusing to have one code path spawn an evaluator and another spawn critics.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Checkpoint Pending

Task 2 (`checkpoint:human-verify`) requests human review of the complete ensemble discriminator architecture across Plans 01-04. The orchestrator will present this checkpoint to the user. All automated work for this plan is complete.

## Next Phase Readiness
- Phase 7 ensemble discriminator architecture is fully wired: CLI (Plan 01), evaluation template + scoring calibration (Plan 02), critic agents (Plan 03), orchestrator wiring (Plan 04)
- Ready for Phase 8 (crash recovery) which builds on the stable orchestrator workflow
- Phase 9 (parallel track) can also proceed independently

## Self-Check: PASSED

- [x] SKILL.md exists at plugins/application-dev/skills/application-dev/SKILL.md
- [x] Commit e68ee23 found in git log

---
*Phase: 07-ensemble-discriminator-architecture*
*Completed: 2026-03-31*
