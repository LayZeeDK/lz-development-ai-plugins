---
phase: quick-260405-0az
plan: 01
subsystem: agents
tags: [planner, hallucination-guard, entity-research, web-fetch, ai-slop]

# Dependency graph
requires:
  - phase: 08-acceptance-criteria
    provides: planner.md with criteria guidance and self-verification
provides:
  - Entity research protocol in planner agent (markdown.new + WebFetch)
  - Fabricated-entity detection in AI Slop Checklist for critics
affects: [planner, evaluator, critics]

# Tech tracking
tech-stack:
  added: [markdown.new fetch chain, WebFetch fallback]
  patterns: [entity-research-before-spec, fetch-chain-fallback]

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/planner.md
    - plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md

key-decisions:
  - "markdown.new as preferred fetch method with WebFetch as fallback -- matches project fetch chain convention"
  - "Assumptions flagged with [ASSUMED -- not verified] marker when fetches fail -- visible to downstream agents"

patterns-established:
  - "Entity Research protocol: detect real-world entities in prompts, fetch before spec writing"
  - "Graceful degradation: fetch -> prompt facts only -> flag uncertainty"

requirements-completed: [HALLUCINATION-GUARD]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Quick Task 260405-0az: Prevent Hallucinations for Real Entities Summary

**Planner agent gets Bash/WebFetch tools with markdown.new-first entity research protocol and AI Slop Checklist fabrication detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T22:22:49Z
- **Completed:** 2026-04-04T22:25:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Planner agent now has Bash and WebFetch tools for real-time web fetching during spec creation
- Entity Research protocol added with 5-step process: detect entities, fetch via markdown.new (curl POST), WebFetch fallback, ground in fetched content, flag assumptions when fetches fail
- Critical Rule #7 explicitly forbids fabricating facts about real entities
- AI Slop Checklist expanded with fabricated-entity detection bullet for critic evaluation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Bash/WebFetch tools and Entity Research section to planner.md** - `93042cd` (feat)
2. **Task 2: Add fabricated-entity detection to AI Slop Checklist** - `261a568` (feat)

## Files Created/Modified

- `plugins/application-dev/agents/planner.md` - Added Bash/WebFetch to tools, Entity Research section with fetch chain, Critical Rule #7
- `plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md` - Added fabricated-entity bullet to Content Slop section

## Decisions Made

- Used markdown.new as preferred fetch method with WebFetch as fallback -- consistent with project's established fetch chain convention in CLAUDE.md
- When all fetches fail, assumptions are flagged with "[ASSUMED -- not verified]" marker -- makes uncertainty visible to downstream agents (Generator, Critics) without blocking the pipeline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all changes are complete instructions, not placeholder content.

## Next Phase Readiness

- Planner agent is ready to research real entities during spec creation
- Critics can now flag fabricated entity content via the AI Slop Checklist
- No blockers for future work

---
*Phase: quick-260405-0az*
*Completed: 2026-04-05*
