# Feature Research: v1.1 Hardening

**Domain:** GAN-inspired multi-agent autonomous application development harness (Claude Code plugin) -- v1.1 hardening features
**Researched:** 2026-03-29
**Confidence:** HIGH (Anthropic article, academic papers, ATDD tooling, LLM-as-judge research)

This document covers ONLY the v1.1 hardening features. The v1.0 feature landscape
(working application output, score-based exit, adversarial evaluation, git workflow,
real assets, functional AI, orchestrator integrity, QA versioning, self-testing,
committed SPEC.md) is validated and not re-researched. See the v1.0 FEATURES.md
in the milestone archive for the complete landscape.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that the v1.0 Dutch art museum test proved are missing. Without these, the
GAN architecture fails to deliver on its core promise of adversarial quality assurance.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| CLI-decided verdict (harness-computed) | The Anthropic evals article explicitly recommends "grade each dimension with an isolated LLM-as-judge" and computing verdicts externally. The Dutch art museum test proved the failure mode: the Evaluator anchored all scores to 7/10 (the PASS threshold) and issued PASS after only 2 rounds. When the evaluator both scores AND decides, it can game the verdict by anchoring to thresholds. This is the LLM-as-judge "agreeableness bias" (TPR >96%, TNR <25%) documented in the CALM framework. Moving verdict computation to the CLI eliminates self-serving bias because the CLI is mechanical, not generative. Every serious evaluation harness separates grading (agent) from gating (harness). | MEDIUM | Depends on: scoring dimension rename (regex contract). Existing v1.0: `round-complete` subcommand, `extractScores()`, `determineExit()` |
| Scoring dimension restructuring (Robustness replacing Code Quality, Visual Coherence expanding Visual Design) | The v1.0 "Code Quality" dimension required source code inspection, which violates the GAN information barrier (the discriminator only sees the output, never the generator's internals). Anthropic's own article uses dimensions assessable through the running application: design quality, originality, craft, functionality. The RULERS framework (arXiv:2601.08654) shows that "locked rubrics" with evidence-anchored scoring outperform loose rubric evaluation. "Visual Coherence" expands scope to cross-page consistency and responsive identity -- addressing the Dutch art museum test where pages had inconsistent styling. "Robustness" reframes code quality as behaviorally observable: build health, error handling under stress, console errors, dependency freshness. | HIGH | Foundation change: regex contract in appdev-cli.mjs, EVALUATION-TEMPLATE.md, SCORING-CALIBRATION.md, evaluator.md rubric. Must be done FIRST. |
| GAN information barrier enforcement | In real GANs, the discriminator only sees the generator's output, never its internal weights. The Dutch art museum test revealed the Evaluator reading source code -- a GAN violation that enables lenient scoring (the Evaluator rationalizes "the code looks reasonable" instead of testing whether the app works). Anthropic's article confirms the evaluator "runs Playwright to interact with the live application" -- behavioral observation, not code inspection. | MEDIUM | Related to: Robustness dimension (must be scorable without source code). Existing v1.0: evaluator.md Step 10 (code review) |
| Minimum rounds before PASS | The Dutch art museum test PASS'd at round 2 with 28/40. The first evaluation round is uncalibrated -- the Evaluator has no baseline for comparison. GAN training literature confirms: "the discriminator trains for one or more epochs" before the generator can benefit from feedback. The ATDD approach requires at minimum: red phase (tests fail) then green phase (tests pass). A single generate-evaluate is insufficient to establish quality trajectory. Anthropic ran 5-15 iterations per generation. No serious iterative system accepts the first passing result. | LOW | Existing v1.0: `determineExit()` in appdev-cli.mjs. Simple guard: `if (round < minRounds) return { should_continue: true }` |
| Acceptance test plan in SPEC.md | The SDD/ATDD movement (Spec-Driven Development, Acceptance Test-Driven Development) has converged on specs-as-source-of-truth for AI-generated code. The ATDD Claude Code plugin (swingerman/atdd) demonstrates Given/When/Then acceptance criteria that constrain AI generation. Anthropic's article describes "sprint contracts" -- the generator and evaluator negotiate what "done" looks like before code is written. Without structured acceptance criteria, the Evaluator invents its test strategy ad hoc each round, leading to inconsistent testing and missed features. The Planner already understands the product domain; acceptance criteria should come from the Planner, not be improvised by the Evaluator. | MEDIUM | Independent leaf change. Existing v1.0: SPEC-TEMPLATE.md sections, planner.md, evaluator.md Steps 1 and 6 |

### Differentiators (Competitive Advantage)

Features that go beyond what comparable systems do. These create unique value in
the GAN-inspired architecture.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Cross-feature interaction testing | No competing harness tests features in combination. The Dutch art museum test missed session overwrite and URL desync bugs because features were tested in isolation. The academic cross-verification protocol (CVCP, 2025) shows multi-agent systems benefit from "adversarial testing" across feature boundaries. The Evaluator should test Core features in combination, not just individually. However, this must be a SCORING INPUT (feeding into Functionality and Visual Coherence), not a separate gate -- the PITFALLS.md documents the combinatorial explosion risk of making it a hard gate. | MEDIUM | Existing v1.0: evaluator.md Step 6 (Test Features). Additive change, not conflicting with other evaluator modifications. |
| Score anomaly detection (z-score trajectory analysis) | No competing harness detects suspicious score patterns like jumps from 3 to 9 (likely hallucinated evaluation) or mode collapse where all dimensions get identical scores (the 7/7/7/7 Dutch art museum pattern). The LLM-as-judge literature documents "central tendency bias" where LLMs cluster scores around the middle of the scale. The RULERS framework calls this "scale misalignment." Detecting these patterns in the CLI provides a check on the Evaluator's reliability that the Evaluator cannot self-apply. | LOW | Existing v1.0: appdev-cli.mjs `cmdRoundComplete()`, score trajectory tracking. Requires >= 3 rounds of data for meaningful z-scores. |
| Rising thresholds (round-indexed threshold escalation) | GAN training uses "curriculum learning" -- starting with easier tasks and gradually increasing difficulty. Applied to the evaluation loop: early rounds have lower thresholds (establishing baseline), later rounds have higher thresholds (requiring genuine improvement). This prevents the "PASS at round 2 with mediocre scores" failure without permanently setting thresholds so high they become impossible. No competing harness implements this -- most use fixed thresholds or no thresholds at all. | MEDIUM | Depends on: CLI-decided verdict (thresholds are in the CLI, not the Evaluator). Existing v1.0: escalation levels E-0 through E-IV. Caution: PITFALLS.md warns about impossible convergence if thresholds are set too aggressively. |
| Commit hygiene as observable Robustness signal | With the GAN information barrier preventing source code inspection, git commit history becomes one of the few observable proxies for code organization. Commit count, commit message quality, feature-per-commit discipline, and merge conflict absence are all observable via `git log` without reading source code. No competing harness uses commit history as a quality signal. | LOW | Existing v1.0: Generator feature-by-feature commits. Independent of other changes. |
| Edge-first browser for AI-feature applications | Edge ships Phi-4-mini via the same LanguageModel API as Chrome (Gemini Nano). The Generator builds against a standard W3C API; the Evaluator tests against the browser that best supports on-device AI. No competing harness specifies browser selection based on AI feature requirements. The browser-prompt-api skill already abstracts the API; the change is in which browser the Evaluator launches. | LOW | Existing v1.0: browser-prompt-api skill, evaluator.md Step 4. Requires Edge installed on the machine. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem beneficial for v1.1 but would create problems based on research
findings.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Separate cross-validation gate (new exit condition for cross-feature bugs) | Cross-feature bugs are real and were missed in the Dutch art museum test. A separate gate seems like a strong quality signal. | Combinatorial explosion: N features produce N*(N-1)/2 interaction pairs. Even 5% minor issue rate per pair means 97% chance of at least one issue in a 12-feature app. Cross-validation as a hard gate effectively guarantees complex apps never pass. The PITFALLS.md documents this mathematically. | Route cross-feature findings into existing scoring dimensions (Functionality for bugs, Visual Coherence for layout conflicts). The Evaluator prioritizes Core feature interactions. |
| Evaluator-computed verdict with "advisory" flag | Keeps the current architecture (Evaluator writes verdict) but adds an advisory flag so the CLI can override. Seems like a gentler migration path. | Defeats the purpose. LLM-as-judge research shows "agreeableness bias" -- the Evaluator will still anchor scores to thresholds if it believes its verdict matters. An "advisory" verdict that gets overridden creates confusion about who is in charge. The Anthropic evals article is unambiguous: separate grading from gating. | CLI-decided verdict. The Evaluator writes scores only. The CLI computes PASS/FAIL mechanically from scores vs thresholds. Clean separation of concerns. |
| Full test suite execution by the Evaluator (running Generator's tests) | The Evaluator could run `npm test` to verify the Generator's test suite passes. Seems like an easy Robustness signal. | The Evaluator running the Generator's tests creates a coupling between Evaluator and Generator implementation details. If the Generator writes poorly scoped tests, the Evaluator is forced to debug test infrastructure rather than evaluate the application. Also, the Evaluator executing tests it did not write cannot assess test quality -- it only learns whether they pass. | The Evaluator observes test results as a Robustness signal (did `npm test` exit 0?) but does not debug or modify tests. Test coverage as a boolean (exists/passes vs does not exist/fails), not a qualitative assessment. |
| Source code inspection as a "non-scoring advisory" | The GAN information barrier removes source code access, but the Evaluator could still read code for "advisory notes" that do not affect scores. Seems like a way to preserve useful detection capability. | Violates the GAN principle. If the Evaluator reads source code for any purpose, its scoring is contaminated -- it cannot unsee what it read. The PITFALLS.md documents "information barrier leaks" where advisory code review influences behavioral assessment. Real GANs enforce complete output-only discrimination. | Strengthen behavioral probes to compensate: latency analysis for canned AI detection, console error monitoring, network error observation, crash/freeze testing under stress. Accept that some code quality signals are lost -- this is the intended trade-off of the GAN architecture. |
| Raising all thresholds to 8/10 | Higher thresholds should produce better applications. The Dutch art museum got 7s across the board and it was not high quality. | The Dutch art museum scores were anchored, not calibrated. The problem was score reliability, not threshold levels. Raising thresholds without empirical data on what scores the Generator actually achieves creates impossible convergence (PITFALLS.md Pitfall 3). If round-3 Functionality averages 7.2 with stdDev 1.1, an 8 threshold means ~50% of runs never converge. | Fix the scoring pipeline first (CLI verdict, dimension restructuring, anomaly detection). Collect empirical score distributions from 3+ test runs. THEN raise thresholds if data supports it. |
| Per-feature acceptance test execution by Evaluator (automated Playwright tests from acceptance criteria) | The acceptance test plan could generate executable Playwright test scripts that run automatically. Full automation sounds ideal. | The acceptance test plan should be a test oracle (what to verify), not a test script (how to verify). Auto-generating Playwright scripts from acceptance criteria is brittle -- the scripts depend on specific DOM structures that the Generator chooses at build time. If the button is a `<div role="button">` instead of a `<button>`, the auto-generated script fails with a selector error, not a real bug. The ATDD plugin uses native test frameworks, not generated scripts. | The Evaluator reads acceptance criteria as behavioral goals and manually translates them to playwright-cli interactions at evaluation time. This is what the Evaluator already does (Steps 5-8) -- the acceptance test plan just makes the goals explicit. |

## Feature Dependencies

```
[Scoring Dimension Restructuring] (foundation)
    |
    +--requires--> [CLI-Decided Verdict] (depends on dimension names for regex)
    |                  |
    |                  +--requires--> [Rising Thresholds] (thresholds are in the CLI)
    |                  |
    |                  +--enables--> [Score Anomaly Detection] (CLI computes trajectory)
    |
    +--requires--> [GAN Information Barrier] (Robustness must be scorable without code)
    |
    +--requires--> [Evaluator Scoring Rubric Update] (rubric descriptors use new dims)

[Acceptance Test Plan] (independent leaf)
    |-- Touches evaluator.md Steps 1, 6 (different sections than scoring changes)
    |-- Does NOT require scoring changes

[Cross-Feature Interaction Testing] (independent leaf)
    |-- Touches evaluator.md Step 6 (additive, not conflicting)
    |-- Findings route to Functionality and Visual Coherence scores

[Minimum Rounds Before PASS] (independent)
    |-- Touches appdev-cli.mjs determineExit() (small guard)
    |-- Should be implemented WITH CLI-decided verdict for clean integration

[Generator Improvements] (independent track)
    |-- Vite+ adoption nudge
    |-- Dependency freshness
    |-- Browser-agnostic LanguageModel API
    |-- Test style improvements
    |-- Touches generator.md only

[Session Resume Recovery] (independent)
    |-- Touches SKILL.md Step 0 only
    |-- Lowest dependency, lowest priority

[Edge-First Browser] (independent)
    |-- Touches evaluator.md Step 4 (tiny change)
    |-- Touches browser-prompt-api skill (documentation update)
```

### Dependency Notes

- **Scoring Dimensions requires CLI-Decided Verdict:** The dimension names
  appear in the regex parse contract. Verdict computation moves to the CLI
  and references these names. Both must be coordinated atomically.
- **Scoring Dimensions requires GAN Information Barrier:** The new "Robustness"
  dimension must be assessable without reading source code. The barrier must be
  enforced simultaneously with the dimension change.
- **CLI-Decided Verdict enables Score Anomaly Detection:** Once the CLI owns
  verdict computation, it naturally owns anomaly detection too -- the CLI already
  tracks score trajectories.
- **CLI-Decided Verdict enables Rising Thresholds:** Threshold escalation logic
  belongs in the CLI (deterministic, mechanical) not in the Evaluator (generative,
  biased).
- **Acceptance Test Plan is independent:** It feeds into existing evaluator data
  flows but does not restructure them.
- **Cross-Feature Testing conflicts with Separate Gate:** These must NOT be
  combined. Cross-feature findings feed into existing dimensions.

## v1.1 Scope Definition

### Must Have (v1.1 -- hardening release)

- [x] **CLI-decided verdict** -- Core fix for the Dutch art museum anchoring
  problem. Without this, every subsequent improvement is undermined by
  unreliable verdict computation. The LLM-as-judge literature is unanimous:
  separate grading from gating.
- [x] **Scoring dimension restructuring** -- Foundation for all scoring changes.
  Robustness replaces Code Quality (enabling GAN barrier). Visual Coherence
  expands Visual Design (addressing cross-page consistency). Must be done first.
- [x] **GAN information barrier** -- Architectural principle enforcement. Without
  this, the Evaluator reading source code makes it a code reviewer, not an
  adversarial tester. Coupled with Robustness dimension redesign.
- [x] **Minimum rounds before PASS** -- Prevents premature convergence. Low
  complexity (single guard in `determineExit()`). Addresses the "PASS at round 2"
  failure.
- [x] **Acceptance test plan in SPEC.md** -- Structures the Evaluator's test oracle.
  The SDD/ATDD movement confirms: specs should generate both implementation and
  tests. Independent leaf change, low risk.

### Should Have (v1.1 -- adds meaningful quality)

- [ ] **Cross-feature interaction testing** -- Addresses real bugs missed in the
  Dutch art museum test. Additive change to evaluator.md Step 6. Must be
  integrated as a scoring input, not a separate gate.
- [ ] **Score anomaly detection** -- Catches mode collapse (all 7s) and
  hallucinated evaluations (score jumps). Low complexity, high value for
  convergence reliability. Requires >= 3 rounds of data.
- [ ] **Session resume recovery** -- UX polish. Orchestrator crash recovery
  prevents lost work. Independent change to SKILL.md Step 0.
- [ ] **Generator improvements** -- Vite+ adoption nudge, dependency freshness,
  browser-agnostic LanguageModel API, test style. Independent track.
- [ ] **Edge-first browser** -- Small Evaluator configuration change. Requires
  Edge installed; not universally available.

### Defer to v1.2+ (needs empirical data first)

- [ ] **Rising thresholds** -- Conceptually sound (curriculum learning) but requires
  empirical score distributions from 3+ test runs to calibrate. Setting
  thresholds without data risks impossible convergence (PITFALLS.md Pitfall 3).
  Implement the infrastructure in v1.1 (round-indexed threshold lookup table)
  but keep thresholds flat until data is collected.
- [ ] **Commit hygiene scoring** -- Novel differentiator but untested. Needs
  calibration scenarios and empirical validation before integrating into
  Robustness scoring. Could be an advisory (non-scoring) appendix in v1.1.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk | Priority |
|---------|------------|---------------------|------|----------|
| CLI-decided verdict | HIGH | MEDIUM | MEDIUM (data flow change) | P1 |
| Scoring dimension restructuring | HIGH | HIGH | HIGH (regex contract) | P1 |
| GAN information barrier | HIGH | MEDIUM | MEDIUM (Evaluator capability loss) | P1 |
| Minimum rounds before PASS | HIGH | LOW | LOW (simple guard) | P1 |
| Acceptance test plan | MEDIUM | MEDIUM | LOW (leaf change) | P1 |
| Cross-feature interaction testing | MEDIUM | MEDIUM | MEDIUM (combinatorial risk) | P2 |
| Score anomaly detection | MEDIUM | LOW | LOW (additive) | P2 |
| Session resume recovery | MEDIUM | MEDIUM | LOW (independent) | P2 |
| Generator improvements | MEDIUM | MEDIUM | LOW (independent) | P2 |
| Edge-first browser | LOW | LOW | LOW (independent) | P2 |
| Rising thresholds | MEDIUM | MEDIUM | HIGH (needs empirical data) | P3 |
| Commit hygiene scoring | LOW | LOW | MEDIUM (untested concept) | P3 |

**Priority key:**
- P1: Must have for v1.1 -- fixes Dutch art museum test failures
- P2: Should have for v1.1 -- meaningful quality improvements
- P3: Defer to v1.2+ -- needs empirical validation before implementing

## Competitor Feature Analysis

| Feature | Anthropic Article Harness | ATDD Plugin (swingerman) | Citadel | Our Approach (v1.1) |
|---------|---------------------------|--------------------------|---------|---------------------|
| Verdict authority | Evaluator agent decides | Native test runner decides (deterministic) | No convergence loop (single-pass with circuit breaker) | CLI decides (harness-computed, mechanical) |
| Scoring dimensions | 4: design quality, originality, craft, functionality | Binary pass/fail per acceptance test | No scoring (task-oriented) | 4: Product Depth, Functionality, Visual Coherence, Robustness |
| Acceptance criteria | "Sprint contracts" negotiated before each sprint | Given/When/Then specs derived from requirements; two-stream (acceptance + unit) | Not applicable | Planner-authored acceptance test plan per feature in SPEC.md; Evaluator uses as structured test oracle |
| Convergence detection | Heuristic (5-15 iterations, no formal stopping) | Deterministic (all tests pass = done) | Circuit breaker on tool failure (3 failures = try different approach) | Score-based exit with 4 conditions (PASS/PLATEAU/REGRESSION/SAFETY_CAP) + minimum rounds + anomaly detection |
| Information barrier | Evaluator uses Playwright (behavioral), not code inspection | Spec Guardian audits for implementation leakage in specs, not in code | Not applicable (single-pass) | Evaluator has no source code access (GAN principle); Robustness scored via behavioral observation |
| Cross-feature testing | Not documented | Acceptance tests can span features | Not documented | Evaluator tests Core feature interactions; findings feed into Functionality and Visual Coherence scores |
| Score calibration | Few-shot examples with detailed breakdowns | Not applicable (binary) | Not applicable | SCORING-CALIBRATION.md with ceiling rules, grade range descriptors, 12 calibration scenarios per dimension |
| Bias prevention | Iterative prompt tuning ("several rounds of development loop") | Spec Guardian agent audits for bias | Not applicable | Isolated dimension scoring, CLI-computed verdict (eliminates self-serving bias), z-score anomaly detection |

### Key Insight from Competitor Analysis

The field is split between two approaches:

1. **Deterministic verification** (ATDD, BDD): Specs generate executable tests.
   PASS/FAIL is binary and computed by the test runner. No scoring dimensions,
   no LLM judgment. Works well for well-specified behavior but cannot assess
   subjective qualities (design coherence, product depth, user experience).

2. **LLM-as-judge with rubric** (Anthropic, our approach): The evaluator scores
   against dimensions using a calibrated rubric. More expressive (can assess
   "does this feel like a real product?") but vulnerable to LLM biases
   (agreeableness, anchoring, halo effect).

Our v1.1 approach takes the best of both:
- **Structured acceptance criteria** from the spec (ATDD influence) give the
  Evaluator a deterministic minimum bar
- **Dimension-based scoring** with calibrated rubrics (Anthropic influence) assess
  subjective product quality
- **CLI-decided verdict** (harness engineering best practice) separates grading
  from gating, eliminating self-serving bias
- **Anomaly detection** (novel) provides a reliability check on the LLM judge
  that neither approach offers

## Sources

### Anthropic (HIGH confidence)
- [Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps) -- Evaluator scoring dimensions (design quality, originality, craft, functionality), few-shot calibration, sprint contracts, 5-15 iterations, Playwright-based behavioral testing
- [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) -- "Grade each dimension with an isolated LLM-as-judge," calibrate against human experts, structured rubrics, give the LLM a way out with "Unknown"

### Academic Papers (HIGH confidence)
- [RULERS: Locked Rubrics and Evidence-Anchored Scoring (arXiv:2601.08654)](https://arxiv.org/abs/2601.08654) -- Rubric instability, unverifiable reasoning, and scale misalignment as LLM-judge failure modes. Executable rubrics with deterministic evidence verification outperform loose rubrics
- [Evaluating Scoring Bias in LLM-as-a-Judge (arXiv:2506.22316)](https://arxiv.org/abs/2506.22316) -- Rubric order bias, score ID bias, reference answer score bias. Even GPT-4o shows 0.2 correlation fluctuation with perturbations on smaller models
- [Justice or Prejudice? CALM Bias Framework (ICLR 2025)](https://openreview.net/forum?id=3GTtZFiajM) -- 12-bias quantification framework for LLM-as-judge. Agreeableness bias: TPR >96%, TNR <25%
- [Rubric Is All You Need (ACM ICER 2025)](https://dl.acm.org/doi/10.1145/3702652.3744220) -- Question-specific rubrics outperform question-agnostic rubrics. Pointwise rubric evaluation provides granular feedback
- [Autorubric (arXiv:2603.00077)](https://arxiv.org/html/2603.00077v1) -- "Reduced conflation: independent scoring of criteria prevents halo effects where strength in one dimension inflates scores in others"

### ATDD/SDD (MEDIUM confidence)
- [ATDD Plugin for Claude Code (swingerman/atdd)](https://github.com/swingerman/atdd) -- Given/When/Then acceptance criteria, two-stream testing (acceptance + unit), Spec Guardian for implementation leakage detection, Red-Green-Refactor workflow
- [Spec-Driven Development (Thoughtworks, 2025)](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices) -- "Specs become the source of truth" for AI-generated code
- [ATDD-Driven AI Development (Paul Duvall)](https://www.paulmduvall.com/atdd-driven-ai-development-how-prompting-and-tests-steer-the-code/) -- "Without acceptance tests anchoring behavior, AI can write unit tests that pass but don't verify the right behavior"
- [Spec-Driven Development: From Code to Contract (arXiv:2602.00180)](https://arxiv.org/abs/2602.00180) -- Three levels of specification rigor: spec-first, spec-anchored, spec-as-source

### Harness Engineering (MEDIUM confidence)
- [Harness Engineering Academy](https://harnessengineering.academy/blog/what-is-harness-engineering-introduction-2026/) -- Circuit breakers from distributed systems, evaluation pipelines from MLOps
- [LangChain: Improving Deep Agents](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/) -- LoopDetectionMiddleware for doom loops; per-file edit count tracking
- [Braintrust: Agent Evaluation Framework](https://www.braintrust.dev/articles/ai-agent-evaluation-framework) -- Binary, weighted, or hybrid scoring; regression gates
- [GoDaddy: Calibrating Scores of LLM-as-a-Judge](https://www.godaddy.com/resources/news/calibrating-scores-of-llm-as-a-judge) -- "Rubrics as Rewards" replacing opaque preference signals with structured rubrics

### GAN Training (MEDIUM confidence)
- [Google: GAN Training](https://developers.google.com/machine-learning/gan/training) -- Discriminator trains multiple epochs before generator; convergence is "fleeting rather than stable"; Two Time-Scale Update Rule (TTUR) for stability
- [GAN Convergence Challenges (Springer, 2025)](https://link.springer.com/article/10.1007/s42044-025-00369-y) -- Mode collapse and non-convergence from generator/discriminator imbalance. Curriculum learning: start easy, increase difficulty progressively

---
*Feature research for: application-dev plugin v1.1 hardening*
*Researched: 2026-03-29*
