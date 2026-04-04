---
phase: 15
slug: generator-improvements
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 15 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in Node.js test runner) |
| **Config file** | N/A |
| **Quick run command** | `node --test tests/phase-15-structural.test.mjs` |
| **Full suite command** | `node --test tests/phase-15-structural.test.mjs` |
| **Estimated runtime** | ~0.1 seconds |

---

## Sampling Rate

- **After every task commit:** Read modified files, verify structure and content
- **After every plan wave:** Full review of all modified files in wave
- **Before `/gsd:verify-work`:** Full suite must pass -- all 4 requirements addressed
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | GEN-01 | unit | `node --test tests/phase-15-structural.test.mjs` | tests/phase-15-structural.test.mjs | green |
| 15-02-01 | 02 | 1 | GEN-02 | unit | `node --test tests/phase-15-structural.test.mjs` | tests/phase-15-structural.test.mjs | green |
| 15-02-02 | 02 | 1 | GEN-03 | unit | `node --test tests/phase-15-structural.test.mjs` | tests/phase-15-structural.test.mjs | green |
| 15-02-03 | 02 | 1 | GEN-04 | unit | `node --test tests/phase-15-structural.test.mjs` | tests/phase-15-structural.test.mjs | green |
| 15-cross | -- | -- | Cross-wiring | unit | `node --test tests/phase-15-structural.test.mjs` | tests/phase-15-structural.test.mjs | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*All deliverables are Markdown documentation files. No test framework, stubs, or fixtures needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| browser-built-in-ai meta-skill routes to correct API reference based on use case | GEN-01 | All changes are Markdown instruction files -- no executable code | Verify SKILL.md contains decision tree with 4 tiers, Chrome vs Edge comparison table, graceful degradation pattern. Verify 5 reference files exist with correct content. |
| vite-plus skill reflects v0.1.15 CLI with alpha caveats | GEN-02 | Skill is a Markdown reference doc | Verify SKILL.md updated to v0.1.15: VP_* env vars, vp CLI commands, installation URLs from viteplus.dev, alpha caveat at top. |
| Generator workflow includes dependency freshness instruction | GEN-03 | Instruction in generator.md is prose | Verify generator.md Step 1 (Project Setup) contains dependency upgrade instruction with non-SemVer exceptions (Playwright, TypeScript, 0.x). Verify Round 2+ exclusion. |
| Vite+ is default with escape hatch, CI commands vp-first | GEN-04 | Generator preferences are prose instructions | Verify generator.md Vite+ paragraph uses "default" language with escape hatch. Verify Step 8 diagnostic battery leads with vp commands. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands
- [x] Sampling continuity: `node --test tests/phase-15-structural.test.mjs` after every task commit
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (24 tests, 5 suites, 0 failures)
