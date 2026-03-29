---
phase: 3
slug: evaluator-hardening
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
updated: 2026-03-29
---

# Phase 3 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node.js built-in) |
| **Config file** | None (built-in runner) |
| **Quick run command** | `node --test tests/evaluator-hardening-structure.test.mjs` |
| **Full suite command** | `node --test tests/*.test.mjs` |
| **Estimated runtime** | ~120ms |

---

## Sampling Rate

- **Automated structural tests:** Run via `node --test tests/evaluator-hardening-structure.test.mjs`
- **After every task commit:** Manual review of changed agent/reference/template files for consistency with CONTEXT.md decisions
- **After every plan wave:** Read modified files end-to-end, verify cross-references between evaluator.md, templates, and reference files
- **Before `/gsd:verify-work`:** Full read-through of all modified files + dry-run mental walkthrough of 15-step evaluator workflow
- **Max feedback latency:** Automated tests run in ~120ms

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|-----------|-------------------|------|--------|
| EVAL-01-step7 | 01+02 | 1 | EVAL-01 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-01-toolchain | 02 | 2 | EVAL-01 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-01-template | 01 | 1 | EVAL-01 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-02-modalities | 01 | 1 | EVAL-02 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-02-probes | 01 | 1 | EVAL-02 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-02-turing | 01 | 1 | EVAL-02 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-02-step8-ref | 02 | 2 | EVAL-02 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-03-ceilings | 01 | 1 | EVAL-03 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-03-scenarios | 01 | 1 | EVAL-03 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-03-conflict | 01 | 1 | EVAL-03 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-03-spec-rule | 01 | 1 | EVAL-03 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-03-step12-ref | 02 | 2 | EVAL-03 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-03-self-verify | 02 | 2 | EVAL-03 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-04-link-step7 | 01+02 | 1+2 | EVAL-04 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-04-template | 01 | 1 | EVAL-04 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-05-placeholder | 01+02 | 1+2 | EVAL-05 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-05-sharp | 02 | 2 | EVAL-05 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| EVAL-05-ceiling | 01 | 1 | EVAL-05 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| LOOP-06-watchdog | 02 | 2 | LOOP-06 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| LOOP-06-step2 | 02 | 2 | LOOP-06 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |
| LOOP-06-rule7 | 02 | 2 | LOOP-06 | structural | `node --test tests/evaluator-hardening-structure.test.mjs` | tests/evaluator-hardening-structure.test.mjs | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Wave 0 automated structural tests cover all 6 gaps (EVAL-01..EVAL-05, LOOP-06).

**Test file:** `tests/evaluator-hardening-structure.test.mjs`

**Coverage:**
- EVAL-01: 3 tests (Step 7 asset validation coverage, Step 3 toolchain, template Asset Validation section)
- EVAL-02: 4 tests (12 modality sections, 10-probe battery, 6 Turing test concepts, Step 8 reference)
- EVAL-03: 6 tests (5 ceiling categories, 12 calibration scenarios, conflict resolution, spec rule, Step 12 reference, 10-check self-verification)
- EVAL-04: 2 tests (Step 7 link checking, template Asset Validation URL column)
- EVAL-05: 3 tests (Step 7 placeholder detection, sharp toolchain, Visual Design ceiling)
- LOOP-06: 3 tests (self-verification check 10, Step 2 feature count, Rule 7 off-spec)

**Result:** 21/21 tests passing (run on 2026-03-29)

---

## Manual-Only Verifications

The following behaviors require end-to-end testing and remain manual-only:

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Asset validation catches broken images, CORS, placeholders with URLs and failure reasons | EVAL-01 | Requires running app + browser + report assessment | Run appdev against test app with known broken assets, verify report flags each with specific URLs |
| AI probing detects canned vs real AI responses | EVAL-02 | Requires AI features in browser + behavioral assessment | Run appdev against test app with canned AI, verify 10-probe battery runs and detects canning |
| Scoring follows calibration, not inflated | EVAL-03 | Requires human judgment of score quality | Run appdev against test app, compare scores to calibration examples, check ceiling rules applied |
| Link checking finds broken/blocked links with HTTP status codes | EVAL-04 | Requires running app + network monitoring | Run appdev against test app with dead links, verify report includes status codes |
| Placeholder detection for images and content | EVAL-05 | Requires visual inspection of running app | Run appdev against test app with placeholders, verify severity escalation by app type |

---

## Validation Sign-Off

- [x] All tasks have automated structural tests or manual verification instructions
- [x] Sampling continuity: automated tests + manual review after each task commit
- [x] Wave 0 covers all 6 MISSING gap references with 21 structural tests
- [x] No watch-mode flags
- [x] Feedback latency acceptable: ~120ms automated, manual review for behavioral tests
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** green -- 21/21 structural tests passing
