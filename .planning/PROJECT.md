# application-dev Plugin v1 Hardening

## What This Is

A Claude Code marketplace plugin that turns a short prompt (1-4 sentences) into a complete, working application through autonomous multi-agent development. Uses a GAN-inspired three-agent architecture (Planner, Generator, Evaluator) in an adversarial feedback loop. This milestone hardens the v1 implementation based on testing with Copilot + Sonnet 4.6 200K against the three example prompts (RetroForge, DAW, Dutch art museum).

## Core Value

The plugin delivers on the promise of hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration, not early stopping.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet -- ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Score-based exit with plateau detection (stop when scores stop improving) and 10-round safety cap, replacing the arbitrary 3-round limit
- [ ] Evaluator validates assets: catches broken images, blocked cross-origin requests, placeholder/stolen content, missing attribution
- [ ] Generator sources images via web search with license verification, or generates them at build time (Node packages, browser AI + playwright screenshot, etc.) -- approach is examples not prescriptions, Generator is tech stack-agnostic
- [ ] Generator runs CI checks (typecheck, build, lint, test) as inner feedback loop before handing off to Evaluator
- [ ] Evaluator probes AI features adversarially: varied inputs, semantic probing, nonsense input to detect canned/keyword-matched responses
- [ ] Generator is guided toward browser-* AI skills (Prompt API, WebLLM, WebNN) for implementing in-app AI features with real AI, not if/else chains
- [ ] Planner commits SPEC.md after generating it
- [ ] Generator commits frequently (feature-by-feature) throughout its build, not just at round end
- [ ] Generator adds/updates .gitignore (node_modules, build output, .playwright-cli)
- [ ] Evaluator commits QA report + artifacts into qa/round-N/ folder per round
- [ ] Milestone git tags at key points (after planning, after each round, after final PASS)
- [ ] Orchestrator (application-dev skill) must never perform agent work -- only delegate and coordinate; must error out rather than fall back to doing agent work itself
- [ ] Tool allowlists audited per agent role based on GAN separation of concerns
- [ ] Vite+ skill bundled with the plugin for correct vp CLI usage, config, and toolchain
- [ ] Generator prefers Vite+ over Vite for greenfield web projects (preference, not mandate)
- [ ] Orchestrator only passes to agents what is described in SKILL.md -- no extra context leaking

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Dedicated AI image generation tool/skill -- Generator can figure out build-time image generation using available packages and tools; not a pre-built capability we hand it
- Budget/balanced/quality profiles -- configuration complexity doesn't fix v1 quality pain points; deferred to v2
- Static production build output requirement -- dev server output is acceptable for v1; production builds are a deliverable concern, not a QA concern
- Accessibility compliance (opt-in) -- valuable but not core to v1 pain points
- Web Core Vitals optimization (opt-in) -- valuable but not core to v1 pain points
- Chrome DevTools MCP/browser-agent integration -- explore after v1 Evaluator improvements
- Sprint-based v1 harness architecture -- out of scope; we use the v2 one-shot harness from the article
- Configurable round count or target grade via user prompt -- score-based exit handles this

## Context

### Testing environment

Tested with GitHub Copilot CLI (using Sonnet 4.6 200K context) against three example prompts:
- Dutch art museum ("Meesterwerk") -- at D:\projects\sandbox\copilot-gpt-dutch-art-museum
- DAW -- at D:\projects\sandbox\copilot-sonnet-4_6-daw
- RetroForge -- at D:\projects\sandbox\copilot-sonnet-4_6-retroforge

The Anthropic article achieved best results with Opus 4.6 1M. Sonnet 4.6 200K is a significantly smaller context window. The current plugin defaults to `model: inherit` so users can experiment.

### Key pain points from testing

1. **Broken/stolen assets** -- Dutch museum site had blocked external images replaced by placeholders, stolen images without attribution. For a gallery site, this was the most visible failure.
2. **Canned AI features** -- The "Jan AI Docent" chatbot used keyword-triggered canned responses, not actual AI. Users today expect real conversational AI; this undermines the "weaved AI features" promise.
3. **No git commits** -- Agents didn't commit work step-by-step. No version history of progress, no recovery points.
4. **QA reports not versioned** -- Single QA-REPORT.md overwritten without history. No way to track improvement across rounds.
5. **Early stopping** -- Orchestrator stopped after 1-2 rounds despite identified issues and scores well below 10. Felt like prompt-to-partial-application.
6. **Orchestrator doing agent work** -- When agents failed (API errors, rate limiting), the orchestrator fell back to performing the agent's work itself, violating the architecture.
7. **Tool allowlists not principled** -- Agent tool lists weren't designed around GAN role separation.

### Existing plugin structure

```
plugins/application-dev/
  .claude-plugin/plugin.json       Plugin manifest
  commands/application-dev.md      Slash command (thin wrapper)
  skills/application-dev/          Orchestrator
    SKILL.md                       Orchestration logic
    references/
      frontend-design-principles.md
  agents/
    planner.md                     Prompt -> SPEC.md
    generator.md                   SPEC.md -> application code
    evaluator.md                   Application -> QA-REPORT.md
  skills/browser-prompt-api/       Browser AI: Prompt API
  skills/browser-webllm/           Browser AI: WebLLM
  skills/browser-webnn/            Browser AI: WebNN
  README.md
```

## Design Principles: GAN Inspiration and Anthropic Article Alignment

### GAN-inspired adversarial architecture

The plugin's core architecture is inspired by Generative Adversarial Networks:

| GAN Concept | Plugin Analog | Purpose |
|-------------|---------------|---------|
| Generator | Generator agent | Produces the application |
| Discriminator | Evaluator agent | Judges quality with adversarial skepticism |
| Training loop | Build/QA rounds | Critique drives improvement |
| Separation of generation/evaluation | Distinct agents with distinct tools | Prevents self-praise bias |

**Key GAN principle applied throughout:** You improve quality by strengthening both sides, not just one. The Generator needs awareness (image sourcing, AI skills, CI checks) AND the Evaluator needs adversarial rigor (asset validation, AI feature probing, honest grading).

### Alignment with Anthropic article (v2 harness)

| Article element | Our alignment | Status |
|-----------------|---------------|--------|
| Three-agent architecture (Planner, Generator, Evaluator) | Aligned | Implemented |
| No sprint decomposition (v2 simplification) | Aligned | Implemented |
| Planner expands prompt into ambitious spec | Aligned | Implemented |
| Planner weaves AI features into spec | Aligned | Implemented |
| Generator picks tech stack | Aligned | Implemented |
| Evaluator uses Playwright to navigate running app | Aligned | Implemented (via playwright-cli) |
| Evaluator grades against criteria with hard thresholds | Aligned | Implemented |
| File-based agent communication (SPEC.md, QA-REPORT.md) | Aligned | Implemented |
| Agents default to model: inherit | Aligned | Implemented |
| Generator self-evaluates before handing off to QA | **Gap** | v1: add CI checks as inner loop |
| Multiple QA rounds | **Gap** | v1: score-based exit with plateau detection, not fixed 3 rounds |

### Divergences from article (with rationale)

| Divergence | Rationale | Source |
|------------|-----------|--------|
| Evaluator commits QA reports per round in qa/round-N/ | Article didn't version QA artifacts; our testing showed loss of improvement history | Testing |
| Generator commits frequently (feature-by-feature) | Article didn't specify git strategy; our testing showed no recovery points | Testing |
| Milestone git tags | Article didn't use tags; our testing showed no way to track progress | Testing |
| Score-based exit with plateau detection | Article used fixed rounds; our testing showed early stopping with issues remaining | Testing + GAN principles (iterate until convergence) |
| Evaluator probes AI features adversarially | Article's Evaluator tested functionality generically; our testing showed canned responses slipped through | Testing |
| Evaluator validates image licensing/attribution | Article didn't address asset provenance; our testing showed stolen/broken images | Testing |
| Generator guided toward browser AI skills for in-app AI | Article used Claude API for AI features; browser-* APIs are client-side alternatives | GAN principles (Generator awareness) |
| Prefer Vite+ over Vite for greenfield web projects | Article used React+Vite; Vite+ gives faster CI inner loop for the Generator | GAN principles (faster feedback = more iterations) |
| Orchestrator never does agent work | Article's harness was custom code, not a plugin skill; our testing showed orchestrator fallback on API errors | Testing |

## Constraints

- **Distribution model**: Everything in `plugins/application-dev/` ships to users via the Claude Code plugin marketplace (GitHub clone). No test files, scratch files, or build tooling in the plugin directory.
- **Tech stack agnostic**: Generator must remain free to choose any tech stack. Preferences (Vite+ over Vite) are nudges, not mandates.
- **playwright-cli dependency**: Evaluator requires playwright-cli binary on PATH. This is the only external runtime dependency.
- **Model compatibility**: Plugin must work with `model: inherit` (user's default model). Opus 4.6 1M recommended but not required.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Score-based exit over fixed rounds | GAN convergence principle + testing showed 3 rounds insufficient | -- Pending |
| Evaluator-side asset validation over Generator-side tool | GAN adversarial principle: enforce outcomes, don't prescribe methods | -- Pending |
| Vite+ skill in v1 | Generator lacks pre-trained Vite+ knowledge; vp CLI will be hallucinated without a skill | -- Pending |
| No dedicated AI image generation tool | Generator is capable enough to figure out build-time generation using available packages | -- Pending |
| QA reports in qa/round-N/ folders | Preserves full history with colocated artifacts (screenshots, etc.) | -- Pending |

---
*Last updated: 2026-03-27 after initialization*
