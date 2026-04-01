---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Ensemble Discriminator + Crash Recovery
status: completed
stopped_at: Phase 9 context gathered
last_updated: "2026-04-01T21:26:37.325Z"
last_activity: 2026-04-01 -- Phase 8 Plan 03 executed, critic agents wired to PLAYWRIGHT-EVALUATION.md + Generator dev test boundary
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 7
  completed_plans: 7
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-29)

**Core value:** Hands-off prompt-to-application development -- not prompt-to-partial-application.
**Current focus:** v1.1 Hardening after Dutch art museum website test #1

## Current Position

Phase: 8 of 9 (SPEC Acceptance Criteria + Playwright Patterns)
Plan: 3 of 3 complete
Status: Phase 8 Complete
Last activity: 2026-04-01 -- Phase 8 Plan 03 executed, critic agents wired to PLAYWRIGHT-EVALUATION.md + Generator dev test boundary

Progress: [########--] 86%

## Accumulated Context

### From v1.0
- Two-layer enforcement (tool allowlists + prompt guards) is the right balance
- Templates for SPEC.md/EVALUATION.md prevent format drift
- Progressive disclosure keeps agent context clean
- WHY-based rationale more effective than ALL-CAPS emphasis
- Cybernetics damping principle prevents oscillation in fix-only mode

### From Dutch art museum test #1
- Evaluator accessed source code (GAN violation) -- must enforce information barrier
- All four scores landed on 7/10 (threshold anchoring / mode collapse)
- Orchestrator failed to detect completed steps on session resume
- PASS verdict at 28/40 after only 2 rounds -- convergence too easy
- Generator ignored Vite+ skill, used stale dependency versions
- Cross-feature bugs (session overwrite, URL desync) missed because features tested in isolation

### From Phase 7 Plan 02
- EVALUATION-TEMPLATE.md uses {placeholder} syntax for CLI compile-time substitution
- Code Quality calibration scenarios removed entirely (not redistributed to other dimensions)
- Verdict heading preserved for extractScores() regex compatibility but marked as CLI-computed
- ROADMAP.md already had technique-based naming from context phase (no changes needed)

### From Phase 7 Plan 03
- Tool allowlists exclude Glob and Edit to prevent codebase exploration (BARRIER-01 first layer)
- Prompt guards use WHY-based rationale explaining the GAN information barrier purpose
- Findings format enforces behavioral symptoms over code-level diagnoses (BARRIER-02)
- perceptual-critic: eval-first + AI-SLOP-CHECKLIST.md progressive disclosure (111 lines)
- projection-critic: write-and-run + AI-PROBING-REFERENCE.md progressive disclosure (150 lines)
- evaluator.md deleted -- replaced by two focused critics

### From Phase 7 Plan 01
- DIMENSIONS constant is single source of truth for dimension names, keys, and thresholds
- extractScores() regex derived from DIMENSIONS.map(d => d.name) to prevent Pitfall 1
- computeVerdict() replaces verdict extraction from report -- deterministic per-dimension threshold check
- compile-evaluation reads */summary.json (auto-discovery, extensible for N critics)
- install-dep uses mkdirSync mutex with stale lock detection (mtime > 60s)
- Product Depth computed deterministically from acceptance test pass rate with ceiling rules

### From Phase 7 Plan 04
- SKILL.md evaluation phase: spawn both critics -> binary check summary.json -> compile-evaluation -> round-complete
- Per-critic retry on failure (not both critics)
- All references to monolithic evaluator agent removed from orchestrator
- SAFETY_CAP wrap-up round uses same ensemble pattern for consistency
- Architecture section describes 4 agents (Planner, Generator, Perceptual Critic, Projection Critic)

### From Phase 8 Plan 01
- SPEC-TEMPLATE.md gains Acceptance Criteria section between User Stories and Data Model with inline good/bad examples
- acceptance-criteria-guide.md (~70 lines) teaches testable behavioral criteria across 5 sections, consumer-agnostic (no Playwright/critic mentions)
- Planner reads criteria guide after writing features, before adding criteria (progressive disclosure)
- Planner self-verification expanded to 8 items: items 7 (criteria presence) and 8 (criteria quality/count)
- Acceptance criteria use bullet format with 1:1 mapping to automated test assertions
- Tier minimums: Core >= 3 (happy path + edge case + error state), Important >= 2, Nice-to-have >= 1

### From Phase 8 Plan 02
- PLAYWRIGHT-EVALUATION.md created as shared technique-pure reference (174 lines, 7 sections)
- Follows ProjectedGAN shared-feature-extractor pattern: shared lower-level techniques, independent higher-level scoring
- Used `viewport` command name matching existing perceptual-critic.md for consistency
- Skeleton acceptance test demonstrates 1:1 criteria-to-test mapping with accessibility-tree-first selectors
- Round 2+ decision tree: reuse (pass or assertion-only failures), heal (1-2 selector timeouts), regenerate (multiple timeouts or >50%)

### From Phase 8 Plan 03
- Both critics wired to PLAYWRIGHT-EVALUATION.md with section-specific Read instructions (progressive disclosure)
- Console filtering uses explicit `npx playwright-cli console error` command in both critics
- Projection-critic has Round 2+ Test Reuse subsection with mechanical reuse/heal/regenerate decision tree
- Generator has mirror boundary statement: tests/ are dev tests, independent from evaluation/round-N/ acceptance tests
- Phase 8 complete: all 16 requirements addressed (SPEC-01..05, PLAYWRIGHT-01..06, TOKEN-01..05)

### Key v1.1 Constraints
- Scoring dimension rename + CLI regex must be updated atomically (PITFALLS.md Pitfall 1)
- Rising thresholds deferred to v1.2 -- infrastructure only, thresholds flat
- Zero new npm dependencies -- preserve zero-dependency CLI pattern
- Phase 9 can run in parallel with Phases 7-8

## Session Continuity

Last session: 2026-04-01T21:26:37.323Z
Stopped at: Phase 9 context gathered
Resume file: .planning/phases/09-crash-recovery/09-CONTEXT.md
