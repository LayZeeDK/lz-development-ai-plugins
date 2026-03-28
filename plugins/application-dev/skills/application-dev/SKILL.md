---
name: application-dev
description: >-
  Build a complete application autonomously from a short prompt. Use this skill
  whenever the user wants to create a web app, build an application, make a
  game, develop a full-stack project, or generate a complete working product
  from a description. Handles requests like "build me an app that does X",
  "create a web application for Y", "make a 2D game maker", or "develop a
  DAW in the browser". Orchestrates three agents (Planner, Generator,
  Evaluator) in an adversarial build/QA loop with workflow state management,
  error recovery, and resumable execution. Runs without user intervention
  after the initial prompt.
license: MIT
compatibility: >-
  Requires playwright-cli on PATH for browser-based QA testing.
  Sub-agents loaded from the plugin's agents/ directory.
metadata:
  author: Lars Gyrup Brink Nielsen
allowed-tools: Agent Read Write Bash(node *appdev-state*)
---

# Autonomous Application Development

Build a complete application from the user's prompt using three specialized
agents in an adversarial loop inspired by GANs.

## Architecture

- **Planner**: Expands the user's prompt into an ambitious product specification
- **Generator**: Builds the full application from the spec (like a GAN generator)
- **Evaluator**: Critiques the running app with skepticism (like a GAN discriminator)

The Generator and Evaluator form an adversarial pair: the Evaluator's honest
critique drives the Generator to improve, just as a GAN discriminator's feedback
drives the generator to produce better outputs. Separating generation from
evaluation prevents the self-praise bias that occurs when a model evaluates its
own work.

Each agent has a structural tool allowlist (frontmatter `tools` field) and
behavioral prompt guards (output-domain constraints in its instructions). This
two-layer enforcement replaces the originally-planned four-layer design --
plugin hooks were dropped because they are session-wide and cannot distinguish
agents.

## Enforcement Model

Role boundaries are enforced through two complementary layers:

**Layer 1: Tool allowlists** (structural enforcement)
- Agent `tools` frontmatter is a strict restriction -- agents cannot use tools
  outside their list. This is enforced by the runtime.
- Skill `allowed-tools` is pre-approval -- tools listed here are available
  without user confirmation. In autonomous flow (no user prompts between
  steps), this is effectively a strict restriction because there is no user
  to approve unlisted tools.

**Layer 2: Prompt guards** (behavioral enforcement)
- Each agent's instructions contain explicit output-domain constraints:
  - Planner: "You may only write SPEC.md in the working directory"
  - Generator: "Do not write to the qa/ folder or QA-REPORT.md"
  - Evaluator: "Never modify the application's source code. Only write
    QA-REPORT.md and qa/ artifacts"
  - Orchestrator (this skill): "Write is ONLY for .appdev-state.json" (see
    Rules below)

**What is NOT available:**
- `disallowedTools` is not a supported field on skills or agents
- Plugin hooks were dropped -- they apply session-wide and cannot distinguish
  between agents, making per-role enforcement impossible

## Rules

1. **Write is ONLY for .appdev-state.json.** Never write source code, specs,
   QA artifacts, or any other files.
2. **Never diagnose agent output beyond binary file-exists checks.** Do not
   read agent output to assess quality, completeness, or correctness.
3. **Never add corrective instructions to agent prompts on retry.** Use the
   exact same prompt for retries as the original spawn.
4. **Never perform agent work.** If an agent fails and retries are exhausted,
   ask the user -- do not attempt the agent's task yourself.
5. **Fully autonomous after initial prompt.** Do not ask the user for feedback
   during the workflow except for error recovery (retry exhaustion).
6. **All agents work in the current working directory.** Do not create a
   separate project directory -- let the Generator organize the project as it
   sees fit.

## Workflow

Execute these steps in order. Do not deviate from this sequence.

### Step 0: Resume Check

Check for an existing workflow state file:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs exists)
```

- If `{"exists": true}`:
  1. Read the current state:
     ```
     Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs get)
     ```
  2. Show the user the original prompt and which steps have been completed
  3. Use AskUserQuestion with two options:
     - "Resume from [current step]" -- skip completed steps and continue
     - "Start fresh (deletes previous progress)" -- run `delete`, then
       proceed to Step 1
- If `{"exists": false}`: proceed to Step 1

### Step 1: Plan

Output: `[1/3] Planning...`

Initialize workflow state (skip if resuming past this step):

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs init --prompt "<user's prompt>")
```

Spawn the Planner agent with the user's prompt verbatim:

```
Agent(subagent_type: "application-dev:planner", prompt: "<user's full prompt, verbatim>")
```

Apply the error recovery pattern (see Error Recovery section).

**Binary check:** Read `SPEC.md` -- verify the file exists and contains
`## Features`. Do NOT assess spec quality -- the Planner self-verifies. If
the check fails, retry with the same prompt (counts toward the 2-retry limit).

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs update --step generate --round 1)
```

Output: `[1/3] Planning... done`

### Step 2: Build/QA Loop

Run up to 3 rounds. Each round consists of a Build phase followed by an
Evaluate phase.

#### Build Phase (each round N)

Output: `[2/3] Generating (round N)...`

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs update --step generate --round N)
```

Spawn the Generator with the appropriate prompt:

Round 1:

```
Agent(subagent_type: "application-dev:generator", prompt: "Build the application defined in SPEC.md. This is build round 1 -- there is no prior QA feedback.")
```

Round 2+:

```
Agent(subagent_type: "application-dev:generator", prompt: "This is build round N. Read QA-REPORT.md for the Evaluator's feedback from the previous round. Fix the issues found and improve the application.")
```

Apply the error recovery pattern.

**Binary check:** Use Bash to check a key project file exists:

```
Bash(ls package.json index.html pyproject.toml 2>/dev/null)
```

The Generator self-tests; the orchestrator just confirms something was built.

Output: `[2/3] Generating (round N)... done`

#### Evaluate Phase (each round N)

Output: `[2/3] Evaluating (round N)...`

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs update --step evaluate --round N)
```

Spawn the Evaluator:

```
Agent(subagent_type: "application-dev:evaluator", prompt: "Evaluate the application against SPEC.md. This is QA round N. Write your report to QA-REPORT.md.")
```

Apply the error recovery pattern.

**Binary check:** Read `QA-REPORT.md` -- verify the file exists and contains
`## Verdict`. Do NOT assess report quality -- the Evaluator self-verifies.
If the check fails, retry with the same prompt.

**Parse verdict:** Search for `PASS` or `FAIL` in the Verdict line. This is
the ONLY qualitative read the orchestrator does -- a single keyword match.

Record the round result:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs round-complete --round N --verdict <PASS|FAIL>)
```

Output: `[2/3] Evaluating (round N)... Verdict: <PASS|FAIL>`

**Loop exit logic:**
- If PASS: exit loop, proceed to Step 3
- If FAIL and round < 3: start the next round
- If FAIL and round = 3: exit loop, proceed to Step 3

### Step 3: Summary

Output: `[3/3] Summarizing...`

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs update --step summary)
```

Read `QA-REPORT.md` and `README.md` to present a summary to the user:
- Product name and what was built
- Key features implemented (from the QA report's feature status table)
- Final QA scores and verdict
- Number of rounds completed
- How to start/use the app (from README)

Note: The Summary step is the ONE exception where the orchestrator reads agent
output in detail. This is presentation to the user, not diagnosis or
correction. The orchestrator does not act on this information -- it only
formats it for display.

Complete the workflow:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs complete --exit-condition PASS)
```

Use the appropriate exit condition based on the final verdict: `PASS` if the
Evaluator passed, or `SAFETY_CAP` if 3 rounds exhausted with FAIL verdict.

Delete state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-state.mjs delete)
```

Output: `[3/3] Summarizing... done`

## Error Recovery

All agent spawns follow this pattern:

1. Spawn the agent with the defined prompt
2. If the agent spawn fails (Agent tool returns an error):
   - **Retry 1:** Spawn again with the EXACT same prompt (no modifications,
     no diagnostic context added)
   - **Retry 2:** Spawn again with the EXACT same prompt
   - **After 2 retries exhausted:** Use AskUserQuestion to present options:
     - "Retry now" -- spawns the agent again (unlimited user-initiated retries)
     - "Resume later" -- writes current state and stops (user can run
       `/application-dev` later to resume)
     - "Abort" -- deletes state file and stops
3. The Agent tool's success/failure status may be unreliable
   (classifyHandoffIfNeeded bug). Always perform the binary file-exists check
   regardless of reported status. If expected files exist, treat the agent as
   successful even if the Agent tool reported failure.

## Agent Prompt Protocol

The orchestrator passes these exact prompts to each agent. No additions, no
context injection, no failure diagnostics.

**Planner:**
```
<user's full prompt, verbatim>
```
Nothing else. The user's prompt is the entire agent prompt.

**Generator (round 1):**
```
Build the application defined in SPEC.md. This is build round 1 -- there is no prior QA feedback.
```

**Generator (round 2+):**
```
This is build round N. Read QA-REPORT.md for the Evaluator's feedback from the previous round. Fix the issues found and improve the application.
```

**Evaluator:**
```
Evaluate the application against SPEC.md. This is QA round N. Write your report to QA-REPORT.md.
```

The orchestrator fills in only the round number. No free-form additions. No
error context. No diagnostic notes. No "this time make sure to..."
instructions.

## File-Based Communication

Agents communicate through two files only:
- `SPEC.md` -- Planner writes it, Generator and Evaluator read it
- `QA-REPORT.md` -- Evaluator writes it, Generator reads it (rounds 2+)

The orchestrator coordinates through one file only:
- `.appdev-state.json` -- managed exclusively via the state CLI

No other inter-agent communication paths exist. Agents do not read or write
the state file. The orchestrator does not read or write SPEC.md or
QA-REPORT.md except for the binary checks described above and the Summary
presentation step.
