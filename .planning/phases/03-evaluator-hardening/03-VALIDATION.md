---
phase: 3
slug: evaluator-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 3 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None -- no test infrastructure in project |
| **Config file** | N/A |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Manual review of changed agent/reference/template files for consistency with CONTEXT.md decisions
- **After every plan wave:** Read modified files end-to-end, verify cross-references between evaluator.md, templates, and reference files
- **Before `/gsd:verify-work`:** Full read-through of all modified files + dry-run mental walkthrough of 15-step evaluator workflow
- **Max feedback latency:** N/A -- manual-only

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | EVAL-01 | manual-only | N/A | N/A | pending |
| TBD | 01 | 1 | EVAL-04 | manual-only | N/A | N/A | pending |
| TBD | 01 | 1 | EVAL-05 | manual-only | N/A | N/A | pending |
| TBD | 02 | 1 | EVAL-02 | manual-only | N/A | N/A | pending |
| TBD | 02 | 1 | EVAL-03 | manual-only | N/A | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements -- no test framework needed.*

**Justification:** All EVAL requirements are about the Evaluator agent's behavioral quality when evaluating a running application. They cannot be unit-tested because they require:
1. A running application with known defects
2. A browser (playwright-cli) to interact with it
3. The Evaluator agent to produce a report
4. Human assessment of report quality

The correct validation is integration testing via actual end-to-end runs of the appdev workflow with known-defective applications, which happens during `/gsd:verify-work`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Asset validation catches broken images, CORS, placeholders with URLs and failure reasons | EVAL-01 | Requires running app + browser + report assessment | Run appdev against test app with known broken assets, verify report flags each with specific URLs |
| AI probing detects canned vs real AI responses | EVAL-02 | Requires AI features in browser + behavioral assessment | Run appdev against test app with canned AI, verify 10-probe battery runs and detects canning |
| Scoring follows calibration, not inflated | EVAL-03 | Requires human judgment of score quality | Run appdev against test app, compare scores to calibration examples, check ceiling rules applied |
| Link checking finds broken/blocked links with HTTP status codes | EVAL-04 | Requires running app + network monitoring | Run appdev against test app with dead links, verify report includes status codes |
| Placeholder detection for images and content | EVAL-05 | Requires visual inspection of running app | Run appdev against test app with placeholders, verify severity escalation by app type |

---

## Validation Sign-Off

- [ ] All tasks have manual verification instructions or Wave 0 dependencies
- [ ] Sampling continuity: manual review after each task commit
- [ ] Wave 0 covers all MISSING references -- N/A (no automated tests)
- [ ] No watch-mode flags -- N/A
- [ ] Feedback latency acceptable for manual review
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
