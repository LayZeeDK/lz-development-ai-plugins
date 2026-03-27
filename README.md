# LZ Development AI Plugins

A Claude Code plugin marketplace for development workflows.

## Installation

Add this marketplace to Claude Code:

```
claude plugins add-marketplace https://github.com/LayZeeDK/lz-development-ai-plugins
```

Then enable a plugin:

```
claude plugins enable application-dev
```

## Available Plugins

### [application-dev](plugins/application-dev/)

Autonomous application development from a short prompt (1-4 sentences). Uses a GAN-inspired three-agent architecture:

- **Planner** -- expands your prompt into an ambitious product spec
- **Generator** -- builds the full application
- **Evaluator** -- QAs the running app via playwright-cli with adversarial skepticism

Up to 3 build/QA rounds run autonomously without user intervention.

```
/application-dev Create a 2D retro game maker with a level editor, sprite editor, entity behaviors, and a playable test mode.
```

See [plugins/application-dev/README.md](plugins/application-dev/README.md) for full documentation.

## Prerequisites

- Claude Code
- `playwright-cli` on PATH (for the Evaluator agent's browser-based QA)

## License

MIT
