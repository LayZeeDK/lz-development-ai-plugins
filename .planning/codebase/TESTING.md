# Testing Patterns

**Analysis Date:** 2026-03-27

## Overview

This codebase does not have traditional unit tests, integration tests, or test frameworks (Jest, Vitest, pytest, etc.). Instead, testing is conducted through:

1. **Agent-based QA** -- The Evaluator agent performs adversarial testing on generated applications using `playwright-cli`
2. **Generated application testing** -- Applications built by the Generator agent are tested by the Evaluator against the specification
3. **Specification compliance** -- Tests verify that built applications match the SPEC.md requirements
4. **Manual verification patterns** -- Documentation describes how to verify API functionality and feature completeness

The testing philosophy is embedded in `plugins/application-dev/agents/evaluator.md`, which defines comprehensive adversarial testing practices.

## Testing Framework

**QA Model:**
- `playwright-cli` for browser interaction and UI testing
- No formal test runner or assertion framework
- Manual verification combined with automated agent-driven testing

**Run Commands:**
```bash
# Start the application (varies by project type)
npm run dev                    # Node.js frontend
python app.py                  # Python backend
playwright-cli open http://localhost:<port>
```

**Test Execution:**
- Tests are not run in CI/CD
- Testing happens in the Evaluator agent workflow (see "Build/QA Loop" in application-dev SKILL.md)
- Each generated application is tested across 4 scoring criteria

## Agent-Driven Testing (Primary Pattern)

**Test workflow:**
See `plugins/application-dev/agents/evaluator.md` for the complete QA workflow.

### 1. Application startup
```bash
# Verify the dev server starts
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173  # Returns 200
```

### 2. Browser-based interaction with playwright-cli

```bash
# Open browser to the application
playwright-cli open http://localhost:<port>

# Take accessibility snapshot to see all interactive elements
playwright-cli snapshot

# Interact with UI elements
playwright-cli click <ref>
playwright-cli fill <ref> "text to type"
playwright-cli select <ref> "option-value"

# Navigate between pages
playwright-cli goto http://localhost:<port>/other-page
playwright-cli go-back

# Take screenshots for visual assessment
playwright-cli screenshot
playwright-cli screenshot --filename=feature-name.png

# Check for JavaScript errors and network issues
playwright-cli console
playwright-cli network

# Keyboard and mouse interactions
playwright-cli press Enter
playwright-cli press Tab
playwright-cli drag <ref-from> <ref-to>
playwright-cli hover <ref>

# Clean up
playwright-cli close
```

### 3. API endpoint testing

For backend applications:
```bash
# GET endpoints
curl -s http://localhost:<port>/api/<endpoint> | head -c 2000

# POST endpoints
curl -s -X POST http://localhost:<port>/api/<endpoint> \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# Check HTTP status codes
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/api/nonexistent
```

## Test Structure

**Evaluator QA workflow (from evaluator.md section 4):**

1. **Navigate every major feature area** -- Take a snapshot on each page/view, screenshot distinctive UI states
2. **Attempt each user story from spec** -- Try to complete every described action, note success/failure
3. **Test end-to-end workflows** -- Complete realistic multi-step workflows, not isolated features
4. **Look for broken interactions** -- Click every button, submit every form, open every dialog
5. **Check data persistence** -- Create something, navigate away, come back; verify it persists
6. **Test error states** -- Submit empty forms, enter invalid data, try impossible actions
7. **Stress-test common patterns** -- Rapid-click elements, navigate back/forward repeatedly, resize viewport
8. **Test edge cases** -- Try boundary values: very long text, special characters, empty collections, maximum item counts
9. **One negative test per feature** -- For each feature in spec, perform at least one negative-path test
10. **Check terminology consistency** -- Verify naming is consistent across UI labels, page titles, navigation

**Checklist from evaluator.md section 3 for regression testing (rounds 2+):**
```bash
# See what changed since last QA round
git log --oneline -20
git diff HEAD~5 --stat

# Re-read existing QA-REPORT.md and extract:
# - Feature status table (which features had "Implemented" status)
# - Bugs list (which bugs were reported)
# - Previous scores for each criterion
```

## Mocking

**Not applicable to this codebase:**
This codebase does not use mocking frameworks. Agents generate code that may use mocks (e.g., fetch mocking, DOM mocking), but the codebase itself does not include mock definitions.

**Pattern when agents generate code:**
Generated applications may implement mocking for:
- API responses (fetch with mock data)
- Database calls (in-memory substitutes)
- Time-dependent functionality (fake clocks)

No mocking framework is prescribed; generators choose based on the tech stack.

## Specification and Feature Validation

**Test scope:**
See `plugins/application-dev/agents/evaluator.md` section 5 ("Test with playwright-cli") for the comprehensive testing approach.

**Feature coverage validation:**
```markdown
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Feature Name | Implemented / Partial / Missing / Broken | Brief explanation |
| 2 | Feature Name | ... | ... |
```

**Rules for status:**
- **Implemented**: Feature works completely and matches spec
- **Partial**: Core purpose works, but some aspects missing (treat strictly -- if missing part is essential, mark Broken)
- **Missing**: Feature not present in application
- **Broken**: Feature present but does not work correctly

**Scoring guidance (from evaluator.md section 5):**
- **Product Depth** (threshold 7): How many spec features are implemented?
  - 1-3: Minimal -- most features missing
  - 4-6: Partial -- several features stubbed, broken, or superficial
  - 7-8: Solid -- most features implemented
  - 9-10: Comprehensive -- all features with polish
- **Functionality** (threshold 7): Does the app actually work when used?
  - 1-3: Core features broken
  - 4-6: Basic features work but many interactions fail
  - 7-8: Most features work correctly, only minor bugs
  - 9-10: Everything works reliably, edge cases handled
- **Visual Design** (threshold 6): Does UI have coherent identity matching spec?
  - 1-3: Broken layout, unstyled, or unusable
  - 4-5: Functional but generic (framework defaults, AI-slop)
  - 6-7: Recognizable identity with deliberate choices
  - 8-10: Cohesive design language, distinctive, matches spec vision
- **Code Quality** (threshold 6): Is code well-structured and maintainable?
  - 1-3: Disorganized, inconsistent, fragile
  - 4-5: Works but poorly structured, mixed patterns, dead code
  - 6-7: Reasonable structure, consistent patterns
  - 8-10: Clean architecture, strong separation of concerns

## Bug Reporting Pattern

**From evaluator.md section 5:**

```
1. **<Bug title>**
   - **Steps to reproduce:** <exact steps>
   - **Expected:** <what should happen>
   - **Actual:** <what actually happens>
   - **Severity:** Critical / Major / Minor

2. **<Bug title>**
   - ...
```

**Severity levels:**
- **Critical**: Core feature broken, app crashes, security issue
- **Major**: Important feature fails, significant functionality lost, workflow blocked
- **Minor**: Non-critical feature doesn't work, cosmetic issue, edge case bug

**Grouping strategy:**
Group related issues under a shared root cause. Example: "If multiple symptoms trace back to one underlying problem (e.g., four layout issues caused by one broken flex container), group them and identify the root cause."

## QA Report Output Format

**Report file:** `QA-REPORT.md` in the application root

**Required sections (from evaluator.md section 8):**

```markdown
# QA Report -- <Product Name>

## Build Round: <N>

## Verdict: <PASS or FAIL>

## Scores

| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Product Depth | X/10 | 7 | PASS/FAIL |
| Functionality | X/10 | 7 | PASS/FAIL |
| Visual Design | X/10 | 6 | PASS/FAIL |
| Code Quality | X/10 | 6 | PASS/FAIL |

## Product Depth Assessment

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Feature Name | Implemented / Partial / Missing / Broken | Brief explanation |
...

<Detailed commentary on feature coverage>

## Functionality Assessment

<Describe what you tested and exactly what happened>

### Bugs Found

1. **<Bug title>**
   - **Steps to reproduce:** <exact steps>
   - **Expected:** <what should happen>
   - **Actual:** <what actually happens>
   - **Severity:** Critical / Major / Minor

...

## Visual Design Assessment

<Design language match, distinctiveness, AI-slop markers>

## Code Quality Assessment

<Project structure, patterns, consistency, error handling>

## Regressions (Rounds 2+ Only)

| Previously Working | Now Broken | Likely Cause |
|--------------------|------------|--------------|
| <feature/behavior> | <what fails> | <git diff context> |

## Priority Fixes for Next Round

1. **<Highest priority fix>** -- <which criterion it improves and why>
2. ...
```

## Regression Testing (Rounds 2+)

**When to run regression tests:**
- After first build round, subsequent rounds check that previously-passing features still work
- Manual regression checklist: use previous QA-REPORT.md feature status table as retest checklist
- Verify that reported bugs from previous round are actually fixed

**Regression detection patterns:**
- Behavioral regressions (not just code-level) -- CSS changes can break layout in unrelated components
- Layout breakage at different viewport sizes
- Async timing issues
- Dependency side effects (silent behavior changes)

**Design language regression:**
Compare current visual state against spec's design language AND previous round's state. Flag if design drifted further from spec.

## Code Review and Quality Assessment

**Read-only code review (from evaluator.md section 6):**

Check for:
- Project structure and organization
- Code consistency and style
- Error handling patterns
- Dead code, TODOs, stubs, or placeholder implementations
- Dependency choices (appropriate? excessive?)
- Build configuration
- Performance red flags: infinite loops, duplicate API calls, unbounded DOM growth, missing cleanup of event listeners/timers
- Security red flags: hardcoded API keys/secrets, unsanitized user input rendered as HTML, credentials in client-side code, missing input validation on API endpoints

## Testing Philosophy

**From evaluator.md section 1 ("Critical Mindset"):**

**Try to break it:**
Your primary job is adversarial: find the ways the application fails. Do not navigate the happy path. Actively look for what breaks. Click things that should not be clicked. Enter data that should not be entered. Use the application in ways not anticipated.

**Be skeptical of surface impressions:**
LLM-generated applications look impressive at first glance but fail when interacted with. Go past the surface. Test every interactive element. Follow every workflow to completion.

**Do not rationalize issues away:**
If a button does not work, that is a bug. If a feature is stubbed, that is a missing feature. Report what you observe, not what you wish were true.

**Do not inflate scores:**
A score of 5 is average. A score of 7 means "good, meets expectations." Scores of 8+ require genuine excellence.

**Default to strict:**
When uncertain whether something works, assume it is broken until proven otherwise. When uncertain whether a bug is Major or Critical, call it Critical.

**Make feedback actionable:**
"The design feels generic" is useless. "The dashboard uses default Tailwind card components with no custom styling -- the spec called for a brutalist aesthetic with high contrast and monospace typography" gives something concrete to act on.

## Coverage and Quality Thresholds

**Thresholds for application pass:**
- Product Depth: 7/10 or higher
- Functionality: 7/10 or higher
- Visual Design: 6/10 or higher
- Code Quality: 6/10 or higher

Overall verdict is **PASS** only if ALL criteria meet their thresholds. If any criterion falls below threshold, verdict is **FAIL**.

**Build/QA loop:**
- Maximum 3 rounds: Build -> Evaluate -> (if FAIL and round < 3) Build again
- After round 3, output a summary regardless of verdict

## Specific Testing Patterns for Browser APIs

**For on-device AI features (browser-prompt-api.md section 3):**

```javascript
// Feature detection
if (typeof LanguageModel === 'undefined') {
  // Prompt API not supported
}

// Availability check
const availability = await LanguageModel.availability({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});
// Returns: "available" | "downloadable" | "downloading" | "unavailable"

// Test session creation and cleanup
const session = await LanguageModel.create({ /* ... */ });
try {
  const result = await session.prompt('Test prompt');
} finally {
  session.destroy();  // Always clean up
}
```

**For graceful degradation (referenced in browser-prompt-api.md section 12):**

Test both:
1. Happy path: API available and working
2. Degradation path: API unavailable, fallback behavior functions

## Non-applicable Testing Patterns

This codebase **does not use:**
- Unit testing frameworks (Jest, Vitest, pytest, etc.)
- Test fixtures or factories (fixtures are data, not code factories)
- Snapshot testing
- End-to-end test runners (Cypress, Playwright Test, Selenium)
- Coverage metrics or reports
- Test tags or categorization
- Parameterized tests
- Setup/teardown hooks in code
- Mock object libraries
- Assertion libraries (beyond what agents use in generated code)

Agents may generate applications that use any of these frameworks, but the plugin codebase itself does not test itself using them.

---

*Testing analysis: 2026-03-27*
