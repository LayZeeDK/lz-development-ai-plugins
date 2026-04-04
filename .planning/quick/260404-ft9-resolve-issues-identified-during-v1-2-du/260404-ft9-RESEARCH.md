# Quick Task 260404-ft9: Critic Failure Detection and Recovery - Research

**Researched:** 2026-04-04
**Domain:** Orchestrator-critic contract, static-serve concurrency, agent path construction
**Confidence:** HIGH

## Summary

The research investigated four areas: critic failure detection/recovery, server port reuse, critic output path bugs, and evaluation artifact commitment strategy. All four have clear root causes and actionable fixes.

The static-serve command has a confirmed TOCTOU race condition: the idempotent check reads state BEFORE acquiring the mutex, so concurrent critics all pass the check and spawn separate servers. The fix is to re-read state after acquiring the mutex. The path nesting bugs are agent-side instruction ambiguity issues -- critics see `evaluation/round-N/perturbation/` in their write restriction but must substitute the actual round number, leading to agents that prefix the already-correct cwd-relative path with another `evaluation/round-N/` prefix. The `--test-dir` flag is a hallucination -- Playwright Test has no such CLI flag.

**Primary recommendation:** Fix the static-serve TOCTOU race, add path construction guardrails in critic instructions, and commit evaluation artifacts once per round (after all critics finish, before compile-evaluation) to enable crash recovery without excessive git overhead.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Generator MUST download images during generation and commit them to public/
- External URLs for images are acceptable sources IF license-compliant
- For website prompts: zero-meta-framework dependency (static HTML/CSS/vanilla JS)
- For app prompts: SPA with Vite + vanilla JS or Vite + React is acceptable
- SPEC.md should classify project type (website vs. app)
- `spa` field in appdev-cli state should reflect actual project type

### Claude's Discretion
- Favicon: Generator should produce a project-appropriate favicon
- Issue #1 (output clearing): Platform issue, out of scope
- Specific fix approaches for critic path bugs (#6, #7)

### Deferred to Research (this document addresses these)
- Critic failure detection and recovery strategy

### Deferred Ideas (OUT OF SCOPE)
- None listed
</user_constraints>

## Finding 1: Static-Serve TOCTOU Race Condition

**Confidence:** HIGH (source code analysis, confirmed in appdev-cli.mjs lines 901-1042)

### Root Cause

The `cmdStaticServe` function has a Time-of-Check-Time-of-Use (TOCTOU) race:

1. **Line 928**: Reads state from `.appdev-state.json`
2. **Lines 935-949**: Idempotent check -- scans `state.servers[]` for an existing entry matching this `dir`
3. **Lines 959-985**: Acquires directory-based mutex (`.appdev-serve-lock`)
4. **Lines 994-1016**: Finds port, spawns server, records in state
5. **Line 1037**: Releases mutex

The idempotent check happens BEFORE the mutex. When 3 critics call `static-serve` concurrently:
- All 3 read state with `servers: []`
- All 3 pass the idempotent check (no matching entry)
- Critic A acquires mutex, spawns on port 5173, writes state, releases
- Critic B acquires mutex but does NOT re-read state -- it still has the old `state` variable with `servers: []`
- Critic B spawns on port 5174, appends to its stale copy, writes state (OVERWRITING Critic A's entry)
- Critic C does the same on port 5175

Result: state ends up with only 1 server entry (the last writer wins), but 3 `serve` processes are running on 3 different ports. When `--stop` is called, only 1 process gets killed -- the other 2 become orphans.

### Fix

Move the idempotent check INSIDE the mutex, or re-read state after acquiring the mutex:

```javascript
// After acquiring the mutex (line 985):
// Re-read state and re-check idempotent condition
state = readState();
if (!state.servers) {
  state.servers = [];
}

for (var i = 0; i < state.servers.length; i++) {
  var existing = state.servers[i];

  if (existing.dir === dir && isPidAlive(existing.pid)) {
    // Another critic already started this server while we waited for the lock
    try { rmdirSync(lockDir); } catch (e) {}
    output({ server: existing, reused: true });

    return;
  }

  if (existing.dir === dir) {
    state.servers.splice(i, 1);
    i--;
  }
}
```

### Impact

This fully explains the "two dev servers running on different ports" observation from the Dutch art museum test. The "Serving!" output the user saw could NOT have come from the `serve` process spawned by `static-serve` because `stdio: "ignore"` disconnects all stdio. It likely came from the Generator's dev server or from a separate `npx serve` invocation (possibly by a critic running `npx playwright test` with a webServer config).

### Test Coverage

The existing test `should return existing server entry without spawning a new process` (line 1505) tests the idempotent path but NOT the concurrent race. A new test should:
1. Write state with `servers: []`
2. Call `static-serve --dir dist` twice in rapid succession (simulating concurrent critics)
3. Verify state has exactly 1 server entry afterward

However, true concurrency testing with the directory-based mutex is unreliable in unit tests. The structural fix (re-read after lock) is the correct approach rather than relying on test coverage for the race.

## Finding 2: Critic Output Path Nesting Bug

**Confidence:** HIGH (source code analysis + reported symptoms)

### Root Cause

The perturbation critic wrote to `evaluation/round-1/perturbation/evaluation/round-1/perturbation/test-results.json` -- a doubled path. This happens when:

1. The critic's instructions say "Write to `evaluation/round-N/perturbation/`"
2. The critic is already operating with `evaluation/round-1/perturbation/` as its conceptual working context
3. The agent constructs the full path by PREPENDING `evaluation/round-1/perturbation/` to what it thinks is a relative filename, but the "filename" is actually the full path `evaluation/round-1/perturbation/test-results.json`

This is an agent behavior problem, not a CLI bug. The agents receive instructions with template paths like `evaluation/round-N/perturbation/` and must substitute the round number. When the agent internally tracks "my output directory is `evaluation/round-1/perturbation/`", it sometimes joins this base with a filename that already includes the full relative path.

### Fix Approaches

**Option A: Explicit absolute path instructions in critic agents** (recommended)

Add a concrete output path construction step at the top of each critic's methodology:

```markdown
## Step 0.5: Set Output Directory

Your output directory for this round is:
  evaluation/round-N/perturbation/

where N is the round number from the orchestrator's prompt. ALL files you write
MUST use this exact prefix. Before writing any file, verify the path does NOT
repeat `evaluation/round-` anywhere.

Bad:  evaluation/round-1/perturbation/evaluation/round-1/perturbation/file.json
Good: evaluation/round-1/perturbation/file.json
```

**Option B: CLI-side path validation** (defense in depth)

Add a `validate-path` subcommand or check in `compile-evaluation` that rejects paths containing doubled `evaluation/round-` segments. This catches the bug at compile time rather than silently producing a nested directory.

**Recommendation:** Both. Option A prevents the bug; Option B catches it if it recurs.

### Projection Critic --test-dir Bug

The projection critic passed `--test-dir=evaluation/round-1/projection` to Vitest. Vitest does NOT have a `--test-dir` CLI flag. The correct approach is either:

- Pass the test file path directly: `npx playwright test evaluation/round-1/projection/acceptance-tests.spec.ts`
- Or use Playwright's `testDir` config option in `playwright.config.ts`

The critic instructions (projection-critic.md line 70) already show the correct pattern:
```
Run: `npx playwright test evaluation/round-N/projection/acceptance-tests.spec.ts --reporter=json`
```

The agent hallucinated `--test-dir` instead of following its own instructions. The fix is to add a negative instruction:

```markdown
Do NOT pass `--test-dir` as a CLI flag -- this flag does not exist in Playwright
Test or Vitest. Pass the test file path as a positional argument instead.
```

## Finding 3: Critic Failure Detection -- Current State Analysis

**Confidence:** HIGH (source code analysis)

### Current Detection Mechanism

The orchestrator's critic failure detection is a 3-layer system:

1. **Agent tool return status** -- unreliable per SKILL.md (classifyHandoffIfNeeded bug)
2. **Binary file-exists check** -- `ls evaluation/round-N/{critic}/summary.json`
3. **resume-check validation** -- `validateSummary()` checks JSON parse + required fields

The binary check (layer 2) is the primary detection. If `summary.json` exists but is malformed, `compile-evaluation` will fail, and the `round-complete` error path retries the failing critic.

### Gaps in Current Detection

1. **No detection of partial output**: A critic that crashes mid-write may leave a truncated `summary.json` that passes the `ls` check but fails JSON parsing. The orchestrator would then call `compile-evaluation`, which would fail. This is caught, but wastefully -- it requires an extra CLI call to discover what resume-check could have caught.

2. **No detection of wrong-round output**: A confused critic could write `summary.json` to the wrong round directory. The binary check only looks in the expected round directory, so this is harmless -- the orchestrator would correctly detect the summary as missing and retry.

3. **No detection of path-nested output**: The perturbation critic's doubled path bug means `evaluation/round-1/perturbation/summary.json` does NOT exist (it exists at `evaluation/round-1/perturbation/evaluation/round-1/perturbation/summary.json`). The binary check correctly detects this as missing. The retry mechanism works.

### Assessment

The current binary check + retry is **sufficient for correctness** but has one inefficiency: it does not distinguish between "critic crashed with no output" and "critic produced output at wrong path" -- both trigger the same retry. This is acceptable because:
- The retry limit is 2, which handles transient failures
- The retry uses the exact same prompt (no corrective instructions), which is the right behavior
- Path bugs recur on retry, so they exhaust retries and escalate to the user -- which is correct

**No change needed to the detection mechanism itself.**

## Finding 4: Evaluation Artifact Commitment Strategy

**Confidence:** HIGH (architecture analysis)

### Current State

- Critics have NO git tools (their allowed-tools lists do not include `git *`)
- The orchestrator does NOT commit evaluation artifacts between critic completion and compile-evaluation
- Evaluation artifacts are committed only as part of the full round (if at all -- the orchestrator only explicitly commits SPEC.md)
- If the session dies during evaluation, ALL critic work for that round is lost
- On resume, `resume-check` detects missing summaries and re-spawns critics from scratch

### Options Analysis

| Option | Commits/round | Preserves partial state | Git overhead | Complexity |
|--------|---------------|------------------------|--------------|------------|
| A: After each critic | 3 | Yes (per critic) | High | Medium -- need to track which critics committed |
| B: After all critics, before compile | 1 | Yes (all 3 critics) | Low | Low -- single commit point |
| C: After compile-evaluation | 1 | No (compile output only) | Low | Low -- but partial critic state lost |
| D: Current (no commit) | 0 | No | None | None |

### Recommendation: Option B -- Single commit after all critics finish

**Rationale:**

1. **Matches the existing architecture**: The orchestrator already has a natural sync point between "all binary checks pass" and "call compile-evaluation". Adding a commit here requires exactly 2 tool calls (`git add evaluation/round-N/`, `git commit ...`) and zero architecture changes.

2. **Enables crash recovery**: If the session dies during `compile-evaluation` or afterward, `resume-check` can detect all three `summary.json` files exist and return `compile-evaluation` as the next action -- which is already implemented.

3. **No benefit to per-critic commits**: Options A's 3 commits per round add git overhead (each commit is ~2 tool calls) and complexity (tracking which critics committed). Since critics run in parallel, the orchestrator cannot commit between them anyway -- it only regains control after all 3 return.

4. **compile-evaluation is deterministic**: If all 3 summaries are committed, the CLI can regenerate EVALUATION.md at any time. There is no value in also committing the EVALUATION.md -- it can be recomputed.

### Implementation

In SKILL.md's Evaluation Phase, after the 3 binary checks pass and before calling `compile-evaluation`:

```
Bash(git add evaluation/round-N/)
Bash(git commit -m "eval(round-N): critic summaries")
```

The commit message should be minimal and use a consistent pattern so `resume-check` can identify evaluation state from git log if needed (though it currently uses filesystem checks only).

### Resume-Check Interaction

No changes needed to `resume-check`. It already:
- Validates `summary.json` files on disk (not in git)
- Returns `compile-evaluation` when all summaries are valid
- Returns critic-specific respawn when summaries are missing

The commit ensures summaries survive session death. On resume, they exist on disk (committed to git), and resume-check picks up where it left off.

## Architecture Patterns

### Critic Output Contract

Each critic MUST produce exactly one `summary.json` at `evaluation/round-N/{critic}/summary.json` with this minimal schema:

```json
{
  "critic": "<name>",
  "dimension": "<DIMENSIONS entry name>",
  "score": <1-10>
}
```

The `compile-evaluation` subcommand auto-discovers `*/summary.json` under the round directory. It does NOT check the `critics` array in state. This means:
- Adding a new critic requires NO CLI changes
- A critic writing to the wrong subdirectory name creates a new dimension entry
- A critic writing to a nested path is invisible to compile-evaluation

### Orchestrator-Critic Timing

```
Orchestrator                    Critics (parallel)
    |
    |-- update --step evaluate --critics ...
    |-- spawn perceptual ----->  [perceptual runs ~60K tokens]
    |-- spawn projection ----->  [projection runs ~60K tokens]
    |-- spawn perturbation ---> [perturbation runs ~60K tokens]
    |                                   |
    |<-- all 3 return (or crash) -------|
    |
    |-- ls summary.json (x3) -- binary check
    |-- [PROPOSED] git add + commit evaluation artifacts
    |-- compile-evaluation
    |-- round-complete
```

## Common Pitfalls

### Pitfall 1: TOCTOU in Mutex-Protected Operations
**What goes wrong:** State is read before acquiring the mutex, leading to stale reads after lock acquisition.
**Why it happens:** The natural code flow reads state first, then decides whether to acquire the lock.
**How to avoid:** Always re-read shared state after acquiring any mutex/lock. Apply double-checked locking pattern.
**Warning signs:** Multiple processes/agents producing duplicate resources (servers, files, ports).

### Pitfall 2: Agent Path Construction with Template Substitution
**What goes wrong:** Agents join a base directory with a filename that already contains the full relative path, producing doubled paths.
**Why it happens:** Instructions use template paths like `evaluation/round-N/perturbation/` which agents must substitute. When the agent stores the resolved path and later concatenates it with another resolved path, nesting occurs.
**How to avoid:** Give explicit negative examples in instructions. Add CLI-side validation that rejects paths with doubled segments.
**Warning signs:** Files appearing in deeply nested directories that mirror the expected structure.

### Pitfall 3: Hallucinated CLI Flags
**What goes wrong:** Agents invent CLI flags that do not exist (e.g., `--test-dir` for Playwright/Vitest).
**Why it happens:** Agents have training data from multiple testing frameworks and conflate their CLI APIs.
**How to avoid:** Add negative instructions for commonly hallucinated flags. Provide the exact command template with no room for improvisation.
**Warning signs:** Test execution failures with "unknown option" errors.

## Open Questions

1. **Generator dev server leaking "Serving!" output**
   - What we know: The `serve` package spawned by `static-serve` uses `stdio: "ignore"`, so it cannot produce visible output. The "Serving!" text must come from elsewhere.
   - What's unclear: Whether the Generator leaves a dev server running after its build, or whether a `playwright.config.ts` webServer config starts an additional server.
   - Recommendation: Check if the Generator's agent definition or the playwright skill includes a webServer config that starts `npx serve`. If so, critics might be double-serving.

## Sources

### Primary (HIGH confidence)
- `plugins/application-dev/scripts/appdev-cli.mjs` -- cmdStaticServe implementation (lines 901-1042), cmdResumeCheck (lines 803-899), validateSummary (lines 401-419)
- `plugins/application-dev/skills/application-dev/SKILL.md` -- Orchestrator workflow, error recovery, evaluation phase
- `plugins/application-dev/agents/perturbation-critic.md` -- Write restriction, output paths
- `plugins/application-dev/agents/projection-critic.md` -- Write restriction, test execution commands
- `plugins/application-dev/agents/perceptual-critic.md` -- Write restriction, output paths
- npm registry: `serve` v14.2.6 (current)

### Secondary (MEDIUM confidence)
- Playwright Test CLI documentation -- no `--test-dir` flag exists (verified against agent instruction examples which use positional file paths)

## Metadata

**Confidence breakdown:**
- Static-serve TOCTOU race: HIGH -- confirmed by source code tracing
- Path nesting bug: HIGH -- root cause matches reported symptoms
- Failure detection assessment: HIGH -- complete code walkthrough
- Commitment strategy: HIGH -- architectural analysis with clear tradeoffs

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable architecture, no external dependencies changing)
