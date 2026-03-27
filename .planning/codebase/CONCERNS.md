# Codebase Concerns

**Analysis Date:** 2026-03-27

## Cost and Token Consumption

**Autonomous Application Development is expensive:**
- Issue: The `application-dev` plugin runs a three-agent orchestration (Planner, Generator, Evaluator) with up to 3 build/QA rounds. Each run consumes significant tokens and API costs. Per research documentation in `research/anthropic-harness-design-for-long-running-application-development.md`, a single game maker build costs ~$200 and runs 6+ hours; a DAW build costs ~$124 and runs 4 hours.
- Files: `plugins/application-dev/skills/application-dev/SKILL.md`, `plugins/application-dev/agents/generator.md`, `plugins/application-dev/agents/evaluator.md`
- Impact: Users may inadvertently incur high costs for single prompts. No cost warnings or limits in the command interface. Each round of iteration adds cumulative cost with no user control to stop mid-loop.
- Fix approach: Add explicit cost disclosures in `application-dev.md` command documentation and skill documentation. Consider adding token/cost estimation hints. Optionally expose a `--max-rounds` flag or cost ceiling in the future.

## Context Window Management (Model-Dependent)

**Long-running builds rely on continuous session compaction:**
- Issue: The three-agent orchestration runs as a single continuous session. Unlike earlier harness designs that used context resets between agent runs, the current design relies on automatic context compaction (merging earlier turns to stay under the context limit). Per research documentation, Opus 4.5 exhibited "context anxiety" (premature conclusion as context fills), which required explicit context resets. Opus 4.6 improved this, but the mitigation is model-version-dependent.
- Files: `research/anthropic-harness-design-for-long-running-application-development.md`, `plugins/application-dev/skills/application-dev/SKILL.md`
- Impact: If using Opus 4.5 or earlier models, the harness may degrade or stall on long builds. If context compaction merges critical spec or QA data incorrectly, downstream agents may lose coherence about what was built or what needs fixing.
- Fix approach: Document minimum model version recommendation (Opus 4.6+) explicitly in plugin README and plugin.json. Monitor for context compaction degradation in multi-round runs. If issues arise on older models, add explicit context reset logic between agents (trades cost/latency for robustness).

## Evaluator Skepticism Tuning

**QA scoring may drift or become lenient if evaluator prompt drifts:**
- Issue: The Evaluator agent's judgement relies on careful prompt tuning to maintain skepticism without being unreasonably harsh. Per research documentation, Claude has a natural tendency to praise LLM-generated work ("self-evaluation leniency"). The evaluator was tuned through iterative feedback loops to counter this. The tuning is encoded in `evaluator.md` lines 27-40 ("Critical Mindset" section) and lines 209-239 (scoring guidelines). If the prompt is modified or if a model version exhibits different leniency patterns, score calibration may drift.
- Files: `plugins/application-dev/agents/evaluator.md`
- Impact: If evaluator becomes too lenient, mediocre builds pass QA thresholds and the feedback loop breaks (Generator receives no meaningful critique). If too strict, reasonable work gets rejected unfairly and the loop oscillates without converging. Threshold failures (Product Depth < 7, Functionality < 7, Visual Design < 6, Code Quality < 6) depend on calibrated scoring.
- Fix approach: Preserve the Evaluator prompt carefully; any changes should be tested against reference test cases. Document the tuning process and rationale. Consider adding few-shot examples to the evaluator prompt if drift is observed in future runs.

## Playwright CLI Dependency

**QA loop requires external binary not distributed with plugin:**
- Issue: The Evaluator agent uses `playwright-cli` (external CLI tool) to interact with running applications like a real user. The plugin does not bundle or auto-install playwright-cli; users must install it separately and have it on PATH. Plugin README states: "Requires playwright-cli on PATH" (`plugins/application-dev/README.md` line 43). Without it, the Evaluator cannot start and the entire build/QA loop fails.
- Files: `plugins/application-dev/README.md`, `plugins/application-dev/agents/evaluator.md` (lines 120-160)
- Impact: Installation friction. Users may overlook the dependency and attempt to use the plugin without having playwright-cli available, resulting in cryptic failures. If playwright-cli is not on PATH, evaluator spawn fails silently or with unclear errors.
- Fix approach: Add a pre-flight check in the orchestrator (`application-dev` skill) to verify playwright-cli availability before spawning the evaluator. Provide a clear error message with installation instructions if missing. Optionally add a skill note about how to install playwright-cli cross-platform (npm, Homebrew, etc.).

## AI Feature Implementation Complexity

**In-browser AI features require careful feature detection and graceful degradation:**
- Issue: The Generator is instructed to implement in-browser AI features using three different APIs depending on spec requirements: browser-prompt-api (for Gemini Nano on Chrome 138+), browser-webllm (for MLC-compiled models with WebGPU), and browser-webnn (for neural network graph inference on WebNN). Each has different browser support, hardware requirements (disk space for model download, VRAM, GPU vs CPU fallback), and initialization complexity. Per skill documentation, graceful degradation patterns are required but not enforced.
- Files: `plugins/application-dev/agents/generator.md` (lines 65-70), `plugins/application-dev/skills/browser-prompt-api/SKILL.md`, `plugins/application-dev/skills/browser-webllm/SKILL.md`, `plugins/application-dev/skills/browser-webnn/SKILL.md`
- Impact: Specs that require AI features may be built by Generator using APIs incompatible with user's browser. Prompt API requires 22 GB disk space and Chrome 138+ (rare). WebLLM requires WebGPU and 1-6 GB VRAM. WebNN is experimental. If Generator builds without proper feature detection, applications fail gracefully on unsupported browsers or show model-download dialogs instead of functional UIs.
- Fix approach: Planner should be instructed to explicitly call out browser/hardware requirements for any AI features in the spec's "Constraints and Non-Goals" section. Generator should include mandatory feature-detection code patterns (not optional fallbacks) in AI feature implementations. Evaluator should test AI features on a baseline browser (Chrome without Prompt API, no WebGPU, etc.) and verify graceful degradation.

## Design Language Enforcement

**Visual Design Language section in spec is guidance, not enforced architecture:**
- Issue: The Planner creates a detailed Visual Design Language in SPEC.md (color palette, typography, layout principles, aesthetic direction) based on `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md`. Generator is instructed to read it and implement accordingly, but there is no formal validation that generated code follows the design language. The Evaluator visually assesses design against the spec but has no programmatic checks.
- Files: `plugins/application-dev/agents/planner.md` (lines 65-77), `plugins/application-dev/agents/generator.md` (lines 62-63), `plugins/application-dev/agents/evaluator.md` (lines 296-299)
- Impact: Generated UIs may deviate from the spec's design intent even if technically correct. AI-slop patterns (purple gradients, generic card layouts, default component styling) may slip through if not caught by Evaluator's visual inspection. Design regressions (per evaluator.md lines 75-77) can erode across rounds.
- Fix approach: Generator should produce a design tokens file or CSS custom property documentation that codifies the design language. Evaluator should check that CSS reflects the spec's color palette and typography. Consider a more explicit checklist in the Evaluator's design assessment (e.g., "Check for Tailwind defaults vs. custom styling").

## Limited Regression Testing Coverage

**Regression detection in round 2+ is visual and behavioral, not structural:**
- Issue: Per evaluator.md lines 54-77, the Evaluator is instructed to retest previously passing features by re-executing user workflows and comparing visual state and behavior. However, this depends on manual test case identification from the previous QA-REPORT. There is no automated regression test suite, no recorded user journey playbook, and no diffing of git changes against test coverage.
- Files: `plugins/application-dev/agents/evaluator.md` (lines 54-77, 304-310)
- Impact: Subtle regressions (timing bugs, state management issues, CSS breakage in unrelated components) may only be caught if the Evaluator happens to exercise that code path in the current round. Complex features with many user paths may not be fully retested due to time/token constraints. A fix in round 2 may break something unrelated that was tested in round 1 but not round 2.
- Fix approach: Planner should include a test scenario list in SPEC.md (primary user journeys). Generator should add a `test-scenarios.json` documenting reproducible test paths (steps, inputs, expected outcomes) as part of the build. Evaluator should use this playbook to ensure consistent regression coverage across rounds.

## Generator Scope Creep and Feature Burndown

**No formal feature prioritization enforcement between rounds:**
- Issue: Planner creates a feature list with priority tiers (Core, Important, Nice-to-have) in SPEC.md. Generator is instructed to implement features incrementally and keep the app runnable. However, if a build round fails on Product Depth or Functionality, there is no formal rule about whether Generator should cut Nice-to-have features to stabilize Core features, or attempt to fix broken Core features while keeping all features in scope.
- Files: `plugins/application-dev/agents/planner.md` (lines 103-108), `plugins/application-dev/agents/generator.md` (lines 78-95)
- Impact: Generator may attempt ambitious scope fixes in later rounds that destabilize previously working Core features (introducing new bugs to add polish). Alternatively, it may abandon Important features to meet deadline, leaving incomplete products.
- Fix approach: Add explicit triage rules in Generator prompt for round 2+: if Product Depth < 7, implement or fix Core features only; if Functionality < 7, stabilize existing features before adding new ones; if Visual Design < 6, refactor design system only. Make the prioritization tiers decision-making inputs for the Generator's "plan before coding" phase.

## Browser-Local AI Model Download Friction

**WebLLM and Prompt API require large model downloads with no resume/caching documented:**
- Issue: If Spec.md calls for WebLLM (browser-webllm skill), the generated app downloads 1-6 GB models on first use via the browser's IndexedDB/Cache API. Per skill documentation (browser-webllm.md lines 236-239, 268-274), cache management exists but applications may not expose UI for deleting cached models or resuming interrupted downloads.
- Files: `plugins/application-dev/skills/browser-webllm/SKILL.md` (lines 239-274), `plugins/application-dev/agents/generator.md` (lines 65-70)
- Impact: First user of a generated app with WebLLM features may experience 10+ minute download delay with no feedback. Interrupted downloads require manual cache clearing. Storage quota exhaustion on user's device is possible.
- Fix approach: Generator should include a "Settings" or "Cache" UI component when AI features are present that allows users to pre-download or delete cached models. Skill documentation should include a code snippet for a model download progress UI. Planner should warn in the spec if a feature requires large model downloads, so Evaluator can test it.

## Test Coverage Gaps

**No automated test suite or type checking enforced in generated applications:**
- Issue: Planner, Generator, and Evaluator roles do not mention creating unit tests, integration tests, or type checking (TypeScript). Generator is told to avoid stubs and dead code but receives no direction on test coverage. Evaluator tests the running application manually but does not check for test files or type safety.
- Files: `plugins/application-dev/agents/generator.md` (lines 96-104), `plugins/application-dev/agents/evaluator.md` (lines 193-206)
- Impact: Generated applications may lack defensive code, error handling, or edge-case coverage. Future maintainers (or future rounds of the Generator fixing bugs) have no test suite to verify regressions. Complex features implemented without tests are fragile.
- Fix approach: Generator should include a `jest.config.js` or `vitest.config.ts` and create tests for complex features (state management, async workflows, data validation). Evaluator should spot-check test files or type definitions exist and that critical paths are tested. This is a lower priority than functionality but becomes critical if the application is meant to be handed off for manual maintenance.

## Model Version Lock and Drift

**Plugin instructions default to `model: inherit`, which allows users to switch models:**
- Issue: Agents in `application-dev`, `planner`, `generator`, and `evaluator` all specify `model: inherit`, meaning they use whatever model the user selected for the Claude Code session. Per README.md line 85: "Agents default to model: inherit so users can experiment with different models. For best long-running results, Opus 4.6 is recommended." Users may select Sonnet 4.6 or other models, which may not perform as well as Opus 4.6 on the harness design.
- Files: `plugins/application-dev/agents/planner.md`, `plugins/application-dev/agents/generator.md`, `plugins/application-dev/agents/evaluator.md`, `plugins/application-dev/README.md` (lines 83-86)
- Impact: Users experience variable quality and cost. Sonnet 4.6 may introduce context anxiety or other degradations noted in research docs. Evaluator tuning (skepticism calibration) may not translate to other models.
- Fix approach: Document the minimum recommended model version and cost estimate prominently in plugin README. Consider adding a warning in the skill if a model other than Opus 4.6+ is detected. If Opus 4.7 or later is released, re-test and update recommendations.

## Specification Scope Creep

**Planner is instructed to be ambitious; no hard scope limits or complexity budget:**
- Issue: Per planner.md line 32: "Be ambitious about scope -- push beyond the obvious interpretation to create something impressive and feature-rich." Planner is told to expand a 1-4 sentence prompt into 10-16+ features. There is no complexity budget, no time budget, and no interaction limit.
- Files: `plugins/application-dev/agents/planner.md` (lines 31-48)
- Impact: A simple prompt ("build a note-taking app") may expand into a spec with 16 features, AI assistants, export/import, real-time sync, and more. Generator then attempts to build all of it in a single run. If scope is too large, Generator runs out of tokens or context, and the harness fails to produce a working app.
- Fix approach: Add an optional constraint to the Planner: "Focus on a coherent feature set that can be fully implemented in a single build round (aim for 6-10 core + important features, reserve nice-to-have features for future iterations)." Alternatively, add a token budget estimate in the Evaluator's scoring (if Product Depth > 7 but other scores are low, note complexity-related bottlenecks).

## Documentation of AI Features in Specs

**Planner weaves AI features into specs, but Generator may not implement them correctly:**
- Issue: Per planner.md lines 47, Planner is instructed to "Weave AI features throughout" the spec. However, the Generator's instruction on AI features (generator.md lines 65-70) is relatively brief. The in-browser AI skills (browser-prompt-api, browser-webllm, browser-webnn) are detailed, but Generator may not integrate them correctly without explicit spec guidance on where AI should appear.
- Files: `plugins/application-dev/agents/planner.md` (lines 47), `plugins/application-dev/agents/generator.md` (lines 65-70), AI skill files
- Impact: AI features described in SPEC.md may be missing from generated code, or implemented naively (e.g., using a remote API instead of on-device inference). Evaluator catches this as a missing feature, but the feedback loop requires Generator to re-implement.
- Fix approach: Planner should create an explicit "AI Features" section in SPEC.md that lists each AI-powered feature, which in-browser API to use, and the expected user flow. Generator should explicitly cross-check this section and verify each AI feature is implemented and uses the correct API.

## Error Handling and Failure Messaging

**Agents have no explicit error recovery beyond re-spawning on missing/malformed output:**
- Issue: The orchestrator skill (application-dev/SKILL.md lines 55, 83) includes checks to re-spawn agents if SPEC.md or QA-REPORT.md are missing or malformed. However, there is no comprehensive error handling for agent execution failures (timeout, out-of-context, API failures, invalid git operations, terminal errors).
- Files: `plugins/application-dev/skills/application-dev/SKILL.md`
- Impact: If Generator encounters an error (e.g., git push fails, npm install times out, file write fails), the error may propagate as an unhandled exception, terminating the entire build/QA loop. Users see a generic error message instead of actionable feedback.
- Fix approach: Add error handling in the orchestrator to catch and log specific failure modes (network errors, filesystem errors, subprocess failures). Provide a summary to the user: "Build round 2 failed due to [reason]; review the error log." Optionally allow manual retry of a specific phase.

---

*Concerns audit: 2026-03-27*
