---
phase: quick-260405-5bh
plan: 01
subsystem: ai-planner
tags: [planner, ai-features, reference-doc, wow-tier, spec-template]

# Dependency graph
requires:
  - phase: v1.0
    provides: planner agent, SPEC-TEMPLATE, reference doc loading pattern
provides:
  - "ai-feature-inspiration.md reference doc with principles-first Wow-tier heuristics"
  - "Strengthened planner rule #4 with Read directive for AI feature reference"
  - "Unconditional AI integration in self-verification (no conditional gate)"
  - "Wow-tier quality bar examples in planner agent"
  - "SPEC-TEMPLATE.md AI Integration section comment hint"
affects: [planner, generator, evaluator]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Progressive disclosure: read-before-write pattern for reference docs"]

key-files:
  created:
    - "plugins/application-dev/skills/application-dev/references/ai-feature-inspiration.md"
  modified:
    - "plugins/application-dev/agents/planner.md"
    - "plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md"

key-decisions:
  - "Principles-first reference doc (119 lines) instead of feature catalog to teach thinking heuristics"
  - "Unconditional AI features -- every spec gets them unless prompt explicitly excludes"
  - "Wow-tier spectrum (Regular vs Wow) as the primary calibration tool"

patterns-established:
  - "AI feature read-before-write: planner reads ai-feature-inspiration.md before AI Integration section"
  - "Escape hatch pattern: unconditional behavior with explicit opt-out clause"

requirements-completed: [QUICK-5BH]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Quick Task 260405-5bh: Prime the Planner to Add Wow-Tier AI Features

**Principles-first AI feature reference doc (119 lines) with planner instruction strengthening to shift from Regular-tier API wrappers to Wow-tier on-device/multi-modal/domain-aware AI features**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T01:56:47Z
- **Completed:** 2026-04-05T01:59:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created ai-feature-inspiration.md: 119-line principles-first reference doc with 6 sections (Wow Spectrum, Thinking Heuristics, AI Capability Menu, Browser AI Capabilities, Anti-Patterns, Integration Depth)
- Replaced planner rule #4 with Read directive for the new reference doc, following the same progressive disclosure pattern as frontend-design-principles.md and acceptance-criteria-guide.md
- Made AI features unconditional by removing "if the user prompt implies AI features" guard from self-verification item #6
- Updated quality bar to demonstrate Wow-tier expectations (on-device WebGPU, local LLM, learning from play-tests) instead of generic API wrappers
- Added Wow-tier comment hint to SPEC-TEMPLATE.md AI Integration section

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ai-feature-inspiration.md reference doc** - `c876994` (feat)
2. **Task 2: Strengthen planner.md AI instructions and update SPEC-TEMPLATE.md** - `f5515a0` (feat)

## Files Created/Modified
- `plugins/application-dev/skills/application-dev/references/ai-feature-inspiration.md` - Principles-first teaching doc for Wow-tier AI feature design
- `plugins/application-dev/agents/planner.md` - Rule #4, self-verification #6, quality bar updated
- `plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md` - AI Integration comment hint

## Decisions Made
- Wrote the reference doc as heuristics and one-liner category prompts (119 lines) rather than a feature catalog -- the Planner already knows about these technologies from training; it needs ambition calibration, not a textbook
- Made AI features unconditional with an escape hatch clause rather than leaving them conditional -- matches how visual design and acceptance criteria are already treated
- Used contrastive Regular-vs-Wow table (5 pairs) as the primary calibration device

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None -- all changes are complete and wired.

## Next Phase Readiness
- Planner is now primed to produce Wow-tier AI features in every spec
- Generator and Evaluator may need complementary updates in future tasks to handle the increased AI feature ambition
- Research files (ai-feature-taxonomy.md, ai-feature-examples.md) remain available as offline inspiration

## Self-Check: PASSED

- [x] ai-feature-inspiration.md exists (119 lines)
- [x] planner.md updated (3 edits verified)
- [x] SPEC-TEMPLATE.md updated (comment hint verified)
- [x] SUMMARY.md created
- [x] Commit c876994 exists (Task 1)
- [x] Commit f5515a0 exists (Task 2)

---
*Phase: quick-260405-5bh*
*Completed: 2026-04-05*
