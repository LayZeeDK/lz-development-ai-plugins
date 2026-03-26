# lz-development-ai-plugins

Reusable AI plugin assets for local development workflows, including the `application-dev` plugin for Claude Code and GitHub Copilot CLI.

## Clone this repository

```powershell
git clone https://github.com/LayZeeDK/lz-development-ai-plugins.git
Set-Location .\lz-development-ai-plugins
```

## Use with GitHub Copilot CLI

The `application-dev` plugin bundles:

- the skill and command files under `plugins\application-dev`
- Copilot custom agents under `plugins\application-dev\.github\agents`

Run Copilot CLI from the repository root and point it at the plugin directory:

```powershell
copilot --plugin-dir .\plugins\application-dev
```

If you want to use this plugin from another working directory, pass the full path to the cloned plugin directory instead:

```powershell
copilot --plugin-dir C:\path\to\lz-development-ai-plugins\plugins\application-dev
```

## Example prompts

Inside Copilot CLI, you can use the application development workflow like this:

```text
/application-dev Build a fully featured DAW in the browser using the Web Audio API.
```

The browser-local AI skill is also available through the same plugin directory:

```text
/application-dev:browser-local-llm
```

## Notes

- `playwright-cli` must be available on `PATH` for the application evaluator workflow.
- The Generator guidance is intentionally in-browser only for AI features, using the browser Prompt API first and considering `WebLLM` or `WebNN` when needed.
