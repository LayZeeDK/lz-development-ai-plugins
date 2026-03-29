---
phase: 04-generator-hardening-and-skills
plan: 03
subsystem: cli
tags: [node, fetch, url-verification, soft-404, tdd, node-test]

# Dependency graph
requires:
  - phase: 02-git-workflow-and-loop-control
    provides: appdev-cli.mjs with JSON output protocol and parseArgs utility
provides:
  - check-assets subcommand for URL verification in ASSETS.md
  - soft-404 detection (CDN returning HTML for image URLs)
  - HEAD-then-GET fallback chain for restrictive servers
affects: [04-generator-hardening-and-skills]

# Tech tracking
tech-stack:
  added: [node:test runner]
  patterns: [async subcommand pattern, AbortController timeout, HEAD-GET fallback]

key-files:
  created:
    - tests/appdev-cli-check-assets.test.mjs
  modified:
    - plugins/application-dev/scripts/appdev-cli.mjs

key-decisions:
  - "check-assets uses stdout JSON + exit code 1 for errors, matching round-complete pattern"
  - "Sequential URL checks to avoid rate limiting (no parallel fetch)"
  - "Soft-404 only flags URLs with image file extensions returning non-image content-type"

patterns-established:
  - "Async subcommand: cmdCheckAssets is the first async function in appdev-cli; switch case calls it directly"
  - "AbortController timeout: reusable doFetch helper with configurable timeout for HTTP requests"

requirements-completed: [GEN-05]

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 4 Plan 3: check-assets Subcommand Summary

**URL verification CLI command with soft-404 detection, HEAD-GET fallback, and 5s timeout using zero dependencies**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T11:56:10Z
- **Completed:** 2026-03-29T11:59:03Z
- **Tasks:** 2 (RED + GREEN; no REFACTOR needed)
- **Files modified:** 2

## Accomplishments
- Added check-assets subcommand to appdev-cli.mjs with zero new dependencies
- Parses ASSETS.md markdown tables, extracts http/https URLs, skips local/N/A entries
- Detects soft-404s where CDN returns 200 with text/html for image URLs
- HEAD-then-GET fallback handles servers that reject HEAD with 403 or 405
- All 7 test cases pass via node:test runner
- Existing CLI subcommands unaffected (no regressions)

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `72095e5` (test)
2. **GREEN: Implementation** - `662b417` (feat)

_No REFACTOR commit needed -- implementation was minimal and clean._

## Files Created/Modified
- `tests/appdev-cli-check-assets.test.mjs` - 7 test cases covering missing file, local URLs, valid URLs, soft-404, HEAD-GET fallback, timeout, default path
- `plugins/application-dev/scripts/appdev-cli.mjs` - Added parseAssetsTable, isImageUrl, checkUrl, cmdCheckAssets functions + switch case

## Decisions Made
- Used stdout JSON + exit code 1 for error output (consistent with round-complete precedent, not stderr like other subcommands)
- Sequential URL checking to avoid rate limiting on asset CDNs
- Soft-404 detection only applies to URLs ending in image file extensions (.png, .jpg, .jpeg, .gif, .webp, .svg, .ico, .bmp, .avif)
- Tests use real httpbin.org endpoints for integration-level confidence (not mocked fetch)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- check-assets subcommand ready for integration into generator.md pre-handoff diagnostic (Plan 04-04)
- ASSETS-TEMPLATE.md reference (created in Plan 04-02) defines the manifest format that check-assets parses

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 04-generator-hardening-and-skills*
*Completed: 2026-03-29*
