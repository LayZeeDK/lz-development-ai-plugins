# Phase 14: Enhanced Existing Critics - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The perceptual-critic detects cross-page visual inconsistencies and the projection-critic validates round-trip navigation state persistence. This covers: cross-page visual consistency checks (EVAL-01), A->B->A navigation test patterns (EVAL-02), and Visual Design calibration update for expanded scope (EVAL-03).

</domain>

<decisions>
## Implementation Decisions

### Cross-page visual consistency method (EVAL-01)

Grounded in the BackstopJS scenario-per-URL pattern adapted for eval-first extraction, Style Dictionary/Theo token taxonomy for property selection, and Parker/Wallace unique-value-count heuristics for design discipline measurement.

**Method:** Write-and-run fingerprinting via a `consistency-audit.spec.ts` test file. The test visits all pages, extracts computed styles via `getComputedStyle()`, performs cross-page comparison, and writes a JSON report. The perceptual-critic reads only the compact report (~3-5KB). All heavy work executes outside the agent's context.

**Extraction tiers:**

Tier 1 -- Shared component comparison (highest signal):
- nav, footer: all 14 style properties compared cross-page
- h1, h2, h3: font + color properties compared cross-page
- body: base font + color compared cross-page
- A navigation bar that changes color between pages is always a bug (zero false-positive signal)

Tier 2 -- Palette discipline metrics (design system proxy):
- Unique text colors across all pages (flag >20, escalate >30)
- Unique background colors
- Unique font families (flag >4, escalate >6)
- Unique font sizes (flag >12, escalate >20)

Tier 3 -- CSS custom property divergence (definitive bug signal):
- Extract `:root` / `html` custom properties on each page
- Same `--var-name` resolving to different values across pages = always a bug
- Zero false-positive risk -- if scoped theming is intentional, variables would have different names

**14 style properties extracted per element:**
color, backgroundColor, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, borderRadius, borderColor, borderWidth, boxShadow, gap, paddingTop, paddingRight, paddingBottom, paddingLeft

**Page cap:** 5 pages maximum (homepage + up to 4 internal pages discovered via link extraction eval). If the app has more than 5 pages, the critic picks the most structurally different ones.

**Integration with existing methodology:** The consistency audit fits into the OBSERVE step. After single-page observation, the critic runs the write-and-run audit. Findings feed into the DETECT and SCORE steps as VD findings.

**Severity mapping from research:**

| Finding type | Default severity | Escalation condition |
|-------------|-----------------|---------------------|
| Nav/footer style divergence | Major | >3 properties diverge |
| Heading style divergence | Major | fontFamily or fontSize differs |
| Heading color divergence | Minor | Only color differs (may be intentional) |
| Palette overloaded (>20 colors) | Minor | >30 colors -> Major |
| Too many font families (>4) | Minor | >6 families -> Major |
| Too many font sizes (>12) | Minor | >20 sizes -> Major |
| CSS custom property divergence | Critical | Same variable, different resolved value |
| Body font-family divergence | Major | Always -- body font should be consistent |

**Heuristic for inconsistency vs intentional variation:** Compare the same semantic role across pages, not the same CSS class. A `<nav>` should look the same everywhere. A `.card` might vary by context. Different page backgrounds for different sections, responsive changes at different breakpoints, and hover/focus/active state differences are intentional variation -- do not flag.

### A->B->A navigation test patterns (EVAL-02)

Grounded in SPA state persistence taxonomy (9 layers from component state to server state), the canonical Setup/Navigate/Return/Assert test design pattern, and Playwright's `page.goBack()` + `waitForURL()` navigation API.

**Method:** SPEC-derived round-trip tests added as a `test.describe('Round-trip navigation')` block at the end of the existing `acceptance-tests.spec.ts` file. One file, one test run, one JSON result. Tests derive from the SPEC, not a generic checklist.

**Test patterns:**

For each CRUD feature in SPEC.md:
- Create data, navigate to a different view, return via `page.goBack()`, verify data persists

For each filtered/sorted view in SPEC.md:
- Apply filters, click into a detail, return via `page.goBack()`, verify filters still active

One URL integrity test:
- Navigate with query params, leave, return via back button, assert URL params intact

One console error test:
- Monitor `page.on("console", ...)` during an A->B->A cycle, assert no errors

**Return method:** `page.goBack()` + `waitForURL()` (research shows back-button is the highest-defect navigation method). Always follow `goBack()` with a content assertion, not `waitForTimeout` -- SPA routers update asynchronously.

**Scoring dimension:** Functionality only. Round-trip test failures produce FN-X findings. They are excluded from the `acceptance_tests.results[]` feature mapping that feeds Product Depth computation. Rationale from GAN principles: Product Depth measures feature presence (does feature X exist?), not feature durability (does feature X survive navigation?). A feature that works on first visit but loses state on return is functionally buggy, not missing.

**Round 2+ behavior:** Round-trip tests are part of the single acceptance-tests.spec.ts file, so they are automatically included in the existing round 2+ test reuse/heal/regenerate workflow. No special handling needed.

### Visual Design calibration update (EVAL-03)

**New ceiling rule:**

| Condition | Ceiling |
|-----------|---------|
| Shared components (nav/footer/header) visually differ across pages | max 6 |

Rationale: If the navigation bar looks different on every page, the design lacks coherence regardless of how good each individual page looks. This is empirically measurable from `consistency-audit.json` (sharedComponentDivergences > 0) rather than subjective.

**Updated calibration scenario boundaries (weave into existing, not new tiers):**

6/10 (at threshold) -- add to description:
"Navigation bar uses the same font but a slightly different accent color on the settings page. Heading sizes are consistent across pages."

Not 7 because (update):
"A 7 requires visual coherence across all pages. Placeholder images plus the nav color inconsistency show incomplete design execution."

8/10 (above threshold) -- strengthen:
"Color palette has 4 intentional accent colors used consistently ACROSS ALL PAGES. Navigation and footer are visually identical on every page."

Not 9 because (update):
"The settings page reverts to a generic form layout -- shared components are consistent but page-level design language breaks."

### Token efficiency strategy

No specific token budget target. Both enhancements use write-and-run patterns that keep heavy work outside the agent's context:
- Consistency audit: write test -> run -> read JSON report (~3 tool calls)
- A->B->A tests: inline in existing acceptance test file (~0 additional tool calls)

The existing guidance ("write observations to file, not to context" and "use eval-first/write-and-run patterns") is sufficient. No per-enhancement budget allocation needed.

### Claude's Discretion
- Exact structure and ordering of the new OBSERVE subsection in perceptual-critic.md
- The consistency-audit.spec.ts template structure (the research file provides a reference implementation but exact implementation is flexible)
- Link discovery eval expression for page enumeration
- Exact wording of updated calibration scenario prose (within the agreed boundary direction)
- Whether to add the consistency audit template to PLAYWRIGHT-EVALUATION.md or keep it in the agent definition
- Test file organization for the round-trip describe block placement

</decisions>

<specifics>
## Specific Ideas

- The consistency audit is a novel pattern not found in existing tools -- regression testing (Percy, BackstopJS) compares a page to its own history; consistency testing compares a page to its sibling pages at the same point in time. This is a genuine gap the perceptual-critic fills.
- CSS custom property divergence is the cheapest and most reliable consistency check -- if `--primary-color` resolves to different values on different pages, that is definitively a bug with zero false-positive risk.
- The projection-critic's A->B->A tests use `page.goBack()` as the return method because research shows back-button navigation is the highest-defect path in SPAs (popstate handler missing, component state destroyed on unmount, history state not serialized).
- SPA state persistence has 9 layers (URL, history API, in-memory store, component, DOM, session storage, local storage, server, cookies). Component state (destroyed on unmount) is the most commonly broken. The projection-critic doesn't need to test all 9 -- CRUD persistence and URL integrity cover the highest-impact layers.
- The write-and-run consistency audit can be reused in round 2+ following the same copy/heal/regenerate pattern as acceptance tests.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- perceptual-critic.md OBSERVE step: Currently does eval-first and resize+eval. The consistency audit slots in after these as a new subsection.
- projection-critic.md write-and-run pattern: The same 5-step workflow (read SPEC, snapshot, write tests, run, read JSON) is extended with a round-trip describe block.
- PLAYWRIGHT-EVALUATION.md eval-first section: Documents `getComputedStyle` usage already. The fingerprint extraction follows this pattern.
- PLAYWRIGHT-EVALUATION.md write-and-run section: Documents the test skeleton and round 2+ reuse. Consistency audit follows the same pattern.
- static-serve command: Idempotent, already used by all 3 critics. Both enhancements use the same server.

### Established Patterns
- Agent definition structure: YAML frontmatter + Information Barrier + Write Restriction + Step 0 (static-serve) + Methodology sections (UNDERSTAND/OBSERVE/DETECT/SCORE/REPORT for perceptual, UNDERSTAND/TEST/PROBE/SCORE/REPORT for projection)
- Finding ID prefix convention: VD- (Visual Design), FN- (Functionality), RB- (Robustness)
- Summary.json universal schema: { critic, dimension, score, threshold, pass, findings[], ceiling_applied, justification, off_spec_features }
- Round 2+ test reuse: copy from prior round, run, decide (reuse/heal/regenerate)
- Tool allowlists: perceptual has Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(node *appdev-cli* check-assets *), Bash(node *appdev-cli* static-serve*). Projection also has Bash(npx playwright test *).
- Perceptual-critic needs Bash(npx playwright test *) added to its tool allowlist for the write-and-run consistency audit

### Integration Points
- perceptual-critic.md OBSERVE section: Add cross-page consistency audit subsection
- perceptual-critic.md tools allowlist: Add Bash(npx playwright test *) for write-and-run audit
- projection-critic.md TEST section: Add A->B->A test pattern guidance
- SCORING-CALIBRATION.md Visual Design ceilings: Add shared component divergence ceiling
- SCORING-CALIBRATION.md Visual Design scenarios: Update 6/10 and 8/10 boundary explanations
- PLAYWRIGHT-EVALUATION.md: Consider adding consistency audit template and A->B->A test template
- No CLI changes needed -- all changes are in agent definitions and reference files

</code_context>

<deferred>
## Deferred Ideas

- **Primary button fingerprinting:** Adding primary action buttons as a fourth shared component in the consistency audit. High-value (inconsistent CTA styling is very visible) but adds complexity to element discovery heuristics. Consider for v1.3 if consistency audit proves valuable.
- **Per-dimension EMA for Visual Design consistency trend:** Track consistency audit divergence count across rounds to detect whether the Generator is fixing consistency issues. Deferred to v1.3 (CONV-06 candidate).
- **Scroll position restoration testing:** Research identified this as P3 priority. Unreliable (`waitForTimeout` needed), framework responsibility. Skip unless empirically shown to be a common defect in generated apps.

</deferred>

---

*Phase: 14-enhanced-existing-critics*
*Context gathered: 2026-04-03*
*Research grounding: Style Dictionary CTI taxonomy, Salesforce Theo token categories, BackstopJS scenario-per-URL pattern, Parker/Wallace unique-value-count heuristics, DTCG design token specification, Playwright goBack/waitForURL navigation API, SPA state persistence taxonomy (9 layers), Setup/Navigate/Return/Assert canonical test pattern*
