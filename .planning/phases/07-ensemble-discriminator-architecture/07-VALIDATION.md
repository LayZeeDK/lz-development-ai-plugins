---
phase: 7
slug: ensemble-discriminator-architecture
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 7 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) or manual test scripts |
| **Config file** | none -- Wave 0 installs |
| **Quick run command** | `node test-appdev-cli.mjs` |
| **Full suite command** | `node test-appdev-cli.mjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node test-appdev-cli.mjs`
- **After every plan wave:** Run `node test-appdev-cli.mjs` + manual agent definition review
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | ENSEMBLE-03 | unit | `node test-compile-evaluation.mjs` | -- W0 | pending |
| 07-01-02 | 01 | 0 | ENSEMBLE-04 | unit | `node test-install-dep-mutex.mjs` | -- W0 | pending |
| 07-01-03 | 01 | 0 | ENSEMBLE-06 | unit | `node test-extract-scores.mjs` | -- W0 | pending |
| 07-01-04 | 01 | 0 | ENSEMBLE-06 | unit | `node test-compute-verdict.mjs` | -- W0 | pending |
| 07-01-05 | 01 | 0 | ENSEMBLE-07 | integration | `node test-compile-roundtrip.mjs` | -- W0 | pending |
| 07-01-06 | 01 | 0 | ENSEMBLE-09 | unit | `node test-summary-glob.mjs` | -- W0 | pending |
| 07-xx-xx | xx | x | ENSEMBLE-01 | manual-only | Review perceptual-critic.md frontmatter | N/A | pending |
| 07-xx-xx | xx | x | ENSEMBLE-02 | manual-only | Review projection-critic.md frontmatter | N/A | pending |
| 07-xx-xx | xx | x | ENSEMBLE-05 | manual-only | `ls plugins/application-dev/agents/evaluator.md` returns not found | N/A | pending |
| 07-xx-xx | xx | x | ENSEMBLE-10 | manual-only | Review SKILL.md evaluation phase section | N/A | pending |
| 07-xx-xx | xx | x | BARRIER-01 | manual-only | Review tool allowlists in both critic .md files | N/A | pending |
| 07-xx-xx | xx | x | BARRIER-02 | manual-only | Review finding templates in critic instructions | N/A | pending |
| 07-xx-xx | xx | x | BARRIER-03 | manual-only | Review tool allowlists + Write restrictions | N/A | pending |
| 07-xx-xx | xx | x | BARRIER-04 | manual-only | Review directory structure documentation | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `test-compile-evaluation.mjs` -- stubs for ENSEMBLE-03, ENSEMBLE-09
- [ ] `test-install-dep-mutex.mjs` -- stubs for ENSEMBLE-04
- [ ] `test-extract-scores.mjs` -- stubs for ENSEMBLE-06 (3-dim parsing)
- [ ] `test-compute-verdict.mjs` -- stubs for ENSEMBLE-06 (verdict computation)
- [ ] `test-compile-roundtrip.mjs` -- stubs for ENSEMBLE-07 (compile -> parse roundtrip)
- [ ] `test-summary-glob.mjs` -- stubs for ENSEMBLE-09 (auto-discovery)
- [ ] Test fixture: sample summary.json files for perceptual and projection critics
- [ ] Test fixture: sample EVALUATION.md with 3 dimensions for extractScores() regression

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| perceptual-critic tool allowlist correct | ENSEMBLE-01 | Agent definition review, not runtime | Review frontmatter allowed_tools in perceptual-critic.md |
| projection-critic tool allowlist correct | ENSEMBLE-02 | Agent definition review, not runtime | Review frontmatter allowed_tools in projection-critic.md |
| evaluator.md removed | ENSEMBLE-05 | File absence check | `ls plugins/application-dev/agents/evaluator.md` should fail |
| Orchestrator spawns 2 critics + CLI | ENSEMBLE-10 | Orchestrator prompt review | Review SKILL.md evaluation phase section |
| Neither critic reads source code | BARRIER-01 | Tool allowlist review | Verify no Read/Glob of *.ts, *.js, *.tsx, *.jsx in allowlists |
| Findings use behavioral language | BARRIER-02 | Prompt instruction review | Review finding templates in both critic agents |
| Critics write only to evaluation/ | BARRIER-03 | Tool restriction review | Verify Write paths restricted to evaluation/ directory |
| Generator and critic tests independent | BARRIER-04 | Directory structure review | Verify test suites in separate directories |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
