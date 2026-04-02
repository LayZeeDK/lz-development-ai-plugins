---
phase: 10
slug: v1-1-audit-gap-closure
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
updated: 2026-04-02
---

# Phase 10 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none |
| **Quick run command** | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Full suite command** | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Estimated runtime** | ~17 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **After every plan wave:** Run `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 17 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|-----------|-------------------|------|--------|
| 10-01-01 | 01 | 1 | ENSEMBLE-04 | unit | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | tests/appdev-cli-check-assets.test.mjs (5 install-dep tests) | green |
| 10-01-02 | 01 | 1 | RECOVERY-03 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |
| 10-01-03 | 01 | 1 | PLAYWRIGHT-02 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |
| 10-01-04 | 01 | 1 | PLAYWRIGHT-04 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |
| 10-02-01 | 02 | 1 | ENSEMBLE-05 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |
| 10-02-02 | 02 | 1 | ENSEMBLE-05 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |
| 10-02-03 | 02 | 1 | ENSEMBLE-06 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |
| 10-02-04 | 02 | 1 | ENSEMBLE-01..10, BARRIER-01..04 | structural | `node tests/phase-10-structural.test.mjs` | tests/phase-10-structural.test.mjs | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

57 tests in test-appdev-cli.mjs cover CLI behavior. If install-dep CLI is modified, existing install-dep tests (5 tests) need update. If only agent definitions change, no new tests needed.

---

## Manual-Only Verifications

All previously manual-only verifications are now covered by automated structural tests in
`tests/phase-10-structural.test.mjs`. No manual verification steps remain.

---

## Validation Sign-Off

- [x] All tasks have automated verify (tests/phase-10-structural.test.mjs covers all 6 gaps)
- [x] Sampling continuity: all tasks have automated test coverage
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 17s (19 structural tests complete in ~14ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** green -- 19/19 tests pass (node tests/phase-10-structural.test.mjs)
