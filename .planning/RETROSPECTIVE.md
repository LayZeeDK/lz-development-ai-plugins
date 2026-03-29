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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 7 | 6 | Established GAN architecture, two-layer enforcement, research-before-planning |

### Cumulative Quality

| Milestone | Tests | Plugin LOC | Requirements |
|-----------|-------|------------|--------------|
| v1.0 | 7 (check-assets) + 37 (Nyquist) | 5,881 | 43/43 |

### Top Lessons (Verified Across Milestones)

1. Research before designing -- web search for best practices produces concrete artifacts, not vague guidance
2. Audit before shipping -- integration checkers find real wiring bugs that phase-level verification misses
