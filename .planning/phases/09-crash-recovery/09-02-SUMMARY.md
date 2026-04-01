---
phase: 09-crash-recovery
plan: 02
subsystem: agents
tags: [crash-recovery, resume-check, static-serve, production-build, four-branch-resume, gan-barrier]

# Dependency graph
requires:
  - phase: 09-crash-recovery
    plan: 01
    provides: resume-check and static-serve CLI subcommands, update extensions for --build-dir/--spa/--critics
  - phase: 07-ensemble-discriminator
    provides: perceptual-critic and projection-critic agent definitions, SKILL.md orchestrator
provides:
  - Generator requires production builds and records build-dir/spa in state
  - Both critics start static-serve as first step with correct allowed-tools
  - SKILL.md Step 0 four-branch resume logic with resume-check dispatch
  - SKILL.md evaluation phase sets expected critics and stops servers between rounds
affects: [application-dev end-to-end workflow, future crash recovery testing]

# Tech tracking
tech-stack:
  added: [serve npm package (installed in Step 0.5)]
  patterns: [four-branch resume dispatch, production build evaluation, idempotent server lifecycle, stale build prevention]

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/generator.md
    - plugins/application-dev/agents/perceptual-critic.md
    - plugins/application-dev/agents/projection-critic.md
    - plugins/application-dev/skills/application-dev/SKILL.md

key-decisions:
  - "Generator records build-dir and spa in state after every successful build, not just round 1"
  - "Critics read build_dir from state rather than assuming a hardcoded directory"
  - "static-serve --stop called in all 5 convergence paths (PASS, PLATEAU, REGRESSION, SAFETY_CAP, continue) to prevent stale builds"
  - "Four-branch resume uses resume-check for auto-resume but AskUserQuestion when prompt conflicts with existing state"

patterns-established:
  - "Production build as evaluation target: critics evaluate minified bundles, not dev servers"
  - "Four-branch dispatch: prompt x state -> auto-resume / ask / fresh / error"
  - "Server lifecycle bookending: start in critic Step 0, stop in orchestrator after round-complete"
  - "State field documentation in File-Based Communication section"

requirements-completed: [RECOVERY-01, RECOVERY-02, RECOVERY-03, RECOVERY-04]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 9 Plan 02: Agent and Orchestrator Crash Recovery Wiring Summary

**Four-branch resume logic in SKILL.md, production build requirement in Generator, static-serve lifecycle in both critics and orchestrator convergence paths**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-01T22:06:54Z
- **Completed:** 2026-04-01T22:11:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Generator agent requires production builds and records build-dir/spa in state before ending each round, with WHY-based rationale explaining the GAN barrier benefit
- Both critics have static-serve in allowed-tools and call it as first step (Step 0), using the returned port for all playwright-cli commands
- SKILL.md Step 0 rewritten with four-branch resume logic: no-prompt+state auto-resumes via resume-check, prompt+state asks user, prompt+no-state starts fresh, no-prompt+no-state errors
- SKILL.md evaluation phase sets expected critics via update --critics and stops servers in all 5 convergence/continuation paths
- RECOVERY-04 confirmed in place (AUTOCOMPACT_PCT_OVERRIDE=50 in both critics, untouched)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Generator for production build and state recording** - `1fa6faf` (feat)
2. **Task 2: Wire static-serve into critic agent definitions** - `8dbbc55` (feat)
3. **Task 3: Rewrite SKILL.md for crash recovery and static-serve orchestration** - `c037557` (feat)

## Files Created/Modified
- `plugins/application-dev/agents/generator.md` - Added production build state update (--build-dir, --spa) in Step 8 diagnostic battery, rounds 2+ note, updated architecture principle
- `plugins/application-dev/agents/perceptual-critic.md` - Added static-serve to tools, added Step 0 evaluation server startup
- `plugins/application-dev/agents/projection-critic.md` - Added static-serve to tools, added Step 0 evaluation server startup with baseURL guidance
- `plugins/application-dev/skills/application-dev/SKILL.md` - Four-branch Step 0, serve install in Step 0.5, update --critics in eval phase, static-serve --stop in 5 paths, state field docs

## Decisions Made
- Generator records build-dir and spa after every successful build (not just round 1) because rounds 2+ may restructure the tech stack during fixes
- Critics read build_dir from .appdev-state.json rather than assuming a hardcoded directory like "dist" -- tech-stack-agnostic approach
- static-serve --stop is placed after round-complete in ALL convergence paths (PASS, PLATEAU, REGRESSION, SAFETY_CAP wrap-up, and should_continue) to ensure no stale build is ever served to critics
- Four-branch resume uses resume-check CLI for the auto-resume path but falls back to AskUserQuestion when the user provides a new prompt while state exists -- respects user intent

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four RECOVERY requirements are now fully addressed across Plans 01 and 02
- Phase 9 is complete: CLI foundation (Plan 01) + agent/orchestrator wiring (Plan 02) form the full crash recovery system
- The workflow is end-to-end: Generator produces builds -> state records build-dir/spa -> critics start static-serve -> evaluate production build -> orchestrator stops servers between rounds -> resume-check recovers from any crash point

## Self-Check: PASSED

- All 5 files exist (4 modified + 1 SUMMARY created)
- All 3 task commits verified (1fa6faf, 8dbbc55, c037557)
- Content claims verified: build-dir in generator (3 matches), static-serve in both critics (3 each), resume-check in SKILL.md (4 matches), update --critics in SKILL.md (2 matches)

---
*Phase: 09-crash-recovery*
*Completed: 2026-04-02*
