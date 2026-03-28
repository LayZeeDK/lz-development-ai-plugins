---
phase: 2
slug: git-workflow-and-loop-control
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 2 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation + smoke tests (plugin behavior testing) |
| **Config file** | none -- markdown/ESM modifications, not a test-framework project |
| **Quick run command** | `node plugins/application-dev/scripts/appdev-cli.mjs get` |
| **Full suite command** | Manual: run `/application-dev` with test prompt, verify git log, tags, evaluation folders, convergence |
| **Estimated runtime** | ~2 seconds (quick); ~5 minutes (full manual) |

---

## Sampling Rate

- **After every task commit:** Verify modified files parse correctly (YAML frontmatter, ESM syntax); run `node appdev-cli.mjs get` to confirm CLI works
- **After every plan wave:** Run appdev-cli subcommands with test data; verify SKILL.md reads coherently end-to-end
- **Before `/gsd:verify-work`:** Full manual test: `/application-dev "Build a todo app"` -- verify git log, tags, convergence
- **Max feedback latency:** 2 seconds (quick run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | GIT-01 | smoke | `git log --oneline -- SPEC.md` after test run | N/A | pending |
| 02-01-02 | 01 | 1 | GIT-02 | smoke | `git log --oneline` shows multiple Generator commits | N/A | pending |
| 02-01-03 | 01 | 1 | GIT-03 | smoke | `git grep "node_modules" .gitignore` | N/A | pending |
| 02-01-04 | 01 | 1 | GIT-04 | smoke | `git log --oneline -- "evaluation/"` | N/A | pending |
| 02-01-05 | 01 | 1 | GIT-05 | smoke | `git tag -l "appdev/*"` shows planning-complete, round-N, final | N/A | pending |
| 02-02-01 | 02 | 1 | LOOP-01 | unit | `node appdev-cli.mjs round-complete --round 1 --report test-eval.md` | No W0 | pending |
| 02-02-02 | 02 | 1 | LOOP-02 | manual | Verify SKILL.md loop condition | N/A | pending |
| 02-02-03 | 02 | 1 | LOOP-03 | manual | Verify SKILL.md SAFETY_CAP behavior | N/A | pending |
| 02-02-04 | 02 | 1 | LOOP-04 | unit | Test appdev-cli with various score sequences | No W0 | pending |
| 02-02-05 | 02 | 1 | LOOP-05 | unit | Test appdev-cli escalation computation | No W0 | pending |
| 02-02-06 | 02 | 1 | LOOP-06 | N/A | DEFERRED to Phase 3 | N/A | skip |
| 02-02-07 | 02 | 1 | LOOP-07 | manual | Review generator.md for fix-only instructions | N/A | pending |
| 02-02-08 | 02 | 1 | LOOP-08 | manual | Review generator.md for EVALUATION.md-before-SPEC.md instruction | N/A | pending |
| 02-02-09 | 02 | 1 | LOOP-09 | unit | `node appdev-cli.mjs get-trajectory` with test state | No W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `scripts/appdev-cli.mjs` -- rename from appdev-state.mjs (CLI foundation for all LOOP-* requirements)
- [ ] Score extraction fixture: minimal EVALUATION.md to test `round-complete` parsing
- [ ] Escalation computation test: multi-round state data, verify escalation levels
- [ ] Verify `Bash(node *appdev-cli*)` pattern works after rename
- [ ] Verify orchestrator `Bash(git tag -a *)` matches `Bash(git tag *)` allowed-tools pattern

*Wave 0 creates the renamed CLI and validates its patterns. No test framework install needed -- tests are smoke/manual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Generator commits feature-by-feature | GIT-02 | Requires full agent run | Run /application-dev, inspect git log for multiple Generator commits |
| Evaluator commits to evaluation/round-N/ | GIT-04 | Requires full agent run | Run /application-dev, inspect git log for evaluation/ commits |
| Milestone tags at key points | GIT-05 | Requires full agent run | Run /application-dev, `git tag -l "appdev/*"` |
| 10-round safety cap | LOOP-02 | Requires 10-round scenario | Verify SKILL.md loop condition; full test would need 10 rounds |
| Wrap-up on safety cap | LOOP-03 | Requires 10-round scenario | Verify SKILL.md SAFETY_CAP behavior |
| Fix-only mode rounds 2+ | LOOP-07 | Behavioral instruction | Review generator.md, observe Generator behavior in rounds 2+ |
| EVALUATION.md before SPEC.md | LOOP-08 | Behavioral instruction | Review generator.md, observe Generator read order |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
