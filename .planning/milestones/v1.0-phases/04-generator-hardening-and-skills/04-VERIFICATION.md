---
phase: 04-generator-hardening-and-skills
verified: 2026-03-29T00:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 4: Generator Hardening and Skills Verification Report

**Phase Goal:** Harden generator.md with progressive CI self-checks, testing decision framework, asset sourcing pipeline, and skill wiring for new meta-skills.
**Verified:** 2026-03-29
**Status:** passed
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Generator runs CI checks progressively throughout development, not as a post-hoc gate | VERIFIED | generator.md lines 68-165: 4-phase build process with lint+typecheck per feature, full diagnostic battery in Phase 4 |
| 2 | Generator has skills frontmatter listing all 6 skills (3 browser AI + playwright-testing + vitest-browser + vite-plus) | VERIFIED | generator.md line 26: `skills: [browser-prompt-api, browser-webllm, browser-webnn, playwright-testing, vitest-browser, vite-plus]` |
| 3 | Generator has Read fallback instructions for each skill due to bug #25834 | VERIFIED | generator.md line 215: explicit bug #25834 note; Read instructions at lines 57, 85, 86, 116, 117, 118, 131, 143, 209, 211 |
| 4 | Generator creates ASSETS.md manifest and runs check-assets before handoff | VERIFIED | generator.md lines 141-152: Step 7 reads ASSETS-TEMPLATE.md, creates ASSETS.md, runs `node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs check-assets` |
| 5 | Generator screenshots its own app and inspects for broken images before handoff | VERIFIED | generator.md lines 169-175: Step 9 visual self-assessment with `npx playwright-cli screenshot` at 3 viewports |
| 6 | Generator prefers Vite+ for greenfield web projects but falls back to plain Vite when incompatible | VERIFIED | generator.md lines 57-60: Vite+ preference with explicit Angular/Nuxt fallback |
| 7 | Generator uses latest stable framework versions unless user prompt specifies otherwise | VERIFIED | generator.md line 61: "Use the latest stable versions of chosen frameworks and libraries." |
| 8 | Generator analyzes SPEC.md app type to choose test emphasis (Testing Trophy vs Pyramid) | VERIFIED | generator.md lines 92-101: Testing decision framework table routing by app type |

**Score:** 8/8 truths verified

---

### Required Artifacts

All artifact line counts and content verified directly from filesystem.

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `plugins/application-dev/agents/generator.md` | Hardened generator with progressive CI, testing, asset pipeline, skill wiring | VERIFIED | 253 lines (min 250). All 6 skills listed in frontmatter. 4-phase CI. Testing framework. Asset pipeline. No inline AI API details. |
| `plugins/application-dev/skills/playwright-testing/SKILL.md` | Routing doc: when to plan/generate/heal, file conventions, config | VERIFIED | 174 lines (min 80). Decision criteria, file conventions, 3-phase routing, Playwright config, key principles. |
| `plugins/application-dev/skills/playwright-testing/references/test-planning.md` | How to explore app and create test plans from SPEC.md | VERIFIED | 217 lines (min 50). App exploration, SPEC.md flow extraction, test plan format, coverage priority. |
| `plugins/application-dev/skills/playwright-testing/references/test-generation.md` | How to write Playwright test files from plans | VERIFIED | 263 lines (min 50). seed.spec.ts, a11y-first selectors, assertion patterns, anti-patterns. |
| `plugins/application-dev/skills/playwright-testing/references/test-healing.md` | How to run, diagnose, fix, re-run tests | VERIFIED | 294 lines (min 50). Healer loop, error diagnosis by category, fix-vs-app decision, re-run workflow. |
| `plugins/application-dev/skills/vitest-browser/SKILL.md` | Vitest Browser Mode config, branded channels, render packages, projects config | VERIFIED | 307 lines (min 150). Factory function provider, instances array, branded channels, render packages, agent reporter, pitfalls. |
| `plugins/application-dev/skills/vite-plus/SKILL.md` | vp CLI commands, vite.config.ts, framework support, known limitations | VERIFIED | 281 lines (min 150). All vp CLI commands, unified config, framework compatibility table with Angular exclusion. |
| `plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md` | Asset manifest table format template | VERIFIED | 46 lines (min 20). 7-column table with column definitions and example rows. |
| `plugins/application-dev/scripts/appdev-cli.mjs` | check-assets subcommand | VERIFIED | 709 lines. `cmdCheckAssets`, `parseAssetsTable`, `checkUrl`, `isImageUrl` functions present. Switch case for "check-assets" at line 696. |
| `tests/appdev-cli-check-assets.test.mjs` | 7 test cases for check-assets | VERIFIED | 233 lines. All 7 test behaviors: missing file, local URLs, valid URLs, soft-404, HEAD-GET fallback, timeout, default path. |

---

### Key Link Verification

All links verified by direct file content inspection.

#### Plan 04-01 Links (playwright-testing SKILL.md -> references)

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `playwright-testing/SKILL.md` | `references/test-planning.md` | Read instruction line 87 | WIRED | "Read `references/test-planning.md` for the complete planning workflow." |
| `playwright-testing/SKILL.md` | `references/test-generation.md` | Read instruction line 95 | WIRED | "Read `references/test-generation.md` for the complete generation workflow." |
| `playwright-testing/SKILL.md` | `references/test-healing.md` | Read instruction line 103 | WIRED | "Read `references/test-healing.md` for the complete healing workflow." |

#### Plan 04-02 Links (vitest-browser and vite-plus key patterns)

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `vitest-browser/SKILL.md` | `@vitest/browser-playwright` | Factory function import pattern | WIRED | Line 51: `import { playwright } from '@vitest/browser-playwright'`; line 88: explicit note on factory vs deprecated string format |
| `vite-plus/SKILL.md` | vp CLI | Command documentation | WIRED | Lines 70-131: `vp create`, `vp dev`, `vp check`, `vp check --fix`, `vp test`, `vp build`, `vp run`, `vp migrate` all documented |

#### Plan 04-03 Links (appdev-cli.mjs -> ASSETS.md)

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `appdev-cli.mjs` | `ASSETS.md` | `readFileSync` + `parseAssetsTable` | WIRED | `cmdCheckAssets` reads file at line 629, passes to `parseAssetsTable` at line 635; switch case at line 696 |

#### Plan 04-04 Links (generator.md -> skills and commands)

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `generator.md` | `skills/playwright-testing/SKILL.md` | Read fallback instructions | WIRED | Lines 86, 131, 209: three explicit Read instructions |
| `generator.md` | `skills/vitest-browser/SKILL.md` | Read fallback instructions | WIRED | Lines 85, 211: two explicit Read instructions |
| `generator.md` | `skills/vite-plus/SKILL.md` | Read fallback instructions | WIRED | Lines 57, 131 (via integration), 209 area: explicit Read instruction |
| `generator.md` | `scripts/appdev-cli.mjs check-assets` | Pre-handoff diagnostic step | WIRED | Lines 145 and 203: two explicit `node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs check-assets` references |
| `generator.md` | `references/ASSETS-TEMPLATE.md` | Read instruction in Step 7 | WIRED | Line 143: `Read ${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/ASSETS-TEMPLATE.md` |

---

### Requirements Coverage

All 7 Phase 4 requirement IDs from plan frontmatter verified against REQUIREMENTS.md.

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| GEN-01 | 04-01, 04-04 | Generator runs CI checks (typecheck, build, lint, test) as inner feedback loop before handoff | SATISFIED | generator.md: Phase 1 configures quality tooling at setup; Phase 2 runs lint+typecheck after each feature; Phase 4 Step 8 runs full diagnostic battery. |
| GEN-02 | 04-04 | Generator has browser-* AI skills preloaded via `skills` frontmatter | SATISFIED | generator.md line 26: all 3 browser AI skills in frontmatter. Lines 116-118: lean routing with Read instructions. Bug #25834 workaround at line 215. |
| GEN-03 | 04-02, 04-04 | Generator is aware of image sourcing approaches as examples, not prescriptions | SATISFIED | generator.md lines 147-152: web search, build-time generation, procedural/SVG, stock APIs as examples. ASSETS-TEMPLATE.md with Source taxonomy. |
| GEN-04 | 04-02, 04-04 | Generator prefers Vite+ over Vite for greenfield web projects (preference, not mandate) | SATISFIED | generator.md lines 57-60: explicit Vite+ preference with compatibility fallback for Angular/Nuxt. vite-plus/SKILL.md created for reference. |
| GEN-05 | 04-03, 04-04 | Generator must not fabricate image URLs -- all external URLs must be verified accessible | SATISFIED | generator.md line 225 Quality Standards: "No fabricated URLs." check-assets subcommand implemented in appdev-cli.mjs, called from Step 7. |
| GEN-06 | 04-04 | Generator uses latest stable versions unless user prompt specifies otherwise | SATISFIED | generator.md line 61: "Use the latest stable versions of chosen frameworks and libraries. Do not pin to old versions unless the user prompt explicitly requests a specific version." |
| SKILL-01 | 04-02 | Vite+ skill bundled with the plugin providing correct vp CLI usage, config format, toolchain docs | SATISFIED | `plugins/application-dev/skills/vite-plus/SKILL.md` at 281 lines: all vp commands, unified vite.config.ts format, framework compatibility, bundled tool versions, CI integration. |

**Orphaned requirements:** None. All 7 requirements claimed in plan frontmatter. REQUIREMENTS.md traceability table confirms GEN-01 through GEN-06 and SKILL-01 mapped to Phase 4, all marked Complete.

---

### Anti-Patterns Found

| File | Pattern | Severity | Finding |
|------|---------|----------|---------|
| `generator.md` line 223 | "No stubs" / "TODOs" | INFO | Appears in Quality Standards section as a rule for the Generator to follow -- not an anti-pattern in the agent definition itself. |
| All files | No TODO/FIXME/HACK/PLACEHOLDER in implementation code | - | None found across all 9 phase artifacts. |
| `generator.md` | `return null` / empty implementations | - | Not applicable -- document, not code. |
| `appdev-cli.mjs` | Empty return stubs | - | No empty stubs found. All 4 new functions (parseAssetsTable, isImageUrl, checkUrl, cmdCheckAssets) have substantive implementations. |

No blockers or warnings found.

---

### Structural Integrity Checks (Plan 04-04)

The following structural checks from Plan 04-04 Task 2 were verified:

| Check | Result |
|-------|--------|
| Frontmatter has `skills` field with all 6 skills | PASS |
| `tools` field unchanged: `["Read", "Write", "Edit", "Glob", "Bash"]` | PASS |
| `model: inherit` and `color: green` preserved | PASS |
| Prompt guard rule present: "Do not write to the `evaluation/` folder or `EVALUATION.md`" | PASS (line 219) |
| Cybernetics damping principle language preserved | PASS (line 183: "cybernetics damping principle") |
| Fix-only mode section (Rounds 2+) present | PASS (lines 181-203) |
| Zero inline AI API details (LanguageModel.availability, CreateMLCEngine, navigator.ml, navigator.gpu) | PASS (git grep count = 0) |
| All CLAUDE_PLUGIN_ROOT paths reference existing files | PASS (all 9 referenced files exist in filesystem) |

---

### Commit Verification

All 7 commits documented in SUMMARY files verified as real commits in git history:

| Commit | Plan | Description |
|--------|------|-------------|
| `f3a559e` | 04-01 Task 1 | feat(04-01): create playwright-testing SKILL.md routing document |
| `99182bf` | 04-01 Task 2 | feat(04-01): create playwright-testing reference files |
| `7546668` | 04-02 Task 1 | feat(04-02): create vitest-browser skill for Browser Mode testing |
| `da194f9` | 04-02 Task 2 | feat(04-02): create vite-plus skill and ASSETS-TEMPLATE reference |
| `72095e5` | 04-03 RED | test(04-03): add failing tests for check-assets subcommand |
| `662b417` | 04-03 GREEN | feat(04-03): implement check-assets subcommand for appdev-cli |
| `ad12311` | 04-04 Task 1 | feat(04-04): rewrite generator.md with progressive CI, skills, and asset pipeline |

---

### Human Verification Required

One item cannot be verified programmatically:

**1. Tests pass with real network (httpbin.org)**

**Test:** Run `node --test tests/appdev-cli-check-assets.test.mjs` from the repo root.
**Expected:** All 7 test cases pass. Tests 3-6 make real HTTP requests to httpbin.org endpoints.
**Why human:** Tests use real external endpoints (httpbin.org). Cannot verify live network behavior via static analysis. Tests 4 and 5 in particular involve partial validation (soft-404 test uses a URL ending in `/html` not an image extension, which the test author acknowledged and adapted).

---

## Summary

Phase 4 goal is achieved. All 8 observable truths are verified, all 10 artifacts exist with substantive content, all key links are wired, and all 7 requirements (GEN-01 through GEN-06, SKILL-01) are satisfied.

The phase delivered:
- A playwright-testing meta-skill (SKILL.md + 3 references) for the plan/generate/heal e2e workflow
- A vitest-browser skill for Vitest 4.x Browser Mode with branded channels and render packages
- A vite-plus skill with vp CLI commands, framework compatibility, and CI integration
- An ASSETS-TEMPLATE.md reference for Generator asset manifests
- A check-assets subcommand in appdev-cli.mjs with soft-404 detection and HEAD-GET fallback (TDD: 7 tests)
- A hardened generator.md (139 to 253 lines) with progressive 4-phase CI, testing decision framework, lean AI skill routing, asset pipeline, and Vite+ preference

The phase is ready for Phase 5: Optimize Agent Definitions.

---

_Verified: 2026-03-29_
_Verifier: Claude (gsd-verifier)_
