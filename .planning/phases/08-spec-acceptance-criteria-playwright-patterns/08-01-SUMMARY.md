---
phase: 08-spec-acceptance-criteria-playwright-patterns
plan: 01
subsystem: testing
tags: [acceptance-criteria, spec-template, planner, behavioral-testing]

# Dependency graph
requires:
  - phase: 07-ensemble-discriminator-architecture
    provides: ensemble architecture with perceptual and projection critics, progressive disclosure pattern
provides:
  - Acceptance Criteria section in SPEC-TEMPLATE.md with inline good/bad examples
  - acceptance-criteria-guide.md reference (~70 lines) teaching testable behavioral criteria
  - Planner Read instruction for criteria guide with progressive disclosure
  - Planner self-verification items 7 and 8 for criteria presence and quality
affects: [08-02, 08-03, planner, projection-critic]

# Tech tracking
tech-stack:
  added: []
  patterns: [acceptance-criteria-bullet-format, criteria-tier-minimums, consumer-agnostic-guidance]

key-files:
  created:
    - plugins/application-dev/skills/application-dev/references/acceptance-criteria-guide.md
  modified:
    - plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md
    - plugins/application-dev/agents/planner.md

key-decisions:
  - "Criteria guide at 70 lines (slightly over ~50 target) to cover all 5 sections with enough depth for standalone use"
  - "Read instruction placed after Guidelines for Feature Design, before Guidelines for Visual Design -- matches workflow order"
  - "3 good + 3 bad inline examples in SPEC-TEMPLATE.md comment block (matching upper bound of 2-3 each)"

patterns-established:
  - "Acceptance criteria bullet format: one observable outcome per bullet, 1:1 mapping to automated test assertions"
  - "Tier minimums: Core >= 3 (happy + edge + error), Important >= 2, Nice-to-have >= 1"
  - "Consumer-agnostic guidance: criteria guide says 'automated tests' without naming critic, Playwright, or write-and-run"

requirements-completed: [SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 8 Plan 01: SPEC Acceptance Criteria + Planner Guidance Summary

**Behavioral acceptance criteria added to SPEC template with inline examples and planner guidance reference for testable assertions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T12:04:21Z
- **Completed:** 2026-04-01T12:07:05Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- SPEC-TEMPLATE.md now has an Acceptance Criteria section between User Stories and Data Model with 3 good and 3 bad inline examples in a comment block, plus 3 placeholder bullets
- acceptance-criteria-guide.md created at 70 lines covering all 5 sections: testable criteria, good/bad examples, tier rules, common pitfalls, AI feature criteria
- Planner workflow updated with Read instruction for criteria guide using progressive disclosure (after feature writing, before criteria addition)
- Planner self-verification expanded from 6 to 8 items, adding criteria presence check and criteria quality/count check

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Acceptance Criteria to SPEC-TEMPLATE.md and create acceptance-criteria-guide.md** - `73d5099` (feat)
2. **Task 2: Update planner.md with criteria guidance and self-verification** - `d5986c6` (feat)

## Files Created/Modified
- `plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md` - Added Acceptance Criteria section with inline good/bad examples between User Stories and Data Model
- `plugins/application-dev/skills/application-dev/references/acceptance-criteria-guide.md` - New reference (~70 lines) teaching testable behavioral criteria across 5 sections
- `plugins/application-dev/agents/planner.md` - Added Writing Acceptance Criteria section with Read instruction + 2 new self-verification items (7, 8)

## Decisions Made
- Criteria guide landed at 70 lines rather than the ~50 target -- the extra lines are from the 5 good/bad example pairs in section 2 and the AI criteria section, both requiring enough context to be useful standalone
- Placed the Read instruction in a new "Writing Acceptance Criteria" section between "Guidelines for Feature Design" and "Guidelines for Visual Design" rather than inline after the design principles Read -- this creates a clearer workflow separation and matches the progressive disclosure pattern from Phase 7

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- SPEC-TEMPLATE.md and planner.md are ready for Plan 02 (PLAYWRIGHT-EVALUATION.md reference) and Plan 03 (critic agent definition updates)
- The acceptance-criteria-guide.md is consumer-agnostic, preserving the GAN separation -- projection-critic can mechanically translate criteria to tests without the planner knowing how criteria are consumed
- All 5 SPEC requirements (SPEC-01 through SPEC-05) addressed in this plan

---
## Self-Check: PASSED

All 3 created/modified source files verified on disk. Both task commits (73d5099, d5986c6) verified in git log. SUMMARY.md created.

---
*Phase: 08-spec-acceptance-criteria-playwright-patterns*
*Completed: 2026-04-01*
