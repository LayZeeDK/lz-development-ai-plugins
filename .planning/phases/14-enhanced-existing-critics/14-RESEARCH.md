# Phase 14: Enhanced Existing Critics - Research

**Researched:** 2026-04-03
**Domain:** Critic agent methodology expansion (cross-page visual consistency + round-trip navigation testing)
**Confidence:** HIGH

## Summary

Phase 14 enhances two existing critic agents with new evaluation capabilities. The perceptual-critic gains cross-page visual consistency detection via a write-and-run `consistency-audit.spec.ts` that extracts computed styles from shared components across pages and produces a compact JSON report. The projection-critic gains A->B->A round-trip navigation tests added inline to the existing `acceptance-tests.spec.ts` file. Both enhancements use established write-and-run patterns already proven in the codebase, and the Visual Design calibration in SCORING-CALIBRATION.md is updated with a new ceiling rule and revised scenario boundaries.

All three requirements (EVAL-01, EVAL-02, EVAL-03) are documentation/methodology changes to existing agent definition files and one reference file. No CLI code changes are needed. The implementation modifies 3-4 markdown files within the `plugins/application-dev/` directory. The research foundation is thorough -- two dedicated research documents (cross-page-visual-consistency.md and round-trip-navigation-testing.md) were prepared before CONTEXT.md decisions were locked.

**Primary recommendation:** Implement as 1-2 plans. Plan 1 covers EVAL-01 + EVAL-03 (perceptual-critic methodology + calibration update, tightly coupled). Plan 2 covers EVAL-02 (projection-critic A->B->A patterns, independent). Alternatively, a single plan can cover all three since they are all documentation edits with no code dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Cross-page visual consistency method (EVAL-01):**
- Write-and-run fingerprinting via `consistency-audit.spec.ts`
- Three extraction tiers: shared component comparison (Tier 1), palette discipline metrics (Tier 2), CSS custom property divergence (Tier 3)
- 14 style properties per element: color, backgroundColor, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, borderRadius, borderColor, borderWidth, boxShadow, gap, paddingTop, paddingRight, paddingBottom, paddingLeft
- 5-page cap (homepage + up to 4 internal pages)
- Integration into OBSERVE step, findings feed into DETECT and SCORE as VD findings
- Severity mapping with specific thresholds (nav/footer divergence=Major, CSS custom property divergence=Critical, etc.)
- Heuristic: compare same semantic role across pages, not same CSS class

**A->B->A navigation test patterns (EVAL-02):**
- SPEC-derived round-trip tests in a `test.describe('Round-trip navigation')` block at the end of existing `acceptance-tests.spec.ts`
- Test patterns: CRUD persistence, filtered view persistence, URL integrity, console error monitoring
- Return method: `page.goBack()` + `waitForURL()` (back-button as highest-defect path)
- Scoring: Functionality only (FN-X findings). Excluded from acceptance_tests.results[] feature mapping
- Round 2+ behavior: automatic via existing test reuse/heal/regenerate workflow

**Visual Design calibration update (EVAL-03):**
- New ceiling rule: shared components differ across pages = max 6
- Updated 6/10 scenario: add nav accent color inconsistency description
- Updated 8/10 scenario: strengthen with "ACROSS ALL PAGES" language
- Updated "Not 7" and "Not 9" boundary explanations

**Token efficiency:** No per-enhancement budget target. Existing write-and-run patterns sufficient.

### Claude's Discretion
- Exact structure and ordering of the new OBSERVE subsection in perceptual-critic.md
- The consistency-audit.spec.ts template structure (reference implementation provided but exact form flexible)
- Link discovery eval expression for page enumeration
- Exact wording of updated calibration scenario prose (within agreed boundary direction)
- Whether to add the consistency audit template to PLAYWRIGHT-EVALUATION.md or keep it in the agent definition
- Test file organization for the round-trip describe block placement

### Deferred Ideas (OUT OF SCOPE)
- Primary button fingerprinting (v1.3 candidate)
- Per-dimension EMA for Visual Design consistency trend (v1.3 CONV-06 candidate)
- Scroll position restoration testing (P3 priority, unreliable, framework responsibility)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EVAL-01 | Perceptual-critic enhanced with cross-page visual consistency checks (design token extraction, color/typography/spacing comparison across pages) | Grounded in BackstopJS scenario-per-URL pattern, Style Dictionary/Theo token taxonomy, Parker/Wallace unique-value-count heuristics. Write-and-run consistency-audit.spec.ts extracts computed styles via getComputedStyle, compares shared components (nav, footer, headings, body) cross-page, and reports palette discipline metrics. Reference implementation in research/cross-page-visual-consistency.md Section 5.3. |
| EVAL-02 | Projection-critic enhanced with A->B->A navigation testing (round-trip navigation, state persistence, back-button behavior) | Grounded in SPA state persistence taxonomy (9 layers), canonical Setup/Navigate/Return/Assert pattern, Playwright goBack()+waitForURL() navigation API. SPEC-derived round-trip tests inline in acceptance-tests.spec.ts. Reference implementation in research/round-trip-navigation-testing.md Section 6. |
| EVAL-03 | Visual Design calibration scenarios in SCORING-CALIBRATION.md updated for expanded cross-page scope | New ceiling rule (shared component divergence = max 6), updated 6/10 and 8/10 scenario boundaries. Calibration update must happen atomically with methodology expansion (Pitfall 6 prevention). |
</phase_requirements>

## Standard Stack

### Core

No new libraries or tools are introduced. This phase modifies existing markdown files only.

| File | Purpose | Change Type |
|------|---------|-------------|
| `plugins/application-dev/agents/perceptual-critic.md` | Perceptual critic agent definition | Add OBSERVE subsection + tool allowlist update |
| `plugins/application-dev/agents/projection-critic.md` | Projection critic agent definition | Add TEST subsection for round-trip patterns |
| `plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md` | Scoring calibration reference | Add ceiling rule + update scenario boundaries |
| `plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md` | Playwright evaluation techniques | Optionally add consistency audit template + A->B->A template |

### Supporting

| Technology | Version | Purpose | Already in Stack |
|------------|---------|---------|------------------|
| Playwright `page.evaluate()` / `getComputedStyle()` | N/A (browser API) | Style extraction for consistency audit | Yes -- used in eval-first section |
| Playwright `page.goBack()` / `waitForURL()` | @playwright/test | Round-trip navigation testing | Yes -- available but not yet documented as pattern |
| `writeFileSync` (Node.js) | N/A | Write consistency audit JSON from test | Yes -- standard in write-and-run tests |

### Alternatives Considered

None. All decisions are locked by CONTEXT.md. No alternative approaches need evaluation.

## Architecture Patterns

### Files Modified

```
plugins/application-dev/
|-- agents/
|   |-- perceptual-critic.md     # EVAL-01: Add cross-page consistency audit to OBSERVE
|   '-- projection-critic.md     # EVAL-02: Add A->B->A test patterns to TEST
'-- skills/application-dev/references/evaluator/
    |-- SCORING-CALIBRATION.md   # EVAL-03: Add ceiling rule + update scenarios
    '-- PLAYWRIGHT-EVALUATION.md # Optional: Add templates for both enhancements
```

### Pattern 1: Perceptual Critic OBSERVE Expansion (EVAL-01)

**What:** Add a "Cross-Page Consistency Audit" subsection after the existing per-page observation in the perceptual-critic's OBSERVE step. This subsection instructs the critic to: (1) discover internal pages via link extraction eval, (2) write a consistency-audit.spec.ts test, (3) run it, (4) read the JSON report, (5) interpret findings using the severity mapping.

**Where in file:** After the existing `npx playwright-cli viewport` responsive testing block, before DETECT. The OBSERVE step currently has eval-first and resize+eval patterns. The consistency audit becomes a third subsection.

**Tool allowlist change:** The perceptual-critic's YAML frontmatter `tools` array must add `"Bash(npx playwright test *)"` to enable write-and-run test execution. Currently the perceptual-critic only has `Bash(npx playwright-cli *)` (interactive CLI) but not `Bash(npx playwright test *)` (test runner). The projection-critic and perturbation-critic already have this tool.

**Current tools line (line 18):**
```yaml
tools: ["Read", "Write", "Bash(npx playwright-cli *)", "Bash(node *appdev-cli* install-dep *)", "Bash(node *appdev-cli* check-assets *)", "Bash(node *appdev-cli* static-serve*)"]
```

**Updated tools line:**
```yaml
tools: ["Read", "Write", "Bash(npx playwright-cli *)", "Bash(npx playwright test *)", "Bash(node *appdev-cli* install-dep *)", "Bash(node *appdev-cli* check-assets *)", "Bash(node *appdev-cli* static-serve*)"]
```

**Key structural decisions:**
- The consistency audit template can live either in the agent definition (inline) or in PLAYWRIGHT-EVALUATION.md (external reference). Claude's discretion per CONTEXT.md.
- The findings from the consistency audit flow into DETECT as VD-prefixed findings and into SCORE via existing ceiling rules plus the new "shared component divergence" ceiling.

### Pattern 2: Projection Critic TEST Expansion (EVAL-02)

**What:** Add guidance for A->B->A round-trip navigation tests as a `test.describe('Round-trip navigation')` block at the end of the acceptance-tests.spec.ts file that the projection-critic already writes.

**Where in file:** Within the TEST section of projection-critic.md, after the existing test coverage list and before Round 2+ Test Reuse. The guidance instructs the critic to derive round-trip tests from SPEC.md features.

**Key structural decisions:**
- Round-trip test failures produce FN-X findings (Functionality dimension)
- Round-trip tests are explicitly excluded from the `acceptance_tests.results[]` feature mapping that feeds Product Depth computation
- The tests use `page.goBack()` as the return method, always followed by a content assertion (not `waitForTimeout`)
- One file, one test run, one JSON result -- no additional tool calls beyond the existing write-and-run workflow

### Pattern 3: Calibration Update (EVAL-03)

**What:** Add one new ceiling rule to the Visual Design section and update two existing calibration scenario descriptions to reference cross-page consistency.

**Where in file:** SCORING-CALIBRATION.md -- (1) new row in the Visual Design ceiling table, (2) updated prose in the 6/10 "At Threshold" scenario, (3) updated prose in the 8/10 "Above Threshold" scenario, (4) updated "Not 7" and "Not 9" boundary explanations.

**Atomic change requirement:** The calibration update MUST happen in the same plan as the perceptual-critic methodology expansion, or in a later plan within the same phase. A methodology that checks for cross-page consistency without matching calibration anchors creates a scoring gap (Pitfall 6).

### Anti-Patterns to Avoid

- **Adding a separate test file for round-trip tests:** The projection-critic writes one `acceptance-tests.spec.ts` file. Round-trip tests go inline as a `test.describe` block, not in a separate file. A separate file would require an additional `npx playwright test` call, adding tool-call overhead.
- **Perceptual-critic reading consistency-audit.json into context then running more evals:** The write-and-run pattern means the test does all the work. The critic reads only the compact JSON report. Do not add interactive eval calls after the audit.
- **Forgetting the tool allowlist update:** Without `Bash(npx playwright test *)`, the perceptual-critic cannot execute the consistency audit test. This is the most likely implementation oversight.
- **Updating calibration scenarios without matching methodology:** Pitfall 6 -- calibration anchors must reference cross-page scope only after the methodology can actually check it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-page style extraction | Custom eval-per-page loop in agent context | Write-and-run test that visits all pages and writes JSON | Token budget -- eval-per-page consumes context; write-and-run keeps it outside |
| Style property normalization | Custom color/font parsing | `getComputedStyle()` browser API | Already normalizes colors to rgb(), resolves em/rem to px, expands shorthands |
| Cross-page comparison logic | Agent-side JSON diff in context | Comparison logic inside the test file | Test file handles comparison, writes only findings to JSON -- agent reads summary only |
| Round-trip test framework | Custom navigation helpers | Playwright `page.goBack()` + `waitForURL()` + auto-retry assertions | Built-in, well-tested, handles SPA soft navigation correctly |

## Common Pitfalls

### Pitfall 1: Tool Allowlist Omission

**What goes wrong:** The perceptual-critic's consistency audit uses `npx playwright test` (the test runner) but the current tool allowlist only includes `npx playwright-cli` (the interactive CLI). The write-and-run test will fail with a permission error.
**Why it happens:** Easy to miss because the agent definition's YAML frontmatter is at the top, separate from the methodology instructions.
**How to avoid:** Update the `tools` array in perceptual-critic.md frontmatter to include `"Bash(npx playwright test *)"`.
**Warning signs:** Consistency audit instructions reference `npx playwright test` but `tools` array does not include the pattern.

### Pitfall 2: Calibration-Methodology Desync (Pitfall 6 from roadmap)

**What goes wrong:** Calibration scenarios reference cross-page consistency but the methodology does not yet check for it (or vice versa). Critics produce scores that do not match the calibration anchors.
**Why it happens:** EVAL-01 and EVAL-03 are in the same phase but could be split across plans that execute in separate sessions.
**How to avoid:** If using two plans, ensure EVAL-03 is in the same plan as EVAL-01 (or a later plan in the same phase). The calibration update is lightweight and can be included in the same plan.
**Warning signs:** SCORING-CALIBRATION.md references "shared components differ across pages" but perceptual-critic.md has no cross-page audit instructions.

### Pitfall 3: Round-Trip Tests Polluting Product Depth

**What goes wrong:** Round-trip test results get included in the `acceptance_tests.results[]` array that feeds Product Depth computation, inflating or deflating the feature coverage metric.
**Why it happens:** The projection-critic already maps acceptance tests to SPEC features. If round-trip tests are not explicitly excluded from the results mapping, they appear as additional feature-level test results.
**How to avoid:** The projection-critic methodology must clearly state that round-trip tests produce FN-X findings only and are excluded from the `acceptance_tests.results[]` feature mapping. Round-trip tests assess feature durability, not feature presence.
**Warning signs:** `acceptance_tests.results` contains entries like `{ "feature": "Round-trip: CRUD persistence", ... }`.

### Pitfall 4: Consistency Audit Output Path Hard-Coded to Wrong Round

**What goes wrong:** The consistency-audit.spec.ts template writes JSON to a hard-coded path like `evaluation/round-N/perceptual/consistency-audit.json` but the critic forgets to substitute the actual round number.
**Why it happens:** The template in research uses `round-N` as a placeholder. If the agent instructions do not explicitly note this substitution, the test writes to the wrong directory.
**How to avoid:** The methodology instructions should note that the test file must use the current round number in the output path, just as acceptance-tests.spec.ts substitutes the PORT.
**Warning signs:** consistency-audit.json is not found where expected after running the test.

### Pitfall 5: Cross-Origin Stylesheet Error in Custom Property Extraction

**What goes wrong:** The consistency audit's custom property extraction iterates `document.styleSheets` and accesses `sheet.cssRules`. If any stylesheet is cross-origin (CDN fonts, external CSS), this throws a `SecurityError`.
**Why it happens:** Generated apps commonly load Google Fonts or CDN-hosted CSS.
**How to avoid:** The try/catch in the reference implementation already handles this (`catch(e) { /* cross-origin stylesheet, skip */ }`). The methodology or template must preserve this error handling.
**Warning signs:** Consistency audit test crashes with `DOMException: Failed to read the 'cssRules' property`.

### Pitfall 6: Stale "both critics" or "two critics" References

**What goes wrong:** Adding new content to critic agent definitions might inadvertently use stale terminology from pre-v1.2 (e.g., "both critics" instead of "all three critics").
**Why it happens:** Phase 13 updated SKILL.md to eliminate these references, but agent definition files are edited independently.
**How to avoid:** Search each modified file for stale references after editing.
**Warning signs:** Text mentions "both critics", "two critics", "four agents" in the context of the v1.2 ensemble.

## Code Examples

### Perceptual-Critic OBSERVE Subsection (reference structure)

From research/cross-page-visual-consistency.md Section 6.2, adapted for the agent definition:

```markdown
### Cross-Page Consistency Audit

After per-page observation, run a cross-page visual consistency audit using
the write-and-run pattern:

1. Discover internal pages from homepage navigation links:
   `npx playwright-cli eval "[...document.querySelectorAll('a[href]')].map(a => new URL(a.href, location.origin)).filter(u => u.origin === location.origin).map(u => u.pathname).filter((v,i,a) => a.indexOf(v) === i).slice(0, 4)"`
   Cap at 5 total pages (homepage + up to 4 discovered).

2. Write `evaluation/round-N/perceptual/consistency-audit.spec.ts` using the
   write-and-run pattern. The test visits all pages, extracts computed styles
   via getComputedStyle, performs cross-page comparison, and writes
   `consistency-audit.json`.

3. Run: `npx playwright test evaluation/round-N/perceptual/consistency-audit.spec.ts --reporter=json`

4. Read `evaluation/round-N/perceptual/consistency-audit.json`.

5. Interpret findings using severity mapping:
   [severity table from CONTEXT.md]
```

### Projection-Critic TEST Subsection (reference structure)

From research/round-trip-navigation-testing.md Section 6, adapted for the agent definition:

```markdown
### Round-Trip Navigation Tests

At the end of acceptance-tests.spec.ts, add a `test.describe('Round-trip
navigation')` block with SPEC-derived round-trip tests:

- For each CRUD feature: create data, navigate away, return via
  `page.goBack()`, verify data persists
- For each filtered/sorted view: apply filters, click into detail, return
  via `page.goBack()`, verify filters active
- One URL integrity test: navigate with query params, leave, return, assert
  params intact
- One console error test: monitor `page.on("console", ...)` during A->B->A,
  assert no errors

Always follow `page.goBack()` with a content assertion or `waitForURL()`,
never `waitForTimeout`. SPA routers update asynchronously.

Round-trip test failures produce FN-X findings (Functionality dimension).
They are NOT included in `acceptance_tests.results[]` feature mapping --
Product Depth measures feature presence, not feature durability.
```

### SCORING-CALIBRATION.md Updates (reference content)

New ceiling rule row for Visual Design table:

```markdown
| Shared components (nav/footer/header) visually differ across pages | max 6 |
```

Updated 6/10 scenario addition:

```
"Navigation bar uses the same font but a slightly different accent color on
the settings page. Heading sizes are consistent across pages."
```

Updated "Not 7" boundary:

```
"A 7 requires visual coherence across all pages. Placeholder images plus
the nav color inconsistency show incomplete design execution."
```

Updated 8/10 scenario strengthening:

```
"Color palette has 4 intentional accent colors used consistently ACROSS ALL
PAGES. Navigation and footer are visually identical on every page."
```

Updated "Not 9" boundary:

```
"The settings page reverts to a generic form layout -- shared components
are consistent but page-level design language breaks."
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-page visual evaluation | Cross-page consistency audit via write-and-run | Phase 14 (this phase) | Detects nav/footer divergence, palette overload, CSS variable drift |
| Feature-only acceptance tests | Feature tests + round-trip navigation tests | Phase 14 (this phase) | Catches state persistence bugs (component state loss, URL corruption, console errors during nav) |
| VD calibration without cross-page scope | VD calibration with cross-page ceiling and scenario boundaries | Phase 14 (this phase) | Calibration anchors match enhanced methodology |

**Key insight:** Regression testing (Percy, BackstopJS) compares a page to its own history. Consistency testing compares a page to its sibling pages at the same point in time. This is a genuine gap the perceptual-critic fills.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None -- tests run directly via `node --test` |
| Quick run command | `node --test tests/phase-14-structural.test.mjs` |
| Full suite command | `node --test tests/*.test.mjs` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EVAL-01 | perceptual-critic.md includes cross-page consistency audit subsection in OBSERVE + tool allowlist includes `Bash(npx playwright test *)` | structural | `node --test tests/phase-14-structural.test.mjs` | No -- Wave 0 |
| EVAL-02 | projection-critic.md includes round-trip navigation test guidance in TEST section + FN-X finding prefix + exclusion from acceptance_tests.results[] | structural | `node --test tests/phase-14-structural.test.mjs` | No -- Wave 0 |
| EVAL-03 | SCORING-CALIBRATION.md Visual Design ceiling table includes shared component divergence ceiling + 6/10 and 8/10 scenarios updated | structural | `node --test tests/phase-14-structural.test.mjs` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test tests/phase-14-structural.test.mjs`
- **Per wave merge:** `node --test tests/*.test.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/phase-14-structural.test.mjs` -- structural tests covering EVAL-01, EVAL-02, EVAL-03

Test patterns should follow the established style in `tests/phase-10-structural.test.mjs`:
- Import `node:test` (describe/it) and `node:assert/strict`
- Use `readFileSync` to read plugin files
- Assert presence/absence of specific strings and structural markers
- Group by requirement ID using `describe` blocks

**Specific structural assertions to verify:**

EVAL-01:
- perceptual-critic.md tools array contains `Bash(npx playwright test *)`
- perceptual-critic.md contains "consistency-audit" text in the OBSERVE section
- perceptual-critic.md contains reference to `consistency-audit.spec.ts` or `consistency-audit.json`

EVAL-02:
- projection-critic.md contains "Round-trip" or "round-trip" or "A->B->A" text
- projection-critic.md contains reference to `page.goBack()` or `goBack`
- projection-critic.md mentions FN- finding prefix in the round-trip context
- projection-critic.md states round-trip tests are excluded from acceptance_tests.results[]

EVAL-03:
- SCORING-CALIBRATION.md Visual Design ceiling table contains "shared component" or "nav/footer" divergence row
- SCORING-CALIBRATION.md 6/10 scenario mentions cross-page or nav consistency language
- SCORING-CALIBRATION.md 8/10 scenario contains "ACROSS ALL PAGES" or equivalent cross-page language

## Open Questions

1. **Template placement (Claude's discretion)**
   - What we know: The consistency-audit.spec.ts template can live inline in perceptual-critic.md or externally in PLAYWRIGHT-EVALUATION.md
   - What's unclear: Which placement is better for token efficiency and maintenance
   - Recommendation: Inline in perceptual-critic.md is simpler (one file to maintain) but PLAYWRIGHT-EVALUATION.md keeps agent definitions leaner. The planner can decide based on the size of the template. If the template is under 40 lines, inline is fine. If larger, external reference.

2. **Round 2+ consistency audit reuse**
   - What we know: CONTEXT.md says the consistency audit follows the same copy/heal/regenerate pattern as acceptance tests
   - What's unclear: Whether the OBSERVE subsection needs explicit round 2+ instructions or the general guidance is sufficient
   - Recommendation: Add a brief note referencing the round 2+ pattern. The consistency-audit.spec.ts is a Playwright test file, so the existing round 2+ workflow (copy from prior round, run, decide) applies naturally.

## Sources

### Primary (HIGH confidence)
- `research/cross-page-visual-consistency.md` -- design token extraction, BackstopJS patterns, CSS audit metrics, getComputedStyle characteristics, write-and-run implementation, severity mapping
- `research/round-trip-navigation-testing.md` -- SPA state persistence taxonomy, Playwright navigation API patterns, A->B->A test templates, detection signals
- Existing codebase files -- perceptual-critic.md, projection-critic.md, SCORING-CALIBRATION.md, PLAYWRIGHT-EVALUATION.md (all read directly)

### Secondary (MEDIUM confidence)
- Style Dictionary CTI taxonomy (Amazon) -- property grouping for design token extraction
- Salesforce Theo token categories -- validated property list for cross-page comparison
- Parker / CSS Wizardry unique-value-count heuristics -- threshold recommendations for palette discipline
- BackstopJS scenario-per-URL pattern -- adapted for eval-first cross-page comparison
- Playwright official docs (goBack, waitForURL, evaluate) -- API behavior confirmed

### Tertiary (LOW confidence)
- None. All findings verified against codebase and official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, only modifying existing files with established patterns
- Architecture: HIGH -- all integration points identified by reading current files, CONTEXT.md provides exact locations
- Pitfalls: HIGH -- pitfalls derived from existing codebase patterns (tool allowlists, calibration sync, Product Depth mapping) with concrete prevention strategies

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- documentation-only changes, no version-sensitive dependencies)
