# Test Healing Reference

This reference teaches the test healing loop: run tests, collect failures,
diagnose root causes, fix either tests or app code, and re-run until tests
pass. The healing loop is the third and final phase of the Playwright Test
Agents plan/generate/heal workflow.

---

## 1. The healing loop

```
Run tests
   |
   v
All pass? --yes--> Done
   |
   no
   v
Collect failures
   |
   v
Diagnose root cause
   |
   v
Fix (test or app code)
   |
   v
Re-run tests (repeat)
```

Each iteration fixes one category of failures. Do not attempt to fix all
failures at once -- fix one category, re-run, and observe what remains.
Some failures are symptoms of a single root cause; fixing the root cause
resolves multiple failures.

---

## 2. Running tests

```bash
# Run all tests (concise output, single worker for deterministic debugging)
npx playwright test --reporter=line --workers=1

# Run a specific file or pattern
npx playwright test tests/checkout/guest-checkout.spec.ts
npx playwright test -g "creates a todo"

# Debugging flags
npx playwright test --headed          # visible browser window
npx playwright test --trace on        # trace for failed tests
npx playwright test -x                # stop on first failure

# Healing workflow: fix -> re-run failed -> full suite
npx playwright test --last-failed --reporter=line
npx playwright test --reporter=line
```

---

## 3. Reading Playwright error output

Playwright errors fall into three categories. Each requires a different
diagnostic approach.

### Assertion errors

```
Error: expect(locator).toHaveText("Welcome back")
  Expected: "Welcome back"
  Received: "Welcome to the app"
  Locator:  getByRole('heading', { name: 'Welcome' })
```

**Meaning:** The element exists and is visible, but its content does not
match the expected value.

**Diagnosis:**
- Is the expected text correct per SPEC.md?
- Did the app render different text than expected?
- Is the test checking the wrong element?

### Timeout errors

```
Error: locator.click: Timeout 30000ms exceeded.
  waiting for getByRole('button', { name: 'Submit' })
```

**Meaning:** Playwright waited for the element but it never appeared in
the DOM or never became actionable (visible, enabled, stable).

**Diagnosis:**
- Does the element exist on the page? (Screenshot to check.)
- Is the selector correct? (Check role, name, spelling.)
- Is the element hidden behind a modal, dropdown, or loading state?
- Does the page require scrolling to reveal the element?
- Is the app still loading? (Check for pending network requests.)

### Navigation errors

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173
```

**Meaning:** Playwright could not navigate to the URL.

**Diagnosis:**
- Is the dev server running?
- Is the base URL correct in `playwright.config.ts`?
- Is the port correct (check for port conflicts)?
- Does the `webServer` config in `playwright.config.ts` start the server?

---

## 4. Diagnostic strategy

When tests fail, follow this diagnostic flow:

### Step 1: Categorize failures

After running tests, group failures by type:

- **Environment failures** (seed.spec.ts fails): dev server not running,
  wrong base URL, port conflict. Fix the environment first.
- **Navigation failures** (page.goto errors): wrong routes, missing pages,
  broken redirects.
- **Selector failures** (timeouts on locators): elements not found, wrong
  role or name, elements not rendered.
- **Assertion failures** (wrong content): app behavior differs from test
  expectations.

Fix categories in this order. Environment issues block everything;
assertion issues are the most fine-grained.

### Step 2: Screenshot the actual state

For selector and assertion failures, take a screenshot of what the page
actually looks like:

```bash
# Screenshot the page at the failing URL
npx playwright-cli screenshot http://localhost:5173/checkout --output actual-state.png
```

Compare the actual state to what the test expects. This reveals:
- Missing elements (not rendered, behind loading state)
- Wrong text (typo in app or test)
- Layout differences (element exists but not visible in viewport)

### Step 3: Identify the root cause

For each failure, determine whether the problem is in:

1. **The test** -- wrong selector, wrong expected value, wrong URL, missing
   setup step.
2. **The app code** -- missing feature, broken logic, rendering error,
   wrong route.
3. **The test plan** -- incorrect assumption about app behavior, missing
   precondition.

---

## 5. Fixing tests vs. fixing app code

The key principle: **SPEC.md defines correct behavior.**

### Fix the app when:

- The test correctly describes a SPEC.md requirement, but the app does
  not implement it.
- The test expects behavior described in a user story, but the app
  produces different behavior.
- The app has a genuine bug (null reference, broken navigation, missing
  error handling).

Example: SPEC.md says "clicking Save shows a success message." Test
expects `page.getByText('Saved successfully')`. App does not show any
message. **Fix the app** -- add the success message.

### Fix the test when:

- The test uses a wrong selector (element exists but with different role
  or name).
- The test expects text that does not match the app's actual (correct)
  text.
- The test navigates to a wrong URL.
- The test is missing a setup step (login, data creation) that the app
  requires.
- The test asserts behavior not in SPEC.md (over-testing).

Example: Test uses `getByRole('button', { name: 'Submit' })` but the app
renders the button with text "Send". SPEC.md does not specify the button
label. **Fix the test** -- change to `{ name: 'Send' }`.

### Fix the test plan when:

- A precondition was incorrect (the app requires login but the plan did
  not mention it).
- A step assumes UI that does not exist (the plan says "click the sidebar"
  but the app uses a top nav).
- The expected outcome contradicts what the app correctly does.

After fixing the test plan, regenerate the affected tests.

---

## 6. Fix prioritization

Fix failures in this order:

1. **Environment issues** -- seed.spec.ts must pass before anything else.
   Fix dev server, base URL, port configuration.

2. **Shared setup issues** -- if many tests fail because of a missing
   login step or wrong navigation, fix the shared precondition first.
   This often resolves multiple failures at once.

3. **App code issues** -- if the test correctly describes SPEC.md behavior
   and the app does not deliver it, fix the app. These are genuine bugs.

4. **Test code issues** -- wrong selectors, wrong expected values, missing
   waits. Fix one test at a time, re-run to verify.

5. **Flaky tests** -- tests that pass sometimes and fail other times. These
   usually indicate timing issues:
   - Replace `waitForTimeout` with assertion auto-waiting
   - Add `waitForLoadState('networkidle')` before assertions that depend
     on API responses
   - Use `toBeVisible()` before interacting with dynamically loaded elements

---

## 7. The re-run workflow

After each fix, re-run to verify and discover remaining failures.

### Recommended process

```bash
# 1. Fix one category of failures

# 2. Re-run only the previously failed tests
npx playwright test --last-failed --reporter=line

# 3. If new failures appear, repeat diagnosis

# 4. When all targeted tests pass, run the full suite
npx playwright test --reporter=line

# 5. Check for regressions (tests that passed before but now fail)
```

### When to stop healing

- **All tests pass:** Ideal outcome. Move to handoff.

- **Most tests pass, remaining failures are spec gaps:** If a test failure
  reveals a SPEC.md requirement that the app genuinely cannot fulfill in
  this generation round (missing API, external dependency, complex feature),
  document it rather than force-passing the test.

  ```typescript
  // TODO: Requires external payment API integration (SPEC.md: US-007)
  // Skipping until payment service is available
  test.skip('completes checkout with credit card', async ({ page }) => {
    // ...
  });
  ```

- **Stuck on a single failure after 3 fix attempts:** Document the issue,
  skip the test, and move on. Do not spend unlimited time on one failure.

---

## 8. Common healing patterns

| Failure | Cause | Fix |
|---------|-------|-----|
| `locator.click` timeout | Element off-screen or behind overlay | `scrollIntoViewIfNeeded()` before click |
| `toBeVisible()` timeout | Element appears after async operation | `waitForLoadState('networkidle')` before assertion |
| Element detached from DOM | Page navigated, stale locator | Re-query after `waitForURL()` |
| Strict mode violation (N elements) | Selector matches multiple elements | Add `{ name: '...' }` filter or scope with `.first()` |
| Expected success, got validation error | Required field empty or wrong format | Fill all required fields with valid data |

---

## 9. Documenting test results

Before handing off to the Evaluator, summarize the test state:

- **Passing tests:** How many, covering which flows.
- **Skipped tests:** Which ones and why (spec gaps, external dependencies).
- **Known flaky tests:** Which ones and what causes the flakiness.
