# Phase 5: Optimize Agent Definitions - Research

**Researched:** 2026-03-29
**Domain:** Claude Code agent definition optimization -- progressive disclosure, instruction engineering, skill extraction
**Confidence:** HIGH

## Summary

This research investigates how to optimize four Claude Code agent definitions (planner.md, generator.md, evaluator.md, SKILL.md orchestrator) for behavioral quality. The primary lever is instruction engineering -- structuring, ordering, and organizing agent instructions so Claude follows them more reliably. The secondary lever is progressive disclosure -- extracting context-heavy content into reference files loaded on demand.

Evidence from Anthropic's official documentation, the plugin-dev and skill-creator plugins, the angular-developer meta-skill pattern, and Anthropic's multi-agent engineering blog converges on clear principles: keep agent bodies lean (<500 lines), use progressive disclosure through references/ for domain-specific content, structure instructions with clear sections and XML tags, provide rationale ("why") not just directives ("must"), and avoid re-teaching Claude what it already knows. The evaluator at 465 lines is at the threshold, and SKILL.md at 461 is near it. Both are candidates for extraction. The generator at 253 lines is healthy. The planner at 98 lines needs minimal change.

**Primary recommendation:** Restructure evaluator.md and SKILL.md using progressive disclosure -- extract protocol-heavy sections (AI Slop Checklist, Self-Verification, round-conditional regression logic, error recovery) into reference files. Keep behavioral mindset and workflow skeleton inline. Deduplicate evaluator Self-Verification. Use consistent round-conditional branching via agent-internal "if round >= 2" pattern.

## Standard Stack

### Core

This phase does not introduce new libraries. The "stack" is the Claude Code plugin infrastructure.

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Claude Code Plugin System | Current (March 2026) | Agent definitions, skill progressive disclosure | Runtime for all agent definitions |
| SKILL.md format | Agent Skills spec v1 | Skill frontmatter + markdown body | Anthropic standard for all skills |
| Agent .md format | Plugin agents spec | YAML frontmatter + markdown body | Anthropic standard for all agents |

### Supporting

| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| `references/` directory | Progressive disclosure for context-heavy content | When a section exceeds ~50 lines or is loaded only in specific conditions |
| `${CLAUDE_PLUGIN_ROOT}` path prefix | Reference plugin-bundled files from agent definitions | All Read instructions in agent bodies |
| `skills` frontmatter + Read fallback | Dual mechanism for skill injection | Bug #25834 workaround (established Phase 4) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Agent-internal round branching | Orchestrator prompt differentiation per round | Violates Phase 1 minimal-orchestrator decision; adds orchestrator complexity |
| Agent-internal round branching | Separate skill reads per round | Over-engineering; simple if/else in agent body is sufficient |
| Extracting Self-Verification to reference | Keeping duplicate inline | Duplication wastes tokens and does not improve compliance (see Research Question 2) |

## Architecture Patterns

### Recommended Agent Definition Structure

Based on convergent evidence from Anthropic's skill-development guide, prompt engineering docs, and the plugin-dev agent-development skill:

```
agent-name.md
|-- YAML frontmatter (name, description with examples, model, color, tools, skills)
|-- Role statement ("You are [expert role]")
|-- Critical Mindset / Core Principles (behavioral, WHY-focused)
|-- Workflow (numbered steps, action-oriented)
|   |-- Step N: [Name] (each step: what to do, when to read references)
|   |-- Conditional: "If round >= 2:" inline branching
|   '-- Reference pointers: "Read [path] for [purpose]"
|-- Rules (hard constraints, output domain)
|-- Quality Standards (behavioral bar)
'-- Self-Verification (single instance, final quality gate)
```

Corresponding references directory:
```
skills/application-dev/references/
|-- evaluator/
|   |-- EVALUATION-TEMPLATE.md (existing)
|   |-- SCORING-CALIBRATION.md (existing)
|   |-- AI-PROBING-REFERENCE.md (existing)
|   |-- AI-SLOP-CHECKLIST.md (NEW -- extracted from evaluator.md)
|   '-- ASSET-VALIDATION-PROTOCOL.md (NEW -- extracted from evaluator.md)
|-- SPEC-TEMPLATE.md (existing)
|-- ASSETS-TEMPLATE.md (existing)
'-- frontend-design-principles.md (existing)
```

### Pattern 1: Progressive Disclosure for Agent Definitions

**What:** Keep the agent body as a lean workflow skeleton with behavioral guidance. Extract protocol-heavy content (checklists, detailed procedures, reference tables) into reference files that the agent reads at specific workflow steps.

**When to use:** When an agent definition exceeds ~300 lines or contains sections that are only relevant during specific workflow steps.

**Extraction threshold:** Move a section to a reference file when:
1. It exceeds ~30 lines AND is only relevant during one workflow step
2. It contains enumerated protocol details (checklists, probe batteries, validation rules) rather than behavioral guidance
3. It would benefit from independent maintenance/updating
4. It is not critical for establishing the agent's behavioral identity

**What stays inline:**
- Role statement and critical mindset (establishes behavioral identity)
- Workflow skeleton with step names and brief descriptions
- Hard rules and output-domain constraints (prompt guards)
- Round-conditional branching logic (simple if/else)
- Quality standards and self-verification checklist

**What moves to references:**
- Detailed protocol specifications (asset validation protocol, AI probing reference)
- Checklists with >10 items (AI slop checklist)
- Template formats (already extracted in Phase 02.1)
- Scoring calibration scenarios (already extracted in Phase 3)

**Source:** Anthropic skill authoring best practices: "Keep SKILL.md body under 500 lines... Split content into separate files when approaching this limit." Plugin-dev skill-development guide: "SKILL.md body <5k words... Target: 1,500-2,000 words." Issue #202 on Anthropic skills repo: "Move ~60-70% of content to references/ for progressive disclosure."

### Pattern 2: Round-Conditional Agent-Internal Branching

**What:** Use simple conditional sections within the agent body to differentiate round 1 behavior from rounds 2+ behavior.

**When to use:** For Generator (build vs fix-only mode) and Evaluator (regression checking in rounds 2+).

**Example:**
```markdown
### Step 2: Check for Regressions (Rounds 2+ Only)

If this is round 2 or later:
1. Read the previous round's report at `evaluation/round-{N-1}/EVALUATION.md`
2. Extract the feature status table (regression candidates)
3. Extract the bugs list (should now be fixed)
...

If this is round 1, skip to Step 3.
```

**Why agent-internal, not orchestrator-driven:** The orchestrator prompt is minimal ("This is generation round N.") per Phase 1 decision. The agent parses the round number from the prompt and branches internally. This keeps orchestrator complexity low and agent self-sufficiency high.

**Consistency:** Both Generator and Evaluator use the same pattern. Round-conditional branching is identified by "Rounds 2+ Only" or "Round 1" labels in step headings. The Evaluator already uses this pattern at Step 2. The Generator already uses it in "Rounds 2+" section. The pattern is consistent -- no change needed to the mechanism, only to how much content is in each branch.

### Pattern 3: Instruction Engineering for Behavioral Quality

**What:** Structure instructions following Anthropic's evidence-based patterns for maximum compliance.

**Key principles from Anthropic's official docs:**

1. **Put long context at the top, instructions at the bottom.** "Queries at the end can improve response quality by up to 30%." For agents, this means: role + behavioral context first, then workflow steps, then rules/verification at the end.

2. **Explain WHY, not just WHAT.** "Providing context or motivation behind your instructions... can help Claude better understand your goals." The evaluator's "Critical Mindset" section is a strong example of this -- it explains WHY skepticism matters, not just WHAT to do.

3. **Use XML tags for logical sections.** "XML tags help Claude parse complex prompts unambiguously." Agent definitions should use clear heading structure with optional XML tags for sections that need emphasis.

4. **Tell Claude what to do, not what not to do.** "Instead of: 'Do not use markdown' -- Try: 'Your response should be composed of smoothly flowing prose paragraphs.'" Apply to agent rules where possible.

5. **Avoid over-prompting for Opus 4.6.** "Instructions that undertriggered in previous models are likely to trigger appropriately now." Remove MUST/NEVER/CRITICAL language where standard phrasing suffices. Opus 4.6 is "more responsive to the system prompt than previous models."

6. **Conciseness matters.** From Anthropic skill authoring: "Challenge each piece of information: 'Does Claude really need this explanation?' 'Can I assume Claude knows this?'" Only add context Claude does not already have.

**Source:** Anthropic prompting best practices (platform.claude.com), skill authoring best practices, Claude 4.6 migration guide.

### Anti-Patterns to Avoid

- **Re-teaching Claude:** Don't explain what PDFs are, what progressive disclosure means, or how git works. Claude knows. The skill-creator issue #202 flagged this exact problem: "Think of them as 'onboarding guides' for specific domains" adds no execution value.

- **Excessive MUST/NEVER/CRITICAL:** Opus 4.6 responds to normal phrasing. Over-emphasis causes overtriggering. Replace "CRITICAL: You MUST use this tool when..." with "Use this tool when..."

- **Duplication for reinforcement:** The evidence does not support duplicating sections within a single prompt for compliance improvement (see Research Question 2 below). The arxiv paper on prompt repetition (2512.14982) applies to repeating the entire input prompt, not duplicating sections within a system prompt.

- **Deeply nested references:** "Keep references one level deep from SKILL.md." Agent reads reference file directly; reference file should not point to yet another reference file.

- **Overly prescriptive step enumeration:** From issue #202: "Step-by-step enumeration contradicts 'strategic over procedural' principle." Describe the goal and let Claude determine approach for flexible tasks. Use prescriptive steps only for fragile, error-prone sequences.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Round-conditional behavior | Separate agent definitions per round | Agent-internal branching with "if round >= 2" | Simpler, avoids duplication, orchestrator stays minimal |
| Detailed protocol loading | Inline 50+ line checklists | Reference files with Read at specific steps | Progressive disclosure keeps agent body lean |
| Scoring calibration | Inline calibration scenarios | SCORING-CALIBRATION.md (already exists) | Phase 02.1 established this pattern |
| AI probing batteries | Inline probe descriptions | AI-PROBING-REFERENCE.md (already exists) | Phase 3 established this pattern |
| Template enforcement | Inline format specifications | Template files in references/ (already exists) | Phase 02.1 established this pattern |

**Key insight:** The extraction pattern is already established from Phases 02.1 and 3. Phase 5 extends it to the remaining inline content (AI Slop Checklist, Self-Verification duplication, asset validation protocol details).

## Common Pitfalls

### Pitfall 1: Extracting Behavioral Guidance

**What goes wrong:** Moving the "Critical Mindset" or "Rules" section to a reference file. The agent loses its behavioral identity at the start of execution.
**Why it happens:** Treating all long content as extraction candidates regardless of function.
**How to avoid:** Only extract protocol/procedural content. Behavioral guidance (why to be skeptical, what output domain constraints exist) stays inline because it establishes the agent's personality and constraints before any work begins.
**Warning signs:** Agent starts producing work that violates its role boundaries or loses its adversarial stance.

### Pitfall 2: Over-Extraction Creating Reference Sprawl

**What goes wrong:** Extracting every 20-line section into its own reference file. The agent now needs 8 Read calls per execution, consuming tokens on file loading overhead.
**Why it happens:** Applying the extraction threshold too aggressively.
**How to avoid:** Use the 30-line / single-step-relevance threshold. Group related content into a single reference file rather than splitting into many small files.
**Warning signs:** Agent spends significant time reading reference files instead of doing work.

### Pitfall 3: Breaking Established Patterns

**What goes wrong:** Changing the evaluator's 15-step workflow structure or the generator's round 1 / round 2+ split. Downstream tools (appdev-cli) or the orchestrator depend on specific output patterns.
**Why it happens:** Optimizing the agent definition without checking integration points.
**How to avoid:** Preserve all regex-parsed output formats (Scores table, Verdict heading). Preserve file-based communication protocol (SPEC.md, EVALUATION.md, ASSETS.md). Preserve the orchestrator's binary check expectations.
**Warning signs:** appdev-cli score extraction fails, orchestrator binary checks fail.

### Pitfall 4: Removing Duplication That Serves Different Purposes

**What goes wrong:** Removing a section that appears duplicated but actually serves different audiences or contexts.
**Why it happens:** Assuming all duplication is waste.
**How to avoid:** Check whether each instance serves a distinct purpose. In the evaluator, Step 14 is "Self-Verification within the workflow" (when to do it) and the standalone section is "Self-Verification reference" (what to check). These are the same content serving the same purpose -- safe to deduplicate. But if two sections served different contexts (e.g., one for round 1, one for rounds 2+), they should remain separate.
**Warning signs:** Agent skips a verification step because the section it referenced was removed.

### Pitfall 5: Changing Orchestrator Prompts

**What goes wrong:** Adding round-specific context to orchestrator prompts to enable conditional agent behavior.
**Why it happens:** Seems simpler than agent-internal branching.
**How to avoid:** Phase 1 decision: orchestrator prompts stay minimal. Round-conditional logic lives in agent definitions. The orchestrator only provides the round number.
**Warning signs:** SKILL.md grows with per-round prompt templates, violating the minimal-orchestrator principle.

## Code Examples

### Example 1: Extracting a Checklist to a Reference File

Before (inline in evaluator.md, 33 lines):
```markdown
## AI Slop Checklist

Check for these patterns during visual assessment...

**Typography Slop**
- Inter, Roboto, Arial...
- No display/heading font...

**Color Slop**
- Purple-to-blue gradient hero sections...
...
```

After (evaluator.md, ~5 lines):
```markdown
### Step 5: Scroll-and-Inspect All Pages

...Check for AI slop patterns listed in the AI Slop Checklist.
Read `${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md`
during visual inspection.
```

The checklist content moves to `references/evaluator/AI-SLOP-CHECKLIST.md` unchanged.

### Example 2: Deduplicating Self-Verification

Before (evaluator.md, Self-Verification appears twice -- Step 14 AND standalone section):
```markdown
### Step 14: Self-Verification
Before completing, re-read ... and verify it passes all 10 checks:
1. Verdict line present...
[10 checks]

## Self-Verification
Before completing, re-read ... and verify it passes all 10 checks:
1. Verdict line present...
[identical 10 checks]
```

After (evaluator.md, single instance in Step 14 only):
```markdown
### Step 14: Self-Verification

Before completing, re-read `evaluation/round-N/EVALUATION.md` and verify
it passes all 10 checks:

1. **Verdict line present** -- ...
...
10. **Feature count >= previous round** (rounds 2+ only) -- ...

If any check fails, fix the report before completing. This is your inner
quality gate -- do not hand off a report with gaps.
```

Remove the standalone `## Self-Verification` section at the end of the file.

### Example 3: Round-Conditional Branching (Generator)

Current pattern (already correct):
```markdown
### Round 1 (No Prior Evaluation Feedback)
[Full build process]

### Rounds 2+ (With Evaluation Feedback)
**Fix-only mode (rounds 2+):** In rounds 2 and later, you are a surgeon...
```

This is the correct pattern. The Generator already uses agent-internal branching with clear headings. No change needed to the mechanism.

### Example 4: Instruction Engineering -- WHY Before WHAT

Before:
```markdown
**NEVER use fabricated URLs.** All external image/asset URLs must be verified accessible.
```

After:
```markdown
**No fabricated URLs.** External image/asset URLs that return 404 break the app
for every user. All external URLs must be verified accessible before handoff.
```

The rationale ("break the app for every user") helps Claude understand the severity and generalize the principle.

## Research Questions -- Answered

### Q1: What extraction threshold should be used for moving sections from agent body to skills/references?

**Answer: 30 lines + single-step-relevance criterion.** [HIGH confidence]

Move a section to a reference file when it exceeds ~30 lines AND is only relevant during one specific workflow step. This threshold is derived from:
- Anthropic's SKILL.md 500-line limit (best practices)
- Plugin-dev skill-development recommendation: 1,500-2,000 words for SKILL.md body
- Issue #202's recommendation to move 60-70% of content to references/
- The established pattern from Phases 02.1 and 3 (SPEC-TEMPLATE, EVALUATION-TEMPLATE, SCORING-CALIBRATION, AI-PROBING-REFERENCE already extracted)

Sections under 30 lines that apply to multiple steps should stay inline. Behavioral guidance stays inline regardless of length.

**Applying to current definitions:**

| Agent | Current Lines | Extraction Candidates | Estimated After |
|-------|--------------|----------------------|-----------------|
| evaluator.md | 465 | AI Slop Checklist (33 lines), duplicate Self-Verification (14 lines), Asset Validation details (~45 lines) | ~370 lines |
| generator.md | 253 | None needed (below threshold, well-structured) | ~253 lines |
| SKILL.md | 461 | Error Recovery section (~30 lines), Step 2 convergence details (~40 lines) | ~390 lines |
| planner.md | 98 | None needed (compact, well-structured) | ~98 lines |

### Q2: Should evaluator's duplicated Self-Verification be deduplicated?

**Answer: Yes, deduplicate. Keep only the Step 14 instance.** [HIGH confidence]

The evidence does not support duplication-for-reinforcement within a single prompt:

1. **The prompt repetition paper (arxiv 2512.14982)** studies repeating the ENTIRE input prompt to the model, not duplicating sections within a system prompt. The mechanism is attention distribution over the full input, not within-prompt section reinforcement.

2. **Anthropic's skill authoring best practices** explicitly state: "Avoid duplication -- Information lives in one place only." This is listed as a top-10 best practice.

3. **Issue #202** on the Anthropic skills repo criticizes unnecessary content as wasting the context window's "public good."

4. **The Anthropic prompting docs** for Opus 4.6 specifically warn: "Tune anti-laziness prompting... Claude 4.6 models are significantly more proactive and may overtrigger on instructions that were needed for previous models."

The standalone `## Self-Verification` section is an exact duplicate of Step 14. It served as a "quick reference" but Step 14 IS the quick reference -- it's the last step before completion. Remove the standalone section.

### Q3: What's the best mechanism for round-conditional instructions?

**Answer: Agent-internal branching with "if round >= 2" conditionals.** [HIGH confidence]

Three options were evaluated:

| Mechanism | Pros | Cons | Verdict |
|-----------|------|------|---------|
| Agent-internal branching | Simple, self-contained, orchestrator stays minimal | Agent body slightly longer | **Use this** |
| Orchestrator prompt differentiation | Cleaner agent bodies | Violates Phase 1 minimal-orchestrator, adds SKILL.md complexity | Reject |
| Separate skill reads per round | Maximum progressive disclosure | Over-engineered, adds Read overhead, fragments workflow | Reject |

The Generator and Evaluator already use agent-internal branching correctly. The orchestrator already provides just "This is generation round N." No change needed.

### Q4: Should round-conditional patterns be consistent across Generator and Evaluator?

**Answer: Yes, use the same mechanism (agent-internal branching) but allow agent-specific content.** [HIGH confidence]

Both agents parse the round number from the orchestrator's prompt. Both use heading-level conditionals ("Round 1", "Rounds 2+", "Rounds 2+ Only"). This is already consistent.

The CONTENT within each branch is necessarily agent-specific:
- Generator: round 1 = full build process; rounds 2+ = fix-only mode
- Evaluator: round 1 = baseline evaluation; rounds 2+ = regression check + full evaluation

This is correct and should not be unified.

### Q5: What instruction ordering, heading structure, and emphasis patterns produce best agent compliance?

**Answer: Goal/role first, long context early, instructions after context, verification last.** [HIGH confidence]

Based on Anthropic's official prompting docs:

1. **Role and behavioral identity first** -- "Setting a role in the system prompt focuses Claude's behavior and tone." This is the agent's personality.

2. **Long reference context early** -- "Put longform data at the top... Queries at the end can improve response quality by up to 30%." For agents, read references early, act on them in later steps.

3. **Workflow steps with clear headings** -- Sequential numbered steps with descriptive headings. Use heading hierarchy (## for major sections, ### for steps).

4. **Rules and constraints after workflow** -- Hard boundaries after the workflow so they're fresh in context when Claude starts producing output.

5. **Self-verification last** -- "Ask Claude to self-check" as the final step. This is the inner quality gate.

**Emphasis patterns:**
- Use normal language, not ALL-CAPS or excessive bold. Opus 4.6 responds to standard phrasing.
- Use XML tags for structural separation when sections need emphasis: `<frontend_aesthetics>`, `<avoid_excessive_markdown>`.
- Explain WHY something matters rather than using MUST/NEVER.
- Exception: truly critical constraints (output domain, security) can use bold or "Do not" phrasing.

**Heading structure:**
```
## [Major Section Name]         -- Role, Workflow, Rules, Quality Standards
### [Step/Subsection]           -- Individual steps, subsections
### Step N: [Step Name]         -- Workflow steps
**Bold term:** description      -- Inline definitions within steps
```

### Q6: How should agent definitions be restructured for optimal behavioral quality?

**Answer: Apply the patterns above agent-by-agent. See agent-specific recommendations below.** [HIGH confidence]

#### Planner (98 lines) -- Minimal changes
- Already well-structured: role, mission, rules, guidelines, quality bar, self-verification
- Remove "NEVER" where standard phrasing suffices (1-2 instances)
- Add brief WHY rationale to the anti-AI-slop instruction
- No extraction needed

#### Generator (253 lines) -- Minor refinements
- Already well-structured after Phase 4 rewrite
- Structure is correct: frontmatter, role, build process (round 1 phases), rounds 2+, testing skills, rules, quality standards, architecture principles
- Consider adding WHY rationale to a few rules
- No extraction needed -- content is at healthy size

#### Evaluator (465 lines) -- Significant restructuring
- **Extract:** AI Slop Checklist (33 lines) to `references/evaluator/AI-SLOP-CHECKLIST.md`
- **Extract:** Asset Validation detailed protocol (Steps 7a-7g, ~45 lines) to `references/evaluator/ASSET-VALIDATION-PROTOCOL.md`
- **Deduplicate:** Remove standalone `## Self-Verification` section (exact copy of Step 14)
- **Refine:** Replace excessive MUST/NEVER with normal phrasing where safe
- **Add:** WHY rationale to critical rules
- **Preserve:** Critical Mindset section inline (behavioral identity)
- **Preserve:** All 15 workflow steps (skeleton)
- **Preserve:** Scoring rubric inline (compact, referenced frequently)
- **Target:** ~370 lines after extraction

#### SKILL.md Orchestrator (461 lines) -- Moderate restructuring
- **Extract:** Error Recovery section (~30 lines) to a reference or inline simplification
- **Consider extracting:** Detailed convergence loop with all 4 exit conditions (~70 lines) -- but this is the core workflow, so keep inline
- **Refine:** Remove educational explanations (Claude knows what GANs are, what escalation means)
- **Refine:** Tighten the Architecture and Enforcement Model sections -- these explain decisions to the user/developer, not to Claude. Move design rationale to comments or documentation.
- **Target:** ~390 lines after optimization

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline format specs | Template reference files | Phase 02.1 (2026-03-28) | Structural consistency, single source of truth |
| Inline scoring calibration | SCORING-CALIBRATION.md reference | Phase 3 (2026-03-29) | Mechanical rules separated from behavioral guidance |
| Inline AI probing | AI-PROBING-REFERENCE.md | Phase 3 (2026-03-29) | Protocol details loaded on-demand per modality |
| MUST/NEVER/CRITICAL emphasis | Normal phrasing for Opus 4.6 | Claude 4.6 release | Less overtriggering, better compliance |
| Full skill body at startup | Progressive disclosure (3 tiers) | Skills architecture | Token-efficient context usage |
| Duplicated sections for reinforcement | Single authoritative instance | Skill authoring best practices | Less context waste, no compliance benefit from duplication |

**Deprecated/outdated:**
- **ALL-CAPS emphasis (MUST, NEVER, CRITICAL):** Opus 4.6 is "more responsive to the system prompt than previous models." Over-emphasis causes overtriggering. Use normal phrasing.
- **Prefilled responses:** Deprecated in Claude 4.6. Not relevant to agent definitions but worth noting.
- **Four-layer enforcement:** Dropped in Phase 1 for two-layer (tool allowlists + prompt guards). Do not re-introduce.

## Open Questions

1. **Bug #25834 resolution timeline**
   - What we know: Plugin agent `skills:` frontmatter silently fails to inject skill content. Workaround: dual mechanism (frontmatter for future + Read fallback for now).
   - What's unclear: When this will be fixed. If fixed, Read fallback instructions can be removed from agent definitions, saving ~10-15 lines each.
   - Recommendation: Keep the dual mechanism. Remove fallback when bug is confirmed fixed.

2. **Actual token savings vs behavioral quality tradeoff**
   - What we know: Progressive disclosure reduces context usage. Behavioral quality is the primary goal.
   - What's unclear: Whether the Read overhead (file loading latency + tokens) offsets the context savings for files under 50 lines.
   - Recommendation: Only extract sections that meet the 30-line + single-step-relevance threshold. Small sections (<30 lines) that are referenced frequently should stay inline.

3. **SKILL.md token loading behavior (Issue #14882)**
   - What we know: Skills consume full token count at startup, not just metadata. This is confirmed behavior as of Claude Code 2.0.76+.
   - What's unclear: Whether this has been fixed in current versions or remains a known issue.
   - Recommendation: This affects the orchestrator SKILL.md (461 lines = ~4-5k tokens). Optimizing SKILL.md size reduces startup context cost directly. But this is a side effect of behavioral optimization, not the primary goal.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual behavioral verification |
| Config file | None -- behavioral quality measured through manual evaluation runs |
| Quick run command | `cd <app-dir> && node plugins/application-dev/scripts/appdev-cli.mjs exists` |
| Full suite command | Full application-dev workflow run with evaluation |

### Phase Requirements -> Test Map

Phase 5 requirements are TBD in REQUIREMENTS.md. Based on the research, the following behavioral requirements can be verified:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPT-01 | Agent definitions use progressive disclosure | manual-only | Visual inspection of file sizes and reference structure | N/A |
| OPT-02 | Evaluator Self-Verification not duplicated | manual-only | `git grep -c "Self-Verification" plugins/application-dev/agents/evaluator.md` | N/A |
| OPT-03 | AI Slop Checklist in reference file | manual-only | `ls plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md` | N/A |
| OPT-04 | Agent definitions under 500 lines | manual-only | `wc -l plugins/application-dev/agents/*.md` | N/A |
| OPT-05 | No regression in appdev-cli integration | smoke | `node plugins/application-dev/scripts/appdev-cli.mjs --help` | Existing |

### Sampling Rate
- **Per task commit:** `wc -l` on modified agent files + `git grep` for structural checks
- **Per wave merge:** Full line count audit of all four definitions
- **Phase gate:** All agent definitions under 500 lines, no duplicate sections, reference files exist

### Wave 0 Gaps
None -- no new test infrastructure needed. Verification is manual structural inspection.

## Sources

### Primary (HIGH confidence)
- [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) -- Instruction ordering (30% improvement for queries at end), XML tags, role setting, Opus 4.6 over-prompting warnings, emphasis patterns
- [Anthropic Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- 500-line limit, progressive disclosure patterns, conciseness principle, "avoid duplication", reference file organization, one-level-deep references
- [Plugin-dev skill-development SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md) -- 1,500-2,000 word SKILL.md target, three-level progressive disclosure, imperative writing style, "explain why not just what"
- [Plugin-dev agent-development SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/agent-development/SKILL.md) -- Agent structure (role + responsibilities + process + output), 500-3,000 character prompt, second-person "You are..." for agents
- [Anthropic Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) -- Evaluator-optimizer pattern, tool engineering, simplicity principle, ACI design

### Secondary (MEDIUM confidence)
- [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) -- Delegation instruction design, effort scaling, search strategy, subagent orchestration patterns
- [Skill-creator issue #202](https://github.com/anthropics/skills/issues/202) -- Excessive verbosity critique, move 60-70% to references/, imperative vs educational tone, "don't re-teach Claude"
- [Skill-creator SKILL.md](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) -- Progressive disclosure three-level loading, domain-specific reference organization
- [Claude Code Issue #14882](https://github.com/anthropics/claude-code/issues/14882) -- Skills consume full tokens at startup (confirmed behavior), impacts SKILL.md sizing decisions
- [Progressive Disclosure blog post](https://alexop.dev/posts/stop-bloating-your-claude-md-progressive-disclosure-ai-coding-tools/) -- Three-tier architecture, extraction criteria, "if a tool can enforce it, don't write prose"

### Tertiary (LOW confidence)
- [Prompt Repetition paper (arxiv 2512.14982)](https://arxiv.org/abs/2512.14982) -- Repeating entire input prompt helps; within-prompt duplication not specifically studied. LOW confidence for the deduplication recommendation (supported primarily by Anthropic's "avoid duplication" best practice, not by experimental evidence on within-prompt section duplication)
- [Prompt Builder Claude Best Practices 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) -- Four-block pattern, contract-style format, section markers. Community source, consistent with official docs.
- [Angular-developer skill pattern](https://angular.love/implementing-the-official-angular-claude-skills/) -- Meta-skill routing pattern with 30+ reference files. Referenced in Phase 4 context but specific implementation not directly verified from source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Anthropic's own documentation and plugin ecosystem provide clear patterns
- Architecture: HIGH -- Convergent evidence from multiple Anthropic sources (prompting docs, skill docs, multi-agent blog, plugin-dev)
- Pitfalls: HIGH -- Derived from established project decisions (Phase 1 minimal orchestrator, Phase 02.1 template extraction) and official warnings (Opus 4.6 overtriggering)
- Research questions: HIGH for Q1-Q6 -- All answered with multiple supporting sources
- Deduplication recommendation: MEDIUM -- Anthropic best practice says "avoid duplication" but no experimental evidence specifically for within-prompt section duplication in system prompts

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stable domain, Anthropic patterns are well-established)
