# Phase 9: Crash Recovery - Research

**Researched:** 2026-04-01
**Domain:** CLI subcommand implementation, process lifecycle management, filesystem-based crash recovery
**Confidence:** HIGH

## Summary

Phase 9 adds crash recovery and static production build serving to the
application-dev plugin. The core work is two new `appdev-cli` subcommands
(`resume-check` and `static-serve`), extensions to the existing `update`
subcommand (new flags: `--build-dir`, `--spa`, `--critics`), server cleanup
in `delete`/`complete`, rewrites to SKILL.md Step 0 (four-branch resume
logic), and updates to all four agent definitions (Generator production build
requirement, critic static-serve calls, critic allowed-tools additions).

RECOVERY-04 is already implemented -- both critic agent definitions already
recommend `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`. No work needed for that
requirement.

**Primary recommendation:** Implement `resume-check` as a pure-function
subcommand (filesystem reads + state JSON reads, zero side effects except
corrupt artifact cleanup) and `static-serve` as a thin wrapper around the
`serve` npm package with detached process management and cross-platform
kill support.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Artifact detection via new `appdev-cli resume-check` subcommand returning action-name JSON (not numeric states)
- Expected critics tracked in state via `--critics` flag on `update`
- Static production build replaces dev server -- critics evaluate production builds served through `appdev-cli static-serve`
- New `appdev-cli static-serve` subcommand using `serve` npm package as devDependency
- Idempotent startup with mutex pattern (same as `install-dep`)
- Critics call `static-serve` themselves (no orchestrator involvement in starting)
- Multi-app support via `servers[]` array in state, ports starting at 5173
- SPA mode controlled by `--spa true|false` in state, passed as `--single` to `serve`
- Partial artifact handling: resume-check detects invalid artifacts and deletes corrupt critic directory before returning re-spawn action
- Step 0 four-branch resume logic based on prompt presence and state existence
- `static-serve --stop` called by orchestrator between rounds
- `delete` and `complete` auto-stop all running servers
- Add `Bash(node *appdev-cli* static-serve*)` to both critic agent frontmatter
- RECOVERY-04 already implemented (no work needed)

### Claude's Discretion
- `resume-check` internal implementation details (file scanning order, error messages)
- `static-serve` process spawning and health check implementation
- Exact format of resume context output shown to user
- Whether `serve` is installed in Step 0.5 alongside `@playwright/cli` or lazily on first `static-serve` call
- Generator.md wording for production build requirement (tech stack-agnostic instruction)

### Deferred Ideas (OUT OF SCOPE)
- Programmatic agent session log reading (`~/.claude/` session logs for smarter recovery)
- PROJECT.md out-of-scope update for static production builds
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RECOVERY-01 | Orchestrator detects completed artifacts on resume via appdev-cli state JSON + filesystem | `resume-check` subcommand design, artifact validation chain, action-name response format |
| RECOVERY-02 | Recovery states: no summaries -> re-spawn both; perceptual done -> spawn projection only; both done -> compile only; compiled -> round-complete only | `resume-check` action mapping, partial artifact cleanup, expected critics from state |
| RECOVERY-03 | Dev server lifecycle: started before evaluation, port verified, reused on resume | Replaced by `static-serve` -- critics start, orchestrator stops between rounds, port checking via net.Socket |
| RECOVERY-04 | `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` recommended in critic agent definitions | Already implemented in perceptual-critic.md:114 and projection-critic.md:168. No work needed. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| serve | 14.x | Static file server CLI | Vercel-maintained, `--single` flag for SPA mode, zero-config, widely used |
| node:fs | built-in | Filesystem validation in resume-check | Zero-dependency CLI pattern established in Phase 7 |
| node:child_process | built-in | Process spawning for static-serve, process killing | Already imported in appdev-cli.mjs |
| node:net | built-in | Port availability checking | Standard Node.js approach, no external dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:path | built-in | Path construction for artifact locations | Already imported in appdev-cli.mjs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| serve | http-server | serve has `--single` flag for SPA; http-server needs extra config |
| serve | express + serve-static | Programmatic but adds express dependency, violates zero-dep CLI pattern |
| net.Socket port check | detect-port npm | External dependency vs 10-line built-in solution |

**Installation:**
```bash
npm install --save-dev serve
```

Note: `serve` is the only new external dependency. It will be installed as a
devDependency in the user's project workspace during Step 0.5, alongside
`@playwright/cli`.

## Architecture Patterns

### Recommended File Changes
```
plugins/application-dev/
|-- scripts/
|   '-- appdev-cli.mjs          # +resume-check, +static-serve, update flags, delete/complete cleanup
|-- agents/
|   |-- generator.md            # +production build instruction, +state update (--build-dir, --spa)
|   |-- perceptual-critic.md    # +static-serve in allowed-tools, +first-step instruction
|   '-- projection-critic.md   # +static-serve in allowed-tools, +first-step instruction
|-- skills/
|   '-- application-dev/
|       '-- SKILL.md            # Step 0 rewrite, Step 0.5 serve install, eval phase static-serve --stop
'-- scripts/
    '-- test-appdev-cli.mjs     # +resume-check tests, +static-serve tests
```

### Pattern 1: resume-check Subcommand (Pure Validation)
**What:** Reads state JSON + filesystem, returns structured JSON with next action.
Orchestrator acts on the JSON without filesystem logic.
**When to use:** Called during Step 0 auto-resume and after any crash recovery.

```javascript
// resume-check response format (action-based, self-documenting)
function cmdResumeCheck(argv) {
  var state = readState();
  var round = state.round || 0;
  var step = state.step;
  var expectedCritics = state.critics || ["perceptual", "projection"];

  // Check workflow position and determine next action
  if (step === "plan") {
    // Check if SPEC.md exists with ## Features
    if (!existsSync("SPEC.md") || !readFileSync("SPEC.md", "utf8").includes("## Features")) {
      return output({ next_action: "plan", round: round, details: "SPEC.md missing or incomplete" });
    }

    // Check planning-complete tag
    try {
      execSync("git tag -l appdev/planning-complete", { encoding: "utf8" });
    } catch (e) { /* no tag */ }

    return output({ next_action: "generate", round: round || 1, details: "Planning complete, proceed to generation" });
  }

  if (step === "generate") {
    // Check if build output exists
    if (!state.build_dir || !existsSync(state.build_dir)) {
      return output({ next_action: "generate", round: round, details: "Build output missing" });
    }

    return output({ next_action: "evaluate", round: round, details: "Build exists, proceed to evaluation" });
  }

  if (step === "evaluate") {
    var roundDir = join(process.cwd(), "evaluation", "round-" + round);
    var valid = [];
    var invalid = [];

    // Validate each expected critic's summary.json
    for (var i = 0; i < expectedCritics.length; i++) {
      var critic = expectedCritics[i];
      var summaryPath = join(roundDir, critic, "summary.json");

      if (validateSummary(summaryPath)) {
        valid.push(critic);
      } else {
        invalid.push(critic);
        // Clean up corrupt directory
        cleanCriticDir(join(roundDir, critic));
      }
    }

    if (invalid.length === expectedCritics.length) {
      return output({ next_action: "spawn-both-critics", round: round, skip: [], details: "No valid summaries" });
    }

    if (invalid.length > 0) {
      return output({ next_action: "spawn-" + invalid[0] + "-critic", round: round, skip: valid, details: invalid[0] + " summary missing/corrupt" });
    }

    // Both summaries valid -- check EVALUATION.md
    var evalPath = join(roundDir, "EVALUATION.md");

    if (!validateEvaluation(evalPath)) {
      return output({ next_action: "compile-evaluation", round: round, details: "Both summaries valid, EVALUATION.md missing" });
    }

    // Check git tag
    var tagCheck = execSync("git tag -l appdev/round-" + round, { encoding: "utf8" }).trim();

    if (!tagCheck) {
      return output({ next_action: "round-complete", round: round, details: "EVALUATION.md valid, git tag missing" });
    }

    // Round fully complete -- move to next step
    return output({ next_action: "generate", round: round + 1, details: "Round " + round + " complete, next round" });
  }

  // summary or complete step
  return output({ next_action: step, round: round, details: "At " + step + " step" });
}
```

### Pattern 2: static-serve Subcommand (Process Lifecycle)
**What:** Spawns detached `serve` process, tracks PID/port in state, provides
idempotent start and stop operations.
**When to use:** Critics call `static-serve --dir <dir>` as first step;
orchestrator calls `static-serve --stop` between rounds.

```javascript
// Static serve -- key implementation decisions:
// 1. Spawn detached with stdio: 'ignore' + child.unref()
// 2. Port check via net.Socket connect attempt (zero dependencies)
// 3. Cross-platform kill: process.kill(pid) on Unix, taskkill /PID on Windows
// 4. Mutex via mkdirSync (same as install-dep) for concurrent start safety
// 5. Servers tracked in state.servers[] array

function isPortInUse(port) {
  return new Promise(function (resolve) {
    var socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", function () { socket.destroy(); resolve(true); });
    socket.on("timeout", function () { socket.destroy(); resolve(false); });
    socket.on("error", function () { socket.destroy(); resolve(false); });
    socket.connect(port, "127.0.0.1");
  });
}

function findAvailablePort(startPort) {
  // Check ports starting from startPort, return first available
  // Or check if serve is already running on startPort for given dir
}

function killProcess(pid) {
  try {
    if (process.platform === "win32") {
      execSync("taskkill /PID " + pid + " /T /F", { stdio: "pipe" });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch (e) {
    // Process already dead -- safe to ignore
  }
}
```

### Pattern 3: State Extension for Servers and Critics
**What:** New fields in `.appdev-state.json` for server tracking and critic list.
**When to use:** Written by `update --critics` and `static-serve`.

```json
{
  "prompt": "Build a task manager",
  "step": "evaluate",
  "round": 1,
  "status": "in_progress",
  "exit_condition": null,
  "rounds": [],
  "critics": ["perceptual", "projection"],
  "build_dir": "dist",
  "spa": true,
  "servers": [
    {"dir": "dist", "pid": 12345, "port": 5173, "spa": true}
  ]
}
```

### Pattern 4: Step 0 Four-Branch Resume Logic
**What:** SKILL.md Step 0 rewrites from simple AskUserQuestion to four
branches based on prompt presence and state existence.

```
| Prompt provided? | State exists? | Action |
|---|---|---|
| No | Yes | Auto-resume: show context, continue immediately |
| Yes | Yes | Ask: resume existing or start fresh with new prompt |
| Yes | No | Start fresh: normal first run |
| No | No | Error: nothing to resume, no prompt given |
```

### Anti-Patterns to Avoid
- **Hardcoding critic names in resume-check:** Read expected critics from state.critics field. Never hardcode ["perceptual", "projection"] -- the field is extensible for v1.2 perturbation-critic.
- **Spawning serve with inherited stdio:** Always use `stdio: 'ignore'` with `detached: true` and `child.unref()`. Inherited stdio keeps the parent waiting for the child.
- **Port checking with createServer:** Use net.Socket connect instead -- createServer can show false negatives due to IPv4/IPv6 dual binding.
- **Killing processes with child.kill() on Windows:** Use `taskkill /PID <pid> /T /F` on Windows; `child.kill()` only kills the immediate PID, not the process tree.
- **Reading evaluation artifacts in the orchestrator:** resume-check centralizes all validation in the CLI. The orchestrator calls resume-check and acts on the JSON -- it does not read or parse artifact files directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static file serving | Custom HTTP server with node:http | `serve` npm package | SPA rewrites, directory listing, proper MIME types, Content-Security-Policy |
| Port availability check | Shell out to netstat/lsof | `net.Socket.connect()` | Cross-platform, zero-dependency, ~10 lines |
| Process tree kill (Windows) | `process.kill(pid)` | `taskkill /PID <pid> /T /F` | process.kill on Windows only kills immediate PID, not child tree |
| JSON validity + field presence check | Regex on file content | JSON.parse + field checks | Catches truncated writes, malformed JSON, missing required fields |
| Mutex for concurrent access | File-based lock files | mkdirSync atomic directory creation | Already proven in install-dep, atomic on all platforms |

**Key insight:** The `serve` package handles all the edge cases of static
file serving (MIME type detection, range requests, gzip, cache headers,
SPA client-side routing fallback) that would take hundreds of lines to
implement correctly. The CLI only needs to manage the process lifecycle.

## Common Pitfalls

### Pitfall 1: Orphan Serve Processes
**What goes wrong:** Server processes outlive the parent session, consuming
ports and memory. On crash, no cleanup runs.
**Why it happens:** Detached processes are intentionally not killed when parent
exits. If the CLI crashes between spawn and PID recording, the process is
lost.
**How to avoid:** (1) Record PID to state immediately after spawn, before
health check. (2) On `static-serve` start, check state.servers[] for existing
entries matching the same dir -- if PID is still alive, reuse; if dead, clean
up entry. (3) On `static-serve --stop`, kill all PIDs in state.servers[] and
clear the array. (4) `delete` and `complete` call stop logic before clearing
state.
**Warning signs:** Port 5173 "already in use" errors on repeated runs.

### Pitfall 2: Race Condition in Concurrent Critic Startup
**What goes wrong:** Two critics call `static-serve --dir dist` simultaneously.
Both check that no server is running, both try to spawn.
**Why it happens:** TOCTOU (time-of-check-time-of-use) gap between checking
state.servers and spawning the process.
**How to avoid:** Mutex via mkdirSync (same pattern as install-dep). First
caller acquires lock, spawns server, records PID, releases lock. Second
caller waits for lock, finds server already running, returns immediately.
**Warning signs:** Two serve processes on different ports for the same
directory.

### Pitfall 3: Stale PID in State After Crash
**What goes wrong:** State records PID 12345, but the process died in a crash.
resume-check sees state.servers is non-empty and assumes server is running.
**Why it happens:** No process liveness check on resume.
**How to avoid:** `static-serve` always validates that recorded PIDs are alive
before claiming the server is running. Use `process.kill(pid, 0)` (signal 0
= liveness check, no actual signal sent) or `tasklist /FI "PID eq 12345"`
on Windows.
**Warning signs:** Critics fail to connect to the server URL despite
state.servers being non-empty.

### Pitfall 4: Windows Process Kill Differences
**What goes wrong:** `process.kill(pid)` on Windows does not kill child
processes spawned by `serve`.
**Why it happens:** Windows has no concept of process groups. `process.kill()`
sends TerminateProcess which only affects the named PID.
**How to avoid:** Use `taskkill /PID <pid> /T /F` on Windows, which
terminates the entire process tree. On Unix, `process.kill(-pid)` sends to
the process group (requires `detached: true`).
**Warning signs:** `serve` workers still running after stop command.

### Pitfall 5: Summary.json Truncation Detection
**What goes wrong:** A critic crashes mid-write, leaving a truncated
summary.json that passes `existsSync()` but fails `JSON.parse()`.
**Why it happens:** Crash during writeFileSync -- file is created but content
is partial.
**How to avoid:** resume-check validates: (1) file exists, (2) JSON.parse
succeeds, (3) required fields present (critic, dimension, score). On
failure, delete the entire critic directory and return a re-spawn action.
**Warning signs:** compile-evaluation fails with JSON parse errors.

### Pitfall 6: Git Tag Check False Negatives
**What goes wrong:** `git tag -l` returns empty when tags exist, because
pattern matching is glob-based.
**Why it happens:** `git tag -l "appdev/round-1"` is exact match and works
correctly, but `git tag -l appdev/round-*` might match unexpected tags.
**How to avoid:** Use exact tag name in `git tag -l "appdev/round-N"` where N
is the specific round number. Check that stdout.trim() is non-empty.
**Warning signs:** resume-check returns `round-complete` action for a round
that was already tagged.

### Pitfall 7: parseArgs Handling of Boolean-Like Flags
**What goes wrong:** `--spa true` is parsed as `{spa: "true"}` (string, not
boolean). `--stop` is parsed as `{stop: true}` (boolean).
**Why it happens:** The existing parseArgs function treats the next token as
the value unless it starts with `--`.
**How to avoid:** For `--spa`: parse as string, convert with
`args.spa === "true"`. For `--stop`: treat as boolean flag
(no value expected). Document this in the implementation.
**Warning signs:** SPA mode never activates because `"true" !== true`.

## Code Examples

Verified patterns from the existing codebase:

### Summary.json Validation (for resume-check)
```javascript
// Source: derived from existing compile-evaluation pattern (appdev-cli.mjs:856-878)
function validateSummary(summaryPath) {
  if (!existsSync(summaryPath)) {
    return false;
  }

  try {
    var raw = readFileSync(summaryPath, "utf8");
    var data = JSON.parse(raw);

    // Required fields per CONTEXT.md validation depth
    if (!data.critic || !data.dimension || data.score === undefined) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}
```

### EVALUATION.md Validation (for resume-check)
```javascript
// Source: matches binary check in SKILL.md evaluation phase
function validateEvaluation(evalPath) {
  if (!existsSync(evalPath)) {
    return false;
  }

  try {
    var content = readFileSync(evalPath, "utf8");

    return content.includes("## Scores");
  } catch (e) {
    return false;
  }
}
```

### Corrupt Artifact Cleanup (for resume-check)
```javascript
// Source: follows CONTEXT.md "explicit cleanup" decision
function cleanCriticDir(dirPath) {
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}
```

### Cross-Platform Process Kill (for static-serve)
```javascript
// Source: Node.js docs + Windows taskkill pattern
function killProcess(pid) {
  try {
    if (process.platform === "win32") {
      nodeExecSync("taskkill /PID " + pid + " /T /F", { stdio: "pipe" });
    } else {
      process.kill(-pid, "SIGTERM"); // negative PID = process group
    }
  } catch (e) {
    // Process already dead -- safe to ignore
  }
}
```

### Port Availability Check (for static-serve)
```javascript
// Source: Node.js net module docs
// NOTE: This is async -- static-serve will need to be async function
import { Socket } from "node:net";

function isPortInUse(port) {
  return new Promise(function (resolve) {
    var socket = new Socket();
    socket.setTimeout(1000);
    socket.on("connect", function () { socket.destroy(); resolve(true); });
    socket.on("timeout", function () { socket.destroy(); resolve(false); });
    socket.on("error", function () { socket.destroy(); resolve(false); });
    socket.connect(port, "127.0.0.1");
  });
}
```

### Mutex Pattern (reuse from install-dep)
```javascript
// Source: appdev-cli.mjs lines 1023-1060 (install-dep mutex)
// Same mkdirSync + stale detection + spawnSync("sleep") pattern
// Lock directory: join(cwd, ".appdev-serve-lock")
```

### Detached Process Spawn (for static-serve)
```javascript
// Source: Node.js child_process docs
import { spawn } from "node:child_process";

function spawnServe(dir, port, spa) {
  var args = [dir, "-l", String(port)];

  if (spa) {
    args.push("-s");
  }

  // Find serve binary in node_modules
  var serveBin = join(process.cwd(), "node_modules", ".bin", "serve");

  var child = spawn(serveBin, args, {
    detached: true,
    stdio: "ignore",
    cwd: process.cwd(),
  });

  child.unref();

  return child.pid;
}
```

### cmdUpdate Extensions
```javascript
// Source: existing cmdUpdate (appdev-cli.mjs:385-429)
// New flags to handle:
//   --build-dir <path>  -> state.build_dir = args["build-dir"]
//   --spa <true|false>  -> state.spa = (args.spa === "true")
//   --critics <list>    -> state.critics = args.critics.split(",")
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dev server for evaluation | Static production build + `serve` | Phase 9 | Third GAN barrier layer (opaque artifact) |
| AskUserQuestion on resume | Four-branch auto-resume logic | Phase 9 | Zero user interaction on `claude --continue` |
| Orchestrator filesystem checks | CLI `resume-check` subcommand | Phase 9 | Single source of truth for recovery state |
| No expected-critics tracking | `state.critics` array | Phase 9 | Extensible for v1.2 perturbation-critic |

**Deprecated/outdated:**
- Dev server evaluation: replaced by static production build. Critics can no longer depend on HMR or dev-mode source maps.
- Simple resume (AskUserQuestion always): replaced by four-branch logic. No-prompt + state-exists path skips user interaction entirely.

## Open Questions

1. **Serve binary path on Windows**
   - What we know: `node_modules/.bin/serve` exists after `npm install --save-dev serve`. On Windows, npm creates `.cmd` wrappers.
   - What's unclear: Whether `spawn("serve", ...)` works with Git Bash, or whether we need to use `npx serve` or the full `.cmd` path.
   - Recommendation: Use `npx serve` (already in PATH via npm) or `node_modules/.bin/serve.cmd` on Windows. Test during implementation. The `npx` approach is simpler and cross-platform.

2. **Async static-serve in synchronous CLI**
   - What we know: Port checking with `net.Socket` is async. The existing CLI uses synchronous patterns throughout.
   - What's unclear: Whether the health check can be done synchronously.
   - Recommendation: Make `cmdStaticServe` an async function. The CLI's `main` switch already handles async (see `cmdCheckAssets`). Use `await` for port checking and spawn health verification.

3. **PID liveness check on Windows**
   - What we know: `process.kill(pid, 0)` throws on Windows if the process doesn't exist. `tasklist /FI "PID eq N"` works but is slow.
   - What's unclear: Whether `process.kill(pid, 0)` is reliable across all Windows versions.
   - Recommendation: Use try/catch around `process.kill(pid, 0)` -- if it throws, process is dead. This is cross-platform and documented in Node.js docs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none -- tests run via `node scripts/test-appdev-cli.mjs` |
| Quick run command | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| Full suite command | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECOVERY-01 | resume-check returns correct action for each artifact state | unit | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| RECOVERY-02 | Four recovery states produce correct actions | unit | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| RECOVERY-03 | static-serve starts/stops server, port check, idempotent | unit + integration | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- Wave 0 |
| RECOVERY-04 | AUTOCOMPACT_PCT in critic definitions | manual-only | Visual inspection of agent .md files | N/A -- already verified |

### Sampling Rate
- **Per task commit:** `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Per wave merge:** `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test-appdev-cli.mjs` -- new describe blocks for `resume-check` subcommand (7+ test cases)
- [ ] `test-appdev-cli.mjs` -- new describe blocks for `static-serve` subcommand (5+ test cases)
- [ ] `test-appdev-cli.mjs` -- new describe block for `update` with `--build-dir`, `--spa`, `--critics` flags
- [ ] `test-appdev-cli.mjs` -- test for `delete`/`complete` server cleanup

## Sources

### Primary (HIGH confidence)
- appdev-cli.mjs (1143 lines) -- read in full, existing patterns verified
- SKILL.md -- read in full, current Step 0 and evaluation phase patterns documented
- All 4 agent definitions (generator.md, perceptual-critic.md, projection-critic.md, planner.md) -- read in full
- test-appdev-cli.mjs (743 lines) -- read in full, test patterns established
- 09-CONTEXT.md -- all locked decisions and integration points documented
- [Node.js v25 child_process docs](https://nodejs.org/api/child_process.html) -- detached, unref, stdio options
- [Node.js v25 net module docs](https://nodejs.org/api/net.html) -- Socket.connect for port checking

### Secondary (MEDIUM confidence)
- [serve npm package](https://www.npmjs.com/package/serve) -- v14.x, `--single` flag, `--listen` port, directory argument
- [serve-handler GitHub](https://github.com/vercel/serve-handler) -- rewrites, SPA configuration, all options
- [vercel/serve GitHub](https://github.com/vercel/serve) -- programmatic API via serve-handler

### Tertiary (LOW confidence)
- Windows taskkill /T /F pattern for process tree kill -- verified by multiple sources but not tested in this codebase yet

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `serve` is well-documented, all other tools are Node.js built-ins already used in the codebase
- Architecture: HIGH -- all patterns follow established conventions in appdev-cli.mjs (mutex, state read/write, JSON output, parseArgs)
- Pitfalls: HIGH -- process lifecycle management pitfalls are well-documented in Node.js ecosystem; Windows-specific kill pattern verified by multiple sources

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable domain -- static file serving and process management are mature)
