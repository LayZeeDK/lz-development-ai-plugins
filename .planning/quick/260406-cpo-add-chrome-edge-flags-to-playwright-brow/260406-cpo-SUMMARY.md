---
phase: quick-260406-cpo
plan: 01
subsystem: testing
tags: [playwright, vitest-browser, chromium-flags, built-in-ai, edge, chrome]

requires:
  - phase: quick-260405-k8s
    provides: msedge channel enforcement for Playwright usage
provides:
  - Per-API feature flag reference table for all 7 Built-in AI APIs
  - Expanded Edge and Chrome launchOptions configs with full flag coverage
  - Chrome Beta headed mode example in vitest-browser SKILL.md
affects: [browser-built-in-ai, vitest-browser, generator, evaluator]

tech-stack:
  added: []
  patterns: [per-API feature flags for Chrome/Edge browser AI testing]

key-files:
  created: []
  modified:
    - plugins/application-dev/skills/browser-built-in-ai/SKILL.md
    - plugins/application-dev/skills/vitest-browser/SKILL.md

key-decisions:
  - "Use Blink runtime feature names (AIWriterAPI, AIRewriterAPI) not base::Feature names (EnableAIWriterAPI)"
  - "Include flags for stable APIs (Summarizer, Translator) even though they may not strictly need them -- harmless redundancy prevents intermittent failures"

patterns-established:
  - "Per-API flags: always list all supported API flags explicitly in --enable-features, even for stable APIs"

requirements-completed: [QUICK-260406-CPO]

duration: 2min
completed: 2026-04-06
---

# Quick Task 260406-cpo: Add Chrome/Edge Flags for All Built-in AI APIs

**Per-API feature flags for all 7 Browser Built-in AI APIs added to Playwright/Vitest testing configs (4 Edge, 7 Chrome)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T07:22:03Z
- **Completed:** 2026-04-06T07:23:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added per-API feature flag reference table to browser-built-in-ai SKILL.md section 6, covering all 7 APIs with Chrome and Edge columns
- Expanded Edge Dev launchOptions from 1 API flag (AIPromptAPI) to all 4 supported Edge AI APIs
- Expanded Chrome Beta launchOptions from 2 flags to all 7 Chrome AI APIs plus foundation flag
- Added Chrome Beta headed mode example to vitest-browser SKILL.md section 3

## Task Commits

Each task was committed atomically:

1. **Task 1: Update browser-built-in-ai SKILL.md section 6 with per-API flags** - `a811418` (docs)
2. **Task 2: Update vitest-browser SKILL.md section 3 headed mode examples** - `aa9e56b` (docs)

## Files Created/Modified
- `plugins/application-dev/skills/browser-built-in-ai/SKILL.md` - Added per-API flag reference table and expanded Edge/Chrome launchOptions configs in section 6
- `plugins/application-dev/skills/vitest-browser/SKILL.md` - Expanded Edge headed mode args and added Chrome Beta headed mode example in section 3

## Decisions Made
- Used Blink runtime feature names (AIWriterAPI, AIRewriterAPI) rather than base::Feature names -- these are what --enable-features maps to internally
- Included flags for stable APIs even when redundant -- prevents intermittent failures when Playwright's ignoreDefaultArgs interacts with Finch gating

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Known Stubs
None -- all content is final documentation, no placeholder values.

---
*Quick task: 260406-cpo*
*Completed: 2026-04-06*
