# Research Summary: v1.2 Integration Architecture

**Domain:** GAN-inspired autonomous application development plugin -- v1.2 feature integration
**Researched:** 2026-04-02
**Overall confidence:** HIGH

## Executive Summary

The v1.2 features integrate cleanly with the existing v1.1 ensemble architecture because the v1.1 design was explicitly built for N-critic extensibility. The `compile-evaluation` subcommand auto-discovers `*/summary.json` directories, the `extractScores()` regex is dynamically built from the DIMENSIONS constant, and the `resume-check` logic reads expected critics from state rather than hardcoding names. Adding a perturbation-critic is a single-point change to the DIMENSIONS constant plus a new agent definition file -- no discovery logic changes, no regex manual updates, no compile-evaluation restructuring.

The convergence logic hardening is the most architecturally sensitive change because it modifies escalation thresholds that affect exit conditions. The current hardcoded magic numbers (`<= 1` for plateau, `<= 5` for crisis) were calibrated for 3 dimensions (max total 30). With 4 dimensions (max total 40), these thresholds need to scale. The recommendation is to derive all thresholds from `DIMENSIONS.length * 10`, making the convergence logic dimension-count-agnostic.

The enhanced critic dimensions (cross-page visual consistency expanding Visual Design scope, deeper navigation testing for Functionality) are instruction-level changes to existing critic agent definitions -- no contract changes, no renaming, no regex updates. This is the lowest-risk category of changes.

The architecture documentation is a new reference file that sits alongside existing reference files in the plugin's `references/` directory. It is loaded on demand, not injected into every agent context, following the progressive disclosure pattern established in v1.0.

## Key Findings

**Stack:** No new npm dependencies. DIMENSIONS constant is the single source of truth for scoring dimensions and thresholds. All consumers (extractScores, computeVerdict, computeEscalation, compileEvaluation) derive their behavior from DIMENSIONS via loops, not hardcoding.

**Architecture:** The v1.1 ensemble architecture is N-critic extensible by design. Adding perturbation-critic requires: (1) one entry in DIMENSIONS constant, (2) one agent definition file, (3) orchestrator spawn/check/retry updates in SKILL.md, (4) one entry in compile-evaluation's assessmentSections array.

**Critical pitfall:** Hardcoded magic numbers in convergence logic (plateau threshold `<= 1`, crisis threshold `<= 5`) will produce incorrect escalation levels when dimension count changes from 3 to 4. Must scale with `DIMENSIONS.length * 10`.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Scoring Foundation + Perturbation Critic** - DIMENSIONS constant change is the foundation; perturbation-critic is its primary consumer
   - Addresses: New Robustness dimension, perturbation-critic agent, scoring calibration
   - Avoids: Multi-phase DIMENSIONS instability

2. **Convergence Logic Hardening** - Depends on DIMENSIONS being stable
   - Addresses: Scaled plateau/crisis thresholds, per-dimension trajectory output
   - Avoids: False plateau detection with 4 dimensions

3. **Orchestrator Integration** - Depends on perturbation-critic agent existing
   - Addresses: 3-critic spawn sequence, resume-check generalization, error recovery
   - Avoids: Orchestrator changes before agent is ready

4. **Enhanced Existing Critics** - Independent, can parallel with Phases 2-3
   - Addresses: Visual Coherence (cross-page consistency), deeper Functionality (A->B->A navigation)
   - Avoids: Concurrent edits to critic agent files with Phase 1

5. **Generator Improvements** - Fully independent
   - Addresses: Vite+ adoption, dependency freshness, browser-agnostic LanguageModel
   - Avoids: No dependency constraints

6. **Architecture Documentation** - Fully independent
   - Addresses: GAN/Cybernetics/Turing test grounding document
   - Avoids: No dependency constraints

**Phase ordering rationale:**
- Phase 1 must be first because DIMENSIONS constant is consumed by all downstream phases
- Phase 2 depends on Phase 1 (stable DIMENSIONS for scaled thresholds)
- Phase 3 depends on Phase 1 (perturbation-critic agent must exist before orchestrator references it)
- Phases 4, 5, 6 are independent and can run in any order or in parallel

**Research flags for phases:**
- Phase 1: Standard patterns -- DIMENSIONS constant change is well-understood, agent definition follows established template
- Phase 2: Needs careful testing -- threshold scaling changes convergence behavior; existing tests verify current behavior
- Phase 3: Medium complexity -- orchestrator is the central coordination point; resume-check naming change affects crash recovery
- Phase 4-6: Standard patterns, unlikely to need additional research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; all patterns established in v1.1 |
| Features | HIGH | All v1.2 features map to specific integration points identified in codebase |
| Architecture | HIGH | Based on direct analysis of 1525-line CLI, 556-line orchestrator, 4 agent definitions |
| Pitfalls | HIGH | Derived from reading actual code paths: regex construction, escalation math, resume-check dispatch |

## Gaps to Address

- **Perturbation testing techniques**: The specific adversarial testing methodology for the perturbation-critic (network throttling, JavaScript disabled, etc.) may need phase-specific research on Playwright capabilities for those scenarios. The playwright-cli tool's support for network simulation and JS disabled mode should be verified.
- **Convergence threshold calibration**: The 5% plateau threshold is a starting point. Real-world testing with the Dutch art museum prompt (and others) is needed to validate it does not trigger false plateaus or miss real stagnation.
- **3-critic parallelism**: While each critic runs in isolated context, spawning 3 Agent() calls simultaneously may have platform-level concurrency limits in Claude Code. This should be verified empirically.
