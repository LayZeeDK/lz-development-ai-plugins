# Milestones

## v1.2 Dutch Art Museum Test Fixes (Shipped: 2026-04-04)

**Phases completed:** 6 phases, 11 plans, 22 tasks

**Key accomplishments:**

- 4-dimension scoring system with Robustness dimension at threshold 6, mapped to Perturbation Critic via DIMENSIONS constant
- Robustness ceiling rules (5 conditions) with calibration scenarios and perturbation-critic agent definition using chaos engineering methodology boundaries
- EMA-smoothed convergence detection with scaled thresholds derived from DIMENSIONS.length and dual-path signal architecture (safety/hybrid/trend)
- Per-dimension pass/fail status in round-complete and per-dimension scores in get-trajectory for Generator corrective action selection (Conant-Ashby Good Regulator Theorem)
- Generalized resume-check from 2-critic to N-critic with spawn-all-critics action and atomic dispatch table update
- 3-critic evaluation flow, SAFETY_CAP wrap-up, prompt protocol, and 5-agent two-tier architecture in SKILL.md
- Cross-page visual consistency audit in perceptual-critic, A->B->A round-trip navigation tests in projection-critic, and Visual Design calibration expanded with shared component divergence ceiling
- 7-API browser-built-in-ai meta-skill with decision tree routing, Chrome/Edge comparison, and generalized graceful degradation replacing single-API browser-prompt-api skill
- docs/ARCHITECTURE.md rewritten with v1.2 ensemble architecture grounded in GAN (WGAN scoring, information barrier), Cybernetics (requisite variety, EMA smoothing, scaled thresholds, dual-path signals, Schmitt trigger), and Turing test (critics as interrogators, product surface boundary)
- Both README files updated from stale three/four-agent descriptions to v1.2 five-agent ensemble with Perturbation Critic and 4 scoring dimensions

---

## v1.1 Ensemble Discriminator + Crash Recovery (Shipped: 2026-04-02)

**Phases completed:** 4 phases, 11 plans
**Commits:** 93 | **Files:** 15 changed, +2,294 / -569 lines | **Plugin LOC:** 8,188
**Timeline:** 3 days (2026-03-31 -- 2026-04-02)
**Requirements:** 34/34 satisfied | **Audit:** PASSED (revision 4)

**Key accomplishments:**

- Replaced monolithic Evaluator with GAN ensemble: 2 WGAN critics (perceptual-critic + projection-critic) + deterministic CLI aggregator (compile-evaluation). Each critic isolated to ~60K tokens max, scoring one dimension in its own context.
- Added behavioral acceptance criteria to SPEC-TEMPLATE.md with tier minimums (Core >= 3, Important >= 2, Nice-to-have >= 1) and dedicated acceptance-criteria-guide.md reference.
- Created PLAYWRIGHT-EVALUATION.md shared reference with 7 token-efficient browser evaluation techniques; write-and-run pattern replaces ~30 interactive tool calls with ~5.
- Implemented crash recovery via resume-check (4 recovery states from artifact + state JSON detection) and static production build serving via static-serve CLI subcommand.
- Closed all integration gaps from milestone audit: 4 bugs fixed (install-dep calling convention, SAFETY_CAP stale build, @playwright/test installation, baseURL configuration), stale artifacts cleaned, 14 orphaned Phase 7 requirements verified.

---

## v1.0 application-dev Plugin v1 Hardening (Shipped: 2026-03-29)

**Phases completed:** 6 phases, 15 plans
**Commits:** 85 | **Files:** 33 changed, 8,185 insertions | **Plugin LOC:** 5,881
**Timeline:** 4 days (2026-03-26 -- 2026-03-29)
**Requirements:** 43/43 satisfied | **Audit:** PASSED

**Key accomplishments:**

- Delegation-only orchestrator with two-layer enforcement (tool allowlists + prompt guards) and resumable workflow state
- Score-based convergence loop with 4 exit conditions (PASS/PLATEAU/REGRESSION/SAFETY_CAP) and escalation vocabulary (E-0 through E-IV)
- Git version control throughout: Planner commits SPEC.md, Generator commits feature-by-feature, Evaluator commits to evaluation/round-N/, milestone tags at key points
- Canonical templates for SPEC.md and EVALUATION.md preserving the appdev-cli regex parse contract
- Adversarial evaluator with 15-step workflow, scoring calibration (12 scenarios), AI probing (10-probe battery + 10 Turing test concepts), and asset validation
- Hardened generator with progressive 4-phase CI, testing decision framework, asset sourcing pipeline, and 6 bundled skills (3 browser-AI + playwright-testing + vitest-browser + vite-plus)
- Research-driven agent definition optimization: progressive disclosure, WHY-based rationale, imperative voice, -119 lines (-9%) across 4 agent definitions

---
