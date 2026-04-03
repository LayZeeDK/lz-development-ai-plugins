# Cross-Page Visual Consistency Testing

Research for enhancing the perceptual-critic agent to detect visual
inconsistencies across pages of a generated web application.

**Date:** 2026-04-03
**Context:** perceptual-critic currently evaluates pages independently. This
research informs cross-page consistency detection within the existing ~60K
token budget using Playwright eval-first patterns.

---

## 1. Design Token Extraction Techniques

### 1.1 What "Design Tokens" Are in This Context

Design tokens are the atomic visual design decisions -- colors, typography
scales, spacing units, shadows, border radii -- that should be applied
consistently across all pages. In generated web apps, these may be expressed
as CSS custom properties, hardcoded CSS values, or framework theme variables.

The DTCG (Design Tokens Community Group) taxonomy defines these token
categories:

- **Color** -- hex, rgb, hsl values
- **Dimension** -- px, rem, em, %, vw/vh measurements
- **Duration** -- transition/animation timing
- **Font family** -- typeface selections
- **Composite tokens** -- typography (font + size + line-height + color),
  shadows (x/y/blur/spread/color), borders (width + style + color)

### 1.2 How Tools Extract and Compare Tokens

**Style Dictionary (Amazon)** uses a Category/Type/Item (CTI) hierarchical
naming convention. Tokens are defined in JSON, transformed through a pipeline,
and output as platform-specific files (CSS custom properties, SCSS variables,
etc.). Key insight for our use: the CTI taxonomy tells us which property
categories to group when comparing cross-page consistency. A token like
`color.primary.500` maps to a specific resolved CSS value that should be
identical everywhere it is used.

**Salesforce Theo** recognizes 25+ token categories: `spacing`, `sizing`,
`font`, `font-weight`, `font-size`, `line-height`, `border-style`,
`border-radius`, `border-color`, `background-color`, `gradient`, `drop-shadow`,
`box-shadow`, `text-shadow`, `text-color`, `radius`, `time`, `media-query`.
This is the most complete category list found and maps well to computed CSS
properties.

**Key extraction technique for live pages:** Rather than parsing CSS files
(which the perceptual-critic cannot do -- information barrier prevents reading
source), extract computed styles from rendered elements via
`window.getComputedStyle()`. This is product-surface-only extraction that
respects the GAN information barrier.

### 1.3 Critical Computed Style Properties for Consistency

Based on Style Dictionary, Theo, and CSS analyzer tools, these are the
properties most relevant for cross-page consistency detection, grouped by
token category:

**Color tokens (highest signal):**
- `color` (text color)
- `backgroundColor`
- `borderColor`, `borderTopColor`, etc.
- `outlineColor`
- `boxShadow` (contains color)
- `textDecorationColor`

**Typography tokens (high signal):**
- `fontFamily`
- `fontSize`
- `fontWeight`
- `lineHeight`
- `letterSpacing`
- `textTransform`

**Spacing tokens (medium signal):**
- `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `margin`, `marginTop`, etc.
- `gap` (flexbox/grid)

**Shape tokens (medium signal):**
- `borderRadius`, `borderTopLeftRadius`, etc.
- `borderWidth`, `borderStyle`
- `boxShadow` (blur, spread, offset)

**Layout tokens (lower signal, more context-dependent):**
- `display`
- `maxWidth`
- `position`

### 1.4 getComputedStyle Characteristics

`window.getComputedStyle(element)` returns a live, read-only
CSSStyleDeclaration containing resolved values for all CSS properties. Key
behaviors relevant to extraction:

- **Color serialization:** sRGB colors serialize to `rgb(R, G, B)` or
  `rgba(R, G, B, A)`. This normalizes hex, named colors, hsl, etc. into a
  canonical form, making cross-page comparison straightforward.
- **Shorthand expansion:** `border` expands to `borderTopWidth`,
  `borderTopStyle`, `borderTopColor`, etc. Always read longhand properties
  for consistent comparison.
- **Unit resolution:** `em`, `rem`, `%` are resolved to `px` values. This
  means the same `1rem` might resolve differently if the root font-size
  differs -- which itself would be a consistency finding.
- **Performance:** Cache the CSSStyleDeclaration per element. One
  `getComputedStyle()` call, then read multiple properties.

---

## 2. Visual Regression Testing Patterns

### 2.1 Cross-Page Component Comparison (BackstopJS Pattern)

BackstopJS uses a **scenario-per-URL** approach with CSS selector targeting for
shared components. Key patterns:

- **Shared component selectors:** Define the same CSS selectors (e.g., `nav`,
  `.site-header`, `.footer`) in scenarios pointing to different URLs. This
  captures the same logical component on different pages.
- **`requireSameDimensions: true`:** Enforces that captured elements have
  identical dimensions across scenarios -- a direct cross-page consistency
  check.
- **`misMatchThreshold`:** A percentage of different pixels allowed. For shared
  components, a very low threshold (< 1%) catches color and spacing drift while
  tolerating anti-aliasing differences.
- **`scenarioDefaults`:** Global configuration applied to all scenarios,
  reducing duplication when testing the same selectors across pages.

**Adaptation for perceptual-critic:** Instead of pixel comparison (which
requires storing reference images), extract computed styles from shared
components on each page and compare the structured data. Same conceptual
pattern as BackstopJS but using JSON comparison instead of image diffing.

### 2.2 Pixel-Level Comparison (Playwright/pixelmatch)

Playwright's built-in visual comparison uses the **pixelmatch** library:

- Configurable `maxDiffPixels` and `threshold` for sensitivity
- Compares against stored reference screenshots
- Platform-dependent rendering (different OS/GPU = different pixels)

**Why this is NOT ideal for the perceptual-critic:** Pixel comparison requires
a reference image, works best in controlled environments (same OS, same GPU),
and consumes significant storage/tokens. The eval-first approach is better
suited to the token budget constraint.

### 2.3 Component Snapshot Comparison (reg-suit)

reg-suit performs batch visual regression by comparing directories of images.
Key patterns:

- **Threshold rate:** Tolerance as a ratio (0-1) for pixel differences
- **Matching threshold:** YUV color distance sensitivity between pixels
- **Antialiasing support:** Ignores anti-aliased pixels to reduce false
  positives
- **Parallel processing:** Compares multiple images concurrently

### 2.4 Chromatic/Percy Approach

Chromatic captures snapshots through Storybook stories in standardized browsers.
Key insight: it uses **network quiescence** (a period of network inactivity)
to determine rendering completion before capture. Percy uses a similar
snapshot-then-diff approach but via its cloud service.

Neither tool has a specific "cross-page consistency" feature -- they detect
regressions (changes over time), not inconsistencies (differences across
pages at the same point in time). This distinction is important:
**regression testing compares a page to its own history; consistency testing
compares a page to its sibling pages.**

---

## 3. CSS Audit / Design System Compliance

### 3.1 CSS Analyzer (Project Wallace) -- 150+ Metrics

The most comprehensive CSS analysis tool found. Tracks:

**Color analysis:**
- Total and unique colors (with context grouping by property)
- Color used in `background-color` vs `color` vs `border-color` contexts

**Typography analysis:**
- Unique font families
- Unique font sizes
- Font weight distribution

**Value tracking:**
- Unique z-index values
- Shadow definitions (text-shadow, box-shadow)
- Animation durations and timing functions
- CSS unit usage (px, rem, em, %, etc.)
- Vendor prefix usage
- `!important` usage count

**Structural analysis:**
- Total and unique selectors
- Specificity distribution (min, max, mean, mode)
- Selectors per rule
- Declarations per rule
- Custom property (CSS variable) detection

**Key metric for consistency:** The "uniqueness ratio" -- the ratio of unique
values to total values for a given property category. A low uniqueness ratio
suggests good consistency (few unique colors means a disciplined palette); a
high ratio suggests ad-hoc values.

### 3.2 Parker (CSS Wizardry) -- Key Metrics

Harry Roberts documents these metrics as the most insightful for CSS quality:

- **Total Unique Colors:** Direct measure of color palette discipline.
  Roberts' example shows 25 unique colors in a stylesheet and treats this as
  meaningful data -- a well-disciplined system should have far fewer.
- **Selectors Per Rule:** Mean value; closer to 1.0 is better.
- **Identifiers Per Selector:** Indicates specificity complexity.
- **Specificity Per Selector:** Mean specificity; lower is more maintainable.
- **Total Important Keywords:** Higher counts indicate cascade problems.
- **Declarations Per Ruleset:** Derived metric (total declarations / total
  rules). Higher values suggest monolithic, harder-to-compose rulesets.

**Key insight from Roberts:** "Parker is best used as a rough guide; a finger
in the air. Parker's job is just to present you with the numbers; it is down
to you to know what those numbers represent." This matches the perceptual-
critic's role -- extract numbers, apply judgment.

### 3.3 Heuristics: Inconsistency vs Intentional Variation

This is the hardest problem. Not every difference is a defect. Patterns for
distinguishing:

**Likely inconsistency (flag it):**
- Same semantic element (e.g., `<nav>`) has different computed styles across
  pages
- Heading hierarchy (h1, h2, h3) uses different font sizes on different pages
- Primary action buttons have different background colors across pages
- Body text uses different font-family on different pages
- Navigation bar height or background color changes between pages

**Likely intentional variation (do not flag):**
- Different page backgrounds for different sections (e.g., dark hero, light
  content)
- Cards on a product page vs cards on a blog page having different widths
- Responsive changes at different breakpoints
- Hover/focus/active state differences
- Theme variations (dark mode pages vs light mode pages, IF the spec calls
  for it)

**Heuristic rule:** Compare the same *semantic role* across pages, not the same
*CSS class*. A `<nav>` should look the same everywhere. A `.card` might vary
by context.

### 3.4 CSS Custom Property (Variable) Detection

For generated web apps using CSS custom properties, a powerful consistency
signal is whether the same custom properties resolve to the same values across
pages. Extract via:

```javascript
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
```

If `--color-primary` resolves to different values on different pages, that is
almost certainly a bug (unless scoped theming is intentional).

---

## 4. Visual Coherence Scoring Patterns

### 4.1 Quantitative Metrics

Based on the tools surveyed, these are the most actionable metrics for a
"visual coherence score":

**Color Palette Discipline:**
- Count of unique resolved `color` values across all pages
- Count of unique resolved `backgroundColor` values across all pages
- Ratio: unique colors / total elements sampled
- A well-designed app typically uses 5-15 unique colors total. More than 20
  suggests ad-hoc color choices.

**Typography Scale Discipline:**
- Count of unique `fontSize` values across all pages
- Count of unique `fontFamily` values across all pages
- A disciplined type scale typically uses 5-8 font sizes. More than 12
  suggests no scale.
- Most apps should use 1-3 font families. More than 4 is unusual.

**Spacing Value Distribution:**
- Count of unique `padding` values across all pages
- Count of unique `margin` values across all pages
- Count of unique `gap` values across all pages
- A spacing scale (4px, 8px, 16px, 24px, 32px, 48px) produces fewer unique
  values than ad-hoc spacing.

**Cross-Page Divergence (the novel metric):**
- For each shared component (nav, footer, header), compute a "style
  fingerprint" (the set of computed style values for key properties)
- Compare fingerprints across pages
- Divergence count = number of properties that differ across pages for the
  same component
- Zero divergence for shared components = perfectly consistent

### 4.2 Industry Measurement Approaches

Design system teams measure adoption through:

- **Token coverage:** Percentage of CSS declarations that reference design
  tokens (custom properties) vs hardcoded values
- **Unique value counts:** Number of unique colors, font sizes, and spacing
  values. Fewer = more consistent.
- **Component reuse rate:** How often shared components appear across pages
  without style overrides
- **"Snowflake" detection:** One-off styles that appear on only one page
  and match no design token

### 4.3 Proposed Coherence Scoring Model

For the perceptual-critic, a pragmatic coherence scoring model:

```
coherence_score = weighted_average(
  palette_discipline * 0.30,    // unique colors relative to expectation
  typography_discipline * 0.25, // unique fonts/sizes relative to scale
  component_consistency * 0.30, // shared component style divergence
  spacing_discipline * 0.15    // unique spacing values relative to scale
)
```

Where each sub-score is 0-1:
- 1.0 = perfect (all values from a small, disciplined set)
- 0.0 = chaotic (every element has unique values)

This feeds into the existing Visual Design scoring rubric as evidence for
the "design language match" criterion.

---

## 5. Playwright-Specific Implementation Patterns

### 5.1 Single-Call Style Fingerprint Extraction

The most token-efficient approach: one `page.evaluate()` call per page that
extracts all needed style data as a single JSON object.

```javascript
// Extract via: npx playwright-cli eval "<this entire expression>"
(() => {
  const props = [
    'color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight',
    'lineHeight', 'letterSpacing', 'padding', 'margin', 'borderRadius',
    'borderColor', 'borderWidth', 'boxShadow', 'gap'
  ];

  function fingerprint(el) {
    const cs = getComputedStyle(el);
    const result = {};
    for (const p of props) { result[p] = cs[p]; }
    return result;
  }

  // Shared components (same on every page)
  const nav = document.querySelector('nav, [role="navigation"], header nav');
  const footer = document.querySelector('footer, [role="contentinfo"]');
  const h1 = document.querySelector('h1');
  const h2 = document.querySelector('h2');
  const h3 = document.querySelector('h3');
  const body = document.body;

  // All visible text elements for palette/typography analysis
  const allText = [...document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, span, li, td, th, label, button')]
    .slice(0, 50);
  const allBg = [...document.querySelectorAll('section, div, main, aside, header, footer, nav, article')]
    .slice(0, 30);

  // Collect unique values
  const colors = new Set();
  const bgColors = new Set();
  const fontFamilies = new Set();
  const fontSizes = new Set();
  const spacingValues = new Set();

  allText.forEach(el => {
    const cs = getComputedStyle(el);
    colors.add(cs.color);
    fontFamilies.add(cs.fontFamily);
    fontSizes.add(cs.fontSize);
  });

  allBg.forEach(el => {
    const cs = getComputedStyle(el);
    bgColors.add(cs.backgroundColor);
    ['paddingTop','paddingRight','paddingBottom','paddingLeft','gap'].forEach(p => {
      if (cs[p] && cs[p] !== '0px' && cs[p] !== 'normal') spacingValues.add(cs[p]);
    });
  });

  // CSS custom properties on :root
  const rootStyle = getComputedStyle(document.documentElement);
  const customProps = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ':root' || rule.selectorText === 'html') {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) {
              customProps[prop] = rootStyle.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch(e) { /* cross-origin stylesheet, skip */ }
  }

  return {
    url: location.pathname,
    sharedComponents: {
      nav: nav ? fingerprint(nav) : null,
      footer: footer ? fingerprint(footer) : null,
    },
    headings: {
      h1: h1 ? fingerprint(h1) : null,
      h2: h2 ? fingerprint(h2) : null,
      h3: h3 ? fingerprint(h3) : null,
    },
    body: fingerprint(body),
    palette: {
      uniqueTextColors: [...colors],
      uniqueBgColors: [...bgColors],
      uniqueFontFamilies: [...fontFamilies],
      uniqueFontSizes: [...fontSizes],
      uniqueSpacingValues: [...spacingValues],
    },
    customProperties: customProps,
  };
})()
```

**Token cost estimate:** The eval expression is ~80 lines. The JSON output
per page is ~2-4KB depending on variety. For a 4-page app: ~16KB of JSON
data, leaving ample budget within 60K tokens.

### 5.2 Multi-Page Collection Workflow

Efficient pattern for visiting all pages and collecting data:

```bash
# 1. Discover all internal links from the homepage
npx playwright-cli eval "[...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/') && !h.startsWith('//'))"

# 2. For each page, navigate and extract fingerprint
npx playwright-cli navigate http://localhost:PORT/page1
npx playwright-cli eval "<fingerprint expression>"

npx playwright-cli navigate http://localhost:PORT/page2
npx playwright-cli eval "<fingerprint expression>"

# 3. Alternatively, write-and-run for zero-context extraction
```

### 5.3 Write-and-Run Pattern (Most Token-Efficient)

For maximum efficiency, write a Playwright test that visits all pages,
collects all fingerprints, performs cross-page comparison, and writes results
to a JSON file -- all outside the agent's context:

```typescript
// evaluation/round-N/perceptual/consistency-audit.spec.ts
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';

test.use({ baseURL: 'http://localhost:PORT' });

const STYLE_PROPS = [
  'color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight',
  'lineHeight', 'letterSpacing', 'borderRadius', 'borderColor',
  'borderWidth', 'boxShadow', 'gap', 'paddingTop', 'paddingRight',
  'paddingBottom', 'paddingLeft'
];

const PAGES = ['/', '/about', '/gallery', '/contact']; // from link discovery

test('cross-page visual consistency audit', async ({ page }) => {
  const pageFingerprints = [];

  for (const url of PAGES) {
    await page.goto(url, { waitUntil: 'networkidle' });

    const fingerprint = await page.evaluate((props) => {
      function fp(el) {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const result = {};
        for (const p of props) { result[p] = cs[p]; }
        return result;
      }

      const nav = document.querySelector('nav, [role="navigation"]');
      const footer = document.querySelector('footer, [role="contentinfo"]');

      // Collect all unique values
      const textEls = [...document.querySelectorAll(
        'p, h1, h2, h3, h4, h5, h6, a, span, li, button, label'
      )].slice(0, 50);
      const bgEls = [...document.querySelectorAll(
        'section, div, main, aside, header, footer, nav'
      )].slice(0, 30);

      const uniqueColors = new Set();
      const uniqueBgColors = new Set();
      const uniqueFontFamilies = new Set();
      const uniqueFontSizes = new Set();

      textEls.forEach(el => {
        const cs = getComputedStyle(el);
        uniqueColors.add(cs.color);
        uniqueFontFamilies.add(cs.fontFamily);
        uniqueFontSizes.add(cs.fontSize);
      });
      bgEls.forEach(el => {
        uniqueBgColors.add(getComputedStyle(el).backgroundColor);
      });

      return {
        url: location.pathname,
        nav: fp(nav),
        footer: fp(footer),
        h1: fp(document.querySelector('h1')),
        h2: fp(document.querySelector('h2')),
        h3: fp(document.querySelector('h3')),
        body: fp(document.body),
        uniqueColors: [...uniqueColors],
        uniqueBgColors: [...uniqueBgColors],
        uniqueFontFamilies: [...uniqueFontFamilies],
        uniqueFontSizes: [...uniqueFontSizes],
      };
    }, STYLE_PROPS);

    pageFingerprints.push(fingerprint);
  }

  // Cross-page comparison
  const findings = [];
  const refPage = pageFingerprints[0];

  for (let i = 1; i < pageFingerprints.length; i++) {
    const other = pageFingerprints[i];

    // Compare shared components
    for (const component of ['nav', 'footer']) {
      if (refPage[component] && other[component]) {
        for (const prop of STYLE_PROPS) {
          if (refPage[component][prop] !== other[component][prop]) {
            findings.push({
              type: 'shared-component-divergence',
              component,
              property: prop,
              page1: { url: refPage.url, value: refPage[component][prop] },
              page2: { url: other.url, value: other[component][prop] },
            });
          }
        }
      }
    }

    // Compare heading styles
    for (const heading of ['h1', 'h2', 'h3']) {
      if (refPage[heading] && other[heading]) {
        for (const prop of ['fontFamily', 'fontSize', 'fontWeight', 'color', 'lineHeight']) {
          if (refPage[heading][prop] !== other[heading][prop]) {
            findings.push({
              type: 'heading-style-divergence',
              heading,
              property: prop,
              page1: { url: refPage.url, value: refPage[heading][prop] },
              page2: { url: other.url, value: other[heading][prop] },
            });
          }
        }
      }
    }
  }

  // Global palette analysis
  const allColors = new Set();
  const allFonts = new Set();
  const allFontSizes = new Set();
  pageFingerprints.forEach(fp => {
    fp.uniqueColors.forEach(c => allColors.add(c));
    fp.uniqueFontFamilies.forEach(f => allFonts.add(f));
    fp.uniqueFontSizes.forEach(s => allFontSizes.add(s));
  });

  const report = {
    pages: pageFingerprints.map(fp => fp.url),
    findings,
    globalPalette: {
      uniqueTextColors: allColors.size,
      uniqueFontFamilies: allFonts.size,
      uniqueFontSizes: allFontSizes.size,
      textColorValues: [...allColors],
      fontFamilyValues: [...allFonts],
      fontSizeValues: [...allFontSizes],
    },
    coherenceIndicators: {
      paletteOverloaded: allColors.size > 20,
      typographyUndisciplined: allFontSizes.size > 12,
      tooManyFontFamilies: allFonts.size > 4,
      sharedComponentDivergences: findings.filter(
        f => f.type === 'shared-component-divergence'
      ).length,
      headingStyleDivergences: findings.filter(
        f => f.type === 'heading-style-divergence'
      ).length,
    },
  };

  writeFileSync(
    'evaluation/round-N/perceptual/consistency-audit.json',
    JSON.stringify(report, null, 2)
  );

  // The test itself always passes -- this is data collection, not assertion.
  // The agent reads the JSON and interprets findings.
});
```

**Token cost estimate for write-and-run approach:** ~5 tool calls total
(write test file + run + read results). The entire cross-page audit executes
outside the agent's context window. The agent reads only the final JSON
report (~2-5KB).

### 5.4 Page Discovery via Link Extraction

Before the consistency audit, discover all internal pages:

```javascript
// Single eval call to discover pages
[...document.querySelectorAll('a[href]')]
  .map(a => new URL(a.href, location.origin))
  .filter(u => u.origin === location.origin)
  .map(u => u.pathname)
  .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
  .filter(p => !p.match(/\.(png|jpg|svg|pdf|css|js)$/)) // skip assets
```

### 5.5 CSS Custom Property Extraction

Checking that CSS custom properties resolve identically across pages is a
high-signal, low-cost check:

```javascript
// Extract all :root custom properties
(() => {
  const rootStyle = getComputedStyle(document.documentElement);
  const props = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ':root' || rule.selectorText === 'html') {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) {
              props[prop] = rootStyle.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch(e) { /* cross-origin */ }
  }
  return props;
})()
```

If the same `--primary-color` variable resolves to different values on
different pages, that is a definitive consistency bug.

---

## 6. Recommended Architecture for the Perceptual Critic

### 6.1 Integration with Existing Methodology

The cross-page consistency check fits naturally into the existing OBSERVE
step of the perceptual-critic methodology:

1. **UNDERSTAND** -- (no change) Extract design language from SPEC.md
2. **OBSERVE** -- ADD: After single-page observation, run cross-page
   consistency audit
3. **DETECT** -- ADD: Interpret consistency audit findings as VD findings
4. **SCORE** -- (no change) Consistency findings feed into existing ceiling
   rules

### 6.2 Proposed OBSERVE Addition

After the existing per-page observation, add:

```
### Cross-Page Consistency Audit

1. Extract internal page URLs from homepage navigation links.
2. Write `evaluation/round-N/perceptual/consistency-audit.spec.ts` using the
   write-and-run pattern (template in PLAYWRIGHT-EVALUATION.md).
3. Run: `npx playwright test evaluation/round-N/perceptual/consistency-audit.spec.ts --reporter=json`
4. Read `evaluation/round-N/perceptual/consistency-audit.json`
5. Interpret findings:
   - Shared component divergences -> Major VD findings
   - Heading style divergences -> Major VD findings
   - Palette overloaded (>20 unique colors) -> Minor VD finding
   - Typography undisciplined (>12 unique font sizes) -> Minor VD finding
   - Too many font families (>4) -> Minor VD finding
```

### 6.3 Token Budget Impact

Estimated additional token cost for cross-page consistency:

| Step | Tool calls | Tokens consumed |
|------|-----------|-----------------|
| Write test file | 1 (Write) | ~2K (template) |
| Run test | 1 (Bash) | ~1K (command + output) |
| Read results | 1 (Read) | ~3-5K (JSON report) |
| **Total** | **3** | **~6-8K** |

This fits within the 60K budget with headroom. The write-and-run pattern
keeps the heavy lifting (page navigation, style extraction, comparison)
entirely outside the agent's context.

### 6.4 Severity Mapping

| Finding type | Default severity | Escalation condition |
|-------------|-----------------|---------------------|
| Nav/footer style divergence | Major | >3 properties diverge |
| Heading style divergence | Major | fontFamily or fontSize differs |
| Heading color divergence | Minor | Only color differs (may be intentional) |
| Palette overloaded (>20 colors) | Minor | >30 colors -> Major |
| Too many font families (>4) | Minor | >6 families -> Major |
| Too many font sizes (>12) | Minor | >20 sizes -> Major |
| Custom property value divergence | Critical | Same variable, different resolved value |
| Body font-family divergence | Major | Always -- body font should be consistent |

### 6.5 New Ceiling Rule Candidate

Consider adding to SCORING-CALIBRATION.md:

| Condition | Ceiling |
|-----------|---------|
| Shared components (nav/footer) visually differ across pages | max 6 |

Rationale: If the navigation bar looks different on every page, the design
lacks coherence regardless of how good each individual page looks. This is a
stronger signal than "no design language match" because it is empirically
measurable rather than subjective.

---

## 7. Key Insights and Recommendations

### 7.1 Eval-First Over Screenshots for Consistency

Screenshot comparison (pixelmatch) is the wrong tool for cross-page
consistency. It requires reference images, is sensitive to rendering
environment, and does not explain *what* is inconsistent. Computed style
extraction via `eval` produces structured, comparable data that identifies
exactly which property on which component diverges.

### 7.2 Shared Component Fingerprinting is the Highest-Signal Check

The single most valuable cross-page check is: "Does the nav/footer/header
have identical computed styles on every page?" This catches the most
user-visible inconsistencies with the least false positives. A navigation
bar that changes color between pages is always a bug.

### 7.3 Unique Value Counts as Design Discipline Proxy

The Parker/Wallace/cssstats approach of counting unique values per property
category is a robust proxy for design discipline. The thresholds should be
calibrated through observation of generated apps, but initial recommendations:

- < 15 unique text colors = disciplined palette
- < 8 unique font sizes = disciplined type scale
- < 3 unique font families = disciplined typography
- < 10 unique spacing values = disciplined spacing scale

### 7.4 CSS Custom Property Divergence is a Definitive Bug

If the same `--var-name` resolves to different values on different pages
(without intentional scoping), that is always a bug with zero false-positive
risk. This is the cheapest and most reliable consistency check.

### 7.5 Write-and-Run is the Right Pattern

The write-and-run pattern (write a Playwright test, execute it, read JSON
results) is ideal for cross-page consistency because:

- The test visits multiple pages sequentially (not possible with single eval)
- All computation happens outside the agent's context
- The agent reads only the compact JSON findings report
- The test file can be reused in round 2+ (same as projection-critic pattern)

---

## Sources

- Style Dictionary (Amazon): https://github.com/amzn/style-dictionary
- Salesforce Theo: https://github.com/salesforce-ux/theo
- CSS Analyzer (Project Wallace): https://github.com/projectwallace/css-analyzer
- Parker (CSS Wizardry): https://github.com/katiefenn/parker/
- BackstopJS: https://github.com/garris/BackstopJS
- reg-suit: https://github.com/reg-viz/reg-suit
- Playwright evaluating docs: https://playwright.dev/docs/evaluating
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- MDN getComputedStyle: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
- DTCG glossary: https://www.designtokens.org/glossary/
- Harry Roberts "Improving CSS with Parker": https://csswizardry.com/2016/06/improving-your-css-with-parker/
- CSS-Tricks "What Are Design Tokens?": https://css-tricks.com/what-are-design-tokens/
