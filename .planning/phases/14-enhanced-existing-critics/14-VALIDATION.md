---
phase: 14
slug: enhanced-existing-critics
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 14-01-01 | 01 | 0 | EVAL-01, EVAL-02, EVAL-03 | structural | `node --test tests/phase-14-structural.test.mjs` | No -- Wave 0 creates | pending |
| 14-02-01 | 02 | 1 | EVAL-01, EVAL-03 | structural | `node --test tests/phase-14-structural.test.mjs` | Yes (from W0) | pending |
| 14-02-02 | 02 | 1 | EVAL-01 | structural | `node --test tests/phase-14-structural.test.mjs` | Yes (from W0) | pending |
| 14-03-01 | 03 | 1 | EVAL-02 | structural | `node --test tests/phase-14-structural.test.mjs` | Yes (from W0) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-14-structural.test.mjs` -- structural tests covering EVAL-01, EVAL-02, EVAL-03

Test patterns follow `tests/phase-10-structural.test.mjs`:
- Import `node:test` (describe/it) and `node:assert/strict`
- Use `readFileSync` to read plugin files
- Assert presence/absence of specific strings and structural markers
- Group by requirement ID using `describe` blocks

**Specific structural assertions:**

EVAL-01:
- perceptual-critic.md tools array contains `Bash(npx playwright test *)`
- perceptual-critic.md contains "consistency-audit" in OBSERVE section
- perceptual-critic.md references `consistency-audit.spec.ts` or `consistency-audit.json`

EVAL-02:
- projection-critic.md contains "Round-trip" or "round-trip" or "A->B->A"
- projection-critic.md references `page.goBack()` or `goBack`
- projection-critic.md mentions FN- finding prefix in round-trip context
- projection-critic.md states round-trip tests excluded from acceptance_tests.results[]

EVAL-03:
- SCORING-CALIBRATION.md Visual Design ceiling table has "shared component" or "nav/footer" divergence row
- SCORING-CALIBRATION.md 6/10 scenario mentions cross-page or nav consistency
- SCORING-CALIBRATION.md 8/10 scenario contains "ACROSS ALL PAGES" or cross-page language

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | -- | -- | -- |

*All phase behaviors have automated structural verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
