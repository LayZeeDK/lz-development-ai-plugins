# Requirements: application-dev Plugin

**Defined:** 2026-03-29
**Core Value:** Hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration.

## v1.1 Requirements

Requirements for the v1.1 hardening release. Derived from the Dutch art museum
website test #1 findings and GAN/Cybernetics research.

### Scoring Dimensions (SCORE)

- [ ] **SCORE-01**: Robustness dimension replaces Code Quality -- scored via behavioral observation (build health, error handling under stress, console errors, crash recovery) without source code access
- [ ] **SCORE-02**: Visual Coherence dimension replaces Visual Design -- scores both page-level aesthetics AND cross-page consistency (transitions, scroll behavior, navigation coherence, loading state uniformity)
- [ ] **SCORE-03**: SCORING-CALIBRATION.md updated with rubric descriptors, grade ranges, ceiling rules, and calibration scenarios for Robustness and Visual Coherence
- [ ] **SCORE-04**: Granular Major bug ceiling rules -- 1 Major = max 8, 2 Major = max 7, 3+ Major = max 6 (eliminates dead zone in scoring)
- [ ] **SCORE-05**: Anti-anchoring rule in SCORING-CALIBRATION.md -- if 3+ scores land exactly on thresholds, Evaluator must re-examine

### GAN Information Barrier (BARRIER)

- [ ] **BARRIER-01**: Evaluator cannot read application source code -- Step 10 (Code Review) removed from evaluator.md
- [ ] **BARRIER-02**: Evaluator scores all dimensions via product-surface observation only (playwright-cli interaction, screenshots, console output, network requests)
- [ ] **BARRIER-03**: Evaluator does not modify application source code, configuration, or dependencies (existing Rule 1 and 2 reinforced)
- [ ] **BARRIER-04**: Evaluator commit hygiene -- separate commits for tooling setup vs evaluation artifacts, Conventional Commits format

### CLI-Decided Verdict (VERDICT)

- [ ] **VERDICT-01**: Evaluator stops writing `## Verdict: PASS/FAIL` -- reports scores and structured Findings Summary only
- [ ] **VERDICT-02**: appdev-cli `computeVerdict()` determines PASS/FAIL mechanically from scores vs thresholds
- [ ] **VERDICT-03**: appdev-cli `crossValidate()` catches score-vs-findings inconsistencies (Critical bug + high Functionality = flag; Core feature Missing + high Product Depth = flag)
- [ ] **VERDICT-04**: appdev-cli `detectAnomalies()` flags suspicious patterns (all scores identical, all at exact threshold, implausible improvement >8 points)
- [ ] **VERDICT-05**: EVALUATION-TEMPLATE.md updated -- Findings Summary table replaces Verdict heading, Status column removed from Scores table
- [ ] **VERDICT-06**: Evaluator self-verification updated -- checks 8/9 (verdict-dependent) removed, new check for Findings Summary internal consistency

### Convergence Logic (CONV)

- [ ] **CONV-01**: Minimum 2 rounds before PASS can fire -- round 1 is the warm-up epoch
- [ ] **CONV-02**: REGRESSION/CATASTROPHIC exit conditions checked before PASS in `determineExit()`
- [ ] **CONV-03**: Score anomaly detection -- z-score of latest delta against trajectory mean, flag if |z| > 2.0 (requires >= 3 rounds)
- [ ] **CONV-04**: Threshold anchoring detection -- stdDev of 4 dimension scores < 0.5 triggers warning
- [ ] **CONV-05**: Rising threshold infrastructure in appdev-cli (round-indexed threshold lookup) but thresholds kept flat until empirical data from 3+ test runs

### Acceptance Test Plan (ATP)

- [ ] **ATP-01**: SPEC-TEMPLATE.md includes `## Acceptance Test Plan` section with abstract flow scenarios (no CSS selectors, no routes, no component names)
- [ ] **ATP-02**: Each Core feature has >= 3 acceptance scenarios (happy path, edge case, error state); Important >= 2; Nice-to-have >= 1
- [ ] **ATP-03**: Cross-feature journey scenarios test features in sequence (e.g., AI Guide -> navigate -> AI Insights -> return to Guide)
- [ ] **ATP-04**: Evaluator translates acceptance scenarios to concrete playwright-cli actions and reports PASS/FAIL per scenario with screenshot evidence
- [ ] **ATP-05**: CLI uses acceptance scenario pass rate as additional verdict input (< 80% pass rate = FAIL regardless of scores; failed Core scenarios cap related dimension)

### Planner Improvements (PLAN)

- [ ] **PLAN-01**: SPEC-TEMPLATE.md includes `## Technical Constraints` section with Required Skills (Planner reads skills directory) and Stack Guidance
- [ ] **PLAN-02**: SPEC-TEMPLATE.md includes `## Asset Strategy` section with sourcing rules, blocked sources, and collection size minimums
- [ ] **PLAN-03**: Measurability rule -- every quality claim must pass "Can the Evaluator verify this with playwright-cli?" test; unmeasurable goals go to `### Aspirational` subsection
- [ ] **PLAN-04**: Planner self-verification checklist updated for acceptance criteria, collection sizes, tech constraints

### Generator Improvements (GEN)

- [ ] **GEN-01**: Generator instructions strengthened to use Vite+ skill for all greenfield web projects (not just "prefer")
- [ ] **GEN-02**: Generator instructions require latest stable major versions for all dependencies
- [ ] **GEN-03**: Generator instructions require browser-agnostic LanguageModel API usage -- feature detection (`typeof LanguageModel`), no browser-specific strings in user-facing messages
- [ ] **GEN-04**: Generator must commit all generated files (no orphaned scripts)
- [ ] **GEN-05**: Playwright e2e tests use accessibility-tree-first selectors (`.getByRole()`, `.getByLabel()`, `.getByText()`) -- `.locator()` with CSS selectors only as fallback

### Evaluator Improvements (EVAL)

- [ ] **EVAL-01**: Cross-feature interaction testing phase added -- Evaluator tests Core features in combination, not just isolation; findings route to Functionality and Visual Coherence scores
- [ ] **EVAL-02**: Edge-first browser for AI-feature applications -- Evaluator uses `--browser=msedge` when SPEC.md indicates browser AI features
- [ ] **EVAL-03**: browser-prompt-api skill updated to document Edge as officially supported with Phi-4-mini, hardware requirements, and setup steps

### Orchestrator Improvements (ORCH)

- [ ] **ORCH-01**: Session resume detects already-completed steps (checks git tags, evaluation reports, appdev-cli state) before spawning agents
- [ ] **ORCH-02**: Orchestrator logs anomaly warnings and cross-validation issues from CLI output

### Architecture Documentation (DOCS)

- [ ] **DOCS-01**: `docs/ARCHITECTURE.md` at repo root documents all architectural decisions grounded in Anthropic article, GAN, Cybernetics, and Turing test principles -- covering both v1.0 (retroactive) and v1.1 decisions

## v1.2+ Requirements (Deferred)

Tracked but not in current roadmap. Require empirical data from 3+ test runs.

### Convergence Tuning

- **CONV-06**: Rising thresholds activated with empirical calibration (round 2: base, round 3: base+1, round 4+: base+2 capped)
- **CONV-07**: Anomaly-triggered re-evaluation round (second opinion with different prompt)

### Scoring Refinement

- **SCORE-06**: Commit hygiene as observable Robustness signal (commit count, message quality, feature-per-commit discipline)
- **SCORE-07**: Empirically calibrated scoring scenarios for Robustness and Visual Coherence (from 3+ test run data)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Separate cross-validation gate (new exit condition) | Combinatorial explosion: N features -> N*(N-1)/2 pairs; complex apps would never pass |
| Evaluator-computed verdict with "advisory" flag | Defeats purpose; agreeableness bias persists if Evaluator believes its verdict matters |
| Full test suite execution by Evaluator | Couples Evaluator to Generator implementation details; test pass/fail is a boolean Robustness signal only |
| Source code inspection as "non-scoring advisory" | Violates GAN information barrier; Evaluator cannot unsee what it reads |
| Raising all thresholds to 8/10 | Scores were anchored, not calibrated; fix scoring pipeline first, raise thresholds with data |
| Per-feature auto-generated Playwright scripts from acceptance criteria | Brittle DOM coupling; acceptance plan is a test oracle, not a test script |
| Second independent Evaluator agent | Doubles cost/complexity; deferred to v2 |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated by roadmapper) | | |

**Coverage:**
- v1.1 requirements: 30 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 30

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
