# application-dev Plugin

## What This Is

A Claude Code marketplace plugin that turns a short prompt (1-4 sentences) into a complete, working application through autonomous multi-agent development. Uses a GAN-inspired four-agent ensemble architecture (Planner, Generator, Perceptual Critic, Projection Critic) with a deterministic CLI aggregator in an adversarial feedback loop with score-based convergence detection.

## Core Value

Hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration.

## Requirements

### Validated

- v1.0: Delegation-only orchestrator with two-layer enforcement and resumable state (ORCH-01..07)
- v1.0: Git version control throughout workflow with milestone tags (GIT-01..05)
- v1.0: Score-based convergence loop with 4 exit conditions and escalation vocabulary (LOOP-01..09)
- v1.0: Canonical templates for SPEC.md and EVALUATION.md (TPL-01..05)
- v1.0: Adversarial evaluator with asset validation, AI probing, calibrated scoring (EVAL-01..05)
- v1.0: Generator with progressive CI, AI skills, asset pipeline, Vite+ preference (GEN-01..06, SKILL-01)
- v1.0: Optimized agent definitions with progressive disclosure (OPT-01..05)
- v1.1: GAN ensemble architecture with perceptual-critic + projection-critic + CLI aggregator (ENSEMBLE-01..10)
- v1.1: GAN information barrier enforced at tool allowlist and prompt guard layers (BARRIER-01..04)
- v1.1: Behavioral acceptance criteria in SPEC-TEMPLATE.md with testable tier minimums (SPEC-01..05)
- v1.1: Token-efficient Playwright evaluation patterns with write-and-run and eval-first (PLAYWRIGHT-01..06, TOKEN-01..05)
- v1.1: Crash recovery via resume-check artifact detection and static production build serving (RECOVERY-01..04)

### Active

<!-- Current scope: v1.2 Dutch Art Museum Test Fixes -->

(Defining with milestone v1.2 -- see REQUIREMENTS.md)

### Out of Scope

- Budget/balanced/quality profiles -- configuration complexity; deferred to v2
- Accessibility compliance (WCAG) -- valuable, planned for v2.0 accessibility-critic
- Web Core Vitals optimization -- valuable but not core to current pain points
- Chrome DevTools MCP/browser-agent integration -- explore after ensemble proves out
- Dedicated AI image generation tool -- Generator can use available packages and browser AI
- Configurable round count / target grade -- score-based exit handles this
- Autopoietic learning -- requires multi-session infrastructure beyond single-run architecture
- Context rotation (Ralph Loop) -- monolithic pattern; GAN architecture uses fresh context per agent spawn
- VSM dashboard (cybernetics) -- monitoring infrastructure beyond current scope
- Separate cross-validation gate -- combinatorial explosion: N features -> N*(N-1)/2 pairs
- Agent teams (experimental Claude Code feature) -- critical bugs (#30499, #24316, #31977)

## Current Milestone: v1.2 Dutch Art Museum Test Fixes

**Goal:** Address all remaining issues from the Dutch art museum website test #1: perturbation-critic (Robustness), scoring convergence logic, planner/generator improvements, Visual Coherence expansion, architecture documentation.

**Target features:**
- New perturbation-critic for Robustness dimension (adversarial testing)
- Enhanced perceptual-critic for Visual Coherence (cross-page consistency)
- Enhanced projection-critic for deeper Functionality (A->B->A navigation)
- CLI-decided verdict with convergence logic hardening
- Generator improvements: Vite+ adoption, dependency freshness, browser-agnostic LanguageModel
- Architecture documentation grounded in GAN/Cybernetics/Turing test principles

## Context

### Current State (post v1.1)

Shipped v1.1 ensemble discriminator + crash recovery with 8,188 lines across 30 plugin files.

Tech stack:
- Orchestrator: SKILL.md with appdev-cli.mjs (13 subcommands including compile-evaluation, install-dep, resume-check, static-serve)
- Agents: planner.md, generator.md, perceptual-critic.md, projection-critic.md (4 agents)
- Scoring: 3 dimensions (Product Depth CLI-computed, Functionality, Visual Design), thresholds 7/7/6
- Skills: 6 bundled (browser-prompt-api, browser-webllm, browser-webnn, playwright-testing, vitest-browser, vite-plus)
- References: 9 files (templates, calibration, probing, slop checklist, Playwright evaluation, acceptance criteria guide)
- Tests: 57 tests passing (~17.5s)

### Plugin structure (post v1.1)

```
plugins/application-dev/
  .claude-plugin/plugin.json
  commands/application-dev.md
  skills/application-dev/
    SKILL.md                              Orchestrator with crash recovery
    references/
      frontend-design-principles.md
      SPEC-TEMPLATE.md
      ASSETS-TEMPLATE.md
      acceptance-criteria-guide.md
      evaluator/
        EVALUATION-TEMPLATE.md
        SCORING-CALIBRATION.md
        AI-PROBING-REFERENCE.md
        AI-SLOP-CHECKLIST.md
        PLAYWRIGHT-EVALUATION.md
  skills/playwright-testing/
    SKILL.md + references/ (3 files)
  skills/vitest-browser/SKILL.md
  skills/vite-plus/SKILL.md
  skills/browser-prompt-api/SKILL.md
  skills/browser-webllm/SKILL.md
  skills/browser-webnn/SKILL.md
  agents/
    planner.md
    generator.md
    perceptual-critic.md
    projection-critic.md
  scripts/appdev-cli.mjs
  scripts/test-appdev-cli.mjs
  README.md
```

### Testing environment

Tested with GitHub Copilot CLI (Sonnet 4.6 200K) against three prompts:
- Dutch art museum ("Meesterwerk")
- DAW (digital audio workstation)
- RetroForge (retro game toolkit)

The Anthropic article achieved best results with Opus 4.6 1M. Plugin defaults to `model: inherit` for flexibility.

### Known issues

- Plateau detection threshold (<=1 point over 3 rounds) needs calibration against actual runs
- AskUserQuestion omitted from allowed-tools (bug #29547) -- works via normal permission path
- Skills frontmatter auto-injection not working (bug #25834) -- Read fallback instructions used

## Design Principles: GAN Inspiration

| GAN Concept | Plugin Analog | Purpose |
|-------------|---------------|---------|
| Generator | Generator agent | Produces the application |
| Discriminator | Evaluator agent | Judges quality with adversarial skepticism |
| Training loop | Build/QA rounds | Critique drives improvement |
| Separation of generation/evaluation | Distinct agents with distinct tools | Prevents self-praise bias |

Key principle: improve quality by strengthening both sides. The Generator needs awareness (image sourcing, AI skills, CI checks) AND the Evaluator needs adversarial rigor (asset validation, AI feature probing, honest grading).

## Constraints

- **Distribution model**: Everything in `plugins/application-dev/` ships to users via GitHub clone. No test files, scratch files, or build tooling in the plugin directory.
- **Tech stack agnostic**: Generator chooses any tech stack. Preferences (Vite+) are nudges, not mandates.
- **playwright-cli dependency**: Critics require playwright-cli binary on PATH.
- **Model compatibility**: Plugin works with `model: inherit`. Opus 4.6 1M recommended.
- **Zero npm dependencies**: appdev-cli.mjs uses only Node.js built-ins. Critics install evaluation tooling at runtime via install-dep.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Score-based exit over fixed rounds | GAN convergence principle + testing showed 3 rounds insufficient | Good -- 4 exit conditions cover all scenarios |
| Evaluator-side asset validation over Generator-side tool | GAN adversarial principle: enforce outcomes, not methods | Good -- Evaluator independence preserved |
| Vite+ skill in v1 | Generator lacks pre-trained Vite+ knowledge; vp CLI will be hallucinated | Good -- 281-line skill with full CLI reference |
| No dedicated AI image generation tool | Generator can figure out build-time generation | Good -- kept scope manageable |
| evaluation/round-N/ folders (not qa/) | GAN ubiquitous language consistency | Good -- cleaner mental model |
| Two-layer enforcement (allowlists + guards) | Four-layer/hooks design was infeasible | Good -- defense-in-depth without over-engineering |
| Templates for SPEC.md/EVALUATION.md | Inline format specs drifted through paraphrasing | Good -- single source of truth |
| Progressive disclosure for agent defs | Reference files for protocol-heavy content (>30 lines, single-step relevance) | Good -- -9% lines, cleaner context |
| WHY-based rationale over ALL-CAPS emphasis | Concrete consequences more effective than shouting | Good -- zero MUST/NEVER/ALWAYS remaining |
| Cybernetics damping principle for fix-only mode | Unconstrained changes cause oscillation between rounds | Good -- Generator stays focused in rounds 2+ |
| Ensemble critics over monolithic evaluator | Evaluator crashed sessions via memory leak + context exhaustion (~200 tool calls) | Good -- each critic isolated to ~60K tokens |
| Deterministic CLI aggregator for Product Depth | Separates grading from gating (Anthropic evals pattern) | Good -- zero LLM tokens for scoring math |
| DIMENSIONS constant as single source of truth | Prevents contract drift between extractScores regex and CLI | Good -- structurally prevents Pitfall 1 |
| Write-and-run acceptance tests | 30+ interactive tool calls replaced by ~5 calls | Good -- massive token savings |
| Artifact-based crash recovery | resume-check reads state JSON + filesystem for 4 recovery states | Good -- survives any crash point |
| Static production builds over dev servers | Dev servers are fragile, leak ports, and can't be resumed | Good -- static-serve is idempotent |
| Per-critic retry on failure | Retrying both critics wastes the successful one's work | Good -- targeted recovery |

---
*Last updated: 2026-04-02 after v1.1 milestone completion*
