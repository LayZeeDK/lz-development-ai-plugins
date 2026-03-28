# Application-Dev Plugin Architecture

The application-dev plugin turns a short prompt into a complete, working
application through autonomous multi-agent development. It uses a
GAN-inspired three-agent architecture where a Generator produces applications,
an Evaluator critiques them adversarially, and the tension between the two
drives quality improvement across rounds. A Planner expands the user's prompt
into an ambitious specification before the generation/evaluation loop begins.

## GAN Architecture

The core design is inspired by Generative Adversarial Networks (GANs). In a
traditional GAN, a generator network produces outputs while a discriminator
network judges their quality -- the adversarial tension between the two drives
both to improve. This plugin applies the same principle to application
development.

**The adversarial pair:**

| GAN Concept | Plugin Agent | Role |
|-------------|-------------|------|
| Generator | Generator agent | Produces the full application from the specification |
| Discriminator | Evaluator agent | Tests the running application with adversarial skepticism |
| Training loop | Generation/Evaluation rounds | Critique from the Evaluator drives Generator improvement |
| Loss signal | Evaluation scores and feedback | Structured scoring rubric replaces gradient signals |

**Why separation matters:** When a single model both generates and evaluates
its own work, self-praise bias is inevitable. The model is incentivized to
judge its output favorably. By separating generation from evaluation into
distinct agents with distinct tool allowlists and instructions, the Evaluator
has no stake in the Generator's success. Its incentive is honest, adversarial
critique.

**Important caveat:** This is inspired by GANs, not a literal implementation.
There is no loss function or gradient descent. The feedback loop serves the
same purpose of adversarial improvement -- the Evaluator's structured critique
(scores, failure descriptions, screenshots) provides the signal that drives
the Generator to fix issues and improve quality in subsequent rounds.

## Agent Roles and Separation

### Planner

Expands the user's short prompt (1-4 sentences) into an ambitious product
specification (SPEC.md). The Planner has the most constrained tool surface:
only Read and Write. It cannot run commands, cannot access the network, and
cannot modify anything except SPEC.md. Its job is pure specification -- turning
a vague prompt into a detailed, ambitious product vision.

### Generator

Builds the full application from SPEC.md. In round 1, the Generator reads only
the specification. In rounds 2+, it reads the previous round's evaluation
report first (the Evaluator's feedback) and fixes only what was flagged. The
Generator has broad tool access (Read, Write, Edit, Bash, and various MCP
tools) because it needs to install dependencies, run dev servers, and build
the application. Its prompt guard constrains it to application source code --
it must not write to the evaluation/ folder.

### Evaluator

The adversarial critic. The Evaluator launches the running application using
@playwright/cli, navigates it as a user would, takes screenshots, captures
console and network logs, and writes a structured evaluation report with scores
per criterion. It has access to Bash (for launching servers and running
playwright-cli) and Write (for the evaluation report and artifacts). Its prompt
guard prevents it from modifying application source code -- it can only observe
and report.

### Orchestrator

The "dumb coordinator." The orchestrator (this skill's SKILL.md) never reads
agent output to assess quality. It delegates all work to agents and all
analysis to appdev-cli. It performs only:

- Binary file-exists checks after each agent (does the output file exist?)
- State transitions via appdev-cli JSON responses
- Git workspace setup, milestone tagging, and rollback
- Error recovery (same-prompt retries, user escalation)

The orchestrator acts on `exit_condition` and `should_continue` fields from
appdev-cli's JSON response -- it never interprets scores, reads evaluation
content (except in the Summary step for user presentation), or adds diagnostic
context to agent prompts.

## Two-Layer Enforcement Model

Role boundaries are enforced through two complementary layers working in
concert:

**Layer 1: Tool allowlists (structural enforcement)**

Each agent's frontmatter `tools` field is a strict restriction enforced by the
Claude Code runtime. An agent simply cannot invoke tools outside its list. The
orchestrator skill's `allowed-tools` field provides pre-approval for tools
used during autonomous execution.

**Layer 2: Prompt guards (behavioral enforcement)**

Each agent's instructions contain explicit output-domain constraints telling
it what files it may and may not write. These are behavioral -- the agent could
technically violate them, but the instructions are designed to make compliance
the path of least resistance.

The two layers together provide defense-in-depth. Tool allowlists prevent
structural violations (Evaluator cannot use Edit to modify source code).
Prompt guards prevent behavioral violations within allowed tools (Generator
has Write but is instructed not to write EVALUATION.md).

**What was dropped and why:**

- `disallowedTools` is not a supported field on skills or agents
- Plugin hooks were explored but dropped because they apply session-wide and
  cannot distinguish between agents -- a hook blocking Write for the Evaluator
  would also block Write for the Generator

These limitations led to the two-layer model as the practical enforcement
approach. It was adopted in Phase 1 as a deliberate architectural decision.

## Cybernetics Inspirations

The convergence detection system draws on concepts from cybernetics and
control theory.

### Escalation Vocabulary (E-0 through E-IV)

The system classifies each round's score trajectory into named operating
regimes -- a concept from cybernetics where a system's behavior is categorized
into qualitatively different modes, each with its own response strategy.

| Level | Name | Trigger | System Response |
|-------|------|---------|-----------------|
| E-0 | Progressing | Score improved >1 point | Continue -- system is converging |
| E-I | Decelerating | Score improved but delta shrinking | Continue with warning -- improvement slowing |
| E-II | Plateau | <=1 point improvement over 3-round window | Stop (PLATEAU exit) -- natural convergence reached |
| E-III | Regression | 2 consecutive total-score declines | Stop + rollback to best round -- system is diverging |
| E-IV | Catastrophic | Single-round drop >50% or total <=5 | Immediate stop + rollback -- catastrophic failure |

The escalation levels are computed by appdev-cli from the score trajectory
stored in `.appdev-state.json`. The orchestrator receives the escalation level
and label as part of the JSON response from `round-complete` and uses it for
progress output and exit condition dispatch.

Priority order: E-IV > E-III > E-II > E-I > E-0 (first match wins).

Special cases:
- Round 1: always E-0 (no prior data to compare)
- Round 2: can be E-0, E-I, E-III, or E-IV (no 3-round window for plateau)
- PASS verdict overrides all escalation -- exit with PASS regardless of level
- Round 10 without prior exit: SAFETY_CAP fires

### Damping Principle

In rounds 2+, the Generator is instructed to fix only what the Evaluator
flagged. It must not add new features, refactor working code, or make
speculative improvements. This is analogous to damping in control systems --
unconstrained changes cause oscillation instead of convergence.

Without damping, the Generator might "fix" a low visual design score by
rewriting the entire UI, accidentally breaking functionality that was working.
By constraining round 2+ changes to Evaluator-flagged issues only, each round
makes targeted corrections that move scores upward without introducing new
regressions.

This principle is enforced via the Generator's agent definition (prompt guard),
not the orchestrator's prompt. The orchestrator sends only "This is generation
round N." -- the Generator's instructions handle the fix-only constraint.

### Score-Based Convergence Detection

Rather than running a fixed number of rounds, the system monitors the score
trajectory to detect three convergence-related states:

1. **Convergence (Plateau):** Scores have stopped improving meaningfully. The
   3-round window comparison (<=1 point total improvement) detects when the
   system has reached its quality ceiling. Further rounds would waste compute
   without improving the result.

2. **Divergence (Regression):** Scores are declining. Two consecutive total-score
   drops indicate the Generator's changes are making things worse. The system
   rolls back to the best previous round using git tags as recovery points.

3. **Catastrophic failure:** A single-round drop exceeding 50% of the previous
   total (or an absolute score <=5) indicates a fundamental failure rather than
   gradual decline. The system stops immediately and rolls back.

This replaces the original fixed 3-round limit, which led to early stopping
with issues still remaining. Score-based detection allows the system to run as
many rounds as needed (up to the 10-round safety cap) while stopping early
when further iteration would not help.

## Anthropic Article Alignment and Divergences

The plugin was inspired by the Anthropic article on multi-agent application
development, which describes a three-agent architecture (Planner, Coder,
Evaluator) for building applications from prompts. The core alignment is
strong -- three specialized agents, file-based communication, Playwright-based
evaluation, and model-agnostic agent definitions.

Key divergences:

| Divergence | Rationale |
|------------|-----------|
| **Sprints removed** | The article's v1 used sprint decomposition. The v2 harness (and our plugin) eliminates sprints -- Opus 4.6 with 1M context handles full applications in one shot without needing to decompose work |
| **Context rotation replaced by fresh context** | The article used context rotation for long sessions. Our GAN architecture spawns each agent with fresh context per round -- the Evaluator gets a clean perspective each time |
| **Fixed round count replaced by convergence detection** | The article used a fixed number of rounds. Our score-based detection (E-0 through E-IV) adapts to actual quality trajectory, stopping early on convergence and running longer when improvement continues |
| **Roles sharpened into adversarial GAN pair** | The article's agents cooperated toward a shared goal. Our Evaluator is explicitly adversarial -- its job is to find failures, not to help the Generator succeed. This tension drives higher quality |
| **Evaluator commits versioned reports** | The article overwrote a single QA report. Our Evaluator writes to `evaluation/round-N/`, preserving full history for trajectory analysis and debugging |
| **Git version control throughout** | The article did not specify a git strategy. Our agents commit their work and the orchestrator creates milestone tags, enabling rollback on regression |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Orchestrator never reads EVALUATION.md (except Summary) | Maintains "dumb coordinator" principle -- all analysis delegated to appdev-cli |
| Agents commit their own work, orchestrator creates milestone tags | Agents know what they built and can write meaningful commit messages; orchestrator handles coordination-level milestones |
| Planner has no Bash access (orchestrator commits SPEC.md) | Keeps Planner's tool surface minimal (Read, Write only). Orchestrator commits after binary check |
| Minimal agent prompts ("This is generation round N.") | Agent definitions handle all instructions. Orchestrator fills in only the round number -- no diagnostic context, no escalation hints, no free-form additions |
| appdev-cli centralizes all convergence logic | Score extraction, escalation computation, exit condition determination, and trajectory tracking all live in testable code rather than prose workflow instructions |
| @playwright/cli as project devDependency | Installed in Step 0.5 workspace setup via `npm install --save-dev @playwright/cli`. Eliminates system PATH dependency -- turn-key setup |
| Two-layer enforcement (tool allowlists + prompt guards) | Structural (runtime-enforced) + behavioral (instruction-enforced) -- defense-in-depth after hooks/disallowedTools were found infeasible |
| Four exit conditions with distinct behaviors | PASS (success), PLATEAU (natural convergence), REGRESSION (rollback), SAFETY_CAP (wrap-up round) -- each has clear system response |
| 10-round safety cap with wrap-up | Prevents infinite loops while allowing one extra round to consolidate after cap is hit |
| Git tags as rollback recovery points | `appdev/round-N` annotated tags enable `git reset --hard` to a known-good state on regression |

## File-Based Communication Protocol

Agents communicate exclusively through files on disk:

| File | Writer | Readers | Purpose |
|------|--------|---------|---------|
| `SPEC.md` | Planner | Generator, Evaluator | Product specification -- the contract all agents work against |
| `evaluation/round-N/EVALUATION.md` | Evaluator | Generator (next round) | Structured critique with scores, failures, and screenshots |
| `.appdev-state.json` | appdev-cli | Orchestrator (via CLI) | Workflow state: current step, round scores, escalation history |

Git tags serve as milestone markers and recovery points:

| Tag | Created by | Purpose |
|-----|-----------|---------|
| `appdev/planning-complete` | Orchestrator | Marks SPEC.md commit after Planner finishes |
| `appdev/round-N` | Orchestrator | Marks completion of each generation/evaluation round |
| `appdev/final` | Orchestrator | Marks the final result with exit condition |

The state file (`.appdev-state.json`) is gitignored -- it survives git
rollbacks and is not part of the committed project. This ensures the
orchestrator retains full round history even after a `git reset --hard` on
regression.

---
*Architecture documented during Phase 2 (Git Workflow and Loop Control)*
*Covers foundations from Phases 1-2; Phases 3-4 extend but do not alter these concepts*
