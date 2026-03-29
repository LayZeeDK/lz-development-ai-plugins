---
phase: 05-optimize-agent-definitions
plan: 03
subsystem: agents
tags: [instruction-engineering, emphasis, progressive-disclosure, WHY-rationale]

# Dependency graph
requires:
  - phase: 04-generator-hardening-and-skills
    provides: Generator rewrite with progressive CI, skills routing, asset pipeline
provides:
  - Generator agent with WHY-based rationale and reframed skills loading note
  - Planner agent with cleaned emphasis and WHY-based design guidance
affects: [application-dev-plugin]

# Tech tracking
tech-stack:
  added: []
  patterns: [WHY-based-rationale, selective-skill-loading, no-ALL-CAPS-emphasis]

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/generator.md
    - plugins/application-dev/agents/planner.md

key-decisions:
  - "Skills loading reframed as design choice (selective loading efficiency) not bug workaround"
  - "WHY-based rationale replaces bare directives in Quality Standards and Rules"
  - "ALL-CAPS emphasis eliminated from both agent definitions"

patterns-established:
  - "WHY-based rationale: every constraint explains its consequence (e.g., 'wastes a generation round', 'contaminate the adversarial feedback loop')"
  - "Selective loading framing: Read instructions are primary by design, not bug fallback"
  - "Zero ALL-CAPS MUST/NEVER/CRITICAL/ALWAYS across all agent definitions"

requirements-completed: [OPT-01, OPT-05]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 05 Plan 03: Generator and Planner Emphasis Refinement Summary

**WHY-based rationale added to generator rules and quality standards, skills note reframed as selective loading design choice, ALL-CAPS emphasis eliminated from both agents**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T13:47:26Z
- **Completed:** 2026-03-29T13:49:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Generator skills loading note reframed from bug #25834 workaround to selective loading design choice (~2-3k on demand vs ~15k upfront)
- WHY-based rationale added to generator Rules (adversarial feedback loop contamination) and Quality Standards (round-wasting stubs, 404 asset validation)
- ALL-CAPS MUST eliminated from generator Install and Start Convention
- Planner ALL-CAPS NOT converted to lowercase in tech stack rule
- Anti-AI-slop guideline strengthened with WHY rationale (common markers of LLM-generated applications)

## Task Commits

Each task was committed atomically:

1. **Task 1: Refine generator.md emphasis, skills note, and round-conditional labels** - `74978c9` (refactor)
2. **Task 2: Refine planner.md emphasis with WHY-based rationale** - `e0600d6` (refactor)

## Files Created/Modified

- `plugins/application-dev/agents/generator.md` - Skills note reframed, WHY rationale on rules/quality standards, ALL-CAPS removed
- `plugins/application-dev/agents/planner.md` - ALL-CAPS NOT removed, AI-slop guideline WHY rationale added

## Decisions Made

- **Skills loading reframe:** Changed from "Due to bug #25834... always use Read as fallback" to "Read instructions are the primary mechanism -- selective loading (~2-3k vs ~15k)." This follows CONTEXT.md decision that Read is superior by design.
- **WHY specificity:** Each WHY clause names a concrete consequence: "waste a generation round," "contaminate the adversarial feedback loop," "trigger Evaluator's asset validation as Critical bugs." Vague rationale ("for consistency") avoided.
- **Planner line 94 NOT preserved:** "does NOT include" in Self-Verification item 4 is descriptive text (what the section states), not an imperative instruction. Converting it would reduce clarity.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- All four agent definitions (evaluator, generator, planner, SKILL.md) will have consistent emphasis patterns once plans 01, 02, and 03 are all complete
- Generator and planner refinements are backward-compatible -- no integration contract changes
- Total line count across agents + SKILL.md (1246) will reach the under-1200 target once plans 01 and 02 apply their extractions

---
## Self-Check: PASSED

- [x] generator.md exists and is 253 lines with 13 CLAUDE_PLUGIN_ROOT refs
- [x] planner.md exists and is 98 lines with 2 CLAUDE_PLUGIN_ROOT refs
- [x] 05-03-SUMMARY.md exists
- [x] Commit 74978c9 exists (Task 1)
- [x] Commit e0600d6 exists (Task 2)

---
*Phase: 05-optimize-agent-definitions*
*Completed: 2026-03-29*
