# Scoring Calibration Reference

**Loaded by:** perceptual-critic (Visual Design ceilings), projection-critic (Functionality and Product Depth ceilings), perturbation-critic (Robustness ceilings), CLI compile-evaluation (all ceilings for cross-validation).

**Purpose:** This file anchors scores to concrete scenarios and enforces mechanical ceiling rules. It contains structural/mechanical scoring guidance only -- behavioral guidance stays in each critic's agent definition.

Read this file AFTER listing all findings. Score against these rules, not against gut feeling.

---

## Hard Score Ceiling Rules

When a condition is met, the score for that criterion CANNOT exceed the ceiling. When multiple ceilings apply to the same criterion, use the LOWEST ceiling.

### Functionality

| Condition | Ceiling |
|-----------|---------|
| Any Critical bug | max 5 |
| 3+ Major bugs | max 6 |
| Core workflow broken | max 4 |

### Product Depth

| Condition | Ceiling |
|-----------|---------|
| >50% features Missing/Broken | max 5 |
| Any Core feature missing | max 6 |
| All features stubbed | max 3 |
| Canned AI feature | max 5 |

### Visual Design

| Condition | Ceiling |
|-----------|---------|
| All images placeholder | max 3 |
| No design language match | max 5 |
| Layout broken on mobile | max 5 |
| Shared components (nav/footer/header) visually differ across pages | max 6 |

### Robustness

| Condition | Ceiling |
|-----------|---------|
| App crash or freeze under perturbation | max 4 |
| Unrecoverable state (requires reload) | max 5 |
| No error handling for invalid inputs | max 5 |
| 3+ uncaught exceptions under stress | max 6 |
| Console warnings that don't affect behavior | max 7 |

### Browser AI Degradation (Cross-Criterion)

| Condition | Ceiling |
|-----------|---------|
| App non-functional without browser AI APIs | Functionality max 4 |
| AI features show broken UI without APIs | Functionality max 6 |

### Applying Multiple Ceilings

When multiple ceilings apply to the same criterion, the LOWEST ceiling wins.

Example: An app with 1 Critical bug (max 5) and 4 Major bugs (max 6) receives Functionality max 5 (the lower ceiling).

---

## Conflict Resolution Rules

### Criteria Are Independent

Each criterion is scored on its own merits. Strong visual design does not compensate for broken features.

Example: An app with polished design but a broken core workflow scores Visual Design 7, Functionality 3. The scores are NOT averaged.

### Cross-Criterion Propagation (One Direction Only)

A defect that affects multiple criteria lowers ALL affected scores. But quality in one criterion does NOT raise another.

- A bug that ALSO breaks the visual layout lowers BOTH Functionality and Visual Design.
- High Product Depth does NOT raise Functionality.
- Clean design does NOT raise Product Depth.

### No Averaging or Trading

Criteria do not compensate each other. The overall verdict is FAIL if ANY criterion scores below its threshold:
- Product Depth: 7
- Functionality: 7
- Visual Design: 6
- Robustness: 6

---

## Score-Against-the-Spec Rule

The spec (SPEC.md) is the contract. Score against what the spec requires, not against what the application happens to do well.

- A beautiful design in the wrong theme = low Visual Design (spec mismatch).
- Extra features not in the spec do NOT count for Product Depth (off-spec).
- Missing a spec-required feature = Product Depth impact regardless of other feature quality.
- A feature that works differently from what the spec describes = Broken, not Partial.

---

## Round-Independent Scoring

Scores are absolute, not relative. A 5 in round 1 means the same quality level as a 5 in round 5.

- Do NOT compare to the previous round's scores.
- Do NOT give higher scores because "it improved since last round."
- Compare every round to the spec and the calibration scenarios below.
- The only valid comparison basis is the spec and these calibration anchors.

---

## Mandatory Score Justifications

Each score in the Scores table must cite specific findings from the evaluation. Scores without evidence are invalid.

**Format:** `<Criterion>: <score>/10 -- <cite specific findings>`

**Examples:**
- "Functionality: 5/10 -- 2 Critical bugs (#3, #7), 3 Major bugs, core search broken"
- "Product Depth: 7/10 -- 8/10 features implemented, 1 Partial (filtering lacks sort), 1 Missing (export)"
- "Visual Design: 4/10 -- all images are placeholders, generic purple gradient hero, no typography customization"
- "Product Depth: 8/10 -- 9/10 features implemented, 1 Partial (search lacks multi-field), 0 Missing"

---

## Calibration Scenarios

Each scenario below provides a concrete application state, the correct score, the rationale, and a boundary explanation that distinguishes it from adjacent scores. Use these to anchor your scoring -- if the application you are evaluating matches a scenario, it should receive a similar score.

### Product Depth

**Below Threshold: 5/10**

A task management app (SPEC.md lists 8 features: create task, edit task, delete task, mark complete, filter by status, search, due dates, categories). The app renders a task list and allows creating tasks with a title. Edit opens a modal but does not save changes. Delete button exists but throws a console error. No filtering, search, due dates, or categories are present. 3 of 8 features work (create, list, mark complete), 2 are broken (edit, delete), 3 are missing entirely.

Score: 5/10 -- Over 50% of features are Missing or Broken. The app delivers a fraction of the spec. Ceiling rule applies: >50% features Missing/Broken = max 5.

Not 6 because: A 6 would require more than half the features to be at least Partial. Here the majority are Missing or Broken with no workaround.

**At Threshold: 7/10**

The same task management app has all 8 features present. Create, edit, delete, mark complete, and due dates work correctly. Search finds tasks by title but not by description (Partial). Filter works for status but not for categories (Partial). Categories can be assigned but not created or edited (Partial). No features are Missing or Broken.

Score: 7/10 -- All features are at minimum Partial. Core features work. The gaps are in secondary functionality (search scope, filter completeness, category management). The spec contract is substantially met.

Not 8 because: An 8 requires nearly all features fully implemented with only minor gaps. Three Partial features represent meaningful missing functionality.

**Above Threshold: 9/10**

All 8 features work as specified. Search finds tasks by title and description with instant results. Filters combine status and category. Due dates show overdue indicators. Categories support full CRUD. The only gap: the export button (not in spec) does not exist -- but since it is not in the spec, this is not a gap. One minor refinement opportunity: drag-to-reorder is mentioned in the spec but only works within the same category, not across categories.

Score: 9/10 -- Spec is nearly fully delivered. A single minor Partial feature (drag reorder across categories) prevents a perfect 10. All core and secondary features work as described.

Not 10 because: A 10 means the spec is completely delivered with no gaps. The cross-category drag limitation is a real spec gap, however minor.

### Functionality

**Below Threshold: 5/10**

An e-commerce app where the shopping cart loses items on page refresh (Critical bug -- data loss). The checkout form submits but silently fails to create an order (Critical bug -- core workflow broken). Product search returns results but clicking a product sometimes loads the wrong detail page (Major bug). Three other pages have JavaScript errors that block interaction (Major bugs). The happy path is unreliable.

Score: 5/10 -- 2 Critical bugs trigger the ceiling (any Critical bug = max 5). Core workflow (browse -> cart -> checkout) is broken at multiple points.

Not 6 because: A 6 requires zero Critical bugs (ceiling: any Critical = max 5). The data loss and silent checkout failure are both Critical severity.

**At Threshold: 7/10**

The same e-commerce app with no Critical bugs. The cart persists across refresh. Checkout creates orders correctly. Product search works. Two Major bugs remain: (1) applying a discount code returns a generic error instead of the actual validation message, (2) the order history page shows orders in random order instead of chronological. One Minor bug: the quantity selector allows negative numbers but the cart clamps to 1.

Score: 7/10 -- No Critical bugs. Two Major bugs exist but they are in secondary workflows (discount codes, order history display), not core purchase flow. The app is usable for its primary purpose.

Not 8 because: An 8 requires at most 1 Major bug. Two Major bugs, even in secondary workflows, represent real functionality gaps.

**Above Threshold: 9/10**

All features work as specified. The cart is persistent, checkout completes, search is fast and accurate, order history is correct, discount codes validate properly. One Minor bug: the mobile hamburger menu requires a double-tap to close on iOS Safari. All core and secondary workflows complete successfully. Edge cases (empty cart checkout, expired discount codes) return appropriate error messages.

Score: 9/10 -- Near-flawless execution. The one Minor bug is platform-specific and does not impede functionality. Error handling is comprehensive.

Not 10 because: A 10 means zero bugs found during thorough testing. The iOS menu bug, while Minor, is a real defect.

### Visual Design

**Below Threshold: 4/10**

A music streaming app specified with a "dark, immersive, neon-accented" design language. The app uses a white background with default Material UI components. Typography is Roboto at default sizes. No custom color palette -- the primary color is Material UI's default blue (#1976d2). Cards have default border-radius and box-shadow. The hero section has a stock gradient. No visual connection to the music/streaming domain. Layout is a generic 3-column card grid.

Score: 4/10 -- No design language match with the spec (ceiling: max 5 for no match, but the score is below the ceiling). AI-slop patterns dominate: default framework styling, generic fonts, no domain identity. The design communicates nothing about music or streaming.

Not 5 because: A 5 would show some attempt at customization even if the overall direction is wrong. This is entirely default framework output with no evidence of intentional design decisions.

**At Threshold: 6/10**

The same music app uses a dark background with a custom neon-green accent color. Typography uses a display font for headings (Orbitron) paired with a readable body font. The color palette is cohesive but limited -- neon green on dark gray with no secondary accents. Layout uses a sidebar navigation with album art grid. The design clearly targets the music domain. Navigation bar uses the same font but a slightly different accent color on the settings page. Heading sizes are consistent across pages. However: all album images are placeholders (solid color squares), hover states are basic opacity changes, and the player controls at the bottom use default browser audio elements with no custom styling.

Score: 6/10 -- The design direction matches the spec. There is intentionality in font and color choices. The domain identity is present. But placeholder images (cosmetic impact since the app is music-focused), unstyled audio controls, and limited interaction design prevent a higher score.

Not 7 because: A 7 requires visual coherence across all pages. Placeholder images plus the nav color inconsistency show incomplete design execution.

**Above Threshold: 8/10**

The music app has a fully realized dark theme with neon-green and electric-purple accents. Custom typography with an angular display font and clean sans-serif body. Album art displays with custom hover animations (scale + glow effect). The player is fully custom-styled with a waveform visualizer. Navigation uses smooth transitions. Color palette has 4 intentional accent colors used consistently ACROSS ALL PAGES. Navigation and footer are visually identical on every page. Responsive design works across breakpoints. One gap: the settings page reverts to a generic form layout that does not match the immersive feel of the rest of the app.

Score: 8/10 -- Strong design identity that clearly matches the spec's "dark, immersive, neon-accented" direction. Intentional typography, color, and interaction design. Shared components are consistent across pages. The inconsistent settings page is the only notable gap.

Not 9 because: The settings page reverts to a generic form layout -- shared components are consistent but page-level design language breaks.

### Robustness

**Below Threshold: 5/10**

A recipe app crashes when the search field receives a 500-character input. Rapid-clicking "Add to favorites" creates duplicate entries and eventually freezes the UI. Navigating back while an image loads produces a blank screen requiring full page reload. Console shows 3+ uncaught exceptions under normal-speed usage. The app works on the happy path but diverges from functional state under any non-ideal behavior. Defensive variety far below disturbance variety. Undamped (zeta near 0) -- perturbations cause the system to diverge.

Score: 5/10 -- Undamped + insufficient variety. The app cannot survive perturbation without crashing and multiple crash paths exist.

Not 6 because: A 6 requires the app to at least survive perturbation without crashing. Here the system diverges -- it cannot return to equilibrium without a full reload, and multiple crash paths exist.

**At Threshold: 7/10**

The same recipe app handles long inputs by truncating with a visible character limit. Rapid clicking is debounced -- only one favorite entry created. Navigation during loading shows a loading indicator instead of a blank screen. Console is clean under normal usage; 1-2 warnings appear only under rapid stress. Error messages appear for invalid form submissions. Missing browser APIs trigger graceful degradation (non-AI fallback). Quality degradation is proportional to perturbation magnitude (Lipschitz-continuous). Near-critically damped (zeta ~0.7-1.0) -- converges to stable state after disturbance.

Score: 7/10 -- Critically damped + adequate variety. The app handles common disturbances and converges to a stable state after perturbation.

Not 8 because: An 8 requires the console to stay fully clean under stress and extreme viewports to be handled gracefully. At 7, the app handles common disturbances but has gaps at the extremes.

**Above Threshold: 9/10**

All inputs validated with informative error messages. Rapid interactions debounced/throttled throughout. Extreme viewports (320px, 4K) produce usable layouts. Console stays clean even under stress testing. Offline state shows cached content or meaningful offline indicator. Missing APIs handled transparently. No uncaught exceptions at any perturbation level tested. A "salt marsh" (Christie) -- absorbs disturbances naturally rather than resisting rigidly. Steady state maintained across all injected fault categories.

Score: 9/10 -- Overdamped + full variety. Complete coverage of known disturbance classes with steady state maintained across all fault categories.

Not 10 because: A 10 means zero degradation found during exhaustive adversarial testing, including novel disturbance types not explicitly tested. The 9 has complete coverage of known disturbance classes but has not been tested against every conceivable perturbation.

