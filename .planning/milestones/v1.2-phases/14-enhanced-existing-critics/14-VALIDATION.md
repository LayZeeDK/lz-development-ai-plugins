---
phase: 14
slug: enhanced-existing-critics
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 14 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None -- tests run directly via `node --test` |
| **Quick run command** | `node --test tests/phase-14-structural.test.mjs` |
| **Full suite command** | `node --test tests/*.test.mjs` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/phase-14-structural.test.mjs`
- **After every plan wave:** Run `node --test tests/*.test.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 0 | EVAL-01, EVAL-02, EVAL-03 | structural | `node --test tests/phase-14-structural.test.mjs` | Yes | green |
| 14-01-02 | 01 | 1 | EVAL-01, EVAL-03 | structural | `node --test tests/phase-14-structural.test.mjs` | Yes | green |
| 14-01-03 | 01 | 1 | EVAL-02 | structural | `node --test tests/phase-14-structural.test.mjs` | Yes | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `tests/phase-14-structural.test.mjs` -- 11 structural assertions covering EVAL-01 (4), EVAL-02 (4), EVAL-03 (3)

All Wave 0 tests created and passing green.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | -- | -- | -- |

*All phase behaviors have automated structural verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s (measured: 114ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

---

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 11 structural assertions pass. Phase 14 is Nyquist-compliant.
