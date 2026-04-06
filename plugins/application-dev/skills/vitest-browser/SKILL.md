---
name: vitest-browser
description: >
  This skill should be used when the Generator agent needs to configure and
  write browser integration tests using Vitest 4.x Browser Mode. Covers the
  projects config (unit + browser split), branded browser channels for testing
  components that use browser AI APIs (LanguageModel, WebGPU, WebNN), framework-
  specific render packages, the agent reporter for token-efficient output, and
  isolation behavior. Trigger when: the generated app has components that use
  real browser APIs unavailable in jsdom/happy-dom, or when SPEC.md references
  visual rendering tests, CSS behavior, or real DOM testing.
---

# Vitest Browser Mode Skill

Docs: https://vitest.dev/guide/browser/
Provider config: https://vitest.dev/config/browser/playwright
Component testing: https://vitest.dev/guide/browser/component-testing

This skill covers Vitest 4.x Browser Mode with the `@vitest/browser-playwright`
provider. Use it to integration-test components that rely on real browser APIs
that are unavailable in jsdom or happy-dom environments.

---

## 1. When to use

Use Vitest Browser Mode when the app under test has components that depend on:

- **Browser AI APIs** -- LanguageModel (Prompt API), WebGPU, WebNN
- **Visual rendering** -- CSS, canvas, SVG, animations
- **Real DOM behavior** -- IntersectionObserver, ResizeObserver, Web Audio,
  MediaDevices, Web Workers
- **Browser storage** -- IndexedDB, Cache API, Service Workers

Do NOT use for pure logic, data transforms, or utility functions. Those belong
in unit tests running under the `node` environment.

**Decision rule:** If the component calls a browser API that jsdom stubs as a
no-op or does not implement, use Browser Mode.

---

## 2. Vitest projects config (unit + browser split)

Split tests into two projects within a single Vitest configuration:

```typescript
// vite.config.ts (or vitest.config.ts)
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

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
                channel: 'msedge', // branded channel -- Edge ships Phi-4-mini for browser AI APIs
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
});
```

**Key points:**

- Import the provider as a factory function: `import { playwright } from '@vitest/browser-playwright'`
- Do NOT use the deprecated string format `provider: 'playwright'`
- Do NOT use the deprecated `browser.name` -- use `browser.instances` instead
- File location determines which environment runs the test

### Dependencies

```bash
npm install --save-dev @vitest/browser vitest @vitest/browser-playwright
```

---

## 3. Branded browser channels

Branded channels launch the user's installed browser instead of Playwright's
bundled Chromium. Required for testing browser AI APIs -- bundled Chromium
lacks LanguageModel, WebGPU compute shaders, and WebNN backends.

| Channel | Browser | AI APIs available |
|---------|---------|-------------------|
| `'msedge'` | Microsoft Edge (default) | LanguageModel (Phi-4-mini, 3.8B), WebGPU, WebNN |
| `'msedge-dev'` | Edge Dev | LanguageModel (latest), WebGPU, WebNN |
| `'chrome'` | Google Chrome | LanguageModel (Gemini Nano), WebGPU, WebNN |
| `'chrome-beta'` | Chrome Beta | LanguageModel (latest), WebGPU, WebNN |
| (omitted) | Bundled Chromium | WebGPU (limited), no LanguageModel, no WebNN |

Set the channel on the provider's `launchOptions`:

```typescript
provider: playwright({
  launchOptions: { channel: 'msedge' },
}),
```

### Fallback when branded channel is unavailable

If the browser is not installed, Playwright throws:
`browserType.launch: Executable doesn't exist at /path/to/msedge`

Fallback chain: msedge -> chrome -> bundled chromium. Use an environment
variable for CI/local flexibility:

```typescript
const channel = process.env.BROWSER_CHANNEL || 'msedge';

provider: playwright({
  launchOptions: {
    channel: channel === 'bundled' ? undefined : channel,
  },
}),
```

Fallback chain: `msedge` -> `chrome` -> `bundled`. When Edge is unavailable,
set `BROWSER_CHANNEL=chrome` (Gemini Nano). If neither branded browser is
installed, set `BROWSER_CHANNEL=bundled` (Playwright's bundled Chromium --
AI API tests will not work). Non-AI browser tests (DOM, CSS, canvas) work
fine with bundled Chromium.

### Headed mode for AI API testing

Built-in AI APIs require headed mode (`headless: false`). Add `headless: false`
to the provider's `launchOptions` alongside the channel when testing components
that use LanguageModel, Summarizer, Writer, or other on-device AI APIs:

```typescript
provider: playwright({
  launchOptions: {
    channel: 'msedge-dev',
    headless: false, // REQUIRED for Built-in AI APIs
    args: [
      '--enable-features=AIPromptAPI',
      '--disable-features=OnDeviceModelPerformanceParams',
    ],
    ignoreDefaultArgs: [
      '--disable-field-trial-config',
      '--disable-background-networking',
      '--disable-component-update',
    ],
  },
}),
```

Non-AI browser tests (DOM, CSS, canvas) work fine with the default headless
mode. Only add `headless: false` when the test file exercises AI APIs.

See `browser-built-in-ai/SKILL.md` section 6 for warm-up, persistent context,
and page navigation requirements.

---

## 4. Browser instances configuration

Instances define which browser engines to test against:

```typescript
browser: {
  instances: [{ browser: 'chromium' }],
},
```

### PITFALL: Instance-level overrides are full replacements, NOT merges

When you override options at the instance level, the instance options
**completely replace** the parent options:

```typescript
// WRONG -- provider launchOptions are LOST for this instance
instances: [
  { browser: 'chromium', launchOptions: { args: ['--disable-gpu'] } },
],

// CORRECT -- repeat all needed options at the instance level
instances: [
  { browser: 'chromium', launchOptions: { channel: 'msedge', args: ['--disable-gpu'] } },
],
```

---

## 5. Framework-specific render packages

| Framework | Package | Import |
|-----------|---------|--------|
| React | `vitest-browser-react` | `import { render } from 'vitest-browser-react'` |
| Vue | `vitest-browser-vue` | `import { render } from 'vitest-browser-vue'` |
| Svelte | `vitest-browser-svelte` | `import { render } from 'vitest-browser-svelte'` |
| Angular | `vitest-browser-angular` | `import { render } from 'vitest-browser-angular'` |

Install the one matching your framework:

```bash
npm install --save-dev vitest-browser-react  # React example
```

### Example: React component test

```tsx
// tests/browser/ai-chat.browser.test.tsx
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { AIChatPanel } from '../../src/components/AIChatPanel';

test('renders AI chat panel with loading state', async () => {
  const screen = await render(<AIChatPanel />);
  await expect.element(screen.getByRole('status')).toHaveTextContent('Downloading model');
});

test('displays AI response after prompt submission', async () => {
  const screen = await render(<AIChatPanel />);
  await screen.getByRole('textbox').fill('What is the capital of France?');
  await screen.getByRole('button', { name: 'Send' }).click();
  await expect.element(screen.getByRole('article')).toHaveTextContent('Paris');
});
```

### Assertion pattern

Use `expect.element()` for DOM assertions. Available matchers:
`toHaveTextContent()`, `toBeVisible()`, `toHaveAttribute()`,
`toContainElement()`, `toHaveClass()`.

Queries use Playwright's locator API: `getByRole()`, `getByText()`,
`getByTestId()`, `getByLabel()`, `getByPlaceholder()`.

---

## 6. Agent reporter for token-efficient output

The `agent` reporter only prints failing tests and the final summary --
significantly reduces token usage inside AI coding agents.

```bash
# Explicit
vitest run --reporter=agent

# Auto-detect via environment variable
AI_AGENT=1 vitest run
```

Vitest 4.1+ auto-detects the AI agent environment and uses the agent reporter
automatically inside Claude Code.

In config:

```typescript
reporters: process.env.AI_AGENT ? ['agent'] : ['default'],
```

**Suppresses:** console output from passing tests, individual pass results,
verbose timing. **Shows:** failing tests with errors and stack traces, final
summary with counts and duration.

---

## 7. Isolation behavior

Vitest Browser Mode isolates tests at the **file level**, not the test level.

- One browser page is opened per test file
- All tests within a file share the same page
- There is NO automatic cleanup between tests

**Group related tests** into the same file. **Clean up manually** between tests:

```typescript
import { afterEach } from 'vitest';

afterEach(() => {
  document.body.innerHTML = '';
});
```

Tests that need fully independent browser state belong in separate files.

This differs from Playwright Test, which opens a new page per test by default.

---

## 8. Key pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Branded channel not installed | `Executable doesn't exist at /path/to/google-chrome` | Fall back to bundled Chromium (`BROWSER_CHANNEL=bundled`). AI API tests will not work. |
| Instance overrides replace parent | Provider-level options silently disappear | Repeat ALL needed options at instance level (see Section 4) |
| jsdom cannot test browser AI APIs | `LanguageModel is not defined`, `navigator.gpu is undefined` | Move test from `tests/unit/` to `tests/browser/` |
| Tests interfere with each other | Pass individually, fail together | Add `afterEach` cleanup or split into separate files (see Section 7) |
| Missing render package | `Cannot find module 'vitest-browser-react'` | Install the framework render package (see Section 5) |

---

## 9. File structure and scripts

```
project/
|-- tests/
|   |-- unit/                          # Pure logic, runs in Node
|   |   '-- utils.test.ts
|   '-- browser/                       # Browser APIs, runs in Chrome
|       '-- ai-chat.browser.test.tsx
|-- vite.config.ts                     # Projects config from Section 2
'-- package.json
```

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --project unit",
    "test:browser": "vitest run --project browser",
    "test:watch": "vitest"
  }
}
```
