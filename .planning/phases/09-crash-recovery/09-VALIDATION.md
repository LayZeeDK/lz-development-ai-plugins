---
phase: 9
slug: crash-recovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
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
| 09-01-F1 | 01 | 1 | RECOVERY-01, RECOVERY-02, RECOVERY-03 | unit (TDD) | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- TDD creates first | pending |
| 09-02-T1 | 02 | 2 | RECOVERY-03 | read+inspect | Read generator.md + content checks | N/A -- prose | pending |
| 09-02-T2 | 02 | 2 | RECOVERY-03, RECOVERY-04 | read+inspect | Read critic .md files + content checks | N/A -- prose | pending |
| 09-02-T3 | 02 | 2 | RECOVERY-01, RECOVERY-02, RECOVERY-03 | read+inspect | Read SKILL.md + content checks | N/A -- prose | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `test-appdev-cli.mjs` -- new describe blocks for `resume-check` subcommand (7+ test cases covering all action responses)
- [ ] `test-appdev-cli.mjs` -- new describe blocks for `static-serve` subcommand (5+ test cases: start, stop, idempotent, port check, SPA mode)
- [ ] `test-appdev-cli.mjs` -- new describe block for `update` with `--build-dir`, `--spa`, `--critics` flags
- [ ] `test-appdev-cli.mjs` -- test for `delete`/`complete` server cleanup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AUTOCOMPACT_PCT in critic definitions | RECOVERY-04 | Static config in .md files, already verified | Inspect `perceptual-critic.md:114` and `projection-critic.md:168` for `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
