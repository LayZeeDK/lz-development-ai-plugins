# Phase 2: Git Workflow and Loop Control - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Every agent commits its artifacts to git, and the orchestrator uses score-based convergence detection with named exit conditions to decide when to stop looping. The orchestrator remains "dumb" -- all score parsing, convergence analysis, and trajectory tracking is delegated to the appdev-cli. Agents own their commits, the orchestrator owns milestone tags.

</domain>

<decisions>
## Implementation Decisions

### Score extraction and the binary-checks principle
- Orchestrator never reads EVALUATION.md directly (except Summary step for presentation)
- appdev-cli parses EVALUATION.md: extracts scores, verdict, and returns structured JSON
- Orchestrator calls `appdev-cli round-complete --round N --report EVALUATION.md` and acts on the returned JSON
- If EVALUATION.md is missing or malformed, appdev-cli returns an error state; orchestrator delegates to error recovery
- appdev-cli computes ALL convergence logic: plateau detection, regression detection, escalation levels
- appdev-cli returns `exit_condition`, `should_continue`, `escalation` in its JSON response
- Orchestrator acts on `should_continue` and `exit_condition` names -- never interprets scores itself
- Phase 1's binary file-exists check is replaced by "did appdev-cli return valid JSON?"

### CLI rename: appdev-state -> appdev-cli
- Rename `scripts/appdev-state.mjs` to `scripts/appdev-cli.mjs`
- Bash pattern: `Bash(node *appdev-cli*)`
- State file remains `.appdev-state.json`
- Scope: workflow state, score extraction, convergence detection, escalation levels
- NOT in scope: git operations (agents commit, orchestrator tags via Bash(git ...))

### Escalation vocabulary (cybernetics-aligned)
- E-0 Progressing: score improved >1 point -- continue
- E-I Decelerating: score improved but delta shrinking -- continue (warning)
- E-II Plateau: <=1 point improvement over 3-round window -- stop (PLATEAU exit)
- E-III Regression: 2 consecutive total-score declines -- stop + rollback
- E-IV Catastrophic: single-round drop >50% or total <=5 -- immediate stop + rollback
- Inspired by cybernetics control theory: named operating regimes with threshold-based state transitions in a feedback loop
- Computed by appdev-cli, stored in state file per round, shown in progress output

### Exit condition behaviors
- **PASS**: all criteria meet thresholds -- stop, summary, done
- **PLATEAU**: scores converged below thresholds -- stop immediately, no wrap-up round (natural convergence, nothing to consolidate)
- **REGRESSION**: 2 consecutive total-score declines (or E-IV catastrophic) -- stop immediately, rollback to best round via `git reset --hard appdev/round-N`, summary uses best round's EVALUATION.md
- **SAFETY_CAP**: 10 rounds exhausted -- one extra wrap-up round (generation + evaluation) beyond the cap (not counted toward 10), then summary

### Feature watchdog moved to Phase 3
- LOOP-06 (feature count watchdog) is the Evaluator's job, not the orchestrator's
- Orchestrator should not parse feature tables from EVALUATION.md -- breaks GAN role separation
- Phase 3 (Evaluator Hardening) will strengthen the Evaluator to always check every spec feature and never give PASS with Core/Important features missing
- appdev-cli does NOT extract feature counts

### Minimal orchestrator prompts
- Orchestrator sends only the round context; agent definitions handle all instructions
- Planner: `<user's full prompt, verbatim>` (unchanged)
- Generator: `This is generation round N.`
- Evaluator: `This is evaluation round N.`
- LOOP-07 (fix-only mode in rounds 2+) lives in Generator agent definition only
- LOOP-08 (read EVALUATION.md before SPEC.md) lives in Generator agent definition only

### Score trajectory (LOOP-09)
- Already satisfied by .appdev-state.json rounds[].scores + escalation levels
- No separate progress file needed
- appdev-cli get-trajectory subcommand formats on demand

### GAN ubiquitous language rename
- QA-REPORT.md -> EVALUATION.md
- qa/ folder -> evaluation/
- "QA round" -> "evaluation round"
- "QA feedback" -> "Evaluator's feedback"
- "build round" -> "generation round"
- "Building" -> "Generating" (already from Phase 1)
- "QA engineer" -> remove from evaluator.md identity
- No "QA" in any agent definition, prompt, filename, or folder
- Rename applies retroactively to all Phase 1 artifacts

### Git workflow: who commits, who tags
- **Agents commit their own work:**
  - Planner: `git add SPEC.md && git commit -m "docs(spec): product specification"`
  - Generator: commits feature-by-feature, e.g. `feat(canvas): editor component`
  - Evaluator: commits to evaluation/round-N/, e.g. `docs(evaluation): round N report`
- **Orchestrator creates milestone tags:** `appdev/planning-complete`, `appdev/round-N`, `appdev/final`
- **Commit message convention:** conventional commits with feature as scope (not agent role)

### Git workspace setup (new Step 0.5)
- Orchestrator initializes workspace before spawning any agents
- Check for existing git repo: `git rev-parse --git-dir` -- init if needed
- Initialize package.json: `npm init -y`
- Install playwright-cli: `npm install --save-dev playwright-cli` (removes system PATH dependency, turn-key)
- Seed .gitignore with harness infrastructure: `.appdev-state.json`, `.playwright-cli/`, `node_modules/`
- Initial commit: `chore: initialize appdev workspace`
- Generator extends .gitignore with tech-stack entries in its project setup
- Evaluator uses `npx playwright-cli` instead of assuming system PATH

### Orchestrator allowed-tools update
- Current: `Agent Read Write Bash(node *appdev-state*)`
- Phase 2: `Agent Read Write Bash(node *appdev-cli*) Bash(git init*) Bash(git rev-parse *) Bash(git add *) Bash(git commit *) Bash(git tag *) Bash(git reset *) Bash(npm init*) Bash(npm install*)`
- Strict per-command matching patterns, no broad `Bash(git *)`

### Per-round evaluation folder structure
- Evaluator writes to `evaluation/round-N/` (derives path from round number in prompt)
- Contents: EVALUATION.md, screenshots/, console.log, network.log
- No root-level EVALUATION.md copy -- Generator derives path: generation round N reads `evaluation/round-{N-1}/EVALUATION.md`
- Git preserves all rounds as committed history

### docs/ARCHITECTURE.md
- Phase 2 deliverable (not deferred) -- the architectural concepts it documents are implemented in Phases 1-2
- Location: `docs/ARCHITECTURE.md` at repo root (not distributed with the plugin)
- Covers: GAN architecture rationale, cybernetics inspirations (escalation vocabulary, damping principle, Ralph Loop), Anthropic article alignment/divergences, key design decisions
- Phase 2 is the right time: escalation vocabulary and convergence detection land in code here; Phases 3-4 extend the architecture but don't introduce new foundational concepts

### Claude's Discretion
- appdev-cli subcommand interface details (exact flags, output format beyond documented schema)
- Exact escalation level thresholds for E-IV (>50% drop is the starting point, can adjust)
- Workspace setup ordering (npm init before/after git init)
- Git tag message content (lightweight vs annotated tags)
- Console/network log capture format in evaluation folders
- docs/ARCHITECTURE.md structure and depth of coverage

</decisions>

<specifics>
## Specific Ideas

- "This is generation round N" and "This is evaluation round N" -- noun form, GAN-aligned
- Escalation vocabulary explicitly inspired by cybernetics control theory (document in docs/ARCHITECTURE.md)
- Orchestrator as "dumb coordinator" principle extended: never reads agent output files, delegates all parsing to appdev-cli
- appdev-cli round-complete is the single entry point for post-evaluation analysis: scores, verdict, convergence, escalation
- REGRESSION rollback uses git tags as recovery points -- regression commits are still reachable via their tags

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/appdev-state.mjs`: existing state CLI, rename to appdev-cli.mjs and extend with round-complete, get-trajectory, escalation computation
- SKILL.md: existing workflow structure (Resume Check, Plan, Build/QA Loop, Summary) maps to new steps with git workspace setup inserted
- Agent definitions: planner.md, generator.md, evaluator.md already have round-aware instructions to extend

### Established Patterns
- File-based communication: SPEC.md and EVALUATION.md (renamed) as inter-agent protocol
- Agent spawning: `Agent(subagent_type: "application-dev:<role>", prompt: "...")` pattern
- State CLI JSON output protocol: init, get, exists, delete, update, round-complete, complete
- Two-layer enforcement: tool allowlists + prompt guards per agent

### Integration Points
- SKILL.md: insert workspace setup step, update loop logic to use appdev-cli round-complete, add tagging after each phase, add rollback on REGRESSION
- SKILL.md allowed-tools: expand with specific git and npm Bash patterns
- Generator.md: add git commit instructions, strengthen Rounds 2+ fix-only mode, update EVALUATION.md path convention
- Evaluator.md: add git commit instructions, update output path to evaluation/round-N/, rename QA terminology
- Planner.md: add git commit for SPEC.md
- appdev-cli.mjs: add round-complete (score extraction + convergence + escalation), get-trajectory, rename from appdev-state

</code_context>

<deferred>
## Deferred Ideas

- **LOOP-06 feature watchdog** -- moved to Phase 3 as Evaluator responsibility. The Evaluator should check every spec feature and never give PASS with Core/Important features missing.
- **Abort-with-git-rollback** -- from Phase 1 deferred ideas. Now possible with milestone tags from GIT-05.
- `/application-dev:resume` and `/application-dev:pause` commands -- explicit entry points for state management, future enhancement.

</deferred>

---

*Phase: 02-git-workflow-and-loop-control*
*Context gathered: 2026-03-28*
