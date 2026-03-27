# Project Research Summary

**Project:** application-dev plugin v1 hardening
**Domain:** GAN-inspired multi-agent autonomous application development harness (Claude Code plugin)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

The application-dev plugin is a three-agent adversarial loop -- Planner, Generator, Evaluator -- orchestrated by a Claude Code skill, that builds complete web applications from short natural-language prompts. The architecture maps GAN principles onto the software development lifecycle: the Generator produces code, the Evaluator judges it through live Playwright-based browser testing, and the orchestrator loops until quality converges. This pattern is validated by both the Anthropic engineering article ("Harness design for long-running apps") and the independent Claude Forge implementation, and is reinforced by cybernetics research (Ralph Loop / Viable System Model) which confirms the externalized comparator as the correct control architecture. The "stack" is the Claude Code plugin system itself -- markdown files with YAML frontmatter, no build step, no runtime dependencies beyond playwright-cli.

The recommended approach for v1 hardening is to fix six directly-observed pain points in priority order: (1) add git version control throughout the workflow, (2) replace fixed round counts with score-based exit using plateau detection, (3) enforce strict orchestrator delegation-only behavior, (4) harden the Evaluator with adversarial asset validation and AI feature probing, (5) add a Generator CI inner loop, and (6) audit and tighten tool allowlists per agent role. These map cleanly to a six-phase implementation with clear dependency ordering. The cybernetics research contributes an escalation vocabulary (E-0 through E-IV) for structured exit decisions, a damping principle that constrains Generator scope in rounds 2+, and a feature count watchdog to catch scope-gaming.

The key risks are Evaluator leniency drift (LLM self-preference bias causing inflated scores and premature PASS), orchestrator role collapse (the orchestrator falling back to doing agent work when delegation fails), and tool restriction enforcement gaps (the plugin security model cannot use hooks, so prompt-level guards are the primary defense). All three are directly observed in testing and documented in the Anthropic article. Mitigation requires a combination of structural enforcement (tool allowlists), prompt engineering (calibration examples, anti-leniency phrasing), and architectural discipline (file-based communication, fresh context per agent spawn). The cybernetics corpus adds oscillation and overbaking as medium-risk failure modes addressable through score trajectory monitoring and Generator scope constraints.

## Key Findings

### Recommended Stack

The plugin operates entirely within Claude Code's plugin component system. There is no build step, no package.json, and no runtime dependencies except playwright-cli for the Evaluator. The "stack" is markdown files organized by convention: agents in `agents/`, skills in `skills/`, commands in `commands/`, manifest in `.claude-plugin/plugin.json`.

**Core technologies:**
- Claude Code Plugin System (1.0.33+): plugin runtime -- the only framework; auto-discovers agents, skills, commands by directory convention
- YAML Frontmatter: declarative agent/skill metadata (name, tools, model, maxTurns) -- how Claude Code reads component definitions
- Markdown: system prompts and instructions -- agent body = system prompt, skill body = orchestration logic
- playwright-cli: browser-based QA testing -- the Evaluator's primary tool for navigating, interacting, screenshotting the running application

**Critical stack decisions for v1:**
- Add `skills` frontmatter to Generator agent to preload browser-* skills (subagents do NOT inherit skills from parent)
- Add `maxTurns` to all agents to prevent runaway execution
- Add `Bash` to orchestrator `allowed-tools` if the orchestrator handles git tags (or delegate tagging to agents)
- Keep all agents at `model: inherit` -- let users choose their model

### Expected Features

**Must have (table stakes):**
- Working application output -- the entire point; broken apps are worse than useless
- Score-based exit with convergence detection -- every serious harness uses conditional looping, not fixed rounds
- Adversarial evaluation with real browser testing -- core differentiator of the GAN architecture
- Git version control throughout -- commits at planning, per-feature, per-QA-round, with milestone tags
- Real assets, not placeholders or stolen content -- images that load, are licensed, have attribution
- Functional AI features, not canned keyword-matching responses
- Orchestrator role integrity -- delegate only, never fall back to coding
- QA report versioning per round (qa/round-N/ folders)
- Generator self-testing before QA handoff (CI inner loop)
- Planner produces committed SPEC.md

**Should have (differentiators):**
- Evaluator asset validation (broken images, CORS, stolen content detection)
- Evaluator adversarial AI probing (varied inputs, nonsense queries, semantic probes)
- Browser-local AI guidance (Prompt API, WebLLM, WebNN skills -- already bundled)
- Feature-by-feature commits from Generator
- Tool allowlists per agent role enforcing GAN separation
- Vite+ skill for faster Generator inner loop (optional preference, not mandate)

**Defer (v2+):**
- Budget/balanced/quality profiles -- fix quality first, then offer tradeoffs
- Sprint-based decomposition -- Opus 4.6 handles long coherent sessions; sprints add complexity
- Chrome DevTools MCP / browser-agent integration -- improve basic Evaluator first
- Accessibility compliance and Web Core Vitals -- valuable but dilutes v1 focus
- Static production build requirement -- dev server output is acceptable for v1

### Architecture Approach

The system is a three-component adversarial loop: Orchestrator (SKILL.md) spawns Planner, Generator, and Evaluator as subagents in sequence. Agents communicate exclusively through files (SPEC.md, QA-REPORT.md, qa/round-N/ artifacts). Each subagent gets fresh context on spawn, preventing inherited blind spots. The orchestrator follows a deterministic state machine: INIT -> PLANNING -> BUILDING -> EVALUATING -> DECISION -> (loop or SUMMARY). The cybernetics research validates this as a negative feedback system with an externalized comparator, and recommends augmenting the exit decision with a named escalation vocabulary (E-0 Normal through E-IV Catastrophic).

**Major components:**
1. Orchestrator (SKILL.md) -- spawn agents, read output files, loop control with score-based convergence detection, milestone tagging
2. Planner (agents/planner.md) -- expand 1-4 sentence prompt into ambitious SPEC.md with testable acceptance criteria, commit spec
3. Generator (agents/generator.md) -- build/fix application from SPEC.md and QA-REPORT.md, run CI inner loop, commit feature-by-feature
4. Evaluator (agents/evaluator.md) -- test running app via Playwright, grade against multi-criterion rubric, write versioned QA reports, adversarially probe assets and AI features

**Key architectural patterns:**
- File-based agent communication (GAN principle: discriminator sees only output, not generator internals)
- Score-based exit with plateau detection (cybernetics principle: stop at negative feedback convergence)
- Inner feedback loop (Generator CI) + outer feedback loop (Evaluator QA) -- multi-layered backpressure
- Pure coordinator orchestrator (no agent work, no context leaking)
- Generator scope constraint in rounds 2+ (cybernetics damping principle)

### Critical Pitfalls

1. **Evaluator leniency drift** -- LLM self-preference bias causes inflated scores and premature PASS. Mitigate with few-shot calibration examples, anti-leniency phrasing, mandatory bug-finding before scoring, and score anchoring to rubric descriptors. Highest-leverage single intervention for v1.

2. **Orchestrator role collapse** -- when agents fail, the orchestrator does the work itself, destroying GAN separation. Mitigate with explicit "error out, never fall back" instructions, retry logic (2 attempts), and tool restriction (no Write/Edit/Bash on orchestrator).

3. **Canned AI features** -- Generator implements keyword-matching if/else chains instead of real browser-local AI. Mitigate with Evaluator adversarial probing (varied inputs, nonsense, semantic similarity checking) and Generator guidance toward browser-* skills.

4. **Broken/stolen assets** -- Generator uses external URLs that are CORS-blocked, hotlink-protected, or copyrighted. Mitigate with Evaluator asset validation (check rendering, check for external domains, check attribution) and Generator guidance toward self-hosted/generated assets.

5. **Early stopping** -- loop terminates after 1-2 rounds despite unresolved issues, due to context anxiety, lenient scores, or fixed round cap. Mitigate with score-based exit, plateau detection (3-round window), minimum 2-round requirement, and 10-round safety cap.

6. **Tool restriction enforcement gaps** -- plugin agents cannot use hooks for fine-grained access control; `allowed-tools` enforcement may be inconsistent across Claude Code versions. Mitigate with belt-and-suspenders: `tools` allowlist + `disallowedTools` denylist + explicit prompt-level "you cannot use X" instructions.

### Cybernetics / Ralph Loop Contributions

The supplementary Ralph Loop research validates the core architecture and adds five actionable patterns:

1. **Escalation vocabulary (E-0 through E-IV)** -- structured exit decision framework replacing ad hoc verdict checking
2. **Score trajectory tracking** -- orchestrator monitors score history for plateau, oscillation, and regression patterns
3. **Feature count watchdog** -- detect when Generator games scores by removing hard-to-implement features
4. **Generator scope constraint in rounds 2+** -- damping mechanism: fix only what QA flagged, do not add features or refactor working code
5. **Context loading order** -- present QA-REPORT.md before SPEC.md in rounds 2+ to prime Generator for fixing, not building

The Ralph Loop is architecturally different (monolithic single-agent, externally restarted), so its structural patterns (context rotation, autopoietic learning, guardrail generation) do NOT apply. Our harness is a GAN, not a Ralph Loop. We adopt Ralph's feedback engineering principles within our adversarial architecture.

## Implications for Roadmap

Based on combined research across all five documents, suggested six-phase structure:

### Phase 1: Foundation -- Tool Allowlists and Orchestrator Guard Rails

**Rationale:** All other improvements depend on correct role separation. If the orchestrator can fall back to coding, or the Evaluator can edit source, subsequent hardening work is undermined. This phase has zero dependencies and unblocks everything else.
**Delivers:** Audited tool allowlists per agent, explicit orchestrator delegation-only behavior, retry logic for failed agent spawns, belt-and-suspenders tool restriction (allowlist + denylist + prompt guards).
**Addresses features:** Orchestrator role integrity, tool allowlists per agent role.
**Avoids pitfalls:** Orchestrator role collapse (Pitfall 2), tool restriction gaps (Pitfall 7).
**Research depth needed:** LOW -- well-documented patterns in Claude Code docs. Standard phase.

### Phase 2: Git Strategy -- Version Control Throughout

**Rationale:** Git commits are the foundation for score-based exit (need score history), regression detection, and recovery points. Without commits, the harness cannot track progress across rounds and a crash loses all work. Depends on Phase 1 tool allowlists (Planner and Evaluator need Bash).
**Delivers:** Planner commits SPEC.md, Generator commits feature-by-feature, Evaluator commits qa/round-N/ artifacts, milestone git tags, .gitignore management.
**Addresses features:** Git version control throughout, QA report versioning, milestone tags, feature-by-feature commits, committed SPEC.md.
**Avoids pitfalls:** No git history (Pitfall 12), compaction losing state (Pitfall 10 -- git log survives compaction).
**Research depth needed:** LOW -- git workflow is well-understood. Standard phase.

### Phase 3: Score-Based Exit -- Convergence Detection and Loop Control

**Rationale:** Replaces the fixed 3-round limit that caused early stopping. Depends on Phase 2 (QA report versioning provides score history) and Phase 1 (orchestrator guard rails). The cybernetics research confirms plateau detection as the cybernetically sound termination condition.
**Delivers:** Score-based exit with four conditions (PASS, PLATEAU, REGRESSION, SAFETY CAP), escalation vocabulary (E-0 through E-IV), score trajectory tracking, plateau detection (3-round window, 1-point threshold), minimum 2-round requirement, 10-round safety cap, feature count watchdog.
**Addresses features:** Score-based exit with convergence detection.
**Avoids pitfalls:** Early stopping (Pitfall 4), regression oscillation (Pitfall 8).
**Research depth needed:** MEDIUM -- plateau threshold and oscillation detection heuristics need calibration against actual runs. Recommend `/gsd:research-phase` for tuning.

### Phase 4: Evaluator Hardening -- Adversarial Rigor

**Rationale:** The Evaluator is the externalized comparator -- the quality of the entire system depends on its rigor. Lenient evaluation is the root cause of multiple downstream failures (early stopping, canned AI passing, broken assets passing). Depends on Phase 2 (qa/ folder structure) and Phase 3 (enough rounds for adversarial testing to have impact).
**Delivers:** Asset validation (broken images, CORS, placeholder detection, attribution), AI feature adversarial probing (varied inputs, nonsense, semantic similarity), few-shot scoring calibration, anti-leniency phrasing, regression detection with feature count tracking, minimum interaction count per feature.
**Addresses features:** Adversarial evaluation, evaluator asset validation, evaluator AI probing, working application output, functional AI features.
**Avoids pitfalls:** Evaluator leniency drift (Pitfall 1), broken/stolen assets (Pitfall 5), canned AI features (Pitfall 6), surface-level QA (Pitfall 13).
**Research depth needed:** MEDIUM -- few-shot calibration examples need crafting; adversarial probing patterns need design. Recommend `/gsd:research-phase` for Evaluator prompt engineering.

### Phase 5: Generator Hardening -- CI Inner Loop and AI Feature Guidance

**Rationale:** Generator quality improvements reduce wasted QA rounds and address the two most visible user-facing failures (broken assets, fake AI). Depends on Phase 3 (iteration budget from score-based exit) and Phase 4 (Evaluator can now catch regressions, so Generator fixes are validated).
**Delivers:** CI inner loop (typecheck, build, lint before Evaluator handoff), Generator scope constraint in rounds 2+ (fix only what QA flagged), browser-* skill preloading via `skills` frontmatter, image sourcing guidance (self-host, web search with license verification, procedural generation), context loading order optimization.
**Addresses features:** Generator self-testing, working application output, functional AI features, real assets.
**Avoids pitfalls:** Regression oscillation (Pitfall 8), context window exhaustion (Pitfall 9), mode collapse (Pitfall 3), spec ambiguity cascading (Pitfall 11).
**Research depth needed:** LOW-MEDIUM -- CI inner loop patterns are well-documented; browser-* skill integration is already implemented but needs testing.

### Phase 6: Bundled Skills -- Vite+ and Browser-AI Improvements

**Rationale:** Optimization layer. Vite+ speeds up the Generator inner loop (more iterations per round = better convergence). Browser-AI skill improvements make real AI features easier for the Generator to implement. These are enhancements, not pain point fixes, so they come last.
**Delivers:** Vite+ skill (skills/vite-plus/SKILL.md), Generator preference for Vite+ in greenfield projects, browser-* skill content improvements.
**Addresses features:** Vite+ skill for faster inner loop, browser-local AI guidance.
**Avoids pitfalls:** Mode collapse (Pitfall 3 -- better skills lead to more diverse outputs).
**Research depth needed:** LOW -- Vite+ is a straightforward skill definition; browser-* skills already exist.

### Phase Ordering Rationale

- **Phase 1 before everything:** Tool allowlists and orchestrator guards are structural prerequisites. Every subsequent phase assumes correct role separation.
- **Phase 2 before Phase 3:** Score-based exit depends on versioned QA reports to track score history. Git commits also depend on tool allowlists from Phase 1.
- **Phase 3 before Phase 4:** Evaluator hardening only matters if the loop runs enough rounds. Score-based exit ensures sufficient iteration budget.
- **Phase 4 before Phase 5:** Generator improvements are validated by a hardened Evaluator. Without rigorous QA, Generator changes cannot be verified.
- **Phase 5 before Phase 6:** Core Generator hardening (CI, scope constraint) before optional optimizations (Vite+ skill).
- **Phases 1 and 2 can partially overlap:** Tool allowlists and git strategy are independent within their respective agents. However, git commits in Planner/Evaluator depend on Bash being in their tool allowlist, so Phase 1 must finalize tool lists before Phase 2 can implement commit behavior.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Score-Based Exit):** Plateau detection thresholds (<=1 point over 3 rounds) and oscillation detection heuristics need calibration against actual test runs. The cybernetics corpus provides the framework but not empirical values.
- **Phase 4 (Evaluator Hardening):** Few-shot calibration examples require careful crafting. Adversarial AI probing patterns (how to detect canned responses vs. real inference) need design work. The NeurIPS 2024 research on LLM self-preference bias informs the approach but specific prompt engineering needs experimentation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Tool allowlists and agent guards are well-documented in Claude Code official docs. Straightforward implementation.
- **Phase 2 (Git Strategy):** Git workflows are universally understood. The commit strategy is already specified in PROJECT.md.
- **Phase 6 (Bundled Skills):** Skill authoring patterns are documented and the browser-* skills already exist as templates.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official Claude Code docs (code.claude.com). Plugin component system is well-documented. No ambiguity in technology choices. |
| Features | HIGH | Pain points directly observed in testing. Competitive landscape well-researched (Lovable, Bolt, Devin, Claude Forge, Citadel). Feature dependencies clearly mapped. |
| Architecture | HIGH | Cross-validated by Anthropic article, Claude Forge (independent implementation), and cybernetics theory. GAN-inspired adversarial loop is the proven approach. |
| Pitfalls | HIGH | 6 of 7 critical pitfalls directly observed in testing. Supported by Anthropic article, NeurIPS research, and GAN failure mode literature. |
| Cybernetics/Ralph Loop | MEDIUM-HIGH | Pattern mapping is strong; specific implementation thresholds (plateau detection values, oscillation sensitivity) are untested in our architecture. |

**Overall confidence:** HIGH

### Gaps to Address

- **Plateau detection threshold calibration:** The "<=1 point total improvement over 3 rounds" heuristic is a reasonable starting point from cybernetics theory, but needs validation against actual harness runs. Plan to A/B test during Phase 3 implementation.
- **Tool restriction enforcement reliability:** GitHub issue #18837 reported that `allowed-tools` was not enforced. May be fixed in current Claude Code version. Needs validation on the target Claude Code version before relying solely on tool restrictions. Prompt-level guards are the fallback.
- **Evaluator few-shot calibration examples:** No examples exist yet. Need to craft 2-3 scoring examples with detailed rubric breakdowns for each criterion (Product Depth, Functionality, Visual Design, Code Quality). This is the highest-leverage intervention for Evaluator leniency but requires careful design.
- **Oscillation detection sensitivity:** The "scores went up then down for 2+ rounds" heuristic may be too sensitive (normal variance triggers it) or too loose (real oscillation is missed). Needs tuning against actual multi-round runs.
- **Context loading order effects:** The cybernetics research suggests presenting QA-REPORT.md before SPEC.md in Generator rounds 2+ to prime fixing behavior. Theoretical basis is sound but empirical effect size is unknown. Low-cost to try, low-risk if ineffective.
- **Model-specific behavior differences:** The Anthropic article used Opus 4.6 1M. Testing used Sonnet 4.6 200K. Behavior may differ (context anxiety, score calibration, adversarial rigor) across models. The `model: inherit` strategy is correct but harness behavior needs validation across at least Opus and Sonnet.

## Sources

### Primary (HIGH confidence)
- [Anthropic: Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) -- source article for the three-agent architecture
- [Claude Code Docs: Create plugins](https://code.claude.com/docs/en/plugins) -- plugin system reference
- [Claude Code Docs: Plugins reference](https://code.claude.com/docs/en/plugins-reference) -- manifest, directory layout, security constraints
- [Claude Code Docs: Create custom subagents](https://code.claude.com/docs/en/sub-agents) -- agent frontmatter, tool restrictions, spawning
- [Claude Code Docs: Extend Claude with skills](https://code.claude.com/docs/en/skills) -- skill authoring, allowed-tools, progressive disclosure
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- concise skills, reference files
- [freeCodeCamp: GAN Architecture for Multi-Agent Code Generation](https://www.freecodecamp.org/news/how-to-apply-gan-architecture-to-multi-agent-code-generation/) -- independent implementation confirming same patterns
- PROJECT.md testing observations -- directly observed failures in Copilot + Sonnet 4.6 200K

### Secondary (MEDIUM confidence)
- [NeurIPS 2024: LLM self-preference bias](https://arxiv.org/html/2508.02994v1) -- evaluator leniency research
- Ralph Loop / Cybernetics corpus (OVERVIEW.md, CYBERNETICS-ANALYSIS.md, IMPLEMENTATION.md, FAILURE-MODES.md, BEST-PRACTICES.md, METRICS.md, PLUGIN-GUIDE.md) -- feedback engineering principles, failure mode catalog
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) -- evaluation best practices
- [Lovable 2.0 Review](https://aitoolanalysis.com/lovable-review/) -- competitor feature expectations
- [Devin AI Review 2026](https://www.idlen.io/blog/devin-ai-engineer-review-limits-2026/) -- autonomous agent competitor benchmark
- [CodeRabbit: 2026 will be the year of AI quality](https://www.coderabbit.ai/blog/2025-was-the-year-of-ai-speed-2026-will-be-the-year-of-ai-quality) -- industry shift from speed to correctness
- GAN failure mode literature (Understanding GAN Failure Modes, GANs Failure Modes: How to Identify and Monitor, Google ML: Common GAN Problems)

### Tertiary (LOW confidence)
- [GitHub: allowed-tools not enforced (#18837)](https://github.com/anthropics/claude-code/issues/18837) -- may be fixed
- [Stack Overflow: Bugs and Incidents with AI Coding Agents](https://stackoverflow.blog/2026/01/28/are-bugs-and-incidents-inevitable-with-ai-coding-agents/)

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
