# Quick Task 260405-ovl: application-dev v1.2 patch.3 test for consensus.dk website - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Task Boundary

Fix 5 issues identified during the v1.2 patch.3 test run (consensus.dk website prompt):
1. Score inconsistency in Product Depth justification (CLI bug)
2. Hero scroll-animation brokenness not detected by critics (critic gap)
3. "Scroll to explore" below the fold not detected (critic gap)
4. Uncommitted screenshots left in project root (cleanup gap)
5. Share Summary regression between R5 and R6 not detected (regression detection gap)

</domain>

<decisions>
## Implementation Decisions

### 1. Score Inconsistency (CLI bug)
- Fix in appdev-cli.mjs: regenerate pdResult.justification AFTER applying the score cap, or strip the duplicate score from the justification text
- Root cause: computeProductDepth() returns justification with uncapped score (line 230), score cap applied later (line 1418-1426), justification assembled with both values (line 1462)
- Theoretical grounding: WGAN Critic signal corruption (Taxonomy 5.1) -- garbled gradient signal to Generator

### 2. Scroll-Animation Verification (critic gap)
- **Perceptual Critic** adds scroll-trigger + screenshot-after-scroll to OBSERVE step
- Extends the spatial discriminator (Taxonomy 7.3) with minimal temporal probing (Taxonomy 9.1 DVD-GAN)
- Ashby's Requisite Variety: static-screenshot sensor lacks variety to match dynamic system
- Implementation: scroll to trigger animations, screenshot before/after, verify state change

### 3. Above-the-Fold Check (critic gap)
- Perceptual Critic verifies initial-state visibility of key elements (hero CTA, scroll affordances)
- Projection Discriminator conditioning gap (Taxonomy 3.3): critic verifies animation exists but not that the discovery mechanism is visible at t=0
- Cybernetics: initial-state sensor gap

### 4. Screenshot Organization (cleanup gap)
- Agent instructions updated to save screenshots to evaluation/round-N/<critic>/
- CLI auto-stages round screenshots in the evaluation commit
- Cybernetics: entropy accumulation degrades workspace signal-to-noise

### 5. Regression Prevention (CLI fix registry)
- appdev-cli maintains fix-registry.json tracking resolved Major bugs
- compile-evaluation cross-references: if a fixed bug reappears, flagged as REGRESSION (Critical severity)
- Orchestrator reacts to REGRESSION: Critical findings per existing escalation logic
- Critics remain stateless sensors (ephemeral, no historical memory)
- Theoretical grounding:
  - WGAN Lipschitz constraint (Taxonomy 5.1): framework-enforced, not critic-enforced
  - Relativistic Discriminator (Taxonomy 5.2): relative comparison against prior-round baseline
  - Beer's System 3/3*: controller + audit channel with hysteresis (state memory)
  - Cybernetics: closed-loop control with negative feedback and state memory

### Claude's Discretion
- Exact format of fix-registry.json
- Whether above-the-fold check is a separate methodology step or folded into existing OBSERVE
- Specific Playwright commands for scroll-trigger verification

</decisions>

<specifics>
## Specific Ideas

- fix-registry.json should be written by compile-evaluation when a Major bug transitions from present to absent between consecutive rounds
- REGRESSION findings should include the round where the fix was confirmed and the round where it regressed
- Scroll-animation verification: use playwright-cli scroll + screenshot, compare DOM state before/after scroll
- Screenshot paths: use --filename=evaluation/round-N/<critic>/screenshot-name.png in agent docs
- Score cap fix: simplest approach is to regenerate the justification string after cap is applied

</specifics>

<canonical_refs>
## Canonical References

- GAN Discriminator Taxonomy: .planning/research/gan-discriminator-taxonomy.md
  - 5.1 Wasserstein Critic (WGAN/WGAN-GP) -- framework-enforced constraints
  - 5.2 Relativistic Discriminator -- relative comparison against baseline
  - 7.3 Perceptual Discriminator -- visual quality evaluation
  - 9.1 DVD-GAN Temporal Discriminator -- temporal feature evaluation
  - 3.3 Projection Discriminator -- conditioning consistency check
- Beer's VSM: System 1 (critics/sensors), System 3 (orchestrator/controller), System 3* (CLI/audit)
- Ashby's Requisite Variety: sensor variety must match system variety
- Salimans et al. 2016: one-sided label smoothing (already in score cap logic)

</canonical_refs>
