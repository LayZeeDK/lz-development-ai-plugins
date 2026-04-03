---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Dutch Art Museum Test Fixes
status: verifying
stopped_at: Completed 15-02-PLAN.md
last_updated: "2026-04-03T20:00:05.343Z"
last_activity: 2026-04-03
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 9
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02)

**Core value:** Hands-off prompt-to-application development -- not prompt-to-partial-application.
**Current focus:** v1.2 Dutch Art Museum Test Fixes -- Phase 14 (Enhanced Existing Critics)

## Current Position

Phase: 14 of 16 (Enhanced Existing Critics)
Plan: 1 of 1 (14-01 complete)
Status: Phase complete — ready for verification
Last activity: 2026-04-03

Progress: [##########] 100%

## Accumulated Context

### From v1.0

- Two-layer enforcement (tool allowlists + prompt guards) is the right balance
- Templates for SPEC.md/EVALUATION.md prevent format drift
- Progressive disclosure keeps agent context clean
- WHY-based rationale more effective than ALL-CAPS emphasis
- Cybernetics damping principle prevents oscillation in fix-only mode

### From Dutch art museum test #1

- Evaluator accessed source code (GAN violation) -- fixed in v1.1 (BARRIER-01..04)
- All four scores landed on 7/10 (threshold anchoring / mode collapse) -- deferred to v1.2 (CONV-01..05)
- Orchestrator failed to detect completed steps on session resume -- fixed in v1.1 (RECOVERY-01..04)
- PASS verdict at 28/40 after only 2 rounds -- convergence too easy -- deferred to v1.2 (CONV-02)
- Generator ignored Vite+ skill, used stale dependency versions -- deferred to v1.2 (GEN-01..04)
- Cross-feature bugs missed because features tested in isolation -- deferred to v1.2 (perturbation-critic)

### Key v1.1 Decisions (carried forward)

- DIMENSIONS constant is single source of truth (Pitfall 1 prevention)
- Write-and-run pattern for token efficiency (~5 vs ~30+ tool calls)
- Per-critic retry on failure (not both critics)
- Static production builds over dev servers (idempotent, resumable)
- Zero npm dependencies in appdev-cli.mjs

### From Phase 11 (Scoring Foundation + Perturbation Critic)

- Robustness threshold 6 (same as Visual Design) -- lower bar than PD/Fn for early perturbation testing
- Perturbation Critic ceiling applied within summary.json, not by CLI (matches Functionality/VD pattern)
- DIMENSIONS constant extended to 4 entries -- auto-propagates to extractScores, computeVerdict, compile-evaluation

### From Phase 12, Plan 01 (Threshold Scaling + EMA Smoothing)

- EMA alpha=0.4 default with opts parameter for testability
- Asymmetric E-0/E-II thresholds (2.5% vs 5%) per Schmitt trigger hysteresis
- E-II plateau threshold at N=3 changes from <=1 to <=2 (intentional per ISA-18.2 5% deadband)
- Dual-path signal architecture: safety=raw (E-IV, PASS), hybrid=raw+EMA (E-III), trend=EMA (E-II, E-I, E-0)

### From Phase 12, Plan 02 (Per-Dimension Output)

- dimension_status uses array format with full metadata (name, key, score, threshold, pass) for diagnostic overlay
- dimensions uses compact keyed object format (dimension_key: score) for trend extraction efficiency
- Both scores and dimension_status coexist in round-complete output (backward compatible)
- Rounds with null/missing scores produce empty dimensions object (graceful degradation)

### From Phase 13, Plan 01 (N-Critic Resume-Check)

- >= 2 invalid threshold for spawn-all-critics (not === expectedCritics.length)
- skip array passes valid critics even in spawn-all-critics path (valid is empty when all invalid)
- Default critics list: ["perceptual", "projection", "perturbation"]
- SKILL.md dispatch table updated atomically with CLI changes (Pitfall 1 prevention)

### From Phase 13, Plan 02 (SKILL.md 3-Critic Integration)

- SKILL.md evaluation phase spawns 3 critics in parallel with 3 binary checks
- SAFETY_CAP wrap-up spawns all 3 critics (not just 2)
- Agent Prompt Protocol includes perturbation-critic with identical minimal pattern
- Architecture section uses two-tier grouping: Planning and Generation / Critic Ensemble
- All "both critics", "two critics", "Four agents" references eliminated from SKILL.md

### From Phase 14, Plan 01 (Enhanced Existing Critics)

- Cross-page consistency audit uses write-and-run fingerprinting with 3-tier extraction (shared components, palette discipline, CSS custom properties)
- Perceptual-critic tool allowlist expanded with Bash(npx playwright test *) for write-and-run audit execution
- Projection-critic A->B->A round-trip tests use page.goBack() + content assertion, produce FN-X findings
- Round-trip test results explicitly excluded from acceptance_tests.results[] (Product Depth measures presence, not durability)
- Shared component divergence ceiling (max 6) added to Visual Design calibration
- Calibration and methodology updated atomically to prevent desync (Pitfall 2 prevention)

### v1.2 Phase Dependencies

- Sequential: Phase 11 -> Phase 12 -> Phase 13
- Independent (after Phase 11): Phase 14, Phase 15, Phase 16

### Blockers/Concerns

- 3-critic parallel concurrency limit unknown (Phase 13 empirical test needed)
- Robustness score distribution is untested (Phase 11 calibration scenarios mitigate)

## Session Continuity

Last session: 2026-04-03T20:00:05.340Z
Stopped at: Completed 15-02-PLAN.md
Resume file: None
