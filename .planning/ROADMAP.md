# Roadmap: application-dev Plugin

## Milestones

- v1.0 **Hardening** -- Phases 1-5 (shipped 2026-03-29)
- v1.1 **Hardening after Dutch art museum website test #1** -- Phases 7-9 (in progress)

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

### v1.1 Hardening after Dutch art museum website test #1

**Milestone Goal:** Fix issues surfaced by the first real-world test -- scoring dimension restructuring, GAN information barrier enforcement, CLI-decided verdict, convergence hardening, acceptance test planning, generator quality improvements, and architecture documentation.

- [ ] **Phase 7: Scoring Pipeline Overhaul** - Atomic migration of scoring dimensions, verdict authority, information barrier, and convergence logic
- [ ] **Phase 8: Evaluation Quality and Spec-Driven Testing** - Acceptance test plan, planner improvements, cross-feature testing, and Edge browser support
- [ ] **Phase 9: Generator Hardening, Recovery, and Documentation** - Generator quality improvements, session resume, and architecture documentation

## Phase Details

### Phase 7: Scoring Pipeline Overhaul
**Goal**: The CLI mechanically decides PASS/FAIL from restructured scoring dimensions, the Evaluator scores through behavioral observation only, and convergence logic catches anomalies and premature exits
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, BARRIER-01, BARRIER-02, BARRIER-03, BARRIER-04, VERDICT-01, VERDICT-02, VERDICT-03, VERDICT-04, VERDICT-05, VERDICT-06, CONV-01, CONV-02, CONV-03, CONV-04, CONV-05
**Success Criteria** (what must be TRUE):
  1. Running `appdev-cli round-complete` on an EVALUATION.md with the new dimension names (Product Depth, Functionality, Visual Coherence, Robustness) extracts all 4 scores and computes PASS/FAIL mechanically -- no verdict is parsed from the report
  2. The Evaluator agent definition contains zero instructions to read application source code, compute an overall verdict, or assess code structure -- Robustness is scored entirely through behavioral observation (build output, console errors, test results, error handling under stress)
  3. Running `appdev-cli round-complete` on round 1 with all scores above threshold still returns `should_continue: true` because minimum 2 rounds are enforced before PASS can fire
  4. Running `appdev-cli round-complete` with all 4 scores identical (e.g., 7/7/7/7) triggers an anchoring warning; a score jump >8 points between rounds triggers an anomaly flag
  5. SCORING-CALIBRATION.md contains rubric descriptors, grade ranges, ceiling rules, and calibration scenarios for both Visual Coherence and Robustness -- with Major bug ceiling rules (1 Major = max 8, 2 Major = max 7, 3+ Major = max 6)
**Plans**: TBD

### Phase 8: Evaluation Quality and Spec-Driven Testing
**Goal**: The Planner produces structured acceptance criteria that the Evaluator uses as a test oracle, the Evaluator tests features in combination (not just isolation), and AI-feature applications are tested in Edge
**Depends on**: Phase 7
**Requirements**: ATP-01, ATP-02, ATP-03, ATP-04, ATP-05, PLAN-01, PLAN-02, PLAN-03, PLAN-04, EVAL-01, EVAL-02, EVAL-03
**Success Criteria** (what must be TRUE):
  1. SPEC-TEMPLATE.md contains an Acceptance Test Plan section where each Core feature has >= 3 scenarios and cross-feature journey scenarios test features in sequence -- framed as behavioral outcomes, not implementation prescriptions
  2. The Evaluator translates acceptance scenarios into concrete playwright-cli actions and reports per-scenario PASS/FAIL with screenshot evidence; the CLI uses acceptance scenario pass rate as a verdict input (< 80% = FAIL)
  3. The Evaluator tests Core features in combination (not just isolation) and routes cross-feature findings into Functionality and Visual Coherence scores -- there is no separate cross-validation gate
  4. When SPEC.md indicates browser AI features, the Evaluator uses `--browser=msedge` for AI-feature testing; the browser-prompt-api skill documents Edge as officially supported with Phi-4-mini, hardware requirements, and setup steps
  5. SPEC-TEMPLATE.md contains Technical Constraints (required skills, stack guidance) and Asset Strategy sections; every quality claim in the spec passes the "Can the Evaluator verify this with playwright-cli?" test
**Plans**: TBD

### Phase 9: Generator Hardening, Recovery, and Documentation
**Goal**: The Generator produces higher-quality applications with current dependencies and browser-agnostic AI, the Orchestrator recovers gracefully from session interruptions, and architectural decisions are documented
**Depends on**: Nothing (independent of Phases 7-8; can run in parallel)
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, ORCH-01, ORCH-02, DOCS-01
**Success Criteria** (what must be TRUE):
  1. Generator instructions require Vite+ skill for all greenfield web projects, latest stable major versions for all dependencies, and committing all generated files -- no orphaned scripts
  2. Generator-produced applications use browser-agnostic LanguageModel API with feature detection (`typeof LanguageModel`) and no browser-specific strings in user-facing messages
  3. Playwright e2e tests written by the Generator use accessibility-tree-first selectors (`.getByRole()`, `.getByLabel()`, `.getByText()`) with CSS selectors only as fallback
  4. On session resume, the Orchestrator detects already-completed steps (git tags, evaluation reports, CLI state) and resumes from the correct position without re-running completed work; anomaly warnings from CLI output are logged by the Orchestrator
  5. `docs/ARCHITECTURE.md` exists at the repo root documenting all architectural decisions grounded in Anthropic article, GAN, Cybernetics, and Turing test principles -- covering both v1.0 and v1.1
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Orchestrator Integrity | v1.0 | 2/2 | Complete | 2026-03-28 |
| 2. Git Workflow and Loop Control | v1.0 | 3/3 | Complete | 2026-03-28 |
| 02.1. Templates for SPEC/EVALUATION | v1.0 | 1/1 | Complete | 2026-03-28 |
| 3. Evaluator Hardening | v1.0 | 2/2 | Complete | 2026-03-29 |
| 4. Generator Hardening and Skills | v1.0 | 4/4 | Complete | 2026-03-29 |
| 5. Optimize Agent Definitions | v1.0 | 3/3 | Complete | 2026-03-29 |
| 7. Scoring Pipeline Overhaul | v1.1 | 0/? | Not started | - |
| 8. Evaluation Quality and Spec-Driven Testing | v1.1 | 0/? | Not started | - |
| 9. Generator Hardening, Recovery, and Documentation | v1.1 | 0/? | Not started | - |
