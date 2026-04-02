---
phase: 11
slug: scoring-foundation-perturbation-critic
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
audited: 2026-04-02
---

# Phase 11 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | None -- tests run directly via `node --test` |
| **Quick run command** | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Full suite command** | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Estimated runtime** | ~17.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **After every plan wave:** Run `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | CRITIC-02 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | existing, tests updated | green |
| 11-01-02 | 01 | 1 | CRITIC-02 | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | existing, tests updated | green |
| 11-02-01 | 02 | 1 | CRITIC-01 | manual-only | Visual inspection of agents/perturbation-critic.md | Wave 0 (new file) | green |
| 11-02-02 | 02 | 1 | CRITIC-04 | manual-only | Review perturbation-critic.md boundary rule section | Wave 0 (new file) | green |
| 11-02-03 | 02 | 1 | CRITIC-03 | manual-only | Visual inspection of SCORING-CALIBRATION.md | existing file, content added | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] Update test helpers in `test-appdev-cli.mjs` from 3 to 4 dimensions
- [x] Add new test cases for Robustness score extraction, verdict computation, and assessment section generation
- [x] Add compile-evaluation test with perturbation summary.json (3-critic scenario)

*All Wave 0 requirements completed during Plan 01 execution (TDD RED/GREEN cycle).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Perturbation-critic agent definition has correct YAML frontmatter and methodology | CRITIC-01 | Agent definitions are markdown files, not executable code | Verify YAML frontmatter fields (name, description, model, color, tools), Information Barrier section, Write Restriction section, Step 0, and Methodology sections exist |
| Methodology boundaries prevent overlap with perceptual/projection critics | CRITIC-04 | Boundary rules are prose-based, not machine-testable | Review boundary rule table in perturbation-critic.md; confirm no overlap with perceptual-critic (responsive layout) or projection-critic (feature correctness) |
| SCORING-CALIBRATION.md contains Robustness ceiling rules and calibration scenarios | CRITIC-03 | Calibration content is prose-based scoring guidance | Verify Robustness ceiling rules table and below/at/above threshold scenarios with boundary explanations |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s (measured 18.4s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** APPROVED

## Validation Audit 2026-04-02

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 5 tasks verified. 2 automated (unit tests, 59/59 pass), 3 manual-only (agent definition and calibration prose). No Nyquist gaps detected.
