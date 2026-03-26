---
name: application-dev
description: >-
  Orchestrates autonomous application development using a GAN-inspired
  three-agent architecture (Planner → Generator → Evaluator). Use when
  the user wants to build a complete application from a short prompt
  (1-4 sentences). Runs an adversarial build/QA loop (up to 3 rounds)
  without user intervention.
license: MIT
compatibility: >-
  Requires playwright-cli on PATH for browser-based QA testing.
  Claude Code: sub-agents loaded from the plugin's agents/ directory.
  GitHub Copilot CLI: when loaded with --plugin-dir, agents are bundled under
  .github/agents/ inside this plugin; for other projects, copy
  plugins/application-dev/.github/agents/*.agent.md to .github/agents/.
metadata:
  author: Lars Gyrup Brink Nielsen
allowed-tools: Agent agent Read
---

# Autonomous Application Development

Build a complete application from the user's prompt using three specialized
agents in an adversarial loop inspired by GANs.

## Platform note

**Claude Code:** This skill spawns agents from the plugin's `agents/` directory:
- `application-dev:planner`, `application-dev:generator`, `application-dev:evaluator`

**GitHub Copilot CLI:** This skill delegates to custom agents via the `agent`/`task`
delegation tools:
- `@application-dev-planner`, `@application-dev-generator`, `@application-dev-evaluator`

Agents are bundled in `plugins/application-dev/.github/agents/` of this repo.
When using Copilot CLI with `--plugin-dir ./plugins/application-dev`, they are
picked up alongside the skill. For other projects, copy
`plugins/application-dev/.github/agents/*.agent.md` to `.github/agents/`.

## Architecture

- **Planner**: Expands the user's prompt into an ambitious product specification
- **Generator**: Builds the full application from the spec (like a GAN generator)
- **Evaluator**: Critiques the running app with skepticism (like a GAN discriminator)

The Generator and Evaluator form an adversarial pair: the Evaluator's honest critique drives the Generator to improve, just as a GAN discriminator's feedback drives the generator to produce better outputs. Separating generation from evaluation prevents the self-praise bias that occurs when a model evaluates its own work.

## Workflow

Execute these steps in order. Do not deviate from this sequence.

### Step 1: Plan

Invoke the planner sub-agent with the user's prompt verbatim.

- Claude Code: `Agent(subagent_type: "application-dev:planner", prompt: "<user's full prompt, verbatim>")`
- Copilot CLI: delegate to `@application-dev-planner` via the `agent` tool with an explicit operational note to create or overwrite `SPEC.md` in the current working directory using its edit/write tool, not return the spec only as agent output, and re-read `SPEC.md` before finishing.

The Planner writes `SPEC.md` to the working directory. After it completes, read `SPEC.md` and verify it contains:
- A product name and overview
- A user journey narrative
- Constraints and non-goals
- 10+ numbered features with priority tiers (Core/Important/Nice-to-have) and user stories
- A visual design language section
- AI feature integration points
- If the user's prompt specified a tech stack, verify the spec preserves that constraint

If `SPEC.md` is missing or incomplete, re-invoke the planner with an explicit note about what is missing and a reminder that it must write the file into the repository rather than leaving the spec in agent output.

### Step 2: Build/QA Loop

Run up to 3 rounds. Each round consists of a Build phase followed by an Evaluate phase.

#### Build Phase

Invoke the generator sub-agent.

- Claude Code: `Agent(subagent_type: "application-dev:generator", prompt: "Build the application defined in SPEC.md. This is build round 1 -- there is no prior QA feedback.")`
- Copilot CLI: delegate to `@application-dev-generator` via the `agent` tool with an explicit operational note to write files directly into the current working directory, create missing parent directories with the execute tool before writing nested files, and verify the repository files exist before finishing.

Rounds 2+ should pass `QA-REPORT.md` to the generator so it can fix issues.

If the generator reports drafted files without repository writes, or reports that parent directories do not exist, re-invoke it with the same QA context plus an explicit reminder to create the missing directories first and retry the file writes in-repo.

#### Evaluate Phase

Invoke the evaluator sub-agent.

- Claude Code: `Agent(subagent_type: "application-dev:evaluator", prompt: "Evaluate the application against SPEC.md. This is QA round <N>. Write your report to QA-REPORT.md.")`
- Copilot CLI: delegate to `@application-dev-evaluator` via the `agent` tool

After the Evaluator completes, read `QA-REPORT.md` and verify it contains a Verdict, Scores table, and Priority Fixes section. If the report is missing or malformed, re-invoke the evaluator with a note to regenerate the full report.

Check the overall verdict:
- **PASS**: Stop the loop. Proceed to Step 3.
- **FAIL** and current round < 3: Start the next Build phase.
- **FAIL** and current round = 3: Stop the loop. Proceed to Step 3.

### Step 3: Summary

After the loop completes, read the final `QA-REPORT.md` and the project's `README.md` to produce an accurate summary. Present to the user:
- Product name and what was built
- Key features implemented (cross-check against the QA report's feature status table)
- Final QA scores
- Number of build/QA rounds completed
- How to start and use the application (from the project README)

## Rules

1. **Fully autonomous.** Never ask the user for feedback, clarification, or approval during the workflow. Make all decisions autonomously.
2. **Max 3 rounds.** The build/QA loop runs at most 3 times. Each round = one Build + one Evaluate.
3. **File-based communication.** Agents communicate through `SPEC.md` and `QA-REPORT.md` in the working directory.
4. **All agents work in the current working directory.** Do not create a separate project directory -- let the Generator organize the project as it sees fit.
5. **Pass the prompt verbatim.** Forward the user's exact product request to the Planner unchanged. You may add separate operational instructions about writing files into the repository, but do not alter the user's product request itself.
