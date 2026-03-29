---
phase: 05
slug: optimize-agent-definitions
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
updated: 2026-03-29
---

# Phase 05 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node.js built-in test runner) |
| **Config file** | none -- built-in, no config needed |
| **Quick run command** | `node --test tests/phase-05-nyquist.test.mjs` |
| **Full suite command** | `node --test tests/phase-05-nyquist.test.mjs` |
| **Estimated runtime** | ~112ms |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/phase-05-nyquist.test.mjs`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must show 26/26 pass
- **Max feedback latency:** <1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | OPT-01 | unit | `node --test tests/phase-05-nyquist.test.mjs` | tests/phase-05-nyquist.test.mjs | green |
| 05-01-02 | 01 | 1 | OPT-02 | unit | `node --test tests/phase-05-nyquist.test.mjs` | tests/phase-05-nyquist.test.mjs | green |
| 05-01-03 | 01 | 1 | OPT-03 | unit | `node --test tests/phase-05-nyquist.test.mjs` | tests/phase-05-nyquist.test.mjs | green |
| 05-02-01 | 02 | 1 | OPT-04 | unit | `node --test tests/phase-05-nyquist.test.mjs` | tests/phase-05-nyquist.test.mjs | green |
| 05-03-01 | 03 | 2 | OPT-05 | unit | `node --test tests/phase-05-nyquist.test.mjs` | tests/phase-05-nyquist.test.mjs | green |

---

## Wave 0 Requirements

No additional infrastructure needed. All tests use node:test with structural file assertions (line counts, pattern matching, section ordering).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent behavioral quality unchanged | OPT-05 | Cannot automate behavioral equivalence | Compare agent outputs before/after on sample prompts |
| WHY-based rationale reads naturally | OPT-01 | Requires human judgment on phrasing quality | Read modified agent definitions, verify rationale explanations are meaningful |
| SKILL.md imperative voice consistent | OPT-04 | Requires human judgment on writing style | Read SKILL.md, verify no second-person instructions |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

---

## Validation Audit 2026-03-29

| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

**Test coverage:** 26 tests across 5 describe blocks (OPT-01: 9, OPT-02: 3, OPT-03: 6, OPT-04: 4, OPT-05: 4). All pass in ~112ms.
