# Phase 4: Generator Hardening and Skills - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The Generator produces higher-quality applications by self-checking with CI before Evaluator handoff, using real AI skills for in-app AI features, and sourcing assets responsibly. A Vite+ skill is bundled with the plugin for correct vp CLI usage. This phase strengthens the Generator side of the GAN -- Phases 1-3 strengthened the orchestrator and Evaluator; now the Generator gets awareness (CI, asset sourcing, AI skills) while the Evaluator provides the adversarial pressure that makes that awareness matter.

Requirements: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, SKILL-01

</domain>

<decisions>
## Implementation Decisions

### CI self-checks: Progressive quality integration (GEN-01)

**Strategy: Integrated build + diagnostic (GAN-principled, not fix-and-retry)**

GAN analog: progressive growing (Karras et al., StyleGAN). Quality checks enter the workflow when they become meaningful and run from that point forward. The final diagnostic is a regression sweep, not the first time checks run. This eliminates the "retry limit" problem -- there is no post-hoc retry loop.

**CI check types (all selected):** typecheck, build, lint, unit tests, integration tests, e2e tests (e.g., Playwright E2E -- tech-stack-agnostic, mentioned as example not prescription).

**Progressive integration phases:**

1. **Project Setup:** Configure ALL quality tooling alongside the build toolchain -- lint rules, typecheck config, test framework, e2e framework. One coherent "development environment" commit. The Generator does not start writing features in an environment without quality feedback.

2. **Per-Feature Development (core loop):** implement -> lint + typecheck -> write unit tests -> run all tests -> commit. Fast checks (lint, typecheck) take seconds and catch issues while context is fresh. Unit tests written alongside the feature they test. Running ALL tests (not just new ones) catches regressions.

3. **Integration:** After core features are in place, write e2e tests for key user flows. These require a running app with multiple features working together. Run them, fix what breaks.

4. **Pre-handoff Diagnostic:** Full battery one final time -- build, typecheck, lint, all tests, all e2e. This is a regression sweep after everything is integrated. Fix quick wins in one pass, document the rest, hand off.

**Build verification is integrated into development, not a post-hoc gate.** The Generator keeps the app building throughout. Build errors are fixed as part of building -- the Generator should never reach the end with a broken build.

**Other CI checks are diagnostic, not gates.** Typecheck/lint/test failures after the final diagnostic do not block handoff. The Generator fixes quick wins in one pass, documents remaining issues, and always hands off to the Evaluator. The GAN loop stays intact -- the Evaluator provides signal CI checks alone cannot (visual quality, AI features, product depth).

**When the app doesn't start (build fails at diagnostic):** Always hand off to the Evaluator anyway. The Evaluator's Step 10 (Review Code) still runs and provides richer feedback than CI error output. Convergence engine handles the rest (E-IV Catastrophic if regression, baseline if round 1). No special "build failed" path in the orchestrator.

### Testing strategy: Decision framework (GEN-01)

**The Generator analyzes SPEC.md app type during project setup and chooses test emphasis:**

- **Frontend SPA / interactive UI:** Testing Trophy. Integration tests (Vitest Browser or Testing Library) as the bulk. E2e for critical user flows. Unit tests for pure utilities only.
- **Full-stack with API:** Trophy for frontend, Pyramid for backend. Backend business logic benefits from unit tests. API endpoints get integration tests. E2e ties the layers together.
- **CLI / utility tool:** Pyramid. Unit tests for logic/parsing. E2e = command invocation and output verification.
- **Data / algorithmic app:** Pyramid. Unit tests for algorithms and transforms. Integration for data pipelines.

**Generated-app testing principle:** Prefer behavior-testing over implementation-testing. Tests should verify SPEC.md requirements, not internal code structure. This maximizes test survival across generation rounds -- implementation changes in fix-only mode (rounds 2+) don't break behavior-focused tests.

**SPEC.md is the test oracle.** User stories, acceptance criteria, and feature descriptions define what tests verify.

**Coverage priority:** Core user flows first (e2e), then feature-specific behavior (integration), then pure logic (unit), then edge cases. Don't aim for exhaustive coverage -- the Evaluator catches what tests miss.

### Testing toolchain (GEN-01)

| Layer | Tool | Environment | What it tests |
|-------|------|-------------|---------------|
| Static analysis | Lint + Typecheck (stack-specific) | Node | Code quality, type safety |
| Unit tests | Vitest (node project) | Node/jsdom | Pure logic, utilities, data transforms |
| Browser integration | Vitest Browser (`@vitest/browser-playwright` + branded channels) | Real browser | Components using browser APIs (LanguageModel, WebGPU, WebNN) |
| E2e tests | Playwright Test | Real browser | Full user flows, multi-page navigation |

**Vitest as unified test runner.** Vitest `projects` config splits unit (node environment) and browser (real browser) tests in a single runner. Vitest 4.0 Browser Mode is no longer experimental.

**Branded browser channels** for Vitest Browser Mode: `chrome`, `chrome-beta`, `msedge`, `msedge-dev`, `firefox` via `@vitest/browser-playwright` provider's `launchOptions.channel`. Bundled Chromium/WebKit lack browser AI APIs (LanguageModel, WebGPU, WebNN). Branded channels ensure real API access for testing.

**Framework-specific render packages for Vitest Browser:**
- `vitest-browser-react` (React)
- `vitest-browser-vue` (Vue)
- `vitest-browser-svelte` (Svelte)
- `vitest-browser-angular` (Angular)

**E2e test workflow follows the Playwright Test Agents pattern:** plan (create test specs from SPEC.md) -> generate (write test files from specs) -> heal (run tests, diagnose failures, fix, re-run). Implemented as a Generator skill, not by spawning Playwright's actual Claude Code agents.

### Testing skills (GEN-01)

**Two new skills created in Phase 4:**

1. **`playwright-testing` skill** -- meta-skill following the angular-developer pattern (lean SKILL.md routing doc + 3 references):
   - `SKILL.md` (~100-150 lines): when to plan/generate/heal, artifacts and conventions (specs/, tests/, seed.spec.ts)
   - `references/test-planning.md`: how to explore app and create test plans from SPEC.md
   - `references/test-generation.md`: how to write Playwright test files from plans
   - `references/test-healing.md`: how to run, diagnose, fix, re-run tests (the healer loop)
   - Based on current Playwright Test Agents docs. Updating for future Playwright versions deferred to a later milestone.

2. **`vitest-browser` skill** -- self-contained SKILL.md (~200-300 lines):
   - Configuration with Playwright provider + branded browser channels
   - Framework-specific render packages (react, vue, svelte, angular)
   - Vitest projects config (unit + browser split)
   - Writing browser integration tests for components using browser APIs

### Asset sourcing: Complete quality pipeline (GEN-03, GEN-05)

**Four-layer pipeline -- the Generator-side counterpart to the Evaluator's asset validation (GAN symmetry):**

1. **Knowledge layer** (generator.md): Examples of sourcing approaches -- web search with license check, build-time generation (npm packages, canvas/SVG), browser AI + playwright screenshot, procedural/SVG generation, stock photo APIs with attribution. Examples not prescriptions -- Generator remains tech-stack-agnostic.

2. **Documentation layer** (ASSETS.md): Generator produces a manifest of all static assets. Markdown table format with columns: Asset, Type, Source, License, Attribution, URL, Verified. Template in references/ASSETS-TEMPLATE.md following the Phase 02.1 pattern (structural guidance in reference files).

3. **Automated verification** (`appdev-cli check-assets`): New CLI command. Curl-verifies every URL in ASSETS.md. Checks content-type and detects soft-404s (CDN returning HTML for missing images). Returns structured JSON (consistent with appdev-cli output protocol). Part of the CI diagnostic pass.

4. **Visual verification** (generator.md): Generator screenshots its own app at key viewport sizes and inspects for broken images, layout issues, placeholder patterns. Uses `npx playwright-cli screenshot` + Claude's visual capabilities. Part of the diagnostic pass before handoff.

**Pipeline runs during pre-handoff diagnostic:**
- Create/update ASSETS.md (document sourcing decisions)
- `appdev-cli check-assets` (verify URLs)
- Screenshot and inspect (verify visually)
- Hand off to Evaluator

**EVAL-06 (Evaluator cross-referencing ASSETS.md) deferred.** Phase 3 is complete and the Evaluator already validates assets comprehensively. The manifest primarily serves the Generator's own quality loop and gives users a provenance audit trail.

### Browser AI skill wiring (GEN-02)

**Dual mechanism: `skills` frontmatter + Read fallback.**

1. **Add `skills: [browser-prompt-api, browser-webllm, browser-webnn]` to generator.md frontmatter.** This is the correct architectural intent per Claude Code sub-agent docs. When bug #25834 is fixed, skills auto-inject at startup.

2. **Keep a lean decision router in the agent body as fallback.** Due to bug #25834 (plugin agent `skills:` frontmatter silently fails to inject plugin skill content), the Generator needs explicit Read instructions. Slim Step 6 from current ~30 lines of duplicated API details to ~10 lines of routing (angular-developer pattern):
   - Prompt API: when to use + Read `${CLAUDE_PLUGIN_ROOT}/skills/browser-prompt-api/SKILL.md`
   - WebLLM: when to use + Read `${CLAUDE_PLUGIN_ROOT}/skills/browser-webllm/SKILL.md`
   - WebNN: when to use + Read `${CLAUDE_PLUGIN_ROOT}/skills/browser-webnn/SKILL.md`

3. **Decision criteria stay in generator.md** (routing logic). API implementation details stay in the skill SKILL.md files (content). No duplication.

**New testing skills also added to frontmatter:** `skills: [browser-prompt-api, browser-webllm, browser-webnn, playwright-testing, vitest-browser, vite-plus]` -- all with Read fallback instructions.

### Vite+ skill and preference (SKILL-01, GEN-04)

**New `vite-plus` skill covering:**
- `vp` CLI commands: `create`, `dev`, `check`, `test`, `build`, `run`, `migrate`, `help`
- Unified `vite.config.ts` configuration: dev server, build, test, lint, format in one file
- Framework plugin configuration (React, Vue, Svelte, Solid, Angular where supported)

**Skill structure:** Determined during planning based on content size. If vp commands + config fit in <500 lines, self-contained SKILL.md. If not, meta-skill pattern with references (vp-cli.md, vite-config.md).

**Generator preference:** Prefer Vite+ for greenfield web projects when compatible with the chosen tech stack. Compatibility-conditional -- if the frontend framework selected is Angular, Vite+ might not be fully supported yet (tsgo not supported by Angular). Same for Nuxt, TanStack Start, and other frameworks with incomplete Vite+ integration. Falls back to plain Vite when Vite+ is not compatible. Preference, not mandate.

**Vite+ and CI integration:** `vp check` replaces separate lint + format + typecheck commands with a single pass. `vp test` runs Vitest. `vp build` does production builds. The Generator's CI diagnostic becomes simpler when Vite+ is used.

### Latest stable framework versions (GEN-06)

Generator uses latest stable versions of chosen frameworks/libraries unless the user prompt specifies otherwise. This is a simple behavioral instruction in generator.md -- no skill or reference needed.

### Claude's Discretion
- Exact content and structure of playwright-testing references (test-planning.md, test-generation.md, test-healing.md)
- Exact content and structure of vitest-browser SKILL.md
- Vite+ skill structure (self-contained vs meta-skill) based on content size during planning
- Exact ASSETS-TEMPLATE.md column set and format
- appdev-cli check-assets implementation details (flags, output format, error handling)
- Which viewport sizes the Generator uses for visual self-assessment
- How the Generator documents CI diagnostic results for the Evaluator

</decisions>

<specifics>
## Specific Ideas

- Progressive growing (StyleGAN) as the GAN analog for CI integration -- quality checks enter when meaningful, not bolted on at the end
- GAN symmetry: Generator asset pipeline (knowledge + documentation + automated + visual verification) mirrors Evaluator's asset validation protocol from Phase 3
- angular-developer meta-skill pattern (lean routing SKILL.md + references) for playwright-testing skill -- one domain, one skill, subtopics in references
- Vitest Browser Mode with branded browser channels -- the ONLY way to integration-test components using browser AI APIs (LanguageModel, WebGPU, WebNN not available in jsdom/happy-dom)
- `vp check` as single-command lint + format + typecheck replaces three separate tool configurations
- ASSETS.md as "SBOM for static assets" -- provenance, licensing, attribution in one auditable document
- Playwright Test Agents' plan->generate->heal workflow as skill content, not actual agent delegation (Generator writes tests following the pattern, doesn't spawn sub-agents)
- Bug #25834 workaround: dual mechanism (skills frontmatter for future + Read fallback for now)
- Testing Trophy preferred for frontend apps, Pyramid for backend/CLI -- decision framework, not prescription
- Behavior-over-implementation testing principle for round resilience: tests verify SPEC.md requirements, survive Generator rewrites across rounds

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- generator.md: existing agent definition with build process, self-test, fix-only mode. Restructure to add progressive CI integration, asset pipeline, lean skill routing.
- appdev-cli.mjs: existing CLI with state management, score extraction, convergence detection. Extend with `check-assets` command.
- browser-prompt-api/SKILL.md, browser-webllm/SKILL.md, browser-webnn/SKILL.md: existing AI skills. No changes needed -- Generator references them via Read fallback.
- ASSETS-TEMPLATE.md: new reference file for asset manifest format.
- frontend-design-principles.md: existing reference already read by Generator in Step 4.
- EVALUATION-TEMPLATE.md: existing reference -- no changes in Phase 4 (Evaluator doesn't change).

### Established Patterns
- Phase 02.1 pattern: structural guidance in reference files, behavioral guidance in agent definitions. Apply to ASSETS-TEMPLATE.md, testing skills.
- angular-developer meta-skill pattern: lean SKILL.md routing doc + references for progressive disclosure. Apply to playwright-testing skill.
- `${CLAUDE_PLUGIN_ROOT}` for referencing plugin-bundled files in agent definitions.
- Two-layer enforcement: tool allowlists + prompt guards per agent (Phase 1). Generator tools unchanged: `Read, Write, Edit, Glob, Bash`.
- HTML comments mark regex-sensitive sections in template files (Phase 02.1).
- appdev-cli JSON output protocol: structured JSON to stdout, exit code for success/failure (Phase 2).

### Integration Points
- generator.md: major rewrite -- add progressive CI integration, testing decision framework, asset pipeline, lean skill routing, skills frontmatter, Vite+ preference, latest-stable-versions instruction, ASSETS.md creation step
- appdev-cli.mjs: extend with `check-assets` command (parse ASSETS.md, curl-verify URLs, content-type checks, structured JSON output)
- New file: references/ASSETS-TEMPLATE.md (asset manifest table format)
- New skill: skills/playwright-testing/ (SKILL.md + 3 references)
- New skill: skills/vitest-browser/ (SKILL.md)
- New skill: skills/vite-plus/ (SKILL.md, possibly with references)
- Plugin manifest (plugin.json): no changes needed (skills auto-discovered from skills/ directory)

</code_context>

<deferred>
## Deferred Ideas

### Phase 5 (Optimize Agent Definitions)
- **EVAL-06 (Evaluator cross-referencing ASSETS.md):** Evaluator gains manifest cross-referencing for asset validation. Phase 3 is complete; Evaluator already validates assets comprehensively without the manifest.
- **Progressive disclosure for agent definitions:** Round-conditional instructions, AI-feature-conditional probing guidance. Phase 5's core scope.
- **Skill extraction for context-heavy guidance:** Move large instruction blocks to skills invoked on demand. Phase 5's core scope.

### Future milestone
- **Playwright Test Agents skill updates:** Update testing skills based on future Playwright Test Agents releases. Skills created in Phase 4 are based on current (March 2026) docs.
- **skills frontmatter bug fix:** When bug #25834 is fixed, remove Read fallback instructions from generator.md and rely on skills frontmatter injection. Track at https://github.com/anthropics/claude-code/issues/25834.
- **AI-IMPLEMENTATION-REFERENCE.md:** Generator reference listing how to implement real AI features per category/modality (deferred from Phase 3 CONTEXT.md).
- **Planner AI feature categories reference:** AI-FEATURES-REFERENCE.md with few-shot examples. Taxonomy research ready (research/ai-feature-taxonomy.md).

</deferred>

---

*Phase: 04-generator-hardening-and-skills*
*Context gathered: 2026-03-29*
