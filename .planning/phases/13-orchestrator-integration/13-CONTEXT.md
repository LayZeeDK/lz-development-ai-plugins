# Phase 13: Orchestrator Integration - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The orchestrator spawns, checks, retries, and resumes all three critics (perceptual, projection, perturbation) as a unified evaluation ensemble. This covers: 3-critic parallel spawn (ORCH-01), resume-check generalization from spawn-both-critics to spawn-all-critics (ORCH-02), N-critic retry logic (ORCH-03), SAFETY_CAP wrap-up round with all 3 critics (ORCH-04), and architecture section update from 4 to 5 agents (ORCH-05).

</domain>

<decisions>
## Implementation Decisions

### Concurrency strategy
- Spawn all 3 critics in parallel every evaluation round (perceptual + projection + perturbation simultaneously)
- SAFETY_CAP wrap-up round uses the same 3-critic parallel pattern -- no special handling
- CLI default critics list changes from ["perceptual", "projection"] to ["perceptual", "projection", "perturbation"]
- SKILL.md update command changes from --critics perceptual,projection to --critics perceptual,projection,perturbation
- All 3 critics share the same static-serve instance (idempotent, port 4173) -- no separate port for perturbation

### Resume-check action naming
- "spawn-both-critics" renamed to "spawn-all-critics" in CLI output when all critics are missing
- "spawn-perturbation-critic" added to SKILL.md dispatch table alongside existing spawn-perceptual-critic and spawn-projection-critic
- When 2 or more critics fail: output spawn-all-critics with valid critics in the skip array (not individual per-critic actions)
- When exactly 1 critic fails: output spawn-{name}-critic for that specific critic (existing pattern)
- Perturbation-critic prompt follows the same pattern as other critics: "This is evaluation round N." -- no adversarial hint, no orchestrator additions

### Architecture section structure
- Restructure into Planning/Generation + Critic Ensemble subsections (not just add a bullet point)
- Each critic bullet includes its scoring dimension in parentheses (matches WGAN Critic Roadmap)
- Preserve existing prose about adversarial separation, information barrier, and non-overlapping dimensions -- update counts from "two critics" to "three critics"
- Convergence detection paragraph unchanged (already refers to escalation levels generically)

### Retry budget
- Keep 2 retries per critic (unchanged) -- worst case 6 retries total is bounded and rare
- AskUserQuestion options remain the same per critic: retry now, resume later, abort -- no new "skip" option
- Binary checks list all 3 summary.json paths explicitly (3 separate ls commands, not a glob)

### Claude's Discretion
- Exact wording of the restructured architecture section (within the agreed structure)
- Order of changes across files (CLI first vs SKILL.md first) as long as the atomic update requirement is met
- Whether to add a comment in the CLI code explaining the spawn-all-critics vs spawn-{name}-critic logic
- Test coverage for the new 3-critic resume-check scenarios

</decisions>

<specifics>
## Specific Ideas

- The dispatch table should have 5 critic-related entries: spawn-all-critics, spawn-perceptual-critic, spawn-projection-critic, spawn-perturbation-critic, plus compile-evaluation (existing)
- The architecture section should visually group agents into two conceptual tiers: Planning/Generation and Critic Ensemble -- this reflects the MCL-GAN architecture where multiple discriminators form a coordinated ensemble
- The skip array in spawn-all-critics output reuses the existing pattern from resume-check (line 858-859) but generalizes it for N-1 valid critics

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expectedCritics` array (appdev-cli.mjs:807): Already reads from state.critics with a default fallback. Changing the default is a one-line edit.
- `compile-evaluation` auto-discovery (appdev-cli.mjs:1310): Already discovers */summary.json directories. Adding perturbation/ requires no changes to discovery logic.
- `resume-check` critic iteration loop (appdev-cli.mjs:840-862): Already iterates expectedCritics and builds valid/invalid arrays. The logic generalizes to N critics with minimal changes.
- Static-serve command: Idempotent, already used by both existing critics. Perturbation-critic reuses the same pattern.
- Agent prompt protocol section (SKILL.md:489-504): Pattern established -- add one line for perturbation-critic.

### Established Patterns
- SKILL.md dispatch table (SKILL.md:93-101): Maps CLI next_action strings to orchestrator steps. Extend with 2 new entries.
- 2-critic parallel spawn (SKILL.md:268-269): Two Agent() calls side by side. Extend to 3.
- Binary check per critic (SKILL.md:277-279): ls commands per summary.json path. Extend to 3.
- SAFETY_CAP wrap-up critic spawn (SKILL.md:384-385): Same parallel pattern. Extend to 3.
- Per-critic retry with 2-retry limit and AskUserQuestion escalation (SKILL.md:470-477).

### Integration Points
- appdev-cli.mjs line 807: Change default from ["perceptual", "projection"] to ["perceptual", "projection", "perturbation"]
- appdev-cli.mjs line 853: Change "spawn-both-critics" to "spawn-all-critics"
- appdev-cli.mjs line 852-856: Update logic -- when invalid.length >= 2, output spawn-all-critics with valid in skip array
- SKILL.md line 93-97: Add spawn-all-critics and spawn-perturbation-critic to dispatch table
- SKILL.md line 262: Update --critics flag from perceptual,projection to perceptual,projection,perturbation
- SKILL.md lines 268-269: Add perturbation-critic Agent() call
- SKILL.md lines 277-279: Add perturbation/summary.json binary check
- SKILL.md lines 384-385: Add perturbation-critic to SAFETY_CAP wrap-up
- SKILL.md lines 500-504: Add perturbation-critic prompt protocol entry
- SKILL.md lines 532-555: Restructure architecture section
- Test file (test-appdev-cli.mjs): Tests for 3-critic resume-check scenarios (all missing, 1 missing, 2 missing)

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 13-orchestrator-integration*
*Context gathered: 2026-04-02*
