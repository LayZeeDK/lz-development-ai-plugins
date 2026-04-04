---
phase: 260404-ft9
plan: 01
subsystem: orchestration
tags: [toctou, race-condition, path-guardrail, sequential-spawning, static-serve, generator-heuristic]

# Dependency graph
requires:
  - phase: v1.2
    provides: application-dev plugin with parallel critic spawning and static-serve
provides:
  - TOCTOU-safe static-serve with double-checked locking
  - Path construction guardrails on all 3 critics
  - Negative instruction preventing --test-dir hallucination
  - Project-type classification heuristic (website vs app)
  - Image bundling requirement (no runtime external fetches)
  - Favicon instruction (project-appropriate, not framework defaults)
  - Sequential critic spawning with per-critic binary checks
  - Git commit checkpoint after critic summaries
  - Platform Bug Context documentation
affects: [application-dev]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Double-checked locking pattern for static-serve mutex"
    - "Negative instruction pattern for hallucinated CLI flags"
    - "Project-type classification heuristic (website vs app)"
    - "Sequential critic spawning with interleaved binary checks"

key-files:
  created: []
  modified:
    - plugins/application-dev/scripts/appdev-cli.mjs
    - plugins/application-dev/agents/perturbation-critic.md
    - plugins/application-dev/agents/projection-critic.md
    - plugins/application-dev/agents/perceptual-critic.md
    - plugins/application-dev/agents/generator.md
    - plugins/application-dev/skills/application-dev/SKILL.md

key-decisions:
  - "Sequential critic spawning trades speed for reliability against platform bugs"
  - "Commit checkpoint after critics enables crash recovery before compile-evaluation"
  - "Website projects use static HTML/CSS/JS with no framework runtime"

patterns-established:
  - "Path Construction Guardrail: Bad/Good negative examples prevent doubled-path bugs"
  - "Double-checked locking: re-read state after mutex to prevent TOCTOU races"

requirements-completed: [FT9-1, FT9-2, FT9-3, FT9-4, FT9-5, FT9-6]

# Metrics
duration: 5min
completed: 2026-04-04
---

# Quick Task 260404-ft9: Resolve v1.2 Dutch Art Museum Test Issues

**TOCTOU race fix in static-serve, path guardrails on all critics, project-type heuristic for generator, sequential critic spawning with commit checkpoints**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-04T10:08:04Z
- **Completed:** 2026-04-04T10:12:36Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Eliminated static-serve TOCTOU race with double-checked locking inside mutex
- Added path construction guardrails to all 3 critic agents preventing doubled-path bugs
- Added --test-dir negative instruction to projection-critic preventing hallucinated CLI flag
- Added project-type classification heuristic to generator (website vs app stack selection)
- Added image bundling requirement and favicon instruction to generator
- Replaced parallel critic spawning with sequential in both eval phase and SAFETY_CAP wrap-up
- Added git commit checkpoint after critic summaries for crash recovery
- Documented 5 platform bugs with mitigations in SKILL.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix static-serve TOCTOU race and harden critic path construction** - `84261f2` (fix)
2. **Task 2: Update Generator with project-type heuristic, image bundling, and favicon** - `8d90f64` (feat)
3. **Task 3: Update Orchestrator for sequential critics, commit checkpoint, and platform bug note** - `fb528cd` (feat)

## Files Created/Modified
- `plugins/application-dev/scripts/appdev-cli.mjs` - TOCTOU fix: state re-read + idempotent re-check inside mutex after lock acquisition
- `plugins/application-dev/agents/perturbation-critic.md` - Path Construction Guardrail section with Bad/Good examples
- `plugins/application-dev/agents/projection-critic.md` - Path Construction Guardrail + --test-dir negative instruction
- `plugins/application-dev/agents/perceptual-critic.md` - Path Construction Guardrail section with Bad/Good examples
- `plugins/application-dev/agents/generator.md` - Project-Type Classification, image bundling, favicon instructions
- `plugins/application-dev/skills/application-dev/SKILL.md` - Sequential critics, commit checkpoint, Platform Bug Context

## Decisions Made
- Used loop variable `j` in TOCTOU re-check to avoid shadowing outer `i` from pre-lock check
- Sequential spawning trades speed for reliability -- platform bugs (#37521 agent freeze, #32304 memory leak) make parallel spawning unreliable
- Commit checkpoint placed after all binary checks pass, before compile-evaluation -- enables crash recovery
- Updated Architecture section to reflect sequential (not parallel) critic execution

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all changes are complete instructions and code, not placeholders.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 issues from the v1.2 Dutch art museum test are resolved
- Plugin ready for next test run

## Self-Check: PASSED

All 7 files verified present. All 3 task commits verified in git log.

---
*Quick Task: 260404-ft9*
*Completed: 2026-04-04*
