# Technology Stack

**Project:** application-dev plugin v1 hardening
**Researched:** 2026-03-27
**Mode:** Ecosystem research -- Claude Code plugin conventions, agent patterns, skill authoring

## Recommended Stack

This is a Claude Code plugin. It has no build step, no runtime dependencies (except playwright-cli for the Evaluator), and no package.json. The "stack" is the Claude Code plugin component system itself: markdown files with YAML frontmatter, organized by convention.

### Core Framework: Claude Code Plugin System

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Claude Code Plugin System | 1.0.33+ | Plugin runtime | The only framework. Plugins are markdown + JSON discovered by convention from `agents/`, `skills/`, `commands/`, and `.claude-plugin/plugin.json`. No alternatives exist. |
| YAML Frontmatter | N/A | Agent/skill configuration | Declarative metadata (name, description, tools, model) in markdown headers. This is how Claude Code reads agent and skill definitions. |
| Markdown | N/A | System prompts + instructions | Agent body = system prompt. Skill body = instructions. No templating language needed beyond `$ARGUMENTS` and `${CLAUDE_PLUGIN_ROOT}` substitutions. |
| JSON | N/A | Plugin manifest | `.claude-plugin/plugin.json` defines name, version, description, author. Auto-discovery handles the rest. |

### External Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| playwright-cli | Latest | Browser-based QA testing | Evaluator uses it to navigate the running app, take snapshots, screenshots, and interact with UI elements. Only external runtime dependency. Must be on PATH. |

### Supporting Skills (Bundled)

| Skill | Purpose | When Used |
|-------|---------|-----------|
| browser-prompt-api | On-device LLM via LanguageModel API | Generator implements Prompt API features |
| browser-webllm | WebLLM in-browser inference | Generator implements WebLLM features |
| browser-webnn | WebNN neural network inference | Generator implements WebNN features |

## Plugin Component Patterns and Conventions

### plugin.json Manifest

**Confidence: HIGH** (verified with official docs at code.claude.com/docs/en/plugins-reference)

The manifest is optional but recommended. Only `name` is required if present. Current plugin manifest is minimal and correct.

```json
{
  "name": "application-dev",
  "version": "0.1.0",
  "description": "Autonomous application development...",
  "author": { "name": "Lars Gyrup Brink Nielsen" },
  "license": "MIT",
  "keywords": ["application-development", "autonomous", "multi-agent", "gan-inspired"],
  "repository": "https://github.com/LayZeeDK/lz-development-ai-plugins",
  "homepage": "https://github.com/LayZeeDK/lz-development-ai-plugins/tree/main/plugins/application-dev"
}
```

**Recommended addition:** The `version` field drives update detection. If you change code but do not bump version, users on cached installs will not see changes. Use semver -- bump PATCH for fixes, MINOR for new features, MAJOR for breaking changes. The current `0.1.0` is appropriate for pre-stable.

**Supported fields not currently used:**
- `hooks` -- inline hook config or path to `hooks/hooks.json`. Useful for post-tool-use validation.
- `settings.json` -- can set `"agent": "agent-name"` to make an agent the default main thread. Not needed here (the orchestrator is a skill, not an agent).

### Directory Layout

**Confidence: HIGH** (verified with official docs)

Current layout is correct. Critical rule: only `plugin.json` goes inside `.claude-plugin/`. All other directories (`agents/`, `skills/`, `commands/`) must be at the plugin root.

```
plugins/application-dev/
|-- .claude-plugin/
|   '-- plugin.json              # Manifest (only file in this dir)
|-- agents/
|   |-- planner.md               # Planner agent definition
|   |-- generator.md             # Generator agent definition
|   '-- evaluator.md             # Evaluator agent definition
|-- skills/
|   |-- application-dev/
|   |   |-- SKILL.md             # Orchestrator skill
|   |   '-- references/
|   |       '-- frontend-design-principles.md
|   |-- browser-prompt-api/
|   |   |-- SKILL.md
|   |   |-- references/
|   |   '-- examples/
|   |-- browser-webllm/
|   |   '-- SKILL.md
|   '-- browser-webnn/
|       '-- SKILL.md
|-- commands/
|   '-- application-dev.md       # Slash command (thin wrapper)
'-- README.md
```

**Key conventions:**
- Skill folder name = skill name, namespaced as `application-dev:<skill-name>`
- Agent file name = agent name (lowercase, hyphens only), namespaced as `application-dev:<agent-name>`
- Commands in `commands/` are auto-discovered; they create `/application-dev:<command-name>` slash commands
- `commands/` and `skills/` are now unified -- a file in `commands/` and a `skills/<name>/SKILL.md` both create a `/name` shortcut. Skills are preferred for new content because they support directories with reference files.

## Agent Definition Best Practices

### Frontmatter Fields

**Confidence: HIGH** (verified with official docs at code.claude.com/docs/en/sub-agents)

| Field | Required | Current Usage | Recommendation |
|-------|----------|---------------|----------------|
| `name` | Yes | All agents have it | Correct. Lowercase + hyphens only. |
| `description` | Yes | All agents have it with examples | Correct. Include `<example>` blocks for Claude to understand when to delegate. Write in third person for discovery. |
| `model` | No | `inherit` on all agents | Correct for v1. `inherit` uses the parent session's model. Options: `sonnet`, `opus`, `haiku`, `inherit`, or full model ID like `claude-opus-4-6`. |
| `tools` | No | Explicit lists per agent | **Must remain explicit.** Omitting `tools` inherits ALL tools including MCP tools. Explicit allowlists enforce GAN separation of concerns. |
| `disallowedTools` | No | Not used | Alternative to `tools` -- denylist instead of allowlist. For GAN separation, explicit allowlists (`tools`) are clearer and safer. |
| `color` | No | Used (blue/green/yellow) | Cosmetic. Helps visually distinguish agents in the UI. Current color choices are good. |
| `maxTurns` | No | Not set | **Consider adding.** Prevents runaway agents. Generator and Evaluator should have reasonable caps (e.g., 100-200 turns for Generator, 80-100 for Evaluator). |
| `effort` | No | Not set | Options: `low`, `medium`, `high`, `max` (Opus 4.6 only). Could be set per-agent to tune quality vs speed. Default inherits from session. |
| `skills` | No | Not used in agents | **Recommended for Generator.** The `skills` field injects full skill content at agent startup. Generator should preload browser-* skills rather than relying on runtime discovery within a subagent context. Subagents do NOT inherit skills from the parent conversation. |
| `memory` | No | Not used | Enables persistent cross-session learning. Scopes: `user`, `project`, `local`. Not needed for this plugin -- each run is independent. |
| `background` | No | Not used | Set `true` to run concurrently. Not needed -- the orchestrator runs agents sequentially. |
| `isolation` | No | Not used | Set to `worktree` for isolated git worktree. Could benefit Generator to prevent file conflicts but adds complexity. Evaluate for v2. |
| `permissionMode` | No | Not used | **Not supported in plugin agents** for security. Ignored when loading from a plugin. Users must configure permissions separately. |
| `hooks` | No | Not used | **Not supported in plugin agents** for security. Ignored when loading from a plugin. |
| `mcpServers` | No | Not used | **Not supported in plugin agents** for security. Ignored when loading from a plugin. |

### Tool Allowlists: GAN Separation of Concerns

**Confidence: HIGH** (verified with official docs + aligned with GAN architecture principles)

The GAN architecture demands strict role separation. Each agent should have only the tools it needs for its role. The current allowlists and recommended changes:

#### Planner (current: `Read`, `Write`)

```yaml
tools: ["Read", "Write"]
```

**Assessment: Nearly correct, but incomplete.**

- `Read` -- needed to read the design principles reference file
- `Write` -- needed to create SPEC.md
- **Missing: `Bash`** -- The v1 requirements say "Planner commits SPEC.md after generating it." The Planner needs `Bash` for `git add` and `git commit`. Alternatively, do NOT give Planner Bash and have the orchestrator commit after verifying SPEC.md. The latter is safer from a GAN perspective (Planner's role is planning, not git operations).

**Recommendation:** Keep `["Read", "Write"]`. Have the orchestrator handle git commits. This preserves role purity -- the Planner plans, it does not perform side effects beyond writing SPEC.md.

#### Generator (current: `Read`, `Write`, `Edit`, `Glob`, `Bash`)

```yaml
tools: ["Read", "Write", "Edit", "Glob", "Bash"]
```

**Assessment: Correct for the Generator's role.**

- `Read` -- reads SPEC.md, QA-REPORT.md, reference files
- `Write` -- creates source files
- `Edit` -- modifies existing source files
- `Glob` -- finds files in the project
- `Bash` -- runs npm install, dev server, git commits, CI checks
- **Skill tool not listed** -- Generator currently has browser-* skill references inline in its system prompt. Since subagents do NOT inherit skills from the parent, and `Skill` is not in the tools list, the Generator cannot invoke skills at runtime. The current approach (embedding skill references inline) works but is fragile.

**Recommendation:** Add `Skill` to the Generator's tools list OR use the `skills` frontmatter field to preload browser-* skills. The `skills` field is preferred because it injects full content at startup without requiring the Generator to discover and load skills. This is the pattern the official docs recommend for subagents that need domain knowledge.

```yaml
tools: ["Read", "Write", "Edit", "Glob", "Bash"]
skills:
  - application-dev:browser-prompt-api
  - application-dev:browser-webllm
  - application-dev:browser-webnn
```

**What the Generator must NOT have:**
- `Agent` -- cannot spawn sub-subagents (subagents already cannot spawn other subagents, but being explicit is defensive)

#### Evaluator (current: `Read`, `Write`, `Glob`, `Bash`)

```yaml
tools: ["Read", "Write", "Glob", "Bash"]
```

**Assessment: Correct for the Evaluator's role.**

- `Read` -- reads SPEC.md, source code (read-only review)
- `Write` -- creates QA-REPORT.md (and screenshots in qa/round-N/)
- `Glob` -- finds source files for code review
- `Bash` -- runs playwright-cli, curl, dev server, git commands

**What the Evaluator must NOT have:**
- `Edit` -- Evaluator must NEVER modify application source code. This is a core GAN principle. The discriminator does not modify the generator's output. Current allowlist correctly omits Edit.
- `Skill` -- Evaluator has no need for browser-* skills. Those are Generator concerns.

### Model Selection Strategy

**Confidence: MEDIUM** (based on official docs + Anthropic article patterns)

| Agent | Current | Recommendation | Rationale |
|-------|---------|----------------|-----------|
| Planner | `inherit` | `inherit` | Planning benefits from the strongest model available. Opus 4.6 1M produces better specs. Let users choose. |
| Generator | `inherit` | `inherit` | Building a full application is the most demanding task. Needs the strongest model available. |
| Evaluator | `inherit` | `inherit` or `sonnet` | QA testing is less demanding than generation. Sonnet is faster and cheaper. However, rigorous adversarial evaluation benefits from stronger reasoning. Keep `inherit` for v1, consider `sonnet` for v2 cost optimization. |

**Why not hardcode models:** The plugin runs on both Claude Code CLI and Copilot CLI. Users may have different model access. `inherit` respects the user's choice. The Anthropic article achieved best results with Opus 4.6 1M but the plugin should not mandate it.

## Skill Authoring Patterns

### SKILL.md Structure

**Confidence: HIGH** (verified with official best practices at platform.claude.com)

Key principles from official best practices, applied to this plugin:

1. **Concise is key.** The context window is a shared resource. Only add information Claude does not already have. The current orchestrator SKILL.md is ~106 lines -- well within the 500-line guideline.

2. **Progressive disclosure.** SKILL.md is loaded when triggered. Reference files are loaded on demand. The current `references/frontend-design-principles.md` pattern is correct -- it is referenced from agent prompts, not inlined.

3. **One level deep references.** All reference files should link directly from SKILL.md (or agent prompts). Avoid chains where SKILL.md -> file A -> file B. Current structure is correct.

4. **Description is critical for discovery.** The orchestrator skill description is good -- it includes trigger phrases ("build me an app", "create a web application", "make a 2D game maker"). This helps Claude decide when to activate the skill.

5. **`disable-model-invocation`** -- The orchestrator skill should NOT disable model invocation. Claude should automatically recognize "build me an app" prompts and activate the skill. Current behavior is correct (field not set, defaults to false).

### Frontmatter Fields for Skills

**Confidence: HIGH** (verified with official docs at code.claude.com/docs/en/skills)

| Field | Current | Recommendation |
|-------|---------|----------------|
| `name` | `application-dev` | Correct. |
| `description` | Detailed with trigger phrases | Correct. Official docs stress including both what and when. |
| `allowed-tools` | `Agent Read` | **Needs review.** This grants the orchestrator the `Agent` tool (to spawn subagents) and `Read` (to verify SPEC.md, QA-REPORT.md). Missing: `Bash` for git operations if the orchestrator handles commits/tags. |
| `license` | `MIT` | Optional metadata. Fine to include. |
| `compatibility` | Stated | Optional metadata for runtime requirements. |
| `metadata.author` | Stated | Optional. |
| `context` | Not set | Should remain unset. The orchestrator runs inline (not forked) so it can spawn agents. Skills with `context: fork` run in a subagent -- that would break the orchestrator pattern. |

**Critical detail about `allowed-tools` on skills vs agents:**
- On a SKILL.md, `allowed-tools` grants Claude permission to use those tools **without asking** when the skill is active. It does NOT restrict Claude to only those tools.
- On an agent `.md`, `tools` IS an allowlist -- the agent can ONLY use those tools.
- This is an important distinction. The orchestrator skill's `allowed-tools: Agent Read` means Claude auto-approves Agent and Read calls, but could still use other tools if permissions allow. For the orchestrator, this is correct -- it primarily needs Agent (to spawn subagents) and Read (to verify output files).

### Orchestrator Skill: allowed-tools for Agent Spawning

**Confidence: HIGH** (verified with official docs)

The `Agent` tool syntax supports restricting which subagent types can be spawned:

```yaml
allowed-tools: Agent(planner, generator, evaluator) Read
```

This is more defensive than bare `Agent`. It ensures the orchestrator can only spawn the three defined agents, not arbitrary agent types. However, this restriction only applies when the agent runs as the main thread via `--agent`. For a skill, the broader `Agent` permission is appropriate since subagent spawning is already controlled by the agents/ directory contents.

**Current orchestrator spawning syntax** uses `subagent_type: "application-dev:planner"` format. This is the correct namespaced format for plugin agents.

### The Commands Directory: Thin Wrapper Pattern

**Confidence: HIGH** (verified with official docs)

The current `commands/application-dev.md` is a thin wrapper:

```yaml
---
description: Build a complete application autonomously from a short prompt
argument-hint: "<1-4 sentence application description>"
allowed-tools: ["Skill"]
---

/application-dev $ARGUMENTS
```

This is a good pattern. The command delegates to the skill, which has the full logic. The `Skill` tool in `allowed-tools` allows the command to invoke the skill. The `$ARGUMENTS` substitution passes through the user's prompt.

**Why this exists:** Commands create `/application-dev:application-dev` as a user-invokable entry point. The skill `application-dev` is model-invokable (Claude auto-detects when to use it). Having both ensures the plugin works whether the user types a slash command or just describes what they want.

## Plugin Security Constraints

**Confidence: HIGH** (verified with official docs)

Plugin agents have security restrictions that differ from user/project agents:

| Feature | User/Project Agents | Plugin Agents |
|---------|---------------------|---------------|
| `hooks` | Supported | **Ignored** (security) |
| `mcpServers` | Supported | **Ignored** (security) |
| `permissionMode` | Supported | **Ignored** (security) |
| `tools` | Supported | Supported |
| `disallowedTools` | Supported | Supported |
| `model` | Supported | Supported |
| `skills` | Supported | Supported |
| `maxTurns` | Supported | Supported |
| `memory` | Supported | Supported |
| `isolation` | Supported | Supported |

**Implication for v1 hardening:** The orchestrator cannot use hooks to validate agent behavior (e.g., a PreToolUse hook to block the Evaluator from editing files). Tool allowlists are the only enforcement mechanism available in plugin agents. This makes the `tools` field even more critical to get right.

## What NOT to Do

### Anti-Patterns in Plugin Architecture

**Confidence: HIGH** (derived from official docs + testing experience documented in PROJECT.md)

1. **Do NOT omit the `tools` field on agents.** Omitting it means the agent inherits ALL tools, including MCP tools from the user's environment. This violates the GAN separation principle and creates unpredictable behavior. Always use explicit allowlists.

2. **Do NOT put agent/skill/command directories inside `.claude-plugin/`.** Only `plugin.json` goes there. This is the #1 documented mistake in the official docs.

3. **Do NOT use `context: fork` on the orchestrator skill.** Forking runs the skill in a subagent context. Subagents cannot spawn other subagents. The orchestrator MUST run inline to spawn Planner, Generator, and Evaluator.

4. **Do NOT rely on skill auto-discovery in subagents.** Subagents do NOT inherit skills from the parent conversation. If Generator needs browser-* skills, they must be preloaded via the `skills` frontmatter field or referenced inline in the agent's system prompt.

5. **Do NOT give the Evaluator the `Edit` tool.** This violates the GAN discriminator principle. The Evaluator observes and reports; it never modifies the Generator's output.

6. **Do NOT give the Planner `Bash` access unless it needs to commit.** The Planner's role is expanding a prompt into a spec. Side effects (git, npm) should be handled by the orchestrator or Generator. Keep the Planner's tool surface minimal.

7. **Do NOT use `permissionMode`, `hooks`, or `mcpServers` in plugin agent frontmatter.** These are silently ignored for plugin agents. If you need them, document that users should copy the agent to `.claude/agents/` for full functionality. This is a security restriction, not a bug.

8. **Do NOT exceed 500 lines in SKILL.md.** Split detailed content into `references/` files. Claude loads them on demand. The current orchestrator SKILL.md is well within this limit.

9. **Do NOT use Windows-style paths (backslashes) in SKILL.md or agent prompts.** Use forward slashes. The plugin runs cross-platform.

10. **Do NOT use time-sensitive information in skills/agents.** Avoid "if before August 2025, do X." Instead, document the current approach and move deprecated patterns to an "old patterns" section.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Plugin framework | Claude Code plugins | MCP server | Plugins are markdown-native, zero-build, and the only way to bundle agents + skills + commands together. MCP servers are for external tool integration, not agent orchestration. |
| Orchestration | Skill (SKILL.md) | Agent as main thread (`settings.json` `agent` field) | The orchestrator is a task workflow, not a persistent persona. Skills are invoked on demand; agents as main thread replace the entire session behavior. |
| Agent spawning | Sequential (Planner -> Generator -> Evaluator) | Parallel via Agent Teams | The GAN loop is inherently sequential: plan -> build -> evaluate -> iterate. Parallel execution makes no sense for this workflow. Agent Teams add coordination overhead without benefit. |
| Tool restriction | Allowlists (`tools` field) | Denylists (`disallowedTools`) | Allowlists are safer for GAN separation. Denylists require knowing every tool that might exist (including user MCP tools). Allowlists guarantee only intended tools are available. |
| Skill injection | `skills` frontmatter on Generator | Inline references in system prompt | `skills` injects full content at startup, ensuring the Generator has browser-* knowledge in context. Inline `${CLAUDE_PLUGIN_ROOT}/skills/...` references require the Generator to read files during execution, which may fail or be skipped. |
| Model selection | `inherit` for all agents | Hardcoded per agent (e.g., Opus for Planner, Sonnet for Evaluator) | `inherit` respects user choice. Hardcoding locks users out of experimentation. The Anthropic article achieved best results with Opus 4.6 1M, but Sonnet 4.6 200K also works. |

## Key Changes from Current Implementation

Based on this research, the most impactful stack changes for v1 hardening:

1. **Add `skills` frontmatter to Generator** -- Preload browser-* skills so the Generator has them in context from the start.
2. **Add `maxTurns` to all agents** -- Prevent runaway execution. Generator needs the most turns (complex builds), Planner the fewest.
3. **Add `Bash` to orchestrator `allowed-tools`** -- If the orchestrator handles git commits/tags (as specified in requirements), it needs Bash.
4. **Keep Planner tool-lean** -- Do not add Bash to Planner. Orchestrator handles commits.
5. **Consider `Agent(application-dev:planner, application-dev:generator, application-dev:evaluator)` syntax** -- More defensive agent spawning restriction (though less critical for a skill context).

## Sources

### Official Documentation (HIGH confidence)
- [Create plugins -- Claude Code Docs](https://code.claude.com/docs/en/plugins)
- [Plugins reference -- Claude Code Docs](https://code.claude.com/docs/en/plugins-reference)
- [Create custom subagents -- Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Extend Claude with skills -- Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Skill authoring best practices -- Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Security -- Claude Code Docs](https://code.claude.com/docs/en/security)

### Anthropic Engineering (HIGH confidence)
- [Harness Design for Long-Running Apps -- Anthropic Engineering Blog](https://www.anthropic.com/engineering/harness-design-long-running-apps)

### Community and Ecosystem (MEDIUM confidence)
- [Claude Code Sub-Agents: Parallel vs Sequential Patterns](https://claudefa.st/blog/guide/agents/sub-agent-best-practices)
- [Orchestrate teams of Claude Code sessions -- Claude Code Docs](https://code.claude.com/docs/en/agent-teams)
- [30 Tips for Claude Code Agent Teams](https://getpushtoprod.substack.com/p/30-tips-for-claude-code-agent-teams)
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
