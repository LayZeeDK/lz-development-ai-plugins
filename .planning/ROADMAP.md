# Roadmap: application-dev Plugin

## Milestones

- v1.0 **Hardening** -- Phases 1-5 (shipped 2026-03-29)
- v1.1 **Ensemble Discriminator + Crash Recovery** -- Phases 7-10 (shipped 2026-04-02)
- v1.2 **Dutch Art Museum Test Fixes** -- Phases 11-16 (planned)
- v2.0 **Advanced Discriminators** -- (future)

## Phases

<details>
<summary>v1.0 Hardening (6 phases, 15 plans) -- SHIPPED 2026-03-29</summary>

- [x] Phase 1: Orchestrator Integrity (2/2 plans) -- completed 2026-03-28
- [x] Phase 2: Git Workflow and Loop Control (3/3 plans) -- completed 2026-03-28
- [x] Phase 02.1: Templates for SPEC/EVALUATION (1/1 plan) -- completed 2026-03-28 (INSERTED)
- [x] Phase 3: Evaluator Hardening (2/2 plans) -- completed 2026-03-29
- [x] Phase 4: Generator Hardening and Skills (4/4 plans) -- completed 2026-03-29
- [x] Phase 5: Optimize Agent Definitions (3/3 plans) -- completed 2026-03-29

See `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

</details>

<details>
<summary>v1.1 Ensemble Discriminator + Crash Recovery (4 phases, 11 plans) -- SHIPPED 2026-04-02</summary>

- [x] Phase 7: Ensemble Discriminator Architecture (4/4 plans) -- completed 2026-03-31
- [x] Phase 8: SPEC Acceptance Criteria + Playwright (3/3 plans) -- completed 2026-04-01
- [x] Phase 9: Crash Recovery (2/2 plans) -- completed 2026-04-02
- [x] Phase 10: v1.1 Audit Gap Closure (2/2 plans) -- completed 2026-04-02

See `.planning/milestones/v1.1-ROADMAP.md` for full phase details.

</details>

### v1.2 Dutch Art Museum Test Fixes (6 phases, planned)

**Milestone Goal:** Address all remaining issues from the Dutch art museum website test #1: perturbation-critic (Robustness), scoring convergence logic, orchestrator integration for 3 critics, enhanced existing critics, generator improvements, architecture documentation.

**Requirements:** CRITIC-01..04, CONV-01..05, ORCH-01..05, EVAL-01..03, GEN-01..04, DOCS-01 (22 total)

**Phase Structure:**
- 3 sequential phases (11 -> 12 -> 13): Foundation, convergence, integration
- 3 independent phases (14, 15, 16): Enhanced critics, generator, docs

- [x] **Phase 11: Scoring Foundation + Perturbation Critic** - DIMENSIONS constant update, new perturbation-critic agent, Robustness calibration (completed 2026-04-02)
- [x] **Phase 12: Convergence Logic Hardening** - Scaled thresholds, per-dimension tracking, EMA smoothing (completed 2026-04-02)
- [x] **Phase 13: Orchestrator Integration** - 3-critic spawn/check/retry/resume, architecture section update (completed 2026-04-02)
- [x] **Phase 14: Enhanced Existing Critics** - Cross-page visual consistency, A->B->A navigation testing (completed 2026-04-03)
- [ ] **Phase 15: Generator Improvements** - Browser-agnostic LanguageModel, Vite+ refresh, dependency freshness
- [ ] **Phase 16: Architecture Documentation** - GAN/Cybernetics/Turing test principles reference file

## Phase Details

### Phase 11: Scoring Foundation + Perturbation Critic
**Goal**: The scoring system recognizes Robustness as a fourth dimension and a new perturbation-critic agent can evaluate application resilience through adversarial testing
**Depends on**: Nothing (v1.2 foundation)
**Requirements**: CRITIC-01, CRITIC-02, CRITIC-03, CRITIC-04
**Success Criteria** (what must be TRUE):
  1. Running `compile-evaluation` with 3 critic summaries (perceptual, projection, perturbation) produces a 4-dimension EVALUATION.md with Robustness scores extracted and totaled correctly
  2. The perturbation-critic agent definition exists with clear methodology boundaries that prevent overlap with perceptual-critic (responsive layout) and projection-critic (feature correctness)
  3. SCORING-CALIBRATION.md contains Robustness ceiling rules and below/at/above threshold calibration scenarios that anchor scoring before any real evaluation runs
  4. All existing tests pass with 4 dimensions, and new tests verify 4-dimension score extraction, verdict computation, and assessment section generation
**Pitfalls**: Pitfall 2 (scope overlap between critics -- define explicit methodology boundaries), Pitfall 5 (Robustness calibration gap -- write ceiling rules before first use)
**Plans**: 2 plans
Plans:
- [x] 11-01-PLAN.md -- 4-dimension scoring system (DIMENSIONS + CLI + tests + template)
- [x] 11-02-PLAN.md -- Robustness calibration + perturbation-critic agent definition

### Phase 12: Convergence Logic Hardening
**Goal**: Convergence detection scales correctly with any number of scoring dimensions and provides per-dimension trajectory visibility
**Depends on**: Phase 11 (DIMENSIONS constant must be stable with 4 entries)
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05
**Success Criteria** (what must be TRUE):
  1. The plateau threshold and crisis threshold are derived from `DIMENSIONS.length * 10`, not hardcoded -- verified by tests running against both 3-dimension and 4-dimension configurations
  2. The `round-complete` CLI output includes per-dimension pass/fail status for each scoring dimension so the Generator can see which dimensions are failing
  3. The `get-trajectory` CLI output includes per-dimension scores per round so the Summary step can show dimension-level trends
  4. EMA-smoothed score trajectory is used for convergence detection, with alpha=1.0 backward-compatible degeneration to raw scores
**Pitfalls**: Pitfall 1 (magic numbers wrong with 4 dimensions -- the primary critical pitfall for this phase)
**Plans**: 2 plans
Plans:
- [ ] 12-01-PLAN.md -- Scaled thresholds + EMA smoothing (computeEscalation refactor)
- [ ] 12-02-PLAN.md -- Per-dimension output (dimension_status + trajectory dimensions)

### Phase 13: Orchestrator Integration
**Goal**: The orchestrator spawns, checks, retries, and resumes all three critics (perceptual, projection, perturbation) as a unified evaluation ensemble
**Depends on**: Phase 11 (perturbation-critic agent must exist), Phase 12 (convergence logic should use correct thresholds before first real evaluation)
**Requirements**: ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05
**Success Criteria** (what must be TRUE):
  1. SKILL.md evaluation phase spawns 3 critics in parallel and checks all 3 summary.json files before proceeding to compile-evaluation
  2. Resume-check returns `spawn-all-critics` (not `spawn-both-critics`) when all critics are missing, and the SKILL.md dispatch table handles this action -- both files updated atomically
  3. Retry logic retries each failed critic individually (not all critics) and the SAFETY_CAP wrap-up round includes all 3 critic spawns
  4. SKILL.md architecture section describes 5 agents (planner, generator, perceptual-critic, projection-critic, perturbation-critic)
**Pitfalls**: Pitfall 3 (resume-check rename breaking crash recovery -- atomic CLI + SKILL.md update), Pitfall 4 (3-critic parallel concurrency -- empirical test, 2+1 fallback if needed)
**Plans**: 2 plans
Plans:
- [ ] 13-01-PLAN.md -- CLI 3-critic resume-check + atomic dispatch table update
- [ ] 13-02-PLAN.md -- SKILL.md evaluation phase, SAFETY_CAP, prompt protocol, architecture section

### Phase 14: Enhanced Existing Critics
**Goal**: The perceptual-critic detects cross-page visual inconsistencies and the projection-critic validates round-trip navigation state persistence
**Depends on**: Phase 11 (DIMENSIONS stable; can run in parallel with Phases 12-13)
**Requirements**: EVAL-01, EVAL-02, EVAL-03
**Success Criteria** (what must be TRUE):
  1. The perceptual-critic methodology includes cross-page visual consistency checks (design token extraction, color/typography/spacing comparison) and these findings feed into the Visual Design score
  2. The projection-critic methodology includes A->B->A navigation test patterns (round-trip navigation, state persistence after navigate-away-and-return, back-button behavior)
  3. SCORING-CALIBRATION.md Visual Design scenarios are updated to account for the expanded cross-page scope so that the calibration anchors match the enhanced methodology
**Pitfalls**: Pitfall 6 (Visual Design calibration gap -- update calibration scenarios alongside methodology expansion)
**Plans**: 1 plan
Plans:
- [ ] 14-01-PLAN.md -- Cross-page consistency audit (perceptual-critic), A->B->A round-trip tests (projection-critic), Visual Design calibration update

### Phase 15: Generator Improvements
**Goal**: The Generator produces applications with browser-agnostic AI features, current dependencies, and modern Vite+ tooling where compatible
**Depends on**: Nothing (independent of evaluation pipeline; can run in parallel with Phases 12-16)
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04
**Success Criteria** (what must be TRUE):
  1. Generator instructions reference LanguageModel API as the standard interface with both Chrome (Gemini Nano) and Edge (Phi-4-mini) documented, including graceful degradation when the API is unavailable
  2. Vite+ skill is updated to the official `vp` CLI workflow (vp create, vp check, vp test, vp build) with alpha stability caveats and a clear escape hatch for incompatible frameworks (Angular, Nuxt)
  3. Generator workflow includes a dependency freshness checking step that verifies dependencies are current before proceeding
**Pitfalls**: Pitfall 7 (LanguageModel browser lock-in -- must include graceful degradation, not just feature detection), Pitfall 9 (Vite+ too aggressive -- keep compatibility escape hatch)
**Plans**: 2 plans
Plans:
- [x] 15-01-PLAN.md -- browser-built-in-ai meta-skill (routing SKILL.md + 5 reference files, replacing browser-prompt-api)
- [x] 15-02-PLAN.md -- Vite+ v0.1.15 refresh + generator.md updates (dependency freshness, Vite+ default, AI hierarchy, vp-first diagnostics)

### Phase 16: Architecture Documentation
**Goal**: A reference file grounds the plugin's design in GAN, Cybernetics, and Turing test principles for users and future maintainers
**Depends on**: Nothing (independent; ordered last so it can reflect the shipped v1.2 architecture)
**Requirements**: DOCS-01
**Success Criteria** (what must be TRUE):
  1. `references/architecture-principles.md` exists and covers GAN principles (Generator/Discriminator separation, convergence detection, information barrier), Cybernetics (damping principle, requisite variety, feedback loop), and Turing test framing (critics as interrogators, product surface as evaluation boundary)
  2. The document focuses on principles (not implementation specifics like file paths or dimension names) so it resists staleness across milestones
**Pitfalls**: Pitfall 8 (staleness -- document principles, not implementation details)
**Plans**: TBD (est. 1)

### v2.0 Advanced Discriminators (future)

**Milestone Goal:** Expand the ensemble with domain-specific critics: semantic-critic (Content Fidelity), accessibility-critic (Fairness), graph analysis (Navigation Structure), and advanced GAN patterns (Dropout, Contrastive, BiGAN, PacGAN).

(Phases defined after v1.2 ships)

## WGAN Critic Roadmap

Mapping of GAN ensemble discriminator types to milestones. Each critic is a
specialized WGAN critic (continuous 1-10 scoring, not binary real/fake).
See `.planning/research/gan-discriminator-taxonomy.md` for the full 50+ type taxonomy.

### v1.1 Critics (shipped 2026-04-02)

| Critic agent | GAN discriminator type | Dimension | Method |
|---|---|---|---|
| `perceptual-critic` | Perceptual + Multi-Scale + Style (Section 7.3) | Visual Design | eval-first, screenshots, AI slop checklist, resize+eval responsive |
| `projection-critic` | Projection + ProjectedGAN (Section 3.3) | Functionality | write-and-run acceptance tests, AI probing via eval |
| CLI compile-evaluation | Ensemble aggregator (GMAN 12.1) | Product Depth (computed) | Deterministic merge of per-feature test pass/fail |

### v1.2 Critics (Dutch art museum fixes)

| Critic agent | GAN discriminator type | Dimension | Method |
|---|---|---|---|
| `perturbation-critic` (NEW) | Perturbation + Spectral (R-FID, Section 11.1) | Robustness | write-and-run adversarial tests, console/network monitoring |
| `perceptual-critic` (enhanced) | + Temporal + Global/Local | Visual Coherence | cross-page navigation testing, transition consistency |
| `projection-critic` (enhanced) | + Temporal Triplet + Consistency | Functionality (deeper) | A->B->A navigation tests, cross-page data matching |

### v2.0+ Critics (future expansion)

| Critic agent | GAN discriminator type | Dimension | Method |
|---|---|---|---|
| `semantic-critic` (NEW) | Semantic + Content (StackGAN, SeqGAN) | Content Fidelity | eval text extraction, factual accuracy, tone consistency |
| `accessibility-critic` (NEW) | Fairness (FairGAN) | Accessibility | keyboard nav, screen reader, contrast, WCAG assertions |
| CLI analyze-nav-graph | Graph (MolGAN) | Navigation Structure | deterministic link crawling, graph connectivity analysis |
| Dropout-GAN pattern | Dynamic ensemble (Dropout-GAN) | Meta | random critic skip per round to prevent Generator gaming |
| Contrastive scoring | Contrastive (ContraD) | Meta | round-over-round trajectory comparison in CLI |
| Build manifest | Encoder-aware (BiGAN) | Meta | Generator manifest vs critic observations cross-reference |
| Grouped evaluation | Packed samples (PacGAN) | Visual Coherence | perceptual-critic evaluates page SETS for consistency |

### Scoring dimensions by milestone

| Milestone | Dimensions | Total | Thresholds |
|-----------|-----------|-------|------------|
| v1.1 | Product Depth, Functionality, Visual Design | /30 | 7, 7, 6 |
| v1.2 | + Robustness, Visual Coherence (expands VD) | /40 | 7, 7, 6, 6 |
| v2.0 | + Content Fidelity, Accessibility | /60 | TBD |

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Orchestrator Integrity | v1.0 | 2/2 | Complete | 2026-03-28 |
| 2. Git Workflow and Loop Control | v1.0 | 3/3 | Complete | 2026-03-28 |
| 02.1. Templates for SPEC/EVALUATION | v1.0 | 1/1 | Complete | 2026-03-28 |
| 3. Evaluator Hardening | v1.0 | 2/2 | Complete | 2026-03-29 |
| 4. Generator Hardening and Skills | v1.0 | 4/4 | Complete | 2026-03-29 |
| 5. Optimize Agent Definitions | v1.0 | 3/3 | Complete | 2026-03-29 |
| 7. Ensemble Discriminator Architecture | v1.1 | 4/4 | Complete | 2026-03-31 |
| 8. SPEC Acceptance Criteria + Playwright | v1.1 | 3/3 | Complete | 2026-04-01 |
| 9. Crash Recovery | v1.1 | 2/2 | Complete | 2026-04-02 |
| 10. v1.1 Audit Gap Closure | v1.1 | 2/2 | Complete | 2026-04-02 |
| 11. Scoring Foundation + Perturbation Critic | v1.2 | 2/2 | Complete | 2026-04-02 |
| 12. Convergence Logic Hardening | 2/2 | Complete   | 2026-04-02 | - |
| 13. Orchestrator Integration | 2/2 | Complete    | 2026-04-02 | - |
| 14. Enhanced Existing Critics | 1/1 | Complete    | 2026-04-03 | - |
| 15. Generator Improvements | v1.2 | 2/2 | In Progress|  |
| 16. Architecture Documentation | v1.2 | 0/0 | Not started | - |
