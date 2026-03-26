---
name: application-dev
description: >-
  Orchestrates autonomous, long-running application development using a GAN-inspired
  three-agent architecture. Use when the user wants to build a complete application from
  a short prompt (1-4 sentences). Spawns a Planner, Generator, and Evaluator in an
  adversarial feedback loop that runs continuously without user intervention.
argument-hint: "<1-4 sentence application description>"
allowed-tools: Agent, Read
---

# Autonomous Application Development

Build a complete application from the user's prompt using three specialized agents in an adversarial loop inspired by Generative Adversarial Networks (GANs). Run the entire workflow autonomously -- do NOT ask the user for input after the initial prompt.

## Architecture

- **Planner**: Expands the user's prompt into an ambitious product specification
- **Generator**: Builds the full application from the spec (like a GAN generator)
- **Evaluator**: Critiques the running app with skepticism (like a GAN discriminator)

The Generator and Evaluator form an adversarial pair: the Evaluator's honest critique drives the Generator to improve, just as a GAN discriminator's feedback drives the generator to produce better outputs. Separating generation from evaluation prevents the self-praise bias that occurs when a model evaluates its own work.

## Workflow

Execute these steps in order. Do not deviate from this sequence.

### Step 1: Plan

Spawn the Planner agent with the user's prompt verbatim:

```
Agent(
  subagent_type: "application-dev:planner",
  prompt: "<user's full prompt, verbatim>"
)
```

The Planner writes `SPEC.md` to the working directory. After it completes, read `SPEC.md` and verify it contains:
- A product name and overview
- 10+ numbered features with user stories
- A visual design language section
- AI feature integration points
- If the user's prompt specified a tech stack, verify the spec preserves that constraint

If `SPEC.md` is missing or incomplete, re-spawn the Planner with an explicit note about what is missing.

### Step 2: Build/QA Loop

Run up to 3 rounds. Each round consists of a Build phase followed by an Evaluate phase.

#### Build Phase

Spawn the Generator agent.

Round 1:
```
Agent(
  subagent_type: "application-dev:generator",
  prompt: "Build the application defined in SPEC.md. This is build round 1 -- there is no prior QA feedback."
)
```

Rounds 2+:
```
Agent(
  subagent_type: "application-dev:generator",
  prompt: "This is build round <N>. Read QA-REPORT.md for the Evaluator's feedback from the previous round. Fix the issues found and improve the application. Make a strategic decision: refine the current approach if the Evaluator's scores are trending upward, or pivot to a different approach if the current direction is not working."
)
```

#### Evaluate Phase

Spawn the Evaluator agent:

```
Agent(
  subagent_type: "application-dev:evaluator",
  prompt: "Evaluate the application against SPEC.md. This is QA round <N>. Write your report to QA-REPORT.md."
)
```

After the Evaluator completes, read `QA-REPORT.md` and check the overall verdict:
- **PASS**: Stop the loop. Proceed to Step 3.
- **FAIL** and current round < 3: Start the next Build phase.
- **FAIL** and current round = 3: Stop the loop. Proceed to Step 3.

### Step 3: Summary

After the loop completes, present a brief summary to the user:
- Product name and what was built
- Key features implemented
- Final QA scores (from the last QA-REPORT.md)
- Number of build/QA rounds completed
- How to start and use the application

## Rules

1. **Fully autonomous.** Never ask the user for feedback, clarification, or approval during the workflow. Make all decisions autonomously.
2. **Max 3 rounds.** The build/QA loop runs at most 3 times. Each round = one Build + one Evaluate.
3. **File-based communication.** Agents communicate through `SPEC.md` and `QA-REPORT.md` in the working directory.
4. **All agents work in the current working directory.** Do not create a separate project directory -- let the Generator organize the project as it sees fit.
5. **Pass the prompt verbatim.** Forward the user's exact prompt to the Planner. If the prompt mentions a tech stack, the Planner will carry it through to the spec.
