---
phase: 4
slug: generator-hardening-and-skills
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 4 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (for appdev-cli unit tests) |
| **Config file** | none -- appdev-cli.mjs is zero-dependency ESM |
| **Quick run command** | `node --test tests/appdev-cli-check-assets.test.mjs` |
| **Full suite command** | `node --test tests/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/appdev-cli-check-assets.test.mjs`
- **After every plan wave:** Run `node --test tests/` + manual review of skill/agent content
- **Before `/gsd:verify-work`:** Full suite must be green + all skills reviewed against CONTEXT.md
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-xx | 01 | 1 | GEN-01 | manual-only | Manual review of generator.md progressive CI sections | N/A | pending |
| 04-01-xx | 01 | 1 | GEN-02 | manual-only | Manual review of generator.md frontmatter + Step 6 routing | N/A | pending |
| 04-01-xx | 01 | 1 | GEN-03 | manual-only | Manual review of generator.md asset sourcing + ASSETS-TEMPLATE.md | N/A | pending |
| 04-01-xx | 01 | 1 | GEN-04 | manual-only | Manual review of generator.md Vite+ preference | N/A | pending |
| 04-01-xx | 01 | 1 | GEN-05 | unit | `node --test tests/appdev-cli-check-assets.test.mjs` | W0 | pending |
| 04-01-xx | 01 | 1 | GEN-06 | manual-only | Manual review of generator.md latest-stable instruction | N/A | pending |
| 04-02-xx | 02 | 1 | SKILL-01 | manual-only | Manual review of vite-plus SKILL.md content | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/appdev-cli-check-assets.test.mjs` -- unit tests for check-assets command (GEN-05)
- [ ] Test fixtures: sample ASSETS.md files (valid URLs, invalid URLs, mixed, soft-404 patterns)

*Most Phase 4 requirements are agent instruction content (Markdown), not executable code. Only GEN-05 (check-assets) produces testable code. Remaining requirements are validated through manual review against CONTEXT.md decisions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Progressive CI integration instructions | GEN-01 | Agent prompt content, not executable code | Review generator.md: verify 4-phase progressive CI workflow present, diagnostic-not-gate language, testing decision framework |
| AI skills frontmatter + Read fallback | GEN-02 | Frontmatter wiring, not executable code | Verify generator.md frontmatter includes browser-* skills + testing skills; verify Step 6 has lean routing with Read fallback |
| Asset sourcing examples | GEN-03 | Agent prompt content, not executable code | Verify generator.md has asset sourcing examples (non-prescriptive) + ASSETS-TEMPLATE.md reference created |
| Vite+ preference instruction | GEN-04 | Agent prompt content, not executable code | Verify generator.md has compatibility-conditional Vite+ preference with plain Vite fallback |
| Latest stable version instruction | GEN-06 | Agent prompt content, not executable code | Verify generator.md has latest-stable-version behavioral instruction |
| Vite+ skill content | SKILL-01 | Skill content, not executable code | Verify vite-plus SKILL.md covers vp CLI commands, vite.config.ts format, framework support, known limitations |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
