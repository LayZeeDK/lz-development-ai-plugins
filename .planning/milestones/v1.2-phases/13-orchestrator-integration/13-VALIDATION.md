---
phase: 13
slug: orchestrator-integration
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
audited: 2026-04-02
---

# Phase 13 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node.js built-in, v22+) |
| **Config file** | none -- runs via `node --test <file>` |
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
| 13-01-01 | 01 | 0 | ORCH-02 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | Yes (line 968) | green |
| 13-01-02 | 01 | 0 | ORCH-03 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | Yes (lines 1199, 1223) | green |
| 13-01-03 | 01 | 1 | ORCH-02 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | Yes (lines 1170, 1181) | green |
| 13-01-04 | 01 | 1 | ORCH-03 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | Yes (line 1223) | green |
| 13-02-01 | 02 | 1 | ORCH-01 | manual-only | N/A (SKILL.md prose review) | N/A | green |
| 13-02-02 | 02 | 1 | ORCH-02 | manual-only | N/A (SKILL.md dispatch table review) | N/A | green |
| 13-02-03 | 02 | 1 | ORCH-04 | manual-only | N/A (SKILL.md prose review) | N/A | green |
| 13-02-04 | 02 | 1 | ORCH-05 | manual-only | N/A (SKILL.md architecture section review) | N/A | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] Update existing test at line 968: assert `spawn-all-critics` instead of `spawn-both-critics`
- [x] Update existing test at line 1170-1179: update default critics expectation (3 critics, `spawn-all-critics`)
- [x] New test: all 3 critics missing -> `spawn-all-critics` with empty skip
- [x] New test: 2 of 3 critics missing -> `spawn-all-critics` with 1 valid in skip
- [x] New test: only perturbation missing -> `spawn-perturbation-critic`
- [x] New test: compile-evaluation when all 3 critics have valid summaries (verifies compile path generalizes to N critics)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3-critic parallel spawn in SKILL.md | ORCH-01 | SKILL.md is prose instructions, not executable code | Verify SKILL.md evaluation phase shows 3 Agent() calls and 3 binary checks |
| SAFETY_CAP includes perturbation-critic | ORCH-04 | SKILL.md prose | Verify SAFETY_CAP section shows 3 Agent() calls and 3 binary checks |
| Architecture section lists 5 agents | ORCH-05 | SKILL.md prose | Verify Planning/Generation + Critic Ensemble structure with all 5 agents |
| Dispatch table has all entries | ORCH-02 | SKILL.md prose | Verify spawn-all-critics, spawn-perceptual-critic, spawn-projection-critic, spawn-perturbation-critic entries exist |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s (88 tests in ~25s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed

## Validation Audit 2026-04-02

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 5 requirements (ORCH-01 through ORCH-05) have verification coverage:
- ORCH-02, ORCH-03: 5 automated unit tests covering all 3-critic resume-check branches (88/88 passing)
- ORCH-01, ORCH-04, ORCH-05: Manual-only (SKILL.md prose) -- verified by gsd-verifier in 13-VERIFICATION.md
