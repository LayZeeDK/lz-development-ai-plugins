---
phase: 9
slug: crash-recovery
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
updated: 2026-04-02
---

# Phase 9 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none -- tests run via `node scripts/test-appdev-cli.mjs` |
| **Quick run command** | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Full suite command** | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **After every plan wave:** Run `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-F1 | 01 | 1 | RECOVERY-01, RECOVERY-02, RECOVERY-03 | unit (TDD) | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | Yes -- 57 tests, all pass | green |
| 09-02-T1 | 02 | 2 | RECOVERY-03 | read+inspect | Read generator.md + content checks | N/A -- prose | green |
| 09-02-T2 | 02 | 2 | RECOVERY-03, RECOVERY-04 | read+inspect | Read critic .md files + content checks | N/A -- prose | green |
| 09-02-T3 | 02 | 2 | RECOVERY-01, RECOVERY-02, RECOVERY-03 | read+inspect | Read SKILL.md + content checks | N/A -- prose | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `test-appdev-cli.mjs` -- new describe blocks for `resume-check` subcommand (15 test cases covering all action responses)
- [x] `test-appdev-cli.mjs` -- new describe blocks for `static-serve` subcommand (7 test cases: start, stop, idempotent, port check, SPA mode, error cases)
- [x] `test-appdev-cli.mjs` -- new describe block for `update` with `--build-dir`, `--spa`, `--critics` flags
- [x] `test-appdev-cli.mjs` -- test for `delete`/`complete` server cleanup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AUTOCOMPACT_PCT in critic definitions | RECOVERY-04 | Static config in .md files, already verified | Inspect `perceptual-critic.md:114` and `projection-critic.md:168` for `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s (static-serve tests spawn real server; happy-path tests ~2s each)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-04-02 -- 57/57 tests passing, all 3 static-serve gaps filled
