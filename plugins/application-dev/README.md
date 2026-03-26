# application-dev

Autonomous application development plugin for Claude Code, using a GAN-inspired three-agent architecture.

## Overview

This plugin orchestrates long-running application development from a short prompt (1-4 sentences). It uses three specialized agents in an adversarial feedback loop:

- **Planner**: Expands your prompt into an ambitious product specification (10-16+ features, visual design language, AI integration points)
- **Generator**: Builds the full application from the spec, choosing the optimal tech stack
- **Evaluator**: QAs the running app via `playwright-cli` with skepticism, driving the Generator to improve

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

3. **Evaluate** -- The Evaluator starts the app, navigates it via `playwright-cli` like a real user, and grades it against four criteria with hard thresholds.

4. **Iterate** -- If any criterion falls below its threshold, the Generator receives the Evaluator's detailed feedback and improves the application. Up to 3 build/QA rounds.

## Prerequisites

- `playwright-cli` binary installed and on PATH (the Evaluator embeds its own usage instructions, so the playwright-cli skill is not required -- only the CLI tool itself)
- Claude Code with Opus model access (recommended for best results)

## Design Quality

The Planner and Generator use bundled frontend design principles (derived from Anthropic's [frontend-design skill](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design), Apache 2.0) to produce distinctive, non-generic visual design. The principles cover typography, color, spatial composition, motion, and explicit anti-patterns to avoid.

## Architecture

Inspired by Generative Adversarial Networks (GANs):

- The Generator and Evaluator form an adversarial pair
- The Evaluator is calibrated to be skeptical -- finding issues, not praising work
- Multiple rounds create an improvement loop where critique drives quality
- Separation of generation and evaluation prevents the self-praise bias seen when models judge their own output

Based on: [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Anthropic, 2026), locally available at [research/anthropic-harness-design-for-long-running-application-development.md](../../research/anthropic-harness-design-for-long-running-application-development.md).

## Evaluation Criteria

| Criterion | Threshold | What It Measures |
|-----------|-----------|------------------|
| Product Depth | 7/10 | Feature completeness vs. spec |
| Functionality | 7/10 | Does it actually work when used? |
| Visual Design | 6/10 | Coherent identity, not AI-slop |
| Code Quality | 6/10 | Structure, consistency, maintainability |

## File Protocol

Agents communicate via two files in the working directory:

| File | Writer | Reader | Purpose |
|------|--------|--------|---------|
| `SPEC.md` | Planner | Generator, Evaluator | Product specification |
| `QA-REPORT.md` | Evaluator | Generator (next round) | QA findings and scores |

## License

MIT
