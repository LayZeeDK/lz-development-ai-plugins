---
phase: 15
slug: generator-improvements
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-03
---

# Phase 15 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (documentation changes only) |
| **Config file** | N/A |
| **Quick run command** | Read modified files, verify content matches requirements |
| **Full suite command** | Full file review + generator.md frontmatter check |
| **Estimated runtime** | ~60 seconds (manual review) |

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
| 15-01-xx | 01 | 1 | GEN-01 | manual-only | Verify SKILL.md contains decision tree, Chrome vs Edge table, 5 reference files exist | N/A | pending |
| 15-02-xx | 02 | 1 | GEN-02 | manual-only | Verify SKILL.md updated versions, installation URLs, env vars, breaking changes | N/A | pending |
| 15-02-xx | 02 | 1 | GEN-04 | manual-only | Verify generator.md Vite+ paragraph + Step 8 commands updated | N/A | pending |
| 15-02-xx | 02 | 1 | GEN-03 | manual-only | Verify generator.md Step 1 contains upgrade instruction + non-SemVer exceptions | N/A | pending |

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

- [x] All tasks have manual verify instructions
- [x] Sampling continuity: manual review after every task commit
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
