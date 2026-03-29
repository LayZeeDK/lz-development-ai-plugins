---
name: application-dev
description: >-
  Build a complete application autonomously from a short prompt. Use this skill
  whenever the user wants to create a web app, build an application, make a
  game, develop a full-stack project, or generate a complete working product
  from a description. Handles requests like "build me an app that does X",
  "create a web application for Y", "make a 2D game maker", or "develop a
  DAW in the browser". Orchestrates three agents (Planner, Generator,
  Evaluator) in an adversarial generation/evaluation loop with git version
  control, score-based convergence detection, escalation vocabulary, workflow
  state management, error recovery, and resumable execution. Runs without user
  intervention after the initial prompt.
license: MIT
compatibility: >-
  Requires @playwright/cli as a project devDependency (installed automatically
  in Step 0.5 workspace setup -- no system PATH dependency).
  Sub-agents loaded from the plugin's agents/ directory.
metadata:
  author: Lars Gyrup Brink Nielsen
allowed-tools: Agent Read Write Bash(node *appdev-cli*) Bash(git init*) Bash(git rev-parse *) Bash(git add *) Bash(git commit *) Bash(git tag *) Bash(git reset *) Bash(npm init*) Bash(npm install*)
---

# Autonomous Application Development

Build a complete application from the user's prompt using three specialized
agents (Planner, Generator, Evaluator) in an adversarial loop.

## Rules

1. **Write is ONLY for .appdev-state.json and .gitignore.** Source code, specs,
   and evaluation artifacts belong to their respective agents -- do not write
   them from the orchestrator.
2. **Do not diagnose agent output beyond binary file-exists checks and
   appdev-cli's JSON response.** Qualitative assessment of agent output
   reintroduces the self-praise bias the adversarial architecture eliminates.
   The one exception: reading agent output in the Summary step for user
   presentation.
3. **Do not add corrective instructions to agent prompts on retry.** Corrective
   additions accumulate prompt drift and bypass the agent's own
   self-verification. Use the exact same prompt for retries as the original
   spawn.
4. **Do not perform agent work.** If an agent fails and retries are exhausted,
   ask the user -- do not attempt the agent's task.
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
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs exists)
```

- If `{"exists": true}`:
  1. Read the current state:
     ```
     Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs get)
     ```
  2. Show the user the original prompt and which steps have been completed
  3. Use AskUserQuestion with two options:
     - "Resume from [current step]" -- skip completed steps and continue
     - "Start fresh (deletes previous progress)" -- run `delete`, then
       proceed to Step 0.5
- If `{"exists": false}`: proceed to Step 0.5

### Step 0.5: Git Workspace Setup

Initialize the workspace for version-controlled development (skip if resuming
past this step):

Check for existing git repo:

```
Bash(git rev-parse --git-dir 2>/dev/null || git init)
```

Initialize package.json:

```
Bash(npm init -y)
```

Install @playwright/cli as a dev dependency:

```
Bash(npm install --save-dev @playwright/cli)
```

Seed .gitignore with harness infrastructure (use Write tool):

```
.appdev-state.json
.playwright-cli/
node_modules/
```

Initial commit:

```
Bash(git add .gitignore package.json package-lock.json)
Bash(git commit -m "chore: initialize appdev workspace")
```

Note: Run git commands as SEPARATE Bash calls, not chained with `&&`. Each
`Bash(git add ...)` and `Bash(git commit ...)` is a separate tool call. Shell
operators in compound commands do not match the allowed-tools patterns.

### Step 1: Plan

Output: `[1/3] Planning...`

Initialize workflow state (skip if resuming past this step):

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs init --prompt "<user's prompt>")
```

Spawn the Planner agent with the user's prompt verbatim:

```
Agent(subagent_type: "application-dev:planner", prompt: "<user's full prompt, verbatim>")
```

Apply the error recovery pattern (see Error Recovery section).

**Binary check:** Read `SPEC.md` -- verify the file exists and contains
`## Features`. Do NOT assess spec quality -- the Planner self-verifies. If
the check fails, retry with the same prompt (counts toward the 2-retry limit).

Commit SPEC.md and tag the planning milestone:

```
Bash(git add SPEC.md)
Bash(git commit -m "docs(spec): product specification")
Bash(git tag -a appdev/planning-complete -m "Planning complete: SPEC.md committed")
```

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs update --step generate --round 1)
```

Output: `[1/3] Planning... done`

### Step 2: Generation/Evaluation Loop

Run up to 10 rounds with score-based convergence detection. Each round
consists of a Generation phase followed by an Evaluation phase. The appdev-cli
determines when to stop based on score trajectory analysis.

#### Generation Phase (each round N)

Output: `[2/3] Generating (round N)...`

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs update --step generate --round N)
```

Spawn the Generator with the round context:

```
Agent(subagent_type: "application-dev:generator", prompt: "This is generation round N.")
```

Note: The Generator's agent definition handles reading SPEC.md (round 1) and
EVALUATION.md (rounds 2+) internally. The orchestrator does NOT include file
reading instructions in the prompt per the "minimal orchestrator prompts"
decision.

Apply the error recovery pattern.

**Binary check:** Use Bash to check a key project file exists:

```
Bash(ls package.json index.html pyproject.toml 2>/dev/null)
```

The Generator self-tests; the orchestrator just confirms something was built.

Output: `[2/3] Generating (round N)... done`

#### Evaluation Phase (each round N)

Output: `[2/3] Evaluating (round N)...`

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs update --step evaluate --round N)
```

Spawn the Evaluator:

```
Agent(subagent_type: "application-dev:evaluator", prompt: "This is evaluation round N.")
```

Apply the error recovery pattern.

**Binary check:** Read `evaluation/round-N/EVALUATION.md` -- verify the file
exists and contains `## Verdict`. Do NOT assess report quality -- the
Evaluator self-verifies. If the check fails, retry with the same prompt.

#### Post-Evaluation Convergence Check

Instead of parsing the verdict directly, delegate to appdev-cli:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs round-complete --round N --report evaluation/round-N/EVALUATION.md)
```

If appdev-cli returns an error JSON (malformed report, missing scores), treat
it as an Evaluator failure and apply the retry pattern on the Evaluator.

Act on the JSON response:

**If `exit_condition` is `"PASS"`:**
- Output: `[2/3] Evaluating (round N)... Verdict: PASS`
- Tag the round:
  ```
  Bash(git tag -a appdev/round-N -m "Round N complete: PASS")
  ```
- Tag the final result:
  ```
  Bash(git tag -a appdev/final -m "Final result: PASS after N rounds")
  ```
- Break -> Step 3 (Summary)

**If `exit_condition` is `"PLATEAU"`:**
- Output: `[2/3] Evaluating (round N)... Verdict: FAIL (Plateau -- scores converged)`
- Tag the round:
  ```
  Bash(git tag -a appdev/round-N -m "Round N complete: PLATEAU exit")
  ```
- Tag the final result:
  ```
  Bash(git tag -a appdev/final -m "Final result: PLATEAU after N rounds")
  ```
- Break -> Step 3 (Summary). No wrap-up round. Plateau means natural
  convergence.

**If `exit_condition` is `"REGRESSION"`:**
- Output: `[2/3] Evaluating (round N)... Verdict: FAIL (Regression -- rolling back to round {best_round})`
- Rollback to the best round:
  ```
  Bash(git reset --hard appdev/round-{best_round})
  ```
- Tag the final result:
  ```
  Bash(git tag -a appdev/final -m "Final result: REGRESSION rollback to round {best_round}")
  ```
- Break -> Step 3 (Summary). Use `evaluation/round-{best_round}/EVALUATION.md`
  for the summary.

**If `exit_condition` is `"SAFETY_CAP"`:**
- Output: `[2/3] Evaluating (round N)... Verdict: FAIL (Safety cap reached)`
- Tag the round:
  ```
  Bash(git tag -a appdev/round-N -m "Round N complete: SAFETY_CAP")
  ```
- Run one extra wrap-up round (round N+1, not counted toward the 10-round
  cap):
  - Spawn Generator:
    ```
    Agent(subagent_type: "application-dev:generator", prompt: "This is generation round {N+1}.")
    ```
  - Binary check (project files exist)
  - Spawn Evaluator:
    ```
    Agent(subagent_type: "application-dev:evaluator", prompt: "This is evaluation round {N+1}.")
    ```
  - Run convergence check:
    ```
    Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs round-complete --round {N+1} --report evaluation/round-{N+1}/EVALUATION.md)
    ```
  - Tag the wrap-up round:
    ```
    Bash(git tag -a appdev/round-{N+1} -m "Round {N+1} complete: wrap-up")
    ```
  - Tag the final result:
    ```
    Bash(git tag -a appdev/final -m "Final result: SAFETY_CAP with wrap-up round")
    ```
- Break -> Step 3 (Summary)

**If `should_continue` is true (no exit condition):**
- Output: `[2/3] Evaluating (round N)... Verdict: FAIL (Escalation: {escalation_label})`
- Tag the round:
  ```
  Bash(git tag -a appdev/round-N -m "Round N complete: {escalation_label}")
  ```
- Continue to next round

### Step 3: Summary

Output: `[3/3] Summarizing...`

Update state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs update --step summary)
```

Read `evaluation/round-{final}/EVALUATION.md` and `README.md` to present a
summary to the user. For REGRESSION exits, read from the best round's
evaluation instead (`evaluation/round-{best_round}/EVALUATION.md`).

Present:
- Product name and what was built
- Key features implemented (from the evaluation report's feature status table)
- Final scores and verdict
- Number of rounds completed
- Exit condition (PASS, PLATEAU, REGRESSION, or SAFETY_CAP)
- Escalation history (from appdev-cli get-trajectory):
  ```
  Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs get-trajectory)
  ```
- How to start/use the app (from README)

Note: The Summary step is the ONE exception where the orchestrator reads agent
output in detail. This is presentation to the user, not diagnosis or
correction. The orchestrator does not act on this information -- it only
formats it for display.

Complete the workflow with the appropriate exit condition:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs complete --exit-condition <PASS|PLATEAU|REGRESSION|SAFETY_CAP>)
```

Delete state:

```
Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs delete)
```

Output: `[3/3] Summarizing... done`

## Error Recovery

All agent spawns follow this pattern:

1. Spawn the agent with the defined prompt
2. If the spawn fails (Agent tool returns an error), retry up to 2 times with
   the EXACT same prompt -- no modifications, no diagnostic context added
3. After 2 retries exhausted, use AskUserQuestion to present options: retry
   now, resume later (save state and stop), or abort (delete state and stop)
4. The Agent tool's success/failure status may be unreliable
   (classifyHandoffIfNeeded bug). Always perform the binary file-exists check
   regardless of reported status. If expected files exist, treat the agent as
   successful even if the Agent tool reported failure.

If appdev-cli round-complete returns an error JSON (malformed evaluation
report, missing scores), treat it as an Evaluator failure and apply the retry
pattern on the Evaluator. Re-spawn the Evaluator with the same prompt; the
Evaluator will overwrite its report.

## Agent Prompt Protocol

Pass these exact prompts to each agent. No additions, no context injection, no
failure diagnostics. Each agent's definition handles file reading internally.

**Planner:** `<user's full prompt, verbatim>` -- nothing else.

**Generator (all rounds):** `This is generation round N.` -- the orchestrator
fills in only the round number. No free-form additions, error context,
diagnostic notes, or "this time make sure to..." instructions.

**Evaluator (all rounds):** `This is evaluation round N.` -- the orchestrator
fills in only the round number.

## File-Based Communication

Agents communicate through two file types:
- `SPEC.md` -- Planner writes it, Generator and Evaluator read it
- `evaluation/round-N/EVALUATION.md` -- Evaluator writes per round, Generator
  reads the prior round's report in subsequent rounds

The orchestrator coordinates through one file only:
- `.appdev-state.json` -- managed exclusively via appdev-cli

No other inter-agent communication paths exist. The orchestrator does not read
or write SPEC.md or EVALUATION.md except for binary checks and Summary
presentation.

## Architecture

Three agents with distinct roles:
- **Planner**: Expands the user's prompt into an ambitious product specification
- **Generator**: Builds the full application from the spec
- **Evaluator**: Critiques the running app with skepticism

The Generator and Evaluator form an adversarial pair -- the Evaluator's honest
critique drives the Generator to improve. Separating generation from evaluation
prevents self-praise bias.

Role boundaries enforced by tool allowlists (agent frontmatter) and prompt
guards (agent instructions). The orchestrator's output domain is
.appdev-state.json and .gitignore only.

Convergence detection uses escalation levels (E-0 through E-IV) computed by
appdev-cli from score trajectory data. The orchestrator acts on the structured
JSON response without interpreting scores directly.
