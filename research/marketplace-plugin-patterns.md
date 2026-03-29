# Marketplace Plugin Distribution Patterns for Claude Code

**Researched:** 2026-03-29
**Domain:** Claude Code plugin marketplace distribution -- token costs, agent-invoked skills, multi-model compatibility, emphasis patterns
**Confidence:** HIGH (primary sources: official Claude Code docs, plugin-dev plugin, Anthropic skill authoring best practices)

## Summary

This research investigates marketplace-specific distribution considerations for Claude Code
plugins. It covers six domains: token cost model, agent-invoked skills (the `skills:` frontmatter
field), multi-model compatibility (model: inherit across Opus 4.6 and Sonnet 4.6), emphasis
patterns for distributed plugins, progressive disclosure in marketplace context, and distribution
size/organization.

The key finding is that Claude Code's plugin system uses a **three-level progressive disclosure
model** that significantly reduces runtime token costs: (1) metadata always loaded (~100 tokens
per skill), (2) SKILL.md body loaded on skill activation, (3) reference files loaded on-demand.
Agent definitions (.md files in agents/) are loaded per-spawn into the subagent's context. The
`skills:` frontmatter on plugin agents was broken (bug #25834, filed Feb 2026, marked COMPLETED
Feb 17, 2026) but the related issue #24780 was closed NOT_PLANNED (Mar 13, 2026), creating
uncertainty about current behavior. The dual mechanism (frontmatter + Read fallback) remains the
safest pattern.

For multi-model compatibility with `model: inherit`, the official guidance is clear: "Test your
Skill with all the models you plan to use it with. What works perfectly for Opus might need more
detail for Haiku." For our plugin targeting Opus 4.6 (primary) and Sonnet 4.6 (experimental),
emphasis should be calibrated for Opus (the primary target) with Sonnet compatibility as a
secondary concern. Sonnet 4.6 delivers ~98% of Opus 4.6 coding performance, so well-structured
instructions should work across both.

**Primary recommendation:** Maintain the dual mechanism for skills injection (frontmatter + Read
fallback). Calibrate emphasis for Opus 4.6 (reduce MUST/NEVER/CRITICAL). Preserve behavioral
WHY-focused instructions that work across models. Keep agent definitions under 500 lines with
progressive disclosure via references/.

## 1. Plugin Loading and Token Costs

### How Loading Works at Runtime

Based on Anthropic's official documentation (code.claude.com/docs/en/skills and
platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices):

| Content | When Loaded | Token Cost |
|---------|-------------|------------|
| Skill metadata (name + description) | Session startup, always | ~100 tokens per skill |
| SKILL.md body | When skill triggers (relevance match) | Full body tokens |
| Reference files | On-demand via Read/Bash | Only when explicitly read |
| Agent definitions (.md) | Per-spawn into subagent context | Full definition tokens |
| Scripts (scripts/) | Executed, not loaded into context | Only script OUTPUT tokens |

**Source:** "At startup, only the metadata (name and description) from all Skills is pre-loaded.
Claude reads SKILL.md only when the Skill becomes relevant, and reads additional files only as
needed." -- Anthropic Skill Authoring Best Practices

**Source:** "Subagents are specialized AI assistants that handle specific types of tasks. Each
subagent runs in its own context window with a custom system prompt." -- code.claude.com/docs/en/sub-agents

### Token Cost Model for Our Plugin (application-dev)

**Startup cost (always paid):**

7 skill metadata entries x ~100 tokens = ~700 tokens
- application-dev (orchestrator)
- browser-prompt-api
- browser-webllm
- browser-webnn
- playwright-testing
- vitest-browser
- vite-plus

This is the baseline cost every user pays just for having the plugin enabled.

**Orchestrator activation cost (SKILL.md loads when user says "build me an app"):**

| File | Lines | Estimated Tokens |
|------|-------|-----------------|
| application-dev/SKILL.md | 461 | ~4,000-5,000 |

**Per-agent-spawn costs (each time an agent is spawned):**

| Agent | Lines | Estimated Tokens | Spawns Per Run |
|-------|-------|-----------------|----------------|
| planner.md | 98 | ~1,000 | 1 |
| generator.md | 253 | ~2,500 | 1-10 (per round) |
| evaluator.md | 465 | ~4,500 | 1-10 (per round) |

**On-demand reference costs (loaded by agents during execution):**

| Reference | Lines | Loaded By | When |
|-----------|-------|-----------|------|
| SPEC-TEMPLATE.md | 85 | Planner | Round 1 |
| frontend-design-principles.md | 68 | Planner, Generator | Round 1 |
| ASSETS-TEMPLATE.md | 46 | Generator | Round 1 |
| EVALUATION-TEMPLATE.md | 196 | Evaluator | Every round |
| SCORING-CALIBRATION.md | 231 | Evaluator | Every round |
| AI-PROBING-REFERENCE.md | 592 | Evaluator | When AI features present |

**Skills loaded by generator via Read fallback:**

| Skill SKILL.md | Lines | When |
|----------------|-------|------|
| vite-plus | 281 | Round 1 if using Vite+ |
| playwright-testing | 174 | Round 1 + integration phase |
| vitest-browser | 307 | Round 1 if browser APIs used |
| browser-prompt-api | 353 | When Prompt API features present |
| browser-webllm | 328 | When WebLLM features present |
| browser-webnn | 316 | When WebNN features present |

**Key insight:** Each agent runs in its own context window. The generator's context is independent
of the evaluator's context. This means reference files loaded by the evaluator do NOT consume
generator tokens and vice versa. The subagent isolation model is token-efficient by design.

### Implications for Optimization

1. **SKILL.md at 461 lines is near the 500-line recommended limit.** Reducing it saves startup
   tokens but the savings are modest (~500-1000 tokens). The primary motivation for SKILL.md
   optimization should be behavioral quality, not token savings.

2. **Evaluator at 465 lines is the heaviest per-spawn cost.** Since the evaluator is spawned once
   per round (potentially 10 times), even a 100-line reduction saves ~1,000 tokens x 10 rounds =
   ~10,000 tokens over a full run.

3. **Reference files are loaded per-subagent-spawn.** The evaluator reads EVALUATION-TEMPLATE.md
   and SCORING-CALIBRATION.md every round. These are efficient because they provide critical
   calibration data. Moving more content FROM the evaluator TO references trades agent-body tokens
   for reference-load tokens -- the net effect is neutral on token count but positive on
   behavioral quality (leaner agent body = better instruction following).

4. **Script execution does not load scripts into context.** The appdev-cli.mjs calls produce only
   JSON output in context. This is the most token-efficient pattern available.

## 2. Agent-Invoked Skills (skills: Frontmatter)

### How It Is Supposed to Work

Per the official Claude Code docs (code.claude.com/docs/en/sub-agents):

> "Use the `skills` field to inject skill content into a subagent's context at startup. This
> gives the subagent domain knowledge without requiring it to discover and load skills during
> execution. The full content of each skill is injected into the subagent's context, not just
> made available for invocation. Subagents don't inherit skills from the parent conversation;
> you must list them explicitly."

This means the generator's frontmatter:
```yaml
skills: [browser-prompt-api, browser-webllm, browser-webnn, playwright-testing, vitest-browser, vite-plus]
```
should inject the FULL SKILL.md content of all 6 skills into the generator's context at spawn
time. That would be ~1,759 lines / ~15,000 tokens injected upfront, regardless of whether the
generator needs them.

### Bug #25834: The Reality

**Issue:** "Plugin agent `skills:` frontmatter silently fails to inject skill content"
**Filed:** 2026-02-15
**Status:** CLOSED as COMPLETED on 2026-02-17
**State reason:** COMPLETED

The bug was clear: "Tested across 17 different plugin agents -- 0/17 had skills injected."
It was marked as completed 2 days after filing. However, there are complications:

- **Issue #15178** (related): "Plugin skills not injected into `<available_skills>` context" --
  still OPEN. This is about skills not appearing in the system prompt's available_skills list,
  which is a different (upstream) problem.

- **Issue #24780**: "Teammates do NOT load skills despite documentation stating they do" -- CLOSED
  as NOT_PLANNED on 2026-03-13. This suggests the broader skills-loading mechanism still has
  unresolved edge cases.

### Current Assessment (March 2026)

**Confidence: MEDIUM** -- Bug #25834 was marked COMPLETED but related issues remain open.

The safest pattern remains the **dual mechanism** established in Phase 4:
1. `skills:` frontmatter for future compatibility (when it fully works)
2. Explicit `Read ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` instructions in the agent body
   as a fallback

**If skills injection IS working now:** The generator would receive ~15,000 tokens of skill content
at spawn time, ALL of it, regardless of whether the app needs browser AI features. This is
actually wasteful compared to the on-demand Read pattern, where the generator only loads the
skills it needs.

**If skills injection is NOT working:** The Read fallback ensures the generator still has access to
skill content. The agent reads only the skills relevant to the current app.

### Recommendation: Keep the Dual Mechanism, But Prefer Read

The Read fallback pattern is actually SUPERIOR to skills injection for our use case because:

1. **Selective loading:** Generator reads only skills relevant to the app (e.g., only vite-plus
   and playwright-testing for a simple web app, not browser-webllm or browser-webnn)
2. **Context efficiency:** ~2,000-3,000 tokens on demand vs ~15,000 tokens upfront
3. **Robustness:** Works regardless of bug status

The `skills:` frontmatter should be kept for documentation purposes and future compatibility, but
the Read instructions in the agent body are the primary mechanism and should be preserved even
after the bug is confirmed fixed.

**What to tell the planner:** Preserve `skills:` frontmatter on the generator. Keep all Read
instructions for skills in the agent body. These are not redundant -- the Read pattern is
actually better for selective loading. The note about bug #25834 can be shortened to one line
since it is no longer the primary justification for the Read pattern.

## 3. Multi-Model Compatibility (model: inherit)

### How model: inherit Works

From the official docs: "If not specified, defaults to `inherit` (uses the same model as the
main conversation)." The resolution order is:

1. `CLAUDE_CODE_SUBAGENT_MODEL` environment variable (if set)
2. Per-invocation model parameter (from the parent agent)
3. Agent definition's `model` frontmatter
4. Main conversation's model

Our agents all use `model: inherit`, meaning they run on whatever model the user's session is
using. This could be:
- **Opus 4.6** (Max/Team Premium default) -- our primary target, proven
- **Sonnet 4.6** (Pro/Team Standard default) -- secondary, experimental, unproven
- **Haiku** (unlikely for our use case but technically possible)
- **opusplan** alias (Opus for planning, Sonnet for execution)

### The Model Compatibility Question

From Anthropic's skill authoring best practices:

> "Test your Skill with all the models you plan to use it with. What works perfectly for Opus
> might need more detail for Haiku. If you plan to use your Skill across multiple models, aim
> for instructions that work well with all of them."

And from their testing considerations:
- **Claude Haiku**: "Does the Skill provide enough guidance?"
- **Claude Sonnet**: "Is the Skill clear and efficient?"
- **Claude Opus**: "Does the Skill avoid over-explaining?"

### Opus 4.6 vs Sonnet 4.6: What Matters for Instructions

**Performance gap:** Sonnet 4.6 delivers ~98% of Opus 4.6 coding performance at one-fifth the
cost. For well-structured, clear instructions, both models should perform similarly.

**Where they differ:**
- **Opus 4.6 overtriggers on emphasis.** From Anthropic's prompting docs: "Instructions that
  undertriggered in previous models are likely to trigger appropriately now." MUST/NEVER/CRITICAL
  in Opus 4.6 can cause excessive caution, over-checking, and rigidity.
- **Sonnet 4.6 may need clearer structure.** As the less capable model, Sonnet benefits from
  explicit step-by-step instructions and clear output format specifications.
- **Both respond well to WHY-based instructions.** Explaining rationale ("this prevents
  oscillation") works better than emphasis ("NEVER do this") across both models.

### Recommended Strategy

**Calibrate for Opus 4.6 (primary target), verify with Sonnet 4.6:**

1. **Reduce MUST/NEVER/CRITICAL** -- Normal phrasing is sufficient for Opus. Sonnet 4.6 at 98%
   coding parity should also follow normal phrasing.

2. **Keep WHY-based rationale** -- "Do not modify source code (the evaluator is read-only; source
   changes contaminate the next generation round)" works for both models. The rationale helps
   both models generalize the principle.

3. **Keep explicit output format specifications** -- Both models benefit from clear format specs
   (Scores table format, Verdict heading). This is not emphasis; it is structural.

4. **Keep workflow step structure** -- Numbered steps with headings help both models. This is the
   "medium freedom" pattern from the best practices: "A preferred pattern exists."

5. **Preserve XML tags for structural sections** -- `<frontend_aesthetics>`, `<example>` blocks
   in descriptions. Both models parse XML tags well.

6. **Exception: Keep strong language for output-domain constraints** -- The evaluator's "Never
   modify the application's source code" and the generator's "Do not write to the evaluation/
   folder" are safety-critical boundaries. These are the "narrow bridge with cliffs" from the
   best practices -- low freedom, specific guardrails. Use "Do not" (not "NEVER") for these.

### What NOT to Do

- **Do not add Sonnet-specific verbose instructions.** This bloats the agent for all users,
  including Opus users who pay the overtriggering cost.
- **Do not use different agent definitions for different models.** The `model: inherit` design
  means one definition serves all models. Write for the intersection.
- **Do not duplicate instructions for Sonnet safety.** Anthropic's best practice says "avoid
  duplication." If Sonnet needs more guidance on a specific behavior, the fix is clearer
  instructions, not repeated instructions.

## 4. Emphasis and Instruction Patterns for Distribution

### What the Official Sources Say

**Anthropic Skill Authoring Best Practices:**
> "Only add context Claude doesn't already have. Challenge each piece of information: 'Does
> Claude really need this explanation?'"

**Plugin-dev skill-development SKILL.md:**
> "Writing Patterns: Prefer using the imperative form in instructions."
> "Writing Style: Try to explain to the model why things are important in lieu of heavy-handed
> musty MUSTs."

**Skill-creator SKILL.md (from Anthropic's skills repo):**
> "If you find yourself writing ALWAYS or NEVER in all caps, or using super rigid structures,
> that's a yellow flag -- if possible, reframe and explain the reasoning so that the model
> understands why the thing you're asking for is important."

**Anthropic Prompting Best Practices (platform.claude.com):**
> "Instructions that undertriggered in previous models are likely to trigger appropriately now"
> (re: Opus 4.6 / Claude 4.6 models)

### Evidence-Based Emphasis Hierarchy

Based on convergent evidence from all official sources:

| Level | When to Use | Pattern | Example |
|-------|------------|---------|---------|
| **Safety-critical** | Output domain, security | "Do not [action]. [Reason]." | "Do not modify source code. The evaluator is read-only." |
| **Behavioral identity** | Core mindset, role | WHY-focused paragraph | "Try to break it. Your primary job is adversarial..." |
| **Procedural** | Workflow steps | Numbered steps with headings | "### Step 5: Scroll-and-Inspect All Pages" |
| **Guidance** | Best practices, preferences | Normal prose, imperative | "Use conventional commit messages scoped to the feature." |
| **Informational** | Context, rationale | Parenthetical or sentence | "(this prevents oscillation between rounds)" |

**What to remove:**
- MUST/NEVER/CRITICAL in ALL CAPS (replace with normal bold or "Do not")
- Duplicate sections for emphasis (violates "avoid duplication")
- Explanations of things Claude already knows (what GANs are, how git works)
- Educational framing ("Think of it as...") -- use direct instructions

**What to preserve:**
- Bold for terms being defined: "**Fix-only mode (rounds 2+):**"
- XML tags for structural sections: `<example>` in descriptions
- WHY-based rationale after constraints
- Clear heading hierarchy

### How Existing Marketplace Plugins Handle Emphasis

**Skill-creator (Anthropic's own):** Conversational, WHY-focused, no ALL-CAPS emphasis. Uses
phrases like "This is pretty important" rather than "CRITICAL." Explains reasoning extensively.
Only uses emphasis for structural pointers: "ALWAYS use this exact template."

**Plugin-dev agent-development:** Standard bold for field names, no ALL-CAPS. Uses checkmark/X
patterns for do/don't lists. Factual, reference-style.

**Plugin-dev skill-development:** Imperative style. Third-person in descriptions. Bold for
mistakes/patterns. No MUST/NEVER/CRITICAL emphasis.

**Pattern across Anthropic plugins:** None of them use ALL-CAPS emphasis patterns. They use
normal bold, clear heading structure, and WHY-based explanations.

## 5. Progressive Disclosure in Marketplace Context

### Reference File Organization

**Official recommendation from plugin-dev skill-development:**
```
skill-name/
|-- SKILL.md (1,500-2,000 words ideal, <500 lines max)
|-- references/ (loaded as needed, 2,000-5,000+ words each)
|-- examples/ (working code examples, copied directly)
'-- scripts/ (executed without loading into context)
```

**Official recommendation from Anthropic best practices:**
> "Keep references one level deep from SKILL.md."
> "All reference files should link directly from SKILL.md to ensure Claude reads complete files."

### Our Current Structure

```
skills/application-dev/
|-- SKILL.md (461 lines -- near 500 limit)
|-- references/
|   |-- ASSETS-TEMPLATE.md (46 lines)
|   |-- frontend-design-principles.md (68 lines)
|   |-- SPEC-TEMPLATE.md (85 lines)
|   '-- evaluator/
|       |-- AI-PROBING-REFERENCE.md (592 lines)
|       |-- EVALUATION-TEMPLATE.md (196 lines)
|       '-- SCORING-CALIBRATION.md (231 lines)
```

This structure uses a **two-level hierarchy** (references/ -> evaluator/) which is technically
one level deeper than the recommendation. However, this is fine because:
1. The agent definitions (evaluator.md) reference evaluator/ files directly, not via SKILL.md
2. The one-level-deep rule applies to SKILL.md -> references, not agent -> references
3. Agent definitions have their own Read instructions pointing directly to specific files

### How Reference Depth Should Work

```
SKILL.md (orchestrator)
|-- References SKILL.md -> references/SPEC-TEMPLATE.md (1 level)
|
Agent definitions (loaded independently per-spawn)
|-- evaluator.md -> references/evaluator/SCORING-CALIBRATION.md (direct path)
|-- generator.md -> skills/vite-plus/SKILL.md (direct path)
|-- planner.md -> references/SPEC-TEMPLATE.md (direct path)
```

Each Read instruction provides a full `${CLAUDE_PLUGIN_ROOT}/...` path. There is no
reference-chain problem because agents reference files directly, not through intermediate files.

### Naming Conventions for References

Based on patterns observed across Anthropic plugins:

| Convention | Example | When to Use |
|-----------|---------|-------------|
| ALL-CAPS kebab | EVALUATION-TEMPLATE.md | Templates the agent fills in |
| ALL-CAPS kebab | SCORING-CALIBRATION.md | Reference data the agent consults |
| lowercase kebab | frontend-design-principles.md | Guidance documents |
| kebab directories | evaluator/ | Agent-specific reference grouping |

Our plugin follows these conventions correctly.

### How Many References Is Too Many?

**Anthropic plugins as benchmarks:**
- plugin-dev agent-development: 3 references, 2 examples, 1 script
- plugin-dev skill-development: 1 reference
- plugin-dev hook-development: 3 references, 3 examples, 3 scripts
- skill-creator: 1 reference, 3 agents (nested), scripts, eval-viewer
- angular-developer (community): 30+ references (one per domain)

**Our plugin:** 6 references + 3 sub-skill references + 1 example. This is moderate and
well-organized.

**The limit is not file count but load frequency.** The angular-developer skill has 30+
references but each agent invocation typically loads only 2-3. Our evaluator loads 3 references
per round (template, calibration, optionally probing). This is well within reasonable bounds.

**Practical limit:** If an agent needs to Read more than 5 reference files per invocation, the
Read overhead (round-trip time + context consumption) may offset the progressive disclosure
benefit. Keep per-invocation loads under 5.

## 6. Distribution Size and Organization

### What Ships to Users

Every file inside `plugins/application-dev/` is distributed:

```
plugins/application-dev/ (25 files total)
|-- .claude-plugin/plugin.json (1 file, ~350 bytes)
|-- agents/ (3 files, ~816 lines total)
|   |-- planner.md (98 lines)
|   |-- generator.md (253 lines)
|   '-- evaluator.md (465 lines)
|-- skills/ (7 skills, ~2,220 lines SKILL.md + ~2,115 lines references)
|   |-- application-dev/ (orchestrator + references)
|   |-- browser-prompt-api/ (SKILL.md + references/ + examples/)
|   |-- browser-webllm/ (SKILL.md only)
|   |-- browser-webnn/ (SKILL.md only)
|   |-- playwright-testing/ (SKILL.md + references/)
|   |-- vite-plus/ (SKILL.md only)
|   '-- vitest-browser/ (SKILL.md only)
|-- scripts/ (appdev-cli.mjs + supporting)
'-- README.md
```

### Size Considerations

**Are there official size recommendations?** No hard limits found. The guidance is:
- SKILL.md body: <500 lines per skill
- Agent definitions: 500-3,000 characters for system prompt (from agent-development skill)
  though complex agents can go to 5,000-10,000 characters
- Reference files: 2,000-5,000+ words each is fine (loaded on-demand)

**Our sizes vs recommendations:**

| File | Lines | Status |
|------|-------|--------|
| evaluator.md | 465 | At threshold -- Phase 5 extraction target |
| SKILL.md (orchestrator) | 461 | Near 500-line limit -- Phase 5 optimization target |
| generator.md | 253 | Healthy |
| planner.md | 98 | Compact |
| AI-PROBING-REFERENCE.md | 592 | Large but on-demand only |
| SCORING-CALIBRATION.md | 231 | Moderate, loaded every round |

**The 500-line limit applies to SKILL.md files, not agent definitions.** Agent definitions are
loaded per-spawn into their own context, not at session startup. However, keeping agents lean
improves instruction-following quality (the primary Phase 5 goal).

### Plugin Security Restrictions

From the official docs:
> "For security reasons, plugin subagents do not support the `hooks`, `mcpServers`, or
> `permissionMode` frontmatter fields. These fields are ignored when loading agents from a
> plugin."

This means our agents cannot use:
- `hooks:` in frontmatter (would need to be defined in settings.json)
- `mcpServers:` in frontmatter
- `permissionMode:` (cannot set bypassPermissions from plugin)

Our agents currently do not use any of these fields, so this is not a concern. But it is a
constraint for future development.

### What NOT to Put in plugins/

Per AGENTS.md: "Keep these directories clean. Do not add tests, scratch files, editor configs,
build tooling, CI workflows, plans, or research material here."

The following must NOT be in `plugins/application-dev/`:
- `.planning/` directory
- `research/` directory
- `tests/` or `benchmarks/`
- CI configuration
- This research document itself

## 7. Frontmatter Fields Available for Plugin Agents

Complete reference from the official docs (code.claude.com/docs/en/sub-agents):

| Field | Required | Plugin Support | Our Usage |
|-------|----------|---------------|-----------|
| name | Yes | Yes | All 3 agents |
| description | Yes | Yes | All 3 agents (with examples) |
| model | No | Yes | `inherit` on all 3 |
| color | No | Yes | blue, green, yellow |
| tools | No | Yes | Restricted per agent |
| disallowedTools | No | Yes | Not used |
| skills | No | Yes (but was buggy) | Generator only |
| maxTurns | No | Yes | Not used |
| effort | No | Yes | Not used |
| isolation | No | Yes | Not used |
| background | No | Yes | Not used |
| initialPrompt | No | Yes | Not used |
| memory | No | Yes | Not used |
| hooks | No | **NO** (ignored for plugins) | N/A |
| mcpServers | No | **NO** (ignored for plugins) | N/A |
| permissionMode | No | **NO** (ignored for plugins) | N/A |

### Description Field Best Practices

The description is the **most critical field** for agent triggering. From plugin-dev
agent-development skill:

> "Defines when Claude should trigger this agent. This is the most critical field."

Requirements:
1. Triggering conditions ("Use this agent when...")
2. Multiple `<example>` blocks showing usage
3. Context, user request, and assistant response in each example
4. `<commentary>` explaining why agent triggers

Our agents follow this pattern correctly with 2 examples each.

### Additional Frontmatter Fields to Consider

**effort:** "Effort level when this subagent is active. Overrides the session effort level.
Options: low, medium, high, max (Opus 4.6 only)." We could consider `effort: max` for the
evaluator to ensure thorough evaluation. However, this would only work on Opus 4.6.

**maxTurns:** Could prevent runaway evaluator sessions. Not currently needed but available.

**memory:** Persistent memory across conversations. Could be useful for accumulating
cross-project patterns (e.g., evaluator learning common AI slop patterns). Not a Phase 5
concern but interesting for future development.

## 8. Writing Style for Distributed Plugins

### Agent Body vs Skill Body

The official guidance differs for agents and skills:

**Agent definitions (agent body = system prompt):**
- Write in **second person**: "You are a rigorous, skeptical product critic..."
- From system-prompt-design.md: "Use second person (addressing the agent)"
- Can be more conversational and role-establishing

**Skill SKILL.md (skill body = instructions):**
- Write in **imperative/infinitive form**: "Read the spec. Spawn the generator."
- From skill-development SKILL.md: "Write the entire skill using imperative/infinitive form"
- Third person in description field: "This skill should be used when..."

**Our current state:**
- Agent definitions: correctly use second person ("You are...")
- SKILL.md: uses a mix of imperative ("Execute these steps") and second person ("Do not ask
  the user"). The imperative form should be preferred per the official guidance.

### Description Field Format

From skill-development: "Use third-person format with specific trigger phrases."

Our SKILL.md description uses `>-` multiline YAML, which is correct. However, there is a
known issue: "Claude Code's skill indexer does not parse YAML multiline indicators (`>-`,
`|`, `|-`) correctly." Our description appears to work fine in practice (the skill triggers
correctly), but this is worth monitoring.

## Sources

### Primary (HIGH confidence)
- [Claude Code Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents) -- Complete
  frontmatter reference, skills injection docs, model resolution, plugin security restrictions
- [Anthropic Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) --
  Token costs, progressive disclosure, multi-model testing, emphasis patterns, 500-line limit
- [Plugin-dev agent-development SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/agent-development/SKILL.md) --
  Agent frontmatter fields, description best practices, system prompt design patterns
- [Plugin-dev skill-development SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md) --
  Skill structure, progressive disclosure, imperative writing style, 1,500-2,000 word target
- [Plugin-dev plugin-structure SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/plugin-structure/SKILL.md) --
  Plugin directory layout, auto-discovery, ${CLAUDE_PLUGIN_ROOT}, naming conventions
- [Plugin-dev system-prompt-design.md](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/agent-development/references/system-prompt-design.md) --
  System prompt patterns, length guidelines (500-5,000 words), second person style
- [Bug #25834](https://github.com/anthropics/claude-code/issues/25834) -- Plugin agent skills
  frontmatter injection failure, marked COMPLETED 2026-02-17

### Secondary (MEDIUM confidence)
- [Skill-creator SKILL.md](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) --
  "Heavy-handed musty MUSTs" warning, WHY-over-emphasis principle, mature plugin structure
- [Issue #15178](https://github.com/anthropics/claude-code/issues/15178) -- Plugin skills not
  in available_skills, still OPEN, suggests ongoing discovery issues
- [Issue #24780](https://github.com/anthropics/claude-code/issues/24780) -- Skills loading
  failure, CLOSED as NOT_PLANNED, suggests unresolved edge cases
- [Issue #26179](https://github.com/anthropics/claude-code/issues/26179) -- Request for agents
  to default to Sonnet, user audit showing 0/62 agents need Opus
- [Angular-developer skill pattern](https://angular.love/implementing-the-official-angular-claude-skills/) --
  Meta-skill routing with 30+ references, progressive disclosure at scale

### Tertiary (LOW confidence)
- [Claude Sonnet vs Opus comparison](https://www.nxcode.io/resources/news/claude-sonnet-4-6-vs-opus-4-6-complete-comparison-2026) --
  "98% of Opus's coding performance" claim, community benchmark
- [Mental Model for Claude Code](https://levelup.gitconnected.com/a-mental-model-for-claude-code-skills-subagents-and-plugins-3dea9924bf05) --
  Community mental model for skills/subagents/plugins interaction
