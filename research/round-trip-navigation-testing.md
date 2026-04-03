# Round-Trip Navigation Testing (A->B->A Patterns)

Research into best practices, techniques, and patterns for testing state
persistence after navigate-away-and-return in single-page applications.

**Purpose:** Inform the projection-critic agent's ability to detect state loss,
URL corruption, and history stack issues during round-trip navigation.

---

## 1. SPA State Persistence Categories

State that can be lost during A->B->A navigation falls into a taxonomy of
storage layers. Each layer has different survival characteristics.

### Layer taxonomy

| Layer | Storage | Survives SPA nav | Survives back button | Survives page reload | Common bugs |
|-------|---------|------------------|---------------------|---------------------|-------------|
| URL state | Address bar (path, query, hash) | Yes | Yes | Yes | Query params dropped on back-nav, hash stripped |
| History API state | `history.state` object | Yes (per entry) | Yes | Browser-dependent | Missing `replaceState` on initial load, non-serializable state |
| In-memory state | JS variables, framework stores (Redux, Zustand, Pinia) | Yes within SPA | Lost on full reload | Lost | Store not rehydrated from URL, stale closures |
| Component state | React useState, Vue ref/reactive, Angular signals | Destroyed on unmount | Destroyed unless KeepAlive/cached | Lost | No persistence strategy, state reset on re-mount |
| DOM state | Scroll position, form input values, focus, selection | Destroyed on unmount | Restored by bfcache only | Lost | Scroll jumps to top, form inputs cleared |
| Session storage | `sessionStorage` | Yes | Yes | Yes | Key collisions, quota exceeded silently |
| Local storage | `localStorage` | Yes | Yes | Yes (cross-tab) | Stale reads, no reactivity |
| Server state | Database, API cache | Yes | Yes | Yes | Stale client cache after mutation, optimistic UI desync |
| Cookie state | HTTP cookies | Yes | Yes | Yes | SameSite restrictions, size limits |

### Most commonly broken categories (by frequency)

1. **Component state** -- the default. When a component unmounts (navigating
   away), its local state is destroyed. Frameworks provide opt-in persistence
   (Vue `<KeepAlive>`, React `useSyncExternalStore` with external cache,
   Angular `RouteReuseStrategy`), but developers frequently forget to use them.

2. **DOM state (scroll position)** -- Browsers restore scroll on full-page
   back navigation via bfcache, but SPA client-side routing destroys and
   recreates DOM, losing scroll position unless the framework implements scroll
   restoration. Next.js `<ScrollRestoration>`, Vue Router `scrollBehavior()`,
   and React Router `<ScrollRestoration>` all provide this, but configuration
   is often missing or misconfigured.

3. **URL state (query parameters, hash)** -- Developers use `history.pushState`
   to update the URL but fail to read it back on component mount, or they
   clobber query params during navigation by constructing URLs without
   preserving existing params.

4. **In-memory store state** -- Global stores survive SPA navigation, but the
   bug pattern is: store state is initialized correctly on first visit, but
   on return navigation the component reads stale store data instead of
   re-fetching or the store was reset by a route guard.

5. **Form input state** -- Partially filled forms are lost when navigating away
   and returning. This is component state loss, but it is the single most
   user-visible manifestation and deserves explicit testing.

### Common SPA state management bugs

- **Missing initial `replaceState`**: SPA does not call `history.replaceState()`
  on initial page load, so pressing Back from the first SPA navigation exits
  the app entirely rather than returning to initial state.
- **Popstate handler missing or broken**: `popstate` event fires on back/forward
  but the app has no listener, or the listener does not reconstruct UI from
  `event.state`.
- **Non-serializable history state**: Passing functions, DOM nodes, or class
  instances to `pushState` silently drops data or throws.
- **Hash-only navigation not tracked**: Hash changes (`#section`) do not push
  history entries unless explicitly managed, breaking back-button expectations.
- **Store reset on route change**: Route guards or component initialization
  logic clears global store, wiping state that should persist.
- **Stale cache after mutation**: User creates data on page A, navigates to
  page B, returns to page A -- the list/view does not reflect the new data
  because it reads from a stale cache instead of revalidating.

---

## 2. Back-Button and History API Testing Patterns

### History API fundamentals for test design

The History API provides `pushState`, `replaceState`, and `popstate`:

```javascript
// Adding a history entry (SPA navigation)
history.pushState({ page: 1 }, "", "/page-1");

// Updating current entry without adding to stack
history.replaceState({ page: 1, scrollY: 200 }, "", "/page-1");

// Listening for back/forward navigation
window.addEventListener("popstate", (event) => {
  if (event.state) {
    renderPage(event.state);
  }
});
```

Key testing implications:
- `popstate` fires ONLY on back/forward/`history.go()`, NOT on `pushState`
  or `replaceState`
- `history.state` is per-entry and serializable only
- The state object must contain everything needed to reconstruct the page

### Navigation API (modern replacement)

Chrome 102+ ships the Navigation API, which centralizes all navigation through
a single `navigate` event:

```javascript
navigation.addEventListener("navigate", (event) => {
  event.intercept({
    async handler() {
      const content = await fetchContent(event.destination.url);
      renderPage(content);
    },
  });
});
```

Key improvements for testing:
- `navigation.back()` and `navigation.forward()` return `{ committed, finished }`
  promises, making it possible to await completion
- `navigation.currentEntry.getState()` provides typed state access
- `navigation.traverseTo(key)` enables jumping to specific history entries
- All navigation types (link click, back, forward, programmatic) go through
  one handler, reducing edge cases

### Framework-specific test patterns

**Cypress:**
```javascript
// cy.go() navigates back/forward
cy.visit("/page-a");
cy.get("[data-cy=link-to-b]").click();
cy.url().should("include", "/page-b");
cy.go("back");
cy.url().should("include", "/page-a");
cy.get("[data-cy=preserved-state]").should("have.value", "expected");
```
- `cy.go("back")` / `cy.go("forward")` / `cy.go(-1)` / `cy.go(1)`
- For hash-routing SPAs, Cypress resolves immediately (no page load wait)
- Returns the window object after page finishes loading

**Playwright:**
```javascript
// page.goBack() / page.goForward()
await page.goto("/page-a");
await page.click("[data-testid=link-to-b]");
await page.waitForURL("**/page-b");
await page.goBack();
await page.waitForURL("**/page-a");
await expect(page.locator("[data-testid=state]")).toHaveText("preserved");
```
- Returns `Promise<null | Response>` -- null if no history entry exists
- `waitUntil` options: `domcontentloaded`, `load`, `networkidle`, `commit`
- For SPAs: `networkidle` is discouraged; prefer assertions or `waitForURL`

**Selenium/WebDriverIO:**
```javascript
// driver.navigate().back() / forward()
await driver.get("http://localhost:3000/page-a");
await driver.findElement(By.css("[href='/page-b']")).click();
await driver.navigate().back();
// Assert state preserved
```

---

## 3. Round-Trip Navigation Test Design Patterns

### The canonical A->B->A pattern

```
Setup:    Establish state on page A (fill form, select tab, scroll, create data)
Navigate: Move to page B (click link, use nav, programmatic)
Return:   Navigate back to page A (back button, re-click link, URL entry)
Assert:   Verify state on page A matches setup state
```

### Variation matrix

Every A->B->A test should consider multiple navigation methods for the
"return" step, as different methods exercise different code paths:

| Return method | What it exercises | Typical failures |
|---------------|-------------------|------------------|
| Browser back button (`page.goBack()`) | `popstate` handler, history state, bfcache | Missing popstate listener, state not in history |
| In-app link click | Router link handler, component re-mount | Component re-initializes with default state |
| Browser forward button (`page.goForward()`) | Forward navigation after back | Forward stack cleared by new pushState |
| URL bar re-entry (`page.goto()`) | Full route resolution, no history context | Route params not parsed, no state restoration |
| `history.go(-1)` / `history.go(1)` | Programmatic history traversal | Same as back/forward buttons |

### Concrete test patterns

**Pattern 1: Form data persistence**
```typescript
test("form data survives round-trip navigation", async ({ page }) => {
  await page.goto("/form-page");

  // Setup: fill form partially
  await page.getByLabel("Name").fill("Alice");
  await page.getByLabel("Email").fill("alice@example.com");

  // Navigate away
  await page.getByRole("link", { name: "Settings" }).click();
  await page.waitForURL("**/settings");

  // Return via back button
  await page.goBack();
  await page.waitForURL("**/form-page");

  // Assert form data preserved
  await expect(page.getByLabel("Name")).toHaveValue("Alice");
  await expect(page.getByLabel("Email")).toHaveValue("alice@example.com");
});
```

**Pattern 2: CRUD data persistence (create, navigate away, return)**
```typescript
test("created item persists after navigation", async ({ page }) => {
  await page.goto("/items");

  // Setup: create an item
  await page.getByRole("button", { name: "Add Item" }).click();
  await page.getByLabel("Title").fill("Test Item");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Test Item")).toBeVisible();

  // Navigate away
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.waitForURL("**/dashboard");

  // Return
  await page.getByRole("link", { name: "Items" }).click();
  await page.waitForURL("**/items");

  // Assert item still exists
  await expect(page.getByText("Test Item")).toBeVisible();
});
```

**Pattern 3: Selected tab / accordion state**
```typescript
test("selected tab survives round-trip", async ({ page }) => {
  await page.goto("/settings");

  // Setup: select non-default tab
  await page.getByRole("tab", { name: "Security" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Password");

  // Navigate away and return
  await page.getByRole("link", { name: "Home" }).click();
  await page.goBack();
  await page.waitForURL("**/settings");

  // Assert: Security tab still selected
  await expect(page.getByRole("tab", { name: "Security" }))
    .toHaveAttribute("aria-selected", "true");
});
```

**Pattern 4: Search filters and pagination**
```typescript
test("search filters survive round-trip", async ({ page }) => {
  await page.goto("/products");

  // Setup: apply filters
  await page.getByPlaceholder(/search/i).fill("widget");
  await page.getByRole("button", { name: "Category" }).click();
  await page.getByRole("option", { name: "Electronics" }).click();

  // Record filtered results count
  const resultCount = await page.getByRole("listitem").count();

  // Navigate to a product detail
  await page.getByRole("listitem").first().click();
  await page.waitForURL("**/products/*");

  // Return via back button
  await page.goBack();
  await page.waitForURL("**/products");

  // Assert filters preserved
  await expect(page.getByPlaceholder(/search/i)).toHaveValue("widget");
  await expect(page.getByRole("listitem")).toHaveCount(resultCount);
});
```

**Pattern 5: Scroll position restoration**
```typescript
test("scroll position restored on back navigation", async ({ page }) => {
  await page.goto("/long-list");

  // Setup: scroll down
  await page.evaluate("window.scrollTo(0, 1000)");
  const scrollBefore = await page.evaluate("window.scrollY");

  // Navigate away
  await page.getByRole("listitem").nth(5).click();
  await page.waitForURL("**/detail/*");

  // Return via back button
  await page.goBack();
  await page.waitForURL("**/long-list");

  // Allow scroll restoration time
  await page.waitForTimeout(500);
  const scrollAfter = await page.evaluate("window.scrollY");

  // Assert scroll approximately restored (within 50px tolerance)
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50);
});
```

**Pattern 6: URL state integrity**
```typescript
test("URL query params preserved through round-trip", async ({ page }) => {
  // Navigate with query params
  await page.goto("/search?q=test&sort=date&page=3");

  // Verify page renders with params
  await expect(page.getByPlaceholder(/search/i)).toHaveValue("test");

  // Navigate away
  await page.getByRole("link", { name: "Home" }).click();

  // Return via back button
  await page.goBack();

  // Assert URL intact
  expect(page.url()).toContain("q=test");
  expect(page.url()).toContain("sort=date");
  expect(page.url()).toContain("page=3");
});
```

### Anti-patterns to avoid

- **Testing internal state directly** -- Read observable UI, not `window.__STORE__`
- **Fixed timeouts for navigation** -- Use `waitForURL` or assertions, not `waitForTimeout`
- **Testing only back-button return** -- Also test in-app link return (different code path)
- **Ignoring the "B" page** -- Assert something on page B to prove navigation occurred
- **Sequential dependency** -- Each test should be independent; use `beforeEach` for setup

---

## 4. State Persistence Classification for Critic Agent

### What to test (priority order for a ~60K token budget)

Given the projection-critic's write-and-run pattern and token budget, prioritize
testing by defect frequency and user impact:

**Priority 1: Must test (always include)**
- CRUD persistence: create data, navigate away, return, data still visible
- URL integrity: query parameters and hash survive back-navigation
- Core navigation: every route is reachable and renders correctly

**Priority 2: Should test (include when SPEC mentions them)**
- Form data persistence: partially filled forms survive navigation
- Filter/search state: applied filters persist on return
- Authentication state: logged-in state survives navigation
- Selected tab/accordion: non-default UI selections persist

**Priority 3: Nice to have (include if budget allows)**
- Scroll position restoration: scroll position restored on back-nav
- Modal/dialog state: modal that was open is still open on return
- Pagination position: user returns to same page number
- Shopping cart: items survive cross-page navigation

**Priority 4: Usually skip (framework responsibility)**
- bfcache compatibility (browser-level, not app-testable via Playwright)
- History stack depth/ordering (hard to assert, rarely user-visible)
- Prefetch/cache headers (network-level, outside functional testing)

### Detection signals for the critic

The critic should watch for these signals that indicate state persistence bugs:

1. **Default state on return** -- Form fields empty, first tab selected, no items
   in list after previously seeing items
2. **URL mismatch** -- URL changes to bare path (query params stripped) after
   back navigation
3. **Full page reload flash** -- White flash or loading spinner on back-nav
   indicates SPA routing broken (falling through to server)
4. **Console errors on back-nav** -- `Cannot read property of null/undefined`
   often indicates component tried to read destroyed state
5. **Missing data on return** -- Items created before navigation are gone,
   indicating in-memory storage without persistence

---

## 5. Industry Testing Patterns

### Next.js

Next.js App Router test suite (in `test/e2e/app-dir/navigation/`) includes:
- Back-button hash navigation scroll restoration tests
- Round-trip navigation verifying scroll offset at specific pixel values
- Query parameter preservation during prefetch hover
- RSC request prevention during hash-only navigation changes
- Pattern: `click -> waitForElement -> click -> retry(assertScrollOffset)`

### React Router

React Router test suite (`packages/react-router/__tests__/`) covers:
- `navigate-test.tsx` -- programmatic navigation
- `useNavigate-test.tsx` -- hook-based navigation patterns
- `useLocation-test.tsx` -- location state tracking
- Uses `MemoryRouter` with `initialEntries` for controlled test setup
- Pattern: `render(MemoryRouter) -> click -> assertTextContent`

### Vue Router

Vue Router provides built-in scroll behavior management:
```javascript
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition; // Restore on back/forward
    }
    if (to.hash) {
      return { el: to.hash }; // Scroll to anchor
    }
    return { top: 0 }; // Scroll to top on new navigation
  },
});
```
Vue `<KeepAlive>` preserves component state across route changes:
- `include`/`exclude` props control which components are cached
- `max` prop sets LRU cache limit
- `onActivated`/`onDeactivated` lifecycle hooks fire on cache restore
- Testing pattern: mount with state, navigate away, navigate back, assert state

### Remix

Remix treats navigation state as a cache management problem:
- URL search params (`useSearchParams`) for filter/sort/page state
- Server loaders for data state (automatic revalidation after mutations)
- Cookies for persistent UI preferences
- Philosophy: "less code, fresh data, no state synchronization bugs"
- The framework's loader revalidation eliminates stale-cache-on-return bugs

### bfcache (browser-level)

The back/forward cache preserves the entire page snapshot including JS heap:
- Stores complete DOM, JavaScript execution state, form data
- Breaks when: `unload` listener, open IndexedDB/WebSocket, `window.opener`
- Does NOT work for SPA soft navigations (only browser-managed navigations)
- Test via Chrome DevTools Application > Back-forward Cache > Run Test
- Detect programmatically: `pageshow` event with `event.persisted === true`

---

## 6. Playwright-Specific Navigation Patterns

### Core API for navigation testing

```typescript
// Navigate forward
await page.goto("/page-a");

// Click-triggered navigation (SPA)
await page.click("a[href='/page-b']");
await page.waitForURL("**/page-b"); // Glob pattern matching

// Back/forward
const response = await page.goBack(); // Returns Response | null
await page.goForward();

// Wait options
await page.goBack({ waitUntil: "domcontentloaded" });
await page.goBack({ timeout: 5000 });
```

### waitForURL for SPA navigation

`page.waitForURL()` is the primary tool for SPA navigation detection. It
accepts glob patterns, regex, or predicate functions:

```typescript
// Glob pattern
await page.waitForURL("**/products/*");

// Regex
await page.waitForURL(/\/products\/\d+/);

// Predicate function
await page.waitForURL((url) => url.searchParams.has("q"));
```

This is essential for SPAs because `goBack()` completes before the SPA router
finishes rendering the new view. Always follow `goBack()` with `waitForURL()`
or a content assertion.

### SPA soft navigation vs full page load

Playwright's `waitUntil` option (`load`, `domcontentloaded`, `networkidle`,
`commit`) only applies to full page loads. For SPA client-side routing:

- `goBack()` may resolve immediately (no network request)
- `networkidle` is unreliable and discouraged by Playwright docs
- **Best practice**: Use web-first assertions that auto-retry:

```typescript
await page.goBack();
// Don't: await page.waitForLoadState("networkidle");
// Do: assert something that proves the page rendered
await expect(page.getByRole("heading")).toHaveText("Page A Title");
```

### Pattern: A->B->A test template for write-and-run

This template is optimized for the projection-critic's write-and-run workflow:

```typescript
import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:PORT" });

test.describe("Round-trip navigation: A->B->A state persistence", () => {
  test("CRUD data persists after round-trip", async ({ page }) => {
    // A: Create state
    await page.goto("/");
    await page.getByRole("button", { name: /add|create|new/i }).click();
    await page.getByLabel(/title|name/i).fill("Test Entry");
    await page.getByRole("button", { name: /save|submit|create/i }).click();
    await expect(page.getByText("Test Entry")).toBeVisible();

    // B: Navigate away
    await page.getByRole("link", { name: /about|settings|home/i }).click();

    // A: Return and verify
    await page.goBack();
    await expect(page.getByText("Test Entry")).toBeVisible();
  });

  test("URL query params survive back-navigation", async ({ page }) => {
    // A: Navigate with state in URL
    await page.goto("/?filter=active&sort=date");

    // B: Navigate away via link
    await page.getByRole("link").first().click();

    // A: Back button
    await page.goBack();
    expect(page.url()).toContain("filter=active");
    expect(page.url()).toContain("sort=date");
  });

  test("navigation does not produce console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate A->B->A
    await page.goto("/page-a");
    await page.getByRole("link", { name: /page-b/i }).click();
    await page.goBack();

    // No errors during round-trip
    expect(errors).toHaveLength(0);
  });
});
```

### Handling common Playwright pitfalls

1. **`goBack()` returns null**: No history entry exists. Guard with:
   ```typescript
   const response = await page.goBack();
   if (response === null) {
     test.fail(true, "goBack returned null -- no history entry");
   }
   ```

2. **SPA navigation not detected**: `goBack()` resolves before SPA router
   updates. Always add a content assertion:
   ```typescript
   await page.goBack();
   await expect(page.getByRole("heading", { name: "Page A" })).toBeVisible();
   ```

3. **Race between navigation and assertion**: Use Playwright's auto-retry
   assertions (`expect(...).toBeVisible()`, `expect(...).toHaveText()`)
   rather than manual `waitForTimeout`.

4. **Hash navigation**: Hash changes do not trigger Playwright's navigation
   event. Use `page.waitForURL()` with a predicate:
   ```typescript
   await page.waitForURL((url) => url.hash === "#section-2");
   ```

5. **Multiple navigations from one click**: When a click triggers redirect
   chains, use `page.waitForURL()` targeting the final destination rather
   than relying on `waitForNavigation`.

---

## Recommendations for the Projection-Critic Agent

### Token-efficient integration strategy

Given the ~60K token budget and write-and-run pattern, add round-trip
navigation tests as a dedicated `test.describe` block within the existing
`acceptance-tests.spec.ts` file. Do not create a separate test file.

### Which A->B->A tests to write

Derive round-trip tests from the SPEC.md feature list:

1. **For every CRUD feature**: Add one test that creates/modifies data,
   navigates to a different view, and returns to verify persistence.

2. **For every form feature**: Add one test that partially fills the form,
   navigates away, and returns to check if data survived (only if SPEC
   mentions form persistence or draft saving).

3. **For every filtered/sorted view**: Add one test that applies filters,
   clicks into a detail, and returns via back button to verify filters are
   still active.

4. **One URL integrity test**: Navigate with query params, leave, return via
   back button, assert URL params intact.

5. **One console error test**: Monitor `page.on("console", ...)` during an
   A->B->A cycle and assert no errors.

### Estimated token cost

Each round-trip test adds approximately 8-12 lines to the test file
(~200-300 tokens in the written file, which is outside context). The JSON
results add one entry per test (~50 tokens in context). For a typical app
with 3-5 features, this adds 4-6 round-trip tests, consuming roughly 300
additional tokens in the results JSON. This is well within the budget.

### What NOT to test

- Scroll position restoration (unreliable, adds `waitForTimeout`, framework
  responsibility)
- bfcache behavior (browser-level, not controllable via Playwright in SPA mode)
- History stack ordering (no user-visible impact, hard to assert)
- Forward-button navigation (rarely used, low defect rate)
- Cross-tab state (outside scope of single-page acceptance testing)

---

## Sources

- Playwright docs: Navigations, page.goBack(), page.goForward(), Best Practices
- MDN: History API, Working with the History API
- Chrome DevTools: Navigation API, bfcache documentation (web.dev)
- Cypress docs: cy.go() API
- Framework test suites: Next.js e2e navigation tests, React Router __tests__/
- Vue.js: KeepAlive, Vue Router scroll behavior
- Remix: State management discussion
- React Testing Library: React Router example
- Kent C. Dodds: Integration testing philosophy
