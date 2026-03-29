# Phase 4: Generator Hardening and Skills - Research

**Researched:** 2026-03-29
**Domain:** Generator CI integration, testing skills, asset sourcing, Vite+ toolchain, AI skill wiring
**Confidence:** HIGH

## Summary

Phase 4 transforms the Generator from a build-only agent into a quality-aware agent with progressive CI integration, real testing capabilities, verified asset sourcing, and correct modern toolchain usage. The research covers six interconnected domains: (1) progressive CI self-checks via a testing decision framework, (2) Vitest 4.1 Browser Mode for integration testing components that use browser AI APIs, (3) Playwright Test Agents (plan/generate/heal pattern) for e2e testing, (4) a four-layer asset sourcing pipeline with automated URL verification, (5) the Vite+ alpha unified toolchain with `vp` CLI, and (6) AI skill wiring via frontmatter + Read fallback.

All technologies are current and verified against official sources as of March 2026. Vitest 4.1 (released March 12, 2026) is bundled with Vite+ alpha. Playwright 1.58.x is the current stable release with Test Agents available since 1.56. Vite+ is alpha-quality but functional for the Generator's greenfield project scaffolding use case.

**Primary recommendation:** Build three new skills (playwright-testing, vitest-browser, vite-plus), extend generator.md with progressive CI integration and asset pipeline, and add a `check-assets` command to appdev-cli.mjs. Keep all changes on the Generator side -- Evaluator is unchanged (Phase 3 complete).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- CI self-checks use progressive quality integration (GAN progressive growing analog): quality checks enter the workflow when meaningful, not bolted on at the end. Build verification is integrated into development, not a post-hoc gate. Other CI checks are diagnostic, not gates.
- Testing strategy uses a decision framework: Generator analyzes SPEC.md app type during project setup and chooses test emphasis (Testing Trophy for frontend SPA, Pyramid for CLI/backend, etc.).
- Testing toolchain: Vitest as unified test runner with projects config splitting unit (node) and browser tests. Vitest 4.x Browser Mode with @vitest/browser-playwright provider and branded browser channels. Playwright Test as e2e framework.
- Framework-specific render packages: vitest-browser-react, vitest-browser-vue, vitest-browser-svelte, vitest-browser-angular.
- Asset sourcing uses four-layer pipeline: knowledge layer (generator.md examples), documentation layer (ASSETS.md manifest), automated verification (appdev-cli check-assets), visual verification (playwright-cli screenshots).
- Browser AI skill wiring uses dual mechanism: skills frontmatter + Read fallback (bug #25834 workaround).
- Playwright testing skill uses angular-developer meta-skill pattern (lean SKILL.md + 3 references).
- Vitest browser skill is self-contained SKILL.md (~200-300 lines).
- Vite+ skill structure determined during planning based on content size.
- Two new testing skills and vite-plus skill added to generator.md skills frontmatter.
- EVAL-06 (Evaluator cross-referencing ASSETS.md) deferred.
- Pre-handoff diagnostic: full battery one final time (build, typecheck, lint, all tests, all e2e). Fix quick wins, document rest, always hand off.
- When app does not start (build fails at diagnostic): always hand off to Evaluator anyway.

### Claude's Discretion
- Exact content and structure of playwright-testing references (test-planning.md, test-generation.md, test-healing.md)
- Exact content and structure of vitest-browser SKILL.md
- Vite+ skill structure (self-contained vs meta-skill) based on content size during planning
- Exact ASSETS-TEMPLATE.md column set and format
- appdev-cli check-assets implementation details (flags, output format, error handling)
- Which viewport sizes the Generator uses for visual self-assessment
- How the Generator documents CI diagnostic results for the Evaluator

### Deferred Ideas (OUT OF SCOPE)
- EVAL-06 (Evaluator cross-referencing ASSETS.md) -- Phase 5
- Progressive disclosure for agent definitions -- Phase 5
- Skill extraction for context-heavy guidance -- Phase 5
- Playwright Test Agents skill updates for future Playwright releases -- future milestone
- skills frontmatter bug fix (remove Read fallback when #25834 fixed) -- future milestone
- AI-IMPLEMENTATION-REFERENCE.md -- future milestone
- Planner AI feature categories reference -- future milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | Generator runs CI checks (typecheck, build, lint, test) as inner feedback loop before handing off to Evaluator | Progressive CI integration pattern, Vitest 4.1 projects config for unit+browser split, Playwright Test Agents for e2e, `vp check` for unified static checks, `agent` reporter for token efficiency |
| GEN-02 | Generator has browser-* AI skills preloaded via skills frontmatter for real AI features | Dual mechanism (skills frontmatter + Read fallback) pattern, existing browser-prompt-api/webllm/webnn skills unchanged, lean routing in generator.md Step 6 |
| GEN-03 | Generator is aware of image sourcing approaches as examples, not prescriptions | Four-layer asset pipeline (knowledge + documentation + automated + visual verification), ASSETS-TEMPLATE.md reference file pattern |
| GEN-04 | Generator prefers Vite+ over Vite for greenfield web projects (preference, not mandate) | Vite+ alpha CLI commands (`vp create/dev/check/test/build`), framework support (React, Vue, Svelte, react-router, TanStack Start, Nuxt), known limitations (alpha status, Angular/Nuxt/TanStack Start incomplete), fallback to plain Vite |
| GEN-05 | Generator must not fabricate/hallucinate image URLs -- all external URLs must be verified accessible | `appdev-cli check-assets` command using Node.js fetch HEAD requests, content-type validation, soft-404 detection, visual verification via playwright-cli screenshots |
| GEN-06 | Generator uses latest stable versions of chosen frameworks/libraries unless user prompt specifies otherwise | Simple behavioral instruction in generator.md -- no skill or reference needed |
| SKILL-01 | Vite+ skill bundled with plugin providing correct vp CLI usage, config format, and toolchain docs | vp CLI commands verified against official docs, vite.config.ts unified config, bundled tools (Vite 8, Vitest 4.1, Oxlint 1.52, Oxfmt beta), framework templates, tsgo type checking |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 4.1.x | Unified test runner (unit + browser) | Bundled with Vite+, stable Browser Mode since 4.0, `projects` config for splitting test environments, `agent` reporter for AI coding agents |
| @vitest/browser-playwright | latest (4.x-compatible) | Browser test provider | Playwright provider enables real browser execution with branded channels (chrome, msedge) for browser AI API access |
| Playwright Test | 1.58.x | E2e test framework + Test Agents | Plan/generate/heal agent pattern since 1.56, accessibility-tree-first execution, Claude Code integration via init-agents |
| @playwright/cli | latest | Token-efficient browser automation CLI | Used by Generator for visual self-assessment and by Evaluator for testing -- already a project devDependency |
| Vite+ (vite-plus) | alpha | Unified toolchain (dev/check/test/build) | Single `vp` CLI replaces ESLint+Prettier+tsc+Vite+Vitest -- bundled Vite 8, Vitest 4.1, Oxlint 1.52, Oxfmt beta, tsgo type checking |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest-browser-react | latest (4.x) | React component rendering in browser tests | When generated app uses React |
| vitest-browser-vue | latest (4.x) | Vue component rendering in browser tests | When generated app uses Vue |
| vitest-browser-svelte | latest (4.x) | Svelte component rendering in browser tests | When generated app uses Svelte |
| vitest-browser-angular | latest (4.x) | Angular component rendering in browser tests | When generated app uses Angular |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite+ | Plain Vite + ESLint + Prettier + tsc | More configuration, slower checks, but stable and framework-agnostic. Fallback when Vite+ is incompatible. |
| Vitest Browser Mode | Testing Library + jsdom | Faster but no real browser APIs (LanguageModel, WebGPU, WebNN unavailable in jsdom). Use only for unit tests without browser API deps. |
| Playwright Test Agents | Manual Playwright test writing | More control but slower. Test Agents pattern is a skill, not actual agent delegation. |

## Architecture Patterns

### Generator Progressive CI Integration (4 phases)

```
Phase 1: Project Setup
|-- Configure ALL quality tooling alongside build toolchain
|-- Lint rules, typecheck config, test framework, e2e framework
|-- One coherent "development environment" commit
'-- Generator does NOT start writing features without quality feedback

Phase 2: Per-Feature Development (core loop)
|-- implement -> lint + typecheck -> write unit tests -> run all tests -> commit
|-- Fast checks (lint, typecheck) take seconds, catch issues while context fresh
'-- Running ALL tests (not just new) catches regressions

Phase 3: Integration
|-- After core features done: write e2e tests for key user flows
|-- Requires running app with multiple features working together
'-- Run them, fix what breaks

Phase 4: Pre-Handoff Diagnostic
|-- Full battery: build, typecheck, lint, all tests, all e2e
|-- One final regression sweep after everything integrated
|-- Fix quick wins in one pass, document the rest
'-- ALWAYS hand off to Evaluator (diagnostic, not gate)
```

### Vitest Projects Config (Unit + Browser Split)

```typescript
// vite.config.ts (or vitest.config.ts)
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          include: ['tests/unit/**/*.{test,spec}.ts'],
          name: 'unit',
          environment: 'node',
        },
      },
      {
        test: {
          include: ['tests/browser/**/*.{test,spec}.ts'],
          name: 'browser',
          browser: {
            enabled: true,
            provider: playwright({
              launchOptions: {
                channel: 'chrome',  // branded channel for browser AI APIs
              },
            }),
            instances: [
              { browser: 'chromium' },
            ],
          },
        },
      },
    ],
  },
})
```

Source: https://vitest.dev/guide/browser/ and https://vitest.dev/config/browser/playwright

### Playwright Test Agents File Structure

```
project/
|-- specs/               # Human-readable test plans (Markdown)
|   '-- basic-operations.md
|-- tests/               # Generated Playwright tests
|   |-- seed.spec.ts     # Environment setup test (fixtures, base URL)
|   '-- checkout/
|       '-- guest-checkout.spec.ts
|-- playwright.config.ts
'-- .github/             # Agent definitions (generated by init-agents)
```

Source: https://playwright.dev/docs/test-agents

### Asset Sourcing Pipeline

```
Layer 1: Knowledge (generator.md)
|-- Examples of sourcing approaches (not prescriptions)
|-- Web search with license check
|-- Build-time generation (npm packages, canvas/SVG)
|-- Browser AI + playwright screenshot
|-- Procedural/SVG generation
'-- Stock photo APIs with attribution

Layer 2: Documentation (ASSETS.md)
|-- Generator produces manifest of all static assets
|-- Markdown table: Asset, Type, Source, License, Attribution, URL, Verified
'-- Template in references/ASSETS-TEMPLATE.md

Layer 3: Automated Verification (appdev-cli check-assets)
|-- Parse ASSETS.md for external URLs
|-- fetch HEAD request for each URL
|-- Check content-type (detect soft-404s: CDN returning text/html for images)
|-- Structured JSON output (consistent with appdev-cli protocol)
'-- Exit code 0/1 for success/failure

Layer 4: Visual Verification (generator.md)
|-- Generator screenshots own app at key viewports
|-- Inspects for broken images, layout issues, placeholder patterns
|-- Uses npx playwright-cli screenshot + Claude visual capabilities
'-- Part of pre-handoff diagnostic
```

### Skill Organization

```
plugins/application-dev/skills/
|-- application-dev/         # Existing orchestrator skill
|-- browser-prompt-api/      # Existing AI skill (unchanged)
|-- browser-webllm/          # Existing AI skill (unchanged)
|-- browser-webnn/           # Existing AI skill (unchanged)
|-- playwright-testing/      # NEW: meta-skill (SKILL.md + 3 references)
|   |-- SKILL.md             # ~100-150 lines: routing, when to plan/generate/heal
|   '-- references/
|       |-- test-planning.md    # How to explore app and create test plans
|       |-- test-generation.md  # How to write Playwright test files from plans
|       '-- test-healing.md     # How to run, diagnose, fix, re-run tests
|-- vitest-browser/          # NEW: self-contained SKILL.md (~200-300 lines)
|   '-- SKILL.md             # Config, providers, branded channels, render packages
'-- vite-plus/               # NEW: structure TBD during planning
    '-- SKILL.md             # vp CLI commands, vite.config.ts, framework support
```

### Anti-Patterns to Avoid

- **Retry loop for CI failures:** The Generator does NOT have a post-hoc retry loop. CI checks are progressive -- integrated into development, not bolted on at the end. The final diagnostic is a regression sweep, not the first time checks run.
- **CI as gate:** CI checks (other than build) are diagnostic, not gates. Failures do not block handoff to Evaluator. The GAN loop stays intact.
- **jsdom for browser API tests:** Components using LanguageModel, WebGPU, WebNN cannot be tested in jsdom/happy-dom. Vitest Browser Mode with branded channels is the only viable approach.
- **Spawning actual Playwright Test Agent sub-agents:** The Generator follows the plan/generate/heal pattern as a skill -- it writes tests following the workflow, it does not spawn Playwright's Claude Code sub-agents.
- **Prescriptive asset sourcing:** Generator.md provides examples, not mandates. The Generator remains tech-stack-agnostic in its sourcing choices.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unit + browser test splitting | Custom test runner orchestration | Vitest `projects` config | Built-in multi-project support handles environment isolation, parallel execution, shared config |
| Browser test execution | Puppeteer scripts or jsdom workarounds | @vitest/browser-playwright provider | Real browser execution with branded channel support for AI APIs |
| E2e test authoring pattern | Custom test scaffolding | Playwright Test Agents plan/generate/heal pattern as skill content | Proven workflow: plan from SPEC.md, generate with live validation, heal on failure |
| Lint + format + typecheck | ESLint + Prettier + tsc as separate tools | `vp check` (when using Vite+) | Single command, 50-100x faster lint, 30x faster format, native tsgo typecheck |
| URL verification | Custom curl wrapper | Node.js fetch with HEAD method | Built into runtime, handles redirects, content-type checking, timeout via AbortController |
| Soft-404 detection | Status code check only | Content-Type header inspection | CDNs often return 200 with text/html for missing assets; checking content-type catches this |
| Token-efficient test output | Custom reporter or output filtering | Vitest `agent` reporter | Auto-detects AI agent environment, shows only failed tests, reduces token usage significantly |

**Key insight:** The Generator's CI integration is primarily about orchestrating existing tools in the right order, not building custom tooling. Vitest, Playwright, and Vite+ provide all the capabilities -- the skill content teaches the Generator WHEN and HOW to use them.

## Common Pitfalls

### Pitfall 1: Branded Browser Channel Not Available
**What goes wrong:** Vitest Browser Mode configured with `channel: 'chrome'` but Google Chrome is not installed on the machine. Test fails to launch.
**Why it happens:** Branded channels (`chrome`, `msedge`) require the actual browser installation -- they are not downloaded by Playwright like bundled Chromium/WebKit/Firefox.
**How to avoid:** Generator should attempt branded channel first, fall back to bundled `chromium` if unavailable. Document the fallback in the vitest-browser skill.
**Warning signs:** `browserType.launch` error mentioning missing executable.

### Pitfall 2: Vitest Browser Mode Isolation Scope
**What goes wrong:** Tests interfere with each other because developers expect per-test isolation.
**Why it happens:** Unlike Playwright Test runner, Vitest Browser Mode opens a single page per test file, not per test. Isolation is file-level, not test-level.
**How to avoid:** Document this in vitest-browser skill. Group tests that share state into the same file. Use cleanup between tests.
**Warning signs:** Tests pass individually but fail when run together.

### Pitfall 3: Vite+ Alpha Instability
**What goes wrong:** `vp create` or `vp check` fails for certain framework/configuration combinations.
**Why it happens:** Vite+ is alpha software. Known incomplete support for Angular, Nuxt, TanStack Start configurations. Oxlint cannot lint Vue/Svelte templates (only script parts).
**How to avoid:** Generator.md instruction: prefer Vite+ for greenfield projects but fall back to plain Vite when Vite+ is incompatible. Compatibility-conditional preference, not mandate.
**Warning signs:** `vp check` errors on framework-specific syntax, `vp create` template not available.

### Pitfall 4: Playwright Test Agents Overkill for Simple Apps
**What goes wrong:** Generator spends excessive tokens running the full plan/generate/heal loop for a simple single-page app.
**Why it happens:** The pattern is designed for complex multi-page flows. Simple apps don't need test plans -- direct test writing is faster.
**How to avoid:** Testing decision framework in Generator: only use Playwright Test Agents pattern for apps with 3+ pages or complex user flows. Simple apps get direct Playwright tests.
**Warning signs:** Test plan document is longer than the tests themselves.

### Pitfall 5: Asset URL Verification False Positives
**What goes wrong:** `check-assets` reports valid URLs as broken because server blocks HEAD requests or requires specific User-Agent.
**Why it happens:** Some CDNs and image hosts reject HEAD requests or return different status codes for programmatic access.
**How to avoid:** Fallback chain: HEAD request first, then GET with User-Agent header if HEAD returns 403/405. Include timeout via AbortController (5 second default). Report unreachable URLs as warnings, not errors.
**Warning signs:** Known-working URLs reported as broken.

### Pitfall 6: Instance-Level Overrides Don't Merge in Vitest
**What goes wrong:** Per-instance browser options completely replace parent options instead of merging.
**Why it happens:** Vitest design decision -- instance-level options are a full replacement, not a merge.
**How to avoid:** Document this behavior prominently in vitest-browser skill. When overriding per-instance, repeat ALL needed options.
**Warning signs:** Options set at parent level silently disappear for specific instances.

### Pitfall 7: tsgo/tsgolint Angular Incompatibility
**What goes wrong:** `vp check` type checking fails on Angular projects because tsgo does not support Angular's decorator metadata or custom compiler transformations.
**Why it happens:** tsgo (TypeScript Go port) is experimental. Angular requires specific compiler plugins (ngc) that tsgo does not support yet.
**How to avoid:** Vite+ skill explicitly lists framework compatibility. Generator falls back to `npx tsc --noEmit` for Angular projects.
**Warning signs:** Type errors on valid Angular code, missing decorator metadata.

## Code Examples

### Vitest 4.1 Projects Config with Branded Browser Channels

```typescript
// vitest.config.ts
// Source: https://vitest.dev/guide/browser/ + https://vitest.dev/config/browser/playwright
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          include: [
            'tests/unit/**/*.{test,spec}.ts',
            'tests/**/*.unit.{test,spec}.ts',
          ],
          name: 'unit',
          environment: 'node',
        },
      },
      {
        test: {
          include: [
            'tests/browser/**/*.{test,spec}.ts',
            'tests/**/*.browser.{test,spec}.ts',
          ],
          name: 'browser',
          browser: {
            enabled: true,
            provider: playwright({
              launchOptions: {
                channel: 'chrome', // branded channel for LanguageModel, WebGPU, WebNN
              },
              actionTimeout: 5_000,
            }),
            instances: [
              { browser: 'chromium' },
            ],
          },
        },
      },
    ],
  },
})
```

### Vitest 4.1 Agent Reporter (Token-Efficient Output)

```bash
# Auto-detects AI agent environment and uses agent reporter
vitest run

# Explicit agent reporter
vitest run --reporter=agent

# Force agent reporter via environment variable
AI_AGENT=1 vitest run
```

The `agent` reporter only prints failing tests and the final summary, suppressing console logs from passing tests. Auto-enabled when Vitest detects it is running inside an AI coding agent.

Source: https://github.com/vitest-dev/vitest/pull/9779

### Component Testing with vitest-browser-react

```typescript
// tests/browser/ai-chat.browser.test.tsx
// Source: https://vitest.dev/guide/browser/component-testing
import { render } from 'vitest-browser-react'
import { expect, test } from 'vitest'
import { AIChatPanel } from '../src/components/AIChatPanel'

test('renders AI chat panel with loading state when model downloads', async () => {
  const screen = await render(<AIChatPanel />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('Downloading model')
})
```

### Playwright Test Agents Initialization

```bash
# Initialize agent definitions for Claude Code integration
npx playwright init-agents --loop=claude

# This creates:
# .github/          - Agent definitions (Markdown files)
# tests/seed.spec.ts - Environment setup test
# specs/            - Directory for test plans
```

Source: https://playwright.dev/docs/test-agents

### appdev-cli check-assets (Implementation Pattern)

```javascript
// Conceptual pattern for check-assets command
// Uses Node.js built-in fetch (no dependencies)

async function checkUrl(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // Try HEAD first (fast, no body download)
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    // Fallback to GET if server rejects HEAD
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'appdev-cli/1.0' },
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');
    const isSoft404 = !isImage && url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i);

    return {
      url,
      status: response.status,
      ok: response.ok && !isSoft404,
      contentType,
      soft404: isSoft404,
      error: null,
    };
  } catch (err) {
    return {
      url,
      status: null,
      ok: false,
      contentType: null,
      soft404: false,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}
```

### Vite+ Project Scaffolding

```bash
# Install vp globally
# macOS/Linux: curl -fsSL https://vite.plus | bash
# Windows: irm https://vite.plus/ps1 | iex

# Create new project interactively
vp create

# Create with specific template
vp create vite
vp create react-router
vp create vue
vp create svelte

# Development workflow
vp dev                    # Start dev server (Vite 8)
vp check                  # Format (Oxfmt) + Lint (Oxlint) + Typecheck (tsgo)
vp check --fix            # Auto-fix lint and format issues
vp test                   # Run tests (Vitest 4.1)
vp build                  # Production build (Rolldown)

# Migration from existing Vite project
vp migrate
```

Source: https://viteplus.dev/guide/ and https://voidzero.dev/posts/announcing-vite-plus-alpha

### Vite+ Unified Configuration

```typescript
// vite.config.ts -- single config for entire toolchain
// Source: https://voidzero.dev/posts/announcing-vite-plus-alpha
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Lint/format/typecheck configuration
  lint: {
    options: {
      typeAware: true,   // Enable type-aware lint rules
      typeCheck: true,    // Enable full tsgo type checking in vp check
    },
  },

  // Test configuration (Vitest 4.1)
  test: {
    // ... Vitest config
  },

  // Task runner configuration
  run: {
    tasks: {
      'check-assets': {
        command: 'node scripts/check-assets.mjs',
        cache: false,
      },
    },
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint + Prettier + tsc (3 tools) | `vp check` (single command: Oxlint + Oxfmt + tsgo) | March 2026 (Vite+ alpha) | 50-100x faster lint, 30x faster format, native typecheck speed |
| Vitest Browser Mode experimental | Vitest 4.0 stable Browser Mode | December 2025 (Vitest 4.0) | Separate provider packages (@vitest/browser-playwright), stable API |
| jsdom/happy-dom for component tests | Vitest Browser Mode with real browser | Vitest 4.0+ | Accurate browser API access, real CSS rendering, branded channel support |
| Manual Playwright test writing | Playwright Test Agents (plan/generate/heal) | October 2025 (Playwright 1.56) | AI-assisted test lifecycle, accessibility-tree-first, self-healing |
| Vitest verbose output for all tests | `agent` reporter (failed tests only) | March 2026 (Vitest 4.1) | Significant token reduction for AI coding agents |
| Vitest 4.0 Browser Mode | Vitest 4.1 Browser Mode enhancements | March 2026 | detailsPanelPosition, OpenTelemetry, coverage HTML, trace view improvements |
| Playwright provider string config | Playwright provider factory function | Vitest 4.0 | `playwright()` instead of `provider: 'playwright'`, typed options |

**Deprecated/outdated:**
- **`provider: 'playwright'` (string):** Use `provider: playwright()` (factory function import) in Vitest 4.x
- **`browser.name` config:** Use `browser.instances: [{ browser: 'chromium' }]` in Vitest 4.x
- **`topK`/`temperature` on LanguageModel.create():** Deprecated in web page contexts (only Chrome Extensions)
- **Legacy playwright-cli (arjunattam/playwright-cli-1):** Use `@playwright/cli` (Microsoft's current package)

## Open Questions

1. **Vite+ Angular Compatibility**
   - What we know: Vite+ is alpha, works with React/Vue/Svelte/react-router. Angular support is unclear -- tsgo does not fully support Angular's compiler plugins.
   - What's unclear: Whether `vp create` has an Angular template, whether `vp check` works with Angular projects at all.
   - Recommendation: Generator.md should explicitly state that Vite+ falls back to plain Vite for Angular projects. LOW confidence on Angular+Vite+ compatibility. Validate during implementation.

2. **Vite+ Oxlint Vue/Svelte Template Linting**
   - What we know: Oxlint cannot support JS plugins with custom parsers, so linting Vue/Svelte templates does not work yet (script parts work fine).
   - What's unclear: Whether this is a blocker for real-world usage or just limits template-level linting.
   - Recommendation: Document this limitation in vite-plus skill. Generator should not rely on Oxlint for template-specific lint rules.

3. **check-assets CORS Behavior**
   - What we know: Server-side Node.js fetch does not have CORS restrictions. But some image hosts block non-browser User-Agents or reject HEAD requests.
   - What's unclear: What percentage of real-world image URLs will have false-positive failures.
   - Recommendation: Implement fallback chain (HEAD -> GET with UA) and report unreachable URLs as warnings. Validate against real generated app URLs during testing.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (for appdev-cli unit tests) |
| Config file | none -- appdev-cli.mjs is zero-dependency CJS/ESM |
| Quick run command | `node --test tests/appdev-cli.test.mjs` |
| Full suite command | `node --test tests/` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-01 | Progressive CI integration instructions in generator.md | manual-only | Manual review of generator.md content | N/A |
| GEN-02 | AI skills frontmatter + Read fallback in generator.md | manual-only | Manual review of generator.md frontmatter and Step 6 | N/A |
| GEN-03 | Asset sourcing examples in generator.md + ASSETS-TEMPLATE.md | manual-only | Manual review of generator.md and template | N/A |
| GEN-04 | Vite+ preference instruction in generator.md | manual-only | Manual review of generator.md | N/A |
| GEN-05 | check-assets command in appdev-cli.mjs | unit | `node --test tests/appdev-cli-check-assets.test.mjs` | -- Wave 0 |
| GEN-06 | Latest stable version instruction in generator.md | manual-only | Manual review of generator.md | N/A |
| SKILL-01 | vite-plus skill SKILL.md content | manual-only | Manual review of skill content | N/A |

### Sampling Rate
- **Per task commit:** `node --test tests/appdev-cli-check-assets.test.mjs` (for GEN-05 only)
- **Per wave merge:** Full manual review of all skill content + generator.md changes
- **Phase gate:** All skills exist with correct structure, generator.md has all new sections, check-assets unit tests pass

### Wave 0 Gaps
- [ ] `tests/appdev-cli-check-assets.test.mjs` -- unit tests for check-assets command (GEN-05)
- [ ] Test fixtures: sample ASSETS.md files (valid, invalid, mixed URLs)

Note: Most Phase 4 requirements are agent instruction content (Markdown), not executable code. Only GEN-05 (check-assets) produces testable code. The remaining requirements are validated through manual review of generated skill/agent content against CONTEXT.md decisions.

## Sources

### Primary (HIGH confidence)
- [Vitest official docs - Browser Mode](https://vitest.dev/guide/browser/) -- projects config, provider setup, instances
- [Vitest official docs - Playwright provider config](https://vitest.dev/config/browser/playwright) -- launchOptions, channel, connectOptions, actionTimeout, persistentContext
- [Vitest 4.1 blog post](https://vitest.dev/blog/vitest-4-1) -- agent reporter, test tags, detailsPanelPosition, aroundAll/aroundEach hooks, vi.defineHelper
- [Vitest Component Testing guide](https://vitest.dev/guide/browser/component-testing) -- render packages, testing patterns
- [Playwright Test Agents docs](https://playwright.dev/docs/test-agents) -- init-agents, planner/generator/healer, specs/, tests/seed.spec.ts
- [Vite+ official guide](https://viteplus.dev/guide/) -- vp CLI commands, installation
- [Vite+ create guide](https://viteplus.dev/guide/create) -- templates, framework support
- [Vite+ check guide](https://viteplus.dev/guide/check) -- Oxlint + Oxfmt + tsgo unified check
- [VoidZero announcement](https://voidzero.dev/posts/announcing-vite-plus-alpha) -- bundled tool versions, vite.config.ts, framework ecosystem
- [Vitest agent reporter PR #9779](https://github.com/vitest-dev/vitest/pull/9779) -- implementation details, auto-detection

### Secondary (MEDIUM confidence)
- [Vitest Browser Mode branded browser channels issue #9780](https://github.com/vitest-dev/vitest/issues/9780) -- feature request context for branded channels
- [Playwright dev.to article](https://dev.to/playwright/playwright-agents-planner-generator-and-healer-in-action-5ajh) -- practical Test Agents usage patterns
- [QA Skills - Playwright Agents + Claude](https://qaskills.sh/blog/playwright-test-agents-claude-code) -- Claude Code integration patterns
- [Angular tsgo support issue #61634](https://github.com/angular/angular/issues/61634) -- Angular+tsgo compatibility status

### Tertiary (LOW confidence)
- Vite+ framework-specific limitations (Angular, Nuxt, TanStack Start) -- inferred from absence of documentation rather than explicit "not supported" statements. Needs validation during implementation.
- Oxlint Vue/Svelte template linting limitation -- mentioned in a single dev.to article, not confirmed in official Oxlint docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against official docs and release announcements
- Architecture: HIGH -- progressive CI pattern, Vitest projects config, and Playwright Test Agents pattern all verified with official documentation
- Pitfalls: HIGH -- branded channel behavior, instance override semantics, and Vite+ alpha status all documented in official sources
- Vite+ framework compatibility: MEDIUM -- alpha status means things change rapidly; Angular/Nuxt support specifically LOW confidence
- check-assets implementation: MEDIUM -- standard Node.js fetch patterns, but real-world URL verification edge cases need validation

**Research date:** 2026-03-29
**Valid until:** 2026-04-15 (Vite+ alpha evolves rapidly; Vitest 4.1 and Playwright 1.58 are stable)
