# Phase 1: Orchestrator Integrity - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Enforce GAN role separation so the orchestrator never performs agent work, with structural tool enforcement and resumable workflow state. The orchestrator delegates all work to agents, reads deliverables, updates workflow state, and coordinates the loop. Agents self-verify their own output before handing off.

</domain>

<decisions>
## Implementation Decisions

### Enforcement model
- Two-layer enforcement per agent: tool allowlists (structural) + prompt guards (behavioral)
- Plugin hooks dropped -- they are session-wide, cannot distinguish agents, and would affect all user tool calls even outside the plugin workflow
- No `disallowedTools` available in plugin skill/agent frontmatter -- allowlist-only system
- `allowed-tools` on skills is pre-approval (not strict restriction) -- tools not listed require user approval but are available. Autonomous flow (no user prompts) is the effective enforcement
- ORCH-05 (hooks requirement) and ORCH-06 (four-layer belt-and-suspenders) need revision to match two-layer reality

### GAN boundary principle
- Boundaries are about output domains, not tool access
- Generator and Evaluator both legitimately use playwright-cli (Generator for self-inspection of built app, Evaluator for adversarial QA testing)
- Evaluator needs broad Bash access (tech-stack-agnostic: npm, pip, cargo, curl, kill, git, playwright-cli)
- Generator needs broad Bash access (any tech stack the Generator chooses)

### Tool allowlists per role
- Orchestrator (skill): `Agent Read Write Bash(node *appdev-state*)`
  - Write: workflow state file only (prompt-guarded)
  - Bash: narrow pattern for state CLI script only
  - AskUserQuestion: omitted from `allowed-tools` due to bug #29547 (skills cannot pre-approve AskUserQuestion via allowed-tools). It still works via the normal tool permission path when the orchestrator needs it for error recovery (Retry/Resume/Abort) and resume prompts.
- Planner (agent): `Read, Write` -- reads user prompt, writes SPEC.md
- Generator (agent): `Read, Write, Edit, Glob, Bash` -- broad access, tech-stack-agnostic
- Evaluator (agent): `Read, Write, Glob, Bash` -- broad access, no Edit (read-only for source code)

### Prompt guards per role
- Orchestrator: "Write is ONLY for .appdev-state.json. Never write source code, specs, or QA artifacts. Never diagnose agent output beyond binary file-exists checks."
- Planner: "Only write SPEC.md"
- Generator: "Do not write to qa/ folder or QA-REPORT.md"
- Evaluator: "Never modify the application's source code. Only write QA-REPORT.md and qa/ artifacts"

### Orchestrator binary checks only
- Orchestrator checks: does the expected file exist? Does QA-REPORT.md contain a verdict?
- No qualitative assessment of agent output -- no diagnosis, no prompt stuffing
- On check failure: same-prompt retry (no corrective instructions added)
- Current SKILL.md's "re-spawn with note about what is missing" pattern removed

### Agent self-verification
- Each agent owns its own output quality via inner self-check before completing
- Planner: self-verify SPEC.md against rubric/checklist (has product name, 10+ features with tiers, user journey, constraints, visual design language, AI integration)
- Generator: self-test the running app before handoff (Phase 4 adds full CI checks)
- Evaluator: self-verify QA-REPORT.md has verdict, scores table, and priority fixes section
- This follows the same principle as GEN-01 (Generator CI inner loop) applied to all agents

### Error recovery UX
- Actionable diagnostic: best-effort from whatever the Agent tool error message contains
- Cannot reliably distinguish API rate limit vs subscription budget (both surface as "rate limit")
- Same-prompt retries: 2 automatic retries with fresh context per attempt (GAN/cybernetics/Ralph Loop alignment -- no prompt modification, no diagnosis, no over-correction)
- After retries exhaust: AskUserQuestion with three options:
  - Retry now -- spawns the agent again (unlimited user retries)
  - Resume later -- writes state file, user can `/application-dev` later
  - Abort -- deletes state file, stops, no git rollback (deferred to Phase 2)
- Step-by-step progress output: `[1/3] Planning... done`, `[2/3] Generating (round 1)... done`, `[2/3] Evaluating (round 1)... Score: 24/40 - FAIL`
- Terminology: "Generating" not "Building" (aligns with GAN Generator terminology)

### Workflow state file
- Path: `.appdev-state.json` in working directory
- Committed to git (survives context compaction and session crashes, acts as audit trail)
- Deleted on successful completion and on Abort
- Rich schema from Phase 1 to avoid rework in Phase 2:
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
          "depth": 5, "func": 4,
          "design": 3, "code": 5,
          "total": 17
        },
        "verdict": "FAIL",
        "feature_count": null
      }
    ]
  }
  ```
- Updated by orchestrator after every agent completes (fine-grained resume)
- Agents do NOT read or write the state file -- orchestrator-only bookkeeping
- On resume: orchestrator reads state, shows original prompt, asks Resume/Start fresh

### State CLI script
- Bundled in plugin at `scripts/appdev-state.cjs`
- Provides structured read/write interface to state JSON (prevents hand-editing errors)
- Orchestrator calls via `Bash(node *appdev-state*)` pattern
- Analogous to GSD's `gsd-tools.cjs` pattern

### Resume behavior
- On `/application-dev`, orchestrator checks for `.appdev-state.json`
- If found: shows completed work + original prompt, asks Resume or Start fresh
- Resume: skips completed steps, spawns the next agent with its normal prompt
- Start fresh: deletes state file, starts from Planner
- Agents don't know they're in a resumed run -- same prompts as a normal run

### Claude's Discretion
- Exact state CLI script command interface (subcommands, flags, output format)
- Error message formatting and wording
- Progress output formatting details
- State file JSON schema field names and nesting

</decisions>

<specifics>
## Specific Ideas

- "Generating" not "Building" for progress output -- GAN Generator terminology
- State CLI script modeled on GSD's `gsd-tools.cjs` pattern
- Agent self-verification follows the same principle as GEN-01 (Generator CI inner loop) generalized to all agents
- Cybernetics damping principle for retries: don't over-correct, don't stuff prompts with failure context
- Ralph Loop principle: fresh context on each retry, no context pollution

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Orchestrator SKILL.md: existing workflow structure (Plan, Build/QA Loop, Summary) provides the skeleton for adding state management and error recovery
- Command wrapper (application-dev.md): thin passthrough with `allowed-tools: ["Skill"]`, no changes needed
- Agent definitions (planner.md, generator.md, evaluator.md): existing tool lists need updating per decisions above

### Established Patterns
- File-based communication: SPEC.md and QA-REPORT.md already serve as inter-agent protocol
- Agent spawning: `Agent(subagent_type: "application-dev:<role>", prompt: "...")` pattern established
- `${CLAUDE_PLUGIN_ROOT}` for referencing plugin-bundled files (used in agent prompts for skill references)

### Integration Points
- SKILL.md: add state management, error recovery with AskUserQuestion, binary checks, progress output
- SKILL.md allowed-tools: expand from `Agent Read` to `Agent Read Write Bash(node *appdev-state*)`
- Agent frontmatter: update tool lists and add prompt guards
- New file: `scripts/appdev-state.cjs` for state CLI
- Plugin directory: add `scripts/` folder

</code_context>

<deferred>
## Deferred Ideas

- Abort-with-git-rollback -- Phase 2 (requires milestone tags from GIT-05)
- `/application-dev:resume` command -- explicit resume entry point, future enhancement
- `/application-dev:pause` command -- deliberate pause with state save, future enhancement
- ORCH-05 revision (drop hooks requirement) -- address during planning
- ORCH-06 revision (two-layer belt-and-suspenders, not four) -- address during planning

</deferred>

---

*Phase: 01-orchestrator-integrity*
*Context gathered: 2026-03-28*
