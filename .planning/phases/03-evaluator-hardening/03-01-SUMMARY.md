---
phase: 03-evaluator-hardening
plan: 01
subsystem: evaluation
tags: [scoring-calibration, ai-probing, turing-test, modality, evaluation-template, adversarial]

# Dependency graph
requires:
  - phase: 02.1-use-templates
    provides: structural-vs-behavioral guidance pattern, EVALUATION-TEMPLATE.md baseline, reference file loading pattern
provides:
  - SCORING-CALIBRATION.md with mechanical ceiling rules and 12 calibration scenarios
  - AI-PROBING-REFERENCE.md with modality-based probe batteries and Turing test concepts
  - Extended EVALUATION-TEMPLATE.md with 5 new non-parsed report sections
affects: [03-02-evaluator-rewrite, 04-generator-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns: [modality-based-probe-organization, calibration-scenario-anchoring, goodhart-law-protection]

key-files:
  created:
    - plugins/application-dev/skills/application-dev/references/SCORING-CALIBRATION.md
    - plugins/application-dev/skills/application-dev/references/AI-PROBING-REFERENCE.md
  modified:
    - plugins/application-dev/skills/application-dev/references/EVALUATION-TEMPLATE.md

key-decisions:
  - "Calibration scenarios use realistic app states with score + rationale + boundary explanation format"
  - "AI probing strategies describe WHAT to test, not exact inputs (Goodhart's Law protection)"
  - "All 10 Turing test concepts referenced in AI-PROBING-REFERENCE.md with ELIZA effect noted as evaluator.md-only"

patterns-established:
  - "Calibration scenario format: concrete description, score, rationale, not-X-because boundary"
  - "Probe strategy format: purpose, strategy, canned signal, real AI signal"
  - "Modality-based organization for AI feature probing (12 modalities)"

requirements-completed: [EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05]

# Metrics
duration: 9min
completed: 2026-03-29
---

# Phase 03 Plan 01: Evaluator Reference Files Summary

**Scoring calibration with 12 ceiling rules and 12 scenario anchors, modality-based AI probe reference with 10-probe battery and 10 Turing test concepts, evaluation template extended with 5 new report sections**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-29T09:12:23Z
- **Completed:** 2026-03-29T09:21:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- SCORING-CALIBRATION.md with all hard ceiling rules from CONTEXT.md, 12 calibration scenarios (3 per criterion), conflict resolution rules, score-against-the-spec rule, round-independent scoring, mandatory justification format
- AI-PROBING-REFERENCE.md with Chinese Room philosophy, three-tier detection model, universal 10-probe battery, all 10 Turing test concepts, 12 modality-based probe batteries, off-spec features scoring, canned AI ceiling, graceful degradation hard rule
- EVALUATION-TEMPLATE.md extended with Score Justifications, Asset Validation, AI Feature Probing, Console & Errors, and Off-Spec Features sections -- all non-regex-parsed, preserving existing parsed sections unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SCORING-CALIBRATION.md** - `665b43a` (feat)
2. **Task 2: Create AI-PROBING-REFERENCE.md** - `299f79a` (feat)
3. **Task 3: Extend EVALUATION-TEMPLATE.md with new sections** - `50b2b17` (feat)

## Files Created/Modified
- `plugins/application-dev/skills/application-dev/references/SCORING-CALIBRATION.md` - Mechanical ceiling rules (12 rules across 5 categories), 12 calibration scenarios, conflict resolution, score-against-the-spec, round-independent scoring, mandatory justification format
- `plugins/application-dev/skills/application-dev/references/AI-PROBING-REFERENCE.md` - Modality-based AI probe reference with 10-probe battery, 10 Turing test concepts, 12 modality sections, off-spec scoring, canned AI ceiling, latency/quality/degradation rules
- `plugins/application-dev/skills/application-dev/references/EVALUATION-TEMPLATE.md` - 5 new sections inserted at correct positions among 11 existing sections (16 total)

## Decisions Made
- Calibration scenarios use realistic application states with concrete details (~50 words each), following the format: description, score, rationale, "not X because" boundary
- AI probe strategies describe WHAT to test and WHY, never exact inputs (Goodhart's Law protection per CONTEXT.md)
- All 10 Turing test concepts from CONTEXT.md included in AI-PROBING-REFERENCE.md; ELIZA effect referenced as evaluator.md behavioral guidance (not duplicated in reference file)
- New EVALUATION-TEMPLATE.md sections have no HTML comment warnings about regex parsing (per RESEARCH.md Pattern 2)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three reference/template files ready for Plan 02 (evaluator.md rewrite)
- SCORING-CALIBRATION.md ready for evaluator.md Step 12 to load at scoring time
- AI-PROBING-REFERENCE.md ready for evaluator.md Step 8 to load at probe time
- EVALUATION-TEMPLATE.md ready for evaluator.md Step 13 to load when writing report

## Self-Check: PASSED

- SCORING-CALIBRATION.md: FOUND
- AI-PROBING-REFERENCE.md: FOUND
- EVALUATION-TEMPLATE.md: FOUND
- 03-01-SUMMARY.md: FOUND
- Commit 665b43a: FOUND
- Commit 299f79a: FOUND
- Commit 50b2b17: FOUND

---
*Phase: 03-evaluator-hardening*
*Completed: 2026-03-29*
