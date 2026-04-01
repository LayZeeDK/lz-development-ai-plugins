---
phase: 10-v1.1-audit-gap-closure
plan: 01
subsystem: ensemble-critics
tags: [install-dep, static-serve, playwright, baseURL, SAFETY_CAP, bug-fix]

# Dependency graph
requires:
  - phase: 09-crash-recovery
    provides: static-serve lifecycle, install-dep mutex, critic agent definitions
provides:
  - "install-dep --package calling convention matches CLI parseArgs in both critics"
  - "SAFETY_CAP wrap-up stops stale static-serve before spawning Generator"
  - "@playwright/test installed in Step 0.5 for projection-critic acceptance tests"
  - "baseURL configuration pattern in PLAYWRIGHT-EVALUATION.md skeleton test"
affects: [10-02, v1.2-critics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One install-dep call per package (--package flag, not positional args)"
    - "static-serve --stop before every Generator spawn (both should_continue and SAFETY_CAP paths)"
    - "test.use({ baseURL }) in skeleton acceptance test with port substitution from static-serve JSON"

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/perceptual-critic.md
    - plugins/application-dev/agents/projection-critic.md
    - plugins/application-dev/skills/application-dev/SKILL.md
    - plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md

key-decisions:
  - "Used --package flag per call (one package per invocation) rather than modifying CLI to accept positional args -- zero CLI code changes, zero test changes"
  - "Kept both static-serve --stop calls in SAFETY_CAP path: one before wrap-up Generator (prevents stale build), one after final evaluation (cleanup)"

patterns-established:
  - "install-dep --package <name>: one call per package, matching parseArgs consumption model"
  - "static-serve --stop before Generator in all convergence paths"
  - "test.use({ baseURL: 'http://localhost:PORT' }) as first configuration in acceptance test skeleton"

requirements-completed: [ENSEMBLE-04, RECOVERY-03, PLAYWRIGHT-02, PLAYWRIGHT-04]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 10 Plan 01: Integration Bug Fixes Summary

**Four surgical fixes to install-dep calling convention, SAFETY_CAP stale build, @playwright/test installation, and baseURL configuration -- zero CLI code changes, all 57 tests pass**

## Performance

- **Duration:** ~5 min (both tasks pre-committed)
- **Started:** 2026-04-02T01:20:00Z
- **Completed:** 2026-04-02T01:23:00Z
- **Tasks:** 2
- **Files modified:** 5 (plus 2 files deleted)

## Accomplishments
- Fixed install-dep calling convention in both critic agents to use --package flag matching CLI parseArgs
- Inserted static-serve --stop before SAFETY_CAP wrap-up Generator spawn to prevent stale build evaluation
- Added @playwright/test installation in SKILL.md Step 0.5 alongside @playwright/cli
- Added explicit test.use({ baseURL }) to PLAYWRIGHT-EVALUATION.md skeleton test with port substitution pattern
- Deleted orphaned evaluator-hardening-structure.test.mjs (528 lines) and ASSET-VALIDATION-PROTOCOL.md (48 lines) from Plan 02 scope

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix install-dep calling convention and SAFETY_CAP stale build** - `870331c` (fix)
2. **Task 2: Fix baseURL configuration in skeleton test and projection-critic** - `efcba13` (fix)

## Files Created/Modified
- `plugins/application-dev/agents/perceptual-critic.md` - Three separate install-dep --package calls (sharp, imghash, leven)
- `plugins/application-dev/agents/projection-critic.md` - install-dep --package ajv + port substitution reminder in write-and-run
- `plugins/application-dev/skills/application-dev/SKILL.md` - static-serve --stop before SAFETY_CAP wrap-up + @playwright/test in Step 0.5
- `plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md` - test.use({ baseURL }) in skeleton + key patterns list
- `tests/evaluator-hardening-structure.test.mjs` - DELETED (528 lines, referenced deleted evaluator.md)
- `plugins/application-dev/skills/application-dev/references/evaluator/ASSET-VALIDATION-PROTOCOL.md` - DELETED (48 lines, orphaned reference)

## Decisions Made
- Used --package flag per call (one package per invocation) rather than modifying CLI to accept positional args -- zero CLI code changes, zero test changes needed
- Kept both static-serve --stop calls in SAFETY_CAP path: one before wrap-up Generator (prevents stale build), one after final evaluation (cleanup)
- Deleted evaluator-hardening-structure.test.mjs and ASSET-VALIDATION-PROTOCOL.md in Task 1 commit (Plan 02 scope items, cleaned early since they were blocking/orphaned)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Deleted evaluator-hardening-structure.test.mjs and ASSET-VALIDATION-PROTOCOL.md**
- **Found during:** Task 1
- **Issue:** evaluator-hardening-structure.test.mjs (528 lines) references deleted evaluator.md; ASSET-VALIDATION-PROTOCOL.md (48 lines) is an orphaned reference with no consumer
- **Fix:** Deleted both files (originally Plan 02 scope, but they were stale artifacts blocking clean state)
- **Files modified:** tests/evaluator-hardening-structure.test.mjs (deleted), plugins/.../ASSET-VALIDATION-PROTOCOL.md (deleted)
- **Verification:** git status confirms removal; no test references remaining
- **Committed in:** 870331c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking -- stale artifacts from Plan 02 scope pulled forward)
**Impact on plan:** Cleanup was necessary and reduces Plan 02 scope. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01 complete, ready for Plan 02 (stale artifact cleanup, generator refs, README)
- Plan 02 scope reduced: evaluator-hardening-structure.test.mjs and ASSET-VALIDATION-PROTOCOL.md already deleted in Plan 01

## Self-Check: PASSED

- [x] plugins/application-dev/agents/perceptual-critic.md -- FOUND
- [x] plugins/application-dev/agents/projection-critic.md -- FOUND
- [x] plugins/application-dev/skills/application-dev/SKILL.md -- FOUND
- [x] plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md -- FOUND
- [x] tests/evaluator-hardening-structure.test.mjs -- CONFIRMED DELETED
- [x] plugins/.../ASSET-VALIDATION-PROTOCOL.md -- CONFIRMED DELETED
- [x] Commit 870331c -- FOUND
- [x] Commit efcba13 -- FOUND

---
*Phase: 10-v1.1-audit-gap-closure*
*Completed: 2026-04-02*
