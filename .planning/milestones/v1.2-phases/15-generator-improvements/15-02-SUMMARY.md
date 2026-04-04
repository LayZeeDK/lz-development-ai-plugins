---
phase: 15-generator-improvements
plan: 02
subsystem: generator
tags: [vite-plus, browser-built-in-ai, dependency-freshness, generator, skill-refresh]

# Dependency graph
requires:
  - phase: 15-generator-improvements (plan 01)
    provides: browser-built-in-ai meta-skill referenced by generator.md Step 4
provides:
  - Vite+ skill refreshed to v0.1.15 with breaking changes, full CLI inventory, alpha caveat
  - Generator agent with Vite+ default status, dependency freshness instruction, Built-in AI hierarchy, vp-first diagnostics
affects: [generator, vite-plus, browser-built-in-ai]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vite+ as default toolchain (not preference) with explicit justification requirement for plain Vite"
    - "Dependency freshness in Round 1 only with non-SemVer exceptions list"
    - "Built-in AI hierarchy replacing three-equal-options framing"
    - "vp-first diagnostic commands with plain Vite in parentheses"

key-files:
  created: []
  modified:
    - plugins/application-dev/skills/vite-plus/SKILL.md
    - plugins/application-dev/agents/generator.md

key-decisions:
  - "Vite+ framed as default toolchain (not preference) with escape hatch for Angular, Nuxt, TanStack Start"
  - "Dependency freshness Round 1 only with cybernetics damping principle for Round 2+"
  - "Built-in AI hierarchy replaces three-equal-options framing (task-specific -> LanguageModel -> WebLLM -> WebNN)"
  - "vp commands lead in all diagnostic and quality tooling references"

patterns-established:
  - "Default-with-escape-hatch: tool is default, exceptions explicitly listed, Generator must justify alternatives"
  - "Round-scoped instructions: different Generator behavior in Round 1 vs Round 2+ (freshness vs damping)"

requirements-completed: [GEN-02, GEN-03, GEN-04]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 15 Plan 02: Vite+ Skill Refresh and Generator Updates Summary

**Vite+ skill refreshed to v0.1.15 with breaking changes (VP_* env vars, vp run flag order, viteplus.dev URLs) and generator.md updated with Built-in AI hierarchy, dependency freshness instruction, Vite+ default status, and vp-first diagnostics**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-03T19:52:34Z
- **Completed:** 2026-04-03T19:58:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Rewrote vite-plus SKILL.md from 281 to 282 lines reflecting v0.1.15 with alpha caveat, breaking changes section, full CLI command inventory (30+ commands), updated bundled tool versions, and default-with-escape-hatch framing
- Updated generator.md with 5 targeted edits: frontmatter skills list (browser-built-in-ai), Vite+ default paragraph, dependency freshness instruction in Step 1, Built-in AI hierarchy in Step 4, vp-first diagnostic battery in Step 8

## Task Commits

Each task was committed atomically:

1. **Task 1: Refresh vite-plus SKILL.md to v0.1.15** - `4ab37d5` (feat)
2. **Task 2: Update generator.md (frontmatter, Step 1, Step 4, Step 8, Vite+ paragraph)** - `9916b40` (feat)

## Files Created/Modified
- `plugins/application-dev/skills/vite-plus/SKILL.md` - Full rewrite to v0.1.15: alpha caveat, breaking changes, updated install URLs (viteplus.dev), VP_* env vars, full CLI inventory, updated bundled tool versions, default framing
- `plugins/application-dev/agents/generator.md` - 5 edits: browser-built-in-ai in frontmatter, Vite+ default paragraph, dependency freshness in Step 1, Built-in AI hierarchy in Step 4, vp-first diagnostics in Step 8

## Decisions Made
- **Vite+ as default (not preference):** Changed "prefer Vite+ over plain Vite" to "Vite+ is the default toolchain" with explicit justification requirement for choosing plain Vite on compatible frameworks. Addresses GEN-04.
- **Dependency freshness scope:** Round 1 only with non-SemVer exceptions (Playwright calver, TypeScript minor breaks, 0.x packages). Round 2+ prohibited except when evaluation flags a dependency bug. Addresses GEN-03.
- **Built-in AI hierarchy:** Task-specific APIs first, then LanguageModel, then WebLLM, then WebNN. Replaces three-equal-options framing. Includes "Do NOT fall back to WebLLM" warning. Addresses GEN-01 (Step 4 reference to browser-built-in-ai skill created in Plan 01).
- **vp-first diagnostic ordering:** All quality tooling and diagnostic battery commands now lead with vp commands, plain Vite equivalents in parentheses. Addresses GEN-04.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Known Stubs

None -- all changes are complete instruction text, no placeholder content.

## Next Phase Readiness
- Vite+ skill and generator.md are updated and ready for use
- generator.md Step 4 references browser-built-in-ai skill path -- requires Plan 01 output (browser-built-in-ai/SKILL.md) to be committed for the reference to resolve at runtime
- All GEN-02, GEN-03, GEN-04 requirements addressed

## Self-Check: PASSED

- [x] vite-plus/SKILL.md exists
- [x] generator.md exists
- [x] 15-02-SUMMARY.md exists
- [x] Commit 4ab37d5 found
- [x] Commit 9916b40 found

---
*Phase: 15-generator-improvements*
*Completed: 2026-04-03*
