# Quick Task 260405-ovl: application-dev v1.2 patch.3 - Research

**Researched:** 2026-04-05
**Domain:** appdev-cli score assembly, Playwright scroll verification, fix-registry design
**Confidence:** HIGH

## Summary

Research covers five targeted fixes for the v1.2 patch.3 test run (consensus.dk website). The score cap justification bug is a straightforward code ordering issue in `cmdCompileEvaluation()`. Scroll-animation verification uses `playwright-cli eval` + `mousewheel` (no write-and-run needed for this lightweight check). Above-the-fold checking extends the existing OBSERVE step. Fix-registry.json uses a SonarQube-inspired fingerprint model adapted for the stateless-critic architecture. Screenshot organization requires agent instruction updates to direct `--filename` paths into `evaluation/round-N/<critic>/`.

**Primary recommendation:** Fix the score cap justification by regenerating `pdResult.justification` after the cap is applied. Implement fix-registry as a CLI-managed JSON file written during `compile-evaluation`, with regression cross-referencing at compile time.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. Score Inconsistency (CLI bug): Fix in appdev-cli.mjs -- regenerate pdResult.justification AFTER applying the score cap, or strip the duplicate score from the justification text
2. Scroll-Animation Verification (critic gap): Perceptual Critic adds scroll-trigger + screenshot-after-scroll to OBSERVE step. Extends spatial discriminator with minimal temporal probing.
3. Above-the-Fold Check (critic gap): Perceptual Critic verifies initial-state visibility of key elements (hero CTA, scroll affordances)
4. Screenshot Organization (cleanup gap): Agent instructions updated to save screenshots to evaluation/round-N/<critic>/. CLI auto-stages round screenshots in the evaluation commit.
5. Regression Prevention (CLI fix registry): appdev-cli maintains fix-registry.json tracking resolved Major bugs. compile-evaluation cross-references: if a fixed bug reappears, flagged as REGRESSION (Critical severity). Critics remain stateless sensors.

### Claude's Discretion
- Exact format of fix-registry.json
- Whether above-the-fold check is a separate methodology step or folded into existing OBSERVE
- Specific Playwright commands for scroll-trigger verification
</user_constraints>

## Issue 1: Score Cap Justification Bug

**Confidence: HIGH** (verified by reading the code)

### Root Cause

In `cmdCompileEvaluation()` (appdev-cli.mjs):

1. Line 1385: `computeProductDepth(projectionSummary)` returns `pdResult` with `.justification` containing the **uncapped** score (e.g., "Product Depth 10/10 -- 12/12 acceptance tests passed (100%)")
2. Lines 1416-1426: Score cap applied to `allScores[capKey]`, reducing the score (e.g., 10 -> 9)
3. Line 1459: `pdResult.justification` (still showing uncapped score) is used for the justification column
4. Line 1462: Capped `score` is prepended: `"(" + score + " of 10) -- " + justification`
5. Result: "Product Depth | (9 of 10) -- Product Depth 10/10 -- ..." -- two conflicting scores

### Fix

After the score cap loop (line 1426), regenerate `pdResult.justification` if the Product Depth score was capped:

```javascript
// After score cap loop, regenerate PD justification with capped score
if (allScores.product_depth !== pdResult.score) {
  pdResult.justification = "Product Depth " + allScores.product_depth + "/10 -- " +
    pdResult.pass_rate_info + (pdResult.ceiling_applied ? " Ceiling: " + pdResult.ceiling_applied + "." : " No ceiling applied.") +
    " (score cap: round " + round + " max " + scoreCap + ")";
  pdResult.score = allScores.product_depth;
}
```

Alternative (simpler, recommended): Store pass/fail detail separately in `computeProductDepth()` return value, then assemble the justification string only at output time (after all caps applied). This avoids embedding the score number in the justification at all.

The cleanest approach: change `computeProductDepth()` line 230 to NOT embed the score in the justification string. Instead, use a format like:

```
"<passed>/<total> acceptance tests passed (<percent>%). <ceiling_info>"
```

Then line 1462 already prepends `"(" + score + " of 10) -- "`, which will always show the correct (post-cap) score. This eliminates the duplicate entirely.

### Affected Lines
- `computeProductDepth()`: line 230 (justification assembly)
- `cmdCompileEvaluation()`: lines 1416-1426 (score cap), line 1459 (justification lookup)

## Issue 2: Scroll-Animation Verification (Perceptual Critic)

**Confidence: HIGH** (verified via Playwright docs and playwright-cli command set)

### Playwright Commands for Scroll-Trigger Verification

The `playwright-cli` supports these commands relevant to scroll testing:

1. **`npx playwright-cli eval --browser msedge "<js>"`** -- evaluate JS in page context. Use to capture DOM state (element positions, computed styles, class lists) before scroll.
2. **`npx playwright-cli mousewheel 0 <dy>`** -- dispatch wheel event to scroll the page by `<dy>` pixels vertically.
3. **`npx playwright-cli screenshot --browser msedge --filename=<path>`** -- capture current viewport state.

### Recommended Pattern for OBSERVE Step

Add to perceptual-critic.md OBSERVE section, after responsive testing:

```
#### Scroll-Trigger Verification

Scroll-driven animations (fade-in, slide-up, parallax) are invisible to
static viewport screenshots. Verify them with a before/after comparison:

1. Capture pre-scroll state at the hero section:
   npx playwright-cli eval --browser msedge "[...document.querySelectorAll('[class*=animate], [class*=fade], [class*=slide], [data-scroll], [data-aos]')].map(el => ({ tag: el.tagName, classes: el.className, opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))"

2. Scroll past the fold to trigger animations:
   npx playwright-cli mousewheel 0 1500

3. Wait briefly for animations to fire, then re-evaluate:
   npx playwright-cli eval --browser msedge "[...document.querySelectorAll('[class*=animate], [class*=fade], [class*=slide], [data-scroll], [data-aos]')].map(el => ({ tag: el.tagName, classes: el.className, opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))"

4. Compare: if opacity, transform, or class values are identical before and
   after scroll, the animations are not firing. Report as a Major finding.
```

This uses 3 tool calls (eval, mousewheel, eval) -- within the ~60K token budget.

### Alternative: Write-and-Run Pattern

For more thorough scroll testing, a write-and-run spec could scroll incrementally and check `element.getAnimations()` to verify animation playback state. However, this is heavier than needed for the perceptual critic's purposes. The eval-based approach above provides the right signal/cost ratio.

### Key Selectors for Animation Detection

Common scroll-animation patterns to detect:
- `[data-aos]` (Animate On Scroll library)
- `[class*="animate"]`, `[class*="fade"]`, `[class*="slide"]`
- `[data-scroll]`, `[data-scroll-trigger]`
- CSS `animation-timeline: scroll()` / `animation-timeline: view()` (newer CSS API)
- IntersectionObserver-triggered class additions (check for `.visible`, `.in-view`, `.active`)

## Issue 3: Above-the-Fold Visibility Check

**Confidence: HIGH**

### Recommendation: Fold into Existing OBSERVE Step

The above-the-fold check is a natural extension of the OBSERVE step's initial page evaluation, not a separate methodology step. It should run before the scroll-trigger verification (Issue 2), as it verifies the initial viewport state.

### Implementation Pattern

Add to perceptual-critic.md OBSERVE section, before responsive testing:

```
#### Initial-State Visibility

Before scrolling, verify that key interactive elements are visible in the
initial viewport (above the fold at 1280x800). Elements that require
scrolling to discover are invisible to first-time visitors:

npx playwright-cli eval --browser msedge "(() => { const vp = { w: window.innerWidth, h: window.innerHeight }; const check = (sel, label) => { const el = document.querySelector(sel); if (!el) return { label, found: false }; const r = el.getBoundingClientRect(); return { label, found: true, visible: r.top < vp.h && r.bottom > 0 && r.left < vp.w && r.right > 0, top: Math.round(r.top), bottom: Math.round(r.bottom) }; }; return [ check('a[href*=scroll], button[class*=scroll], [class*=cta], [class*=hero] a, [class*=hero] button', 'Hero CTA'), check('[class*=scroll-indicator], [class*=scroll-down], [class*=scroll-hint]', 'Scroll affordance') ]; })()"
```

If a hero CTA or scroll affordance has `visible: false` (its `top` is beyond the viewport height), report as Major finding: "Key interactive element below the fold at initial viewport -- users must scroll to discover it."

## Issue 4: Screenshot Organization

**Confidence: HIGH**

### Current State

Screenshots taken by critics currently land in the project root (e.g., `home-320.png`, `home-1280.png`) because `--filename` paths in agent docs are relative filenames without directory prefixes. The SKILL.md evaluation commit stages `evaluation/round-N/` but root-level screenshots are not captured.

### Fix

Update `--filename` paths in all three critic agent definitions to include the critic's output directory:

```
--filename=evaluation/round-N/<critic>/home-320.png
```

For perceptual-critic.md, the OBSERVE section (line 108-112) currently shows:
```
npx playwright-cli screenshot --browser msedge --filename=home-320.png
npx playwright-cli screenshot --browser msedge --filename=home-1280.png
```

Change to:
```
npx playwright-cli screenshot --browser msedge --filename=evaluation/round-N/perceptual/home-320.png
npx playwright-cli screenshot --browser msedge --filename=evaluation/round-N/perceptual/home-1280.png
```

The `--filename` flag in playwright-cli accepts relative paths. When a directory prefix is given, playwright-cli creates the directory if it does not exist (standard Node.js writeFileSync behavior with mkdirSync).

For perturbation-critic and projection-critic, screenshots are less common but any `--filename` examples should follow the same `evaluation/round-N/<critic>/` pattern.

### Orchestrator Commit

The existing evaluation commit in SKILL.md already stages `evaluation/round-N/`:
```
Bash(git add evaluation/round-N/)
```

This glob already captures screenshots placed inside critic subdirectories. No SKILL.md changes needed for staging.

## Issue 5: Fix-Registry.json and Regression Detection

**Confidence: HIGH** (design) / **MEDIUM** (mapping to GAN theory)

### Design: fix-registry.json

**Location:** `evaluation/fix-registry.json` (project root, persists across rounds)

**Schema:**
```json
{
  "version": 1,
  "fixes": [
    {
      "id": "FN-3",
      "title": "Share Summary fails to render markdown",
      "severity": "Major",
      "critic": "projection",
      "fixed_in_round": 5,
      "last_seen_round": 4,
      "fingerprint": "projection:FN-3:share-summary-fails-to-render-markdown"
    }
  ]
}
```

**Fingerprint design:** `<critic>:<finding_id>:<slug(title)>`. The title slug provides human-readable cross-round identification even if finding IDs shift between rounds. The fingerprint is the join key for regression cross-referencing.

**Lifecycle managed by `compile-evaluation`:**
1. After assembling priority fixes, read `evaluation/fix-registry.json` (create empty if absent)
2. For each Major finding in the **previous** round's EVALUATION.md that is **absent** from the current round's findings: add to `fixes[]` with `fixed_in_round: N`
3. For each entry in `fixes[]`, check if the current round's findings contain a matching title (fuzzy: lowercase + strip punctuation). If found: add a REGRESSION finding with Critical severity to the compiled findings list, referencing `fixed_in_round` and current round
4. Write updated `evaluation/fix-registry.json`

### Regression Finding Format

When a regression is detected, insert a synthetic finding into the EVALUATION.md priority fixes:

```json
{
  "id": "REG-1",
  "severity": "Critical",
  "title": "REGRESSION: Share Summary fails to render markdown",
  "description": "Bug was fixed in round 5 but has reappeared in round 6. Originally reported as FN-3 (Major)."
}
```

Critical severity ensures the escalation logic reacts appropriately -- existing E-III/E-IV detection already handles Critical findings via the score trajectory.

### Matching Strategy

Title-based fuzzy matching (normalized lowercase, strip punctuation, compare):
- Simple and robust for the 5-10 finding range typical per critic per round
- No false positive risk at this scale
- Falls back gracefully: if a finding's title changes significantly between rounds, it is treated as a new finding rather than a regression (safe default)

More sophisticated matching (embedding similarity, AST diff) is unnecessary -- findings are short text strings written by LLMs with fairly consistent phrasing within a session.

### GAN Theory Mapping

**Confidence: MEDIUM**

| GAN Concept | Plugin Analog | Implementation |
|---|---|---|
| WGAN Lipschitz constraint | fix-registry as framework enforcement | CLI enforces the constraint, not critics |
| Relativistic Discriminator (RaGAN) | Cross-round comparison baseline | fix-registry provides the "prior round" reference |
| Mode collapse detection (NDB score) | Regression = mode collapse to prior failure mode | Fix reappearance = generator returning to a previously-corrected failure mode |
| Minibatch discrimination | Fix-registry as cross-round memory | Detects patterns across rounds that single-round critics cannot |

The key insight: critics remain stateless sensors (System 1 in VSM terms), while fix-registry acts as System 3* -- an audit channel with state memory that detects regression patterns invisible to ephemeral critics.

### Implementation Location in appdev-cli.mjs

Add to `cmdCompileEvaluation()` after `assemblePriorityFixes()` (line 1431):
1. Read/create `evaluation/fix-registry.json`
2. Load previous round's findings from `evaluation/round-{N-1}/EVALUATION.md` or from prior round's summary.json files
3. Diff current findings against prior findings to detect resolved bugs
4. Cross-reference current findings against `fixes[]` to detect regressions
5. Insert REGRESSION findings into the priority fixes list
6. Write updated fix-registry.json

## Common Pitfalls

### Pitfall 1: Score Cap Applied After Justification Assembly
**Already identified as Issue 1.** The justification string is assembled before the score cap, creating a contradiction. Fix by decoupling the score number from the justification text.

### Pitfall 2: playwright-cli mousewheel Timing
**What goes wrong:** `mousewheel` dispatches the event and returns immediately. Scroll-driven animations may not have fired yet when the next `eval` runs.
**How to avoid:** Add a brief pause or use `eval` with `requestAnimationFrame` wrapping to ensure one paint cycle has occurred. In practice, the eval command's own round-trip latency (~200-500ms) provides sufficient delay for most CSS animations.

### Pitfall 3: Fix-Registry Fuzzy Match False Positives
**What goes wrong:** Two different bugs with similar titles (e.g., "Navigation broken on mobile" vs "Navigation broken on tablet") match falsely.
**How to avoid:** Require exact normalized title match, not substring. At the 5-10 findings per round scale, exact match is sufficient. If needed later, add critic + dimension as secondary match keys.

## Project Constraints (from CLAUDE.md)

- Zero npm dependencies in appdev-cli.mjs (Node.js built-ins only)
- Everything in plugins/application-dev/ ships to users
- Critics use `npx playwright-cli` with `--browser msedge`
- Write-and-run pattern for token efficiency (~60K token budget per critic)
- Critics are stateless sensors -- no historical memory
- fix-registry state managed by CLI, not by critics

## Sources

### Primary (HIGH confidence)
- appdev-cli.mjs source code -- direct reading of lines 162-232 (computeProductDepth) and 1385-1462 (cmdCompileEvaluation)
- perceptual-critic.md -- OBSERVE methodology, screenshot examples
- SKILL.md -- orchestrator workflow, evaluation commit patterns
- PLAYWRIGHT-EVALUATION.md -- eval-first, write-and-run patterns

### Secondary (MEDIUM confidence)
- [Playwright Actions docs](https://playwright.dev/docs/input) -- mouse.wheel() API
- [Playwright Page docs](https://playwright.dev/docs/api/class-page) -- evaluate(), waitForFunction()
- [SonarQube Issue Tracking](https://docs.sonarsource.com/sonarqube-server/user-guide/issues) -- fingerprint hash, resolution lifecycle, reopening as regression
- [CSS Scroll-Driven Animations](https://developer.chrome.com/blog/scroll-triggered-animations) -- scroll-trigger CSS API context
- [Neptune.ai GAN Failure Modes](https://neptune.ai/blog/gan-failure-modes) -- mode collapse detection metrics
- [Google ML GAN Problems](https://developers.google.com/machine-learning/gan/problems) -- mode collapse theory

## Metadata

**Confidence breakdown:**
- Score cap fix: HIGH -- bug fully traced in code
- Scroll animation verification: HIGH -- playwright-cli commands verified
- Above-the-fold check: HIGH -- standard getBoundingClientRect pattern
- Screenshot organization: HIGH -- --filename path behavior verified
- Fix-registry design: HIGH (design) / MEDIUM (GAN theory mapping)

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- plugin internals)
