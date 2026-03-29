# Phase 5: Optimize Agent Definitions - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Optimize Planner, Generator, and Evaluator agent definitions based on researched best practices -- progressive disclosure, round-conditional instructions, skill extraction for context-heavy guidance. The orchestrator SKILL.md is also in scope.

Requirements: TBD (define during planning based on research findings)

</domain>

<decisions>
## Implementation Decisions

### Research completed (two rounds)

**Round 1: General agent definition optimization** (05-RESEARCH.md)
- Sources: skill-creator plugin, angular-developer meta-skill, Anthropic docs/blog, plugin-dev plugin
- Key findings: 30-line extraction threshold, agent-internal round branching is correct, WHY-based rationale over MUST/NEVER emphasis, deduplicate evaluator Self-Verification

**Round 2: Marketplace distribution patterns** (research/marketplace-plugin-patterns.md)
- Sources: plugin-dev agent-development, skill-development, plugin-structure skills; skill-creator structure; Anthropic skill authoring best practices
- Key findings: Read fallback is superior by design (selective loading), no Anthropic marketplace plugin uses ALL-CAPS emphasis, SKILL.md should use imperative voice, token cost model favors progressive disclosure

### Optimization targets

- **Primary goal: behavioral quality** -- improve instruction-following through better structure, ordering, emphasis, and progressive disclosure
- **Secondary goal: token efficiency** -- a side effect of leaner definitions, not the driver
- **Scope: all four definitions** -- planner.md (98 lines), generator.md (253 lines), evaluator.md (465 lines), SKILL.md orchestrator (461 lines)
- **Model targeting: Opus 4.6 1M (primary, proven), Sonnet 4.6 200K/1M (experimental, unproven)** -- calibrate for Opus, verify with Sonnet. Well-structured instructions work for both at ~98% coding parity.

### Extraction criteria

- **Threshold: 30 lines + single-step-relevance.** Move a section to a reference file when it exceeds ~30 lines AND is only relevant during one specific workflow step.
- **Behavioral guidance always stays inline** regardless of length (role statement, critical mindset, rules, quality standards)
- **Protocol/procedural content is the extraction target** (checklists, detailed procedures, validation rules)
- **Per-invocation reference limit: under 5 Read calls** per agent spawn to avoid overhead outweighing progressive disclosure benefit
- **One level deep from SKILL.md** for references. Agent definitions reference files directly via `${CLAUDE_PLUGIN_ROOT}` paths.

**Extraction candidates identified by research:**

| Agent | Current | Extract | Target |
|-------|---------|---------|--------|
| evaluator.md | 465 lines | AI Slop Checklist (33 lines) to reference, duplicate Self-Verification (14 lines) removed, Asset Validation protocol (~45 lines) to reference | ~370 lines |
| SKILL.md | 461 lines | Trim educational explanations (Claude knows GANs, escalation), restructure Architecture/Enforcement | ~390 lines |
| generator.md | 253 lines | None needed -- healthy size, well-structured | ~253 lines |
| planner.md | 98 lines | None needed -- compact, well-structured | ~98 lines |

### Emphasis strategy

- **WHY-based rationale everywhere.** Replace MUST/NEVER/CRITICAL with explanations of why something matters. None of Anthropic's own marketplace plugins use ALL-CAPS emphasis. Skill-creator explicitly warns against "heavy-handed musty MUSTs."
- **"Do not" (not "NEVER") for output-domain safety constraints only** -- Generator must not write to evaluation/, Evaluator must not modify source code, orchestrator must not do agent work. These are safety-critical boundaries.
- **Preserve bold for terms being defined** -- "**Fix-only mode (rounds 2+):**"
- **Preserve XML tags for structural sections** -- `<example>` in descriptions
- **Remove educational content Claude already knows** -- what GANs are, how git works, what escalation means

### Instruction ordering

- **Role/behavioral identity first** -- establishes agent personality before any work begins
- **Workflow steps middle** -- the actionable instructions
- **Rules and constraints after workflow** -- fresh in context when Claude starts producing output
- **Self-verification last** -- inner quality gate as final step
- **SKILL.md restructure:** Move Architecture and Enforcement Model sections after Rules or trim them. Workflow section comes earlier.

### Voice and writing style

- **Agent definitions: second person** -- "You are a rigorous, skeptical product critic..." (correct per plugin-dev system-prompt-design.md)
- **SKILL.md: imperative/infinitive form** -- "Spawn the Generator", "Check for existing state" (fix current mixed voice to match official guidance)
- **Conciseness principle:** "Challenge each piece of information: 'Does Claude really need this explanation?'" Only add context Claude does not already have.

### Round-conditional instructions

- **Mechanism: agent-internal branching** -- no change needed. The Generator's "Round 1 / Rounds 2+" headings and the Evaluator's "Step 2: Rounds 2+ Only" are the correct pattern.
- **Improve labeling consistency** across Generator and Evaluator. Use the same heading convention for round-conditional sections.
- **Orchestrator prompts stay minimal** -- "This is generation round N." per Phase 1 decision.
- **Planner is single-round** -- no round-conditional optimization needed.

### Evaluator Self-Verification deduplication

- **Remove the standalone ## Self-Verification section** at the end of evaluator.md (14 lines, exact copy of Step 14)
- **Keep only the Step 14 instance** in the workflow. Step 14 is the canonical location -- last step before completion, right time for a quality gate.
- **Rationale:** Anthropic best practices say "avoid duplication -- information lives in one place only." The duplicate does not improve compliance.

### Agent-invoked skills (skills: frontmatter)

- **Reframe Read as primary mechanism (design choice, not bug workaround).** Selective loading (~2-3k tokens on demand) is superior to full injection (~15k tokens upfront).
- **Keep `skills:` frontmatter** on generator.md for documentation and future compatibility.
- **Keep all Read instructions** in the agent body as the primary mechanism.
- **Shorten the bug #25834 note** in generator.md to one line. The justification for Read is now selective loading efficiency, not a bug workaround.

### Scope constraints

- **No new frontmatter fields** -- effort, maxTurns, memory are interesting but out of Phase 5 scope (optimization, not new capabilities)
- **Preserve all regex-parsed output formats** -- Scores table, Verdict heading, evaluation file paths. appdev-cli integration must not break.
- **Preserve file-based communication protocol** -- SPEC.md, EVALUATION.md, ASSETS.md paths and formats unchanged.
- **Preserve orchestrator binary check expectations** -- file-exists checks for SPEC.md and EVALUATION.md.
- **Allow significant restructuring** of agent definitions if best practices support it. The constraint is behavioral equivalence (same outputs), not structural preservation.

### Claude's Discretion

- Exact wording of WHY-based rationale replacements for MUST/NEVER/CRITICAL
- Which specific sentences in SKILL.md Architecture/Enforcement sections to trim vs keep
- Exact heading labels for round-conditional sections (consistent convention)
- Whether to group extracted evaluator references in existing references/evaluator/ or create new files at references/ root
- How to restructure SKILL.md ordering while preserving all workflow steps
- Minor generator.md refinements (adding WHY rationale to rules)

</decisions>

<specifics>
## Specific Ideas

- Anthropic's emphasis hierarchy for marketplace plugins: safety-critical > behavioral identity > procedural > guidance > informational
- "Try to break it" (evaluator critical mindset) is a strong example of WHY-focused behavioral guidance -- preserve this pattern, extend it
- The Generator's "you are a surgeon, not an architect" for fix-only mode is effective framing -- keep it
- SKILL.md's "Generating" not "Building" terminology (GAN vocabulary) should stay
- Asset Validation protocol in evaluator Steps 7a-7g is a prime extraction candidate -- it's detailed procedure used only in one step
- AI Slop Checklist is referenced during Step 5 visual inspection only -- extract to reference, add Read instruction at Step 5
- Error Recovery in SKILL.md could be simplified: the retry pattern is simple enough to describe in 10 lines instead of 30

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- evaluator.md: 465-line agent definition, 15-step workflow, AI Slop Checklist, Self-Verification (duplicated), scoring rubric, asset validation protocol. Primary restructuring target.
- generator.md: 253-line agent definition, progressive CI phases, round 1/2+ split, skill routing with Read fallback. Well-structured, minor refinements only.
- planner.md: 98-line agent definition, compact and well-structured. Minimal changes.
- SKILL.md: 461-line orchestrator skill, Architecture/Enforcement/Rules/Workflow/Error Recovery sections. Restructure ordering, trim educational content, fix voice.
- references/evaluator/: existing subdirectory with EVALUATION-TEMPLATE.md, SCORING-CALIBRATION.md, AI-PROBING-REFERENCE.md. New extractions land here.

### Established Patterns
- Phase 02.1 pattern: structural guidance in reference files, behavioral guidance in agent definitions. Phase 5 extends this to remaining inline content.
- `${CLAUDE_PLUGIN_ROOT}` path convention for all Read instructions in agent bodies
- HTML comments mark regex-sensitive sections in EVALUATION-TEMPLATE.md
- Two-layer enforcement (tool allowlists + prompt guards) per agent -- no changes
- appdev-cli JSON output protocol -- no changes
- angular-developer meta-skill pattern: lean routing doc + references for progressive disclosure

### Integration Points
- evaluator.md: extract AI Slop Checklist to references/evaluator/AI-SLOP-CHECKLIST.md, extract Asset Validation protocol to references/evaluator/ASSET-VALIDATION-PROTOCOL.md, remove duplicate Self-Verification, add WHY rationale, improve round-conditional labeling
- generator.md: reframe skills note (design choice not bug workaround), add WHY rationale to rules, improve round-conditional labeling
- planner.md: minor -- remove any MUST/NEVER instances, add WHY rationale where beneficial
- SKILL.md: restructure section ordering (workflow earlier), fix voice to imperative, trim educational explanations, simplify Error Recovery
- New files: references/evaluator/AI-SLOP-CHECKLIST.md, references/evaluator/ASSET-VALIDATION-PROTOCOL.md
- appdev-cli.mjs: UNCHANGED -- no integration impact
- EVALUATION-TEMPLATE.md, SCORING-CALIBRATION.md, AI-PROBING-REFERENCE.md: UNCHANGED

</code_context>

<deferred>
## Deferred Ideas

### Future milestone
- **New frontmatter fields:** effort: max for evaluator (Opus-only), maxTurns for safety caps, memory for cross-project learning. Interesting but adds new capabilities beyond optimization scope.
- **Planner re-planning:** If Evaluator identifies fundamental spec issues, Planner could revise SPEC.md. Would introduce round-conditional behavior for Planner.
- **Bug #25834 cleanup:** When skills frontmatter injection is confirmed working, the Read fallback instructions can be shortened (but kept -- selective loading is still superior).
- **Eval/benchmark for agent quality:** skill-creator's Pass@k methodology could validate that optimized agents perform equivalently or better. Not in Phase 5 scope.
- **EVAL-06 (Evaluator cross-referencing ASSETS.md):** Deferred from Phase 4. Evaluator already validates assets comprehensively without the manifest.

</deferred>

---

*Phase: 05-optimize-agent-definitions*
*Context gathered: 2026-03-29*
