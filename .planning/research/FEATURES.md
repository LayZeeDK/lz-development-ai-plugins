# Feature Research: v1.2 Dutch Art Museum Test Fixes

**Domain:** GAN-inspired multi-agent autonomous application development harness (Claude Code plugin) -- v1.2 new features
**Researched:** 2026-04-02
**Confidence:** MEDIUM (cross-domain synthesis from GAN training literature, W3C specs, Playwright ecosystem, Vite+ alpha docs; no single authoritative source for the perturbation-critic concept)

This document covers ONLY the v1.2 new features. The v1.0 and v1.1 feature
landscapes (orchestrator integrity, score-based exit, ensemble critics,
CLI-decided verdict, GAN information barrier, acceptance criteria, write-and-run
patterns, crash recovery) are validated and not re-researched. See the v1.1
FEATURES.md in this directory for the prior landscape.

---

## Feature Areas (Organized by v1.2 Target)

Six feature areas map to the v1.2 milestone targets:

1. **Perturbation-critic** -- new Robustness dimension (adversarial testing)
2. **Convergence logic hardening** -- CLI scoring algorithm improvements
3. **Enhanced perceptual-critic** -- Visual Coherence cross-page consistency
4. **Enhanced projection-critic** -- deeper Functionality (A->B->A navigation)
5. **Generator improvements** -- Vite+ adoption, dependency freshness, browser-agnostic AI
6. **Architecture documentation** -- GAN/Cybernetics/Turing test grounding

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that address concrete failures observed in the Dutch art museum test
run. Without these, the v1.1 ensemble architecture has blind spots that
undermine quality assurance.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **Perturbation-critic: error boundary testing** | The Dutch art museum test revealed no testing of error states -- what happens when forms receive invalid input, when network requests fail, when the user navigates unexpectedly. Every serious QA process includes negative testing. The Anthropic article's evaluator "runs Playwright to interact with the live application" -- this includes adversarial interaction, not just happy-path verification. Without robustness testing, the PASS verdict certifies only that the happy path works, not that the application is resilient. | HIGH | New agent definition (perturbation-critic.md). New summary.json schema with `dimension: "Robustness"`. CLI compile-evaluation must handle 3 critic summaries instead of 2. DIMENSIONS constant must add Robustness. State file must track 3 critics. Orchestrator must spawn 3 critics in parallel. |
| **Perturbation-critic: console error monitoring under stress** | The v1.1 critics check console errors in steady state. Perturbation testing should capture console errors that appear only under stress: rapid clicking, form spam, navigation during async operations. These are the errors real users trigger. The adversarial LLM UI testing approach (SitePoint, 2025) found real production bugs by "clicking Back during in-flight async validation" -- bugs that conventional tests with polite waits never discovered. | MEDIUM | Part of perturbation-critic agent. Uses existing `npx playwright-cli console error` infrastructure. Requires sequencing: perform adversarial action, then capture console state. |
| **Perturbation-critic: edge-case input generation** | Fuzz testing literature confirms that mutation-based input generation (valid inputs with modifications -- empty strings, Unicode, extremely long strings, SQL/XSS payloads, boundary values) catches bugs that happy-path tests miss. The projection-critic already tests "one negative test per feature" but this is deterministic, not adversarial. A dedicated perturbation-critic can generate inputs dynamically based on each form's context, following the "Goodhart's Law protection" principle already used for AI probing in the projection-critic. | MEDIUM | Part of perturbation-critic agent. Independent of projection-critic (different dimension, different methodology). Requires SPEC.md reading for form/input identification. |
| **Convergence: EMA-smoothed score trajectory** | The current convergence logic uses raw total scores and fixed-window deltas (3-round window for plateau, 2 consecutive declines for regression). Raw scores are noisy -- a single critic having a bad round can trigger false REGRESSION. EMA smoothing is the standard technique for noisy time-series convergence detection, used in GAN training (weight averaging), financial scoring, and statistical process control. The EWMA procedure is specifically designed for change/plateau detection in longitudinal data. Smoothing reduces false exits while still detecting genuine trends. | MEDIUM | Modifies `computeEscalation()` in appdev-cli.mjs. Backward-compatible: EMA with alpha=1.0 degenerates to raw scores. Must be tested against existing test suite (57 tests). |
| **Convergence: per-dimension trajectory analysis** | The current system sums all dimensions into a total score for trajectory analysis. This masks dimension-specific plateaus: if Functionality plateaus at 6 while Visual Design improves from 5 to 8, the total rises but Functionality never converges. Per-dimension tracking detects when individual dimensions are stuck, enabling targeted escalation messages ("Functionality plateaued -- focus on feature completeness"). GAN training literature calls this "per-loss convergence" -- tracking generator loss and discriminator loss independently rather than only the combined objective. | MEDIUM | Modifies `computeEscalation()` and `determineExit()` in appdev-cli.mjs. The escalation response JSON needs a `dimension_details` field. Backward-compatible: existing total-based logic is the fallback. |
| **Enhanced perceptual-critic: cross-page color/typography audit** | The v1.1 perceptual-critic evaluates pages individually. The Dutch art museum test revealed pages with inconsistent styling -- different background colors, font sizes, or spacing between the landing page and inner pages. Design system literature (UXPin, Supercharge) confirms that cross-page consistency is the foundation of perceived quality: "when typography switches styles across channels, every inconsistency chips away at customer trust." Chromatic's visual testing approach catches these regressions automatically. The perceptual-critic should extract design tokens (colors, fonts, spacing) from each page and compare them for consistency. | MEDIUM | Extends perceptual-critic.md methodology. Requires multi-page screenshot comparison workflow. Uses existing eval-first pattern to extract computed styles across pages. New findings category: "Visual Consistency" (VC-*) feeding into Visual Design score. |
| **Enhanced projection-critic: A->B->A navigation testing** | The v1.1 projection-critic tests navigation exists (links work) but not navigation state persistence. The Dutch art museum test should verify: navigate to artwork detail, click back, does the gallery state (scroll position, filter selection, active page) persist? Playwright supports `page.goBack()` and state assertions natively. The SitePoint adversarial testing article found real bugs with "clicking Back during in-flight async validation and then immediately clicking Next." This is table stakes for SPAs where client-side routing must manage browser history correctly. | MEDIUM | Extends projection-critic.md acceptance test generation. Adds A->B->A test patterns to the write-and-run template. Uses existing `npx playwright test` infrastructure. New test category in acceptance_tests results. |
| **Generator: browser-agnostic LanguageModel API** | The v1.1 browser-prompt-api skill references Chrome-specific patterns (chrome://flags, Gemini Nano). Microsoft Edge 139+ ships the same `LanguageModel` API with Phi-4-mini -- same interface, different model. The W3C Web Machine Learning group is standardizing the API. Generated applications should use `LanguageModel` (the W3C standard interface) without Chrome-specific assumptions. Feature detection (`typeof LanguageModel !== 'undefined'`) works identically in both browsers. The skill already uses the standard API shape; the fix is removing Chrome-specific documentation and adding Edge support notes. | LOW | Updates browser-prompt-api skill documentation. May update generator.md AI feature section to reference both browsers. Does not change the API surface -- `LanguageModel` is already the standard. |

### Differentiators (Competitive Advantage)

Features that go beyond comparable systems. These create unique value in the
GAN-inspired architecture and address issues no competing harness handles.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| **Perturbation-critic: LLM-driven adversarial interaction** | The cutting edge in UI testing (2025-2026) is using LLMs to generate adversarial interaction sequences -- not just input fuzzing, but behavioral adversarial sequences like "double-click submit during async validation," "navigate away mid-form-submission," "resize viewport while animation plays." The SitePoint article documented an adversarial loop: extract UI state -> send to LLM with adversarial prompt -> execute hostile action via Playwright -> detect anomalies -> codify as regression tests. No competing application-generation harness implements this. The perturbation-critic IS an LLM -- it can generate these sequences natively without external tooling. | HIGH | Part of perturbation-critic agent. Requires careful token budget management (~60K context). Must be structured as write-and-run to avoid context explosion (write adversarial test script to disk, run via Playwright, read results). |
| **Convergence: dimension-weighted scoring** | The current system treats all dimensions equally in the total score (simple sum). But Functionality failures matter more than Visual Design shortfalls for application usability. Weighted scoring (e.g., Functionality 1.5x, Product Depth 1.5x, Visual Design 1.0x, Robustness 1.0x) would align convergence detection with user priorities. GAN training literature uses loss weighting extensively -- the WGAN adaptive weighted discriminator (CVPR 2021) "consistently achieves faster convergence." | LOW | Modifies DIMENSIONS constant and total computation in appdev-cli.mjs. Weights configurable via constant, not user-facing. Must not change the 1-10 per-dimension scoring -- only the trajectory analysis weighting. |
| **Convergence: z-score anomaly detection on per-round scores** | Deferred from v1.1 (listed as "Should Have" but not shipped). No competing harness detects suspicious score patterns: jumps from 3 to 9 (likely hallucinated), mode collapse where all dimensions get identical scores (the 7/7/7 v1.0 pattern), or oscillation between rounds. The RULERS framework identifies "scale misalignment" as an LLM-judge failure mode. Z-score detection flags statistically improbable score changes, adding a reliability check on the critic ensemble that the critics cannot self-apply. | LOW | Existing infrastructure in appdev-cli.mjs. Requires >= 3 rounds for meaningful z-scores. Additive -- does not change exit conditions, only adds `anomaly_warnings` to the round-complete response. |
| **Enhanced perceptual-critic: design token extraction and diffing** | Beyond screenshot comparison, extracting actual computed CSS values (colors, font families, font sizes, spacing) from each page and diffing them produces quantifiable consistency metrics. "Page A uses font-size:16px for body, Page B uses 14px" is more actionable than "pages look different." This is the design-token-based consistency measurement approach used by enterprise brand compliance tools (Burberry achieved 89% consistency score across digital touchpoints). No competing application-generation harness does this. | MEDIUM | Extends perceptual-critic eval-first methodology. Uses `npx playwright-cli eval` to extract computed styles as structured JSON. Comparison logic runs in the critic, results feed into findings. |
| **Enhanced projection-critic: data persistence testing** | Beyond A->B->A navigation, testing that data created on Page A persists when viewed on Page B catches a common SPA bug: state that lives in component memory but is not properly shared or persisted. "Create an artwork entry, navigate to the gallery, verify it appears" tests the data flow, not just the navigation. The v1.1 projection-critic covers "Data persistence (create, navigate away, return)" in its acceptance test template, but the Dutch art museum test showed this was not being exercised deeply enough. Elevating it to a named test pattern with explicit coverage ensures it is not skipped. | LOW | Extends projection-critic.md acceptance test patterns. Uses existing write-and-run infrastructure. Documentation change more than code change. |
| **Generator: Vite+ adoption for compatible frameworks** | Vite+ (alpha, March 2026) consolidates Vite 8, Vitest 4.1, Oxlint 1.52, Oxfmt, tsgo, and Rolldown into a single `vp` CLI. For generated projects, this means: 3 CI commands instead of 5+, 50-100x faster linting, 30x faster formatting, single config file. The Generator already has a "Vite+ preference" note but the vite-plus skill needs updating to match the official `vp` CLI workflow: `vp create`, `vp check`, `vp test`, `vp build`. No competing harness generates projects with Vite+. | MEDIUM | Updates vite-plus skill SKILL.md. Updates generator.md Phase 1 setup and Phase 4 diagnostic. Must handle alpha instability gracefully -- fallback to plain Vite must remain viable. |
| **Generator: dependency freshness checking** | Generated projects should use latest stable versions of frameworks and libraries. The Generator currently states "use the latest stable versions" but has no verification mechanism. A dependency freshness check (e.g., `npm outdated` or checking registry versions) after initial setup ensures the generated project starts with current dependencies, not stale cached versions. | LOW | Adds a step to Generator Phase 1 or Phase 4. Uses `npm outdated` (no additional tooling). Could be integrated into appdev-cli as a `check-deps` subcommand for deterministic reporting. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem beneficial for v1.2 but would create problems based on
research findings and the existing architecture.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full browser fuzzing framework (random click/type everywhere)** | Comprehensive fuzzing would find more edge-case bugs. The fuzz testing literature shows high bug discovery rates. | Untargeted fuzzing generates enormous amounts of noise. A random-click fuzzer on a complex SPA would trigger hundreds of console errors, most of them irrelevant (e.g., clicking a disabled button, typing into a readonly field). The perturbation-critic has a ~60K token budget -- it cannot process unbounded fuzzing output. The write-and-run pattern requires targeted, interpretable test results. Adversarial testing must be guided by SPEC.md domain knowledge to be actionable. | **Targeted perturbation testing** guided by SPEC.md features. The perturbation-critic identifies forms, navigation elements, and interactive widgets from the spec, then generates targeted adversarial inputs for each. Bounded scope, interpretable results, fits within token budget. |
| **Per-dimension exit conditions (dimension-specific PLATEAU/REGRESSION)** | If Functionality plateaus but Visual Design is improving, should we exit? Per-dimension exits seem more precise. | Adds combinatorial complexity to exit logic. With 4 dimensions, there are 4^4 = 256 possible combinations of per-dimension exit states. The orchestrator's dispatch logic (already handling 5 exit conditions) would become unmanageable. The SAFETY_CAP already catches runs where individual dimensions stagnate while others improve -- the total score plateaus. Dimension-specific exit conditions are theoretically appealing but operationally nightmarish. | **Per-dimension trajectory reporting** (advisory, not gating). The round-complete response includes per-dimension trend information ("Functionality: plateau, Visual Design: improving") for the Generator's benefit. Exit conditions remain total-score-based. The Generator can prioritize stagnant dimensions without the exit logic becoming intractable. |
| **Rising thresholds (round-indexed threshold escalation)** | Deferred from v1.1 "Should Have." Curriculum learning suggests starting easy and increasing difficulty. | Still lacks empirical data. We deferred this from v1.1 specifically because "setting thresholds without data risks impossible convergence." We still have not collected score distributions from multiple test runs. Implementing rising thresholds now, before the perturbation-critic adds a new dimension, would require re-calibration immediately. Wait until v1.2 stabilizes the 4-dimension scoring, collect data from 3+ test runs, then calibrate thresholds empirically in v1.3. | Collect score distribution data during v1.2 test runs. Add optional `--collect-stats` flag to round-complete that writes score distributions to a stats file. This enables data-driven threshold calibration in v1.3 without premature threshold escalation now. |
| **Automated Playwright test generation from SPEC.md acceptance criteria** | The Planner writes acceptance criteria, the projection-critic manually translates them to tests. Why not auto-generate? | Same issue identified in v1.1 anti-features: auto-generated scripts depend on DOM structures the Generator chooses at build time. A `<div role="button">` vs `<button>` breaks the generated selector. The projection-critic's write-and-run pattern includes a snapshot step specifically to discover actual selectors before writing tests. Removing human-in-the-loop (the LLM reading the snapshot) makes tests brittle. Additionally, Playwright Agents (v1.56+, October 2025) already offer plan/generate/heal natively -- competing with Playwright's own agent system would be redundant. | Continue using the projection-critic's write-and-run pattern: read SPEC.md criteria as behavioral goals, take a snapshot for selector discovery, write tests against actual DOM structure, run and read results. The perturbation-critic adds adversarial variants of these tests, not duplicates. |
| **WebLLM/WebNN as LanguageModel fallback** | If LanguageModel API is unavailable, fall back to WebLLM or WebNN for AI features. Ensures AI features always work. | Different APIs with fundamentally different programming models. LanguageModel is session-based prompting; WebLLM is OpenAI-compatible chat API with explicit model loading; WebNN is a low-level operator graph API. A "fallback" that switches between these at runtime adds massive complexity to every AI feature in the generated application. The graceful degradation pattern in the browser-prompt-api skill already handles LanguageModel unavailability by disabling AI features -- this is the correct approach for on-device AI. | Keep the existing graceful degradation pattern: check `LanguageModel.availability()`, show appropriate UI states for "downloadable"/"downloading"/"unavailable", degrade to non-AI functionality when the API is absent. The three browser AI skills (prompt-api, webllm, webnn) remain distinct choices based on SPEC.md requirements, not runtime fallbacks. |
| **Robustness dimension scoring via source code metrics** | Code coverage, cyclomatic complexity, dependency count -- these are traditional robustness signals. | Violates the GAN information barrier. The v1.1 architecture explicitly prohibits critics from reading source code. Robustness must be assessed from the product surface: error handling behavior, crash resilience, console cleanliness, navigation robustness, input validation. The perturbation-critic achieves this through behavioral testing. Re-introducing source code metrics would undo a core v1.1 architectural decision. | **Behavioral robustness signals only:** error boundary behavior under adversarial input, console error count under stress, crash/freeze detection during rapid interaction, graceful degradation when APIs are unavailable, navigation state persistence. These are all observable from the product surface without reading source code. |

## Feature Dependencies

```
[Perturbation-Critic Agent] (new agent)
    |
    +--requires--> [DIMENSIONS constant update] (add Robustness, set threshold)
    |                  |
    |                  +--requires--> [compile-evaluation 3-critic support]
    |                  |
    |                  +--requires--> [Orchestrator 3-critic spawn/retry]
    |                  |
    |                  +--requires--> [State file critics field: 3 critics]
    |
    +--requires--> [Perturbation summary.json schema]
    |
    +--requires--> [SCORING-CALIBRATION.md Robustness section]

[Convergence Hardening] (CLI modifications)
    |
    +-- [EMA smoothing] -- independent, modifies computeEscalation()
    |
    +-- [Per-dimension tracking] -- independent, extends round data structure
    |
    +-- [Z-score anomaly detection] -- requires >= 3 rounds, additive to
    |   round-complete response
    |
    +-- [Dimension weighting] -- independent, modifies total computation

[Enhanced Perceptual-Critic] (extends existing agent)
    |
    +-- [Cross-page consistency audit] -- extends methodology section
    |       |
    |       +--requires--> [Multi-page screenshot workflow]
    |       |
    |       +--requires--> [Design token extraction via eval-first]
    |
    +-- does NOT depend on perturbation-critic (different dimension)

[Enhanced Projection-Critic] (extends existing agent)
    |
    +-- [A->B->A navigation tests] -- extends acceptance test patterns
    |       |
    |       +--requires--> [page.goBack() pattern documentation]
    |
    +-- [Data persistence test elevation] -- documentation change
    |
    +-- does NOT depend on perturbation-critic (different dimension)

[Generator Improvements] (independent track)
    |
    +-- [Vite+ skill update] -- updates SKILL.md, generator.md references
    |
    +-- [Dependency freshness] -- new diagnostic step or CLI subcommand
    |
    +-- [Browser-agnostic LanguageModel] -- updates browser-prompt-api skill
    |
    +-- does NOT depend on critic changes

[Architecture Documentation] (independent, no code changes)
    |
    +-- Pure documentation grounded in GAN/Cybernetics/Turing test principles
    |
    +-- does NOT block or depend on any other feature
```

### Dependency Notes

- **Perturbation-critic requires DIMENSIONS update:** The new Robustness
  dimension must be added to the DIMENSIONS constant in appdev-cli.mjs before
  the perturbation-critic can report scores that the CLI processes. This is the
  same foundation-first pattern as v1.1's scoring restructuring.
- **Perturbation-critic requires 3-critic orchestration:** The orchestrator
  currently spawns 2 critics in parallel. Adding a third requires changes to
  the `--critics` flag, compile-evaluation logic, resume-check recovery states,
  and the per-critic retry pattern.
- **Convergence hardening is internally independent:** EMA smoothing,
  per-dimension tracking, z-score detection, and dimension weighting can be
  implemented in any order. They modify different parts of the CLI.
- **Critic enhancements are parallel:** Perceptual-critic (Visual Design) and
  projection-critic (Functionality) enhancements touch different agents with
  non-overlapping scoring dimensions. They can be developed in parallel.
- **Generator improvements are independent:** Vite+ updates, dependency
  freshness, and LanguageModel browser-agnostic changes affect only the
  Generator side. They do not interact with critic or convergence changes.
- **Architecture documentation has no code dependencies:** It is a pure
  documentation deliverable that can be written at any point.

## v1.2 Scope Definition

### Must Have (v1.2)

- [ ] **Perturbation-critic (Robustness dimension)** -- The primary new
  capability in v1.2. Addresses the blind spot where the Dutch art museum test
  had no robustness testing. Requires: new agent definition, DIMENSIONS update,
  3-critic orchestration, scoring calibration, summary.json schema. This is the
  highest-complexity feature but also the highest-value one -- without it, the
  v1.2 milestone has no new critic capability.
- [ ] **Convergence: EMA-smoothed trajectory** -- Addresses false PLATEAU and
  REGRESSION exits caused by noisy single-round scores. Low risk (backward-
  compatible with alpha=1.0). Should be implemented alongside DIMENSIONS update
  since both modify the CLI.
- [ ] **Convergence: per-dimension tracking** -- Enables the Generator to
  prioritize stagnant dimensions. Required for meaningful escalation messages
  with 4 dimensions. Advisory (not gating) to avoid combinatorial exit logic.
- [ ] **Enhanced perceptual-critic: cross-page consistency** -- Addresses the
  specific Dutch art museum failure where pages had inconsistent styling. Medium
  complexity, uses existing eval-first infrastructure.
- [ ] **Enhanced projection-critic: A->B->A navigation** -- Addresses the
  specific Dutch art museum failure where navigation state was not tested. Uses
  existing write-and-run infrastructure.
- [ ] **Architecture documentation** -- Milestone requirement. Pure
  documentation, no risk.

### Should Have (v1.2)

- [ ] **Generator: browser-agnostic LanguageModel** -- Low complexity, high
  correctness value. Edge 139+ ships LanguageModel with Phi-4-mini. The skill
  should document both browsers.
- [ ] **Generator: Vite+ skill refresh** -- Vite+ alpha has matured since the
  initial skill was written. Update to match official `vp` CLI workflow.
- [ ] **Generator: dependency freshness** -- Low complexity diagnostic step.
  Can be a CLI subcommand or a Generator step.
- [ ] **Convergence: z-score anomaly detection** -- Deferred from v1.1. Low
  complexity, additive, requires >= 3 rounds. Catches mode collapse and
  hallucinated evaluations.
- [ ] **Perturbation-critic: LLM-driven adversarial sequences** -- Differentiator
  but high complexity. Can be an advanced feature of the perturbation-critic
  rather than a v1.2 requirement. Start with targeted input perturbation, add
  behavioral adversarial sequences if token budget allows.

### Defer to v1.3+ (needs empirical data or more design work)

- [ ] **Rising thresholds** -- Still needs empirical score distributions. Now
  complicated further by the new Robustness dimension. Collect data in v1.2.
- [ ] **Dimension-weighted scoring** -- Conceptually sound but the weight
  values need empirical calibration. Collecting data in v1.2 enables this.
- [ ] **Score distribution statistics collection** -- Add `--collect-stats`
  flag to round-complete for data-driven threshold and weight calibration in
  v1.3.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk | Priority |
|---------|------------|---------------------|------|----------|
| Perturbation-critic (Robustness) | HIGH | HIGH | HIGH (new agent, 3-critic orchestration) | P1 |
| DIMENSIONS update (add Robustness) | HIGH | MEDIUM | MEDIUM (regex contract) | P1 |
| 3-critic orchestration | HIGH | MEDIUM | MEDIUM (orchestrator changes) | P1 |
| EMA-smoothed trajectory | HIGH | MEDIUM | LOW (backward-compatible) | P1 |
| Per-dimension tracking | MEDIUM | MEDIUM | LOW (additive) | P1 |
| Cross-page consistency (perceptual) | HIGH | MEDIUM | LOW (extends existing agent) | P1 |
| A->B->A navigation (projection) | HIGH | MEDIUM | LOW (extends existing patterns) | P1 |
| Architecture documentation | MEDIUM | LOW | LOW (no code) | P1 |
| Browser-agnostic LanguageModel | MEDIUM | LOW | LOW (documentation update) | P2 |
| Vite+ skill refresh | MEDIUM | MEDIUM | LOW (independent) | P2 |
| Dependency freshness | LOW | LOW | LOW (diagnostic step) | P2 |
| Z-score anomaly detection | MEDIUM | LOW | LOW (additive) | P2 |
| LLM-driven adversarial sequences | MEDIUM | HIGH | MEDIUM (token budget) | P2 |
| Dimension-weighted scoring | LOW | LOW | MEDIUM (needs calibration) | P3 |
| Rising thresholds | MEDIUM | MEDIUM | HIGH (needs data) | P3 |
| Stats collection | LOW | LOW | LOW (additive) | P3 |

**Priority key:**
- P1: Must have for v1.2 -- addresses Dutch art museum test failures and core architecture gaps
- P2: Should have for v1.2 -- meaningful quality improvements, low risk
- P3: Defer to v1.3+ -- needs empirical data or design maturation

## Competitor Feature Analysis

| Feature | Anthropic Article | Playwright Agents (v1.56+) | Chromatic | Our v1.2 Approach |
|---------|-------------------|---------------------------|-----------|-------------------|
| Robustness/perturbation testing | Not documented. Evaluator focuses on design, functionality, craft | Healer agent fixes broken tests, not adversarial testing | Visual regression only, no functional perturbation | Dedicated perturbation-critic with targeted adversarial inputs, error boundary testing, and console monitoring under stress |
| Convergence detection | Heuristic (5-15 iterations, manual assessment) | N/A (single-pass test execution) | N/A (CI pipeline, no convergence loop) | EMA-smoothed trajectory with per-dimension tracking, 4 exit conditions, z-score anomaly detection |
| Cross-page visual consistency | Not documented (per-page assessment implied) | Not built-in; relies on snapshot comparison | Core capability: automated visual regression across components | Perceptual-critic extracts design tokens (colors, fonts, spacing) across pages, diffs for consistency, feeds findings into Visual Design score |
| Deep navigation testing | "Runs Playwright to interact with the live application" -- scope unclear | Planner/Generator agents generate navigation tests | Not applicable (component-level, not page-level) | Projection-critic A->B->A patterns with state persistence assertions, back-button testing, data flow verification |
| Browser AI API support | Not documented | Not applicable | Not applicable | Browser-agnostic LanguageModel API (Chrome 138+/Gemini Nano, Edge 139+/Phi-4-mini), W3C standardization track |
| Build toolchain for generated projects | Not documented | Not applicable | Not applicable | Vite+ alpha (`vp` CLI) with fallback to plain Vite. 3 commands replace 5+. 50-100x faster linting. |

### Key Insight from Competitor Analysis

The perturbation-critic is genuinely novel in the application-generation space.
No competing harness (Anthropic's, Playwright Agents, Chromatic, ATDD plugins)
has a dedicated adversarial testing agent that applies robustness perturbations
to generated applications. The closest analog is the SitePoint adversarial LLM
tester, which is a standalone tool, not integrated into a generation loop.

Our advantage: the perturbation-critic operates WITHIN the adversarial loop. Its
findings feed back to the Generator, which can fix robustness issues in
subsequent rounds. This is true GAN-inspired adversarial improvement -- the
Generator faces pressure from three independent critics (visual, functional,
robustness), each probing a different weakness.

The convergence hardening features (EMA, per-dimension tracking, z-score) are
also unique. Competing systems either have no convergence detection (single-pass)
or use simple heuristics (fixed iteration count). Our approach applies signal
processing techniques (EMA smoothing, statistical process control) to score
trajectories -- a direct transfer from GAN training diagnostics to the
application generation domain.

## Sources

### Perturbation Testing / Robustness

- [Adversarial LLM-Driven UI Logic Tester (SitePoint, 2025)](https://www.sitepoint.com/playwright-llm-building-an-adversarial-ui-logic-tester/) -- MEDIUM confidence. Adversarial loop: extract UI state, send to LLM with hostile prompt, execute via Playwright, detect anomalies. Found real production bugs (back-button during async validation bypass). Directly applicable to perturbation-critic design.
- [AI-Powered UI Testing: Fuzzing with a Creative Partner (BetaCraft, 2025)](https://betacraft.com/2025-06-10-ai-powered-ui-testing/) -- MEDIUM confidence. LLM-driven fuzz testing scales to edge cases humans miss. Key: AI generates inputs, Playwright executes, screenshot comparison detects anomalies.
- [Fuzz Testing Beginner's Guide (Better Stack)](https://betterstack.com/community/guides/testing/fuzz-testing/) -- MEDIUM confidence. Mutation-based vs generation-based fuzzing. Black-box fuzzing treats application as unknown. Modern fuzzers use instrumentation for execution feedback.
- [Rethinking Testing for LLM Applications (arXiv:2508.20737)](https://arxiv.org/html/2508.20737v1) -- MEDIUM confidence. Boundary-value analysis combined with adversarial-prompt generation and mutation-based perturbations for robust testing.
- [Data Perturbation Testing for Web Services (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0020025510004846) -- MEDIUM confidence. Penetration testing + fault injection to emulate XSS attacks. WSInject improves vulnerability detection over standard tools.

### Convergence Algorithms

- [Google: GAN Training](https://developers.google.com/machine-learning/gan/training) -- HIGH confidence. "Convergence is often a fleeting, rather than stable, state." Discriminator performance degrades as generator improves. Directly applicable to critic-based convergence detection.
- [GAN Convergence Challenges (Springer, 2025)](https://link.springer.com/article/10.1007/s44354-025-00007-w) -- HIGH confidence. Unified taxonomy linking divergence choice, objective loss, and architecture to training dynamics. Mode collapse, vanishing gradients, instability from generator/discriminator imbalance.
- [Convergence and Robustness of Adversarial Training (ICML 2019)](http://proceedings.mlr.press/v97/wang19i/wang19i.pdf) -- HIGH confidence. First-Order Stationary Condition (FOSC) for quantitative convergence quality measurement. Directly applicable to scoring convergence assessment.
- [Adaptive Weighted Discriminator (CVPR 2021)](https://openaccess.thecvf.com/content/CVPR2021/papers/Zadorozhnyy_Adaptive_Weighted_Discriminator_for_Training_Generative_Adversarial_Networks_CVPR_2021_paper.pdf) -- MEDIUM confidence. Adaptive weighting achieves faster convergence. Applicable to dimension weighting concept.
- [EWMA Procedure for Change Detection (PMC, 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10248291/) -- HIGH confidence. EWMA specifically designed for plateau/change detection in longitudinal data. Directly applicable to score trajectory smoothing.
- [EMA in Deep Learning: Dynamics and Benefits (arXiv, 2024)](https://arxiv.org/html/2411.18704v1) -- MEDIUM confidence. Weight averaging reduces noise and yields good solutions under high learning rates. Dynamic decay for convergence.

### Visual Consistency

- [Color Consistency in Design Systems (UXPin)](https://www.uxpin.com/studio/blog/color-consistency-design-systems/) -- MEDIUM confidence. Design tokens as foundation for cross-page consistency. Primitive + semantic token layers.
- [Visual Consistency in Branding (Siteimprove)](https://www.siteimprove.com/blog/visual-consistency-meaning/) -- MEDIUM confidence. "When typography switches styles across channels, every inconsistency chips away at customer trust." Automated brand compliance tools measure consistency.
- [Chromatic: Visual Testing for Design Systems](https://www.chromatic.com/solutions/design-systems) -- MEDIUM confidence. Automated visual regression detection across components. Prevents minor bugs from triggering widespread regressions.
- [AI-Driven Assessment in Visual Communication (ShodhKosh)](https://www.granthaalayahpublication.org/Arts-Journal/ShodhKosh/article/download/6651/6034/34424) -- LOW confidence. AI systems achieve 87% correlation with human grading for visual design assessment. Automated evaluation reduces time by 65%.
- [Design System Trends 2026 (Design Signal)](https://designsignal.ai/articles/design-systems-trends-2026) -- MEDIUM confidence. "Mood mode" dark themes and sustainable palettes add consistency complexity. AI useful for exploration but needs human constraints.

### Navigation Testing

- [Testing Navigation and Routing (Codefinity/Playwright)](https://codefinity.com/courses/v2/39d9ad92-13c1-4c43-9dfe-3e52c38f193e/7cf6d65b-6ff7-4885-8a20-24752d152bb1/198d193a-0266-448f-a6d1-e86ae7bd47e8) -- MEDIUM confidence. A->B->A pattern with `page.goBack()` and URL/content assertions. Core Playwright capability.
- [Playwright Best Practices 2026 (BrowserStack)](https://www.browserstack.com/guide/playwright-best-practices) -- MEDIUM confidence. Context isolation, fresh browser contexts per test, state reset between tests. Applicable to navigation state testing.
- [Playwright Features 2026 (ThinkSys)](https://thinksys.com/qa-testing/playwright-features/) -- MEDIUM confidence. SPA/PWA compatibility, Shadow DOM handling, auto-waiting for navigation stability.

### Browser AI APIs

- [W3C Prompt API (GitHub)](https://github.com/webmachinelearning/prompt-api) -- HIGH confidence. W3C Web Machine Learning group standardization. `LanguageModel` is the proposed standard interface.
- [Chrome Built-in AI APIs (Chrome Developers)](https://developer.chrome.com/docs/ai/built-in-apis) -- HIGH confidence. Chrome 138+ with Gemini Nano. Origin trial for web pages, stable in extensions.
- [Edge Prompt API (Microsoft Learn)](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api) -- HIGH confidence. Edge 139+ with Phi-4-mini. Same `LanguageModel` interface as Chrome. Developer preview in Canary/Dev channels.
- [Edge Prompt and Writing Assistance APIs (Edge Blog)](https://blogs.windows.com/msedgedev/2025/05/19/introducing-the-prompt-and-writing-assistance-apis/) -- HIGH confidence. Phi-4-mini 3.5B parameters, local inference, no cloud calls.
- [On-Device AI with Chrome Prompt API (DEV Community)](https://dev.to/this-is-learning/on-device-ai-with-the-google-chrome-prompt-api-2jbe) -- MEDIUM confidence. Practical implementation guide for LanguageModel API.

### Vite+

- [Announcing Vite+ Alpha (VoidZero)](https://voidzero.dev/posts/announcing-vite-plus-alpha) -- HIGH confidence. Official announcement. `vp` CLI, unified config, Vite 8 + Vitest 4.1 + Oxlint + Oxfmt + tsgo + Rolldown.
- [Vite+ GitHub (voidzero-dev/vite-plus)](https://github.com/voidzero-dev/vite-plus) -- HIGH confidence. Official repository. "Manages your runtime, package manager, and frontend toolchain in one place."
- [Complete Guide to Vite+ Alpha (Flex)](https://www.flex.com.ph/articles/complete-guide-to-vite-alpha-launch) -- MEDIUM confidence. Practical guide covering `vp create`, `vp check`, `vp test`, `vp build`, `vp install`, `vp prepare`.
- [Getting Started with Vite+ (BSWEN)](https://docs.bswen.com/blog/2026-03-14-viteplus-getting-started-tutorial/) -- MEDIUM confidence. Tutorial covering project setup, configuration, and CI integration.

---
*Feature research for: application-dev plugin v1.2 Dutch Art Museum Test Fixes*
*Researched: 2026-04-02*
