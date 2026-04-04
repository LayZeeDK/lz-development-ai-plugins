# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 -- application-dev Plugin v1 Hardening

**Shipped:** 2026-03-29
**Phases:** 6 | **Plans:** 15 | **Sessions:** 7

### What Was Built
- Delegation-only orchestrator with two-layer enforcement and resumable workflow state
- Score-based convergence loop with 4 exit conditions and escalation vocabulary
- Git version control throughout the GAN loop (commits, tags, rollback)
- Adversarial evaluator with 15-step workflow, scoring calibration, AI probing, asset validation
- Hardened generator with progressive CI, testing framework, asset pipeline, 6 bundled skills
- Optimized agent definitions with progressive disclosure and WHY-based rationale

### What Worked
- GAN-first design thinking: framing every decision through "what do GAN principles tell us?" kept the architecture coherent across 6 phases
- Research-before-planning pattern: web research on AI evaluation, prompt engineering, and asset validation produced concrete reference files that agents load at runtime
- Template extraction (Phase 02.1) as urgent insertion: catching format drift early prevented cascading issues in later phases
- Two-layer enforcement design: cheaper than four-layer hooks design, still provides defense-in-depth
- Coarse phase granularity (4 planned + 2 inserted vs. research's 6 suggestions): fewer phases meant less context switching and faster throughput
- TDD for check-assets (Phase 4 Plan 3): 7 tests written before implementation, caught soft-404 edge cases early

### What Was Inefficient
- Phase 5 (optimization) could have been folded into each phase's final commit rather than a separate pass -- two rewrites of evaluator.md (Phase 3 then Phase 5)
- Self-Verification duplication in Phase 3 evaluator rewrite was caught and fixed in Phase 5 -- should have been caught in Phase 3 review
- LOOP-06 requirement tracking: marked Complete in Phase 2 REQUIREMENTS.md but actually deferred to Phase 3 -- discovered during audit
- Nyquist VALIDATION.md files for 5 phases were left in draft status and had to be retroactively filled

### Patterns Established
- Two-layer enforcement: tool allowlists (structural) + prompt guards (behavioral) for per-agent role boundaries
- File-based agent communication: SPEC.md, EVALUATION.md, ASSETS.md -- no in-memory state between agents
- Progressive disclosure threshold: ~30 lines + single-step-relevance triggers extraction to reference file
- WHY-based rationale over ALL-CAPS emphasis in agent instructions
- GAN ubiquitous language: "evaluation" not "QA", "round" not "iteration", "generation" not "build"
- Score extraction regex contract: HTML comments in templates mark parsed sections for maintainability

### Key Lessons
1. Audit catches real issues: the integration checker found a REGRESSION tagging gap, a regex collision risk, and missing allowed-tools patterns -- all fixed before shipping
2. Template extraction pays for itself immediately: SPEC-TEMPLATE.md and EVALUATION-TEMPLATE.md eliminated format drift that was causing appdev-cli parse failures
3. Research-driven reference files are load-bearing: SCORING-CALIBRATION.md (12 scenarios) and AI-PROBING-REFERENCE.md (10 probes + 10 Turing test concepts) give the Evaluator concrete anchors instead of vague "be strict" instructions
4. Progressive disclosure works at the agent instruction level: extracting 42-line AI Slop Checklist and 48-line Asset Validation Protocol to reference files reduced evaluator.md by 16% without losing capabilities

### Cost Observations
- Model mix: ~60% sonnet (execution, verification), ~30% opus (planning, research, audit), ~10% haiku (web fetch)
- Sessions: 7 sessions over 4 days
- Notable: Phase 02.1 (template extraction) was the fastest phase -- 1 plan, 3 min execution, high impact

---

## Milestone: v1.1 -- Ensemble Discriminator + Crash Recovery

**Shipped:** 2026-04-02
**Phases:** 4 | **Plans:** 11 | **Sessions:** ~5

### What Was Built
- GAN ensemble architecture: monolithic Evaluator replaced by 2 WGAN critics (perceptual-critic + projection-critic) + deterministic CLI aggregator (compile-evaluation)
- Behavioral acceptance criteria in SPEC-TEMPLATE.md with tier minimums and dedicated acceptance-criteria-guide.md
- PLAYWRIGHT-EVALUATION.md shared reference with 7 token-efficient browser evaluation techniques (eval-first, write-and-run, snapshot-as-fallback)
- Crash recovery: resume-check detects 4 recovery states from artifacts + state JSON; static production build serving via static-serve
- Audit gap closure: 4 integration bugs fixed, stale artifacts cleaned, 14 orphaned Phase 7 requirements verified via Phase 10

### What Worked
- Ensemble decomposition solved the core problem: session crashes from context exhaustion eliminated by isolating each critic to ~60K tokens
- TDD for CLI subcommands (Phase 7 Plan 01, Phase 9 Plan 01): 57 tests total, caught edge cases in resume-check corrupt artifact handling and install-dep mutex timing
- GAN information barrier as architectural constraint: two-layer enforcement (tool allowlists + prompt guards) gave critics structural inability to cheat, not just instructions not to
- Write-and-run pattern for token efficiency: ~5 tool calls replacing ~30+ interactive browser calls, proven by both critics
- Milestone audit as quality gate: revision 1 found 14 gaps, Phase 10 created to close them, revision 4 confirmed 34/34 satisfied -- audit drove real work, not just reporting
- Phase 10 as audit gap closure: creating a dedicated phase to fix audit-discovered issues was more systematic than ad-hoc patches

### What Was Inefficient
- Phase 7 never ran gsd-verifier: 14 requirements were orphaned until Phase 10 retroactively verified them -- always run verification before closing a phase
- Milestone audit required 4 revisions: revisions 1-2 found real gaps, revision 3 found doc issues (plugin.json description, dead cross-reference), revision 4 finally passed -- earlier self-review of docs would have saved a round
- Phase 9 discuss-phase was interrupted by dev server issues: half the discussion session spent debugging rather than planning
- SUMMARY.md files lacked one_liner fields: the milestone complete workflow expected them for auto-extraction but they were never populated -- manual extraction needed

### Patterns Established
- Ensemble evaluation: parallel critic spawning with independent contexts, binary file-exists completion checks, CLI deterministic aggregation
- Summary.json as extensible contract: any `evaluation/round-N/*/summary.json` auto-consumed by compile-evaluation -- zero CLI changes needed for new critics
- Four-branch resume dispatch: no-prompt+state auto-resumes, prompt+state asks user, prompt+no-state starts fresh, no-prompt+no-state errors
- Static production builds as evaluation target: Generator builds, static-serve hosts, critics evaluate, orchestrator stops between rounds
- Audit-driven gap closure phases: when milestone audit finds gaps, create a phase to fix them rather than patching in place

### Key Lessons
1. Always run gsd-verifier after phase execution -- orphaned requirements waste audit cycles and create unnecessary gap-closure phases
2. Write-and-run is the token efficiency breakthrough: replacing interactive browser sessions with batched test execution saves ~80% of critic tool calls
3. Deterministic CLI for scoring math (Anthropic "separate grading from gating" pattern) eliminates LLM scoring bias entirely -- Product Depth is now fully reproducible
4. Milestone audit revisions are valuable: each revision found real issues (integration bugs, doc staleness, verification gaps) that would have shipped to users
5. SUMMARY.md one_liner fields should be populated during execution, not expected at archival time

### Cost Observations
- Model mix: ~55% sonnet (execution, verification), ~35% opus (planning, audit, discuss-phase), ~10% haiku (web fetch, summary)
- Sessions: ~5 sessions over 3 days
- Notable: Phase 10 (audit gap closure) was 2 plans but closed 14 orphaned requirements and 4 integration bugs -- high leverage from audit-driven work

---

## Milestone: v1.2 -- Dutch Art Museum Test Fixes

**Shipped:** 2026-04-04
**Phases:** 6 | **Plans:** 11 | **Sessions:** ~4

### What Was Built
- Perturbation-critic agent with chaos engineering methodology for Robustness dimension (4-dimension scoring)
- EMA-smoothed convergence detection with scaled thresholds derived from DIMENSIONS.length and dual-path signal architecture
- N-critic orchestrator integration: 3-critic parallel spawn, generalized resume-check (spawn-all-critics), per-critic retry
- Enhanced perceptual-critic with cross-page visual consistency audit (design token extraction, fingerprinting)
- Enhanced projection-critic with A->B->A round-trip navigation tests and state persistence verification
- Browser-built-in-ai meta-skill with 7-API decision tree routing replacing single-API browser-prompt-api
- Vite+ skill refreshed to v0.1.15 with vp CLI workflow and compatibility escape hatch
- Architecture documentation grounded in GAN, Cybernetics, and Turing test principles (principles-only, no implementation details)

### What Worked
- Phase dependency structure (3 sequential + 3 independent) allowed parallel execution of Phases 14-16 after the foundation was set
- DIMENSIONS constant as single source of truth continued to pay off: adding Robustness auto-propagated to all CLI subcommands
- Principles-only approach for ARCHITECTURE.md: documenting GAN/Cybernetics/Turing test principles rather than file paths means the doc survives milestone changes
- Milestone audit as pre-completion gate: audit found 4 stale text references ("both critics" -> "all critics") that would have shipped
- Browser-built-in-ai meta-skill design: 7-API routing SKILL.md + 5 reference files, loaded on demand, stays within plugin context budget
- Calibration-before-use pattern: writing Robustness ceiling rules and calibration scenarios before the first real evaluation run anchored scoring

### What Was Inefficient
- Phase 16 (docs) was purely documentation with no code -- manual-only validation strategy was appropriate but the Nyquist auditor still flagged it as "partial"
- 15-02-SUMMARY.md lacked one_liner field -- same issue as v1.1, still not enforced by tooling
- Phase 12-13 plan checkboxes in ROADMAP.md were left unchecked despite being complete -- cosmetic but creates confusion during audits
- Worktree merge conflicts in Phase 15 required manual resolution when parallel plans modified overlapping files

### Patterns Established
- Dual-path signal architecture: safety-critical decisions (E-IV crisis, PASS) use raw scores, trend decisions (E-0 through E-II) use EMA-smoothed scores
- Schmitt trigger hysteresis: asymmetric thresholds (2.5% entry vs 5% exit) prevent oscillation at convergence boundaries
- N-critic generalization: resume-check threshold (>=2 invalid -> spawn-all) and per-critic retry scale to any number of critics
- Meta-skill pattern: routing SKILL.md with decision tree + reference files loaded on demand for multiple related APIs
- Principles-only documentation: document design principles, not implementation details, for staleness resistance

### Key Lessons
1. Milestone audit catches real staleness: 4 "both critics" references survived all phase verifications but were caught by the audit -- always audit before shipping
2. N-critic generalization pays forward: Phase 13's generalized resume-check and retry logic means v2.0 critics (semantic, accessibility) require zero orchestrator changes
3. EMA smoothing needs empirical calibration: alpha=0.4 was chosen from ISA-18.2 standards but real score distributions from test runs will validate or adjust
4. Meta-skill pattern is the right abstraction for related APIs: browser-built-in-ai's 7-API routing is cleaner than 7 separate skills
5. Worktree parallelization has merge conflict risk: disable for phases where plans modify overlapping files

### Cost Observations
- Model mix: ~50% opus (quality profile), ~40% sonnet (execution), ~10% haiku (web fetch)
- Sessions: ~4 sessions over 2 days (faster than v1.0/v1.1 due to smaller scope per phase)
- Notable: Phase 11 (foundation) was the highest-leverage phase -- DIMENSIONS constant extension auto-propagated to 6+ CLI subcommands

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 7 | 6 | Established GAN architecture, two-layer enforcement, research-before-planning |
| v1.1 | ~5 | 4 | Ensemble decomposition, TDD for CLI, audit-driven gap closure phases |
| v1.2 | ~4 | 6 | N-critic generalization, EMA convergence, dual-path signals, meta-skill pattern |

### Cumulative Quality

| Milestone | Tests | Plugin LOC | Requirements |
|-----------|-------|------------|--------------|
| v1.0 | 7 (check-assets) + 37 (Nyquist) | 5,881 | 43/43 |
| v1.1 | 57 (CLI + Nyquist) | 8,188 | 34/34 |
| v1.2 | 57 (CLI + Nyquist) | 9,861 | 22/22 |

### Top Lessons (Verified Across Milestones)

1. Research before designing -- web search for best practices produces concrete artifacts, not vague guidance
2. Audit before shipping -- integration checkers find real wiring bugs that phase-level verification misses (v1.2: 4 stale "both critics" references caught by audit)
3. Always run gsd-verifier after phase execution -- orphaned requirements create unnecessary audit revisions and gap-closure phases (v1.1: 14 orphaned reqs from Phase 7)
4. TDD for CLI subcommands -- 57 tests caught edge cases in resume-check, install-dep mutex, and static-serve that interactive testing would miss
5. Single source of truth constants (DIMENSIONS) auto-propagate changes -- adding Robustness in v1.2 required zero manual updates to CLI subcommands
6. Populate SUMMARY.md one_liner fields during execution -- missing in both v1.1 and v1.2, still not enforced by tooling
