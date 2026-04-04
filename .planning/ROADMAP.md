# Roadmap: application-dev Plugin

## Milestones

- v1.0 **Hardening** -- Phases 1-5 (shipped 2026-03-29)
- v1.1 **Ensemble Discriminator + Crash Recovery** -- Phases 7-10 (shipped 2026-04-02)
- v1.2 **Dutch Art Museum Test Fixes** -- Phases 11-16 (shipped 2026-04-04)
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

<details>
<summary>v1.2 Dutch Art Museum Test Fixes (6 phases, 11 plans) -- SHIPPED 2026-04-04</summary>

- [x] Phase 11: Scoring Foundation + Perturbation Critic (2/2 plans) -- completed 2026-04-02
- [x] Phase 12: Convergence Logic Hardening (2/2 plans) -- completed 2026-04-02
- [x] Phase 13: Orchestrator Integration (2/2 plans) -- completed 2026-04-02
- [x] Phase 14: Enhanced Existing Critics (1/1 plan) -- completed 2026-04-03
- [x] Phase 15: Generator Improvements (2/2 plans) -- completed 2026-04-03
- [x] Phase 16: Architecture Documentation (2/2 plans) -- completed 2026-04-03

See `.planning/milestones/v1.2-ROADMAP.md` for full phase details.

</details>

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
| 12. Convergence Logic Hardening | v1.2 | 2/2 | Complete | 2026-04-02 |
| 13. Orchestrator Integration | v1.2 | 2/2 | Complete | 2026-04-02 |
| 14. Enhanced Existing Critics | v1.2 | 1/1 | Complete | 2026-04-03 |
| 15. Generator Improvements | v1.2 | 2/2 | Complete | 2026-04-03 |
| 16. Architecture Documentation | v1.2 | 2/2 | Complete | 2026-04-03 |
