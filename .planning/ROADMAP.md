# Roadmap: application-dev Plugin

## Milestones

- v1.0 **Hardening** -- Phases 1-5 (shipped 2026-03-29)
- v1.1 **Ensemble Discriminator + Crash Recovery** -- Phases 7-9 (in progress)
- v1.2 **Dutch Art Museum Test Fixes** -- Phases 10+ (planned)
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

### v1.1 Ensemble Discriminator + Crash Recovery

**Milestone Goal:** Replace the monolithic Evaluator (which crashes sessions via memory leak + context exhaustion after ~200 tool calls) with a GAN ensemble of specialized WGAN critics. Each critic scores one dimension in its own isolated context. The CLI ensemble aggregator computes Product Depth and assembles the report deterministically.

**Scope:** Ensemble architecture, Playwright acceptance testing, token efficiency, crash recovery. All other Dutch art museum test issues defer to v1.2.

- [x] **Phase 7: Ensemble Discriminator Architecture** - perceptual-critic + projection-critic + CLI compile-evaluation + install-dep + GAN barrier (completed 2026-03-31)
- [x] **Phase 8: SPEC Acceptance Criteria + Playwright Patterns** - Acceptance criteria in SPEC.md, write-and-run test generation, token-efficient evaluation reference (completed 2026-04-01)
- [ ] **Phase 9: Crash Recovery** - Session resume from appdev-cli state + filesystem, per-critic recovery, static production build serving

### v1.2 Dutch Art Museum Test Fixes (planned)

**Milestone Goal:** Address all remaining issues from the Dutch art museum website test #1: perturbation-critic (Robustness), scoring convergence logic, planner/generator improvements, Visual Coherence expansion, architecture documentation.

**Requirements:** CRITIC-01..03, CONV-01..05, SCORE-01..02, PLAN-01..02, GEN-01..04, EVAL-01..02, ORCH-01, DOCS-01

(Phases defined after v1.1 ships)

### v2.0 Advanced Discriminators (future)

**Milestone Goal:** Expand the ensemble with domain-specific critics: semantic-critic (Content Fidelity), accessibility-critic (Fairness), graph analysis (Navigation Structure), and advanced GAN patterns (Dropout, Contrastive, BiGAN, PacGAN).

(Phases defined after v1.2 ships)

## Phase Details

### Phase 7: Ensemble Discriminator Architecture
**Goal**: The monolithic Evaluator is replaced by 2 parallel WGAN critics (perceptual-critic + projection-critic) and a deterministic CLI ensemble aggregator. Each critic scores one dimension in its own context (~60K tokens max). The CLI computes Product Depth and assembles EVALUATION.md. No single agent exceeds safe context limits.
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: ENSEMBLE-01..10, BARRIER-01..04
**Success Criteria** (what must be TRUE):
  1. `perceptual-critic.md` (Perceptual discriminator, <150 lines) scores Visual Design by detecting AI slop and assessing design authenticity -- it never reads source code, only observes the product surface via playwright-cli
  2. `projection-critic.md` (Projection discriminator, <150 lines) scores Functionality by writing and running acceptance tests from SPEC.md criteria and probing AI features -- browser interaction happens outside its context via write-and-run
  3. `appdev-cli compile-evaluation --round N` reads `perceptual/summary.json` + `projection/summary.json`, computes Product Depth from acceptance test results, applies ceiling rules, and writes EVALUATION.md -- fully deterministic, zero LLM tokens
  4. `appdev-cli install-dep --dev <packages>` handles concurrent critic requests via file-based mutex -- both critics can install evaluation tooling simultaneously
  5. The summary.json schema is extensible: adding `perturbation/summary.json` (v1.2) requires zero CLI changes -- compile-evaluation reads all `*/summary.json` directories
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md -- CLI ensemble aggregator: compile-evaluation, install-dep, 3-dimension scoring (TDD)
- [x] 07-02-PLAN.md -- EVALUATION-TEMPLATE.md + SCORING-CALIBRATION.md redesign + ROADMAP naming
- [x] 07-03-PLAN.md -- Critic agent definitions (perceptual-critic + projection-critic) + evaluator deletion
- [x] 07-04-PLAN.md -- Orchestrator evaluation phase rewrite + final review

### Phase 8: SPEC Acceptance Criteria + Playwright Patterns
**Goal**: SPEC.md gains behavioral acceptance criteria per feature. The projection-critic generates acceptance tests from these criteria using playwright-testing skill patterns. Both critics use token-efficient eval-first Playwright patterns documented in a dedicated reference.
**Depends on**: Phase 7
**Requirements**: SPEC-01..05, PLAYWRIGHT-01..06, TOKEN-01..05
**Success Criteria** (what must be TRUE):
  1. SPEC-TEMPLATE.md has `**Acceptance Criteria:**` per feature with >= 3 criteria for Core features -- behavioral and testable, not prescriptive of implementation
  2. Generator writes its own dev tests (tests/) using playwright-testing Plan->Generate->Heal; projection-critic writes separate acceptance tests (evaluation/round-N/) using the same skill patterns -- independent test suites with independent purposes
  3. PLAYWRIGHT-EVALUATION.md reference exists teaching eval-first, write-and-run, snapshot-as-fallback patterns -- both critics reference it
  4. Projection-critic's write-and-run: reads SPEC criteria, takes 1 snapshot, writes acceptance-tests.spec.ts, runs `npx playwright test --reporter=json`, reads JSON results -- ~5 tool calls replace ~30+ interactive calls
  5. Both critics write structured summary.json and use `console error` (filtered). Raw observation data exists on disk but not in agent context after observation steps (hard GC on agent completion)
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md -- SPEC-TEMPLATE.md acceptance criteria + acceptance-criteria-guide.md + planner.md updates
- [x] 08-02-PLAN.md -- PLAYWRIGHT-EVALUATION.md shared evaluation techniques reference
- [x] 08-03-PLAN.md -- Critic agent definition wiring + Generator test boundary clarification

### Phase 9: Crash Recovery
**Goal**: The orchestrator detects completed critic artifacts on resume (via appdev-cli state JSON + filesystem) and recovers from any crash point with minimal rework. Dev server lifecycle is replaced by static production builds served through appdev-cli static-serve.
**Depends on**: Phase 7
**Requirements**: RECOVERY-01..04
**Success Criteria** (what must be TRUE):
  1. On `claude --continue`, the orchestrator checks appdev-cli state + filesystem for: perceptual/summary.json, projection/summary.json, EVALUATION.md, git tags. It resumes from the latest completed checkpoint.
  2. Four recovery states work: (1) no summaries -> spawn both critics; (2) perceptual done -> spawn projection-critic only; (3) both done -> compile-evaluation only; (4) compiled -> round-complete only
  3. Static production build: Generator produces production build, critics evaluate via static-serve, orchestrator stops between rounds
  4. Critic agent definitions recommend `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md -- CLI crash recovery and static serve foundation (TDD)
- [ ] 09-02-PLAN.md -- Agent definitions and orchestrator wiring for crash recovery

## WGAN Critic Roadmap

Mapping of GAN ensemble discriminator types to milestones. Each critic is a
specialized WGAN critic (continuous 1-10 scoring, not binary real/fake).
See `.planning/research/gan-discriminator-taxonomy.md` for the full 50+ type taxonomy.

### v1.1 Critics (essential -- crash-fix release)

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
| 9. Crash Recovery | v1.1 | 0/2 | Not started | - |
