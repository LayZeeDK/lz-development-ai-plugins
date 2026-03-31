---
phase: 07-ensemble-discriminator-architecture
plan: 03
subsystem: evaluator
tags: [wgan-critic, perceptual, projection, agent-definition, gan-barrier, ensemble]

# Dependency graph
requires:
  - phase: 07-ensemble-discriminator-architecture
    provides: "07-01 CLI ensemble aggregator (compile-evaluation, summary.json contract)"
  - phase: 07-ensemble-discriminator-architecture
    provides: "07-02 EVALUATION-TEMPLATE + SCORING-CALIBRATION updated for 3 dimensions"
provides:
  - "perceptual-critic.md agent definition scoring Visual Design via eval-first methodology"
  - "projection-critic.md agent definition scoring Functionality via write-and-run acceptance tests"
  - "GAN information barrier enforced at tool allowlist and prompt guard layers"
  - "evaluator.md deleted (replaced by two critics)"
affects: [07-04 orchestrator rewrite, 08 Playwright patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-layer GAN barrier: tool allowlist (no Glob, no Edit) + prompt guards (MUST NOT read source)"
    - "Methodology phases (UNDERSTAND/OBSERVE/DETECT/SCORE/REPORT) replacing monolithic numbered steps"
    - "Progressive disclosure for protocol-heavy content (AI-SLOP-CHECKLIST.md, AI-PROBING-REFERENCE.md)"
    - "Write-and-run acceptance tests for token efficiency (~5 tool calls vs ~30+)"
    - "Eval-first for structured DOM state as JSON (fewer tokens than screenshots)"

key-files:
  created:
    - plugins/application-dev/agents/perceptual-critic.md
    - plugins/application-dev/agents/projection-critic.md
  modified: []

key-decisions:
  - "Tool allowlists exclude Glob and Edit to prevent codebase exploration (BARRIER-01 first layer)"
  - "Prompt guards use WHY-based rationale explaining the GAN information barrier purpose"
  - "Findings format enforces behavioral symptoms over code-level diagnoses (BARRIER-02)"
  - "Acceptance test independence documented with clear rationale for black-box vs white-box (BARRIER-04)"
  - "Both critics target ~60K context budget with token-efficient patterns"

patterns-established:
  - "Critic methodology phases: UNDERSTAND -> domain-specific phases -> SCORE -> REPORT"
  - "summary.json output: universal fields + critic-specific extensions (acceptance_tests for projection)"
  - "Finding IDs: VD-N for perceptual, FN-N for projection"
  - "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50 recommendation for earlier compaction"

requirements-completed: [ENSEMBLE-01, ENSEMBLE-02, ENSEMBLE-05, BARRIER-01, BARRIER-02, BARRIER-03, BARRIER-04]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 7 Plan 03: WGAN Critic Agent Definitions Summary

**Two compact critic agents (perceptual + projection) replacing 392-line monolithic evaluator with GAN information barrier at tool allowlist and prompt guard layers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T13:08:41Z
- **Completed:** 2026-03-31T13:11:58Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 deleted)

## Accomplishments
- Created perceptual-critic.md (111 lines): Visual Design scoring via eval-first methodology with AI slop detection
- Created projection-critic.md (150 lines): Functionality scoring via write-and-run acceptance tests with AI probing
- Enforced GAN information barrier at both layers: tool allowlists (no Glob, no Edit) and prompt guards (MUST NOT read source)
- Deleted monolithic evaluator.md (392 lines, 15 steps) -- replaced by two focused critics
- Documented summary.json output schema with projection-critic acceptance_tests extension for CLI Product Depth computation
- Established acceptance test independence between Generator dev tests and critic acceptance tests (BARRIER-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create perceptual-critic.md and projection-critic.md** - `aaa9283` (feat)
2. **Task 2: Delete evaluator.md (ENSEMBLE-05)** - `aa30f59` (feat)

## Files Created/Modified
- `plugins/application-dev/agents/perceptual-critic.md` - Visual Design critic: eval-first, AI slop detection, asset quality validation
- `plugins/application-dev/agents/projection-critic.md` - Functionality critic: write-and-run acceptance tests, AI probing, off-spec detection
- `plugins/application-dev/agents/evaluator.md` - DELETED (replaced by the two critics above)

## Decisions Made
- Tool allowlists deliberately exclude Glob and Edit to prevent codebase exploration (first layer of GAN barrier)
- Used WHY-based rationale for all instructions ("Why: a discriminator judges output, not process") per established pattern
- Finding format enforces behavioral symptoms with good/bad examples to make the boundary concrete
- perceptual-critic uses eval-first (structured JSON via eval) and screenshots at key viewpoints only
- projection-critic uses write-and-run pattern (~5 tool calls replacing ~30+ interactive browser commands)
- Both critics recommend CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50 for earlier compaction within ~60K budget

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both critic agents ready for orchestrator to spawn during evaluation phase
- summary.json schema matches what compile-evaluation (07-01) expects to consume
- SCORING-CALIBRATION.md (07-02) referenced by both critics for ceiling rules
- AI-SLOP-CHECKLIST.md and AI-PROBING-REFERENCE.md referenced via progressive disclosure
- Next plan (07-04) can rewrite the orchestrator evaluation phase to spawn 2 critics + CLI compile

## Self-Check: PASSED

- [x] plugins/application-dev/agents/perceptual-critic.md exists
- [x] plugins/application-dev/agents/projection-critic.md exists
- [x] plugins/application-dev/agents/evaluator.md deleted
- [x] .planning/phases/07-ensemble-discriminator-architecture/07-03-SUMMARY.md exists
- [x] Commit aaa9283 (Task 1) exists
- [x] Commit aa30f59 (Task 2) exists

---
*Phase: 07-ensemble-discriminator-architecture*
*Completed: 2026-03-31*
