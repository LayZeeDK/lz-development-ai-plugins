# Requirements: application-dev Plugin

**Defined:** 2026-03-29
**Revised:** 2026-03-31 (v1.1 = ensemble discriminator + Playwright + crash recovery; Dutch art museum fixes -> v1.2)
**Core Value:** Hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration.

## v1.1 Requirements

Replace the monolithic Evaluator with a GAN ensemble discriminator architecture
using Perceptual and Projection critics, add acceptance criteria to SPEC.md for
Playwright test generation, use token-efficient Playwright patterns, and
recover from session crashes.

### Ensemble Discriminator Architecture (ENSEMBLE)

- [x] **ENSEMBLE-01**: New `perceptual-critic` agent (Perceptual discriminator) -- scores Visual Design by detecting AI slop, assessing design authenticity, and checking whether the product passes as hand-built. Compact agent definition (detailed, not comprehensive per SkillsBench).
- [x] **ENSEMBLE-02**: New `projection-critic` agent (Projection discriminator) -- scores Functionality by verifying SPEC.md feature conformance via write-and-run acceptance tests and AI feature probing. Compact agent definition.
- [x] **ENSEMBLE-03**: `appdev-cli compile-evaluation` subcommand (Ensemble aggregator) -- reads perceptual/summary.json + projection/summary.json, computes Product Depth from acceptance test pass/fail, applies ceiling rules, cross-validates scores vs findings, writes EVALUATION.md from template. Fully deterministic.
- [x] **ENSEMBLE-04**: `appdev-cli install-dep` subcommand -- file-based mutex for concurrent-safe npm installs. Critics manage their own evaluation tooling dependencies.
- [x] **ENSEMBLE-05**: Remove monolithic `evaluator.md` -- replaced by perceptual-critic + projection-critic agents
- [x] **ENSEMBLE-06**: 3 scoring dimensions: Product Depth (CLI-computed), Functionality (projection-critic), Visual Design (perceptual-critic). Code Quality removed.
- [x] **ENSEMBLE-07**: EVALUATION-TEMPLATE.md redesigned as CLI-compiled output with clear provenance per section (Perceptual Critic, Projection Critic, CLI Ensemble)
- [x] **ENSEMBLE-08**: SCORING-CALIBRATION.md updated for 3 dimensions with rubric descriptors, grade ranges, ceiling rules, and few-shot calibration examples aligned with Anthropic pattern
- [x] **ENSEMBLE-09**: summary.json schema as extensible contract -- any `evaluation/round-N/*/summary.json` is auto-consumed by compile-evaluation. Directory names match GAN techniques: `perceptual/`, `projection/`, future `perturbation/`, `semantic/`
- [x] **ENSEMBLE-10**: Orchestrator evaluation phase: parallel critic spawns with minimal prompts ("This is evaluation round N."), binary file-exists checks, CLI compile + round-complete

### SPEC Acceptance Criteria (SPEC)

- [ ] **SPEC-01**: SPEC-TEMPLATE.md includes `**Acceptance Criteria:**` per feature -- behavioral, testable, not prescriptive of implementation
- [ ] **SPEC-02**: Core features >= 3 criteria (happy path, edge case, error state); Important >= 2; Nice-to-have >= 1
- [ ] **SPEC-03**: Criteria use measurable thresholds ("at least 12 artworks", "adapts to 320px") -- no vague qualities ("works well")
- [ ] **SPEC-04**: Planner agent updated with compact reference on writing testable behavioral criteria (good vs bad examples)
- [ ] **SPEC-05**: Planner self-verification checklist checks acceptance criteria presence and quality per feature

### Playwright Test Architecture (PLAYWRIGHT)

- [ ] **PLAYWRIGHT-01**: Generator writes dev tests using playwright-testing skill (Plan -> Generate -> Heal) committed to `tests/` as internal CI
- [ ] **PLAYWRIGHT-02**: Projection-critic writes SEPARATE acceptance tests from SPEC.md criteria committed to `evaluation/round-N/acceptance-tests.spec.ts`
- [x] **PLAYWRIGHT-03**: Acceptance test generation: snapshot for selector discovery + SPEC.md criteria for test logic -- Playwright Generate pattern with accessibility-tree-first selectors (getByRole, getByLabel, getByText)
- [x] **PLAYWRIGHT-04**: Acceptance test execution deterministic: `npx playwright test --reporter=json` -- browser interaction entirely outside agent context
- [x] **PLAYWRIGHT-05**: Acceptance test healing: Playwright Heal pattern for selector failures; remaining failures are real bugs fed to Functionality score
- [x] **PLAYWRIGHT-06**: Rounds 2+: existing acceptance tests re-run first; only regenerated if app structure changed significantly

### Token Efficiency (TOKEN)

- [x] **TOKEN-01**: Dedicated PLAYWRIGHT-EVALUATION.md reference -- eval-first (structured JSON over snapshot), write-and-run (tests outside context), snapshot-as-fallback (only for interaction ref IDs)
- [ ] **TOKEN-02**: Perceptual-critic uses `eval` for page state, `resize` + `eval` for responsive checks, screenshots only at key viewpoints
- [ ] **TOKEN-03**: Projection-critic uses write-and-run for feature testing -- 5 tool calls (read SPEC, snapshot, write tests, run tests, read results) replace 30+ interactive calls
- [ ] **TOKEN-04**: Both critics use `console error` (filtered) instead of `console` (all messages)
- [ ] **TOKEN-05**: Structured summary.json written to files -- agent context holds summaries only; raw data discarded on agent completion (hard GC via process destruction)

### Crash Recovery (RECOVERY)

- [ ] **RECOVERY-01**: Orchestrator detects completed artifacts on resume via appdev-cli state JSON + filesystem: perceptual/summary.json, projection/summary.json, acceptance-tests.spec.ts, EVALUATION.md, git tags
- [ ] **RECOVERY-02**: Recovery states: (1) no summaries -> re-spawn both critics; (2) perceptual done, projection incomplete -> spawn projection-critic only; (3) both done, not compiled -> compile-evaluation only; (4) compiled, not round-complete -> round-complete only
- [ ] **RECOVERY-03**: Dev server lifecycle: orchestrator starts before evaluation, verifies port, reuses existing server on resume
- [ ] **RECOVERY-04**: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` recommended in critic agent definitions

### GAN Information Barrier (BARRIER)

- [x] **BARRIER-01**: Neither critic reads application source code -- evaluation is product-surface only via playwright-cli
- [x] **BARRIER-02**: Findings describe behavioral symptoms, not code diagnoses -- code diagnosis is the Generator's job in rounds 2+
- [x] **BARRIER-03**: Critics do not modify application source, config, or deps (except via appdev-cli install-dep for evaluation tooling)
- [x] **BARRIER-04**: Generator's dev tests and projection-critic's acceptance tests are independent test suites with separate purposes

## v1.2 Requirements

All Dutch art museum website test #1 fixes. Deferred until v1.1 ensemble
architecture is validated through testing.

### Additional WGAN Critics

- **CRITIC-01**: `perturbation-critic` agent (Perturbation discriminator) -- scores Robustness via edge case probing, error state testing, stress testing. Write-and-run adversarial test suite.
- **CRITIC-02**: Perceptual-critic enhanced with Temporal + Global/Local patterns (Visual Coherence expansion) -- cross-page consistency, navigation coherence, transition uniformity
- **CRITIC-03**: Projection-critic enhanced with Temporal Triplet pattern (A->B->A navigation) and Consistency discriminator (cross-page data matching)

### Scoring Convergence Logic

- **CONV-01**: CLI-decided verdict replaces Evaluator-written verdict (Anthropic evals: separate grading from gating)
- **CONV-02**: Minimum 2 rounds before PASS (GAN warm-up epoch)
- **CONV-03**: REGRESSION checked before PASS in determineExit()
- **CONV-04**: Score anomaly detection -- z-score on trajectory, threshold anchoring (stdDev < 0.5)
- **CONV-05**: Rising threshold infrastructure (round-indexed lookup, thresholds flat until empirical data)
- **SCORE-01**: Granular Major bug ceilings (1=max 8, 2=max 7, 3+=max 6)
- **SCORE-02**: Anti-anchoring rule in SCORING-CALIBRATION.md

### Planner and SPEC Improvements

- **PLAN-01**: Technical Constraints section in SPEC-TEMPLATE.md (required skills, stack guidance)
- **PLAN-02**: Asset Strategy section (sourcing rules, blocked sources, collection sizes)

### Generator Improvements

- **GEN-01**: Vite+ skill adoption strengthened
- **GEN-02**: Latest stable dependency versions required
- **GEN-03**: Browser-agnostic LanguageModel API (feature detection, no browser-specific strings)
- **GEN-04**: Commit all generated files (no orphaned scripts)

### Evaluator/Critic Improvements

- **EVAL-01**: Edge-first browser (`--browser=msedge`) for AI-feature applications
- **EVAL-02**: browser-prompt-api skill updated for Edge + Phi-4-mini documentation

### Orchestrator

- **ORCH-01**: Anomaly warnings from CLI output logged by orchestrator

### Documentation

- **DOCS-01**: docs/ARCHITECTURE.md at repo root -- all decisions grounded in Anthropic article, GAN, Cybernetics, Turing test principles (v1.0 + v1.1 + v1.2)

## v2.0+ Requirements (Future WGAN Critics)

From the GAN discriminator taxonomy (50+ types, 26 categories):

- `semantic-critic` (Semantic + Consistency discriminator) -- Content Fidelity dimension: text accuracy, factual correctness, cross-page data consistency
- `appdev-cli analyze-nav-graph` (Graph discriminator) -- Navigation structure: connectivity, orphan pages, dead ends, depth analysis. Deterministic CLI, no LLM.
- `accessibility-critic` (Fairness discriminator) -- Accessibility: keyboard nav, screen readers, contrast ratios, WCAG compliance
- Dropout-GAN evaluation variation -- random critic skip per round to prevent Generator gaming
- Contrastive scoring (ContraD) -- round-over-round comparison via appdev-cli trajectory analysis
- BiGAN manifest cross-reference -- Generator BUILD-MANIFEST.json vs critic observations
- PacGAN grouped page evaluation -- perceptual-critic evaluates page SETS for consistency

## Out of Scope

| Feature | Reason |
|---------|--------|
| Separate cross-validation gate (new exit condition) | Combinatorial explosion: N features -> N*(N-1)/2 pairs |
| Evaluator-computed verdict with "advisory" flag | Agreeableness bias persists if critic believes its verdict matters |
| Running Generator's tests in evaluation | Couples Evaluator to Generator implementation (GAN violation) |
| Source code inspection as "non-scoring advisory" | GAN barrier violation; critic can't unsee implementation details |
| Raising all thresholds to 8/10 without data | Fix scoring pipeline first, calibrate with empirical data |
| CLI-generated Playwright tests (no browser) | Requires playwright-testing skill patterns with app interaction |
| Second independent critic ensemble for "second opinion" | Doubles cost; deferred to v2 |
| Agent teams (experimental Claude Code feature) | Critical bugs (#30499 Windows MCP, #24316 custom agents, #31977 nesting) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENSEMBLE-01..10 | Phase 7 | Pending |
| BARRIER-01..04 | Phase 7 | Pending |
| SPEC-01..05 | Phase 8 | Pending |
| PLAYWRIGHT-01..06 | Phase 8 | Pending |
| TOKEN-01..05 | Phase 8 | Pending |
| RECOVERY-01..04 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 34 total (ENSEMBLE 10, BARRIER 4, SPEC 5, PLAYWRIGHT 6, TOKEN 5, RECOVERY 4)
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-31 after GAN discriminator naming alignment*
