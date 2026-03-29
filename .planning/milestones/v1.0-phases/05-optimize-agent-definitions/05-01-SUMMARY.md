---
phase: 05-optimize-agent-definitions
plan: 01
subsystem: agents
tags: [progressive-disclosure, instruction-engineering, evaluator, reference-extraction]

# Dependency graph
requires:
  - phase: 03-evaluator-skills
    provides: "Evaluator agent definition with AI Slop Checklist, Self-Verification, and Asset Validation protocol inline"
provides:
  - "Optimized evaluator.md (465 -> 392 lines) with progressive disclosure"
  - "AI-SLOP-CHECKLIST.md reference file (6 slop categories)"
  - "ASSET-VALIDATION-PROTOCOL.md reference file (sub-steps 7a-7g, severity rules)"
affects: [05-02, 05-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [progressive-disclosure-extraction, WHY-based-rationale, single-source-self-verification]

key-files:
  created:
    - plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md
    - plugins/application-dev/skills/application-dev/references/evaluator/ASSET-VALIDATION-PROTOCOL.md
  modified:
    - plugins/application-dev/agents/evaluator.md

key-decisions:
  - "AI Slop Checklist Read pointer placed in Critical Mindset section with reference during Step 5 and Step 10"
  - "Asset Validation Step 7 retains purpose statement inline, procedure moves to reference"
  - "Self-Verification kept only as Step 14 (canonical workflow position), standalone section removed"
  - "ALL-CAPS emphasis replaced with WHY-based rationale throughout (zero MUST/NEVER/ALWAYS instances)"

patterns-established:
  - "WHY-based rationale: replace MUST/NEVER/CRITICAL with 'Do not X -- because Y' for safety constraints"
  - "Progressive disclosure for evaluator: 5 reference files loaded on-demand during specific workflow steps"

requirements-completed: [OPT-01, OPT-02, OPT-03]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 05 Plan 01: Evaluator Optimization Summary

**Evaluator agent definition reduced from 465 to 392 lines via progressive disclosure extraction, Self-Verification deduplication, and WHY-based rationale replacement**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T13:47:29Z
- **Completed:** 2026-03-29T13:52:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extracted AI Slop Checklist (33 lines, 6 categories) to standalone reference file with Read instruction at Step 5/10
- Extracted Asset Validation Protocol (sub-steps 7a-7g, severity rules) to standalone reference file with Read instruction at Step 7
- Removed duplicate Self-Verification section (14 lines) -- kept only Step 14 canonical instance
- Replaced all ALL-CAPS emphasis (MUST/NEVER/CRITICAL/ALWAYS) with WHY-based rationale explanations
- Preserved all 15 workflow steps, scoring rubric, integration contracts, and existing Read instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract AI Slop Checklist and Asset Validation Protocol to reference files** - `904ab95` (feat)
2. **Task 2: Restructure evaluator.md with extraction references, deduplication, and WHY-based rationale** - `02d0e9e` (refactor)

## Files Created/Modified
- `plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md` - 6 slop category checklist for visual assessment (42 lines)
- `plugins/application-dev/skills/application-dev/references/evaluator/ASSET-VALIDATION-PROTOCOL.md` - Full validation procedure with severity rules (48 lines)
- `plugins/application-dev/agents/evaluator.md` - Optimized evaluator definition (465 -> 392 lines)

## Decisions Made
- AI Slop Checklist Read pointer placed in Critical Mindset section (establishes awareness before workflow) with explicit reference during Step 5 and Step 10
- Asset Validation Step 7 retains a purpose statement inline (what to validate and why) while moving the how (sub-steps 7a-7g, severity rules) to the reference file
- Self-Verification kept only as Step 14 -- the canonical workflow position, last step before completion. Standalone section removed per Anthropic "information lives in one place only" best practice.
- All ALL-CAPS emphasis replaced with WHY-based rationale: "Do not modify source code -- the evaluator is read-only; source changes contaminate the next generation round"

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness
- Evaluator optimization complete, establishes the progressive disclosure and WHY-based rationale patterns for plans 05-02 (SKILL.md) and 05-03 (generator/planner)
- 5 evaluator reference files now available: EVALUATION-TEMPLATE, SCORING-CALIBRATION, AI-PROBING-REFERENCE, AI-SLOP-CHECKLIST, ASSET-VALIDATION-PROTOCOL

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 05-optimize-agent-definitions*
*Completed: 2026-03-29*
