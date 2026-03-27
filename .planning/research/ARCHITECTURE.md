# Architecture Patterns

**Domain:** GAN-inspired multi-agent application development harness (Claude Code plugin)
**Researched:** 2026-03-27

## Recommended Architecture

The system is a three-component adversarial loop orchestrated by a skill, implemented entirely within Claude Code's plugin system (no external SDK, no custom runtime). The architecture maps GAN principles onto the software development lifecycle:

```
User Prompt
    |
    v
+--------------------+
|   Orchestrator     |  (application-dev SKILL.md)
|   (Coordinator)    |  allowed-tools: Agent, Read
+--------------------+
    |
    | 1. Spawn Planner
    v
+--------------------+
|   Planner          |  (agents/planner.md)
|   (Spec Writer)    |  tools: Read, Write
+--------------------+
    |
    | Writes SPEC.md
    | (+ git commit)
    v
+--------------------+      QA-REPORT.md       +--------------------+
|   Generator        | <--------------------- |   Evaluator         |
|   (GAN Generator)  |  feedback.md channel   |   (GAN Discriminator)|
|   tools: Read,     |                        |   tools: Read, Write,|
|   Write, Edit,     | --------------------> |   Glob, Bash         |
|   Glob, Bash       |  Application code      |   (+ playwright-cli) |
+--------------------+  via filesystem         +--------------------+
         ^                                              |
         |          Orchestrator Loop Control            |
         +----------------------------------------------+
              Round N+1 if FAIL && !converged && N < cap
```

### Key Architectural Principle: Separation Enforced Structurally

The GAN analogy is not metaphorical -- it drives real architectural decisions. In a GAN, the generator cannot see the discriminator's internal weights, and the discriminator cannot modify the generator's output. This translates to:

- **Generator cannot evaluate itself.** Self-evaluation leads to self-praise bias (documented in the Anthropic article and confirmed by community experience). The Generator runs CI checks as an inner feedback loop, but the quality judgment comes from the Evaluator.
- **Evaluator cannot modify code.** It writes QA-REPORT.md only. If the Evaluator could fix bugs directly, the adversarial tension collapses -- you get a single-agent system with extra steps.
- **Orchestrator cannot do agent work.** It spawns agents and reads their output files. If the orchestrator falls back to coding or testing when an agent fails, it violates the architecture. Error-out, not fall-back.
- **Fresh context per agent spawn.** Each subagent gets a clean context window. The Generator does not see the Evaluator's reasoning process, only its structured output (QA-REPORT.md). The Evaluator does not see the Generator's struggle, only the running application. This prevents inherited blind spots -- the core insight from both the Anthropic article and the Claude Forge project.

### Component Boundaries

| Component | Responsibility | Communicates With | Cannot Do |
|-----------|---------------|-------------------|-----------|
| Orchestrator (SKILL.md) | Spawn agents in sequence, read output files, loop control, convergence detection, summary | Planner, Generator, Evaluator (via Agent tool) | Write code, test app, modify SPEC/QA-REPORT, make technical decisions |
| Planner (agents/planner.md) | Expand 1-4 sentence prompt into ambitious SPEC.md | Orchestrator (via return), filesystem (SPEC.md) | Choose tech stack (unless user specified), write code, evaluate |
| Generator (agents/generator.md) | Build/fix the application from SPEC.md and QA-REPORT.md | Orchestrator (via return), filesystem (all project files, QA-REPORT.md read, SPEC.md read) | Evaluate quality, write QA reports, approve own work |
| Evaluator (agents/evaluator.md) | Test running app via Playwright, grade against criteria, write QA-REPORT.md | Orchestrator (via return), filesystem (QA-REPORT.md write, SPEC.md read, source read-only) | Modify application code, fix bugs, change project files |

### Data Flow

The system uses **file-based communication** exclusively. No data passes between agents through the orchestrator's prompt beyond operational instructions (round number, which file to read). This is both a design choice and a Claude Code constraint -- subagents cannot message each other directly.

```
Phase 1: Planning
  User prompt --> Orchestrator --> Agent(planner, prompt=verbatim)
  Planner reads: frontend-design-principles.md (reference)
  Planner writes: SPEC.md
  Planner commits: SPEC.md (v1 requirement)
  Orchestrator reads: SPEC.md (validation check)

Phase 2: Build/QA Loop (rounds 1..N)
  Orchestrator --> Agent(generator, prompt="Round N. Read QA-REPORT.md")
  Generator reads: SPEC.md, QA-REPORT.md (rounds 2+), browser-*/SKILL.md
  Generator writes: Application files, .gitignore, README.md
  Generator runs: npm install, npm run dev, CI checks (inner loop)
  Generator commits: Feature-by-feature throughout build

  Orchestrator --> Agent(evaluator, prompt="QA round N")
  Evaluator reads: SPEC.md, source code (read-only), QA-REPORT.md (prev, rounds 2+)
  Evaluator starts: Dev server (background)
  Evaluator uses: playwright-cli (open, snapshot, click, fill, screenshot, etc.)
  Evaluator writes: QA-REPORT.md, screenshots in qa/round-N/
  Evaluator commits: qa/round-N/ artifacts (v1 requirement)

  Orchestrator reads: QA-REPORT.md
  Orchestrator decides: Continue (FAIL + !converged + round < cap) or Stop (PASS | converged | cap)

Phase 3: Summary
  Orchestrator reads: Final QA-REPORT.md, README.md
  Orchestrator presents: Summary to user
```

### State Machine

The orchestrator follows a deterministic state machine:

```
[INIT] --> [PLANNING] --> [BUILDING] --> [EVALUATING] --> [DECISION]
                              ^                              |
                              |   FAIL + !converged + N<cap  |
                              +------------------------------+
                              |
                         [SUMMARY] <-- PASS | converged | N=cap
```

Decision logic at [DECISION]:

1. **PASS**: All four criteria (Product Depth >= 7, Functionality >= 7, Visual Design >= 6, Code Quality >= 6) met. Stop.
2. **Plateau detected**: Scores stopped improving (see convergence strategy below). Stop.
3. **Round cap reached**: N equals maximum (10 in v1). Stop.
4. **Otherwise**: Start next build round.

## Tool Allowlists Per Agent Role

Tool allowlists are the primary mechanism for enforcing GAN role separation. The principle: each agent gets the minimum tools needed for its role, and nothing more.

### Current State (has gaps)

| Agent | Current `tools` | Issues |
|-------|-----------------|--------|
| Orchestrator | `Agent Read` (in `allowed-tools`) | Should be `Agent, Read` only. Currently correct. |
| Planner | `Read, Write` | Correct for spec writing. Missing git for commit requirement. |
| Generator | `Read, Write, Edit, Glob, Bash` | Full write access is correct. Needs Bash for git, npm, dev server. |
| Evaluator | `Read, Write, Glob, Bash` | Write is needed only for QA-REPORT.md. Bash needed for playwright-cli, dev server, git. |

### Recommended State (v1 hardened)

| Agent | Recommended `tools` | Rationale |
|-------|---------------------|-----------|
| Orchestrator (SKILL.md) | `allowed-tools: Agent, Read` | Coordinate and inspect only. No Write prevents orchestrator from doing agent work. |
| Planner | `tools: Read, Write, Bash` | Read references, Write SPEC.md, Bash for `git add SPEC.md && git commit`. No Edit (writes fresh file, does not patch). No Glob (does not search project). |
| Generator | `tools: Read, Write, Edit, Glob, Bash` | Full development toolkit. Bash for git, npm, dev server, CI checks. This is intentionally broad -- the Generator's job is to produce working code. |
| Evaluator | `tools: Read, Write, Glob, Bash` | Read source (read-only by prompt instruction, not tool restriction -- there is no "read-only Write" tool variant). Write for QA-REPORT.md only (enforced by prompt). Bash for playwright-cli, dev server, curl, git. Glob for finding project files. No Edit (must not patch application code). |

### Tool Restriction Limitations

Claude Code's `tools` field is an allowlist, not a fine-grained permission system. The Evaluator having `Write` means it technically can write to any file. The enforcement that it only writes QA-REPORT.md comes from the prompt, not the tool system. For v1, prompt-based enforcement is sufficient. For v2, consider:

- `PreToolUse` hooks to validate write targets (only allow `QA-REPORT.md` and `qa/` paths)
- `disallowedTools` for explicit denials
- Hooks to validate Bash commands (no `npm install`, no file modifications via sed/awk)

## Patterns to Follow

### Pattern 1: File-Based Agent Communication

**What:** Agents communicate exclusively through files in the working directory. The orchestrator passes only operational context (round number, which files to read) in spawn prompts.

**When:** Always. This is the foundational communication pattern.

**Why:** Fresh context isolation. Each agent reads the other's output cold, without inheriting reasoning or blind spots. This is the core GAN insight -- the Evaluator judges the application without seeing the Generator's struggles, just as a GAN discriminator sees only the output image, not the generator's latent space.

**Example files:**
```
SPEC.md           -- Planner output, Generator/Evaluator input
QA-REPORT.md      -- Evaluator output, Generator input (rounds 2+)
qa/round-N/       -- Screenshots, artifacts per round
```

### Pattern 2: Score-Based Exit with Plateau Detection

**What:** The orchestrator tracks QA scores across rounds and stops when either all thresholds are met (PASS), scores plateau (no meaningful improvement), or the safety cap is reached.

**When:** At the [DECISION] state after each evaluation round.

**Implementation approach:**

```
scores_history = []  -- array of {depth, functionality, design, code} per round

After each QA round:
  Parse QA-REPORT.md for scores
  Append to scores_history

  If all scores >= thresholds:
    EXIT: PASS

  If len(scores_history) >= 3:
    recent = scores_history[-3:]
    total_improvement = sum(recent[-1]) - sum(recent[-3])
    If total_improvement <= 1:  -- less than 1 point total over 3 rounds
      EXIT: PLATEAU

  If round >= cap (10):
    EXIT: CAP
```

**Rationale:** Fixed round counts (the current 3-round limit) lead to either early stopping (issues remain) or wasted rounds (scores already plateaued). The GAN analogy: training stops at convergence, not at a fixed epoch count. The Anthropic article's v2 harness ran 3 rounds for the DAW example, but that was a specific run, not a prescribed limit. The article itself documented quality improvements across rounds.

**Plateau window of 3 rounds** is recommended because:
- 1 round is too noisy (single bad score does not mean plateau)
- 2 rounds catches oscillation but not slow convergence
- 3 rounds balances sensitivity with stability
- Combined threshold of 1 point total improvement is strict enough to catch stagnation but loose enough to allow incremental progress

### Pattern 3: Inner Feedback Loop (Generator Self-Check)

**What:** Before handing off to the Evaluator, the Generator runs CI checks (typecheck, build, lint, test) as a fast inner feedback loop.

**When:** After completing implementation work, before the Generator's subagent returns.

**Why:** The outer GAN loop (Generator <-> Evaluator via Playwright) is expensive -- each Evaluator run takes 5-10 minutes. CI checks catch syntax errors, type errors, and build failures in seconds. This is analogous to a GAN generator checking that its output is a valid image before submitting it to the discriminator.

**Boundary:** The inner loop catches mechanical failures (does it compile? does it build?). The outer loop catches quality failures (does it work? does it look good? does it match the spec?). The Generator must not skip the outer loop even if inner checks pass -- self-evaluation bias means the Generator will always think its code is good enough.

### Pattern 4: Orchestrator as Pure Coordinator

**What:** The orchestrator (SKILL.md) spawns agents, reads their output files, and makes loop control decisions. It never performs agent work itself.

**When:** Always. This is a hard architectural constraint.

**Why:** When the orchestrator falls back to doing agent work (observed in testing -- the orchestrator started writing code when the Generator hit API errors), it:
1. Violates GAN separation (no adversarial feedback on orchestrator-written code)
2. Produces lower quality (orchestrator prompt is not optimized for code generation)
3. Creates a false sense of completeness (no QA on orchestrator-written features)

**Enforcement:** The orchestrator's `allowed-tools: Agent, Read` prevents it from writing files or running Bash commands. If an agent fails (API error, timeout, malformed output), the orchestrator should retry the agent or report the failure to the user -- never attempt the work itself.

### Pattern 5: Commit Strategy

**What:** Git commits happen at defined points in the workflow, creating a recoverable timeline.

**When:**
- Planner: Commit SPEC.md after generating it
- Generator: Commit feature-by-feature throughout build (not just at round end)
- Evaluator: Commit QA report + artifacts into qa/round-N/
- Orchestrator: Tag milestones (post-planning, post-round-N, post-final)

**Why:** Testing revealed that without commits, there are no recovery points. A Generator regression in round 3 can destroy work from round 1 with no way to recover. Feature-by-feature commits also give the Evaluator (in rounds 2+) a `git log` to understand what changed.

**Implementation note:** Planner and Evaluator need `Bash` in their tool lists to run git commands. The Generator already has it. The orchestrator cannot commit (no Bash tool) -- milestone tags must be handled by the last agent to run in each phase, or the orchestrator must spawn a brief agent specifically for tagging.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Orchestrator Fallback to Agent Work

**What:** When an agent fails (API error, rate limit, malformed output), the orchestrator attempts to do the agent's work itself.
**Why bad:** Violates GAN separation. Unreviewed code enters the application. The orchestrator's prompt is not tuned for code generation or QA.
**Instead:** Retry the agent (with a retry limit). If the agent consistently fails, report the error to the user with context about what happened. The orchestrator should error out, never fall back.

### Anti-Pattern 2: Passing Agent Reasoning Through the Orchestrator

**What:** The orchestrator reads an agent's full output and passes a summary to the next agent.
**Why bad:** The orchestrator becomes a bottleneck that filters and distorts information. It also leaks context -- the Evaluator might receive the Generator's internal reasoning, reducing the "fresh eyes" effect.
**Instead:** Agents communicate through files. The orchestrator passes only operational directives: "This is round 2. Read QA-REPORT.md." The agent reads the file directly and forms its own understanding.

### Anti-Pattern 3: Shared Context Between Generator and Evaluator

**What:** Running Generator and Evaluator in the same context window, or letting the Evaluator see the Generator's conversation history.
**Why bad:** The Evaluator inherits the Generator's blind spots. If the Generator struggled with a CSS layout and eventually "fixed" it, the Evaluator -- having seen the struggle -- is primed to be lenient about that area. Fresh context means the Evaluator sees only the result, not the effort.
**Instead:** Each subagent spawn creates a fresh context window (this is the default behavior of Claude Code subagents). Do not attempt to pass conversation history between agents.

### Anti-Pattern 4: Evaluator Modifying Application Code

**What:** Giving the Evaluator Edit tool access so it can "quick-fix" bugs it finds.
**Why bad:** Collapses the adversarial loop into a single-agent system. The Evaluator's fixes are not reviewed by the Evaluator. The Generator never learns from the feedback because the feedback was consumed by the Evaluator itself. In GAN terms: the discriminator is now also generating -- it will converge to passing everything it produces.
**Instead:** The Evaluator writes detailed, actionable bug reports in QA-REPORT.md. The Generator reads these and fixes the bugs in the next round.

### Anti-Pattern 5: Leaking Extra Context to Agents

**What:** The orchestrator adds extra information to agent spawn prompts beyond what SKILL.md defines (e.g., summarizing QA results, adding tips, inserting its own analysis).
**Why bad:** Unpredictable agent behavior. The orchestrator's summary may misrepresent the QA report. Extra tips may conflict with the agent's own instructions. This also makes the system harder to debug -- you cannot reproduce agent behavior by reading its prompt and input files alone.
**Instead:** The orchestrator passes exactly what SKILL.md specifies: the user's prompt verbatim (to Planner), the round number and file reference (to Generator/Evaluator). Nothing more.

## Convergence Strategy: Score-Based Exit with Plateau Detection

### Thresholds (from Evaluator grading criteria)

| Criterion | Threshold | Weight in convergence |
|-----------|-----------|----------------------|
| Product Depth | 7 | Equal |
| Functionality | 7 | Equal |
| Visual Design | 6 | Equal |
| Code Quality | 6 | Equal |

### Exit Conditions (ordered by priority)

1. **PASS**: All four criteria >= their thresholds
2. **PLATEAU**: Total score improvement <= 1 point over last 3 rounds
3. **REGRESSION**: Total score decreased for 2 consecutive rounds (stop, do not make it worse)
4. **SAFETY CAP**: Round count reaches 10

### Score Tracking

The orchestrator must parse QA-REPORT.md after each evaluation to extract the scores table. The parsing target is deterministic (the Evaluator writes a Markdown table with fixed column headers). The orchestrator maintains a mental tally (or could write to a tracking file, but since it only has Read, it must track in-context).

**Important limitation:** The orchestrator runs as a skill in the main context, not as a subagent. It persists across the entire workflow. Score tracking happens naturally in the orchestrator's context window. No external state file is needed -- the orchestrator reads each QA-REPORT.md and accumulates scores in its reasoning.

## Build Order (Dependencies Between Changes)

The following build order reflects dependencies between the v1 hardening requirements. Changes at the top are prerequisites for changes below them.

### Layer 1: Foundation (No Dependencies)

These changes are independent and can be done in any order:

1. **Tool allowlists audit** -- Update agent `tools:` fields per the recommended state above. Add `Bash` to Planner. Verify Evaluator has no `Edit`.
2. **Orchestrator guard rails** -- Add explicit instruction to SKILL.md: "If an agent fails, retry once. If it fails again, report the error to the user. Never attempt agent work yourself." Remove any implicit fallback paths.
3. **Planner commits SPEC.md** -- Add git commit instruction to planner.md. Requires Bash tool.

### Layer 2: Git Strategy (Depends on Layer 1 tool allowlists)

4. **Generator feature-by-feature commits** -- Add commit cadence instructions to generator.md. Generator already has Bash.
5. **Generator adds/updates .gitignore** -- Add to generator.md's setup phase.
6. **Evaluator commits qa/round-N/ artifacts** -- Add commit + folder structure to evaluator.md. Evaluator already has Bash + Write.
7. **Milestone git tags** -- Add tagging to SKILL.md or delegate to last agent per phase. Requires deciding whether the orchestrator gets Bash (not recommended) or delegates tagging to agents.

### Layer 3: Score-Based Exit (Depends on Layer 1 orchestrator guard rails)

8. **Replace fixed 3-round limit with score-based exit** -- Rewrite SKILL.md loop logic. Add plateau detection (3-round window, 1-point threshold). Add 10-round safety cap. Add regression detection (2 consecutive declines).
9. **Orchestrator context discipline** -- Add rule to SKILL.md: "Only pass to agents what is described in this skill. No extra context leaking."

### Layer 4: Evaluator Hardening (Depends on Layer 2 for qa/ structure)

10. **Evaluator validates assets** -- Add asset validation section to evaluator.md: check for broken images, blocked cross-origin, placeholder content, missing attribution.
11. **Evaluator probes AI features adversarially** -- Add adversarial AI testing to evaluator.md: varied inputs, semantic probing, nonsense input detection.

### Layer 5: Generator Capabilities (Depends on Layer 3 for iteration budget)

12. **Generator CI inner loop** -- Add pre-handoff CI check instructions to generator.md: typecheck, build, lint, test.
13. **Generator guided toward browser-* AI skills** -- Update generator.md AI features section with skill references and preference hierarchy.
14. **Generator web search for images** -- Add image sourcing guidance to generator.md: web search with license verification, or build-time generation.

### Layer 6: Bundled Skills (Independent but deploy-time dependency)

15. **Vite+ skill bundled with plugin** -- Create `skills/vite-plus/SKILL.md` in the plugin directory with vp CLI usage, config, and toolchain knowledge.
16. **Generator prefers Vite+ for greenfield** -- Add preference nudge to generator.md. Depends on Vite+ skill existing.

### Dependency Graph

```
Layer 1: [tool-allowlists] [orchestrator-guards] [planner-commits]
              |                    |
Layer 2: [gen-commits] [gen-gitignore] [eval-commits] [milestone-tags]
              |                    |
Layer 3: [score-based-exit] [context-discipline]
              |                    |
Layer 4: [eval-assets] [eval-ai-probing]
              |
Layer 5: [gen-ci-loop] [gen-browser-ai] [gen-images]
              |
Layer 6: [vite-plus-skill] --> [gen-vite-plus-pref]
```

## Claude Code Plugin Architecture Constraints

### Subagent Limitations

- **No sub-sub-agents.** Subagents cannot spawn other subagents. The orchestrator is the only entity that spawns agents. This means the Generator cannot delegate to a "CSS specialist" subagent, and the Evaluator cannot delegate to a "security scanner" subagent. All specialization must be encoded in the agent's prompt and skill references.
- **No inter-agent messaging.** Subagents can only report back to the parent (orchestrator). They cannot message each other. All inter-agent communication must go through files.
- **Plugin agents cannot use hooks, mcpServers, or permissionMode.** These frontmatter fields are ignored for plugin-distributed agents. If hooks are needed (e.g., PreToolUse validation for the Evaluator's Write targets), the user must copy the agent to `.claude/agents/` or configure session-level settings.
- **Tools field is an allowlist, not fine-grained ACL.** `Write` means write anywhere. `Bash` means run anything. Fine-grained control requires hooks (which plugins cannot define).

### Skill Orchestration

- The orchestrator is a skill (`SKILL.md`), not an agent. It runs in the main conversation context and persists across the entire workflow.
- `allowed-tools` on the skill restricts what the main conversation can do while the skill is active. `Agent, Read` means the orchestrator can only spawn agents and read files.
- The skill's `$ARGUMENTS` placeholder passes the user's prompt verbatim to the orchestrator, which forwards it to the Planner.

### Distribution Boundary

Everything in `plugins/application-dev/` ships to users. No test files, no scratch files, no research. The architecture must be fully expressed in:
- `agents/*.md` (agent definitions with YAML frontmatter + system prompts)
- `skills/*/SKILL.md` (orchestration logic and domain skills)
- `commands/*.md` (thin wrappers for slash commands)
- `.claude-plugin/plugin.json` (manifest)

## Scalability Considerations

| Concern | Current (v1) | At 10+ rounds | At complex apps |
|---------|--------------|---------------|-----------------|
| Context window | Orchestrator accumulates across rounds; agents get fresh context per spawn | Orchestrator may hit compaction; score tracking could be lost | Agent context fills during long builds; compaction handles this |
| Token cost | ~$125-200 per full run (Anthropic article data) | Linear scaling with rounds; plateau detection saves budget | Generator's 2+ hour builds dominate cost |
| QA artifacts | Single QA-REPORT.md | qa/round-N/ folders prevent overwriting | Screenshot accumulation; consider cleanup |
| Git history | Feature-by-feature commits | Many commits per round; milestone tags aid navigation | Large diffs; Generator should commit small |

## Sources

- [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-for-long-running-application-development) -- PRIMARY. The source article defining the three-agent architecture. HIGH confidence.
- [Claude Code Docs: Create custom subagents](https://code.claude.com/docs/en/sub-agents) -- AUTHORITATIVE. Definitive reference for agent YAML frontmatter, tool restrictions, spawning, and limitations. HIGH confidence.
- [Claude Code Docs: Extend Claude with skills](https://code.claude.com/docs/en/skills) -- AUTHORITATIVE. Skill frontmatter, allowed-tools, context:fork. HIGH confidence.
- [freeCodeCamp: How to Apply GAN Architecture to Multi-Agent Code Generation (Claude Forge)](https://www.freecodecamp.org/news/how-to-apply-gan-architecture-to-multi-agent-code-generation/) -- Independent implementation confirming the same architectural patterns. File-based communication, tool allowlists per role, iteration caps, fresh context per agent. HIGH confidence (cross-validated with Anthropic article).
- [Claude Code Docs: Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams) -- Agent Teams (experimental). Not used in this architecture but documents the alternative. MEDIUM confidence.
- [SitePoint: Agentic Design Patterns 2026](https://www.sitepoint.com/the-definitive-guide-to-agentic-design-patterns-in-2026/) -- Generator-evaluator pattern documentation. MEDIUM confidence.
- [ASDLC.io: Adversarial Code Review](https://asdlc.io/patterns/adversarial-code-review/) -- Ralph Loop and adversarial patterns. MEDIUM confidence.
- [OpenClaw: Fixing Agent Loops](https://www.shopclawmart.com/blog/fixing-agent-loops-openclaw) -- Convergence detection, boredom detection, semantic similarity. MEDIUM confidence (different domain but applicable principles).
- [Understanding Data: Actor-Critic Adversarial Coding](https://understandingdata.com/posts/actor-critic-adversarial-coding/) -- 3-5 rounds eliminate 90%+ issues. MEDIUM confidence.
