---
phase: 12
slug: convergence-logic-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 12 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node.js >=18) |
| **Config file** | none -- uses `node --test` CLI directly |
| **Quick run command** | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Full suite command** | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **After every plan wave:** Run `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 0 | CONV-01, CONV-02 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- W0 | pending |
| 12-01-02 | 01 | 0 | CONV-05 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- W0 | pending |
| 12-01-03 | 01 | 1 | CONV-01, CONV-02 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | W0 | pending |
| 12-01-04 | 01 | 1 | CONV-05 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | W0 | pending |
| 12-01-05 | 01 | 1 | CONV-05 | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | W0 | pending |
| 12-02-01 | 02 | 0 | CONV-03 | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- W0 | pending |
| 12-02-02 | 02 | 0 | CONV-04 | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | No -- W0 | pending |
| 12-02-03 | 02 | 1 | CONV-03 | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | W0 | pending |
| 12-02-04 | 02 | 1 | CONV-04 | integration | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `test-appdev-cli.mjs` -- new `describe("computeEscalation threshold scaling")` block (CONV-01, CONV-02)
- [ ] `test-appdev-cli.mjs` -- new `describe("computeEMA")` block (CONV-05)
- [ ] `test-appdev-cli.mjs` -- new `describe("EMA-integrated escalation")` block (CONV-05 dual-path)
- [ ] `test-appdev-cli.mjs` -- new `describe("round-complete dimension_status")` block (CONV-03)
- [ ] `test-appdev-cli.mjs` -- new `describe("get-trajectory dimensions")` block (CONV-04)
- [ ] `test-appdev-cli.mjs` -- formula verification tests for N=3 and N=4 (success criterion #1)

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
