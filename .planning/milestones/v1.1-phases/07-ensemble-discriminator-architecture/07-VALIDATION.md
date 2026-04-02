---
phase: 7
slug: ensemble-discriminator-architecture
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-31
validated: 2026-04-01
---

# Phase 7 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none |
| **Quick run command** | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Full suite command** | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| **Test count** | 26 tests across 5 describe blocks |
| **Estimated runtime** | ~8.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **After every plan wave:** Run test suite + manual agent definition review
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 8.5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 07-01-01 | 01 | 1 | ENSEMBLE-03 | unit | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: compile-evaluation (9 tests) | green |
| 07-01-02 | 01 | 1 | ENSEMBLE-04 | unit | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: install-dep (5 tests) | green |
| 07-01-03 | 01 | 1 | ENSEMBLE-06 | unit | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: extractScores (5 tests) | green |
| 07-01-04 | 01 | 1 | ENSEMBLE-06 | unit | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: computeVerdict (5 tests) | green |
| 07-01-05 | 01 | 1 | ENSEMBLE-07 | integration | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: "EVALUATION.md parseable by extractScores()" | green |
| 07-01-06 | 01 | 1 | ENSEMBLE-09 | unit | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: "auto-discover any */summary.json" | green |
| 07-01-07 | 01 | 1 | ENSEMBLE-06 | integration | `node test-appdev-cli.mjs` | test-appdev-cli.mjs: roundComplete integration (2 tests) | green |
| 07-02-01 | 02 | 1 | ENSEMBLE-07 | manual-only | Review EVALUATION-TEMPLATE.md | N/A | green |
| 07-02-02 | 02 | 1 | ENSEMBLE-08 | manual-only | Review SCORING-CALIBRATION.md | N/A | green |
| 07-03-01 | 03 | 2 | ENSEMBLE-01 | manual-only | Review perceptual-critic.md | N/A | green |
| 07-03-02 | 03 | 2 | ENSEMBLE-02 | manual-only | Review projection-critic.md | N/A | green |
| 07-03-03 | 03 | 2 | ENSEMBLE-05 | manual-only | `ls plugins/application-dev/agents/evaluator.md` returns not found | N/A | green |
| 07-04-01 | 04 | 3 | ENSEMBLE-10 | manual-only | Review SKILL.md evaluation phase | N/A | green |
| 07-xx-01 | 03 | 2 | BARRIER-01 | manual-only | Review tool allowlists in both critic .md files | N/A | green |
| 07-xx-02 | 03 | 2 | BARRIER-02 | manual-only | Review finding templates in critic instructions | N/A | green |
| 07-xx-03 | 03 | 2 | BARRIER-03 | manual-only | Review tool allowlists + Write restrictions | N/A | green |
| 07-xx-04 | 03 | 2 | BARRIER-04 | manual-only | Review directory structure documentation | N/A | green |

*Status: pending / green / red / flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Verified |
|----------|-------------|------------|-------------------|----------|
| perceptual-critic tool allowlist correct | ENSEMBLE-01 | Agent definition review, not runtime | Review frontmatter allowed_tools in perceptual-critic.md: Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(node *appdev-cli* check-assets *). No Glob, no Edit. | 2026-04-01 |
| projection-critic tool allowlist correct | ENSEMBLE-02 | Agent definition review, not runtime | Review frontmatter allowed_tools in projection-critic.md: Read, Write, Bash(npx playwright-cli *), Bash(node *appdev-cli* install-dep *), Bash(npx playwright test *). No Glob, no Edit. | 2026-04-01 |
| evaluator.md removed | ENSEMBLE-05 | File absence check | `ls plugins/application-dev/agents/evaluator.md` returns "No such file or directory" | 2026-04-01 |
| EVALUATION-TEMPLATE.md uses CLI-compiled format | ENSEMBLE-07 | Template structure review | {placeholder} syntax, provenance markers (Source: Perceptual Critic / Projection Critic / CLI Ensemble) | 2026-04-01 |
| SCORING-CALIBRATION.md updated for 3 dimensions | ENSEMBLE-08 | Documentation review | Code Quality removed, 3 dimensions with rubric descriptors, ceiling rules | 2026-04-01 |
| Orchestrator spawns 2 critics + CLI | ENSEMBLE-10 | Orchestrator prompt review | SKILL.md evaluation phase: parallel Agent spawns, binary summary.json checks, compile-evaluation, round-complete | 2026-04-01 |
| Neither critic reads source code | BARRIER-01 | Tool allowlist review | No Glob in either critic. Hard Boundary sections state "MUST NOT read application source code files" | 2026-04-01 |
| Findings use behavioral language | BARRIER-02 | Prompt instruction review | Both critics document finding format with behavioral symptoms, not code-level diagnoses | 2026-04-01 |
| Critics write only to evaluation/ | BARRIER-03 | Tool restriction review | Write Restriction sections: "Write ONLY to evaluation/round-N/{critic}/" | 2026-04-01 |
| Generator and critic tests independent | BARRIER-04 | Directory structure review | Separate evaluation/ directories per critic, documented independence rationale | 2026-04-01 |

---

## Test Consolidation Note

The original Wave 0 plan expected separate test files per requirement (test-compile-evaluation.mjs, test-install-dep-mutex.mjs, etc.). During TDD execution, all 26 tests were consolidated into a single `plugins/application-dev/scripts/test-appdev-cli.mjs` with 5 describe blocks. This consolidation is appropriate because all tests target the same CLI module (`appdev-cli.mjs`) and share test fixtures.

---

## Validation Sign-Off

- [x] All tasks have automated verify or appropriately classified manual-only
- [x] Sampling continuity: automated tests run after every task commit
- [x] No MISSING references -- all requirements mapped
- [x] No watch-mode flags
- [x] Feedback latency < 10s (8.5s measured)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete (2026-04-01)

---

## Validation Audit 2026-04-01

| Metric | Count |
|--------|-------|
| Requirements audited | 14 (ENSEMBLE-01..10, BARRIER-01..04) |
| Automated (green) | 7 tasks (26 tests in test-appdev-cli.mjs) |
| Manual-only (verified) | 10 checks |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
