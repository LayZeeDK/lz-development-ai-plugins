---
phase: 8
slug: spec-acceptance-criteria-playwright-patterns
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
validated: 2026-04-01
---

# Phase 8 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node.js 20+) |
| **Config file** | none -- tests run directly via `node --test` |
| **Quick run command** | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Full suite command** | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Visual inspection of modified files against requirements
- **After every plan wave:** Full checklist review against all 16 requirements
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | SPEC-01 | grep-verify | `git grep -c "Acceptance Criteria" -- SPEC-TEMPLATE.md` | Y | green |
| 08-01-02 | 01 | 1 | SPEC-02 | grep-verify | `git grep -c "Core.*3" -- acceptance-criteria-guide.md` (3 tier lines) | Y | green |
| 08-01-03 | 01 | 1 | SPEC-03 | grep-verify | Guide at 70 lines with 5 sections; template has inline examples | Y | green |
| 08-01-04 | 01 | 1 | SPEC-04 | grep-verify | `git grep "acceptance-criteria-guide" -- planner.md` -> line 71 | Y | green |
| 08-01-05 | 01 | 1 | SPEC-05 | grep-verify | `git grep "Acceptance criteria per feature" -- planner.md` -> lines 105-106 | Y | green |
| 08-02-01 | 02 | 1 | PLAYWRIGHT-01 | grep-verify | `git grep "dev test" -- generator.md` -> line 215 boundary statement | Y | green |
| 08-02-02 | 02 | 1 | PLAYWRIGHT-02 | grep-verify | `git grep "PLAYWRIGHT-EVALUATION" -- projection-critic.md` -> line 41 | Y | green |
| 08-02-03 | 02 | 1 | PLAYWRIGHT-03 | grep-verify | PLAYWRIGHT-EVALUATION.md write-and-run section with skeleton test | Y | green |
| 08-02-04 | 02 | 1 | PLAYWRIGHT-04 | grep-verify | PLAYWRIGHT-EVALUATION.md documents `--reporter=json` command | Y | green |
| 08-02-05 | 02 | 1 | PLAYWRIGHT-05 | grep-verify | PLAYWRIGHT-EVALUATION.md test healing section present (174 lines) | Y | green |
| 08-02-06 | 02 | 1 | PLAYWRIGHT-06 | grep-verify | PLAYWRIGHT-EVALUATION.md round 2+ section + projection-critic.md:63 embeds tree | Y | green |
| 08-02-07 | 02 | 1 | TOKEN-01 | grep-verify | 8 technique markers in PLAYWRIGHT-EVALUATION.md (7 sections) | Y | green |
| 08-03-01 | 03 | 2 | TOKEN-02 | grep-verify | `git grep "PLAYWRIGHT-EVALUATION" -- perceptual-critic.md` -> line 41 | Y | green |
| 08-03-02 | 03 | 2 | TOKEN-03 | grep-verify | `git grep "PLAYWRIGHT-EVALUATION" -- projection-critic.md` -> line 41 | Y | green |
| 08-03-03 | 03 | 2 | TOKEN-04 | grep-verify | Both critics have explicit `console error` (filtered) command | Y | green |
| 08-03-04 | 03 | 2 | TOKEN-05 | grep-verify | Phase 7 process destruction still in place (verified via 08-03 SUMMARY) | Y | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase creates reference documentation and modifies agent definitions -- no new test infrastructure is required. The existing test-appdev-cli.mjs covers CLI functionality.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SPEC-TEMPLATE.md has Acceptance Criteria per feature | SPEC-01 | Template structure review | Inspect each feature section for `**Acceptance Criteria:**` heading |
| Tier minimums enforced | SPEC-02 | Criteria count review | Count criteria per feature: Core >= 3, Important >= 2, Nice-to-have >= 1 |
| Behavioral, measurable criteria | SPEC-03 | Quality review | Verify criteria describe outcomes, not implementation |
| Planner references criteria guide | SPEC-04 | Agent definition review | Verify Read instruction + ordering in planner.md |
| Planner self-verification checks | SPEC-05 | Agent definition review | Verify 2 new checklist items in planner.md |
| Generator writes dev tests | PLAYWRIGHT-01 | Agent definition review | Verify generator.md references playwright-testing skill |
| Projection-critic writes acceptance tests | PLAYWRIGHT-02 | Agent definition review | Verify projection-critic.md write-and-run workflow |
| Snapshot + SPEC for test generation | PLAYWRIGHT-03 | Reference review | Verify write-and-run section in PLAYWRIGHT-EVALUATION.md |
| JSON reporter deterministic execution | PLAYWRIGHT-04 | Reference review | Command documented in PLAYWRIGHT-EVALUATION.md |
| Test healing for selector failures | PLAYWRIGHT-05 | Reference review | Verify healing section in PLAYWRIGHT-EVALUATION.md |
| Round 2+ test reuse decision tree | PLAYWRIGHT-06 | Reference review | Verify reuse section in PLAYWRIGHT-EVALUATION.md |
| PLAYWRIGHT-EVALUATION.md technique sections | TOKEN-01 | File inspection | Verify all 7 technique sections present |
| Perceptual-critic eval-first, resize+eval | TOKEN-02 | Agent definition review | Verify Read instruction in perceptual-critic.md |
| Projection-critic write-and-run (~5 calls) | TOKEN-03 | Agent definition review | Verify workflow in projection-critic.md |
| Console error (filtered) both critics | TOKEN-04 | Agent definition review | Verify console filtering in both critic definitions |
| summary.json + hard GC | TOKEN-05 | Already Phase 7 | Verify process destruction still in place |

---

## Validation Sign-Off

- [x] All tasks have grep-verify commands with filesystem evidence
- [x] Sampling continuity: visual inspection per commit
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete (2026-04-01)

---

## Validation Audit 2026-04-01

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 16 requirements verified against filesystem with `git grep` commands. Phase 8 is
documentation/agent-definition changes (markdown files) -- structural grep assertions
serve as the automated verification layer. Every requirement maps to a concrete file
and line number in the codebase.
