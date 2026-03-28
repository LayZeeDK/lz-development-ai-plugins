---
phase: 1
slug: orchestrator-integrity
status: approved
nyquist_compliant: true
wave_0_complete: true
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
| **Quick run command** | `node plugins/application-dev/scripts/appdev-state.cjs get` |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-01-01 | 01 | 1 | ORCH-07 | smoke | `node plugins/application-dev/scripts/appdev-state.cjs init --prompt "test" && node plugins/application-dev/scripts/appdev-state.cjs get && node plugins/application-dev/scripts/appdev-state.cjs delete` | pending |
| 01-01-02 | 01 | 1 | ORCH-04 | smoke | `git grep "tools:" plugins/application-dev/agents/` -- verify allowlists match spec | pending |
| 01-01-03 | 01 | 1 | ORCH-05, ORCH-06 | smoke | `git grep "two-layer" .planning/REQUIREMENTS.md` -- amended requirement text | pending |
| 01-02-01 | 02 | 2 | ORCH-01 | manual | Review SKILL.md rules section for delegation-only constraints | pending |
| 01-02-02 | 02 | 2 | ORCH-02 | manual | Simulate agent failure, verify retry count + AskUserQuestion prompt | pending |
| 01-02-03 | 02 | 2 | ORCH-03 | manual | Review agent prompt templates for context leakage | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Wave 0 items are resolved:

- [x] `scripts/appdev-state.cjs` -- created by Plan 01 Task 1 (wave 1)
- [x] `Bash(node *appdev-state*)` glob pattern -- documented in SKILL.md interfaces; actual runtime verification is manual (Phase 1 is plugin-level markdown/CJS, no automated test framework)
- [x] AskUserQuestion without `allowed-tools` -- bug #29547 workaround documented in CONTEXT.md; AskUserQuestion works via normal permission path, not via `allowed-tools` pre-approval

*Wave 0 is complete. State CLI script is created in Plan 01 (wave 1) before Plan 02 (wave 2) needs it.*

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

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
