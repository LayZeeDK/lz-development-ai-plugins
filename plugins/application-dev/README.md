# application-dev

Autonomous application development plugin for Claude Code, using a GAN-inspired five-agent ensemble architecture.

## Overview

This plugin orchestrates long-running application development from a short prompt (1-4 sentences). It uses five specialized agents in an adversarial feedback loop:

- **Planner**: Expands your prompt into an ambitious product specification (10-16+ features, visual design language, AI integration points)
- **Generator**: Builds the full application from the spec, choosing the optimal tech stack
- **Perceptual Critic**: Scores Visual Design by detecting AI slop and assessing whether the product passes as hand-built. Evaluates via browser screenshots and interaction.
- **Projection Critic**: Scores Functionality by writing and running acceptance tests against SPEC.md criteria. Tests execute outside agent context for token efficiency.
- **Perturbation Critic**: Scores Robustness by running adversarial tests -- viewport extremes, rapid navigation, input perturbation, and console monitoring under stress. Evaluates resilience beyond what the spec requires.

The workflow runs continuously and autonomously -- no user input is required after the initial prompt.

## Usage

```
/application-dev Create a 2D retro game maker with features including a level editor, sprite editor, entity behaviors, and a playable test mode.
```

```
/application-dev Build a fully featured DAW in the browser using the Web Audio API.
```

```
/application-dev Create a visually distinctive website for a Dutch art museum, including a gallery layout, artwork pages, and intuitive navigation.
```

If your prompt mentions a specific tech stack (e.g., "using React" or "with the Web Audio API"), the Generator will honor that constraint. Otherwise, it chooses the best stack for the product.

## How It Works

1. **Plan** -- The Planner expands your prompt into a detailed product spec (`SPEC.md`) with features, user stories, visual design language, and AI integration points.

2. **Build** -- The Generator builds the complete application. It picks the tech stack, implements all features, and follows the visual design language.

3. **Evaluate** -- All three critics evaluate the running app in parallel -- the Perceptual Critic observes visual quality, the Projection Critic runs acceptance tests, and the Perturbation Critic stress-tests resilience. The CLI compiles their findings into a single evaluation report.

4. **Iterate** -- If any dimension falls below its threshold, the Generator receives the evaluation report and improves the application. Up to 10 generation/evaluation rounds.

## Prerequisites

- Claude Code with Opus model access (recommended for best results)
- Node.js (npm used for devDependencies during workspace setup)

## Design Quality

The Planner and Generator use bundled frontend design principles (derived from Anthropic's [frontend-design skill](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design), Apache 2.0) to produce distinctive, non-generic visual design. The principles cover typography, color, spatial composition, motion, and explicit anti-patterns to avoid.

## Architecture

Inspired by Generative Adversarial Networks (GANs):

- The Generator and critic ensemble form an adversarial pair
- The critics are calibrated to be skeptical -- finding issues, not praising work
- Three specialized critics (Perceptual + Projection + Perturbation) evaluate in parallel, each in its own isolated context. The CLI aggregates their findings deterministically.
- Multiple rounds create an improvement loop where critique drives quality
- Separation of generation and evaluation prevents the self-praise bias seen when models judge their own output

Based on: [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Anthropic, 2026), locally available at [research/anthropic-harness-design-for-long-running-application-development.md](../../research/anthropic-harness-design-for-long-running-application-development.md).

## Evaluation Criteria

| Dimension | Threshold | What It Measures |
|-----------|-----------|------------------|
| Product Depth | 7/10 | Feature completeness vs. spec (CLI-computed from acceptance tests) |
| Functionality | 7/10 | Does it actually work when used? (Projection Critic) |
| Visual Design | 6/10 | Coherent identity, not AI-slop (Perceptual Critic) |
| Robustness | 6/10 | Resilience under adversarial conditions (Perturbation Critic) |

## File Protocol

Agents communicate via structured files in the working directory:

| File | Writer | Reader | Purpose |
|------|--------|--------|---------|
| `SPEC.md` | Planner | Generator, Critics | Product specification |
| `evaluation/round-N/EVALUATION.md` | CLI (compile-evaluation) | Generator (next round) | Compiled evaluation report |
| `evaluation/round-N/*/summary.json` | Each critic | CLI (compile-evaluation) | Per-critic scoring data |

## License

MIT

## Model recommendation

Agents default to `model: inherit` so users can experiment with different models. For best long-running results, Opus 4.6 is recommended (used in the harness this plugin follows). Sonnet 4.6 (1M context) may be a lower-cost experimental alternative, but its sustained multi-hour behavior for this harness is unproven. To try a different model, edit `plugins/application-dev/agents/*.md` and set `model` to your preferred model.
