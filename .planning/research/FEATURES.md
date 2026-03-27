# Feature Landscape

**Domain:** GAN-inspired multi-agent autonomous application development harness (Claude Code plugin)
**Researched:** 2026-03-27

## Table Stakes

Features users expect from an autonomous prompt-to-application tool in 2026. Missing any of these and the plugin feels broken or incomplete compared to alternatives (Lovable, Bolt.new, Devin, Claude Code harnesses like Citadel and ECC).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Working application output | The entire point. Lovable/Bolt deliver runnable apps from prompts. A harness that produces a broken app is worse than useless -- it wasted hours and tokens. | High | Currently partially met; broken assets, stubbed features, and non-functional AI features undermine this. |
| Score-based exit with convergence detection | Fixed round counts (3) cause early stopping when issues remain AND wasted rounds when the app already passes. Every serious harness (Anthropic article, Claude Forge, Citadel) uses conditional looping. Users expect the loop to run until quality converges or a safety cap is hit. | Medium | PROJECT.md already specifies this. Plateau detection (scores stop improving) plus a 10-round safety cap. |
| Adversarial evaluation with real browser testing | Playwright-based QA that navigates, clicks, fills forms, and screenshots. This is the core differentiator of the GAN architecture vs. single-agent tools. Without rigorous adversarial QA, the Generator self-praises and ships mediocre work. | High | Currently implemented but insufficiently adversarial: misses broken assets, accepts canned AI responses, and tends toward score inflation. |
| Git version control throughout | Aider's core insight: "every edit is a commit." In 2026, 86% of orgs deploy agents for production code -- they expect audit trails. No commits means no recovery points, no diffable history, no revert capability. Users lose hours of work if the agent crashes. | Medium | Currently a gap. No commits are made during the build process. |
| Real assets (not placeholders or stolen content) | When the spec says "art gallery," users expect actual images that load, not broken URLs, placeholder rectangles, or hotlinked copyrighted content. The Lovable/Bolt ecosystem trained users to expect working visual output. | High | Critical v1 pain point. Dutch museum test showed blocked external images, stolen content, no attribution. |
| Functional AI features (not canned responses) | The Anthropic article explicitly weaves AI features into specs. When the spec says "AI chatbot" or "AI assistant," users expect real inference, not if/else keyword matching. In 2026, browser-local AI (Prompt API, WebLLM) makes this achievable without cloud API keys. | High | Critical v1 pain point. DAW and museum tests showed keyword-triggered canned responses passing as "AI." |
| Orchestrator role integrity | The orchestrator must only delegate, never do agent work. When the orchestrator falls back to coding, it breaks the GAN separation that prevents self-praise bias. Every multi-agent framework (AutoGen, CrewAI, ADK) enforces strict role boundaries. | Medium | v1 pain point. Orchestrator performed agent work when agents hit API errors or rate limits. |
| QA report versioning per round | Single QA-REPORT.md overwritten each round loses improvement history. Users and the Generator cannot see score trends, cannot identify regressions, cannot understand what improved. File-per-round is standard in CI/CD evaluation pipelines. | Low | PROJECT.md specifies qa/round-N/ folders. Straightforward to implement. |
| Self-testing before QA handoff | Generator should run CI checks (typecheck, build, lint, test) before handing off to the Evaluator. Catching compilation errors and type errors before the Evaluator round avoids wasting an expensive QA cycle on trivially broken code. Anthropic article: "the generator was instructed to self-evaluate its work at the end of each sprint." | Medium | Currently the Generator does a basic curl health check. Needs full CI inner loop. |
| Planner produces committed SPEC.md | The spec is the contract the entire system runs on. It must be committed to git so it is versioned, diffable, and recoverable. An uncommitted spec exists only in the agent's context window -- if the session crashes, it is lost. | Low | Currently SPEC.md is written to disk but not committed. |

## Differentiators

Features that set the plugin apart from alternatives. Not expected by default, but create competitive advantage in the crowded 2026 autonomous coding landscape.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| GAN-inspired adversarial architecture | The core differentiator. Lovable/Bolt/v0 are single-pass generators with no adversarial QA loop. Devin has self-healing but no separated evaluator. Claude Forge has plan/code review but no Playwright-based runtime testing. This plugin uniquely combines separated Generator/Evaluator agents with live browser testing in an improvement loop. | Already implemented | Architecture exists. The work is making it rigorous, not inventing it. |
| Evaluator asset validation | No competing tool validates that images actually load, are legally sourced, and are not placeholders. This catches the most visible failure mode of AI-generated applications: the "looks great in the code, broken in the browser" problem. | Medium | Evaluator checks that images render, are not cross-origin blocked, are not obviously stolen (reverse image search or license header check), and have attribution where required. |
| Evaluator adversarial AI probing | No competing tool verifies that AI features provide real inference rather than canned responses. The Evaluator sends varied inputs, nonsense queries, and semantic probes to detect keyword matching masquerading as AI. This is the "discriminator" insight from GANs applied to AI feature quality. | Medium | Evaluator tests AI chatbots with diverse inputs: rephrasings, nonsense, edge cases. If responses are suspiciously similar or keyword-triggered, it fails the feature. |
| Browser-local AI guidance (Prompt API, WebLLM, WebNN) | Unique in the ecosystem. Other prompt-to-app tools use cloud AI APIs (requiring API keys) or skip AI features entirely. This plugin guides the Generator toward browser-local AI that works offline, requires no API keys, and preserves user privacy. The bundled skills give the Generator pre-trained knowledge of emerging APIs. | Already implemented (skills exist) | Skills for Prompt API, WebLLM, and WebNN are bundled. The gap is that the Generator sometimes ignores them and builds canned responses instead. |
| Milestone git tags | Semantic progress markers (after-planning, round-1-complete, round-2-complete, final) enable users to navigate the build history, understand what changed when, and recover from any point. No competing harness tags milestones this way. | Low | Simple git tag commands at orchestrator transition points. |
| Feature-by-feature commits from Generator | Most autonomous agents either commit nothing or commit a giant blob at the end. Feature-by-feature commits create a reviewable, revertable history that aligns with how human developers work. Aider popularized this pattern with its "every edit is a commit" philosophy. | Medium | Generator must commit after completing each feature, not just at round end. Requires prompt engineering to make the Generator break work into logical commits. |
| Tool allowlists per agent role | Enforcing GAN separation at the tool level. The Evaluator cannot modify code (read-only + write QA report). The Generator cannot approve its own work. The Planner has no filesystem access beyond Read/Write. This is architecturally mandatory review, not prompt-suggested review. | Medium | Currently tools are listed but not principled around role separation. Need audit and tightening. |
| Vite+ skill for faster inner loop | Generator inner feedback loop (build, typecheck, lint) runs faster with Vite+ (vp CLI) than vanilla Vite. Faster inner loop means more iterations per round, which means higher quality output. This is the GAN principle: more iterations = better convergence. | Medium | Vite+ skill needs to be bundled since the Generator has no pre-trained knowledge of vp CLI. Preference, not mandate -- Generator remains tech-stack agnostic. |

## Anti-Features

Features to explicitly NOT build. These are tempting but counterproductive for v1 quality.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Dedicated AI image generation tool/skill | Over-prescribes the Generator's approach. The Generator is tech-stack agnostic and should figure out image sourcing (web search with license verification, npm packages for procedural generation, browser AI for generation, SVG creation, etc.) based on the project's needs. A pre-built tool creates a crutch that reduces the Generator's problem-solving. | Evaluator validates outcomes (images load, are legal, are not placeholders). Generator is free to solve it any way it wants. |
| Budget/balanced/quality profiles | Configuration complexity that doesn't fix v1 quality pain points. Users don't want to choose between "fast but broken" and "slow but good." They want "good" as the default. Profiles also multiply the testing surface without adding quality. | One profile: build the best application the model can produce, with score-based exit determining when to stop. |
| Sprint-based decomposition (v1 harness) | The Anthropic article's v2 harness explicitly removed sprints because Opus 4.6 handles long coherent sessions natively. Sprint decomposition adds orchestration complexity, token overhead, and latency. The v1 sprint-and-contract approach is an assumption about model limitations that Opus 4.6 has outgrown. | Single continuous build per round, with compaction handling context growth. Generator works through features incrementally but without formal sprint boundaries. |
| Configurable round count or target grade | Score-based exit with plateau detection handles this automatically. Manual configuration gives users a knob they don't know how to set and creates blame ("I only set 2 rounds, that's why it's bad"). | Automatic convergence detection. The harness runs until quality plateaus or hits the 10-round safety cap. |
| Static production build requirement | Dev server output is acceptable for v1. Production builds are a deliverable concern (minification, code splitting, asset optimization), not a QA concern. Adding production build requirements to v1 increases Generator complexity without improving the core quality loop. | Generator produces a runnable dev server. Production build optimization is a v2 concern. |
| Chrome DevTools MCP / browser-agent integration | Powerful but premature. The current Evaluator uses playwright-cli effectively. Adding Chrome DevTools MCP would increase the Evaluator's tool surface, increase token costs, and introduce a new dependency -- all before the basic Evaluator adversarial rigor is solid. | Improve Evaluator prompt engineering and adversarial testing patterns first. Explore DevTools MCP after v1 Evaluator improvements are validated. |
| Accessibility compliance (opt-in) | Valuable but not core to v1 pain points. Adding accessibility evaluation criteria would dilute focus from the six identified pain points (broken assets, canned AI, no commits, no QA history, early stopping, orchestrator role violation). | Generator already includes basic accessibility (semantic HTML, keyboard nav, contrast) in its quality standards. Full WCAG compliance is a v2 evaluation criterion. |
| Web Core Vitals optimization | Same reasoning as accessibility -- valuable but dilutes v1 focus. Performance optimization (LCP, FID, CLS) is a production readiness concern, not a "does this application work" concern. | Generator already avoids unnecessary dependencies and targets fast initial load. Formal performance budgets are v2. |
| Real-time collaboration or multiplayer | Massive complexity for zero v1 value. The plugin builds applications for a single user from a single prompt. Collaboration features are a product expansion, not a quality improvement. | Explicitly list as a non-goal in Planner constraints. |
| User accounts or authentication (unless spec requires) | Adds backend complexity that increases failure surface without improving the core experience. Most prompt-to-app demos don't need auth. | Planner explicitly marks auth as a non-goal unless the user prompt requests it. |

## Feature Dependencies

```
Score-based exit --> QA report versioning (need score history to detect plateaus)
QA report versioning --> Milestone git tags (tags mark round boundaries)
Planner commits SPEC.md --> Generator commits features (both need git workflow)
Generator CI inner loop --> Generator commits (commit after CI passes)
Evaluator asset validation --> Working application output (must have running app to validate)
Evaluator AI probing --> Functional AI features (must have AI features to probe)
Tool allowlists --> Orchestrator role integrity (tools enforce roles)
Vite+ skill --> Generator CI inner loop (faster CI = more iterations)
Browser-local AI skills --> Functional AI features (skills provide implementation knowledge)
Feature-by-feature commits --> Git version control (commits require git workflow)
```

Dependency chain for v1 implementation order:

```
1. Git workflow foundation
   |-- Planner commits SPEC.md
   |-- Generator commits feature-by-feature
   |-- QA report versioning (qa/round-N/)
   |-- Milestone git tags
   '-- Score-based exit (needs score history)

2. Generator quality inner loop
   |-- CI checks (typecheck, build, lint) before QA handoff
   '-- Vite+ skill for faster CI (optional, preference)

3. Evaluator adversarial rigor
   |-- Asset validation (images load, not stolen/placeholder)
   |-- AI feature probing (varied inputs, nonsense detection)
   '-- Stricter scoring calibration

4. Architectural integrity
   |-- Orchestrator never does agent work
   |-- Tool allowlists per agent role
   '-- Context isolation (no extra context leaking)
```

## MVP Recommendation

Prioritize in this order based on pain point severity and dependency chain:

1. **Git workflow foundation** (addresses pain points #3 no commits, #4 QA not versioned)
   - Planner commits SPEC.md after generating it
   - Generator commits feature-by-feature throughout build
   - Evaluator commits QA report + artifacts into qa/round-N/
   - Milestone git tags at key points
   - This is the foundation for score-based exit (needs score history)

2. **Score-based exit with plateau detection** (addresses pain point #5 early stopping)
   - Replace fixed 3-round limit with score-based convergence
   - 10-round safety cap prevents runaway token costs
   - Plateau detection: stop when scores stop improving across rounds
   - Requires QA report versioning (dependency met by #1)

3. **Orchestrator role integrity** (addresses pain point #6 orchestrator doing agent work)
   - Orchestrator only delegates, never performs agent work
   - Error out rather than fall back to doing agent work itself
   - Tool allowlists audited per agent role
   - No extra context leaking beyond what SKILL.md describes

4. **Evaluator adversarial rigor** (addresses pain points #1 broken assets, #2 canned AI)
   - Asset validation: catches broken images, blocked cross-origin, placeholder content, stolen images
   - AI feature probing: varied inputs, semantic probing, nonsense detection
   - These are the highest-impact quality improvements but depend on the loop running enough rounds (#2) and having versioned reports (#1)

5. **Generator CI inner loop** (reduces wasted QA rounds)
   - Run typecheck, build, lint before Evaluator handoff
   - Prevents trivially broken code from consuming an expensive QA cycle

Defer:
- **Vite+ skill**: Nice optimization for Generator inner loop speed, but not a pain point fix. Can ship with or after the core fixes.
- **Browser-local AI skill improvements**: Skills already exist. The fix is in Evaluator probing (catching canned responses) and Generator prompting (guiding toward the skills), not in the skills themselves.

## Sources

- [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) -- PRIMARY. The article this plugin implements. v2 harness removes sprints, uses three-agent Planner/Generator/Evaluator architecture.
- [FreeCodeCamp: How to Apply GAN Architecture to Multi-Agent Code Generation](https://www.freecodecamp.org/news/how-to-apply-gan-architecture-to-multi-agent-code-generation/) -- Filesystem-based communication, isolated context windows, iteration caps, rhetorical questioning in feedback.
- [Google: Developer's guide to multi-agent patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/) -- Multi-agent design patterns, orchestrator role separation.
- [Lovable 2.0 Review](https://aitoolanalysis.com/lovable-review/) -- Prompt-to-app competitor. Full-stack from single prompt, visual editing, Supabase backend. $6.6B valuation sets user expectations.
- [Bolt.new vs Lovable vs v0 Comparison](https://www.nxcode.io/resources/news/v0-vs-bolt-vs-lovable-ai-app-builder-comparison-2025) -- Competitor feature matrix. Context window degradation is shared pain point.
- [Devin AI Review 2026](https://www.idlen.io/blog/devin-ai-engineer-review-limits-2026/) -- Autonomous agent competitor. 67% merge rate on well-defined tasks, 15% on complex. Interactive planning, self-healing.
- [CodeRabbit: 2026 will be the year of AI quality](https://www.coderabbit.ai/blog/2025-was-the-year-of-ai-speed-2026-will-be-the-year-of-ai-quality) -- Industry shift from speed to correctness. Defect density and review load replacing cycle time as key metrics.
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) -- Evaluation best practices, LLM-as-judge patterns, adversarial testing strategies.
- [Claude Code Harness (Chachamaru127)](https://github.com/Chachamaru127/claude-code-harness) -- Competing harness. Plan -> Work -> Review cycle. v3 unifies into verb skills.
- [Citadel (SethGammon)](https://github.com/SethGammon/Citadel) -- Competing harness. Campaign persistence, parallel agents, circuit breaker.
- [Best AI Coding Agents 2026](https://www.faros.ai/blog/best-ai-coding-agents-2026) -- Market landscape. Claude Code 46% "most loved" rating.
- [Version Control Best Practices for AI Code](https://www.ranger.net/post/version-control-best-practices-ai-code) -- Atomic commits, conventional messages, AI artifact versioning.
