---
name: playwright-testing
description: >
  This skill should be used when the Generator agent needs to write end-to-end
  tests using Playwright Test. Covers the full plan/generate/heal workflow:
  creating test plans from SPEC.md, writing Playwright test files from plans,
  and running a diagnose/fix/re-run healing loop. Uses the Playwright Test
  Agents pattern (plan -> generate -> heal) as a skill -- the Generator follows
  the pattern itself, it does NOT spawn Playwright's actual Claude Code
  sub-agents. Trigger when: SPEC.md requires e2e tests, app has user flows
  that need multi-page navigation testing, or the Generator is in the
  integration or pre-handoff diagnostic phase of CI. Do NOT trigger for unit
  tests (use Vitest) or browser integration tests for components using browser
  AI APIs (use vitest-browser skill).
---

# Playwright Testing Skill

Framework: [Playwright Test](https://playwright.dev/) (1.58+)
Pattern: [Playwright Test Agents](https://playwright.dev/docs/test-agents) (plan/generate/heal)

This skill defines a three-phase workflow for end-to-end testing with
Playwright Test. The Generator follows this pattern as a skill -- it reads
test plans, writes test files, and heals failures. It does **not** use
`npx playwright init-agents` or spawn actual Playwright agent sub-processes.

---

## 1. When to use this skill

### Full plan/generate/heal workflow

Use the full three-phase workflow when:

- The app has 3 or more pages or routes
- User flows span multiple pages (checkout, onboarding, multi-step forms)
- SPEC.md describes complex interactions (drag-and-drop, real-time updates)
- The app has authentication or authorization flows

### Direct test writing (skip planning)

Write Playwright tests directly without a test plan when:

- The app is a single-page application with few interactions
- There are only 1-2 obvious user flows
- The test plan would be shorter than the tests themselves

Even when skipping planning, follow the generation and healing references
for writing and debugging tests.

---

## 2. File conventions

```
project/
|-- specs/                  # Test plans (Markdown)
|   |-- checkout-flow.md
|   '-- user-onboarding.md
|-- tests/                  # Generated Playwright test files
|   |-- seed.spec.ts        # Environment setup test (always first)
|   |-- checkout/
|   |   '-- guest-checkout.spec.ts
|   '-- onboarding/
|       '-- new-user.spec.ts
'-- playwright.config.ts    # Playwright configuration
```

- **specs/** -- Markdown test plans. One file per major flow or feature area.
  Created during the planning phase. The Generator reads these to write tests.
- **tests/** -- Playwright test files. Mirror the specs/ structure where
  practical. One file per flow or closely related group of assertions.
- **seed.spec.ts** -- Environment setup test. Verifies the app is running,
  the base URL responds, and no console errors appear on initial load.
  Always created first, always runs first.
- **playwright.config.ts** -- Playwright configuration at the project root.

---

## 3. Three phases

### Phase 1: Planning

Explore the running app and create test plans from SPEC.md. Plans define
what to test -- flows, preconditions, steps, and expected outcomes.

Read `references/test-planning.md` for the complete planning workflow.

### Phase 2: Generation

Write Playwright test files from test plans (or directly from SPEC.md for
simple apps). Follow accessibility-tree-first selectors, behavior-focused
assertions, and the seed.spec.ts pattern.

Read `references/test-generation.md` for the complete generation workflow.

### Phase 3: Healing

Run tests, collect failures, diagnose root causes, fix tests or app code,
and re-run until tests pass. The healing loop is: run -> diagnose -> fix ->
re-run.

Read `references/test-healing.md` for the complete healing workflow.

---

## 4. Playwright configuration

Minimal `playwright.config.ts` for generated apps:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

Default channel is `msedge` for Phi-4-mini AI API access. If Edge is
unavailable, fall back to `channel: 'chrome'` (Gemini Nano), then omit
`channel` for bundled Chromium (no AI API access).

Adjust `baseURL` and `webServer.command` to match the generated app's dev
server. Use `workers: 1` during generation and healing for deterministic
execution; increase for CI after tests are stable.

---

## 5. Key principles

- **SPEC.md is the test oracle.** User stories and acceptance criteria in
  SPEC.md define what tests verify. Tests assert SPEC.md requirements, not
  implementation details.

- **Accessibility-tree-first selectors.** Prefer `getByRole()`,
  `getByLabel()`, `getByText()`, and `getByPlaceholder()` over CSS
  selectors, XPath, or `data-testid`. Accessible selectors survive UI
  redesigns and align with how users interact with the app.

- **Behavior-testing over implementation-testing.** Tests verify what the
  user sees and can do, not internal state or DOM structure. This makes
  tests resilient across generation rounds -- implementation changes in
  fix-only mode (rounds 2+) do not break behavior-focused tests.

- **The Generator follows the pattern as a skill.** The Generator reads
  SPEC.md, writes test plans, generates test files, and heals failures
  using the guidance in references. It does NOT use
  `npx playwright init-agents`, does NOT spawn Playwright's actual Claude
  Code sub-agents, and does NOT delegate to external test agent processes.

- **Coverage priority.** Core user flows first (the paths most users take),
  then feature-specific flows (secondary features), then edge cases. Do
  not aim for exhaustive coverage -- the Evaluator catches what tests miss.

- **One concern per test file.** Each test file covers one flow or one
  closely related group of behaviors. This keeps files focused and makes
  failures easy to diagnose.
