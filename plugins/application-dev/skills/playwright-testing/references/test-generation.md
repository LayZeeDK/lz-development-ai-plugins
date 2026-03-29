# Test Generation Reference

This reference teaches how to write Playwright test files from test plans
(or directly from SPEC.md for simple apps). Covers the seed.spec.ts pattern,
selector strategy, assertion patterns, common testing patterns, and
anti-patterns to avoid.

---

## 1. Start with seed.spec.ts

The seed test verifies the environment is working before any functional
tests run. Create this file first -- if the seed test fails, no other
tests will pass.

```typescript
// tests/seed.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Environment Setup', () => {
  test('app is accessible at base URL', async ({ page }) => {
    const response = await page.goto('/');

    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
  });

  test('page has a title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/.+/);
  });

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });
});
```

The seed test confirms: the dev server responds, the page loads without
errors, and Playwright can interact with the app. Run seed.spec.ts before
writing functional tests to catch configuration issues early.

---

## 2. Test file organization

Mirror the `specs/` directory structure in `tests/`:

```
specs/                          tests/
|-- checkout-flow.md     ->     |-- checkout/
|                               |   '-- guest-checkout.spec.ts
|-- user-onboarding.md  ->     |-- onboarding/
|                               |   '-- new-user.spec.ts
'-- search.md            ->     |-- search/
                                |   '-- product-search.spec.ts
                                '-- seed.spec.ts
```

- **One test file per flow or feature area.** Each file covers the flows
  from one test plan (or a closely related subset).
- **Group related assertions in `test.describe()` blocks.** Use the flow
  name from the test plan as the describe label.
- **Name test files descriptively.** Use the flow or scenario name, not
  generic names like `test1.spec.ts`.

---

## 3. Selector strategy: accessibility-tree-first

Playwright provides role-based locators that query the browser's
accessibility tree. These selectors are resilient to UI changes and
align with how users (and screen readers) interact with the app.

### Preferred selectors (use these)

```typescript
// By ARIA role and accessible name
page.getByRole('button', { name: 'Submit' })
page.getByRole('heading', { name: 'Welcome' })
page.getByRole('link', { name: 'Home' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('checkbox', { name: 'Remember me' })
page.getByRole('navigation')
page.getByRole('main')

// By label (for form fields)
page.getByLabel('Email address')
page.getByLabel('Password')

// By placeholder (when no label exists)
page.getByPlaceholder('Search...')
page.getByPlaceholder('What needs to be done?')

// By visible text (for non-interactive elements)
page.getByText('Welcome back')
page.getByText('No results found')
```

### Fallback selectors (use when no semantic alternative exists)

```typescript
// data-testid (when element has no accessible role, label, or text)
page.getByTestId('sidebar-toggle')

// CSS selector (last resort -- fragile, breaks on refactors)
page.locator('.product-card >> nth=0')
```

### Selector priority

1. `getByRole()` -- first choice for all interactive elements
2. `getByLabel()` -- form fields with visible labels
3. `getByPlaceholder()` -- form fields without visible labels
4. `getByText()` -- static text content
5. `getByTestId()` -- elements with no semantic alternative
6. CSS/XPath -- last resort only

---

## 4. Assertion patterns

Playwright provides web-first assertions that auto-wait for the expected
condition. Always use `expect(locator)` assertions, not manual waits.

```typescript
// Page-level
await expect(page).toHaveTitle('Shopping Cart');
await expect(page).toHaveURL('/checkout');

// Visibility and state
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
await expect(page.getByRole('alert')).toBeHidden();
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();

// Text content
await expect(page.getByRole('status')).toHaveText('3 items left');
await expect(page.getByRole('status')).toContainText('items');

// Form state
await expect(page.getByLabel('Email')).toHaveValue('user@example.com');
await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();

// List counts
await expect(page.getByRole('listitem')).toHaveCount(3);
```

---

## 5. Common test patterns

### Navigation

```typescript
test('navigates to product detail page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Running Shoes' }).click();
  await expect(page).toHaveURL(/\/products\/\d+/);
  await expect(page.getByRole('heading', { name: 'Running Shoes' })).toBeVisible();
});
```

### Form submission

```typescript
test('submits contact form', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Message sent successfully')).toBeVisible();
});
```

### Dynamic content (use assertion auto-waiting, not manual waits)

```typescript
test('loads search results', async ({ page }) => {
  await page.goto('/search');
  await page.getByPlaceholder('Search...').fill('playwright');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(10);
});
```

### Shared setup with test.beforeEach

```typescript
test.describe('Todo management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('creates a new todo', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').fill('Buy milk');
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await expect(page.getByRole('listitem')).toHaveCount(1);
  });
});
```

---

## 6. Writing tests from test plans

For each flow in a test plan:

1. **Create the test file** in the matching `tests/` subdirectory.
2. **Add a `test.describe()` block** named after the flow.
3. **Translate each step** to a Playwright action (`click`, `fill`,
   `press`, `goto`, etc.).
4. **Translate each expected outcome** to a Playwright assertion
   (`expect(...).toBeVisible()`, `toHaveText()`, etc.).
5. **Add `test.beforeEach()`** for shared preconditions (navigation,
   login, data setup).

### Mapping plan steps to Playwright actions

| Plan step | Playwright action |
|-----------|-------------------|
| Navigate to [URL] | `page.goto(url)` |
| Click [element] | `page.getByRole(...).click()` |
| Type [text] in [field] | `page.getByLabel(...).fill(text)` |
| Press Enter | `page.getByLabel(...).press('Enter')` |
| Select [option] from [dropdown] | `page.getByRole('combobox').selectOption(value)` |
| Scroll to [element] | `page.getByText(...).scrollIntoViewIfNeeded()` |
| Hover over [element] | `page.getByRole(...).hover()` |
| Wait for [condition] | Use assertion auto-waiting (no manual waits) |

### Mapping plan outcomes to assertions

| Plan outcome | Playwright assertion |
|--------------|----------------------|
| [Text] is visible | `expect(locator).toBeVisible()` |
| [Text] appears on page | `expect(locator).toHaveText(text)` |
| Page navigates to [URL] | `expect(page).toHaveURL(url)` |
| [Element] is checked | `expect(locator).toBeChecked()` |
| [Element] is disabled | `expect(locator).toBeDisabled()` |
| [N] items in list | `expect(locator).toHaveCount(n)` |
| [Element] is NOT visible | `expect(locator).toBeHidden()` |

---

## 7. Anti-patterns to avoid

| Anti-pattern | BAD | GOOD |
|--------------|-----|------|
| Hard-coded waits | `page.waitForTimeout(3000)` | `expect(locator).toBeVisible()` (auto-wait) |
| Implementation details | `page.locator('.todo-list > li').count()` | `page.getByRole('listitem').toHaveCount(3)` |
| Brittle selectors | `page.locator('.btn-primary.submit-form')` | `page.getByRole('button', { name: 'Submit' })` |
| God tests | One test with create+edit+complete+delete | Separate test per behavior |
| Order dependency | Test 2 assumes state from test 1 | Each test sets up its own state |
