# Playwright Token Efficiency Research

Research conducted 2026-03-30. Sources: GitHub issues, official docs, NPM
registry, Anthropic engineering blog, Playwright official docs.

---

## 1. playwright-cli Token Efficiency

### 1.1 CLI vs MCP Architecture

playwright-cli (github.com/microsoft/playwright-cli) was created specifically
to solve MCP's token bloat problem. The Playwright MCP maintainer (pavelfeldman)
repeatedly redirects token complaints to playwright-cli:

> "Please use https://github.com/microsoft/playwright-cli"
> -- pavelfeldman on issues #1274, #1290, #1304

Key architectural difference: **playwright-cli writes snapshots to files
instead of returning them inline in context.** Every command produces a
snapshot file reference, not the snapshot content:

```
> playwright-cli goto https://example.com
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

The agent reads the snapshot file only when needed, and only the parts it
needs. This is fundamentally more token-efficient than MCP, which forces the
full accessibility tree into context on every action.

Source: playwright-cli SKILL.md, README.md

### 1.2 CLI Configuration for Token Reduction

`.playwright/cli.config.json` supports these token-relevant options:

```json
{
  "codegen": "none",
  "outputMode": "file",
  "console": { "level": "error" }
}
```

| Setting | Effect on tokens |
|---------|-----------------|
| `codegen: "none"` | Suppresses generated code blocks from output |
| `outputMode: "file"` | Moves snapshots to file links instead of inline |
| `console.level: "error"` | Suppresses non-error console events |

Global config via env var: `PLAYWRIGHT_MCP_CONFIG="$HOME/.playwright/cli.config.json"`

Source: github.com/microsoft/playwright-cli/issues/297 (comment by SeanLF)

### 1.3 Snapshot Filtering in playwright-cli

**Current state: limited.** The `snapshot` command has only:

- `--filename=<path>` -- save to specific file
- Element targeting via `ref` (e.g., `e15`), CSS selectors, or role selectors
  when using other commands (click, hover, etc.)

**No `--selector`, `--depth`, `--include`, or `--exclude` flags for the
snapshot command itself.** The `browser_snapshot` MCP tool has a `selector`
parameter for partial snapshots (CSS or role selector for root element), but
this is MCP-only.

Workaround: Use `eval` to extract targeted data:

```bash
playwright-cli eval "document.querySelector('.main-content').textContent"
playwright-cli run-code "async page => {
  return await page.locator('.results').allTextContents();
}"
```

Source: playwright-cli SKILL.md, playwright-mcp README.md

### 1.4 Screenshot Control

- `playwright-cli screenshot` -- full page PNG
- `playwright-cli screenshot e5` -- specific element
- `playwright-cli screenshot --filename=page.png` -- custom filename
- No quality/compression options documented
- No JPEG support documented for CLI (MCP supports `type` parameter)

### 1.5 Snapshot Mode Options (MCP only)

The `--snapshot-mode` flag on playwright-mcp supports:

| Mode | Behavior | Token impact |
|------|----------|-------------|
| `incremental` (default) | Returns only changes since last snapshot | Lower after first snapshot |
| `full` | Returns complete accessibility tree every time | Highest |
| `none` | No inline snapshots; agent must explicitly request | Lowest inline, but doubles API calls |

Caveat from maintainer: `snapshot-mode=none` may actually **increase** total
cost because the agent will issue a separate snapshot request, and the
conversational history accumulates both the request and response.

Source: github.com/microsoft/playwright-mcp issues #1247, #1304

### 1.6 Known Token Consumption Metrics

| Source | Token count | Context |
|--------|------------|---------|
| MCP tool definitions | 14.4k-15.2k tokens | Just having Playwright MCP loaded (issue #1290) |
| Tool descriptions | 33.3% of tool definitions | Descriptions + annotation titles |
| `wait_for` response | ~20.7k tokens | Single wait command returns full snapshot (issue #1131) |
| Complex page snapshot | 50k-540k tokens | Large accessibility trees (issue #1233) |
| Blazor WASM page | >V8 string limit | Crashes with RangeError (issue #1474) |
| Single navigation | ~25-28k tokens | browser_navigate with snapshot (issue #1216) |
| URL repetition | ~6% of session | Long URLs printed 12 times in 20 calls (issue #297) |

Source: Various github.com/microsoft/playwright-mcp and playwright-cli issues

---

## 2. Page Object Model (POM) Patterns for AI Agents

### 2.1 Standard POM Pattern

Playwright's POM pattern encapsulates page interactions in classes:

```typescript
class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Source: playwright.dev/docs/pom

### 2.2 POM Generation from Accessibility Snapshots

**No built-in tool exists.** However, the pattern is achievable:

1. **playwright-cli generates locator code with every action.** Each `click`,
   `fill`, etc. outputs the Playwright TypeScript equivalent. The agent can
   collect these into a POM class.

2. **`browser_generate_playwright_test`** (MCP tool) produces a prompt that
   nudges the LLM to generate test code from the session history, including
   good locators. It does NOT generate POM classes directly.

3. **Codegen locator injection.** MCP maintainer (Skn0tt) confirmed: "Actions
   like `browser_click` or `browser_navigate` have generated code injected in
   their tool results. The LLM will take those snippets into account when
   generating test code."

Source: github.com/microsoft/playwright-mcp/issues/519

### 2.3 POM Generation from SPEC.md

**Not directly supported by any tool.** The workflow would be:

1. Parse SPEC.md for user flows and UI elements
2. For each page/component, identify interactive elements
3. Generate POM class with role-based locators
4. This is a task for the AI agent itself, not a Playwright feature

The existing playwright-testing skill in this repo already describes this
pattern: test plans are derived from SPEC.md, then tests are generated from
plans. POMs would be an intermediate artifact between plan and test.

### 2.4 Sharing POMs Between Generator and Evaluator

Pattern: POMs as shared contract files.

```
project/
|-- poms/                     # Shared page objects
|   |-- login-page.ts
|   |-- dashboard-page.ts
|   '-- checkout-page.ts
|-- tests/                    # Tests import from poms/
|   '-- checkout.spec.ts      # import { CheckoutPage } from '../poms/...'
```

Both Generator and Evaluator can:
- Read POMs to understand available interactions
- Use POM methods in test code instead of raw locators
- Update POMs when UI changes (healing phase)

This is not a Playwright-specific feature but a standard code organization
pattern. The key insight for AI agents: POMs reduce the amount of snapshot
reading needed because the agent already knows what locators to use.

---

## 3. E2E Test Patterns That Minimize Token Usage

### 3.1 Locator Strategy Token Comparison

| Strategy | Example | Chars | Token estimate |
|----------|---------|-------|---------------|
| `getByLabel` | `page.getByLabel('Password')` | 28 | ~8 |
| `getByTestId` | `page.getByTestId('submit')` | 28 | ~8 |
| `getByText` | `page.getByText('Welcome')` | 27 | ~8 |
| CSS selector | `page.locator('#submit-btn')` | 28 | ~8 |
| `getByRole` | `page.getByRole('button', { name: 'Submit' })` | 46 | ~13 |

**Finding: `getByRole` is the most verbose but most resilient.** It costs ~5
extra tokens per locator vs CSS, but produces code that survives UI
refactoring. For AI agent contexts where healing costs tokens too, the
upfront cost of resilient locators saves tokens overall.

Source: playwright.dev/docs/locators

### 3.2 Snapshot-Based vs DOM-Based Testing

**ARIA snapshot assertions** (`toMatchAriaSnapshot`) use a compact YAML format:

```typescript
await expect(page.getByRole('banner')).toMatchAriaSnapshot(`
  - banner:
    - heading /Playwright enables/ [level=1]
    - link "Get started"
`);
```

Token comparison:
- ARIA snapshot assertion: ~30-50 tokens for a component check
- Multiple individual assertions: ~15 tokens each, but 3-5 needed = 45-75 tokens
- Full DOM check via evaluate: variable, often very large

**Finding: ARIA snapshots are more token-efficient for structural
verification** because one assertion checks multiple elements. But they are
best for regression testing, not dynamic behavior testing.

Source: playwright.dev/docs/aria-snapshots

### 3.3 Using page.evaluate() for Structured Data Extraction

Instead of parsing full accessibility snapshots, extract exactly what you need:

```typescript
// BAD: Full snapshot into context (~20k tokens)
const snapshot = await page.accessibility.snapshot();

// GOOD: Structured extraction (~100 tokens)
const data = await page.evaluate(() => ({
  itemCount: document.querySelectorAll('.cart-item').length,
  total: document.querySelector('.total')?.textContent,
  hasError: !!document.querySelector('.error-message'),
}));
```

With playwright-cli:

```bash
playwright-cli eval "() => ({
  items: document.querySelectorAll('.product').length,
  title: document.title,
  error: document.querySelector('.error')?.textContent
})"
```

**This is the single most effective token reduction technique.** Instead of
putting a 20k-token snapshot into context, a targeted evaluate returns
50-200 tokens of structured JSON.

Source: playwright-cli running-code reference, issue #1329 comment

### 3.4 Batch Assertions

Playwright does not support "batch assertion" API calls. However, the pattern
of using `page.evaluate()` to check multiple conditions in one call achieves
the same effect:

```typescript
const checks = await page.evaluate(() => ({
  titleCorrect: document.title === 'Dashboard',
  navVisible: !!document.querySelector('nav'),
  itemCount: document.querySelectorAll('.item').length,
  noErrors: document.querySelectorAll('.error').length === 0,
}));

expect(checks.titleCorrect).toBe(true);
expect(checks.navVisible).toBe(true);
expect(checks.itemCount).toBe(5);
expect(checks.noErrors).toBe(true);
```

This uses 1 browser round-trip instead of 4, and keeps the context small.

---

## 4. Multi-Agent Evaluation Patterns

### 4.1 Claude Code Agent Teams

Claude Code supports experimental Agent Teams
(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Key characteristics:

- **Context isolation.** Each teammate has its own context window. Compaction
  in one agent does not affect others.
- **Communication via mailbox.** Agents send messages to each other through
  a file-based mailbox system (`~/.claude/teams/{name}/`).
- **Team lead coordinates.** One agent acts as lead, dispatching work to
  teammates.
- **All teammates use same model.** Per-teammate model selection is not yet
  supported (issue #32110).

**Known limitation:** When the team lead's context is compacted, it loses
awareness of the team (issue #23620). This is a critical bug for long-running
evaluation sessions.

Source: github.com/anthropics/claude-code issues #32110, #23620, #29930

### 4.2 Sub-Agent Pattern (Agent Tool)

Claude Code's Agent tool spawns sub-agents with independent context windows.
Each sub-agent:

- Has its own conversation history
- Can access the filesystem (shared)
- Has tool restrictions defined by the caller
- Returns a summary to the parent when done

**Communication is one-way:** parent sends task, child returns result. No
peer-to-peer communication between sub-agents.

### 4.3 Division of Work Patterns

| Pattern | How it divides | Best for |
|---------|---------------|----------|
| **By page** | Each agent evaluates one URL/route | Websites with many independent pages |
| **By feature** | Each agent evaluates one feature area | Complex apps with distinct feature domains |
| **By test type** | Functional vs visual vs performance | When different evaluation criteria apply |
| **By flow** | Each agent evaluates one user journey | Multi-step workflows |

### 4.4 Sharing Browser Sessions

**Sub-agents CANNOT directly share a playwright-cli browser session.** Each
agent would need to connect to the same session via the session name:

```bash
# Parent opens session
playwright-cli -s=eval open https://example.com

# Sub-agent connects to same session
playwright-cli -s=eval snapshot
```

However, this creates race conditions if agents interact concurrently.

**Recommended pattern:** Each evaluator agent gets its own named session:

```bash
# Evaluator 1
playwright-cli -s=eval-home open https://example.com/
# Evaluator 2
playwright-cli -s=eval-products open https://example.com/products
# Evaluator 3
playwright-cli -s=eval-checkout open https://example.com/checkout
```

Source: playwright-cli session-management reference

### 4.5 Shared File Communication

The most reliable multi-agent communication pattern for evaluators:

1. **Shared results directory.** Each evaluator writes structured JSON results
   to a shared directory:
   ```
   .evaluations/
   |-- home-page.json
   |-- products-page.json
   '-- checkout-flow.json
   ```

2. **Parent aggregates.** The lead/parent agent reads all result files and
   synthesizes a final verdict.

3. **Shared POM files.** If evaluators use the same POMs, they stay
   consistent in their interactions with the app.

---

## 5. playwright-cli Command Reference (Token-Relevant)

### 5.1 All Commands

**Core:** open, goto, close, type, click, dblclick, fill, drag, hover,
select, upload, check, uncheck, snapshot, eval, dialog-accept,
dialog-dismiss, resize

**Navigation:** go-back, go-forward, reload

**Keyboard:** press, keydown, keyup

**Mouse:** mousemove, mousedown, mouseup, mousewheel

**Tabs:** tab-list, tab-new, tab-close, tab-select

**Storage:** state-save, state-load, cookie-list/get/set/delete/clear,
localstorage-list/get/set/delete/clear, sessionstorage-list/get/set/delete/clear

**Network:** route, route-list, unroute

**DevTools:** console, network, run-code, tracing-start, tracing-stop,
video-start, video-stop

**Session:** list, close-all, kill-all, delete-data

### 5.2 Snapshot Command

```bash
playwright-cli snapshot                         # auto-named file
playwright-cli snapshot --filename=after.yaml   # specific filename
```

**No filtering options.** No `--selector`, `--depth`, `--include`, `--exclude`.

To get a partial snapshot, use `eval` or `run-code`:

```bash
# Extract only navigation elements
playwright-cli run-code "async page => {
  const nav = page.locator('nav');
  return await nav.ariaSnapshot();
}"

# Extract only visible form fields
playwright-cli eval "() => {
  const fields = document.querySelectorAll('input:not([type=hidden])');
  return Array.from(fields).map(f => ({
    name: f.name, type: f.type, value: f.value
  }));
}"
```

### 5.3 Output Summary vs Full Snapshot

**There is no built-in "summary" or "outline" mode for snapshots.** The
feature has been requested (issues #915, #945, #1233) but the maintainer's
position is clear:

> "If we had a processor that can keep only meaningful content, we'd have it
> on by default."
> -- pavelfeldman on issue #945

> "Max tokens parameters don't work as the page snapshot becomes incomplete."
> -- pavelfeldman on issue #1233

The recommended approach is playwright-cli itself, where snapshots go to files
and the agent reads only what it needs.

---

## 6. Alternative Approaches to Reduce Evaluator Context

### 6.1 Write Intermediate Results to Files

Pattern: Evaluator writes findings to disk, keeps only summaries in context.

```bash
# Evaluator writes detailed analysis to file
playwright-cli snapshot --filename=.evaluations/home-snapshot.yml
playwright-cli run-code "async page => {
  const links = await page.getByRole('link').allTextContents();
  const headings = await page.getByRole('heading').allTextContents();
  return JSON.stringify({ links, headings }, null, 2);
}" > .evaluations/home-structure.json

# Then the evaluator reads only what it needs from the files
```

This is the pattern used in the community fork by mohammad-rj (issue #1274):
snapshots > 300 lines are cached to files, and a `searchSnapshotFile` tool
lets the agent grep through them.

### 6.2 page.evaluate() for Structured JSON

The most token-efficient extraction method:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const results = {
      title: document.title,
      h1: document.querySelector('h1')?.textContent,
      navLinks: [...document.querySelectorAll('nav a')].map(a => ({
        text: a.textContent?.trim(),
        href: a.href
      })),
      formFields: [...document.querySelectorAll('input, select, textarea')].map(f => ({
        type: f.type || f.tagName.toLowerCase(),
        name: f.name,
        label: f.labels?.[0]?.textContent?.trim()
      })),
      images: document.querySelectorAll('img').length,
      errors: [...document.querySelectorAll('.error, [role=alert]')]
        .map(e => e.textContent?.trim())
    };
    return JSON.stringify(results);
  });
}"
```

**Token cost: ~200 tokens** vs ~20,000 for a full snapshot. 100x reduction.

### 6.3 Screenshot Analysis

Screenshots can be written to disk and referenced by path:

```bash
playwright-cli screenshot --filename=.evaluations/home-page.png
```

The agent can then reference the file path without putting the image in context.
However, if the agent needs to analyze the screenshot, it must put it into
context as an image (multimodal input). Screenshots are typically 500-2000
tokens depending on resolution.

**Optimization:** Use element-specific screenshots to reduce size:

```bash
playwright-cli screenshot e5 --filename=.evaluations/nav-bar.png
```

### 6.4 Headless Evaluation Pattern ("Write-and-Run")

Instead of interacting step-by-step with the browser, the evaluator writes a
complete test script and runs it:

```bash
# Evaluator writes a test file
# (uses Write tool, not browser interaction)

# Then runs it
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/evaluation/home-page.spec.ts
```

**Token savings:** The entire browser interaction happens in a Playwright
process, not in agent context. Only the test results (pass/fail) enter
the agent's context.

This is the approach described in the playwright-cli reference for
playwright-tests.md:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test
```

For debugging failures, the agent can attach:

```bash
PWPAUSE=cli npx playwright test tests/failing.spec.ts
playwright-cli --session=test open --attach=test-worker-abcdef
playwright-cli --session=test snapshot
```

### 6.5 Code Execution Mode ("browser_run_code" / "run-code")

Anthropic's engineering blog on advanced tool use quantifies the benefit:

> "Average usage dropped from 43,588 to 27,297 tokens, a **37% reduction**
> on complex research tasks"

The principle: instead of N tool calls with N round-trips (each adding to
context), write code that does all N steps and returns only the final result.

```bash
playwright-cli run-code "async page => {
  // Do multiple pages in one call
  const results = [];
  for (const url of ['/about', '/contact', '/pricing']) {
    await page.goto('https://example.com' + url);
    results.push({
      url,
      title: await page.title(),
      h1: await page.locator('h1').textContent(),
      linkCount: await page.getByRole('link').count(),
      hasError: (await page.locator('.error').count()) > 0
    });
  }
  return results;
}"
```

**This is the single biggest token optimization available.** One tool call
replaces 3 navigations + 3 snapshots + N assertions = potentially 100k tokens
reduced to ~500 tokens.

Source: anthropic.com/engineering/advanced-tool-use

### 6.6 Sift Gateway Pattern

The Sift project (github.com/lourencomaciel/sift-gateway) stores large MCP
responses as artifacts outside the prompt and returns a smaller reference.
The agent can then inspect only needed parts. This is an external middleware
solution for any MCP server, not Playwright-specific.

Source: github.com/microsoft/playwright-mcp issues #1040, #1131, #1329

---

## 7. Summary: Token Reduction Techniques Ranked by Impact

| Rank | Technique | Token savings | Effort |
|------|-----------|--------------|--------|
| 1 | **Use playwright-cli instead of MCP** | ~14k saved on tool definitions alone; snapshots to files | Config change |
| 2 | **run-code for multi-step operations** | 37-100x reduction per multi-step flow | Moderate |
| 3 | **page.evaluate() for structured extraction** | 100x vs full snapshot | Low |
| 4 | **Write-and-run test scripts** | Entire browser session out of context | High |
| 5 | **cli.config.json: codegen=none, outputMode=file** | Removes code blocks + moves snapshots | Config change |
| 6 | **console.level=error** | Removes verbose console output | Config change |
| 7 | **Element-specific screenshots** | Smaller images | Low |
| 8 | **Write results to files, read selectively** | Keeps only summaries in context | Moderate |
| 9 | **ARIA snapshot assertions for structural checks** | 1 assertion vs N individual checks | Low |
| 10 | **Named sessions per evaluator** | Prevents session conflicts | Config |

---

## 8. Key GitHub Issues (Quick Reference)

### Token consumption
- #1290 -- Tool definitions consume 14.4k tokens (33% in descriptions)
- #1131 -- wait_for returns 20.7k tokens
- #1216 -- Token use optimization (omit snapshot/console)
- #1233 -- Configurable max_tokens for snapshots
- #1274 -- Large responses consuming context windows
- #1040 -- Dealing with big pages and context
- #297 (CLI) -- URL repetition burns 6% of session tokens

### Snapshot issues
- #1474 -- RangeError on Blazor WASM (snapshot too large for V8)
- #1329 -- Snapshot fills entire context
- #1304 -- Per-tool snapshot control
- #1298 -- snapshot-mode=none leak in browser_tabs
- #1247 -- snapshot config not working
- #945 -- Filter unnecessary generic nodes
- #915 -- Optimize browser_snapshot for interactable elements only

### Architecture proposals
- #1267 -- Code execution MCP (browser_run_code added)
- #1263 -- Transition to code execution mode
- #1455 -- Direct page content extraction (like BrowserOS MCP)

### Codegen and test generation
- #519 -- Adding codegen feature (closed, ideas noted)
- #438 -- Tool to validate locators (ref-to-locator mapping)

All URLs are at github.com/microsoft/playwright-mcp unless noted (CLI).
