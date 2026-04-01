---
phase: 08-spec-acceptance-criteria-playwright-patterns
plan: 02
subsystem: testing
tags: [playwright, eval-first, write-and-run, acceptance-tests, token-efficiency]

# Dependency graph
requires:
  - phase: 07-ensemble-discriminator-architecture
    provides: perceptual-critic + projection-critic agent definitions with eval-first and write-and-run patterns
provides:
  - Shared PLAYWRIGHT-EVALUATION.md reference with 7 token-efficient browser evaluation techniques
  - Skeleton acceptance test file showing 1:1 criteria-to-test mapping pattern
  - Reuse/heal/regenerate decision tree for round 2+ test reuse
affects: [08-03 critic agent definition updates, perceptual-critic, projection-critic]

# Tech tracking
tech-stack:
  added: []
  patterns: [technique-pure shared reference, ProjectedGAN shared-feature-extractor, dependency inversion for evaluation techniques]

key-files:
  created:
    - plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md
  modified: []

key-decisions:
  - "Used viewport command name (matching existing perceptual-critic.md) instead of resize for consistency"
  - "Skeleton acceptance test uses accessibility-tree-first selectors (getByRole, getByLabel, getByText) for resilience to DOM restructuring"

patterns-established:
  - "Technique-pure shared references: describe HOW to interact with browser, not WHO uses it or WHAT to look for"
  - "1:1 criteria-to-test mapping: comment above each test cites the SPEC criterion it verifies"
  - "Round 2+ decision tree: reuse (pass or assertion-only failures), heal (1-2 selector timeouts), regenerate (multiple timeouts or >50%)"

requirements-completed: [TOKEN-01, PLAYWRIGHT-03, PLAYWRIGHT-04, PLAYWRIGHT-05, PLAYWRIGHT-06]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 8 Plan 02: PLAYWRIGHT-EVALUATION.md Summary

**Shared Playwright evaluation reference with 7 technique sections covering eval-first, write-and-run with skeleton test, and round 2+ reuse decision tree**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T12:04:21Z
- **Completed:** 2026-04-01T12:06:21Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created PLAYWRIGHT-EVALUATION.md with all 7 technique sections: eval-first, write-and-run, snapshot-as-fallback, resize+eval, console filtering, test healing, round 2+ test reuse
- write-and-run section includes 5-step workflow plus skeleton acceptance test file with criteria-to-test mapping pattern
- round 2+ test reuse section documents clear reuse/heal/regenerate decision tree with mechanical thresholds
- Reference is technique-pure following ProjectedGAN shared-feature-extractor pattern -- no "Used by" annotations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PLAYWRIGHT-EVALUATION.md with all 7 technique sections** - `4d700c9` (feat)

## Files Created/Modified
- `plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md` - Shared Playwright evaluation techniques reference (174 lines)

## Decisions Made
- Used `viewport` command name matching existing perceptual-critic.md rather than `resize` -- consistency with deployed agent definitions takes priority over upstream naming
- Skeleton acceptance test uses accessibility-tree-first selectors (getByRole, getByPlaceholder, getByText) for resilience to DOM restructuring between rounds

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- PLAYWRIGHT-EVALUATION.md is ready for Plan 03 to wire into critic agent definitions via Read instructions
- Both perceptual-critic.md and projection-critic.md will reference specific sections as documented in the Plan 03 key_links

## Self-Check: PASSED

- [x] PLAYWRIGHT-EVALUATION.md exists at expected path
- [x] Task commit 4d700c9 exists in git log

---
*Phase: 08-spec-acceptance-criteria-playwright-patterns*
*Completed: 2026-04-01*
