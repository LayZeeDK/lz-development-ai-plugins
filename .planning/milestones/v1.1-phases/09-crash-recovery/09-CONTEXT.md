# Phase 9: Crash Recovery - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

The orchestrator detects completed critic artifacts on resume (via appdev-cli
state JSON + filesystem) and recovers from any crash point with minimal rework.
Dev server lifecycle is replaced by a static production build served through
`appdev-cli static-serve`. Generator produces a production build before ending
each round.

**Requirements:** RECOVERY-01..04 (4 total, RECOVERY-04 already implemented)

</domain>

<decisions>
## Implementation Decisions

### Artifact detection: new `appdev-cli resume-check` subcommand

New CLI subcommand scans filesystem + state JSON, returns structured JSON with
the next action. Orchestrator acts on the JSON without filesystem logic.

**Response format:** Action names, not numeric states. Self-documenting:
- `spawn-both-critics` -- no valid summaries found
- `spawn-projection-critic` -- perceptual summary valid, projection missing/corrupt
- `spawn-perceptual-critic` -- projection summary valid, perceptual missing/corrupt
- `compile-evaluation` -- both summaries valid, EVALUATION.md missing/corrupt
- `round-complete` -- EVALUATION.md valid, git tag missing
- `generate` -- project files exist but no build output
- `plan` -- SPEC.md missing
- `evaluate` -- build output exists, proceed to evaluation
- `summary` -- all rounds complete, present results

**Scope:** Handles all workflow steps (plan, generate, evaluate, summary), not
just evaluation. For generation: verifies build output directory exists on disk
AND `build_dir` is set in state. For planning: checks SPEC.md + planning-complete
tag.

**Validation depth:** Existence + basic validity. For summary.json: file exists,
JSON.parse succeeds, required fields present (critic, dimension, score). For
EVALUATION.md: file exists and contains `## Scores`. For git tags: `git tag -l`
check. Cost: ~1ms per file, catches truncated writes from mid-crash.

**Full evaluation artifact chain:**
1. `evaluation/round-N/{critic}/summary.json` -- per critic, valid JSON with required fields
2. `evaluation/round-N/EVALUATION.md` -- exists with `## Scores`
3. `git tag appdev/round-N` -- exists

### Expected critics tracked in state

Orchestrator writes `--critics perceptual,projection` to state before spawning
critics. CLI reads the expected set to determine what's missing vs what's
complete. Extensible: v1.2 adds `perturbation` to the list. CLI never hardcodes
critic names.

### Static production build replaces dev server

Critics evaluate a static production build served through a static file server,
not a dev server. This strengthens the GAN information barrier: production
builds (minified, bundled) are opaque to critics even if tool allowlists or
prompt guards failed. Third enforcement layer: (1) tool allowlists, (2) prompt
guards, (3) artifact itself is opaque.

Also catches build-time failures (broken imports, missing assets in production
bundles) that dev servers mask with HMR fallbacks. Critics see exactly what a
user would see.

**Generator responsibility:** Generator produces a production build before
ending its round (tech stack-agnostic -- Generator knows how to build whatever
it chose). Updates state with `--build-dir <dir>` and `--spa true|false`. If
build fails, Generator fixes it before exiting. Build failure = Generator
failure = retry.

### `appdev-cli static-serve` subcommand

New CLI subcommand manages static file servers using `serve` (installed as
devDependency during Step 0.5 workspace setup).

**Idempotent startup:** First caller starts the server, subsequent callers
get the already-running response immediately (exit code 0). If a server is
in the process of starting (mutex held), second caller waits until startup
completes before returning. Same mutex pattern as `install-dep`.

**Critics call it themselves:** Each critic's first step calls
`appdev-cli static-serve`. No orchestrator involvement in starting. Fits GAN
principle: critics own their evaluation environment. Orchestrator only calls
`static-serve --stop` between rounds (Generator rebuilds in next round).

**Multi-app support:** Projects may have multiple apps (user-facing site +
backoffice). Each `static-serve --dir <dir>` call starts a separate server.
Tracked in `servers[]` array in `.appdev-state.json`:
```json
{"servers": [
  {"dir": "dist", "pid": 12345, "port": 5173, "spa": true},
  {"dir": "dist-admin", "pid": 12346, "port": 5174, "spa": false}
]}
```

**Port assignment:** Start at 5173 (Vite convention), increment for additional
servers. Check if port is in use before binding; skip to next if occupied.

**SPA mode:** Generator writes `--spa true` or `--spa false` to state. CLI
passes `--single` flag to `serve` for SPAs (client-side route fallback to
index.html). Static sites served as-is.

**Cleanup:** `appdev-cli delete` and `appdev-cli complete` auto-stop all
running servers before clearing/finalizing state. No orphan processes.

**Orchestrator stops between rounds:** After evaluation completes and
round-complete runs, orchestrator calls `static-serve --stop`. Each evaluation
phase gets a fresh server from the new build.

**Allowed-tools:** Add `Bash(node *appdev-cli* static-serve*)` to both critic
agent frontmatter.

### Partial artifact handling: explicit cleanup

resume-check detects invalid artifacts and deletes the corrupt critic's
directory before returning the re-spawn action. Only the corrupt critic's
directory is deleted -- valid artifacts from other critics are preserved.

**Flow:**
1. resume-check validates each expected critic's summary.json
2. Invalid (truncated JSON, missing fields) -> delete `evaluation/round-N/{critic}/`
3. Return `next_action: spawn-{critic}` with `skip` listing valid critics

Critics start with a clean directory. No risk of reading own partial output.
compile-evaluation cannot pick up garbage.

### Step 0 resume branching

Four branches based on prompt presence and state existence:

| Prompt provided? | State exists? | Action |
|---|---|---|
| No | Yes | **Auto-resume:** show context, continue immediately (no AskUserQuestion) |
| Yes | Yes | **Ask:** resume existing or start fresh with new prompt |
| Yes | No | **Start fresh:** normal first run |
| No | No | **Error:** nothing to resume, no prompt given |

**Auto-resume context display:** Show original prompt, current round, which
step was in progress, which artifacts survived. Then immediately continue --
application-dev is user interaction-free after the initial prompt.

**Auto-resume flow:**
1. `appdev-cli get` -- read step, round, prompt
2. `appdev-cli resume-check` -- determine exact recovery action
3. Output recovery context to user
4. Jump directly to the returned action

### RECOVERY-04: already implemented

Both `perceptual-critic.md:114` and `projection-critic.md:168` already
recommend `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`. No work needed.

### Claude's Discretion

- `resume-check` internal implementation details (file scanning order, error messages)
- `static-serve` process spawning and health check implementation
- Exact format of resume context output shown to user
- Whether `serve` is installed in Step 0.5 alongside `@playwright/cli` or lazily on first `static-serve` call
- Generator.md wording for production build requirement (tech stack-agnostic instruction)

</decisions>

<specifics>
## Specific Ideas

- Static production build as GAN barrier amplifier: three enforcement layers
  (tool allowlists, prompt guards, opaque artifact). This is a deliberate
  cybernetic variety reduction -- critics cannot inspect implementation even if
  other barriers fail.
- `static-serve` idempotency follows the same pattern as `install-dep` mutex --
  concurrent critic calls are safe.
- The `servers[]` array in state enables multi-app projects (e.g., user-facing
  site + backoffice) with independent servers on different ports.
- resume-check response is action-based ("spawn-projection-critic") not
  state-number-based (2) -- self-documenting, no lookup table needed in
  orchestrator.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `appdev-cli.mjs` (1143 lines, 13 subcommands): Gains 2 new subcommands
  (`resume-check`, `static-serve`). Existing `readState()`/`writeState()`
  pattern reused. `install-dep` mutex pattern reused for `static-serve`
  concurrent start handling.
- `cmdDelete()` / `cmdComplete()`: Need enhancement to auto-stop servers
  before clearing state.
- `cmdUpdate()`: Needs new flags: `--build-dir`, `--spa`, `--critics`.
- SKILL.md Step 0 (Resume Check): Needs rewrite from simple AskUserQuestion
  to four-branch logic with resume-check integration.
- SKILL.md Step 0.5 (Workspace Setup): Needs `serve` added to devDependencies
  alongside `@playwright/cli`.
- SKILL.md evaluation phase: Needs `static-serve --stop` after round-complete.
- Both critic agent definitions: Need `Bash(node *appdev-cli* static-serve*)`
  in allowed-tools and instructions to call `static-serve` as first step.
- Generator agent definition: Needs production build instruction + state update
  (`--build-dir`, `--spa`).

### Established Patterns
- Zero-dependency CLI pattern (node:fs, node:path, node:child_process only).
  `static-serve` shells out to `serve` (devDependency) rather than implementing
  a static server. `resume-check` uses only filesystem + state file.
- Binary file-exists checks in orchestrator. resume-check replaces multiple
  orchestrator-side checks with one CLI call returning structured JSON.
- Mutex via mkdirSync (install-dep pattern). Reuse for static-serve concurrent
  start handling.
- Action-based JSON responses (round-complete pattern). resume-check follows
  the same structured response pattern.

### Integration Points
- `appdev-cli update --critics`: Orchestrator sets expected critics before eval
- `appdev-cli resume-check`: Called in Step 0 auto-resume path
- `appdev-cli static-serve` / `static-serve --stop`: Critics start, orchestrator stops
- `appdev-cli update --build-dir --spa`: Generator writes after production build
- Generator.md: New end-of-round build + state update instructions
- Critic agent frontmatter: New allowed-tools pattern for static-serve
- Critic agent instructions: New first step calling static-serve
- SKILL.md Step 0: Four-branch resume logic
- SKILL.md Step 0.5: Add `serve` to devDependencies
- SKILL.md eval phase: Add `static-serve --stop` after round-complete

</code_context>

<deferred>
## Deferred Ideas

- **Programmatic agent session log reading** -- explore reading `~/.claude/`
  session logs for smarter `claude --continue` recovery (recovering partial
  agent work from conversation history). Future milestone.
- **Static production build as Out of Scope update** -- PROJECT.md currently
  lists "Static production build output" as out of scope. This phase makes it
  a requirement for evaluation. PROJECT.md should be updated to reflect this
  shift (production build required for evaluation, not as a deliverable concern).

</deferred>

---

*Phase: 09-crash-recovery*
*Context gathered: 2026-04-01*
