# Agent Instructions

## Repository layout

This repo is a Claude Code plugin marketplace. When users install a plugin,
Claude Code clones the entire repo and loads everything under the plugin's
directory. This means every file inside `plugins/<name>/` is distributed to
users.

### Distributed (installed by users)

```
plugins/<name>/                Everything here ships to users
  .claude-plugin/plugin.json   Plugin manifest (required)
  agents/                      Agent definitions
  commands/                    Slash commands
  skills/                      Skills with references/ and examples/
  README.md                    Plugin documentation
```

Keep these directories clean. Do not add tests, scratch files, editor configs,
build tooling, CI workflows, plans, or research material here. Every file in
a plugin directory becomes part of the installed plugin.

### Not distributed (repo-only)

```
research/                      Background research, article archives
plans/                         Design plans, reviewer feedback
AGENTS.md                      This file (repo-level agent instructions)
CLAUDE.md                      Claude Code session instructions
README.md                      Marketplace landing page
LICENSE                        Repo license
.gitignore                     Git ignore rules
```

These files live at the repo root, outside `plugins/`. They are part of the
repo but are not loaded by Claude Code's plugin system.

### Where to put new files

| Content | Location | Why |
|---------|----------|-----|
| Plugin code (agents, skills, commands) | `plugins/<name>/` | Distributed to users |
| Plugin references and examples | `plugins/<name>/skills/<skill>/references/` or `examples/` | Loaded on demand by the skill |
| Research and article archives | `research/` | Not distributed |
| Design plans and reviewer feedback | `plans/` | Not distributed |
| Tests and benchmarks | repo root (e.g., `tests/`) | Not distributed |
| CI/CD configuration | repo root (e.g., `.github/workflows/`) | Not distributed |
| Editor and tool configs | repo root | Not distributed |
