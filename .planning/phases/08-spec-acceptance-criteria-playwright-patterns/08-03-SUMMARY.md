---
phase: 08-spec-acceptance-criteria-playwright-patterns
plan: 03
subsystem: testing
tags: [playwright, critic-wiring, console-filtering, round-2-reuse, test-boundary]

# Dependency graph
requires:
  - phase: 08-spec-acceptance-criteria-playwright-patterns
    provides: PLAYWRIGHT-EVALUATION.md shared reference with 7 technique sections (Plan 02)
  - phase: 07-ensemble-discriminator-architecture
    provides: perceptual-critic + projection-critic agent definitions with eval-first and write-and-run patterns
provides:
  - Perceptual-critic wired to PLAYWRIGHT-EVALUATION.md (eval-first, resize+eval, console filtering sections)
  - Projection-critic wired to PLAYWRIGHT-EVALUATION.md (write-and-run, snapshot-as-fallback, console filtering, test healing, round 2+ sections)
  - Projection-critic round 2+ test reuse with reuse/heal/regenerate decision tree
  - Generator dev test boundary statement separating tests/ from evaluation/round-N/
affects: [application-dev orchestrator, evaluation workflow, future critic enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns: [progressive disclosure Read instructions with section-specific focus, mirror boundary statements in both sides of an interface]

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/perceptual-critic.md
    - plugins/application-dev/agents/projection-critic.md
    - plugins/application-dev/agents/generator.md

key-decisions:
  - "Both critics use explicit `npx playwright-cli console error` (filtered) instead of generic console filtering instruction"
  - "Round 2+ Test Reuse subsection embedded directly in projection-critic agent definition for quick reference (not just in PLAYWRIGHT-EVALUATION.md)"
  - "Generator boundary statement uses WHY-based rationale explaining independent test suites catch different defect classes"

patterns-established:
  - "Section-specific Read instructions: agent definition tells critic which sections of a shared reference to focus on"
  - "Mirror boundary statements: both sides of an interface (Generator and projection-critic) state the boundary from their perspective"

requirements-completed: [PLAYWRIGHT-01, PLAYWRIGHT-02, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 8 Plan 03: Critic Agent Wiring Summary

**Both critics wired to PLAYWRIGHT-EVALUATION.md with section-specific Read instructions, explicit console error filtering, round 2+ test reuse decision tree, and Generator dev test boundary**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T12:10:03Z
- **Completed:** 2026-04-01T12:12:39Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Perceptual-critic gains Read instruction targeting eval-first, resize+eval, and console filtering sections of PLAYWRIGHT-EVALUATION.md
- Projection-critic gains Read instruction targeting write-and-run, snapshot-as-fallback, console filtering, test healing, and round 2+ sections of PLAYWRIGHT-EVALUATION.md
- Both critics now use explicit `npx playwright-cli console error` command instead of generic filtering description
- Projection-critic has Round 2+ Test Reuse subsection with mechanical reuse/heal/regenerate decision thresholds
- Generator has explicit dev test boundary statement from its perspective, mirroring the projection-critic's Acceptance Test Independence section

## Task Commits

Each task was committed atomically:

1. **Task 1: Update perceptual-critic.md with PLAYWRIGHT-EVALUATION.md Read instruction and console filtering** - `bb953b4` (feat)
2. **Task 2: Update projection-critic.md with PLAYWRIGHT-EVALUATION.md Read instruction and round 2+ logic** - `caaca5e` (feat)
3. **Task 3: Add dev test boundary clarification to generator.md** - `24dbda4` (feat)

## Files Created/Modified
- `plugins/application-dev/agents/perceptual-critic.md` - Added PLAYWRIGHT-EVALUATION.md Read instruction in OBSERVE step, explicit console error filtering (114 lines, cap 130)
- `plugins/application-dev/agents/projection-critic.md` - Added PLAYWRIGHT-EVALUATION.md Read instruction in TEST step, explicit console error filtering, Round 2+ Test Reuse subsection (168 lines, cap 175)
- `plugins/application-dev/agents/generator.md` - Added dev test boundary statement in Testing Skills section (255 lines)

## Decisions Made
- Both critics use explicit `npx playwright-cli console error` (filtered) -- makes the command concrete rather than leaving it to interpretation, consistent with PLAYWRIGHT-EVALUATION.md's console filtering section
- Round 2+ Test Reuse subsection embedded in projection-critic.md directly (not only in the shared reference) -- the decision tree is critical path logic the critic needs without a second Read instruction during round 2+
- Generator boundary statement uses bold label `**Dev test boundary:**` for scannability and WHY-based rationale for motivation

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- Phase 8 is now complete: all 3 plans executed (SPEC template + planner criteria, PLAYWRIGHT-EVALUATION.md reference, critic wiring + Generator boundary)
- All 16 Phase 8 requirements addressed across the 3 plans
- The evaluation ensemble is ready for end-to-end testing with SPEC acceptance criteria flowing through planner -> projection-critic -> CLI

## Self-Check: PASSED

- [x] perceptual-critic.md exists and has PLAYWRIGHT-EVALUATION.md Read instruction + console error
- [x] projection-critic.md exists and has PLAYWRIGHT-EVALUATION.md Read instruction + Round 2+ + console error
- [x] generator.md exists and has dev test boundary statement
- [x] 08-03-SUMMARY.md exists
- [x] Task commit bb953b4 exists in git log
- [x] Task commit caaca5e exists in git log
- [x] Task commit 24dbda4 exists in git log

---
*Phase: 08-spec-acceptance-criteria-playwright-patterns*
*Completed: 2026-04-01*
