# Milestones

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

