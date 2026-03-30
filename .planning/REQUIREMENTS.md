# Requirements: application-dev Plugin

**Defined:** 2026-03-29
**Revised:** 2026-03-30 (scope reduction: v1.1 = crash fix + ensemble evaluator)
**Core Value:** Hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration.

## v1.1 Requirements

Crash-focused release. Replace the monolithic Evaluator with an ensemble
discriminator architecture that stays within safe context limits, uses
token-efficient Playwright patterns, and recovers from session crashes.

### Ensemble Discriminator Architecture (ENSEMBLE)

- [ ] **ENSEMBLE-01**: New `evaluator-observer` agent scores Visual Design via eval-first Playwright patterns, screenshots at key viewpoints, and AI slop detection -- compact agent definition (detailed, not comprehensive per SkillsBench)
- [ ] **ENSEMBLE-02**: New `evaluator-tester` agent scores Functionality via write-and-run acceptance tests (using playwright-testing skill patterns) and AI feature probing with eval -- compact agent definition
- [ ] **ENSEMBLE-03**: New `appdev-cli compile-evaluation` subcommand reads structured JSON summaries from both agents, computes Product Depth from acceptance test results, applies ceiling rules, cross-validates scores vs findings, and writes EVALUATION.md from template
- [ ] **ENSEMBLE-04**: New `appdev-cli install-dep` subcommand with file-based mutex for concurrent-safe npm installs -- agents manage their own dependencies
- [ ] **ENSEMBLE-05**: Remove monolithic `evaluator.md` -- replaced by observer + tester agents
- [ ] **ENSEMBLE-06**: Remove Code Quality scoring dimension -- 3 dimensions for v1.1: Product Depth (CLI), Functionality (Tester), Visual Design (Observer)
- [ ] **ENSEMBLE-07**: EVALUATION-TEMPLATE.md redesigned as CLI-compiled output format with clear provenance per section (Observer, Tester, CLI)
- [ ] **ENSEMBLE-08**: SCORING-CALIBRATION.md updated for 3 dimensions with rubric descriptors, grade ranges, ceiling rules, and few-shot calibration examples (Anthropic pattern)
- [ ] **ENSEMBLE-09**: summary.json schema defined as extensible contract -- any `evaluation/round-N/*/summary.json` is auto-consumed by compile-evaluation
- [ ] **ENSEMBLE-10**: Orchestrator evaluation phase restructured: parallel sub-agent spawns with minimal prompts ("This is evaluation round N."), binary file-exists checks, CLI compile + round-complete

### Token Efficiency (TOKEN)

- [ ] **TOKEN-01**: Dedicated PLAYWRIGHT-EVALUATION.md reference teaching eval-first pattern (structured JSON extraction over snapshot), write-and-run pattern, snapshot-as-fallback (only for ref IDs)
- [ ] **TOKEN-02**: evaluator-observer uses eval for page state checks, resize + eval for responsive testing, screenshots only at key viewpoints -- NOT snapshot at every viewport
- [ ] **TOKEN-03**: evaluator-tester writes acceptance tests from SPEC.md using playwright-testing skill patterns (getByRole, getByLabel, getByText), runs via npx playwright test --reporter=json, reads JSON results -- browser interaction outside agent context
- [ ] **TOKEN-04**: Console filtering: `console error` (errors only) instead of `console` (all messages) in both sub-agents
- [ ] **TOKEN-05**: Intermediate findings written to files (summary.json) -- agents keep only summaries in context, raw observation data discarded on agent completion (hard GC)

### Crash Recovery (RECOVERY)

- [ ] **RECOVERY-01**: Orchestrator detects completed sub-agent artifacts on resume: observations/summary.json, interactions/summary.json, acceptance-tests.spec.ts, EVALUATION.md -- skips to the appropriate recovery point
- [ ] **RECOVERY-02**: Four recovery states: (1) no observations -> re-spawn both; (2) observer done, tester incomplete -> re-spawn tester only; (3) both done, not compiled -> compile only; (4) compiled, not round-complete -> run round-complete only
- [ ] **RECOVERY-03**: Dev server lifecycle managed by orchestrator (start before eval, verify port, stop after round)
- [ ] **RECOVERY-04**: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` recommended in evaluator agent definitions to trigger compaction earlier

### GAN Information Barrier (BARRIER)

- [ ] **BARRIER-01**: Neither sub-evaluator agent reads application source code -- evaluation is product-surface only via playwright-cli
- [ ] **BARRIER-02**: Evaluator findings describe behavioral SYMPTOMS ("Gallery filter doesn't preserve state on back-navigation"), not code DIAGNOSES ("setState not called in useEffect cleanup") -- code diagnosis is the Generator's job in rounds 2+
- [ ] **BARRIER-03**: Evaluator does not modify application source code, configuration, or dependencies (except via appdev-cli install-dep for evaluation tooling)

## v1.2 Requirements

All Dutch art museum test issues not addressed by v1.1 ensemble redesign.
Deferred until the crash is fixed and the ensemble architecture is validated.

### Additional Discriminators

- **DISC-01**: evaluator-robustness agent (Perturbation + Spectral discriminator) -- Robustness dimension replacing Code Quality
- **DISC-02**: Visual Coherence expansion in evaluator-observer (Temporal + Global/Local discriminator) -- cross-page consistency, navigation coherence
- **DISC-03**: Cross-feature interaction testing (Temporal Triplet pattern A->B->A) routed to existing dimension scores
- **DISC-04**: Data consistency checking (Consistency discriminator) -- same info matches across pages

### Scoring and Convergence

- **CONV-01**: Minimum 2 rounds before PASS (warm-up epoch)
- **CONV-02**: REGRESSION checked before PASS in determineExit()
- **CONV-03**: Score anomaly detection (z-score on trajectory)
- **CONV-04**: Threshold anchoring detection (stdDev < 0.5)
- **CONV-05**: Rising threshold infrastructure (round-indexed lookup, flat until data)
- **SCORE-01**: Granular Major bug ceilings (1=max 8, 2=max 7, 3+=max 6)
- **SCORE-02**: Anti-anchoring rule in SCORING-CALIBRATION.md

### Planner and SPEC Improvements

- **PLAN-01**: Acceptance test plan section in SPEC-TEMPLATE.md (abstract flow scenarios)
- **PLAN-02**: Technical Constraints section (required skills, stack guidance)
- **PLAN-03**: Asset Strategy section (sourcing rules, blocked sources, collection sizes)
- **PLAN-04**: Measurability rule (every quality claim passes playwright-cli testability check)

### Generator Improvements

- **GEN-01**: Vite+ skill adoption strengthened
- **GEN-02**: Latest stable dependency versions
- **GEN-03**: Browser-agnostic LanguageModel API (feature detection, no browser-specific strings)
- **GEN-04**: Commit all generated files
- **GEN-05**: Playwright tests use accessibility-tree-first selectors

### Evaluator Improvements

- **EVAL-01**: Edge-first browser for AI-feature applications
- **EVAL-02**: browser-prompt-api skill updated for Edge + Phi-4-mini documentation

### Orchestrator

- **ORCH-01**: Anomaly warnings from CLI output logged by orchestrator

### Documentation

- **DOCS-01**: docs/ARCHITECTURE.md at repo root -- all decisions grounded in Anthropic article, GAN, Cybernetics, Turing test principles (v1.0 + v1.1 + v1.2)

## v2.0+ Requirements (Future)

### Additional Discriminators (deferred from GAN taxonomy)

- evaluator-content agent (Semantic + Consistency discriminator) -- Content Fidelity dimension
- appdev-cli analyze-nav-graph (Graph discriminator) -- navigation structure analysis
- evaluator-accessibility agent (Fairness discriminator) -- accessibility compliance
- Dropout-GAN evaluation variation (random agent skip to prevent Generator gaming)
- Contrastive scoring (round-over-round comparison)
- BiGAN manifest cross-reference (Generator BUILD-MANIFEST.json)
- PacGAN grouped page evaluation (evaluate page SETS for consistency)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Separate cross-validation gate | Combinatorial explosion: N features -> N*(N-1)/2 pairs |
| Evaluator-computed verdict with "advisory" flag | Defeats purpose; agreeableness bias persists |
| Full test suite execution by Evaluator (running Generator's tests) | Couples Evaluator to Generator implementation |
| Source code inspection as "non-scoring advisory" | GAN barrier violation; can't unsee |
| Raising all thresholds to 8/10 | Fix scoring pipeline first, raise with data |
| Per-feature auto-generated Playwright scripts from CLI (no browser) | Requires Playwright skill patterns with app interaction |
| Second independent Evaluator agent for "second opinion" | Doubles cost; deferred to v2 |
| Agent teams (experimental Claude Code feature) | Critical bugs (#30499, #24316, #31977); use subagents instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENSEMBLE-01 | Phase 7 | Pending |
| ENSEMBLE-02 | Phase 7 | Pending |
| ENSEMBLE-03 | Phase 7 | Pending |
| ENSEMBLE-04 | Phase 7 | Pending |
| ENSEMBLE-05 | Phase 7 | Pending |
| ENSEMBLE-06 | Phase 7 | Pending |
| ENSEMBLE-07 | Phase 7 | Pending |
| ENSEMBLE-08 | Phase 7 | Pending |
| ENSEMBLE-09 | Phase 7 | Pending |
| ENSEMBLE-10 | Phase 7 | Pending |
| TOKEN-01 | Phase 8 | Pending |
| TOKEN-02 | Phase 8 | Pending |
| TOKEN-03 | Phase 8 | Pending |
| TOKEN-04 | Phase 8 | Pending |
| TOKEN-05 | Phase 8 | Pending |
| RECOVERY-01 | Phase 9 | Pending |
| RECOVERY-02 | Phase 9 | Pending |
| RECOVERY-03 | Phase 9 | Pending |
| RECOVERY-04 | Phase 9 | Pending |
| BARRIER-01 | Phase 7 | Pending |
| BARRIER-02 | Phase 7 | Pending |
| BARRIER-03 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-30 after scope reduction to crash fix + ensemble evaluator*
