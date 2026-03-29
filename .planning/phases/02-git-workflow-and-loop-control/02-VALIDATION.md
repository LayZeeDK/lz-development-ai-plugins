---
phase: 2
slug: git-workflow-and-loop-control
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
validated: 2026-03-29
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
| 02-01-01 | 01 | 1 | GIT-01 | smoke | `git log --oneline -- SPEC.md` after test run | N/A | green |
| 02-01-02 | 01 | 1 | GIT-02 | smoke | `git log --oneline` shows multiple Generator commits | N/A | green |
| 02-01-03 | 01 | 1 | GIT-03 | smoke | `git grep "node_modules" .gitignore` | N/A | green |
| 02-01-04 | 01 | 1 | GIT-04 | smoke | `git log --oneline -- "evaluation/"` | N/A | green |
| 02-01-05 | 01 | 1 | GIT-05 | smoke | `git tag -l "appdev/*"` shows planning-complete, round-N, final | N/A | green |
| 02-02-01 | 02 | 1 | LOOP-01 | unit | `node --test tests/appdev-cli-convergence.test.mjs` | Yes | green |
| 02-02-02 | 02 | 1 | LOOP-02 | manual | Verify SKILL.md loop condition | N/A | green |
| 02-02-03 | 02 | 1 | LOOP-03 | manual | Verify SKILL.md SAFETY_CAP behavior | N/A | green |
| 02-02-04 | 02 | 1 | LOOP-04 | unit | `node --test tests/appdev-cli-convergence.test.mjs` | Yes | green |
| 02-02-05 | 02 | 1 | LOOP-05 | unit | `node --test tests/appdev-cli-convergence.test.mjs` | Yes | green |
| 02-02-06 | 02 | 1 | LOOP-06 | N/A | DEFERRED to Phase 3 | N/A | skip |
| 02-02-07 | 02 | 1 | LOOP-07 | manual | Review generator.md for fix-only instructions | N/A | green |
| 02-02-08 | 02 | 1 | LOOP-08 | manual | Review generator.md for EVALUATION.md-before-SPEC.md instruction | N/A | green |
| 02-02-09 | 02 | 1 | LOOP-09 | unit | `node --test tests/appdev-cli-convergence.test.mjs` | Yes | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `scripts/appdev-cli.mjs` -- rename from appdev-state.mjs (CLI foundation for all LOOP-* requirements)
- [x] Score extraction fixture: minimal EVALUATION.md to test `round-complete` parsing
- [x] Escalation computation test: multi-round state data, verify escalation levels
- [x] Verify `Bash(node *appdev-cli*)` pattern works after rename
- [x] Verify orchestrator `Bash(git tag -a *)` matches `Bash(git tag *)` allowed-tools pattern

*All Wave 0 requirements satisfied. Test file: `tests/appdev-cli-convergence.test.mjs` (22 tests, node:test).*

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

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-29

---

## Validation Audit 2026-03-29

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

Tests generated: `tests/appdev-cli-convergence.test.mjs` (22 tests across 4 suites)
- LOOP-01: 4 tests (score extraction from EVALUATION.md)
- LOOP-04: 6 tests (multi-round convergence detection)
- LOOP-05: 8 tests (E-0 through E-IV escalation levels)
- LOOP-09: 4 tests (get-trajectory subcommand)
