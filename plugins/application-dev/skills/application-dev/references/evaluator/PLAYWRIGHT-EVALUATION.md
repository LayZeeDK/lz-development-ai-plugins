# Playwright Evaluation Techniques

Token-efficient browser evaluation patterns for critic agents. Each technique
reduces context consumption by replacing verbose interactive commands with
targeted data extraction or disk-based test execution. Critics read the
sections relevant to their methodology step.

## Browser channel

Bundled Chromium does not support Chrome/Edge Built-in AI APIs
(LanguageModel, Summarizer, Writer, Rewriter, Translator, LanguageDetector).
A branded browser channel is required for AI API access during evaluation.

**For `npx playwright-cli` commands:** Always pass `--browser msedge`.
Fallback: `--browser chrome` if Edge is unavailable. Omit `--browser` only
as a last resort -- bundled Chromium will run but AI APIs will not work,
producing false negatives in functionality scoring.

**For `npx playwright test` (write-and-run tests):** Add `channel: 'msedge'`
inside the `test.use()` block of every test file. This tells Playwright Test
to launch the installed Edge browser instead of bundled Chromium. Fallback
comment: `// fallback: 'chrome'`.

**Priority:** msedge (Phi-4-mini) -> chrome (Gemini Nano) -> chromium (no AI
APIs).

## eval-first

Structured JSON via `npx playwright-cli eval` -- targeted data extraction that
returns only what you ask for instead of dumping an entire accessibility tree.

Use eval when you know what data you need. It returns a single value or small
JSON result, keeping context lean. Reserve snapshots for when you need to
discover element structure or ref IDs for interaction.

```bash
npx playwright-cli eval --browser msedge "document.title"
npx playwright-cli eval --browser msedge "document.querySelectorAll('img').length"
npx playwright-cli eval --browser msedge "getComputedStyle(document.body).backgroundColor"
```

## write-and-run

Write acceptance tests to disk and execute via `npx playwright test
--reporter=json`. This keeps test content and execution entirely outside agent
context -- the agent reads only structured JSON results.

**5-step workflow:**

1. Read SPEC.md acceptance criteria (already done in UNDERSTAND)
2. Take one snapshot for selector discovery: `npx playwright-cli snapshot --browser msedge`
3. Write acceptance tests to `evaluation/round-N/projection/acceptance-tests.spec.ts`
4. Run: `npx playwright test evaluation/round-N/projection/acceptance-tests.spec.ts --reporter=json`
5. Read the JSON results file -- extract pass/fail counts and failure details

Why this works: 5 tool calls replace 30+ interactive browser commands. Test
assertions execute in Playwright's process, not the agent's context window.

**Skeleton acceptance test file:**

```typescript
// evaluation/round-N/projection/acceptance-tests.spec.ts
import { test, expect } from '@playwright/test';

// Configure baseURL from the static-serve port.
// Read the port from the static-serve JSON response and substitute below.
test.use({
  baseURL: 'http://localhost:PORT',
  channel: 'msedge', // Required for AI API access; fallback: 'chrome'
});

test.describe('Feature 1: Artwork Gallery [Core]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Criteria: Gallery displays at least 12 artworks on initial load
  test('displays at least 12 artworks', async ({ page }) => {
    const items = page.getByRole('listitem');

    await expect(items).toHaveCount({ min: 12 });
  });

  // Criteria: User can filter artworks by artist name
  test('filters artworks by artist name', async ({ page }) => {
    await page.getByPlaceholder(/filter|search/i).fill('Vermeer');

    await expect(page.getByRole('listitem')).not.toHaveCount(0);
  });

  // Criteria: Filtering with no matches shows empty-state message
  test('shows empty state for no filter matches', async ({ page }) => {
    await page.getByPlaceholder(/filter|search/i).fill('xyznonexistent');

    await expect(page.getByText(/no results|no artworks/i)).toBeVisible();
  });
});
```

Key patterns in the skeleton:
- Comment above each test cites the SPEC criterion it verifies (1:1 mapping)
- `test.describe` per feature, `test()` per criterion
- Accessibility-tree-first selectors: `getByRole`, `getByLabel`, `getByText`,
  `getByPlaceholder` -- resilient to DOM restructuring between rounds
- `test.use({ baseURL })` configured from static-serve port -- ensures tests
  hit the correct server regardless of which port was assigned

## snapshot-as-fallback

`npx playwright-cli snapshot --browser msedge` saves the accessibility tree to disk for element
and ref ID discovery. The output file lands at
`.playwright-cli/page-{timestamp}.yml`.

Only use snapshot when you need element ref IDs for interaction or when eval
alone cannot determine element structure. Snapshot output is verbose -- prefer
eval for targeted queries.

```bash
npx playwright-cli snapshot --browser msedge
```

## resize+eval

Viewport resize then eval for responsive checks. Checking responsive behavior
via eval after resize is more token-efficient than taking screenshots at every
breakpoint. Take screenshots only at key viewpoints for the evaluation report.

```bash
npx playwright-cli viewport --browser msedge 320 800
npx playwright-cli eval --browser msedge "document.querySelectorAll('.card').length"
npx playwright-cli screenshot --browser msedge --filename=mobile-320.png

npx playwright-cli viewport --browser msedge 1280 800
npx playwright-cli eval --browser msedge "document.querySelectorAll('.card').length"
npx playwright-cli screenshot --browser msedge --filename=desktop-1280.png
```

## console filtering

`npx playwright-cli console error` returns only error-level messages. Unfiltered
`console` returns all messages (info, warn, debug, error) which fills context
with noise. Error-only filtering captures functional and visual issues without
token waste.

```bash
# Use this -- filtered to errors only
npx playwright-cli console --browser msedge error

# NOT this -- returns all log levels, wastes tokens
# npx playwright-cli console
```

## test healing (evaluation context)

When acceptance tests fail on selectors, re-snapshot, update selectors, and
re-run. The key distinction: selector failures are test maintenance (UI renamed
or moved elements), while assertion failures are real findings (behavior
changed). Selector failures should be healed; assertion failures should be
reported.

**Healing flow:**

1. Identify failing tests from JSON results
2. Categorize each failure as selector timeout or assertion failure
3. For selector timeouts: `npx playwright-cli snapshot --browser msedge`, find updated selectors
   in the new accessibility tree, update the test file, re-run
4. For assertion failures: report as findings -- these indicate actual behavioral
   issues in the application

Critics heal their own tests only. Critics never modify application source code.
The Generator's heal loop (Plan -> Generate -> Heal skill) fixes the app; the
critic's heal loop fixes only test selectors.

## round 2+ test reuse

Reuse acceptance tests from the previous round to get a strong signal with
minimal cost (2 tool calls: copy + run).

**Decision tree:**

1. Copy `acceptance-tests.spec.ts` from `evaluation/round-{N-1}/projection/`
   to `evaluation/round-N/projection/`
2. Run: `npx playwright test evaluation/round-N/projection/acceptance-tests.spec.ts --reporter=json`
3. Read results and decide:

- **Reuse** when all tests pass, or tests fail on assertions only (behavior
  changed but structure is intact -- report assertion failures as findings)
- **Heal** when 1-2 selector timeouts occur (minor UI rename or element move --
  re-snapshot, update selectors, re-run)
- **Regenerate** when multiple selector timeouts occur or more than 50% of tests
  fail on timeouts (major UI restructure -- run the full write-and-run workflow
  from SPEC.md with a fresh snapshot)

No new tests in rounds 2+. Round 1 writes tests covering all SPEC.md criteria.
Consistent tests across rounds enable meaningful CLI trajectory analysis.

**Missing prior tests fallback:** If `evaluation/round-{N-1}/projection/` has no
`acceptance-tests.spec.ts` (critic crashed or was skipped), fall back to round 1
behavior: write fresh tests from SPEC.md with a new snapshot.

Each round directory is self-contained. Copy tests to the new round directory
before running. Prior rounds are immutable after completion.
