---
phase: 260405-ovl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - plugins/application-dev/scripts/appdev-cli.mjs
  - plugins/application-dev/agents/perceptual-critic.md
  - plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md
autonomous: true
requirements: [OVL-1, OVL-2, OVL-3, OVL-4, OVL-5]

must_haves:
  truths:
    - "Product Depth justification shows a single consistent score (no duplicate conflicting scores)"
    - "Perceptual Critic detects broken scroll-driven animations via before/after scroll comparison"
    - "Perceptual Critic detects key interactive elements below the fold at initial viewport"
    - "Screenshot filenames include evaluation/round-N/<critic>/ directory prefix"
    - "compile-evaluation detects regressions of previously-fixed Major bugs across rounds"
  artifacts:
    - path: "plugins/application-dev/scripts/appdev-cli.mjs"
      provides: "Score cap justification fix, fix-registry lifecycle, regression detection"
      contains: "fix-registry.json"
    - path: "plugins/application-dev/agents/perceptual-critic.md"
      provides: "Scroll-trigger verification, above-the-fold check, screenshot path fix"
      contains: "Scroll-Trigger Verification"
    - path: "plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md"
      provides: "Updated screenshot path examples with critic directory prefix"
      contains: "evaluation/round-N"
  key_links:
    - from: "appdev-cli.mjs computeProductDepth()"
      to: "cmdCompileEvaluation() score cap loop"
      via: "justification string without embedded score number"
      pattern: "acceptance tests passed"
    - from: "appdev-cli.mjs cmdCompileEvaluation()"
      to: "evaluation/fix-registry.json"
      via: "fix lifecycle: detect resolved Major bugs, cross-reference for regressions"
      pattern: "fix-registry"
    - from: "perceptual-critic.md OBSERVE"
      to: "playwright-cli mousewheel + eval"
      via: "scroll-trigger verification comparing DOM state before/after scroll"
      pattern: "mousewheel"
---

<objective>
Fix 5 issues from the v1.2 patch.3 test run (consensus.dk website): score cap
justification bug, scroll-animation detection gap, above-the-fold visibility
check, screenshot organization, and regression detection via fix-registry.

Purpose: Eliminate signal corruption (duplicate conflicting scores in Product
Depth), extend Perceptual Critic's requisite variety to cover dynamic/temporal
behaviors, organize evaluation artifacts properly, and add cross-round regression
detection as a System 3* audit channel (Beer's VSM).

Output: Updated appdev-cli.mjs, perceptual-critic.md, PLAYWRIGHT-EVALUATION.md
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@plugins/application-dev/scripts/appdev-cli.mjs
@plugins/application-dev/agents/perceptual-critic.md
@plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md
@plugins/application-dev/skills/application-dev/SKILL.md
</context>

<interfaces>
<!-- Key code structures the executor needs. Extracted from appdev-cli.mjs. -->

From appdev-cli.mjs lines 1-21:
```javascript
const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
  { name: "Robustness", key: "robustness", threshold: 6 },
];
const SEVERITY_ORDER = { Critical: 0, Major: 1, Minor: 2 };
```

From appdev-cli.mjs line 162 (computeProductDepth signature):
```javascript
function computeProductDepth(projectionSummary) {
  // Returns: { score, threshold, pass, ceiling_applied, pass_rate, justification }
  // BUG: line 230 embeds score in justification BEFORE score cap is applied
}
```

From appdev-cli.mjs line 230 (current buggy justification):
```javascript
justification: "Product Depth " + score + "/10 -- " + tests.passed + "/" + tests.total +
  " acceptance tests passed (" + Math.round(passRate * 100) + "%). " +
  (ceilingRule ? "Ceiling: " + ceilingRule + "." : "No ceiling applied."),
```

From appdev-cli.mjs line 1462 (justification output -- already prepends post-cap score):
```javascript
justTableRows += "| " + d.name + " | (" + score + " of 10) -- " + justification + " |\n";
```

From appdev-cli.mjs line 1329 (cmdCompileEvaluation):
```javascript
function cmdCompileEvaluation(argv) {
  // Line 1385: pdResult = computeProductDepth(projectionSummary)
  // Lines 1416-1426: score cap loop (rounds 1: max 8, rounds 2+: max 9)
  // Line 1431: fixes = assemblePriorityFixes(summaries)
  // Line 1508: writeFileSync(join(roundDir, "EVALUATION.md"), md, "utf8")
  // Line 1510: output({ round, verdict, scores, compiled: true })
}
```

From appdev-cli.mjs lines 234-256 (assemblePriorityFixes):
```javascript
function assemblePriorityFixes(summaries) {
  // Collects all findings from all summaries, sorts by severity
  // Returns: array of finding objects
}
```

From perceptual-critic.md OBSERVE section (lines 107-113):
```markdown
npx playwright-cli viewport --browser msedge 320 800
npx playwright-cli eval --browser msedge "document.title"
npx playwright-cli screenshot --browser msedge --filename=home-320.png
npx playwright-cli viewport --browser msedge 1280 800
npx playwright-cli screenshot --browser msedge --filename=home-1280.png
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Fix score cap justification bug and add fix-registry regression detection to appdev-cli.mjs</name>
  <files>plugins/application-dev/scripts/appdev-cli.mjs</files>
  <action>
**Issue 1 -- Score cap justification (per D-01, WGAN Critic signal corruption fix):**

In `computeProductDepth()` (line 230), remove the score number from the justification string. Change:
```javascript
justification: "Product Depth " + score + "/10 -- " + tests.passed + "/" + tests.total + " acceptance tests passed (" + Math.round(passRate * 100) + "%). " + (ceilingRule ? "Ceiling: " + ceilingRule + "." : "No ceiling applied."),
```
To:
```javascript
justification: tests.passed + "/" + tests.total + " acceptance tests passed (" + Math.round(passRate * 100) + "%)." + (ceilingRule ? " Ceiling: " + ceilingRule + "." : " No ceiling applied."),
```

This works because line 1462 already prepends `"(" + score + " of 10) -- "` using the post-cap score from `allScores[d.key]`. Removing the embedded score eliminates the duplicate entirely. No other changes needed for Issue 1.

**Issue 5 -- Fix-registry regression detection (per D-05, System 3* audit channel):**

Add a `manageFixRegistry(round, currentFindings, roundDir)` function before `cmdCompileEvaluation()`. This function:

1. **Reads** `evaluation/fix-registry.json` from `process.cwd()`. If absent, creates `{ "version": 1, "fixes": [] }`.

2. **Detects resolved bugs:** If `round > 1`, reads prior round findings from `evaluation/round-{N-1}/EVALUATION.md` by extracting the Priority Fixes table rows (parse lines matching `| N | Severity | ID | Title | Description |` pattern -- skip header/separator rows). For each prior-round finding with severity "Major" or "Critical" whose normalized title (lowercase, strip all non-alphanumeric except spaces, collapse whitespace) does NOT appear in `currentFindings` (normalized the same way), add to `fixes[]`:
   ```javascript
   {
     id: finding.id,
     title: finding.title,
     severity: finding.severity,
     critic: finding.id.split("-")[0].toLowerCase(),
     fixed_in_round: round,
     last_seen_round: round - 1,
     fingerprint: finding.id.split("-")[0].toLowerCase() + ":" + finding.id + ":" + slug(finding.title)
   }
   ```
   Where `slug(title)` lowercases and replaces non-alphanumeric runs with `-`.

3. **Detects regressions:** For each entry in `fixes[]`, check if `currentFindings` contains a finding whose normalized title matches the fix's normalized title. If found, create a synthetic REGRESSION finding:
   ```javascript
   {
     id: "REG-" + regIndex,
     severity: "Critical",
     title: "REGRESSION: " + fix.title,
     description: "Bug was fixed in round " + fix.fixed_in_round + " but has reappeared in round " + round + ". Originally reported as " + fix.id + " (" + fix.severity + ").",
     affects_dimensions: []
   }
   ```
   Remove the regressed entry from `fixes[]` (it is no longer fixed).

4. **Writes** updated `evaluation/fix-registry.json`.

5. **Returns** array of regression findings (may be empty).

Integrate into `cmdCompileEvaluation()`: After `var fixes = assemblePriorityFixes(summaries);` (line 1431), call:
```javascript
var regressions = manageFixRegistry(round, fixes, roundDir);
for (var ri = 0; ri < regressions.length; ri++) {
  fixes.unshift(regressions[ri]);  // Critical regressions go to top
}
```

Use only Node.js built-ins (readFileSync, writeFileSync, existsSync, join) -- zero npm dependencies per project constraint.

For parsing prior-round EVALUATION.md Priority Fixes table: read the file, find the "## Priority Fixes" section, parse table rows between the header separator (`|---|`) and the next empty line or end of file. Extract severity (column 2), ID (column 3), title (column 4), description (column 5) from each row. Handle "No findings reported." gracefully (return empty array).
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const src = fs.readFileSync('plugins/application-dev/scripts/appdev-cli.mjs', 'utf8'); const hasBug = /justification:.*Product Depth.*score.*\/10/.test(src); const hasRegistry = src.includes('fix-registry.json'); const hasRegression = src.includes('REGRESSION:'); if (hasBug) { console.error('FAIL: justification still embeds score number'); process.exit(1); } if (!hasRegistry) { console.error('FAIL: fix-registry.json not referenced'); process.exit(1); } if (!hasRegression) { console.error('FAIL: regression detection not implemented'); process.exit(1); } console.log('PASS: score cap fix + fix-registry + regression detection present');"</automated>
  </verify>
  <done>
    - computeProductDepth() justification no longer embeds score number (only pass/fail detail)
    - manageFixRegistry() function exists and is called from cmdCompileEvaluation()
    - Resolved Major bugs tracked in evaluation/fix-registry.json across rounds
    - Regression of a fixed bug produces a Critical-severity synthetic finding prefixed "REGRESSION:"
    - Zero new npm dependencies added
  </done>
</task>

<task type="auto">
  <name>Task 2: Add scroll-animation verification, above-the-fold check, and fix screenshot paths in perceptual-critic.md</name>
  <files>plugins/application-dev/agents/perceptual-critic.md, plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md</files>
  <action>
**Issue 3 -- Above-the-fold visibility check (per D-03, Projection Discriminator conditioning gap):**

In perceptual-critic.md, add an "#### Initial-State Visibility" subsection to the OBSERVE section, BEFORE the responsive testing block (before line 107's `For responsive testing, resize the viewport`). Content:

```markdown
#### Initial-State Visibility

Before scrolling or resizing, verify that key interactive elements are visible
in the initial viewport (above the fold at 1280x800). Elements that require
scrolling to discover are invisible to first-time visitors:

```
npx playwright-cli eval --browser msedge "(() => { const vp = { w: window.innerWidth, h: window.innerHeight }; const check = (sel, label) => { const el = document.querySelector(sel); if (!el) return { label, found: false }; const r = el.getBoundingClientRect(); return { label, found: true, visible: r.top < vp.h && r.bottom > 0 && r.left < vp.w && r.right > 0, top: Math.round(r.top), bottom: Math.round(r.bottom) }; }; return [ check('a[href*=scroll], button[class*=scroll], [class*=cta], [class*=hero] a, [class*=hero] button', 'Hero CTA'), check('[class*=scroll-indicator], [class*=scroll-down], [class*=scroll-hint]', 'Scroll affordance') ]; })()"
```

If a hero CTA or scroll affordance has `visible: false` (its `top` exceeds the
viewport height), report as Major finding: key interactive element below the
fold at initial viewport.
```

**Issue 2 -- Scroll-animation verification (per D-02, Ashby's Requisite Variety extension):**

Add a "#### Scroll-Trigger Verification" subsection to OBSERVE, AFTER the responsive testing block (after the `npx playwright-cli screenshot` examples). Content:

```markdown
#### Scroll-Trigger Verification

Scroll-driven animations (fade-in, slide-up, parallax) are invisible to
static viewport screenshots. Verify them with a before/after comparison:

1. Capture pre-scroll state at the hero section:
   ```
   npx playwright-cli eval --browser msedge "[...document.querySelectorAll('[class*=animate], [class*=fade], [class*=slide], [data-scroll], [data-aos]')].map(el => ({ tag: el.tagName, classes: el.className, opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))"
   ```

2. Scroll past the fold to trigger animations:
   ```
   npx playwright-cli mousewheel 0 1500
   ```

3. Wait briefly for animations to fire, then re-evaluate:
   ```
   npx playwright-cli eval --browser msedge "[...document.querySelectorAll('[class*=animate], [class*=fade], [class*=slide], [data-scroll], [data-aos]')].map(el => ({ tag: el.tagName, classes: el.className, opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))"
   ```

4. Compare: if opacity, transform, or class values are identical before and
   after scroll, the animations are not firing. Report as a Major finding.
```

**Issue 4 -- Screenshot path organization (per D-04, entropy accumulation fix):**

In perceptual-critic.md OBSERVE section (lines 110-112), update the screenshot filename examples from root-level paths to critic-prefixed paths:

Change:
```
npx playwright-cli screenshot --browser msedge --filename=home-320.png
npx playwright-cli screenshot --browser msedge --filename=home-1280.png
```
To:
```
npx playwright-cli screenshot --browser msedge --filename=evaluation/round-N/perceptual/home-320.png
npx playwright-cli screenshot --browser msedge --filename=evaluation/round-N/perceptual/home-1280.png
```

Also in PLAYWRIGHT-EVALUATION.md (lines 131, 135), update the resize+eval section screenshot examples:

Change:
```
npx playwright-cli screenshot --browser msedge --filename=mobile-320.png
npx playwright-cli screenshot --browser msedge --filename=desktop-1280.png
```
To:
```
npx playwright-cli screenshot --browser msedge --filename=evaluation/round-N/<critic>/mobile-320.png
npx playwright-cli screenshot --browser msedge --filename=evaluation/round-N/<critic>/desktop-1280.png
```

Add a note after the updated examples in PLAYWRIGHT-EVALUATION.md:
```
Substitute the round number and critic name (perceptual, projection,
perturbation) into the path. The --filename flag creates directories
automatically. This keeps screenshots organized per round and critic rather
than accumulating in the project root.
```

Do NOT modify the evaluation commit in SKILL.md -- the existing `git add evaluation/round-N/` glob already captures screenshots in critic subdirectories.
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const pc = fs.readFileSync('plugins/application-dev/agents/perceptual-critic.md', 'utf8'); const pe = fs.readFileSync('plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md', 'utf8'); let ok = true; if (!pc.includes('Initial-State Visibility')) { console.error('FAIL: above-the-fold check missing'); ok = false; } if (!pc.includes('Scroll-Trigger Verification')) { console.error('FAIL: scroll-trigger section missing'); ok = false; } if (!pc.includes('mousewheel 0 1500')) { console.error('FAIL: mousewheel scroll command missing'); ok = false; } if (pc.includes('--filename=home-320.png')) { console.error('FAIL: old root-level screenshot path still present in perceptual-critic'); ok = false; } if (!pc.includes('evaluation/round-N/perceptual/home-320.png')) { console.error('FAIL: new screenshot path missing in perceptual-critic'); ok = false; } if (pe.includes('--filename=mobile-320.png')) { console.error('FAIL: old root-level screenshot path still in PLAYWRIGHT-EVALUATION'); ok = false; } if (!pe.includes('evaluation/round-N/')) { console.error('FAIL: new screenshot path missing in PLAYWRIGHT-EVALUATION'); ok = false; } if (ok) console.log('PASS: all critic updates verified'); else process.exit(1);"</automated>
  </verify>
  <done>
    - Perceptual critic OBSERVE section includes Initial-State Visibility check before responsive testing
    - Perceptual critic OBSERVE section includes Scroll-Trigger Verification after responsive testing
    - Screenshot --filename paths in perceptual-critic.md use evaluation/round-N/perceptual/ prefix
    - Screenshot --filename paths in PLAYWRIGHT-EVALUATION.md use evaluation/round-N/critic/ prefix
    - No changes to SKILL.md evaluation commit (glob already covers subdirectories)
  </done>
</task>

</tasks>

<verification>
Run all automated verify commands. Then manually spot-check:

1. Score cap fix: search appdev-cli.mjs for `computeProductDepth` -- justification string should NOT contain any score/10 pattern, only pass/fail detail
2. Fix-registry: search for `manageFixRegistry` -- function should read/write evaluation/fix-registry.json and return regression findings
3. Perceptual critic: read the OBSERVE section top-to-bottom -- should flow: Initial-State Visibility -> responsive testing -> Scroll-Trigger Verification -> Cross-Page Consistency Audit
4. Screenshot paths: no --filename= arguments anywhere in the codebase should point to root-level .png files without the evaluation/round-N/ prefix
</verification>

<success_criteria>
- Product Depth justification in EVALUATION.md will show a single score (post-cap), not two conflicting scores
- Perceptual Critic methodology covers both static and dynamic visual behaviors
- Perceptual Critic detects elements below the fold before any interaction
- Screenshots land in evaluation/round-N/<critic>/ directories, not project root
- Cross-round regression of fixed Major bugs detected and escalated to Critical severity
- Zero new npm dependencies
- All changes confined to plugins/application-dev/ (distributed to users)
</success_criteria>

<output>
After completion, create `.planning/quick/260405-ovl-application-dev-v1-2-patch-3-test-for-co/260405-ovl-SUMMARY.md`
</output>
