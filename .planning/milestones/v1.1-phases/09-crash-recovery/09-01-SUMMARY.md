---
phase: 09-crash-recovery
plan: 01
subsystem: cli
tags: [crash-recovery, resume-check, static-serve, process-lifecycle, artifact-validation]

# Dependency graph
requires:
  - phase: 07-ensemble-discriminator
    provides: appdev-cli.mjs with extractScores, computeVerdict, compile-evaluation, install-dep
provides:
  - resume-check subcommand for crash recovery artifact detection
  - static-serve subcommand for detached static file server lifecycle
  - update extensions for --build-dir, --spa, --critics flags
  - server cleanup in delete/complete subcommands
affects: [09-crash-recovery plan 02, orchestrator SKILL.md, critic agents, generator agent]

# Tech tracking
tech-stack:
  added: [node:net Socket for port checking, serve npm package (via npx)]
  patterns: [artifact validation chain, detached process lifecycle, cross-platform process kill, mutex reuse]

key-files:
  created: []
  modified:
    - plugins/application-dev/scripts/appdev-cli.mjs
    - plugins/application-dev/scripts/test-appdev-cli.mjs

key-decisions:
  - "resume-check reads expected critics from state.critics with default fallback to [perceptual, projection]"
  - "static-serve uses npx serve for cross-platform compatibility instead of direct binary path"
  - "cmdUpdate makes --step optional when extension flags (--build-dir, --spa, --critics) are provided"
  - "cmdDelete reads and parses state before deletion to stop servers; tolerates corrupt state"

patterns-established:
  - "Artifact validation chain: file exists -> JSON.parse -> required fields present"
  - "Corrupt artifact cleanup: delete entire critic directory before re-spawn"
  - "Cross-platform process kill: taskkill /T /F on Windows, process.kill(-pid) on Unix"
  - "Detached process spawn: stdio ignore, child.unref(), PID recorded immediately"

requirements-completed: [RECOVERY-01, RECOVERY-02, RECOVERY-03]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 9 Plan 01: CLI Crash Recovery and Static Serve Foundation Summary

**resume-check subcommand with 15-state artifact validation chain, static-serve with detached process lifecycle, and update/delete/complete extensions for server and critic tracking**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-01T21:58:38Z
- **Completed:** 2026-04-01T22:03:48Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- resume-check subcommand validates the complete artifact chain per workflow step (plan, generate, evaluate, summary) and returns structured JSON with the next recovery action
- static-serve subcommand spawns detached serve processes, tracks PID/port/SPA in state.servers[], provides idempotent start and --stop for cleanup
- update subcommand extended with --build-dir, --spa, --critics flags; --step is no longer required when extension flags are present
- delete and complete auto-stop all running servers before state changes, preventing orphan processes
- 28 new tests covering all recovery states, corrupt artifact cleanup, custom critic lists, server lifecycle

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write failing tests** - `9f44658` (test)
2. **Task 2: GREEN -- Implement features** - `9533d4d` (feat)

_TDD plan: RED wrote 28 failing tests, GREEN implemented all features to pass 54/54 tests._

## Files Created/Modified
- `plugins/application-dev/scripts/appdev-cli.mjs` - Added resume-check, static-serve subcommands; extended update, delete, complete; added validation and process lifecycle helpers
- `plugins/application-dev/scripts/test-appdev-cli.mjs` - Added 28 tests across 4 new describe blocks (resume-check, update extensions, delete/complete cleanup, static-serve)

## Decisions Made
- resume-check defaults critics to ["perceptual", "projection"] when state.critics is unset, matching the established v1.1 architecture while remaining extensible for v1.2
- static-serve uses `npx serve` with `shell: true` for cross-platform compatibility (handles .cmd wrappers on Windows automatically)
- cmdUpdate validation relaxed: --step is only required when no extension flags are present, allowing generators to set build-dir/spa without changing step
- cmdDelete wraps state read in try/catch to handle corrupt state files gracefully -- servers are still stopped when possible

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test setup for git tag test**
- **Found during:** Task 2 (GREEN)
- **Issue:** Test created `git tag appdev/round-1` in a fresh git repo without any commits, causing `fatal: Failed to resolve 'HEAD'`
- **Fix:** Added `git commit --allow-empty -m init` before creating the tag
- **Files modified:** plugins/application-dev/scripts/test-appdev-cli.mjs
- **Verification:** Test passes -- round-complete detection works with real git tags
- **Committed in:** 9533d4d (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test setup)
**Impact on plan:** Minimal -- test fixture needed an initial commit for git tag operations.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI foundation complete: resume-check and static-serve subcommands are ready for orchestrator integration
- Plan 02 can now wire these subcommands into SKILL.md Step 0 (four-branch resume logic), critic agents (static-serve calls), and generator agent (production build requirement)
- All 54 tests pass, including 26 pre-existing tests confirming no regressions

---
*Phase: 09-crash-recovery*
*Completed: 2026-04-02*
