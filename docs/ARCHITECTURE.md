# Application-Dev Plugin Architecture

The application-dev plugin turns a short prompt into a complete, working
application through autonomous multi-agent development. It uses a GAN-inspired
ensemble architecture where a Generator produces applications, a critic
ensemble evaluates them adversarially through the running product surface, and
the tension between generation and evaluation drives quality improvement across
rounds. A Planner expands the user's prompt into an ambitious specification
before the generation/evaluation loop begins. A deterministic CLI aggregator
separates scoring math from evaluation judgment.

The architecture is grounded in three theoretical traditions: Generative
Adversarial Networks (GANs) provide the adversarial separation principle,
Cybernetics provides the feedback loop and convergence detection principles,
and the Turing test provides the evaluation methodology framing.

## GAN Architecture

The core design is inspired by Generative Adversarial Networks (GANs). In a
traditional GAN, a generator network produces outputs while a discriminator
network judges their quality -- the adversarial tension between the two drives
both to improve. This plugin applies the same principle to application
development.

**The adversarial pair:**

| GAN Concept | Plugin Analog | Role |
|-------------|---------------|------|
| Generator | Generator agent | Produces the full application from the specification |
| Discriminator | Critic ensemble | Multiple specialized critics evaluate the running application with adversarial skepticism |
| Training loop | Generation/Evaluation rounds | Critique from critics drives Generator improvement |
| Loss signal | Evaluation scores and feedback | Continuous 1-10 per-dimension scoring replaces gradient signals |

**Why separation matters:** When a single model both generates and evaluates
its own work, self-praise bias is inevitable. The model is incentivized to
judge its output favorably. By separating generation from evaluation into
distinct agents with distinct tool allowlists and instructions, critics have
no stake in the Generator's success. Their incentive is honest, adversarial
critique.

**Important caveat:** This is inspired by GANs, not a literal implementation.
There is no loss function or gradient descent. The feedback loop serves the
same purpose of adversarial improvement -- critics' structured critique
(scores, failure descriptions, screenshots, test results) provides the signal
that drives the Generator to fix issues and improve quality in subsequent
rounds.

### WGAN Continuous Scoring

Traditional GANs use a binary discriminator (real/fake). This plugin instead
follows the Wasserstein GAN (WGAN) approach where the discriminator is renamed
to "critic" and outputs a continuous score rather than a probability. Each
critic produces continuous 1-10 scores per quality dimension -- this is the
Wasserstein distance analog. Continuous scoring provides richer gradient
information than binary verdicts, enabling the Generator to understand not just
"failing" but "how far from passing" and in which specific dimensions.

### Ensemble Discriminator Principle

A single monolithic evaluator lacks the variety to assess visual quality,
functional correctness, and adversarial resilience simultaneously. Each
evaluation dimension requires a different methodology (visual inspection vs.
behavioral testing vs. stress testing) and a different relationship to the
product surface. The ensemble architecture decomposes evaluation into
specialized critics, each focused on a different quality dimension through a
different methodology. This prevents mode collapse in evaluation -- a
monolithic evaluator that encounters context exhaustion or methodology
conflicts produces uniformly mediocre scores across all dimensions, the
evaluation equivalent of mode collapse.

### Information Barrier Principle

Critics evaluate through the product surface -- the running application via
browser automation -- never through source code inspection. This is the GAN
separation enforced structurally, not just behaviorally. The Generator knows
everything (specification, source code, build configuration, implementation
choices). Critics know only the specification and what they can observe through
the running application (rendered pages, console output, network responses,
interactive behavior). This structural asymmetry is the adversarial pressure
that drives quality: the Generator cannot fool critics by writing clever code
that looks correct but behaves incorrectly, because critics judge only
observable behavior.

The information barrier is enforced at two layers: tool allowlists prevent
critics from accessing source code tools, and prompt guards instruct critics
to evaluate only through the product surface.

## Turing Test Framing

The evaluation methodology is framed as a Turing test: each critic acts as an
interrogator who interacts with the running application the way a user would.

### Critics as Interrogators

Each critic interacts with the running application through the same interface
a user would encounter: navigating pages, clicking buttons, submitting forms,
resizing the viewport, observing visual rendering, and stressing the
application beyond normal usage patterns. The critic cannot distinguish a
"good" application from a "real" application except through observable
behavior. This framing drives critics to evaluate what matters to users, not
what matters to developers.

Different critics adopt different interrogation strategies. One critic may
focus on visual quality and cross-page consistency through screenshots and
visual inspection. Another may write and execute automated behavioral tests
to verify functional correctness. A third may subject the application to
adversarial conditions (extreme inputs, rapid navigation, viewport extremes)
to test resilience. Each interrogation strategy probes a different quality
dimension through the product surface.

### Product Surface as Evaluation Boundary

The product surface -- what the running application exposes to a user -- is
the evaluation boundary. Critics see only what a user would see: rendered
pages, console output, network responses, interactive behavior, and visual
presentation. Source code, build configuration, dependency choices, and
implementation patterns are behind the barrier.

This boundary is not arbitrary. It means critics cannot be fooled by well-
structured code that produces broken behavior, and they cannot penalize
unconventional implementations that produce correct behavior. The boundary
forces evaluation to be outcome-oriented rather than process-oriented.

### Asymmetric Knowledge

The Turing test is asymmetric: the Generator knows everything (specification,
code, build system, implementation choices), but critics know only the
specification and the running product. This asymmetry is deliberate. The
Generator has full freedom to choose any implementation approach. Critics
judge only whether the chosen approach produces the correct observable outcome.
This prevents critics from imposing implementation preferences and focuses
adversarial pressure on what the user actually experiences.

### Connection to Black Box Methodology

The evaluation boundary follows Ashby's black box methodology: the critic
observes what the application DOES, not what the Generator says it does.
Observable behavior is the only valid evaluation signal. The Generator's self-
assessment (CI checks, build output, test results) is supplementary but never
authoritative. Even if the Generator reports all tests passing, critics must
still run -- the black box principle requires that the evaluator independently
verify the system's behavior rather than trusting the effector's self-report.

## Agent Roles and Separation

The architecture uses five specialized agents organized in two tiers.

### Planning and Generation Tier

**Planner:** Expands the user's short prompt into an ambitious product
specification. The Planner has the most constrained tool surface: only Read
and Write. It cannot run commands, cannot access the network, and cannot
modify anything except the specification file. Its job is pure specification
-- turning a vague prompt into a detailed, ambitious product vision.

**Generator:** Builds the full application from the specification. In round 1,
the Generator reads only the specification. In rounds 2+, it reads the
previous round's evaluation report first and fixes only what was flagged (the
damping principle). The Generator has broad tool access (Read, Write, Edit,
Bash, and various MCP tools) because it needs to install dependencies, run
builds, and construct the application. Its prompt guard constrains it to
application source code -- it must not write to the evaluation folder.

### Critic Ensemble Tier

Each critic evaluates a different quality dimension through a different
methodology, providing the requisite variety needed to assess a complex
application.

**Perceptual critic:** Evaluates visual quality and cross-page consistency
through screenshots and visual inspection. This critic captures what a user
perceives at first glance -- design coherence, responsive layout, typography,
color palette consistency, and cross-page visual harmony. Its methodology is
observation-based: taking screenshots, comparing visual properties across
pages, and assessing adherence to the specification's design language.

**Projection critic:** Evaluates functional correctness through automated
behavioral tests. This critic verifies that the application does what the
specification promises by writing and executing test scripts that exercise
features, verify data flow, test navigation state persistence, and probe AI
feature integration. Its methodology uses the write-and-run pattern for token
efficiency.

**Perturbation critic:** Evaluates resilience through adversarial stress
testing. This critic subjects the application to conditions beyond what the
specification describes -- extreme inputs, rapid navigation, viewport
extremes, error injection, and boundary conditions. Its methodology is
adversarial: deliberately trying to break the application to discover
fragility that normal-path testing would miss. The methodology boundary is
clear: within-specification conditions belong to the other critics; beyond-
specification conditions belong to the perturbation critic.

### Orchestrator

The "dumb coordinator." The orchestrator never reads agent output to assess
quality. It delegates all work to agents and all analysis to a deterministic
CLI tool. It performs only:

- Binary file-exists checks after each agent (does the output file exist?)
- State transitions via CLI JSON responses
- Git workspace setup, milestone tagging, and rollback
- Error recovery (same-prompt retries, user escalation)
- N-critic spawning, checking, and per-critic retry on failure

The orchestrator acts on `exit_condition` and `should_continue` fields from
the CLI tool's JSON response -- it never interprets scores, reads evaluation
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
structural violations (critics cannot use Edit to modify source code). Prompt
guards prevent behavioral violations within allowed tools (Generator has Write
but is instructed not to write evaluation artifacts).

## Cybernetics Principles

The convergence detection system and feedback loop draw on concepts from
cybernetics and control theory.

### Requisite Variety (Ashby's Law)

Ashby's Law of Requisite Variety states that a control system must have at
least as much variety as the system it regulates. A monolithic evaluator
lacks the variety to simultaneously assess visual design through screenshot
comparison, functional correctness through behavioral testing, and adversarial
resilience through stress testing. Each evaluation dimension requires a
qualitatively different methodology.

The ensemble architecture provides requisite variety through critic
specialization. Each critic brings a distinct evaluation methodology (visual
inspection, automated testing, adversarial perturbation), and the ensemble's
combined variety matches the multi-dimensional quality space of a complex
application. Adding a new quality dimension requires adding a new specialized
critic -- the architecture scales variety by composition.

### Escalation Vocabulary (E-0 through E-IV)

The system classifies each round's score trajectory into named operating
regimes -- a concept from cybernetics where a system's behavior is categorized
into qualitatively different modes, each with its own response strategy.

| Level | Name | Condition | System Response |
|-------|------|-----------|-----------------|
| E-0 | Progressing | Score improved beyond progressing threshold | Continue -- system is converging |
| E-I | Decelerating | Score improved but delta shrinking | Continue with warning -- improvement slowing |
| E-II | Plateau | Improvement below plateau threshold over a multi-round window | Stop (PLATEAU exit) -- natural convergence reached |
| E-III | Regression | Consecutive total-score declines | Stop + rollback to best round -- system is diverging |
| E-IV | Catastrophic | Single-round drop exceeding crisis threshold or total below minimum floor | Immediate stop + rollback -- catastrophic failure |

The escalation levels are computed deterministically from the score trajectory.
The orchestrator receives the escalation level as part of the JSON response and
uses it for progress output and exit condition dispatch.

Priority order: E-IV > E-III > E-II > E-I > E-0 (first match wins).

Special cases:
- Round 1 is always E-0 (no prior data to compare)
- The PASS verdict overrides all escalation
- A safety cap fires if no prior exit condition is reached

### Damping Principle

In rounds 2+, the Generator is instructed to fix only what critics flagged. It
must not add new features, refactor working code, or make speculative
improvements. This is analogous to damping in control systems -- unconstrained
changes cause oscillation instead of convergence.

Without damping, the Generator might "fix" a low visual design score by
rewriting the entire UI, accidentally breaking functionality that was working.
By constraining round 2+ changes to critic-flagged issues only, each round
makes targeted corrections that move scores upward without introducing new
regressions.

This principle is enforced via the Generator's agent definition (prompt guard),
not the orchestrator's prompt. The orchestrator sends only the round number --
the Generator's instructions handle the fix-only constraint.

### EMA Smoothing Principle

The convergence detection system uses exponentially weighted moving average
(EMA) smoothing to dampen noise in the score trajectory. Individual rounds can
produce anomalous scores due to critic variance, environmental factors, or
one-off failures. Without smoothing, a single anomalous round could trigger a
false plateau or regression signal, causing premature exit or unnecessary
rollback.

EMA smoothing applies a weighted average where recent rounds count more than
older ones, producing a trend line that represents the genuine quality
trajectory rather than round-to-round noise. The smoothing parameter controls
responsiveness: lower values produce smoother (more stable but slower to
respond) trajectories; higher values track recent scores more closely. At the
maximum smoothing parameter (effectively no smoothing), the system degenerates
to using raw scores -- providing backward compatibility.

### Scaled Thresholds Principle

All convergence thresholds are derived from the scoring range (number of
dimensions times the maximum score per dimension), not hardcoded. This means
adding or removing a scoring dimension automatically recalibrates all
convergence thresholds: the plateau threshold, the progressing threshold, the
crisis floor, and the regression threshold all scale proportionally.

This design decision ensures the convergence detection system remains
correctly calibrated as the evaluation ensemble grows. A hardcoded threshold
that was appropriate for three dimensions would be miscalibrated for four, and
wrong again for six. Formula-derived thresholds eliminate this class of bugs
entirely.

### Dual-Path Signal Architecture

Safety-critical decisions and trend decisions have fundamentally different
requirements for signal quality. The convergence detection system addresses
this through a dual-path architecture:

- **Safety path (raw scores):** Catastrophic failure detection and pass
  verdicts use raw (unsmoothed) scores for immediate response. When the
  application crashes or a score drops catastrophically, delayed detection via
  smoothed scores would waste compute on a doomed run.

- **Trend path (smoothed scores):** Plateau detection, progress assessment,
  and deceleration detection use EMA-smoothed scores for noise resistance.
  These decisions benefit from seeing the genuine trajectory rather than
  reacting to single-round variance.

- **Hybrid path (both raw and smoothed):** Some decisions consult both
  signals. Regression detection, for example, checks raw scores for immediate
  drops but uses smoothed scores to distinguish genuine decline from noise.

This separation ensures that urgent signals (catastrophe, clear pass) are
acted on immediately, while trend signals (plateau, slow progress) are
insulated from noise.

### Schmitt Trigger Hysteresis

The convergence thresholds use asymmetric values for entering vs. exiting
convergence states, following the Schmitt trigger pattern from electronics.
The progressing threshold (the improvement needed to signal "still making
progress") is set lower than the plateau threshold (the stall needed to signal
"converged"). This asymmetry prevents oscillation around a boundary -- without
it, a marginal improvement could flip the system between "plateau" and
"progressing" on every round.

The hysteresis gap is calibrated so that the system does not prematurely
declare plateau during slow but genuine improvement, while also not requiring
dramatic jumps to break out of a plateau classification. This is the same
principle used in ISA-18.2 alarm management to prevent "chattering" alarms.

### Feedback Loop Topology

The complete feedback loop follows this path:

Generator -> Application -> Critics -> Score Artifacts -> CLI Aggregator ->
Orchestrator -> Generator

Key properties of this topology:

- **File-mediated communication:** Every handoff between components is through
  files on disk, not in-memory state. This means any component can be
  restarted without losing the feedback signal. Crash recovery reads the file
  system to reconstruct state.

- **Deterministic aggregation:** The CLI aggregator consumes critic score
  artifacts and produces convergence decisions deterministically. Zero LLM
  tokens are spent on scoring math -- the aggregator uses arithmetic, not
  judgment. This follows the Anthropic evals pattern of separating grading
  (what critics do) from gating (what the aggregator does).

- **Externalized comparator:** The comparator (the system that judges whether
  quality is sufficient) is split between critics (who assess quality) and the
  CLI (who applies thresholds). Neither the Generator nor the orchestrator
  participates in quality assessment. This is the cybernetic externalized
  comparator principle applied to multi-agent architecture.

## Anthropic Article Alignment and Divergences

The plugin was inspired by the Anthropic article on multi-agent application
development, which describes a three-agent architecture (Planner, Coder,
Evaluator) for building applications from prompts. The core alignment is
strong -- specialized agents, file-based communication, Playwright-based
evaluation, and model-agnostic agent definitions.

Key divergences:

| Divergence | Rationale |
|------------|-----------|
| **Sprints removed** | The article's v1 used sprint decomposition. Large-context models handle full applications in one shot without needing to decompose work |
| **Context rotation replaced by fresh context** | The article used context rotation for long sessions. The GAN architecture spawns each agent with fresh context per round -- critics get a clean perspective each time |
| **Fixed round count replaced by convergence detection** | The article used a fixed number of rounds. Score-based detection (E-0 through E-IV) adapts to actual quality trajectory |
| **Roles sharpened into adversarial GAN pair** | The article's agents cooperated toward a shared goal. Critics are explicitly adversarial -- their job is to find failures, not to help the Generator succeed |
| **Single evaluator replaced by critic ensemble** | A monolithic evaluator suffered context exhaustion and methodology conflicts. The ensemble provides requisite variety (Ashby's Law) and prevents mode collapse in evaluation |
| **Evaluator commits versioned reports** | The article overwrote a single QA report. Critics write to round-specific folders, preserving full history for trajectory analysis |
| **Git version control throughout** | The article did not specify a git strategy. Agents commit their work and the orchestrator creates milestone tags, enabling rollback on regression |
| **Deterministic CLI aggregator** | The article used the evaluator for both grading and gating. The plugin separates these: critics grade, the CLI aggregator gates. Zero LLM tokens for scoring math (Anthropic evals pattern) |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Orchestrator never reads evaluation content (except Summary) | Maintains "dumb coordinator" principle -- all analysis delegated to deterministic CLI |
| Agents commit their own work, orchestrator creates milestone tags | Agents know what they built and can write meaningful commit messages; orchestrator handles coordination-level milestones |
| Planner has no Bash access | Keeps Planner's tool surface minimal. Orchestrator commits after binary check |
| Minimal agent prompts (round number only) | Agent definitions handle all instructions. Orchestrator fills in only the round number -- no diagnostic context, no escalation hints |
| Ensemble decomposition (multiple critics, not one evaluator) | Monolithic evaluator exhausted context via hundreds of tool calls. Each critic operates in an isolated, focused context. Requisite variety through specialization |
| Deterministic CLI aggregator | Separates grading (what critics do) from gating (what the aggregator does). Zero LLM tokens for scoring math. Follows the Anthropic evals pattern |
| Write-and-run pattern for behavioral testing | Critics write a complete test script, then execute it in a single tool call. Replaces dozens of interactive tool calls with a handful, achieving massive token efficiency |
| Artifact-based crash recovery | State is reconstructed from file system artifacts (score files, evaluation reports, build outputs), not in-memory checkpoints. Any component can crash and the system recovers by reading what exists on disk |
| Two-layer enforcement (tool allowlists + prompt guards) | Structural (runtime-enforced) + behavioral (instruction-enforced) -- defense-in-depth after hooks and disallowed-tools mechanisms were found infeasible |
| Four exit conditions with distinct behaviors | PASS (success), PLATEAU (natural convergence), REGRESSION (rollback), SAFETY_CAP (wrap-up round) -- each has a clear, distinct system response |
| Static production builds over dev servers | Dev servers are fragile, leak ports, and cannot be resumed. Static serving is idempotent and survives crashes |
| Per-critic retry on failure | Retrying all critics wastes the successful ones' work. Individual retry targets only the failed critic |
| Git tags as rollback recovery points | Annotated tags at each round enable reset to a known-good state on regression |
| Scaled thresholds derived from dimension count | Adding or removing scoring dimensions auto-recalibrates all convergence thresholds. Eliminates hardcoded magic numbers |
| EMA smoothing with configurable parameter | Dampens noise in score trajectory without losing responsiveness. Backward-compatible: maximum parameter degenerates to raw scores |

## File-Based Communication Protocol

Agents communicate exclusively through files on disk:

| Artifact | Writer | Readers | Purpose |
|----------|--------|---------|---------|
| Specification file | Planner | Generator, Critics | Product specification -- the contract all agents work against |
| Evaluation report (per round) | CLI aggregator | Generator (next round), Orchestrator (Summary step) | Aggregated scores, per-dimension status, exit condition |
| Critic summary artifacts | Each critic | CLI aggregator | Per-critic scores and findings in a structured format |
| Workflow state file | CLI tool | Orchestrator (via CLI) | Current step, round scores, escalation history |

The critic summary artifact follows an extensible contract principle: any new
critic that writes a summary artifact in the expected format is automatically
consumed by the CLI aggregator without requiring aggregator changes. Adding a
new critic requires defining the agent and registering it with the orchestrator
-- the scoring pipeline adapts automatically because thresholds are derived
from the dimension count.

Git tags serve as milestone markers and recovery points:

| Tag | Created by | Purpose |
|-----|-----------|---------|
| Planning-complete tag | Orchestrator | Marks specification commit after Planner finishes |
| Round-N tag | Orchestrator | Marks completion of each generation/evaluation round |
| Final tag | Orchestrator | Marks the final result with exit condition |

The workflow state file is gitignored -- it survives git rollbacks and is not
part of the committed project. This ensures the orchestrator retains full
round history even after a rollback on regression.

---
*Architecture documented during Phase 2, updated to reflect v1.2 ensemble architecture*
