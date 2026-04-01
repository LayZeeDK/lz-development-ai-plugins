---
phase: 10
slug: v1-1-audit-gap-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | ENSEMBLE-04 | unit | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | Existing (5 install-dep tests) | pending |
| 10-01-02 | 01 | 1 | RECOVERY-03 | manual-only | Review SKILL.md SAFETY_CAP section | N/A | pending |
| 10-01-03 | 01 | 1 | PLAYWRIGHT-02, PLAYWRIGHT-04 | manual-only | Review SKILL.md Step 0.5 | N/A | pending |
| 10-01-04 | 01 | 1 | PLAYWRIGHT-02, PLAYWRIGHT-04 | manual-only | Review PLAYWRIGHT-EVALUATION.md + projection-critic.md | N/A | pending |
| 10-02-01 | 02 | 1 | ENSEMBLE-05 | unit | File should not exist after deletion | Exists (will delete) | pending |
| 10-02-02 | 02 | 1 | ENSEMBLE-05 | manual-only | `git grep "ASSET-VALIDATION-PROTOCOL"` returns empty | N/A | pending |
| 10-02-03 | 02 | 1 | ENSEMBLE-06 | manual-only | `git grep "Code Quality" -- plugins/application-dev/agents/generator.md` returns empty | N/A | pending |
| 10-02-04 | 02 | 1 | ENSEMBLE-01..10, BARRIER-01..04 | manual-only | Review README.md + generator.md + AI-PROBING-REFERENCE.md | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

57 tests in test-appdev-cli.mjs cover CLI behavior. If install-dep CLI is modified, existing install-dep tests (5 tests) need update. If only agent definitions change, no new tests needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SAFETY_CAP --stop insertion | RECOVERY-03 | Orchestrator prompt change, not code | Review SKILL.md lines 358-397 for static-serve --stop before wrap-up Generator |
| @playwright/test in Step 0.5 | PLAYWRIGHT-02 | Dependency list in prompt, not code | Review SKILL.md Step 0.5 for @playwright/test installation line |
| baseURL configuration | PLAYWRIGHT-04 | Agent prompt + template change | Review PLAYWRIGHT-EVALUATION.md for test.use({ baseURL }) and projection-critic.md for port instructions |
| Stale evaluator refs removed | ENSEMBLE-06 | Terminology change in .md files | `git grep "Code Quality" -- plugins/application-dev/agents/generator.md` returns empty |
| Stale Evaluator terminology | ENSEMBLE-01..10 | Terminology change in .md files | `git grep -c "Evaluator" -- plugins/application-dev/agents/generator.md` returns 0 stale refs |
| README.md updated | ENSEMBLE-01..10 | Documentation update | Review README.md for 4-agent ensemble description |
| ASSET-VALIDATION-PROTOCOL.md removed | ENSEMBLE-05 | File deletion | `ls plugins/application-dev/skills/application-dev/references/ASSET-VALIDATION-PROTOCOL.md` fails |
| evaluator-hardening-structure.test.mjs removed | ENSEMBLE-05 | File deletion | `ls tests/evaluator-hardening-structure.test.mjs` fails |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 17s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
