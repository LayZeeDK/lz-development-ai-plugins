---
phase: 05
slug: optimize-agent-definitions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 05 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual structural verification + git grep |
| **Config file** | none -- no test framework needed |
| **Quick run command** | `wc -l plugins/application-dev/agents/*.md plugins/application-dev/skills/application-dev/SKILL.md` |
| **Full suite command** | `wc -l plugins/application-dev/agents/*.md plugins/application-dev/skills/application-dev/SKILL.md && git grep -c "Self-Verification" plugins/application-dev/agents/evaluator.md` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `wc -l` on modified agent files
- **After every plan wave:** Run full suite (line counts + structural checks)
- **Before `/gsd:verify-work`:** Full suite must show all targets met
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | OPT-01 | manual-only | `wc -l plugins/application-dev/agents/evaluator.md` | N/A | pending |
| 05-01-02 | 01 | 1 | OPT-02 | smoke | `git grep -c "Self-Verification" plugins/application-dev/agents/evaluator.md` | N/A | pending |
| 05-01-03 | 01 | 1 | OPT-03 | smoke | `ls plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md` | N/A | pending |
| 05-02-01 | 02 | 1 | OPT-04 | manual-only | `wc -l plugins/application-dev/skills/application-dev/SKILL.md` | N/A | pending |
| 05-03-01 | 03 | 2 | OPT-05 | smoke | `node plugins/application-dev/scripts/appdev-cli.mjs --help 2>/dev/null; echo $?` | Existing | pending |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework or fixtures needed. Verification is structural inspection (line counts, grep for patterns).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent behavioral quality unchanged | OPT-05 | Cannot automate behavioral equivalence | Compare agent outputs before/after on sample prompts |
| WHY-based rationale replaces MUST/NEVER | OPT-01 | Requires human judgment on phrasing quality | Read modified agent definitions, verify emphasis patterns |
| SKILL.md uses imperative voice consistently | OPT-04 | Requires human judgment on writing style | Read SKILL.md, verify no second-person instructions |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
