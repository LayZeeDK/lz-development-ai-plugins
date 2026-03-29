---
phase: 04-generator-hardening-and-skills
plan: 04
subsystem: agent-definition
tags: [generator, progressive-ci, testing-framework, asset-pipeline, vite-plus, skills-wiring, browser-ai]

# Dependency graph
requires:
  - phase: 04-generator-hardening-and-skills
    provides: playwright-testing skill (plan 01), vitest-browser and vite-plus skills and ASSETS-TEMPLATE.md (plan 02), check-assets CLI command (plan 03)
provides:
  - Hardened generator agent with progressive CI, testing decision framework, asset pipeline, skill wiring, Vite+ preference
affects: [05-optimize-agent-definitions]

# Tech tracking
tech-stack:
  added: []
  patterns: [progressive-ci-integration, testing-trophy-vs-pyramid, lean-skill-routing, asset-manifest-pipeline, vite-plus-preference]

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/generator.md

key-decisions:
  - "AI features section slimmed to lean decision router (~10 lines routing) with Read fallback -- no inline API details (LanguageModel, CreateMLCEngine, navigator.ml removed)"
  - "Testing decision framework uses table format routing by SPEC.md app type (Trophy for frontend SPA, Pyramid for CLI/data apps)"
  - "Skill loading note documents bug #25834 workaround: skills frontmatter for future auto-injection + explicit Read fallback for now"
  - "Diagnostic battery is diagnostic not gate: fix quick wins, document rest, always hand off to Evaluator"

patterns-established:
  - "Progressive CI integration: quality tooling configured at project setup, lint+typecheck per feature, full diagnostic before handoff"
  - "Testing decision framework: analyze SPEC.md app type to choose Trophy vs Pyramid emphasis"
  - "Lean skill routing: decision criteria in agent body, API details in skill SKILL.md files"
  - "Asset pipeline: ASSETS-TEMPLATE.md reference -> ASSETS.md manifest -> check-assets verification -> visual screenshot inspection"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 04 Plan 04: Generator Rewrite Summary

**Generator agent rewritten with progressive 4-phase CI integration, testing decision framework, asset verification pipeline, lean AI skill routing, and Vite+ preference**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T12:05:40Z
- **Completed:** 2026-03-29T12:11:06Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Rewrote generator.md from 139 lines to 253 lines with all 6 new capabilities integrated
- Restructured Round 1 build process into 4-phase progressive CI pattern: Project Setup (quality tooling) -> Per-Feature Development (lint+typecheck+test per feature) -> Integration (e2e tests) -> Pre-Handoff Diagnostic (full battery + assets + visual)
- Wired all 6 skills via frontmatter and Read fallback instructions: 3 browser AI skills + playwright-testing + vitest-browser + vite-plus
- Slimmed AI features section from ~30 lines of inline API details to ~10 lines of routing with Read instructions to skill SKILL.md files
- Added testing decision framework table routing by SPEC.md app type (Trophy vs Pyramid)
- Added asset sourcing pipeline: ASSETS-TEMPLATE.md reference, ASSETS.md manifest creation, check-assets URL verification, visual self-assessment screenshots
- Added Vite+ preference with compatibility-conditional fallback (Angular, Nuxt excluded)
- Added latest-stable-versions instruction

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite generator.md with progressive CI, skills, and asset pipeline** - `ad12311` (feat)
2. **Task 2: Verify generator.md structural integrity** - no commit (verification-only, all checks passed)

## Files Created/Modified
- `plugins/application-dev/agents/generator.md` - Complete rewrite: progressive CI integration, testing decision framework, lean AI skill routing, asset pipeline, Vite+ preference, latest-stable-versions, skills frontmatter with 6 skills

## Decisions Made
- AI features section slimmed to lean decision router: ~10 lines of routing with Read fallback, no inline API details (LanguageModel.availability, CreateMLCEngine, navigator.ml all removed -- content lives in skill SKILL.md files)
- Testing decision framework uses a table format routing by SPEC.md app type: Trophy for frontend SPA/interactive UI, Pyramid for CLI/data apps, hybrid for full-stack
- Skill loading note documents bug #25834 workaround explicitly: skills frontmatter for future auto-injection + explicit Read instructions as fallback
- Diagnostic battery documented as "diagnostic, not gate" -- fix quick wins, document rest, always hand off to Evaluator (no retry loop)
- Vite+ compatibility table lists supported (React, Vue, Svelte, Solid, react-router) and unsupported (Angular, Nuxt) frameworks inline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Generator agent fully hardened with all Phase 04 capabilities
- Phase 04 complete: all 4 plans executed (playwright-testing skill, vitest-browser + vite-plus + ASSETS-TEMPLATE.md, check-assets CLI, generator rewrite)
- Ready for Phase 05: Optimize Agent Definitions (progressive disclosure, round-conditional instructions, skill extraction)

## Self-Check: PASSED

- [x] plugins/application-dev/agents/generator.md -- FOUND
- [x] Commit ad12311 -- FOUND
- [x] generator.md is 253 lines (>= 250 minimum)
- [x] skills frontmatter lists all 6 skills
- [x] All 9 CLAUDE_PLUGIN_ROOT paths reference existing files
- [x] Prompt guard rule present
- [x] Cybernetics damping language preserved
- [x] Zero inline API details (LanguageModel.availability, CreateMLCEngine, navigator.ml, navigator.gpu)
- [x] All 6 requirements covered (GEN-01 through GEN-06)

---
*Phase: 04-generator-hardening-and-skills*
*Completed: 2026-03-29*
