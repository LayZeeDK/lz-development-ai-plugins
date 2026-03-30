# Roadmap: application-dev Plugin

## Milestones

- v1.0 **Hardening** -- Phases 1-5 (shipped 2026-03-29)
- v1.1 **Ensemble Evaluator + Crash Recovery** -- Phases 7-9 (in progress)
- v1.2 **Dutch Art Museum Test Fixes** -- Phases 10+ (planned)

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

### v1.1 Ensemble Evaluator + Crash Recovery

**Milestone Goal:** Replace the monolithic Evaluator (which crashes sessions via memory leak + context exhaustion) with an ensemble of specialized sub-agents that stay within safe context limits, use token-efficient Playwright patterns, and recover from crashes.

**Scope:** ONLY the crash fix and ensemble architecture. All other Dutch art museum test issues defer to v1.2.

- [ ] **Phase 7: Ensemble Discriminator Architecture** - Replace monolithic evaluator.md with evaluator-observer + evaluator-tester + appdev-cli compile-evaluation
- [ ] **Phase 8: Token Efficiency Patterns** - Playwright eval-first patterns, write-and-run acceptance tests, dedicated evaluation reference
- [ ] **Phase 9: Crash Recovery** - Session resume detection, per-agent recovery states, dev server lifecycle

### v1.2 Dutch Art Museum Test Fixes (planned)

**Milestone Goal:** Address all remaining issues from the Dutch art museum website test #1: additional discriminators (Robustness, Visual Coherence), convergence logic hardening, planner/generator improvements, architecture documentation.

**Requirements:** DISC-01..04, CONV-01..05, SCORE-01..02, PLAN-01..04, GEN-01..05, EVAL-01..02, ORCH-01, DOCS-01

(Phases defined after v1.1 ships)

## Phase Details

### Phase 7: Ensemble Discriminator Architecture
**Goal**: The monolithic Evaluator is replaced by an ensemble of 2 parallel sub-agents (observer + tester) and a deterministic CLI aggregator. Each sub-agent scores one dimension, the CLI computes the third and assembles the report. No single agent exceeds ~60K context tokens.
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: ENSEMBLE-01, ENSEMBLE-02, ENSEMBLE-03, ENSEMBLE-04, ENSEMBLE-05, ENSEMBLE-06, ENSEMBLE-07, ENSEMBLE-08, ENSEMBLE-09, ENSEMBLE-10, BARRIER-01, BARRIER-02, BARRIER-03
**Success Criteria** (what must be TRUE):
  1. Two new agent definitions exist (evaluator-observer, evaluator-tester) each under 150 lines -- focused and compact per SkillsBench finding that detailed Skills outperform comprehensive ones
  2. `appdev-cli compile-evaluation --round N` reads observations/summary.json + interactions/summary.json, computes Product Depth from acceptance test results, applies ceiling rules, and writes EVALUATION.md -- fully deterministic, zero LLM tokens
  3. `appdev-cli install-dep --dev <packages>` safely handles concurrent calls via file-based mutex -- both sub-agents can request dependencies simultaneously
  4. The monolithic evaluator.md is removed. The orchestrator evaluation phase spawns 2 parallel agents with prompt "This is evaluation round N." and runs compile-evaluation after both complete
  5. EVALUATION.md has clear provenance per section (Observer findings, Tester findings, CLI-computed scores) and the summary.json schema is extensible for future discriminators (v1.2 robustness agent writes to robustness/summary.json with zero CLI changes)
**Plans**: TBD

### Phase 8: Token Efficiency Patterns
**Goal**: Sub-evaluator agents use token-efficient Playwright patterns that keep each agent's context under 60K tokens total. The Tester generates acceptance tests using playwright-testing skill patterns and runs them deterministically.
**Depends on**: Phase 7
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05
**Success Criteria** (what must be TRUE):
  1. PLAYWRIGHT-EVALUATION.md reference exists teaching eval-first (structured JSON extraction over snapshot), write-and-run (acceptance tests outside context), and snapshot-as-fallback (only for ref IDs needed to click)
  2. evaluator-observer uses eval for all data extraction and page state checks -- snapshot is only used when interaction ref IDs are needed. Responsive checks use resize + eval, not screenshot at each viewport
  3. evaluator-tester writes acceptance-tests.spec.ts from SPEC.md using playwright-testing skill patterns (getByRole, getByLabel, getByText), runs via `npx playwright test --reporter=json`, and reads JSON results. The browser interaction for feature testing happens entirely outside the agent's context window
  4. Both agents use `console error` (not `console`) for filtered console output
  5. Both agents write structured summary.json files with scores + findings. Raw observation data (snapshots, screenshots) exists on disk but does NOT persist in agent context after the observation step
**Plans**: TBD

### Phase 9: Crash Recovery
**Goal**: The orchestrator detects completed sub-agent artifacts on resume and recovers from any crash point with minimal rework. Dev server lifecycle is managed centrally.
**Depends on**: Phase 7 (needs ensemble architecture to have recovery checkpoints)
**Requirements**: RECOVERY-01, RECOVERY-02, RECOVERY-03, RECOVERY-04
**Success Criteria** (what must be TRUE):
  1. On `claude --continue`, the orchestrator checks for: observations/summary.json, interactions/summary.json, acceptance-tests.spec.ts, EVALUATION.md. It skips past completed stages.
  2. Four distinct recovery states work correctly: (1) no observations -> re-spawn both agents; (2) observer done, tester incomplete -> spawn tester only; (3) both done, not compiled -> run compile-evaluation; (4) compiled -> run round-complete
  3. The orchestrator starts the dev server before evaluation and verifies the port responds. If the port is already in use (from a previous crashed session), the orchestrator detects and reuses the existing server
  4. Evaluator agent definitions include `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` recommendation to trigger context compaction earlier
**Plans**: TBD

## Discriminator Roadmap

Mapping of GAN ensemble discriminator types to current and future milestones.
See `.planning/research/gan-discriminator-taxonomy.md` for the full 50+ type taxonomy.

### v1.1 Discriminators (essential, crash-fix release)

| GAN Discriminator | Agent | What it checks |
|---|---|---|
| Multi-Scale (Pix2PixHD) | evaluator-observer | Responsive quality at 320/768/1280/1920px |
| Perceptual/Style (StyleGAN) | evaluator-observer | AI slop detection, design identity |
| Global (standard) | evaluator-observer | Full-page visual assessment |
| Projection (cGAN) | appdev-cli (Product Depth) | Features match SPEC.md requirements |
| ProjectedGAN (feature-space) | evaluator-tester | eval for structured data extraction |
| Spectral (SSD-GAN) | both agents | Console errors, network failures |

### v1.2 Discriminators (Dutch art museum fixes)

| GAN Discriminator | Agent | What it checks |
|---|---|---|
| Perturbation / R-FID | evaluator-robustness (NEW) | Edge cases, error handling, stress testing |
| Spectral / Frequency | evaluator-robustness (NEW) | Hidden technical issues, performance degradation |
| Temporal Triplet (TecoGAN) | evaluator-tester (technique) | Navigation A->B->A state preservation |
| Temporal / Global+Local | evaluator-observer (enhanced) | Visual Coherence: cross-page consistency |
| Consistency (CR-GAN) | evaluator-tester (write-and-run) | Same data matches across pages |

### v2.0+ Discriminators (future expansion)

| GAN Discriminator | Agent | What it checks |
|---|---|---|
| Semantic/Content (StackGAN) | evaluator-content (NEW) | Text accuracy, factual correctness |
| Graph (MolGAN) | appdev-cli analyze-nav-graph | Navigation structure, orphan pages |
| PacGAN (packed samples) | evaluator-observer (technique) | Grouped page consistency evaluation |
| Fairness (FairGAN) | evaluator-accessibility (NEW) | Keyboard nav, screen readers, contrast |
| BiGAN (encoder-aware) | appdev-cli | Generator manifest cross-reference |
| Dropout-GAN | orchestrator | Random evaluation variation |
| Minibatch (diversity) | evaluator-tester (write-and-run) | Cross-feature interaction testing |
| Contrastive (ContraD) | appdev-cli | Round-over-round comparison |

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Orchestrator Integrity | v1.0 | 2/2 | Complete | 2026-03-28 |
| 2. Git Workflow and Loop Control | v1.0 | 3/3 | Complete | 2026-03-28 |
| 02.1. Templates for SPEC/EVALUATION | v1.0 | 1/1 | Complete | 2026-03-28 |
| 3. Evaluator Hardening | v1.0 | 2/2 | Complete | 2026-03-29 |
| 4. Generator Hardening and Skills | v1.0 | 4/4 | Complete | 2026-03-29 |
| 5. Optimize Agent Definitions | v1.0 | 3/3 | Complete | 2026-03-29 |
| 7. Ensemble Discriminator Architecture | v1.1 | 0/? | Not started | - |
| 8. Token Efficiency Patterns | v1.1 | 0/? | Not started | - |
| 9. Crash Recovery | v1.1 | 0/? | Not started | - |
