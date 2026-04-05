# Test Planning Reference

This reference teaches how to explore a running app and create test plans
from SPEC.md. Test plans are Markdown documents in the `specs/` directory
that define what to test before any test code is written.

---

## 1. Explore the running app

Before writing test plans, understand the current state of the app.

### Using playwright-cli

```bash
# Take a screenshot of the current page
npx playwright-cli screenshot --browser msedge http://localhost:5173 --output screenshot.png

# Take a screenshot at a specific viewport
npx playwright-cli screenshot --browser msedge http://localhost:5173 --viewport 1280x720 --output desktop.png
npx playwright-cli screenshot --browser msedge http://localhost:5173 --viewport 375x812 --output mobile.png
```

### What to observe

- **Page structure:** How many pages or routes exist? What navigation is
  available?
- **Interactive elements:** Forms, buttons, links, modals, dropdowns, tabs.
- **Dynamic content:** Loading states, real-time updates, lazy-loaded
  sections.
- **Authentication:** Login/signup flows, protected routes, session
  management.
- **Error states:** What happens with invalid input, network failures, empty
  states?

---

## 2. Read SPEC.md and identify user flows

SPEC.md is the test oracle. Every user story and acceptance criterion is a
candidate for test coverage.

### Identifying key flows

1. **Read the user stories.** Each user story describes a flow from the
   user's perspective. Extract the primary action and expected outcome.

2. **Read the acceptance criteria.** These are the specific conditions that
   must hold. Each criterion maps to one or more assertions in a test.

3. **Prioritize by user impact.** Rank flows by how many users will
   encounter them and how critical they are:
   - **Core flows** (test first): The primary purpose of the app. If these
     break, the app is useless. Examples: checkout, document creation,
     search.
   - **Feature flows** (test second): Secondary features that add value
     but are not the app's core purpose. Examples: profile settings,
     notifications, export.
   - **Edge cases** (test last): Error handling, boundary conditions, rare
     user paths. Only if time permits.

4. **Group related flows.** Flows that share preconditions or setup can
   often be grouped in one test plan file. Example: all checkout-related
   flows in `specs/checkout-flow.md`.

---

## 3. Test plan format

Each test plan is a Markdown file in `specs/` with a consistent structure:

```markdown
# [Flow Name]

[Brief description of what this flow covers and why it matters.]

## Preconditions

- [App state required before the flow starts]
- [Data that must exist (user accounts, products, etc.)]
- [Environment requirements (dev server running, specific route accessible)]

## Flows

### Flow 1: [Specific scenario name]

**Steps:**
1. Navigate to [URL or route]
2. [User action: click, type, select, scroll, etc.]
3. [Next user action]
4. ...

**Expected outcomes:**
- [Observable result: page content, URL change, visual state]
- [Assertion: specific text visible, element state, data persisted]
- [Negative assertion: error message NOT shown, redirect does NOT happen]

### Flow 2: [Another scenario]

**Steps:**
1. ...

**Expected outcomes:**
- ...

## Notes

- [Any gotchas, timing considerations, or dependencies between flows]
- [Known limitations that tests should work around]
```

### Example: Todo app test plan

```markdown
# Todo Management

Core CRUD operations for todo items. These are the app's primary
purpose -- if todo creation or completion breaks, the app is unusable.

## Preconditions

- Dev server running at http://localhost:5173
- No existing todos (clean state)

## Flows

### Flow 1: Create a new todo

**Steps:**
1. Navigate to http://localhost:5173
2. Click the text input field (placeholder "What needs to be done?")
3. Type "Buy groceries"
4. Press Enter

**Expected outcomes:**
- Todo item "Buy groceries" appears in the list
- Input field is cleared
- Todo count shows "1 item left"

### Flow 2: Complete a todo

**Steps:**
1. Create a todo "Buy groceries" (Flow 1)
2. Click the checkbox next to "Buy groceries"

**Expected outcomes:**
- Todo text shows strikethrough styling
- Todo count shows "0 items left"
- Checkbox is checked

### Flow 3: Delete a todo

**Steps:**
1. Create a todo "Buy groceries" (Flow 1)
2. Hover over the todo item
3. Click the delete button (X icon)

**Expected outcomes:**
- Todo item "Buy groceries" is removed from the list
- Todo count updates accordingly

## Notes

- Flow 2 and Flow 3 depend on Flow 1 for setup
- Filter buttons (All/Active/Completed) are a separate test plan
```

---

## 4. Coverage priority

Apply this priority order when creating test plans:

1. **Core user flows:** The happy path for the app's primary purpose.
   Every app has 1-3 core flows. Test these first and most thoroughly.

2. **Feature-specific flows:** Secondary features described in SPEC.md.
   One test plan per feature area.

3. **Error handling flows:** What happens when things go wrong -- invalid
   input, network errors, unauthorized access. Only cover error flows
   explicitly mentioned in SPEC.md acceptance criteria.

4. **Edge cases:** Boundary conditions, unusual input, race conditions.
   Only if all higher-priority flows are covered and time permits.

Do not aim for exhaustive coverage. The Evaluator catches what tests miss.
Focus on the flows that would make the app unusable if broken.

---

## 5. When to skip planning

Skip the planning phase and write tests directly when:

- The app has only 1-2 pages with obvious flows
- SPEC.md acceptance criteria directly describe testable actions
  (no interpretation needed)
- The test plan would be shorter than the tests themselves
- The app is a simple CRUD interface with standard patterns

When skipping planning, still follow the generation reference
(`references/test-generation.md`) for writing tests and the healing
reference (`references/test-healing.md`) for debugging failures.

---

## 6. Plan review checklist

Before moving to the generation phase, verify each test plan:

- [ ] Every SPEC.md user story has at least one corresponding flow
- [ ] Each flow has clear preconditions (no hidden assumptions)
- [ ] Steps are numbered and describe user-visible actions (not code)
- [ ] Expected outcomes are observable (visible text, URL, element state)
- [ ] Flows are prioritized: core first, features second, edges last
- [ ] No flow depends on another without stating it in preconditions
