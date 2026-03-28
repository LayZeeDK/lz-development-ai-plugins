---
phase: 1
slug: orchestrator-integrity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 1 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (plugin behavior testing) |
| **Config file** | none -- plugin modifications are markdown/CJS, not a test-framework project |
| **Quick run command** | `node scripts/appdev-state.cjs get` |
| **Full suite command** | Manual: run `/application-dev` with test prompt, verify state file, error recovery, and resume |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Verify modified files parse correctly (YAML frontmatter, CJS syntax)
- **After every plan wave:** Run state CLI script commands manually; verify SKILL.md reads coherently
- **Before `/gsd:verify-work`:** Full manual test: `/application-dev "Build a todo app"` -- verify state file creation, progress output, and resume behavior
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | ORCH-04 | smoke | Inspect agent frontmatter `tools` field | N/A | pending |
| 01-01-02 | 01 | 1 | ORCH-01 | manual | Review SKILL.md prompt guards | N/A | pending |
| 01-01-03 | 01 | 1 | ORCH-03 | manual | Review agent prompt templates for context leakage | N/A | pending |
| 01-02-01 | 02 | 1 | ORCH-07 | smoke | `node scripts/appdev-state.cjs init --prompt "test" && node scripts/appdev-state.cjs get` | W0 | pending |
| 01-02-02 | 02 | 1 | ORCH-02 | manual | Simulate agent failure, verify retry count + AskUserQuestion prompt | N/A | pending |
| 01-03-01 | 03 | 2 | ORCH-05 | N/A | Requirement revised -- two-layer enforcement replaces hooks | N/A | pending |
| 01-03-02 | 03 | 2 | ORCH-06 | manual | Verify agent `tools` field + prompt guards in each file | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `scripts/appdev-state.cjs` -- new file, covers ORCH-07 state management
- [ ] Verify `Bash(node *appdev-state*)` glob pattern works with `${CLAUDE_PLUGIN_ROOT}` substitution
- [ ] Verify AskUserQuestion works from skill context without being in `allowed-tools`

*Wave 0 creates the state CLI script that other tasks depend on.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Orchestrator never performs agent work | ORCH-01 | Behavioral -- requires observing orchestrator output during a live run | Run `/application-dev "Build a todo app"`, inspect output for orchestrator performing planning/generating/evaluating |
| Agent failure retry and escalation | ORCH-02 | Requires simulating API failure or agent spawn failure | Induce agent failure (e.g., bad prompt), verify 2 retries then AskUserQuestion |
| No context leakage | ORCH-03 | Requires inspecting agent prompt content in transcript | Run workflow, check agent spawn prompts for unexpected context |
| Resume after interruption | ORCH-07 | Requires killing and restarting a session | Run `/application-dev`, interrupt mid-workflow, restart, verify state file enables resume |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
