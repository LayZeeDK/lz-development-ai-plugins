# Phase 11: Scoring Foundation + Perturbation Critic - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The scoring system recognizes Robustness as a fourth dimension and a new perturbation-critic agent can evaluate application resilience through adversarial testing. This covers: DIMENSIONS constant update, perturbation-critic agent definition, Robustness calibration scenarios, and methodology boundary definitions (CRITIC-01 through CRITIC-04).

</domain>

<decisions>
## Implementation Decisions

### Robustness calibration anchors

Grounded in Ashby's Law of Requisite Variety (1956), Wiener's damping principle (1948), and Christie's robustness-vs-resilience distinction (via Cynefin/FRAM). Score reflects the ratio of defensive variety to disturbance variety and the system's damping behavior after perturbation.

**Below threshold -- 5/10 (Undamped + insufficient variety):**
A recipe app crashes when the search field receives a 500-character input. Rapid-clicking "Add to favorites" creates duplicate entries and eventually freezes the UI. Navigating back while an image loads produces a blank screen requiring full page reload. Console shows 3+ uncaught exceptions under normal-speed usage. The app works on the happy path but diverges from functional state under any non-ideal behavior. Defensive variety far below disturbance variety. Undamped (zeta near 0) -- perturbations cause the system to diverge.

Not 6 because: A 6 requires the app to at least survive perturbation without crashing. Here the system diverges -- it cannot return to equilibrium without a full reload, and multiple crash paths exist.

**At threshold -- 7/10 (Critically damped + adequate variety):**
The same recipe app handles long inputs by truncating with a visible character limit. Rapid clicking is debounced -- only one favorite entry created. Navigation during loading shows a loading indicator instead of a blank screen. Console is clean under normal usage; 1-2 warnings appear only under rapid stress. Error messages appear for invalid form submissions. Missing browser APIs trigger graceful degradation (non-AI fallback). Quality degradation is proportional to perturbation magnitude (Lipschitz-continuous). Near-critically damped (zeta ~0.7-1.0) -- converges to stable state after disturbance.

Not 8 because: An 8 requires the console to stay fully clean under stress and extreme viewports to be handled gracefully. At 7, the app handles common disturbances but has gaps at the extremes.

**Above threshold -- 9/10 (Overdamped + full variety):**
All inputs validated with informative error messages. Rapid interactions debounced/throttled throughout. Extreme viewports (320px, 4K) produce usable layouts. Console stays clean even under stress testing. Offline state shows cached content or meaningful offline indicator. Missing APIs handled transparently. No uncaught exceptions at any perturbation level tested. A "salt marsh" (Christie) -- absorbs disturbances naturally rather than resisting rigidly. Steady state maintained across all injected fault categories.

Not 10 because: A 10 means zero degradation found during exhaustive adversarial testing, including novel disturbance types not explicitly tested. The 9 has complete coverage of known disturbance classes but has not been tested against every conceivable perturbation.

### Methodology boundaries

Grounded in MCL-GAN discriminator specialization (Section 12.2: each discriminator develops expertise in a data subset) and R-FID pattern (Alfarra et al., ECCV 2022: standard evaluation vs adversarial evaluation).

- Perceptual-critic = standard FID analog: evaluates visual quality under NORMAL conditions
- Projection-critic = standard FID analog: evaluates functionality under NORMAL conditions
- Perturbation-critic = R-FID analog: evaluates quality CHANGE under ADVERSARIAL conditions

**The boundary rule:** If the condition is within the spec's stated parameters (breakpoints, valid inputs, documented workflows), it belongs to perceptual or projection. If it pushes beyond what the spec anticipates, it is perturbation. The perturbation-critic is the chaos engineering layer of the ensemble.

| Condition | Owner | Rationale |
|-----------|-------|-----------|
| Standard breakpoints (360px-1920px) | Perceptual | Within spec -- responsive DESIGN |
| Below 320px, above 2560px, rapid resize | Perturbation | Beyond spec -- chaos/fault injection |
| Form submission with valid data | Projection | Within spec -- feature CORRECTNESS |
| Empty/XSS/extreme-length inputs | Perturbation | Beyond spec -- input fault injection |
| Page navigation | Projection | Within spec -- workflow correctness |
| Rapid back-forward-reload sequences | Perturbation | Beyond spec -- timing fault injection |

### Adversarial test priorities

Ranked by chaos engineering methodology (Netflix, 2008: inject faults at boundaries with highest blast radius) and Ashby's Law (test highest-variety disturbances first).

**Must-have (core ~60K token budget):**
1. Input perturbation -- boundary/extreme values on every form. Highest disturbance variety.
2. Console monitoring under stress -- the spectral/R-FID analog: catches invisible fragility. Run console monitoring DURING all other perturbation categories, not as a separate step.
3. Rapid navigation -- back/forward/reload sequences. State management is the most common SPA fault point.

**Important (remaining budget):**
4. Viewport extremes -- below 320px, above 2560px, rapid resize during loading.
5. Error recovery -- missing APIs (LanguageModel unavailable), offline state, missing assets.

**Stretch (only if budget remains):**
6. JavaScript disabled -- progressive enhancement check.

### Robustness ceiling rules

Grounded in Wiener's damping ratio and CISQ SRI sigma levels (ISO/IEC 5055:2021).

| Condition | Ceiling | Theoretical basis |
|-----------|---------|-------------------|
| App crash or freeze under perturbation | max 4 | Undamped divergence (zeta=0); below CISQ 3-sigma |
| Unrecoverable state (requires reload) | max 5 | Cannot return to equilibrium without external reset |
| No error handling for invalid inputs | max 5 | Ashby: zero defensive variety for that disturbance class |
| 3+ uncaught exceptions under stress | max 6 | Underdamped oscillation visible only in spectral domain (console) |
| Console warnings that don't affect behavior | max 7 | Partially damped -- surface stable, internals stressed |

When multiple ceilings apply to the same criterion, the LOWEST ceiling wins. This follows the existing pattern from Functionality/Visual Design ceilings.

### Claude's Discretion
- Exact perturbation-critic agent definition structure and section ordering
- Finding ID prefix convention (research suggests RB- for Robustness)
- Summary.json schema field names and structure (must match universal schema)
- Test file organization for 4-dimension test cases
- Order of adversarial test categories within the agent methodology

</decisions>

<specifics>
## Specific Ideas

- Perturbation-critic is the R-FID (Alfarra et al., ECCV 2022) analog of the ensemble -- it evaluates quality STABILITY under adversarial conditions, not quality itself. This cleanly distinguishes it from the other critics.
- Console monitoring should run DURING other perturbation activities (concurrent), not as a separate sequential step. This matches the spectral discriminator pattern: frequency-domain analysis runs alongside spatial-domain analysis.
- Christie's robustness-vs-resilience framing: 7/10 = robust (seawall -- handles known disturbances rigidly), 9/10 = resilient (salt marsh -- absorbs novel disturbances gracefully). This gives the calibration scenarios a natural gradient.
- Chaos engineering methodology: define steady state, hypothesize, control blast radius, inject faults, observe. The perturbation-critic should follow this sequence.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- DIMENSIONS constant (appdev-cli.mjs:14): Single source of truth for all dimensions. Adding Robustness entry automatically propagates to extractScores regex, computeVerdict thresholds, compile-evaluation assessment sections.
- compile-evaluation auto-discovery (readdirSync + existsSync for summary.json): Already discovers any */summary.json directories. Adding perturbation/ directory requires no changes to discovery logic.
- resume-check generic critic handling (appdev-cli.mjs:781): Already constructs action names dynamically from critic names. No code change needed for perturbation-critic recovery.
- Static-serve command: Idempotent, already used by both existing critics. Perturbation-critic reuses the same pattern.

### Established Patterns
- Agent definition structure: YAML frontmatter (name, description, model, color, tools) + Information Barrier + Write Restriction + Step 0 (static-serve) + Methodology sections
- Tool allowlist pattern: Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(node *appdev-cli* static-serve*)
- Perturbation-critic also needs Bash(npx playwright test *) for write-and-run adversarial tests (same as projection-critic)
- Finding ID prefix convention: VD- (Visual Design), FN- (Functionality), to be extended with RB- (Robustness)
- Summary.json universal schema: { dimension, score, justification, findings[], ceiling_applied }
- assessmentSections array (appdev-cli.mjs:1336): Maps dimension key to source label. Needs new entry for robustness -> "Perturbation Critic"
- SCORING-CALIBRATION.md structure: Hard ceiling rules table, then calibration scenarios (below/at/above threshold) with boundary explanations

### Integration Points
- DIMENSIONS constant (appdev-cli.mjs:14): Add { name: "Robustness", key: "robustness", threshold: 6 }
- assessmentSections array (appdev-cli.mjs:1336): Add robustness entry mapping to Perturbation Critic
- Test file (test-appdev-cli.mjs): All extractScores, computeVerdict, compile-evaluation, and roundComplete tests need updating from 3 to 4 dimensions
- SCORING-CALIBRATION.md: Add Robustness ceiling rules section and calibration scenarios
- EVALUATION-TEMPLATE.md: May need Robustness Assessment section added
- SKILL.md orchestrator: Not changed in this phase (Phase 13 handles orchestrator integration)

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 11-scoring-foundation-perturbation-critic*
*Context gathered: 2026-04-02*
*Theoretical grounding: Miyato (ICLR 2018), Alfarra (ECCV 2022), Ashby (1956), Wiener (1948), Christie (Cynefin/FRAM), Netflix chaos engineering (2008), CISQ SRI (ISO 5055:2021)*
