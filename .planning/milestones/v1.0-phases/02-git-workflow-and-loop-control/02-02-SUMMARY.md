---
phase: 02-git-workflow-and-loop-control
plan: 02
subsystem: agents
tags: [gan-language, git-workflow, fix-only-mode, conventional-commits, playwright-cli]

# Dependency graph
requires:
  - phase: 01-orchestrator-integrity
    provides: "Two-layer enforcement pattern (tool allowlists + prompt guards) for all three agents"
  - phase: 02-git-workflow-and-loop-control/plan-01
    provides: "appdev-cli with round-complete, convergence engine, escalation vocabulary"
provides:
  - "Generator with feature-by-feature git commits (GIT-02)"
  - "Generator with .gitignore creation/extension instruction (GIT-03)"
  - "Generator with fix-only mode in rounds 2+ (LOOP-07)"
  - "Generator with evaluation-first reading order in rounds 2+ (LOOP-08)"
  - "Evaluator with git commits to evaluation/round-N/ (GIT-04)"
  - "Evaluator using npx playwright-cli (project devDependency)"
  - "All three agents using GAN ubiquitous language (zero QA references)"
affects: [03-evaluator-hardening, 04-generator-hardening-and-vite-skill]

# Tech tracking
tech-stack:
  added: []
  patterns: [conventional-commits, evaluation-round-folders, fix-only-mode, evaluation-first-reading]

key-files:
  created: []
  modified:
    - plugins/application-dev/agents/generator.md
    - plugins/application-dev/agents/evaluator.md
    - plugins/application-dev/agents/planner.md

key-decisions:
  - "Generator reads evaluation/round-{N-1}/EVALUATION.md before SPEC.md in rounds 2+ -- primes for fixing not building"
  - "Fix-only mode framed as cybernetics damping principle -- unconstrained changes cause oscillation"
  - "Evaluator writes to evaluation/round-N/ with round number derived from prompt"
  - "All playwright-cli references updated to npx playwright-cli -- project devDependency, not system PATH"

patterns-established:
  - "GAN ubiquitous language: evaluation (not QA), generation round (not build round), EVALUATION.md (not QA-REPORT.md)"
  - "Per-round evaluation folders: evaluation/round-N/ with EVALUATION.md and screenshots/"
  - "Conventional commits scoped by feature: feat(editor):, fix(design):, docs(evaluation):"
  - "Fix-only mode: rounds 2+ are surgical fixes traced to Evaluator's report items"

requirements-completed: [GIT-02, GIT-03, GIT-04, LOOP-06, LOOP-07, LOOP-08]

# Metrics
duration: 4min
completed: 2026-03-28
---

# Phase 2 Plan 2: Agent Definition Updates Summary

**GAN ubiquitous language across all agents, Generator feature-by-feature commits with fix-only mode and .gitignore, Evaluator per-round evaluation folder commits with npx playwright-cli**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-28T10:57:03Z
- **Completed:** 2026-03-28T11:01:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Eliminated all QA terminology from all three agent definitions -- consistent GAN ubiquitous language (evaluation, generation round, EVALUATION.md)
- Generator now instructs feature-by-feature git commits with conventional commit messages, .gitignore creation, fix-only mode in rounds 2+, and evaluation-first reading order
- Evaluator now writes to evaluation/round-N/ folders, commits evaluation artifacts to git, and uses npx playwright-cli throughout
- Planner cleaned of QA references while preserving tools: ["Read", "Write"] unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Generator and Evaluator with git commits, evaluation paths, and loop behavior** - `22b8230` (feat)
2. **Task 2: Update Planner with GAN ubiquitous language** - `67f8724` (feat)

## Files Created/Modified
- `plugins/application-dev/agents/generator.md` - Added .gitignore instruction, git commit instructions, fix-only mode, evaluation-first reading, GAN language rename
- `plugins/application-dev/agents/evaluator.md` - Renamed identity, evaluation/round-N/ paths, git commit section 8.5, npx playwright-cli, GAN language rename
- `plugins/application-dev/agents/planner.md` - Replaced QA-REPORT.md reference with EVALUATION.md

## Decisions Made
- Generator reads evaluation/round-{N-1}/EVALUATION.md before SPEC.md in rounds 2+ -- reading feedback before spec primes for fixing, not building
- Fix-only mode explicitly references cybernetics damping principle -- unconstrained changes cause oscillation instead of convergence
- All playwright-cli references updated to npx playwright-cli -- uses project devDependency instead of assuming system PATH availability
- LOOP-06 (feature watchdog) acknowledged as deferred to Phase 3 (Evaluator's responsibility, not orchestrator's)

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- All three agent definitions use consistent GAN language and are ready for orchestrator integration (plan 02-03)
- Generator's git commit instructions and fix-only mode complement the convergence engine from plan 02-01
- Evaluator's per-round folder structure aligns with Generator's evaluation-first reading pattern
- Phase 3 (Evaluator Hardening) can build on LOOP-06 deferral -- feature watchdog is Evaluator's responsibility

## Self-Check: PASSED

- [x] plugins/application-dev/agents/generator.md exists
- [x] plugins/application-dev/agents/evaluator.md exists
- [x] plugins/application-dev/agents/planner.md exists
- [x] 02-02-SUMMARY.md exists
- [x] Commit 22b8230 found
- [x] Commit 67f8724 found

---
*Phase: 02-git-workflow-and-loop-control*
*Completed: 2026-03-28*
