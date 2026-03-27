# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
lz-development-ai-plugins/
├── plugins/                              # Plugin distributions to users
│   └── application-dev/                  # Autonomous app dev plugin
│       ├── .claude-plugin/
│       │   └── plugin.json               # Plugin manifest
│       ├── agents/                       # Agent definitions (spawned by orchestrator)
│       │   ├── planner.md
│       │   ├── generator.md
│       │   └── evaluator.md
│       ├── commands/                     # User-facing slash commands
│       │   └── application-dev.md
│       ├── skills/                       # Support skills with guides & examples
│       │   ├── application-dev/          # Orchestrator skill + design principles
│       │   │   ├── SKILL.md
│       │   │   └── references/
│       │   │       └── frontend-design-principles.md
│       │   ├── browser-prompt-api/       # Prompt API skill
│       │   │   ├── SKILL.md
│       │   │   ├── examples/
│       │   │   │   └── tool-use.js
│       │   │   └── references/
│       │   │       └── graceful-degradation.md
│       │   ├── browser-webllm/           # WebLLM skill
│       │   │   └── SKILL.md
│       │   └── browser-webnn/            # WebNN skill
│       │       └── SKILL.md
│       └── README.md                     # Plugin documentation
├── research/                             # Not distributed; background material
├── plans/                                # Not distributed; design docs
├── .planning/codebase/                   # GSD analysis outputs
├── AGENTS.md                             # Plugin distribution boundary rules
├── CLAUDE.md                             # Session instructions
├── README.md                             # Marketplace landing page
├── LICENSE                               # MIT license
└── .gitignore
```

## Directory Purposes

**plugins/application-dev/:**
- Purpose: The complete plugin directory; everything here ships to users when they install via Claude Code marketplace
- Contains: Agents, commands, skills, documentation
- Key files: `.claude-plugin/plugin.json` (manifest), `README.md` (plugin docs), agents/*.md, skills/*/SKILL.md
- Boundary: Clean distribution -- no tests, build tools, or research materials inside this directory

**plugins/application-dev/agents/:**
- Purpose: Three specialized agent definitions that execute the GAN-inspired workflow
- Contains: YAML frontmatter (name, description, model, color, tools) + agent prompt instructions
- Key files:
  - `planner.md`: Transforms user prompt into product spec
  - `generator.md`: Builds application from spec
  - `evaluator.md`: QA tests application, writes report with verdict and priority fixes
- Pattern: Each agent is stateless; communication via file I/O (SPEC.md, QA-REPORT.md), not inter-agent calls

**plugins/application-dev/commands/:**
- Purpose: User-facing entry point
- Contains: `application-dev.md` with slash command definition
- Usage: `/application-dev <prompt>` invokes the orchestrator skill

**plugins/application-dev/skills/application-dev/:**
- Purpose: Orchestrator that coordinates agents and manages the build/QA loop
- Contains: `SKILL.md` with workflow logic (Step 1: Plan → Step 2: Build/QA loop → Step 3: Summary)
- Key responsibility: Spawn agents in sequence, read/validate output files, check verdict (PASS/FAIL), decide loop continuation
- Dependencies: `agents/planner.md`, `agents/generator.md`, `agents/evaluator.md`, `references/frontend-design-principles.md`

**plugins/application-dev/skills/application-dev/references/:**
- Purpose: Design guidance bundled with the plugin
- Contains: `frontend-design-principles.md` (derived from Anthropic's frontend-design skill)
- Usage: Planner reads this before writing Visual Design Language section of SPEC.md; Generator reads during implementation

**plugins/application-dev/skills/browser-prompt-api/:**
- Purpose: Implementation guidance for browser's built-in LLM (Gemini Nano on Chrome, Phi-4-mini on Edge)
- Contains:
  - `SKILL.md`: Feature detection, availability checks, session management, structured outputs, streaming, tool use, graceful degradation patterns
  - `examples/tool-use.js`: Code example showing tool-calling with the Prompt API
  - `references/graceful-degradation.md`: Fallback patterns when browser doesn't support API or model unavailable
- Usage: Generator reads when SPEC.md specifies on-device inference requirements

**plugins/application-dev/skills/browser-webllm/:**
- Purpose: Implementation guidance for in-browser LLM inference with WebGPU acceleration
- Contains: `SKILL.md` with WebGPU detection, engine creation, chat completions API, streaming, JSON mode, function calling
- Usage: Generator reads when SPEC.md requires LLM chat/completion (e.g., "DAW assistant", "code helper")
- Models: Llama, Phi, Mistral, Qwen, DeepSeek, Gemma, and others via MLC-AI compilation

**plugins/application-dev/skills/browser-webnn/:**
- Purpose: Implementation guidance for W3C WebNN API neural network inference
- Contains: `SKILL.md` with WebNN graph builder, operator support, NPU/GPU acceleration
- Usage: Generator reads when SPEC.md specifies neural network inference (image classification, audio processing, NLP inference graphs)

**research/:**
- Purpose: Background research, article archives, design inspiration (not distributed to users)
- Contents: Research and reference materials used during plugin development

**plans/:**
- Purpose: Design plans, reviewer feedback, implementation notes (not distributed to users)
- Contents: Planning documents created during development

**.planning/codebase/:**
- Purpose: GSD (Guided Software Development) analysis outputs
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md (as applicable)

## Key File Locations

**Entry Points:**
- `plugins/application-dev/commands/application-dev.md`: User command that starts the entire workflow
- `plugins/application-dev/skills/application-dev/SKILL.md`: Orchestrator that spawns agents and manages the build/QA loop

**Agent Definitions:**
- `plugins/application-dev/agents/planner.md`: Spec generation
- `plugins/application-dev/agents/generator.md`: Application implementation and iterative improvement
- `plugins/application-dev/agents/evaluator.md`: QA testing and bug reporting

**Reference Materials (bundled with plugin):**
- `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md`: Design guidance (read by Planner and Generator)
- `plugins/application-dev/skills/browser-prompt-api/references/graceful-degradation.md`: Prompt API fallback patterns
- `plugins/application-dev/skills/browser-prompt-api/examples/tool-use.js`: Tool-calling code example

**AI Skill Support:**
- `plugins/application-dev/skills/browser-prompt-api/SKILL.md`: On-device LLM guidance
- `plugins/application-dev/skills/browser-webllm/SKILL.md`: WebLLM (MLC-compiled models) guidance
- `plugins/application-dev/skills/browser-webnn/SKILL.md`: WebNN neural network inference guidance

**Plugin Metadata:**
- `plugins/application-dev/.claude-plugin/plugin.json`: Manifest (name, version, description, author, license, keywords, links)
- `plugins/application-dev/README.md`: Plugin documentation (overview, usage examples, prerequisites, architecture explanation)

## Naming Conventions

**Files:**
- Agent definitions: `<agent-name>.md` (planner.md, generator.md, evaluator.md)
- Skills: `SKILL.md` inside skill directory; `<skill-name>/SKILL.md` (browser-prompt-api/SKILL.md)
- References: `<reference-topic>.md` inside `references/` subdirectory
- Examples: `<example-topic>.js` inside `examples/` subdirectory
- Output files (generated at runtime): `SPEC.md`, `QA-REPORT.md`, `README.md` (in generated project)

**Directories:**
- Plugin root: `plugins/<plugin-name>/` (plugins/application-dev/)
- Agents: `agents/` (plural)
- Commands: `commands/` (plural)
- Skills: `skills/` with subdirectories per skill (browser-prompt-api, browser-webllm, browser-webnn)
- Skill internals: `references/`, `examples/` (plural)

**YAML Frontmatter in Agent Definitions:**
- `name`: kebab-case identifier (planner, generator, evaluator)
- `description`: Plain text describing purpose and context
- `model`: "inherit" to use user's selected model
- `color`: UI hint (blue for planner, green for generator, yellow for evaluator)
- `tools`: Array of tools the agent can use (Read, Write, Edit, Glob, Bash, Skill, Agent)

## Where to Add New Code

**New Agent (if expanding the workflow):**
- Create: `plugins/application-dev/agents/<agent-name>.md`
- Add YAML frontmatter with name, description, model, color, tools
- Include detailed instructions for the agent's role
- Update: `plugins/application-dev/skills/application-dev/SKILL.md` to spawn the new agent in the workflow sequence

**New Skill (for additional browser API support or implementation guidance):**
- Create: `plugins/application-dev/skills/<skill-name>/SKILL.md`
- Add YAML frontmatter with name, description, version, compatibility notes
- Include: Feature detection patterns, code examples, graceful degradation guidance
- Optional: Add `references/` subdirectory with detailed reference docs; add `examples/` subdirectory with runnable code examples
- Update: `plugins/application-dev/README.md` to mention the new skill (if user-facing)

**New Reference Material:**
- For design guidance: `plugins/application-dev/skills/application-dev/references/<topic>.md`
- For graceful degradation (browser API): `plugins/application-dev/skills/<skill-name>/references/<topic>.md`
- Pattern: Markdown with actionable, specific guidance (not vague principles)

**New Example Code:**
- Location: `plugins/application-dev/skills/<skill-name>/examples/<example-topic>.js`
- Pattern: Runnable, copy-paste-ready code snippets; include feature detection and error handling
- Audience: Generator agent reading examples to implement AI features

**Changes to Existing Agents:**
- Do NOT modify the workflow sequence (planner → generator → evaluator). The orchestrator depends on this order.
- Modify agent prompts to improve quality/behavior: update instructions, add or remove rules, refine scoring guidance (evaluator)
- DO NOT change agent names or tools without updating the orchestrator skill

## Special Directories

**.claude-plugin/:**
- Purpose: Claude Code plugin manifest directory
- Generated: No; checked in
- Committed: Yes
- Contents: `plugin.json` (metadata)

**agents/, commands/, skills/:**
- Purpose: Plugin distribution boundary; everything here ships to users
- Generated: No; all written by humans during development
- Committed: Yes; all committed to git

**research/, plans/, .planning/:**
- Purpose: Repo-only; not distributed with plugin
- Generated: Partially (GSD analysis writes to .planning/codebase/)
- Committed: Selectively (research and plans may or may not be committed; analysis outputs committed when useful)

## Loading Order

When a user installs the plugin and runs `/application-dev`:

1. Claude Code loads `plugins/application-dev/.claude-plugin/plugin.json` (manifest)
2. Command `application-dev.md` is available as `/application-dev`
3. User invokes `/application-dev "<prompt>"`
4. Command routes to skill `application-dev:application-dev` (orchestrator)
5. Orchestrator skill loads and follows its workflow (Step 1, Step 2, Step 3)
6. Each agent is spawned and executed in context of the current working directory
7. Agents may read reference materials from `skills/*/references/` or examples from `skills/*/examples/`

## File Operations During Execution

**Orchestrator Skill:**
- Reads: `SPEC.md` (after Planner), `QA-REPORT.md` (after each Evaluator run)
- Writes: None (reads and validates only)

**Planner Agent:**
- Reads: `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md`
- Writes: `SPEC.md` (in working directory)

**Generator Agent:**
- Reads: `SPEC.md`, `QA-REPORT.md` (rounds 2+), project files (Glob), build config
- Writes: Project files (package.json, source code, etc.), commits to git
- May read: Skill references if checking AI implementation patterns

**Evaluator Agent:**
- Reads: `SPEC.md`, project files (read-only), runs application via bash
- Writes: `QA-REPORT.md` (only file written by evaluator)
- Interactions: Uses playwright-cli to interact with running app (not direct file I/O)

---

*Structure analysis: 2026-03-27*
