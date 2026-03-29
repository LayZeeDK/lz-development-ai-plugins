---
phase: 04-generator-hardening-and-skills
plan: 02
subsystem: skills
tags: [vitest, browser-mode, vite-plus, assets, branded-channels, oxlint, tsgo]

# Dependency graph
requires:
  - phase: 04-generator-hardening-and-skills
    provides: Phase context and research (04-CONTEXT.md, 04-RESEARCH.md)
provides:
  - vitest-browser skill for Vitest 4.x Browser Mode with branded channels
  - vite-plus skill for vp CLI unified toolchain
  - ASSETS-TEMPLATE.md reference for Generator asset manifest
affects: [04-generator-hardening-and-skills, generator-rewrite]

# Tech tracking
tech-stack:
  added: [vitest-4.x-browser-mode, vitest-browser-playwright, vite-plus-alpha, oxlint, oxfmt, tsgo, rolldown]
  patterns: [projects-config-unit-browser-split, branded-browser-channels, factory-function-provider, agent-reporter]

key-files:
  created:
    - plugins/application-dev/skills/vitest-browser/SKILL.md
    - plugins/application-dev/skills/vite-plus/SKILL.md
    - plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md

key-decisions:
  - "vitest-browser skill is self-contained SKILL.md (307 lines) -- all config, channels, render packages, pitfalls in one document"
  - "vite-plus skill is self-contained SKILL.md (281 lines) -- vp CLI, config format, framework compatibility, CI integration"
  - "ASSETS-TEMPLATE.md uses 7-column table (Asset, Type, Source, License, Attribution, URL, Verified) with example rows"

patterns-established:
  - "Factory function provider: import { playwright } from '@vitest/browser-playwright' (not deprecated string format)"
  - "Instances array: browser.instances: [{ browser: 'chromium' }] (not deprecated browser.name)"
  - "Environment-variable channel fallback: BROWSER_CHANNEL=bundled for CI without branded browsers"
  - "Asset manifest table format: 7 columns with Source taxonomy (web-search, generated, procedural/SVG, stock-api, bundled-dependency, user-provided)"

requirements-completed: [GEN-03, SKILL-01]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 04 Plan 02: Skills and References Summary

**Vitest Browser Mode skill with branded channels and projects config, Vite+ skill with vp CLI and framework compatibility, and ASSETS-TEMPLATE.md for Generator asset manifests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T11:56:11Z
- **Completed:** 2026-03-29T12:01:29Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- vitest-browser SKILL.md covering projects config, branded channels (chrome, msedge), render packages, agent reporter, isolation behavior, and pitfalls
- vite-plus SKILL.md covering all vp CLI commands, unified vite.config.ts, framework compatibility (including explicit Angular exclusion), bundled tool versions, and CI integration
- ASSETS-TEMPLATE.md with 7-column table format, column definitions, example rows for different sourcing scenarios, and verification command

## Task Commits

Each task was committed atomically:

1. **Task 1: Create vitest-browser SKILL.md** - `7546668` (feat)
2. **Task 2: Create vite-plus SKILL.md and ASSETS-TEMPLATE.md** - `da194f9` (feat)

## Files Created/Modified
- `plugins/application-dev/skills/vitest-browser/SKILL.md` - Vitest 4.x Browser Mode skill: projects config, branded channels, render packages, agent reporter, isolation, pitfalls (307 lines)
- `plugins/application-dev/skills/vite-plus/SKILL.md` - Vite+ unified toolchain skill: vp CLI commands, config format, framework support, limitations, CI integration (281 lines)
- `plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md` - Asset manifest table template with column definitions and example rows (46 lines)

## Decisions Made
- vitest-browser skill kept self-contained at 307 lines -- no need for meta-skill pattern since all content fits comfortably in one document
- vite-plus skill kept self-contained at 281 lines -- vp CLI commands and config format are concise enough for a single document
- ASSETS-TEMPLATE.md uses a 7-column markdown table matching the Phase 02.1 pattern of structural guidance in reference files
- Source taxonomy for assets limited to 6 categories: web-search, generated, procedural/SVG, stock-api, bundled-dependency, user-provided

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- vitest-browser and vite-plus skills ready for Generator to reference via Read fallback
- ASSETS-TEMPLATE.md ready for Generator to produce ASSETS.md manifests
- These skills feed into the generator.md rewrite (plan 04-03 or 04-04)
- Remaining Phase 04 plans: playwright-testing skill, appdev-cli check-assets, generator.md rewrite

## Self-Check: PASSED

- [x] plugins/application-dev/skills/vitest-browser/SKILL.md -- FOUND
- [x] plugins/application-dev/skills/vite-plus/SKILL.md -- FOUND
- [x] plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md -- FOUND
- [x] Commit 7546668 -- FOUND
- [x] Commit da194f9 -- FOUND

---
*Phase: 04-generator-hardening-and-skills*
*Completed: 2026-03-29*
