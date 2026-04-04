# Claude Code Platform Bugs Affecting Multi-Agent Orchestration - Research

**Researched:** 2026-04-04
**Domain:** Claude Code platform bugs, multi-agent orchestration failure modes
**Confidence:** HIGH (verified via GitHub Issues API, CHANGELOG.md, community sources)
**Claude Code version:** 2.1.92 (current as of research date)

## Summary

Extensive web research confirms that all four failure modes observed during the Dutch art museum test (v1.2) are known Claude Code platform bugs, not plugin-level defects. The `classifyHandoffIfNeeded` bug (#24181) was closed NOT_PLANNED on 2026-03-16 -- it was likely fixed silently or became irrelevant after the Task-to-Agent tool rename in v2.1.63. The output-clearing issue (#24705) was marked COMPLETED on 2026-02-10, but a new regression in v2.1.89+ (#42670) brought it back via the alternate screen buffer. Context exhaustion in subagents remains an open, unsolved problem with no auto-compact support. Memory leaks compound all of these issues in long-running sessions.

Our plugin already implements the correct primary workaround (binary file-exists checks) for the false-failure bug. The additional defensive measures recommended here focus on: (1) committing evaluation artifacts before compaction can destroy them, (2) reducing critic context consumption, and (3) adding explicit timeout-based failure detection.

**Primary recommendation:** The plugin's existing binary-check pattern is sound. Add a git commit checkpoint after critic completion (already recommended in prior RESEARCH.md) and reduce critic context consumption to stay well under the ~60K budget.

## Bug Inventory

### Bug 1: Agent Tool False Failure (classifyHandoffIfNeeded)

| Property | Value |
|----------|-------|
| Issue | [#24181](https://github.com/anthropics/claude-code/issues/24181) |
| Duplicates | [#22087](https://github.com/anthropics/claude-code/issues/22087), [#22098](https://github.com/anthropics/claude-code/issues/22098), [#22312](https://github.com/anthropics/claude-code/issues/22312), [#22544](https://github.com/anthropics/claude-code/issues/22544), [#22567](https://github.com/anthropics/claude-code/issues/22567), [#22573](https://github.com/anthropics/claude-code/issues/22573), [#23307](https://github.com/anthropics/claude-code/issues/23307) |
| Status | CLOSED (NOT_PLANNED) on 2026-03-16 |
| Affected versions | v2.1.27 through at least v2.1.34 |
| Confidence | HIGH |

**What:** Every Task tool subagent reports "failed" even when all work completes successfully. A `ReferenceError: classifyHandoffIfNeeded is not defined` is thrown in the completion handler after the agent's actual work finishes. 100% reproducible across all platforms and agent types.

**Root cause:** The function `classifyHandoffIfNeeded` was referenced in the SubagentStop handler but never defined or imported in the bundled `cli.js` -- likely a missing import from a January 2026 refactor.

**Current status:** Closed NOT_PLANNED on 2026-03-16 with a "stale" label. The Task tool was renamed to "Agent" in v2.1.63, which involved significant refactoring of the agent completion path. The CHANGELOG for v2.1.77 shows "Fixed background agent results returning raw transcript data instead of the agent's final answer" -- this suggests the completion path was rewritten. It is plausible that the rename/rewrite eliminated the dangling reference. However, no explicit fix was documented.

**Our plugin's workaround:** Binary file-exists checks (`ls evaluation/round-N/{critic}/summary.json`) -- already implemented in SKILL.md. This is the correct and community-recommended pattern.

**Recommendation:** Keep the binary check. Do NOT rely on Agent tool return status. Add a comment in SKILL.md documenting why the binary check exists.

### Bug 2: Orchestrator Output Cleared During Context Compaction

| Property | Value |
|----------|-------|
| Issue | [#24705](https://github.com/anthropics/claude-code/issues/24705) (terminal clearing) |
| Related | [#27242](https://github.com/anthropics/claude-code/issues/27242) (no history access), [#42670](https://github.com/anthropics/claude-code/issues/42670) (alternate screen buffer regression v2.1.89+) |
| Status | #24705 CLOSED (COMPLETED) 2026-02-10; #42670 OPEN |
| Confidence | HIGH |

**What:** When context compaction fires, the terminal is cleared/reset, destroying scrollback history. The user cannot see prior agent output, running status, or progress. In v2.1.89+, a new regression makes this worse -- Claude Code switched to an alternate screen buffer (fullscreen TUI) that kills all native terminal scrollback.

**Root cause:** Context compaction is an internal optimization that was not made invisible to the terminal. The v2.1.89 alternate screen buffer regression compounds this by permanently preventing scroll-up.

**Impact on our plugin:** The user reported visible progress and running sub-agent status disappearing mid-session. This is exactly the compaction-clears-terminal bug. It is a platform issue, not a plugin defect.

**Workaround:** None available at the plugin level. The user can:
- Use `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` to trigger compaction earlier (gentler compaction, less data loss)
- Disable auto-compact entirely with `claude config set -g autoCompactEnabled false` (risk: context exhaustion)
- Downgrade below v2.1.89 to avoid the alternate screen buffer regression

**Recommendation:** Document this as a known platform limitation in the plugin README. No plugin-level fix possible. The user's CONTEXT.md already deferred this as "Platform issue, out of scope."

### Bug 3: Subagent Context Exhaustion (No Auto-Compact in Subagents)

| Property | Value |
|----------|-------|
| Issues | [#14867](https://github.com/anthropics/claude-code/issues/14867), [#18240](https://github.com/anthropics/claude-code/issues/18240), [#30396](https://github.com/anthropics/claude-code/issues/30396) (closed as dup) |
| Related | [#34332](https://github.com/anthropics/claude-code/issues/34332) (1M context autocompact at 76K -- OPEN) |
| Status | OPEN (no fix planned) |
| Confidence | HIGH |

**What:** Subagents spawned via the Agent tool lack autonomous context compaction. When they exhaust their context window, they halt silently or dump their full context to the parent agent, overwhelming it ([#14118](https://github.com/anthropics/claude-code/issues/14118) -- OPEN). There is no auto-compact trigger, no timeout, and no recovery mechanism.

**Root cause:** Auto-compact was designed for the main conversation only. Subagents have fixed context budgets with no compaction support. On Opus 4.6 with 1M windows, the autocompact threshold is miscalibrated (triggers at ~76K tokens, wasting 92% of the window).

**Impact on our plugin:** Critic agents have ~60K token budgets. Complex evaluations (many test files, large screenshots) can exhaust this. When a critic exhausts context, it terminates without producing `summary.json`, triggering the binary-check retry. But the retry will also fail if the evaluation is inherently too large for 60K tokens.

**Workaround options:**
1. **Reduce critic input size** -- the write-and-run pattern (already adopted in v1.1) keeps browser output external to context
2. **Limit tool calls per critic** -- cap the number of `Bash` and `Read` operations in critic instructions
3. **Pre-filter test results** -- have critics run tests with summary reporters (JSON, not verbose) to minimize context consumption
4. **Set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`** for earlier compaction in the main agent (does not help subagents)

**Recommendation:** Focus on reducing per-critic context consumption rather than trying to increase budgets. The write-and-run pattern is the correct approach. Add explicit instructions in critic agents to prefer summary output formats.

### Bug 4: Agent Freeze on Opus 4.6 (No Timeout)

| Property | Value |
|----------|-------|
| Issues | [#37521](https://github.com/anthropics/claude-code/issues/37521) (freeze), [#15446](https://github.com/anthropics/claude-code/issues/15446) (timeout request), [#35981](https://github.com/anthropics/claude-code/issues/35981) (Opus outages) |
| Status | OPEN (no timeout mechanism exists) |
| Confidence | HIGH |

**What:** Agents and subagents freeze indefinitely when running Opus 4.6. The API stops sending events while the connection remains alive. There is no timeout, no error, and no recovery. One user observed consistent 612-second crashes. Heavier system prompts (more MCP servers, more skills) correlate with higher freeze frequency.

**Impact on our plugin:** Our plugin spawns 5+ subagents per generation round (generator + 3 critics + compile). If any agent freezes, the orchestrator hangs indefinitely waiting for a return that never comes.

**Workaround:** No reliable workaround exists at the plugin level. The Bash tool has a `timeout` parameter (max 600000ms), but the Agent tool does not. Potential mitigations:
1. **Reduce system prompt weight** -- minimize tool lists, skill definitions, and CLAUDE.md content in critic agents
2. **Sequential critic spawning** -- spawn critics one at a time instead of in parallel (trades speed for reliability)
3. **Document for users** -- explain that agent freezes are a platform bug and recommend restarting the session

**Recommendation:** No plugin-level fix. Document as known limitation. Consider making parallel vs. sequential critic spawning configurable.

### Bug 5: Memory Leak in Multi-Agent Sessions

| Property | Value |
|----------|-------|
| Issues | [#32304](https://github.com/anthropics/claude-code/issues/32304) (21GB with subagents), [#33447](https://github.com/anthropics/claude-code/issues/33447) (API response bodies 181MB each), [#21378](https://github.com/anthropics/claude-code/issues/21378) (15GB after 20min), [#25926](https://github.com/anthropics/claude-code/issues/25926) (heap OOM), [#32892](https://github.com/anthropics/claude-code/issues/32892) (92GB/hr ArrayBuffer) |
| Status | All OPEN |
| Confidence | HIGH |

**What:** Claude Code's Node.js process leaks memory aggressively during multi-agent sessions. API response bodies (~181MB each) accumulate per turn and are never GC'd. ArrayBuffers accumulate at rates of 18-92 GB/hour. With 2-3 subagent invocations, the process can reach 21GB+. The in-memory `mutableMessages` array grows monotonically -- compaction trims what's sent to the API but not the JavaScript objects.

**Impact on our plugin:** A full generation round (generator + 3 critics + compile) involves many turns. If the session has already run multiple rounds, memory exhaustion can crash the entire Claude Code process, losing all in-flight work.

**Workaround:**
1. v2.1.59 added "releasing completed subagent task state" and v2.1.50 fixed "completed teammate tasks never GC'd" -- update to latest version
2. Keep sessions short -- do not run multiple generation rounds in a single session
3. The evaluation artifact commit (Finding 4 in prior RESEARCH.md) enables crash recovery

**Recommendation:** The commit-after-critics pattern is essential for resilience against memory-related crashes. Already recommended.

### Bug 6: Subagent Output Lost After Context Compaction

| Property | Value |
|----------|-------|
| Issues | [#23821](https://github.com/anthropics/claude-code/issues/23821) (closed NOT_PLANNED 2026-03-16), [#31420](https://github.com/anthropics/claude-code/issues/31420) (auto-backup request, closed NOT_PLANNED 2026-04-03) |
| Related | v2.1.71 fix: "background agent completion notifications missing the output file path" |
| Status | NOT_PLANNED (Anthropic declined both the bug report and the feature request) |
| Confidence | HIGH |

**What:** When context compaction fires in the parent agent, all Task/Agent tool outputs that weren't persisted to files are lost. Only 4 out of 14+ subagent outputs survived in one reported case. The feature request for auto-backup was also declined.

**Impact on our plugin:** Our critics write to files (summary.json), so the output itself is not lost. However, the parent's MEMORY of which critics completed is lost after compaction. The binary file-exists check re-discovers this, so the workaround is already in place.

**Recommendation:** The binary file-exists check is the correct pattern. The git commit checkpoint adds a second layer of durability. No additional action needed.

### Bug 7: Context Dump from Subagent to Parent

| Property | Value |
|----------|-------|
| Issue | [#14118](https://github.com/anthropics/claude-code/issues/14118) |
| Status | OPEN |
| Confidence | HIGH |

**What:** When a background subagent runs out of context, its full tool call log is exposed to the parent agent's context window via the `getOutput` call. This can dump thousands of tokens of verbose subagent history into the parent, rapidly exhausting the parent's context.

**Impact on our plugin:** If a critic runs out of context, the orchestrator could receive a massive context dump, accelerating its own context exhaustion and triggering compaction (which clears its state, per Bug 6).

**Recommendation:** The binary file-exists check avoids parsing agent output. The commit checkpoint preserves state before context dump can corrupt the orchestrator. Both mitigations are already recommended.

## Task-to-Agent Tool Rename (v2.1.63)

| Property | Value |
|----------|-------|
| Issue | [#29677](https://github.com/anthropics/claude-code/issues/29677) |
| Status | CLOSED (NOT_PLANNED) 2026-03-29 |
| Confidence | HIGH |

The Task tool was renamed to "Agent" in v2.1.63. This was an undocumented breaking change for PreToolUse/PostToolUse hook payloads. The `settings.json` tools filter IS backward-compatible ("Task" still matches). The TypeScript SDK reverted the wire name to 'Task' temporarily, planning to migrate in the next minor release.

**Impact on our plugin:** Our plugin references the tool as "Agent tool" in SKILL.md instructions. If hook-based filtering is used, it must match both "Task" and "Agent" tool names. Our `allowed-tools` lists use tool names like `Bash`, `Read`, `Write` -- not `Task` or `Agent` -- so this rename does not affect tool permissions.

## Relevant CHANGELOG Fixes (v2.1.50 through v2.1.92)

These fixes in recent Claude Code versions address some of the issues above:

| Version | Fix | Relevance |
|---------|-----|-----------|
| v2.1.92 | Fixed subagent spawning failing with "Could not determine pane count" after tmux windows killed | Agent spawn reliability |
| v2.1.77 | Restored `model` parameter on Agent tool; fixed background agent results returning raw transcript | Agent completion accuracy |
| v2.1.75 | Fixed agent task progress stuck on "Initializing..." | Agent spawn reliability |
| v2.1.71 | Fixed background agent completion notifications missing output file path | Output recovery after compaction |
| v2.1.71 | Improved memory by stripping heavy progress message payloads during compaction | Memory leak mitigation |
| v2.1.69 | Fixed background agent task output clearing all session caches after compaction | Output preservation |
| v2.1.59 | Releasing completed subagent task state | Memory leak mitigation |
| v2.1.50 | Fixed completed teammate tasks never GC'd from session state | Memory leak mitigation |

## Resilience Patterns for Multi-Agent Workflows

Based on community practices and official guidance:

### Pattern 1: Binary File-Exists Check (already implemented)
The standard workaround for false-failure agents. Check for expected output files on disk rather than trusting the Agent tool's return status.

### Pattern 2: Git Commit Checkpoints (recommended in prior RESEARCH.md)
Commit evaluation artifacts after all critics complete but before compile-evaluation. Enables crash recovery after memory-related crashes, context exhaustion, or session loss.

### Pattern 3: Information Collectors, Not Implementers
Official Anthropic guidance (from Claude Code team engineer Adam Wolf): "Sub agents work best when they just look for information and provide a small amount of summary back to main conversation thread." Our critics follow this pattern -- they evaluate and produce a summary.json, not implement changes.

### Pattern 4: Limit Parallel Agents to 3-4
Community consensus: "Max out at three or four specialized agents. More than that decreases productivity rather than increasing it." Our plugin spawns exactly 3 critics in parallel, which is within the recommended range.

### Pattern 5: Minimize Subagent Tool Surface
Allow only the tools each agent actually needs. Broader tool access increases system prompt size (correlated with freeze frequency) and enables "overstep" behavior.

### Anti-Pattern: Trusting Agent Return Status
Never use the Agent tool's success/failure return as the primary signal. Always verify via filesystem or git state.

## Common Pitfalls

### Pitfall 1: Relying on Agent Tool Return Status
**What goes wrong:** Orchestrator trusts "failed" status and retries work that already succeeded, burning context.
**Why it happens:** The classifyHandoffIfNeeded bug (or its successors) reports failure even on success.
**How to avoid:** Binary file-exists checks. Never branch on Agent tool return value.
**Warning signs:** Orchestrator retrying critics that already produced valid output.

### Pitfall 2: Subagent Context Exhaustion with No Recovery
**What goes wrong:** Critic runs out of context mid-evaluation. No output produced. Retry also fails.
**Why it happens:** Complex evaluations (many tests, large screenshots, verbose output) exceed the ~60K budget.
**How to avoid:** Use summary reporters, write-and-run pattern, limit tool calls, pre-filter inputs.
**Warning signs:** Critics producing no output at all (no summary.json), even after retry.

### Pitfall 3: Compaction Destroying Orchestrator State
**What goes wrong:** Orchestrator loses track of which critics completed after compaction fires.
**Why it happens:** Context compaction strips agent output history. Parent re-enters a state where it doesn't know what happened.
**How to avoid:** Binary file-exists re-check after every agent return. Git commit checkpoints.
**Warning signs:** Orchestrator re-spawning critics that already completed.

### Pitfall 4: Memory Exhaustion Crashing Long Sessions
**What goes wrong:** After multiple generation rounds, the Claude Code process exceeds system RAM and crashes.
**Why it happens:** API response bodies, ArrayBuffers, and mutableMessages accumulate without GC.
**How to avoid:** Keep sessions short. Commit artifacts frequently. Use crash-recovery (resume-check).
**Warning signs:** Task Manager showing claude.exe at 10GB+ RAM.

## Open Questions

1. **Was classifyHandoffIfNeeded actually fixed?**
   - What we know: Issue #24181 was closed NOT_PLANNED (stale) on 2026-03-16. The Task-to-Agent rename in v2.1.63 rewrote the completion path. CHANGELOG v2.1.77 fixed "background agent results returning raw transcript."
   - What's unclear: Whether the specific ReferenceError still occurs on v2.1.92. No explicit fix was documented.
   - Recommendation: Test on current version. If it still occurs, the binary check handles it. If fixed, the binary check is still good defense-in-depth.

2. **Will subagents ever get auto-compact?**
   - What we know: #14867 requested this in December 2025. #30396 was closed as duplicate. No fix planned.
   - What's unclear: Whether Agent Teams (research preview) handle this differently.
   - Recommendation: Design critic agents to stay well under their context budget. Do not assume auto-compact will be added.

3. **Alternate screen buffer regression (v2.1.89+)**
   - What we know: #42670 filed 2 days ago. Severe -- kills all terminal scrollback.
   - What's unclear: Whether this will be fixed quickly or is intentional.
   - Recommendation: Monitor. If it persists, users can pin to v2.1.88.

## Sources

### Primary (HIGH confidence)
- [#24181](https://github.com/anthropics/claude-code/issues/24181) - classifyHandoffIfNeeded false failure (verified via `gh issue view`, CLOSED NOT_PLANNED)
- [#24705](https://github.com/anthropics/claude-code/issues/24705) - Terminal clearing during compaction (verified, CLOSED COMPLETED)
- [#14118](https://github.com/anthropics/claude-code/issues/14118) - Subagent context dump to parent (verified, OPEN)
- [#37521](https://github.com/anthropics/claude-code/issues/37521) - Agent freeze on Opus 4.6 (verified, OPEN)
- [#32304](https://github.com/anthropics/claude-code/issues/32304) - 21GB memory leak with subagents (verified, OPEN)
- [#33447](https://github.com/anthropics/claude-code/issues/33447) - API response body accumulation (verified, OPEN)
- [#34332](https://github.com/anthropics/claude-code/issues/34332) - 1M context autocompact at 76K (verified, OPEN)
- [#14867](https://github.com/anthropics/claude-code/issues/14867) - Subagents halt with context exhaustion (verified, OPEN)
- [#23821](https://github.com/anthropics/claude-code/issues/23821) - Subagent output lost after compaction (verified, CLOSED NOT_PLANNED)
- [#42670](https://github.com/anthropics/claude-code/issues/42670) - Alternate screen buffer regression v2.1.89+ (verified, OPEN)
- [CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) - Agent-related fixes v2.1.50-v2.1.92
- Claude Code version 2.1.92 confirmed via `claude --version`

### Secondary (MEDIUM confidence)
- [#25818](https://github.com/anthropics/claude-code/issues/25818) - Orchestrator no diagnostic context (CLOSED NOT_PLANNED)
- [#29677](https://github.com/anthropics/claude-code/issues/29677) - Task-to-Agent rename breaking change (CLOSED NOT_PLANNED)
- [#15487](https://github.com/anthropics/claude-code/issues/15487) - maxParallelAgents feature request (CLOSED NOT_PLANNED)
- [#31420](https://github.com/anthropics/claude-code/issues/31420) - Auto-backup task outputs (CLOSED NOT_PLANNED)
- Community best practices from [claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide), [Claude Code docs](https://code.claude.com/docs/en/best-practices)

### Tertiary (LOW confidence)
- Community reports on freeze frequency correlation with system prompt weight (anecdotal, multiple sources)
- Adam Wolf (Claude Code team) subagent guidance cited in community blog posts (secondhand attribution)

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH -- all issues verified via GitHub Issues API with `gh issue view`
- Bug status: HIGH -- state, closedAt, stateReason confirmed programmatically
- Workaround effectiveness: HIGH -- binary-check pattern is the community standard
- Changelog analysis: MEDIUM -- CHANGELOG.md reviewed via WebFetch, but large file may have missed entries
- classifyHandoffIfNeeded fix status: MEDIUM -- closed NOT_PLANNED with stale label, no explicit fix documented

**Research date:** 2026-04-04
**Valid until:** 2026-04-18 (Claude Code releases frequently; bugs may be fixed or new ones introduced)
