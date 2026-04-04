---
phase: 260404-vqv
plan: 01
subsystem: orchestrator, generator, evaluator
tags: [appdev, skill, agent, template, clipboard, evaluation, classification]

requires:
  - phase: 260404-ft9
    provides: TOCTOU fix, critic path guardrails, project-type heuristic, image bundling, favicon, sequential critics, commit checkpoint
provides:
  - SKILL.md with EVALUATION.md commit step in both normal and SAFETY_CAP evaluation paths
  - SKILL.md with negative instruction against hallucinated Playwright packages
  - appdev-cli.mjs with --no-clipboard flag for serve on Windows
  - generator.md with binding classification guardrail scoping stack selection to apps only
  - ASSETS-TEMPLATE.md with Local Path column separating filesystem paths from source URLs
affects: [application-dev]

tech-stack:
  added: []
  patterns:
    - "Binding classification: website/app classification is enforced, not advisory"
    - "Dual-path provenance: Local Path for filesystem, URL for external source"

key-files:
  created: []
  modified:
    - plugins/application-dev/skills/application-dev/SKILL.md
    - plugins/application-dev/scripts/appdev-cli.mjs
    - plugins/application-dev/agents/generator.md
    - plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md

key-decisions:
  - "Remove @playwright/cli from install instructions; npx resolves it remotely"
  - "Add negative instruction to prevent hallucinated package name recurrence"
  - "Commit EVALUATION.md immediately after compile-evaluation for crash recovery"
  - "Use -n flag to suppress serve clipboard copy on Windows"
  - "Make website classification binding to prevent framework override"
  - "Separate Local Path and URL columns for asset provenance tracking"

patterns-established:
  - "Negative instructions: explicitly list what NOT to install when hallucination risk exists"
  - "Commit-after-create: any file created by CLI must be committed before the next step reads it"

requirements-completed: [VQV-01, VQV-02, VQV-03, VQV-04, VQV-05]

duration: 2min
completed: 2026-04-04
---

# Quick Task 260404-vqv: Resolve v1.2 patch.0 Remaining Issues Summary

**Fix five remaining v1.2 test issues: hallucinated package, EVALUATION.md commit gap, serve clipboard error, generator classification override, ASSETS-TEMPLATE Local Path column**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T21:16:20Z
- **Completed:** 2026-04-04T21:18:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- SKILL.md Step 0.5 installs only @playwright/test and serve; negative instruction prevents hallucinated package recurrence
- EVALUATION.md commit step in both normal and SAFETY_CAP evaluation paths ensures crash recovery and tag integrity
- Static serve uses -n flag to suppress clipboard copy that caused Windows "Access Denied" errors
- Generator website classification is now binding -- framework selection section explicitly scoped to app-classified projects only
- ASSETS-TEMPLATE.md has 8-column table with Local Path between Attribution and URL; no "local" values in URL column

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix orchestrator and evaluator issues (SKILL.md + appdev-cli.mjs)** - `e74e645` (fix) -- committed in prior session
2. **Task 2: Fix generator classification and ASSETS-TEMPLATE (generator.md + ASSETS-TEMPLATE.md)** - `8a1776e` (fix)

## Files Created/Modified

- `plugins/application-dev/skills/application-dev/SKILL.md` - Removed hallucinated @playwright/cli install, added negative instruction, added EVALUATION.md commit step in both evaluation paths, updated frontmatter compatibility note
- `plugins/application-dev/scripts/appdev-cli.mjs` - Added -n flag to serve args array to suppress clipboard copy
- `plugins/application-dev/agents/generator.md` - Added binding classification paragraph, scoped stack selection and Vite+ default to app-classified projects
- `plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md` - Added Local Path column, replaced "local" URL values with N/A, added Local Path column definition, updated URL column definition

## Decisions Made

- Removed @playwright/cli from devDependencies install list; `npx playwright-cli` resolves via npm registry without local installation, reducing hallucination surface
- Added negative instruction listing specific package names to prevent recurrence of hallucinated @anthropic-ai/claude-code-playwright
- Committed EVALUATION.md immediately after compile-evaluation (before round-complete) in both normal and SAFETY_CAP paths for crash safety
- Used serve's -n/--no-clipboard flag rather than suppressing stderr, since stdio is already "ignore" and the error surfaces through Windows system mechanisms
- Made website classification binding rather than advisory to prevent Generator from reading past classification into framework selection
- Separated Local Path from URL to preserve provenance: URL always holds the original external source, Local Path holds the filesystem path

## Deviations from Plan

None -- plan executed exactly as written. Task 1 was completed in a prior session and its commit (e74e645) was verified in place.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Known Stubs

None -- all changes are complete instruction and template modifications.

## Verification Results

All 6 verification checks passed:

1. `@playwright/cli` in SKILL.md: only in negative instruction (not in install block)
2. "compiled evaluation report" in SKILL.md: 2 matches (normal + SAFETY_CAP paths)
3. `"-n"` in appdev-cli.mjs: 1 match in serveArgs
4. "classification above is binding" in generator.md: 1 match
5. "Local Path" in ASSETS-TEMPLATE.md: 3 matches (header, definition, URL clarification)
6. "| local |" in ASSETS-TEMPLATE.md: 0 matches (no "local" in URL column)

---
## Self-Check: PASSED

All files found, all commits verified.

---
*Quick task: 260404-vqv*
*Completed: 2026-04-04*
