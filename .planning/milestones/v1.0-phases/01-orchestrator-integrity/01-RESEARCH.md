# Phase 1: Orchestrator Integrity - Research

**Researched:** 2026-03-28
**Domain:** Claude Code plugin architecture -- skill orchestration, agent spawning, tool enforcement, workflow state management
**Confidence:** MEDIUM (platform bugs introduce uncertainty around AskUserQuestion and Agent tool error reporting)

## Summary

This phase modifies the `application-dev` plugin's orchestrator skill (SKILL.md) and agent definitions (planner.md, generator.md, evaluator.md) to enforce GAN role separation, add error recovery with retries, and introduce a resumable workflow state file. The primary implementation surface is markdown frontmatter and prose -- no compiled code -- plus a new CJS script for state file management.

The Claude Code plugin system provides the primitives needed: `allowed-tools` on skills for pre-approval scoping, `tools` and `disallowedTools` on agents for capability restriction, `${CLAUDE_PLUGIN_ROOT}` for referencing bundled scripts, and the Agent tool for spawning subagents. Two platform bugs affect the design: (1) AskUserQuestion silently auto-completes when listed in skill `allowed-tools` (workaround exists), and (2) the Agent tool may report false failures due to a `classifyHandoffIfNeeded` bug (workaround: binary file-exists checks instead of trusting agent status).

**Primary recommendation:** Implement two-layer enforcement (tool allowlists + prompt guards) per the CONTEXT.md decisions, use the AskUserQuestion workaround (omit from `allowed-tools`), and design the orchestrator's agent-completion checks as binary file-exists verifications that don't depend on the Agent tool's success/failure status.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two-layer enforcement per agent: tool allowlists (structural) + prompt guards (behavioral)
- Plugin hooks dropped -- session-wide scope cannot distinguish agents
- No `disallowedTools` available in plugin skill frontmatter -- allowlist-only for the orchestrator skill
- `allowed-tools` on skills is pre-approval (not strict restriction) -- autonomous flow is the effective enforcement
- ORCH-05 (hooks requirement) and ORCH-06 (four-layer belt-and-suspenders) need revision to match two-layer reality
- Boundaries are about output domains, not tool access
- Generator and Evaluator both legitimately use broad Bash access (tech-stack-agnostic)
- Orchestrator tool allowlist: `Agent Read Write AskUserQuestion Bash(node *appdev-state*)`
- Planner tools: `Read, Write`
- Generator tools: `Read, Write, Edit, Glob, Bash`
- Evaluator tools: `Read, Write, Glob, Bash` (no Edit -- read-only for source code)
- Prompt guards per role (Orchestrator: Write only for state file; Planner: only SPEC.md; Generator: no qa/ folder; Evaluator: never modify source)
- Binary checks only -- orchestrator checks file existence and verdict presence, no qualitative assessment
- Same-prompt retries: 2 automatic retries with fresh context per attempt, no prompt modification
- After retries exhaust: AskUserQuestion with Retry/Resume/Abort options
- State file at `.appdev-state.json`, committed to git, deleted on completion/abort
- State CLI script at `scripts/appdev-state.cjs`
- Agent self-verification: each agent owns its output quality via inner self-check
- Step-by-step progress output: `[1/3] Planning... done`, etc.

### Claude's Discretion
- Exact state CLI script command interface (subcommands, flags, output format)
- Error message formatting and wording
- Progress output formatting details
- State file JSON schema field names and nesting

### Deferred Ideas (OUT OF SCOPE)
- Abort-with-git-rollback -- Phase 2 (requires milestone tags from GIT-05)
- `/application-dev:resume` command -- future enhancement
- `/application-dev:pause` command -- future enhancement
- ORCH-05 revision (drop hooks requirement) -- address during planning
- ORCH-06 revision (two-layer not four) -- address during planning
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORCH-01 | Orchestrator must never perform agent work -- only delegate, read output, coordinate | Prompt guards in SKILL.md + binary file-exists checks (no qualitative assessment) + same-prompt retries (no corrective instructions) |
| ORCH-02 | Agent spawn failure: retry up to 2 times then error out with diagnostic | Agent tool error handling + AskUserQuestion for user-facing recovery options after retry exhaustion |
| ORCH-03 | Orchestrator only passes to agents what SKILL.md describes -- no context leakage | Agent prompts contain only what SKILL.md specifies; orchestrator does not inject extra diagnostics or context |
| ORCH-04 | Tool allowlists audited and tightened per agent role (GAN separation) | Agent `tools` frontmatter field + skill `allowed-tools` field; two-layer enforcement documented |
| ORCH-05 | Plugin-level hooks enforce GAN role boundaries | **REVISED**: Hooks dropped per CONTEXT.md decision -- session-wide hooks cannot distinguish agents. Two-layer enforcement replaces four-layer |
| ORCH-06 | Belt-and-suspenders tool restriction (four layers) | **REVISED**: Two layers only (allowlists + prompt guards). `disallowedTools` not available on skills; hooks dropped |
| ORCH-07 | Workflow state file for resume after interruptions | `.appdev-state.json` + `scripts/appdev-state.cjs` CLI + resume logic in orchestrator SKILL.md |
</phase_requirements>

## Standard Stack

### Core
| Component | Version/Format | Purpose | Why Standard |
|-----------|---------------|---------|--------------|
| SKILL.md (markdown) | YAML frontmatter + markdown | Orchestrator logic, tool allowlist, workflow instructions | Claude Code skill format -- the only way to define orchestrator behavior |
| Agent definitions (.md) | YAML frontmatter + markdown | Agent capabilities, tool restrictions, system prompts | Claude Code agent format for plugin-shipped subagents |
| `appdev-state.cjs` | Node.js CJS | State file read/write CLI | CJS for broadest compatibility; pattern from GSD `gsd-tools.cjs` |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `${CLAUDE_PLUGIN_ROOT}` | Reference bundled scripts from skill/agent content | When orchestrator calls the state CLI via `Bash(node *appdev-state*)` |
| `JSON` state file | Workflow state persistence | `.appdev-state.json` in working directory -- committed to git for crash recovery |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CJS script for state | Direct JSON read/write in SKILL.md prose | Script prevents hand-editing errors, provides structured interface, matches GSD pattern |
| Git-committed state file | Non-committed temp file | Committed file survives context compaction and session crashes; acts as audit trail |
| Plugin hooks for enforcement | Two-layer (allowlists + prompts) | Hooks are session-wide, cannot distinguish agents -- dropped per CONTEXT.md decision |

## Architecture Patterns

### Plugin Directory Structure (After Phase 1)
```
plugins/application-dev/
|-- .claude-plugin/plugin.json
|-- commands/application-dev.md        (unchanged)
|-- skills/
|   '-- application-dev/
|       |-- SKILL.md                   (MODIFIED: state mgmt, error recovery, progress output)
|       '-- references/
|           '-- frontend-design-principles.md  (unchanged)
|-- agents/
|   |-- planner.md                     (MODIFIED: tools, prompt guard, self-verification)
|   |-- generator.md                   (MODIFIED: tools, prompt guard, self-verification)
|   '-- evaluator.md                   (MODIFIED: tools, prompt guard, self-verification)
|-- scripts/
|   '-- appdev-state.cjs              (NEW: state CLI script)
|-- skills/browser-prompt-api/         (unchanged)
|-- skills/browser-webllm/             (unchanged)
|-- skills/browser-webnn/              (unchanged)
'-- README.md
```

### Pattern 1: Two-Layer Enforcement (Structural + Behavioral)

**What:** Each role gets a tool allowlist (structural layer) and prompt guard (behavioral layer). The structural layer prevents tool access; the behavioral layer prevents misuse of allowed tools.

**When to use:** Every agent and the orchestrator skill.

**Layer 1 -- Tool Allowlists:**

For agents, use the `tools` frontmatter field (strict allowlist):
```yaml
# agents/evaluator.md frontmatter
---
name: evaluator
tools: Read, Write, Glob, Bash
---
```

For the orchestrator skill, use `allowed-tools` (pre-approval, not strict -- but autonomous flow makes it effectively strict):
```yaml
# skills/application-dev/SKILL.md frontmatter
---
allowed-tools: Agent Read Write Bash(node *appdev-state*)
---
```

**Layer 2 -- Prompt Guards:**

In the markdown body of each file, add explicit constraints:
```markdown
## Rules
1. **Write is ONLY for .appdev-state.json.** Never write source code, specs, or QA artifacts.
2. **Never diagnose agent output** beyond binary file-exists checks.
3. **Never add corrective instructions** to agent prompts on retry.
```

Source: [Claude Code Skills docs](https://code.claude.com/docs/en/skills), [Subagents docs](https://code.claude.com/docs/en/sub-agents)

### Pattern 2: Binary File-Exists Checks (No Qualitative Assessment)

**What:** After each agent completes, the orchestrator checks only: (a) does the expected file exist? (b) does it contain the expected structural marker (e.g., "## Verdict" in QA-REPORT.md)?

**When to use:** After every agent spawn returns.

**Why:** Prevents the orchestrator from sliding into doing agent work (reading, diagnosing, or improving agent output). Also works around the `classifyHandoffIfNeeded` bug where the Agent tool reports false failures.

**Example:**
```markdown
After the Planner completes, verify:
1. Read `SPEC.md` -- does the file exist?
2. Does it contain "## Features"?

If either check fails, retry the Planner with the same prompt (no modifications).
Do NOT read the spec to assess quality -- the Planner self-verifies.
```

### Pattern 3: State CLI Script Pattern

**What:** A CJS script that provides a structured read/write interface to the JSON state file, called from SKILL.md via `Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs ...)`.

**When to use:** Every time the orchestrator reads or updates workflow state.

**Example interface (Claude's discretion on exact design):**
```bash
# Initialize state for a new run
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs init --prompt "Build me a DAW"

# Read current state
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs get

# Update after agent completion
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs update --step evaluate --round 1

# Record round results
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs round-complete --round 1 --verdict FAIL --scores '{"depth":5,"func":4,"design":3,"code":5,"total":17}'

# Mark complete
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs complete --exit-condition PASS

# Delete state (abort or completion)
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs delete
```

The script reads/writes `.appdev-state.json` in the current working directory. All output is JSON for easy parsing by the orchestrator.

### Pattern 4: AskUserQuestion Workaround

**What:** AskUserQuestion must NOT be listed in the skill's `allowed-tools` frontmatter. When omitted, it goes through the normal permission path where `requiresUserInteraction()` is respected and the UI renders correctly.

**When to use:** In the orchestrator SKILL.md -- include AskUserQuestion in the prose instructions but NOT in `allowed-tools`.

**Critical bug:** [Issue #29547](https://github.com/anthropics/claude-code/issues/29547) -- AskUserQuestion silently auto-completes with empty answers when listed in skill `allowed-tools`. Closed as completed but fix status uncertain in v2.1.86.

**Workaround confirmed by multiple users:**
```yaml
# DO THIS:
allowed-tools: Agent Read Write Bash(node *appdev-state*)
# AskUserQuestion is intentionally omitted -- it will still work via normal permission path

# DO NOT DO THIS:
# allowed-tools: Agent Read Write AskUserQuestion Bash(node *appdev-state*)
```

Source: [Issue #29547](https://github.com/anthropics/claude-code/issues/29547), [workaround comment](https://github.com/anthropics/claude-code/issues/29547#issuecomment-3976741510)

### Anti-Patterns to Avoid
- **Orchestrator diagnoses agent output:** Reading agent output to assess quality, then adding corrective instructions to retries. This violates ORCH-01 and causes prompt stuffing.
- **Listing AskUserQuestion in skill allowed-tools:** Triggers bug #29547, silently auto-completing with empty answers.
- **Using hooks for per-agent enforcement:** Hooks fire for ALL tool calls in the session, not just the skill's. Cannot distinguish which agent is calling.
- **Trusting Agent tool success/failure status:** The `classifyHandoffIfNeeded` bug may report false failures. Use file-exists checks instead.
- **Nesting agent spawns:** Subagents cannot spawn sub-sub-agents. The orchestrator (skill) spawns agents; agents cannot delegate further.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State file read/write | Inline JSON manipulation in SKILL.md prose | `appdev-state.cjs` CLI script | Prevents JSON syntax errors from hand-editing; provides structured interface; matches GSD pattern |
| Tool restriction on agents | Complex prompt-only enforcement | Agent `tools` frontmatter field | Structural enforcement via Claude Code's built-in system; prompts alone are unreliable |
| Plugin file referencing | Hardcoded paths | `${CLAUDE_PLUGIN_ROOT}` variable | Path changes on plugin update; variable is substituted automatically in skill/agent content |
| Session-start dependency install | Manual instructions | Plugin hooks (`SessionStart`) with `${CLAUDE_PLUGIN_DATA}` | Automatic; survives plugin updates; recommended pattern from official docs |

**Key insight:** The Claude Code plugin system provides structural enforcement primitives (tool allowlists, agent frontmatter). Use them as the first defense layer. Prompt guards are the second layer for scoping within allowed tools (e.g., "Write only to .appdev-state.json").

## Common Pitfalls

### Pitfall 1: AskUserQuestion Silent Auto-Complete
**What goes wrong:** AskUserQuestion returns immediately with empty answers when listed in skill `allowed-tools`. The user never sees the prompt UI.
**Why it happens:** The `alwaysAllowRules` early return in the permission evaluator bypasses `requiresUserInteraction()` check.
**How to avoid:** Do NOT list AskUserQuestion in the skill's `allowed-tools` frontmatter. Omit it entirely -- the tool still works via the normal permission path.
**Warning signs:** The orchestrator proceeds with empty user input; state file gets deleted or workflow continues without user choice.

### Pitfall 2: Agent Tool False Failure Reports
**What goes wrong:** The Agent tool reports `<status>failed</status>` even though the agent's work completed successfully.
**Why it happens:** A `classifyHandoffIfNeeded` function is referenced but not defined in some Claude Code versions ([Issue #24181](https://github.com/anthropics/claude-code/issues/24181)). The error occurs AFTER all agent tool calls complete.
**How to avoid:** Never rely on Agent tool status alone. Always perform binary file-exists checks after agent completion. If expected files exist, treat the agent as successful regardless of reported status.
**Warning signs:** Agents produce correct output but the orchestrator treats them as failed and retries unnecessarily.

### Pitfall 3: Orchestrator Slides Into Agent Work
**What goes wrong:** The orchestrator reads agent output, diagnoses issues, adds corrective instructions to retry prompts, or starts doing agent work when retries fail.
**Why it happens:** Natural language instructions are soft boundaries. Without explicit constraints, the model defaults to being "helpful" by trying to fix problems.
**How to avoid:** (1) Binary checks only -- file exists? verdict present? (2) Same-prompt retries -- no modifications. (3) Explicit prompt guard: "Never diagnose agent output beyond binary file-exists checks."
**Warning signs:** Orchestrator output contains detailed analysis of agent work quality; retry prompts differ from original prompts.

### Pitfall 4: Context Leakage Into Agent Prompts
**What goes wrong:** The orchestrator passes extra context (error messages, previous round details, its own analysis) into agent spawn prompts beyond what SKILL.md specifies.
**Why it happens:** The model infers that more context = better results and adds helpful information.
**How to avoid:** Define exact agent prompt templates in SKILL.md. The orchestrator fills in only the specified variables (round number, file names). No free-form additions.
**Warning signs:** Agent prompts contain phrases not in the SKILL.md templates; agents receive information about other agents' failures.

### Pitfall 5: State File Schema Rework in Phase 2
**What goes wrong:** The state file schema designed in Phase 1 needs breaking changes when Phase 2 adds score tracking, plateau detection, and exit conditions.
**Why it happens:** Phase 1 only needs step/round tracking; Phase 2 needs full round history with scores.
**How to avoid:** Design the rich schema from Phase 1 (as specified in CONTEXT.md). Include `rounds[]` array with scores, verdicts, and feature counts even though Phase 1 only uses step/round/status fields. The state CLI script handles the schema.
**Warning signs:** Phase 2 planning discovers the state file needs migration.

### Pitfall 6: Plugin Agent Security Restrictions
**What goes wrong:** Attempting to use `hooks`, `mcpServers`, or `permissionMode` in plugin-shipped agent definitions.
**Why it happens:** These fields work for user-level and project-level agents but are silently ignored for plugin agents.
**How to avoid:** Only use supported plugin agent frontmatter fields: `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `isolation`.
**Warning signs:** Hook-based enforcement expected to work on agents silently does nothing.

## Code Examples

### Agent Frontmatter with Tool Restriction (Evaluator)
```yaml
# Source: Claude Code subagents docs (https://code.claude.com/docs/en/sub-agents)
---
name: evaluator
description: |
  Use this agent to QA test a running application against its product specification.
  Spawned by the application-dev orchestrator skill.
model: inherit
color: yellow
tools: Read, Write, Glob, Bash
---
```
Note: `Edit` is removed from the Evaluator's tools (was previously included implicitly). This structurally prevents the Evaluator from modifying source code.

### Skill Frontmatter with Scoped Bash Access
```yaml
# Source: Claude Code skills docs (https://code.claude.com/docs/en/skills)
---
name: application-dev
allowed-tools: Agent Read Write Bash(node *appdev-state*)
---
```
Note: `Bash(node *appdev-state*)` allows only node commands containing "appdev-state" in the argument. AskUserQuestion is intentionally omitted (see Pitfall 1).

### State File Schema (Rich from Phase 1)
```json
{
  "prompt": "<original user prompt>",
  "step": "generate",
  "round": 2,
  "status": "in_progress",
  "exit_condition": null,
  "rounds": [
    {
      "round": 1,
      "generator": "complete",
      "evaluator": "complete",
      "scores": {
        "depth": 5,
        "func": 4,
        "design": 3,
        "code": 5,
        "total": 17
      },
      "verdict": "FAIL",
      "feature_count": null
    }
  ]
}
```
Source: CONTEXT.md decisions.

### Bundled Script Reference Pattern
```markdown
<!-- In SKILL.md body -->
To read the current workflow state:
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.cjs get)
```
Source: [Plugins reference](https://code.claude.com/docs/en/plugins-reference) -- `${CLAUDE_PLUGIN_ROOT}` is substituted inline in skill content.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Task tool | Agent tool | Claude Code v2.1.63 (Feb 2026) | Same functionality, renamed. `Task(...)` still works as alias |
| `allowed-tools` bug (#18837) | Fixed | Jan 2026 | `allowed-tools` in skills now enforced as pre-approval |
| AskUserQuestion in skills broken (#29547) | Workaround: omit from allowed-tools | Closed Mar 2 2026, fix status unclear | Must use workaround |
| Four-layer enforcement (allowlist + denylist + prompts + hooks) | Two-layer (allowlist + prompts) | CONTEXT.md decision | Hooks dropped (session-wide); `disallowedTools` not on skills |

**Deprecated/outdated:**
- `Task(...)` syntax: still works but `Agent(...)` is current name
- Plugin hooks for per-agent enforcement: hooks fire session-wide, cannot scope to individual agents
- `disallowedTools` on skills: not available in skill frontmatter (only on agents)

## Open Questions

1. **AskUserQuestion fix status in v2.1.86**
   - What we know: Bug #29547 closed as COMPLETED on March 2, 2026. Users reported it still broken in v2.1.68 and v2.1.69. Current version is v2.1.86.
   - What's unclear: Whether the fix actually shipped. The workaround (omit from `allowed-tools`) works reliably.
   - Recommendation: Use the workaround regardless. It's safe even if the bug is fixed -- AskUserQuestion will just require a one-time permission approval instead of being pre-approved.

2. **AskUserQuestion unavailable in sub-agents (#34592)**
   - What we know: AskUserQuestion is completely absent from sub-agent (Agent tool) contexts. The orchestrator is a skill, not a sub-agent, so this shouldn't affect us directly.
   - What's unclear: Whether there are edge cases where the skill-invoked AskUserQuestion fails.
   - Recommendation: The orchestrator skill runs in the main conversation context (not forked). AskUserQuestion should work. Test during implementation.

3. **Agent tool `classifyHandoffIfNeeded` false failures**
   - What we know: Bug #24181 caused Agent tool to always report "failed" status. Closed as NOT_PLANNED (inactivity). May be fixed in v2.1.86.
   - What's unclear: Current status. The bug occurs AFTER agent work completes, so work is not lost.
   - Recommendation: Design around it. Binary file-exists checks determine success, not Agent tool status. This is already the CONTEXT.md design.

4. **`Bash(node *appdev-state*)` glob matching**
   - What we know: The glob pattern `*appdev-state*` should match any Bash command containing "appdev-state" in its arguments. Shell operators (&&, ||) are blocked by Claude Code's pattern matching.
   - What's unclear: Whether `${CLAUDE_PLUGIN_ROOT}` substitution happens before or after glob matching. If before, the full path is in the command and `*appdev-state*` still matches. If after, the literal `${CLAUDE_PLUGIN_ROOT}` would need to match.
   - Recommendation: Test the exact pattern during implementation. Fallback: use `Bash(node *)` with a prompt guard restricting to state CLI only.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (plugin behavior testing) |
| Config file | none -- plugin modifications are markdown/CJS, not a test-framework project |
| Quick run command | `claude --plugin-dir ./plugins/application-dev --print "test state CLI"` |
| Full suite command | Manual: run `/application-dev` with test prompt, verify state file, error recovery, and resume |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORCH-01 | Orchestrator never performs agent work | manual | Inspect orchestrator behavior during `/application-dev` run | N/A |
| ORCH-02 | Agent failure: 2 retries then error out | manual | Simulate API failure (rate limit), verify retry count + AskUserQuestion prompt | N/A |
| ORCH-03 | No context leakage into agent prompts | manual | Review agent prompts in transcript for unexpected context | N/A |
| ORCH-04 | Tool allowlists per agent role | smoke | `node scripts/appdev-state.cjs get` (verify CJS runs); inspect agent frontmatter | No Wave 0 |
| ORCH-05 | Hooks enforcement (REVISED: dropped) | N/A | Requirement revised -- two-layer enforcement replaces hooks | N/A |
| ORCH-06 | Four-layer (REVISED: two-layer) | manual | Verify agent `tools` field + prompt guards in each file | N/A |
| ORCH-07 | Workflow state file for resume | smoke | `node scripts/appdev-state.cjs init --prompt "test" && node scripts/appdev-state.cjs get` | No Wave 0 |

### Sampling Rate
- **Per task commit:** Verify modified files parse correctly (YAML frontmatter, CJS syntax)
- **Per wave merge:** Run state CLI script commands manually; verify SKILL.md reads coherently
- **Phase gate:** Full manual test: `/application-dev "Build a todo app"` -- verify state file creation, progress output, and resume behavior

### Wave 0 Gaps
- [ ] `scripts/appdev-state.cjs` -- new file, covers ORCH-07 state management
- [ ] Verify `Bash(node *appdev-state*)` glob pattern works with `${CLAUDE_PLUGIN_ROOT}` substitution
- [ ] Verify AskUserQuestion works from skill context without being in `allowed-tools`

## Sources

### Primary (HIGH confidence)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) -- plugin structure, `${CLAUDE_PLUGIN_ROOT}`, hooks, agent/skill configuration
- [Claude Code Subagents docs](https://code.claude.com/docs/en/sub-agents) -- agent frontmatter fields (`tools`, `disallowedTools`), plugin agent security restrictions, spawning behavior
- [Claude Code Skills docs](https://code.claude.com/docs/en/skills) -- `allowed-tools` behavior, skill frontmatter

### Secondary (MEDIUM confidence)
- [Issue #29547](https://github.com/anthropics/claude-code/issues/29547) -- AskUserQuestion bug in skills, workaround confirmed by multiple users
- [Issue #34592](https://github.com/anthropics/claude-code/issues/34592) -- AskUserQuestion unavailable in sub-agents (open)
- [Issue #24181](https://github.com/anthropics/claude-code/issues/24181) -- Agent tool `classifyHandoffIfNeeded` false failures
- [Issue #18837](https://github.com/anthropics/claude-code/issues/18837) -- `allowed-tools` enforcement bug (fixed Jan 2026)

### Tertiary (LOW confidence)
- Agent tool error message format -- no official documentation found; behavior inferred from issue reports
- `Bash()` glob matching with `${CLAUDE_PLUGIN_ROOT}` substitution order -- not documented; needs runtime testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- plugin system well-documented, file formats stable
- Architecture: MEDIUM -- two-layer enforcement is sound but AskUserQuestion and Agent tool bugs add uncertainty
- Pitfalls: HIGH -- bugs are well-documented with known workarounds
- State CLI: MEDIUM -- CJS script pattern is proven (GSD), but glob matching for `Bash(node *appdev-state*)` needs runtime validation

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (30 days -- plugin system is stable; bug fixes may change AskUserQuestion status)
