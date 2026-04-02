# Project Research Summary

**Project:** application-dev plugin v1.2 "Dutch Art Museum Test Fixes"
**Domain:** GAN-inspired autonomous application development harness (Claude Code plugin)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

The v1.2 milestone adds a dedicated adversarial testing agent (perturbation-critic) to the
existing ensemble, hardens the convergence logic against dimension-count growth, and expands
the scope of both existing critics without renaming their dimensions. This is a targeted
integration milestone, not a foundational redesign. The v1.1 ensemble architecture was
explicitly designed for N-critic extensibility -- compile-evaluation auto-discovers
`*/summary.json` directories, the score-extraction regex is dynamically built from the
DIMENSIONS constant, and the resume-check logic reads expected critics from state. Adding
the perturbation-critic is, architecturally, a single-point change to the DIMENSIONS
constant plus a new agent definition file. No discovery logic, no regex, and no
compile-evaluation restructuring is required.

The perturbation-critic is genuinely novel in the application-generation space. No
competing harness (Anthropic article, Playwright Agents v1.56+, Chromatic) has a dedicated
adversarial testing agent operating inside a generation loop. The closest analog is the
SitePoint adversarial LLM tester, which is a standalone tool outside any generation cycle.
Our perturbation-critic feeds Robustness findings back to the Generator, closing the
adversarial loop: the Generator faces pressure from three independent critics (visual,
functional, robustness), each probing a different failure mode. This is the direct
application of GAN discriminator ensemble principles to application quality assurance.

The highest technical risk in v1.2 is the convergence logic. The current
`computeEscalation()` function uses hardcoded magic numbers (`<= 1` for plateau, `<= 5`
for E-IV crisis) calibrated for 3 dimensions (max total 30). With 4 dimensions (max
total 40), these thresholds become proportionally wrong -- the crisis trigger drops from
16.7% to 12.5% of max, making genuine catastrophic failures harder to detect. All
thresholds must be derived from `DIMENSIONS.length * 10` before the new dimension is
active. The second-highest risk is the resume-check rename: `"spawn-both-critics"` is a
stringly-typed contract between appdev-cli.mjs and SKILL.md. Updating only one file
breaks crash recovery silently. Both must change atomically.

## Key Findings

### Recommended Stack

Zero new dependencies for v1.2. The entire milestone builds on the existing stack:
playwright-cli and @playwright/test for browser automation, Node.js built-ins for
appdev-cli.mjs, and Claude Code's Agent tool for parallel sub-agent spawning. The
perturbation-critic uses the same tool allowlist as the projection-critic -- there is no
new Playwright capability needed. Network simulation is handled observationally (console
error monitoring, loading state inspection) rather than through DevTools Protocol
interception, which playwright-cli does not expose directly.

**Core technologies (unchanged from v1.1):**
- Node.js 18+ built-ins (fs, path, child_process, net) -- zero-dependency CLI pattern
- @playwright/cli 0.1.1+ -- browser automation for all critics; already in Step 0.5 setup
- @playwright/test 1.58+ -- acceptance test execution; already in Step 0.5 setup
- Claude Code Agent tool -- parallel sub-agent spawning; platform-provided

**v1.2 additions (no npm installs):**
- `agents/perturbation-critic.md` -- new agent definition file, ~140 lines
- `references/architecture-principles.md` -- new reference file, ~200 lines
- DIMENSIONS constant -- one new entry (`Robustness`, threshold 6)

### Expected Features

The v1.2 feature set divides into P1 must-haves (directly address Dutch art museum test
failures), P2 should-haves (quality improvements with low risk), and P3 deferrals (need
empirical data not yet collected).

**Must have (P1 -- table stakes for v1.2 validity):**
- Perturbation-critic (Robustness dimension) -- no robustness testing existed; PASS verdicts
  certified only happy-path behavior
- DIMENSIONS constant update (add Robustness, threshold 6) -- foundation for all P1 work
- 3-critic orchestration (spawn/check/retry for perturbation) -- wires the new agent into
  the evaluation loop
- EMA-smoothed convergence trajectory -- false PLATEAU/REGRESSION exits from single-round
  noise drove premature termination
- Per-dimension trajectory tracking -- Generator cannot prioritize stagnant dimensions
  without dimension-level feedback
- Cross-page visual consistency (perceptual-critic) -- Dutch art museum test showed pages
  with inconsistent styling scored as passing
- A->B->A navigation testing (projection-critic) -- navigation state persistence was not
  exercised; back-button state loss was undetected
- Architecture documentation -- milestone requirement; pure documentation

**Should have (P2 -- differentiators, low risk):**
- Browser-agnostic LanguageModel guidance (Edge 139+/Phi-4-mini parity with Chrome)
- Vite+ skill refresh to match official `vp` CLI workflow
- Dependency freshness diagnostic step or CLI subcommand
- Z-score anomaly detection for mode collapse and hallucinated evaluation scores
- LLM-driven adversarial interaction sequences (advanced perturbation-critic capability)

**Defer to v1.3+ (need empirical data):**
- Rising thresholds (curriculum learning) -- needs score distributions from v1.2 runs first
- Dimension-weighted scoring -- weights require calibration against real score data
- Score distribution statistics collection (`--collect-stats` flag) -- enables v1.3 calibration

**Anti-features (do not build):**
- Per-dimension exit conditions -- combinatorial complexity (4^4 combinations); total-score
  exits with advisory per-dimension reporting is the correct design
- Automated test generation from SPEC.md -- brittle; projection-critic's write-and-run
  pattern with snapshot-based selector discovery is the right approach
- Robustness scoring via source code metrics (cyclomatic complexity, coverage) -- violates
  the GAN information barrier; behavioral testing only

### Architecture Approach

The v1.2 integration is a five-level addition to the v1.1 ensemble: (1) DIMENSIONS
constant as the single source of truth for all scoring consumers, (2) perturbation-critic
agent plugging into the existing auto-discovery pipeline, (3) convergence logic using
dimension-count-scaled thresholds instead of magic numbers, (4) orchestrator loop extended
from 2 to 3 parallel critics, and (5) architecture documentation as a new on-demand
reference file. The dependency chain is strictly linear: DIMENSIONS must stabilize before
any downstream consumer is built or modified.

**Component map for v1.2:**

New components:
1. `agents/perturbation-critic.md` -- evaluates Robustness through adversarial interaction
   (viewport stress, invalid inputs, navigation stress, console monitoring under load);
   GAN taxonomy: Perturbation critic (novel -- no prior category); information barrier
   enforced by tool allowlist (no source code reads)
2. `references/architecture-principles.md` -- GAN/Cybernetics/Turing test grounding;
   on-demand reference, ~200 lines, loaded only when agents need architectural context

Modified components (in build order):
3. `appdev-cli.mjs` DIMENSIONS constant -- add `{ name: "Robustness", key: "robustness",
   threshold: 6 }` (all downstream consumers auto-adapt via existing loops)
4. `appdev-cli.mjs` computeEscalation() -- scale plateau and crisis thresholds from
   `DIMENSIONS.length * 10`; add per-dimension status to round-complete output
5. `appdev-cli.mjs` cmdResumeCheck() -- rename `spawn-both-critics` to `spawn-all-critics`
   (must change atomically with SKILL.md)
6. `SKILL.md` -- add perturbation-critic to spawn/check/retry/resume; update architecture
   section from 4 to 5 agents; update file-based communication section
7. `agents/perceptual-critic.md` -- add cross-page consistency methodology
8. `agents/projection-critic.md` -- add A->B->A navigation test patterns
9. `agents/generator.md` -- Vite+ adoption, dependency freshness, browser-agnostic
   LanguageModel with graceful degradation

Unchanged (17 components): planner.md, all skill files except vite-plus, all reference
files except SCORING-CALIBRATION.md and EVALUATION-TEMPLATE.md, plugin manifest.

### Critical Pitfalls

1. **Magic numbers wrong with 4 dimensions (CRITICAL)** -- `computeEscalation()` thresholds
   (`<= 5` for E-IV, `<= 1` for E-II plateau) were calibrated for max total 30. With max
   total 40, E-IV crisis becomes under-sensitive and E-II may misbehave. Prevention: derive
   all from `Math.ceil(DIMENSIONS.length * 10 * fraction)` in Phase 2, verified by tests
   against both 3-dimension and 4-dimension configurations.

2. **Scope overlap between critics (CRITICAL)** -- All three critics observe the same
   running application via playwright-cli. Without explicit methodology boundaries,
   the same finding (e.g., viewport layout at 320px) appears in two critic summaries.
   Duplicate findings inflate Priority Fixes and confuse the Generator in fix-only mode.
   Prevention: perturbation-critic instructions must explicitly say "test EXTREME viewports
   (not standard breakpoints -- that is the perceptual-critic's domain)" and "test input
   RESILIENCE under adversarial conditions (not feature correctness -- that is the
   projection-critic's domain)."

3. **Resume-check rename breaking crash recovery (CRITICAL)** -- `"spawn-both-critics"` is
   a stringly-typed contract between appdev-cli.mjs (line 775) and SKILL.md dispatch table.
   Updating only one file causes the orchestrator to receive an unrecognized action string
   and stall, losing the user's in-progress work. Prevention: change both files atomically
   in Phase 3; add a test that verifies `spawn-all-critics` is returned when all 3 critics
   are missing.

4. **3-critic parallel concurrency limit unknown (MEDIUM)** -- Claude Code's sub-agent
   concurrency model is undocumented. v1.1 uses 2 parallel Agent() calls reliably; 3
   simultaneous spawns is untested. Prevention: test empirically during Phase 3. If the
   platform queues or rejects the third spawn, fall back to 2+1 sequential spawning
   (perceptual + projection in parallel, then perturbation). The retry logic already handles
   individual critic failure.

5. **Robustness calibration gap on day 1 (MEDIUM)** -- The Robustness dimension has no
   empirical score distribution. The perturbation-critic may cluster scores around the
   threshold (non-discriminating) or flag everything adversarially (bottleneck).
   Prevention: write mechanical ceiling rules in SCORING-CALIBRATION.md before the critic
   is used (e.g., "app crashes on valid action -> max 4", ">10 console errors on load ->
   max 5"), reducing subjective scoring variance.

## Implications for Roadmap

Based on combined research, the dependency graph yields 6 phases in 3 sequential + 3
independent tracks.

### Phase 1: Scoring Foundation + Perturbation Critic Definition

**Rationale:** DIMENSIONS constant is consumed by extractScores (regex), computeVerdict
(threshold checks), computeEscalation (max total), compileEvaluation (assessment sections),
and the new perturbation-critic agent (reporting Robustness scores). It must stabilize
before any downstream component is built. The perturbation-critic bundles here because it
is the primary consumer of the new dimension and can be authored and tested against the
updated constant in isolation.
**Delivers:** New Robustness dimension live in DIMENSIONS; perturbation-critic agent
definition with clear methodology boundaries; SCORING-CALIBRATION.md Robustness ceiling
rules and calibration scenarios; EVALUATION-TEMPLATE.md updated; 4-dimension test coverage
added to test-appdev-cli.mjs.
**Addresses (from FEATURES.md):** Perturbation-critic agent definition, DIMENSIONS update,
scoring calibration.
**Avoids:** Pitfall 5 (Robustness score inflation/deflation -- write calibration scenarios
before first use); Pitfall 2 (scope overlap -- define methodology boundaries in agent
instructions).

### Phase 2: Convergence Logic Hardening

**Rationale:** Depends on DIMENSIONS being stable (Phase 1). The convergence changes are
internal to appdev-cli.mjs with no orchestrator or agent dependencies. They should land
before Phase 3 (orchestrator integration) so the end-to-end loop uses correct thresholds
from the first real test run.
**Delivers:** computeEscalation() with dimension-count-scaled plateau and crisis thresholds;
per-dimension status in round-complete output; enriched get-trajectory with per-dimension
scores; tests verifying scaled threshold behavior.
**Addresses (from FEATURES.md):** EMA-smoothed trajectory (or simpler scaled threshold as
minimum viable fix), per-dimension tracking, z-score anomaly detection (additive, no exit
impact).
**Avoids:** Pitfall 1 (magic numbers wrong with 4 dims -- the primary critical pitfall).

### Phase 3: Orchestrator Integration

**Rationale:** Depends on Phase 1 (perturbation-critic agent must exist before SKILL.md
references it). The `spawn-all-critics` rename must happen atomically across appdev-cli.mjs
and SKILL.md. This is the highest-coordination phase because the orchestrator is the central
workflow definition.
**Delivers:** SKILL.md updated for 3-critic spawn/check/retry/resume; spawn-both-critics
renamed to spawn-all-critics in both CLI and orchestrator; architecture section updated from
4 to 5 agents; SAFETY_CAP wrap-up round includes perturbation-critic; empirical concurrency
limit test result documented.
**Addresses (from FEATURES.md):** 3-critic orchestration, resume-check generalization,
error recovery for N critics.
**Avoids:** Pitfall 3 (resume-check rename -- atomic change, test verifying new action
string); Pitfall 4 (concurrency -- empirical test with fallback to 2+1 sequential).

### Phase 4: Enhanced Existing Critics

**Rationale:** Independent of Phases 1-3. Could run in parallel with Phases 2-3 but
ordered sequentially to avoid concurrent edits to critic agent files. Lowest-risk phase:
instruction-level additions only, no contract changes, no dimension renames.
**Delivers:** Perceptual-critic with cross-page color/typography consistency methodology;
projection-critic with A->B->A navigation test patterns and elevated data persistence
coverage; SCORING-CALIBRATION.md Visual Design scenarios updated for expanded scope.
**Addresses (from FEATURES.md):** Cross-page visual consistency (perceptual), A->B->A
navigation (projection), data persistence test elevation.
**Avoids:** Pitfall 6 (Visual Design calibration gap -- update scenarios alongside
methodology expansion).

### Phase 5: Generator Improvements

**Rationale:** Fully independent of evaluation pipeline changes. Generator operates on
the build side of the GAN information barrier; it never reads critic agent definitions
or CLI scoring logic.
**Delivers:** Browser-agnostic LanguageModel guidance (Chrome + Edge, with graceful
degradation); Vite+ skill updated to official `vp` CLI workflow (`vp create`, `vp check`,
`vp test`, `vp build`); dependency freshness diagnostic step.
**Addresses (from FEATURES.md):** Browser-agnostic LanguageModel, Vite+ adoption refresh,
dependency freshness.
**Avoids:** Pitfall 7 (LanguageModel browser lock-in -- guidance must include graceful
degradation, not just feature detection); Pitfall 9 (Vite+ too aggressive -- keep
compatibility escape hatch for Angular/Nuxt).

### Phase 6: Architecture Documentation

**Rationale:** Fully independent. Pure documentation deliverable. Ordered last so the
document can accurately reflect the shipped v1.2 architecture rather than the planned one.
**Delivers:** `references/architecture-principles.md` grounding the plugin design in GAN
principles (Generator/Discriminator separation, convergence detection, information
barrier), Cybernetics (damping principle, requisite variety, feedback loop), and Turing
test framing (critic as interrogator, product surface as evaluation boundary). Principles-
focused (not implementation-specific) to resist staleness.
**Addresses (from FEATURES.md):** Architecture documentation milestone requirement.
**Avoids:** Pitfall 8 (staleness -- document principles, not file paths or dimension
names).

### Phase Ordering Rationale

- Phase 1 is the only true sequencing gate: DIMENSIONS constant feeds every scoring
  consumer. Nothing else can be built or reliably tested until it is stable.
- Phase 2 before Phase 3 ensures the first real 3-critic evaluation uses correct
  convergence logic (not magic numbers calibrated for 3 dimensions).
- Phase 3 closes the integration: orchestrator, CLI, and perturbation-critic agent all
  reference each other. Must be a coordinated update.
- Phases 4, 5, 6 have no dependencies on each other or on Phases 2-3 (beyond Phase 1's
  DIMENSIONS stability). They can execute in any order or in parallel if separate
  contributors are available.
- The anti-features (per-dimension exits, automated test generation, source code metrics
  for Robustness) are explicitly excluded to preserve architectural integrity.

### Research Flags

Phases needing deeper research or empirical validation during execution:

- **Phase 2:** Convergence threshold calibration -- the `5% of max total` plateau threshold
  is a starting point derived from GAN training literature; real-world validation with the
  Dutch art museum prompt is needed. Run at least 3 test scenarios and compare exit
  conditions under the new vs old thresholds before hardening.
- **Phase 3:** 3-critic parallelism -- Claude Code's Agent tool concurrency limit with 3
  simultaneous spawns is empirically untested. This needs a quick test harness (spawn 3
  lightweight agents in parallel) before committing to the architecture. If the limit is 2,
  the fallback (2+1 sequential) must be documented in SKILL.md for future maintainers.
- **Phase 1:** Robustness scoring calibration -- no prior Robustness scores exist. The
  ceiling rules reduce subjective variance but the threshold (6) and relative score
  distribution are untested. Plan for threshold adjustment after the first 2-3 end-to-end
  runs.

Phases with well-documented patterns (skip additional research):

- **Phase 1** (DIMENSIONS + agent definition): The DIMENSIONS constant pattern and critic
  agent structure are fully established. The perturbation-critic follows the same template
  as perceptual-critic and projection-critic. Calibration scenarios follow the same format
  as existing SCORING-CALIBRATION.md content.
- **Phase 4** (enhanced critics): Instruction-level additions to existing agents. The
  cross-page consistency methodology and A->B->A navigation patterns are well-documented
  in the Playwright ecosystem. No novel patterns required.
- **Phase 5** (generator): LanguageModel API is documented by both Chrome and Edge teams;
  the W3C spec is stable. Vite+ is documented by VoidZero. No research gaps.
- **Phase 6** (architecture docs): Documentation authoring. GAN, Cybernetics, and Turing
  test principles are well-established reference material.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; verified by direct codebase inspection of 1525-line CLI and all 4 agent definitions; all import statements confirmed |
| Features | MEDIUM | Table-stakes features (P1) are grounded in Dutch art museum test failures and direct codebase gaps -- HIGH confidence. P2 features (Vite+, z-score, LLM adversarial) are based on cross-domain synthesis with no single authoritative source -- MEDIUM |
| Architecture | HIGH | Based on direct analysis of appdev-cli.mjs (1525 lines), SKILL.md (556 lines), and all 30 shipped plugin files; extensibility test explicitly verifies N-critic auto-discovery |
| Pitfalls | HIGH | All 9 pitfalls derived from reading actual code paths: escalation math (lines 257-306), resume dispatch (lines 725-818), DIMENSIONS constant (lines 14-18), critic methodology files |

**Overall confidence:** HIGH

### Gaps to Address

- **3-critic parallel concurrency limit:** The most significant unresolved question.
  Strategy: empirical test in Phase 3 before committing to pure parallel spawn. Document
  the result in SKILL.md regardless of outcome.
- **Robustness score distribution:** No prior data exists. Strategy: run the perturbation-
  critic on 3+ diverse test prompts after Phase 1 ships, collect scores, adjust threshold
  in SCORING-CALIBRATION.md before the broader v1.2 milestone is considered complete.
- **Convergence threshold validation:** The 5% plateau threshold is theoretically derived.
  Strategy: compare exit conditions under new vs old thresholds on the Dutch art museum
  prompt replay. Flag as a verification step in Phase 2.
- **Vite+ alpha stability:** Vite+ is in alpha as of March 2026. Strategy: keep the plain
  Vite fallback clause in generator.md; do not remove it in Phase 5 even if Vite+ guidance
  is strengthened. The escape hatch is not optional.

## Sources

### Primary (HIGH confidence -- direct codebase analysis)

- `plugins/application-dev/scripts/appdev-cli.mjs` (1525 lines) -- DIMENSIONS constant,
  computeEscalation(), computeVerdict(), cmdResumeCheck(), cmdCompileEvaluation()
- `plugins/application-dev/scripts/test-appdev-cli.mjs` (1331 lines) -- extensibility test
  (lines 510-555: N-critic auto-discovery verified)
- `plugins/application-dev/skills/application-dev/SKILL.md` (556 lines) -- orchestrator
  evaluation phase, resume dispatch table, error recovery
- All 4 agent definitions (planner.md, generator.md, perceptual-critic.md,
  projection-critic.md) -- tool allowlists, methodology, information barrier enforcement
- `references/evaluator/SCORING-CALIBRATION.md` (198 lines) -- ceiling rules, scenarios
- `references/evaluator/EVALUATION-TEMPLATE.md` (71 lines) -- regex-sensitive template

### Secondary (HIGH confidence -- official documentation)

- [W3C Prompt API](https://github.com/webmachinelearning/prompt-api) -- LanguageModel
  standard interface
- [Edge Prompt API (Microsoft Learn)](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api)
  -- Edge 139+ Phi-4-mini support
- [Vite+ Alpha Announcement (VoidZero)](https://voidzero.dev/posts/announcing-vite-plus-alpha)
  -- `vp` CLI, unified toolchain
- [Google: GAN Training](https://developers.google.com/machine-learning/gan/training) --
  convergence detection, discriminator dynamics
- [EWMA for Change Detection (PMC, 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10248291/)
  -- plateau detection in longitudinal data

### Secondary (MEDIUM confidence -- community sources)

- [Adversarial LLM UI Tester (SitePoint, 2025)](https://www.sitepoint.com/playwright-llm-building-an-adversarial-ui-logic-tester/)
  -- perturbation-critic interaction design
- [AI-Powered UI Fuzzing (BetaCraft, 2025)](https://betacraft.com/2025-06-10-ai-powered-ui-testing/)
  -- LLM-driven fuzz testing patterns
- [GAN Convergence Challenges (Springer, 2025)](https://link.springer.com/article/10.1007/s44354-025-00007-w)
  -- mode collapse, instability taxonomy
- [Chromatic Visual Testing](https://www.chromatic.com/solutions/design-systems) --
  cross-page visual consistency reference point

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
