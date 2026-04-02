# Phase 13: Orchestrator Integration - Research

**Researched:** 2026-04-02
**Domain:** Claude Code plugin orchestration -- CLI resume-check generalization, SKILL.md dispatch, 3-critic parallel spawn
**Confidence:** HIGH

## Summary

Phase 13 integrates the perturbation-critic (built in Phase 11) into the orchestrator's spawn, check, retry, and resume flows. The perturbation-critic agent already exists (`agents/perturbation-critic.md`), the compile-evaluation auto-discovery already handles N critics (`*/summary.json` glob at appdev-cli.mjs:1310-1320), and the resume-check loop already iterates `state.critics` dynamically (appdev-cli.mjs:840-850). The changes are surgical: update defaults, rename one action string, generalize one conditional branch, and extend SKILL.md in six parallel locations that follow established patterns.

The primary risk is the "atomic update" requirement (ORCH-02): `spawn-both-critics` -> `spawn-all-critics` rename must land in both appdev-cli.mjs and SKILL.md in the same commit, because a mismatch breaks crash recovery. The secondary risk is the resume-check conditional logic change at line 852-858, where the existing "all invalid -> spawn-both" / "some invalid -> spawn-first-invalid" pattern must be refactored to "2+ invalid -> spawn-all-critics with skip" / "exactly 1 invalid -> spawn-<name>-critic".

**Primary recommendation:** Two plans -- Plan 01 covers the CLI changes + tests (atomic rename + default + conditional logic), Plan 02 covers the SKILL.md updates (dispatch table, evaluation phase, SAFETY_CAP, prompt protocol, file-based communication, architecture section). Both plans commit together or Plan 01 first with SKILL.md dispatch update included for atomicity.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Spawn all 3 critics in parallel every evaluation round (perceptual + projection + perturbation simultaneously)
- SAFETY_CAP wrap-up round uses the same 3-critic parallel pattern -- no special handling
- CLI default critics list changes from ["perceptual", "projection"] to ["perceptual", "projection", "perturbation"]
- SKILL.md update command changes from --critics perceptual,projection to --critics perceptual,projection,perturbation
- All 3 critics share the same static-serve instance (idempotent, port 4173) -- no separate port for perturbation
- "spawn-both-critics" renamed to "spawn-all-critics" in CLI output when all critics are missing
- "spawn-perturbation-critic" added to SKILL.md dispatch table alongside existing spawn-perceptual-critic and spawn-projection-critic
- When 2 or more critics fail: output spawn-all-critics with valid critics in the skip array (not individual per-critic actions)
- When exactly 1 critic fails: output spawn-{name}-critic for that specific critic (existing pattern)
- Perturbation-critic prompt follows the same pattern as other critics: "This is evaluation round N." -- no adversarial hint, no orchestrator additions
- Restructure into Planning/Generation + Critic Ensemble subsections (not just add a bullet point)
- Each critic bullet includes its scoring dimension in parentheses (matches WGAN Critic Roadmap)
- Preserve existing prose about adversarial separation, information barrier, and non-overlapping dimensions -- update counts from "two critics" to "three critics"
- Convergence detection paragraph unchanged (already refers to escalation levels generically)
- Keep 2 retries per critic (unchanged) -- worst case 6 retries total is bounded and rare
- AskUserQuestion options remain the same per critic: retry now, resume later, abort -- no new "skip" option
- Binary checks list all 3 summary.json paths explicitly (3 separate ls commands, not a glob)
- The dispatch table should have 5 critic-related entries: spawn-all-critics, spawn-perceptual-critic, spawn-projection-critic, spawn-perturbation-critic, plus compile-evaluation (existing)
- The architecture section should visually group agents into two conceptual tiers: Planning/Generation and Critic Ensemble
- The skip array in spawn-all-critics output reuses the existing pattern from resume-check (line 858-859) but generalizes it for N-1 valid critics

### Claude's Discretion
- Exact wording of the restructured architecture section (within the agreed structure)
- Order of changes across files (CLI first vs SKILL.md first) as long as the atomic update requirement is met
- Whether to add a comment in the CLI code explaining the spawn-all-critics vs spawn-{name}-critic logic
- Test coverage for the new 3-critic resume-check scenarios

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORCH-01 | 3-critic parallel spawn in evaluation phase (perceptual + projection + perturbation) | SKILL.md lines 262-279 -- extend --critics flag, add Agent() call, add binary check. Pattern is established; extend from 2 to 3. |
| ORCH-02 | Resume-check generalized from spawn-both-critics to spawn-all-critics (CLI + SKILL.md atomic) | appdev-cli.mjs lines 852-862 -- rename action, change conditional logic. SKILL.md dispatch table lines 93-101 -- add 2 entries. Must be same commit. |
| ORCH-03 | Retry logic generalized for N critics (retry each failed critic individually) | Current per-critic retry pattern (SKILL.md:469-477) already works per-critic. The change is in resume-check threshold (2+ invalid -> spawn-all-critics). |
| ORCH-04 | SAFETY_CAP wrap-up round includes perturbation-critic spawn | SKILL.md lines 382-387 -- add third Agent() call + binary check. Same pattern as regular evaluation phase. |
| ORCH-05 | Architecture section updated from 4 to 5 agents with perturbation-critic | SKILL.md lines 532-555 -- restructure into Planning/Generation + Critic Ensemble tiers with dimension annotations. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | Node.js built-in | Test runner | Already used by test-appdev-cli.mjs, zero dependencies |
| node:assert/strict | Node.js built-in | Assertions | Already used, zero dependencies |
| node:fs | Node.js built-in | File system | Used by CLI for state management |
| node:path | Node.js built-in | Path handling | Used by CLI for cross-platform paths |

### Supporting
No additional libraries needed. The CLI has a zero npm-dependency constraint (v1.1 key decision).

### Alternatives Considered
None -- all changes are within existing files using existing patterns.

## Architecture Patterns

### Current resume-check Logic (appdev-cli.mjs:840-862)
```
evaluateStep:
  for each expectedCritic:
    validate summary.json -> valid[] or invalid[]
  
  if invalid.length === expectedCritics.length:
    -> spawn-both-critics (skip: [])
  
  if invalid.length > 0:
    -> spawn-{invalid[0]}-critic (skip: valid)
  
  // all valid -> check EVALUATION.md, git tag, etc.
```

### Target resume-check Logic
```
evaluateStep:
  for each expectedCritic:
    validate summary.json -> valid[] or invalid[]
  
  if invalid.length >= 2:
    -> spawn-all-critics (skip: valid)
  
  if invalid.length === 1:
    -> spawn-{invalid[0]}-critic (skip: valid)
  
  // all valid -> check EVALUATION.md, git tag, etc.
```

Key insight: The threshold changes from `=== expectedCritics.length` to `>= 2`. This means when 2 of 3 critics fail, the orchestrator re-spawns all critics (skipping the valid one via `skip` array) rather than only spawning one of the two failed critics. This is the correct behavior per CONTEXT.md.

### SKILL.md Dispatch Table Pattern
Current (lines 93-101):
```
- spawn-both-critics -> Step 2 Evaluation Phase (spawn both critics)
- spawn-perceptual-critic -> Step 2 Evaluation Phase (spawn only perceptual critic)
- spawn-projection-critic -> Step 2 Evaluation Phase (spawn only projection critic)
```

Target:
```
- spawn-all-critics -> Step 2 Evaluation Phase (spawn all critics)
- spawn-perceptual-critic -> Step 2 Evaluation Phase (spawn only perceptual critic)
- spawn-projection-critic -> Step 2 Evaluation Phase (spawn only projection critic)
- spawn-perturbation-critic -> Step 2 Evaluation Phase (spawn only perturbation critic)
```

### SKILL.md Evaluation Phase Pattern
Current pattern (2 critics):
```
Agent(subagent_type: "application-dev:perceptual-critic", prompt: "...")
Agent(subagent_type: "application-dev:projection-critic", prompt: "...")
```
```
Bash(ls evaluation/round-N/perceptual/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/projection/summary.json 2>/dev/null)
```

Target pattern (3 critics):
```
Agent(subagent_type: "application-dev:perceptual-critic", prompt: "...")
Agent(subagent_type: "application-dev:projection-critic", prompt: "...")
Agent(subagent_type: "application-dev:perturbation-critic", prompt: "...")
```
```
Bash(ls evaluation/round-N/perceptual/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/projection/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/perturbation/summary.json 2>/dev/null)
```

### Architecture Section Structure
Current: flat list of 4 agents.
Target: two-tier grouping:

```
Planning & Generation:
- Planner: Expands user prompt into product specification
- Generator: Builds the full application from the spec

Critic Ensemble:
- Perceptual Critic: (Visual Design)
- Projection Critic: (Functionality, Product Depth test data)
- Perturbation Critic: (Robustness)
```

### Anti-Patterns to Avoid
- **Glob-based binary checks:** Do NOT use `ls evaluation/round-N/*/summary.json` for binary checks. Use 3 explicit ls commands per the locked decision. Globs hide individual failures.
- **Conditional 3rd spawn:** Do NOT conditionally spawn the perturbation-critic only in certain rounds or only after a threshold. All 3 critics spawn in every evaluation round unconditionally.
- **Changing the compile-evaluation auto-discovery:** The `*/summary.json` auto-discovery (line 1310-1320) already handles N critics and needs NO changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| N-critic resume detection | Custom critic counting logic | The existing `expectedCritics` array iteration at line 840 | Already iterates dynamically, just change the threshold check |
| Summary auto-discovery | Hardcoded 3-critic list in compile-evaluation | Existing `readdirSync` + `*/summary.json` pattern at line 1310 | Already works for N critics; zero changes needed |
| Per-critic retry | New retry orchestration | Existing per-critic retry pattern in SKILL.md:469-477 | Pattern already handles individual critic failure; extends to 3 without changes |

**Key insight:** The compile-evaluation subcommand is already N-critic capable. The resume-check subcommand already iterates `state.critics` dynamically. The changes are minimal -- a default value, a conditional threshold, and an action string rename.

## Common Pitfalls

### Pitfall 1: Atomic CLI + SKILL.md Update (from Phase Description)
**What goes wrong:** If the CLI outputs `spawn-all-critics` but SKILL.md still expects `spawn-both-critics`, the orchestrator crashes on session resume because the dispatch table has no entry for the new action.
**Why it happens:** CLI and SKILL.md are separate files that can be committed independently.
**How to avoid:** Both changes must land in the same commit. The plan should specify that the CLI rename (line 853) and the SKILL.md dispatch table update (lines 93-97) are in the same plan, or at minimum the same commit.
**Warning signs:** Running a resume-check during testing and seeing "unknown action" in SKILL.md dispatch.

### Pitfall 2: 3-critic Parallel Concurrency (from Phase Description)
**What goes wrong:** Spawning 3 concurrent Agent() calls might exceed Claude Code's parallel agent limit, causing one to queue or fail.
**Why it happens:** Claude Code's Agent tool has undocumented concurrency limits.
**How to avoid:** The CONTEXT.md already decided to spawn all 3 in parallel. If empirical testing shows issues, the fallback is 2+1 (spawn perceptual+projection first, then perturbation). But implement the parallel version first.
**Warning signs:** Agent timeouts, "too many concurrent agents" errors.

### Pitfall 3: Off-by-One in invalid.length Check
**What goes wrong:** Changing `invalid.length === expectedCritics.length` to `invalid.length >= 2` changes behavior for 2-critic setups. When state.critics has only 2 entries and both fail, the old code outputs `spawn-both-critics` and the new code outputs `spawn-all-critics` -- which is correct because "both" is a subset of "all".
**Why it happens:** The name change from "both" to "all" is a semantic generalization, not a 2-vs-3 check.
**How to avoid:** The threshold `>= 2` is correct for both 2-critic and 3-critic configurations. The rename from "both" to "all" is intentional. Existing tests that check for `spawn-both-critics` must be updated to expect `spawn-all-critics`.
**Warning signs:** Existing resume-check tests failing after the rename.

### Pitfall 4: Updating resume-check test expectations
**What goes wrong:** The test at line 968 (`should return next_action=spawn-both-critics when step is evaluate and no valid summaries`) and line 1178 (`should default critics to [perceptual, projection] when state.critics is unset`) will fail after the rename.
**Why it happens:** These tests assert `spawn-both-critics` as the expected output.
**How to avoid:** Update both test assertions to expect `spawn-all-critics`. The default critics change (line 807: `["perceptual", "projection"]` -> `["perceptual", "projection", "perturbation"]`) also changes the test at line 1178 since the default now has 3 critics.
**Warning signs:** Test failures in the resume-check describe block.

### Pitfall 5: Missing SKILL.md Prose Updates
**What goes wrong:** Numeric references in SKILL.md prose still say "both critics" or "two critics" after the integration.
**Why it happens:** SKILL.md has scattered references to "both" and "two" that are easy to miss.
**How to avoid:** Search SKILL.md for "both critic", "two critic", "2 critic" and update all instances. Key locations: line 265 ("Spawn both critics"), line 274 ("Binary checks: Verify both critics"), line 284 ("After both summary.json"), line 387 ("Binary checks (both summary.json)"), line 544 ("The two critics run in parallel").
**Warning signs:** Post-implementation grep for "both critic" returning hits.

## Code Examples

Verified patterns from the actual codebase:

### CLI: Changed Default Critics (appdev-cli.mjs:807)
```javascript
// Before:
var expectedCritics = state.critics || ["perceptual", "projection"];

// After:
var expectedCritics = state.critics || ["perceptual", "projection", "perturbation"];
```

### CLI: Changed Resume-Check Conditional (appdev-cli.mjs:852-862)
```javascript
// Before:
if (invalid.length === expectedCritics.length) {
  output({ next_action: "spawn-both-critics", round: round, skip: [], details: "No valid summaries" });
  return;
}

if (invalid.length > 0) {
  output({ next_action: "spawn-" + invalid[0] + "-critic", round: round, skip: valid, details: invalid[0] + " summary missing/corrupt" });
  return;
}

// After:
if (invalid.length >= 2) {
  output({ next_action: "spawn-all-critics", round: round, skip: valid, details: "Multiple summaries missing/corrupt" });
  return;
}

if (invalid.length === 1) {
  output({ next_action: "spawn-" + invalid[0] + "-critic", round: round, skip: valid, details: invalid[0] + " summary missing/corrupt" });
  return;
}
```

Key behavior change: When `invalid.length >= 2`, the skip array now contains `valid` (not empty `[]`). This allows the orchestrator to skip re-spawning critics that already have valid summaries. This is the generalization from "all invalid" to "multiple invalid".

### CLI Comment (Claude's Discretion)
```javascript
// spawn-all-critics: When 2+ critics are missing, re-spawn all expected
// critics but skip those in the skip array (valid summaries preserved).
// spawn-{name}-critic: When exactly 1 critic is missing, spawn only that one.
```

### SKILL.md: 3-critic Agent Spawn
```markdown
Spawn all three critics in parallel:

` ` `
Agent(subagent_type: "application-dev:perceptual-critic", prompt: "This is evaluation round N.")
Agent(subagent_type: "application-dev:projection-critic", prompt: "This is evaluation round N.")
Agent(subagent_type: "application-dev:perturbation-critic", prompt: "This is evaluation round N.")
` ` `
```

### SKILL.md: 3-critic Binary Checks
```markdown
**Binary checks:** Verify all three critics produced their summary artifacts:

` ` `
Bash(ls evaluation/round-N/perceptual/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/projection/summary.json 2>/dev/null)
Bash(ls evaluation/round-N/perturbation/summary.json 2>/dev/null)
` ` `
```

### Test: 3-critic Resume-Check Scenarios
```javascript
it("should return spawn-all-critics when all 3 critics missing", function () {
  writeState({ ..., critics: ["perceptual", "projection", "perturbation"] });
  // No evaluation directory
  const result = runCLI("resume-check", { cwd: tmpDir });
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.next_action, "spawn-all-critics");
  assert.deepEqual(parsed.skip, []);
});

it("should return spawn-all-critics with skip when 2 of 3 critics missing", function () {
  writeState({ ..., critics: ["perceptual", "projection", "perturbation"] });
  // Only perceptual valid
  const roundDir = join(tmpDir, "evaluation", "round-1");
  mkdirSync(join(roundDir, "perceptual"), { recursive: true });
  writeFileSync(join(roundDir, "perceptual", "summary.json"),
    JSON.stringify({ critic: "perceptual", dimension: "Visual Design", score: 6 }));
  
  const result = runCLI("resume-check", { cwd: tmpDir });
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.next_action, "spawn-all-critics");
  assert.deepEqual(parsed.skip, ["perceptual"]);
});

it("should return spawn-perturbation-critic when only perturbation missing", function () {
  writeState({ ..., critics: ["perceptual", "projection", "perturbation"] });
  // perceptual and projection valid, perturbation missing
  // ...setup...
  const result = runCLI("resume-check", { cwd: tmpDir });
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.next_action, "spawn-perturbation-critic");
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded 2-critic list | Dynamic expectedCritics from state | v1.1 (Phase 8) | resume-check already iterates dynamically |
| Manual summary discovery | Auto-discovery via readdirSync | v1.1 (Phase 8) | compile-evaluation already handles N critics |
| "spawn-both-critics" action | "spawn-all-critics" action | This phase | SKILL.md dispatch table must match |

**Already generalized (no changes needed):**
- compile-evaluation auto-discovery (line 1310-1320): reads `*/summary.json` from round directory
- validateSummary function: validates any critic's summary.json structure
- cleanCriticDir function: cleans up any corrupt critic directory
- extractScores: reads from EVALUATION.md which is compiled from all available summaries
- computeVerdict: operates on dimension scores extracted from EVALUATION.md, not on critic count

## Open Questions

1. **3-agent parallel concurrency limit**
   - What we know: 2-agent parallel spawn works reliably (v1.0/v1.1 production use). Claude Code's Agent tool documentation does not specify a concurrency limit.
   - What's unclear: Whether 3 simultaneous Agent() calls will all execute in parallel or if one will queue.
   - Recommendation: Implement 3-way parallel as planned. If empirical testing reveals issues, the fallback is 2+1 sequential groups. The CONTEXT.md already identifies this as a known concern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (Node.js built-in, v22+) |
| Config file | none -- runs via `node --test <file>` |
| Quick run command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| Full suite command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORCH-01 | 3-critic parallel spawn instructions in SKILL.md | manual-only | N/A (SKILL.md prose review) | N/A |
| ORCH-02 | resume-check outputs spawn-all-critics when >=2 critics missing | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | Partial -- existing tests need update + new tests needed (Wave 0) |
| ORCH-03 | retry logic per-critic (not all critics) | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | Partial -- covered by spawn-{name}-critic test, new 2-of-3 scenario needed (Wave 0) |
| ORCH-04 | SAFETY_CAP includes perturbation-critic | manual-only | N/A (SKILL.md prose review) | N/A |
| ORCH-05 | Architecture section updated to 5 agents | manual-only | N/A (SKILL.md prose review) | N/A |

### Sampling Rate
- **Per task commit:** `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Per wave merge:** `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Update existing test at line 968: assert `spawn-all-critics` instead of `spawn-both-critics`
- [ ] Update existing test at line 1170-1179: update default critics expectation (3 critics, `spawn-all-critics`)
- [ ] New test: all 3 critics missing -> `spawn-all-critics` with empty skip
- [ ] New test: 2 of 3 critics missing -> `spawn-all-critics` with 1 valid in skip
- [ ] New test: only perturbation missing -> `spawn-perturbation-critic`
- [ ] New test: compile-evaluation when only perturbation summary missing (verifies existing per-critic retry pattern generalizes)

## File Change Map

### Files Modified

| File | Lines | Changes | Requirement |
|------|-------|---------|-------------|
| `plugins/application-dev/scripts/appdev-cli.mjs` | 1604 | 3 edits (~15 lines changed) | ORCH-02, ORCH-03 |
| `plugins/application-dev/skills/application-dev/SKILL.md` | 555 | 6 sections updated (~60 lines changed) | ORCH-01, ORCH-02, ORCH-04, ORCH-05 |
| `plugins/application-dev/scripts/test-appdev-cli.mjs` | 2019 | 2 existing tests updated + ~4 new tests (~80 lines added) | ORCH-02, ORCH-03 |

### Files NOT Modified (already generalized)
- `compile-evaluation` subcommand: auto-discovery works for N critics
- perturbation-critic agent definition: already exists
- DIMENSIONS constant: already includes Robustness
- SCORING-CALIBRATION.md: already includes Robustness calibration

## Sources

### Primary (HIGH confidence)
- appdev-cli.mjs source code (1604 lines) -- read in full for resume-check logic, compile-evaluation auto-discovery, validateSummary
- SKILL.md source code (555 lines) -- read in full for dispatch table, evaluation phase, SAFETY_CAP, architecture section
- test-appdev-cli.mjs source code (2019 lines, 85 tests) -- read in full, all tests verified passing
- CONTEXT.md (Phase 13) -- locked decisions and specific line numbers

### Secondary (MEDIUM confidence)
- STATE.md -- project decisions and history confirming patterns
- REQUIREMENTS.md -- ORCH-01 through ORCH-05 definitions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, zero-dependency constraint maintained
- Architecture: HIGH -- all patterns are extensions of existing code with exact line numbers verified
- Pitfalls: HIGH -- atomic update risk well-understood, test expectations mapped precisely
- Code examples: HIGH -- derived directly from reading the source files

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- no external dependencies, all changes internal)
