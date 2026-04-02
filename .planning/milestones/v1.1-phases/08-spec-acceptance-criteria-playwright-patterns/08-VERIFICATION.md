---
phase: 08-spec-acceptance-criteria-playwright-patterns
verified: 2026-04-01T14:30:00Z
status: passed
score: 16/16 must-haves verified
re_verification: false
---

# Phase 8: SPEC Acceptance Criteria + Playwright Patterns Verification Report

**Phase Goal:** SPEC.md gains behavioral acceptance criteria per feature. The projection-critic generates acceptance tests from these criteria using playwright-testing skill patterns. Both critics use token-efficient eval-first Playwright patterns documented in a dedicated reference.

**Verified:** 2026-04-01
**Status:** PASSED
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SPEC-TEMPLATE.md has `**Acceptance Criteria:**` per feature with >= 3 criteria for Core features -- behavioral and testable, not prescriptive of implementation | VERIFIED | `SPEC-TEMPLATE.md` line 65: `**Acceptance Criteria:**` section exists between User Stories and Data Model. Comment block contains 3 good + 3 bad inline examples. 3 placeholder bullets with observable-outcome wording. acceptance-criteria-guide.md enforces tier minimums (Core >= 3, Important >= 2, Nice-to-have >= 1) at lines 35-43. |
| 2 | Generator writes its own dev tests (tests/) using playwright-testing Plan->Generate->Heal; projection-critic writes separate acceptance tests (evaluation/round-N/) using the same skill patterns -- independent test suites with independent purposes | VERIFIED | `generator.md` line 215 has explicit `**Dev test boundary:**` statement naming both paths and explaining the WHY (white-box vs black-box). `projection-critic.md` lines 153-156 has the mirror "Acceptance Test Independence" section. Both sides of the boundary are stated. |
| 3 | PLAYWRIGHT-EVALUATION.md reference exists teaching eval-first, write-and-run, snapshot-as-fallback patterns -- both critics reference it | VERIFIED | File exists at `plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md` (174 lines). All 7 sections present. `perceptual-critic.md` line 41 and `projection-critic.md` line 41 both have Read instructions pointing to this file. |
| 4 | Projection-critic's write-and-run: reads SPEC criteria, takes 1 snapshot, writes acceptance-tests.spec.ts, runs `npx playwright test --reporter=json`, reads JSON results -- ~5 tool calls replace ~30+ interactive calls | VERIFIED | `projection-critic.md` lines 43-51 documents the exact 5-step write-and-run workflow. PLAYWRIGHT-EVALUATION.md write-and-run section (lines 23-78) has the 5-step workflow plus a skeleton acceptance test file with criteria-to-test 1:1 mapping. |
| 5 | Both critics write structured summary.json and use `console error` (filtered). Raw observation data exists on disk but not in agent context after observation steps (hard GC on agent completion) | VERIFIED | `perceptual-critic.md` line 54: `npx playwright-cli console error` (filtered). `projection-critic.md` line 61: `npx playwright-cli console error` (filtered). Both critics write summary.json schemas documented in their REPORT sections. Token Efficiency sections in both agents confirm structured results only in context. |

**Score:** 5/5 ROADMAP success criteria verified

---

### Plan-Level Must-Haves

#### Plan 01 Must-Haves (SPEC-01..05)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SPEC-TEMPLATE.md has Acceptance Criteria section per feature with inline good/bad examples | VERIFIED | Lines 65-85 of SPEC-TEMPLATE.md. Comment block has 3 good + 3 bad examples with rationale (WHY-based, no ALL-CAPS). |
| 2 | Core features >= 3 criteria (happy path + edge case + error state), Important >= 2, Nice-to-have >= 1 | VERIFIED | acceptance-criteria-guide.md lines 35-43 specifies tier rules exactly as required. Planner self-verification item 8 enforces the same counts. |
| 3 | acceptance-criteria-guide.md exists (~50 lines) teaching testable behavioral criteria without mentioning projection-critic or Playwright | VERIFIED | File is 70 lines (slightly over target -- documented deviation in SUMMARY). Zero occurrences of "projection-critic", "Playwright", "write-and-run", or "ensemble" confirmed via git grep (exit code 1 = no matches). |
| 4 | Planner reads the criteria guide after writing features, before adding criteria | VERIFIED | `planner.md` lines 67-71: "Writing Acceptance Criteria" section placed between "Guidelines for Feature Design" and "Guidelines for Visual Design". Read instruction on line 71. |
| 5 | Planner self-verification has 2 new checklist items for criteria presence and quality | VERIFIED | `planner.md` lines 105-106: items 7 ("Acceptance criteria per feature") and 8 ("Criteria quality and count") added. Checklist now has 8 items (6 + 2). |

#### Plan 02 Must-Haves (TOKEN-01, PLAYWRIGHT-03..06)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PLAYWRIGHT-EVALUATION.md has 7 technique sections: eval-first, write-and-run, snapshot-as-fallback, resize+eval, console filtering, test healing, round 2+ test reuse | VERIFIED | All 7 section headings confirmed at lines 8, 23, 80, 94, 110, 125, 146. |
| 2 | Each section has pattern description with WHY plus 2-3 concrete playwright-cli command examples | VERIFIED | Each section opens with rationale paragraph. Commands use `npx playwright-cli` prefix consistently. No ALL-CAPS emphasis found. |
| 3 | write-and-run section shows the 5-step workflow plus a skeleton acceptance test file | VERIFIED | Lines 29-78: "5-step workflow" header, numbered steps 1-5, then a complete skeleton TypeScript test file with criteria-to-test comments (1:1 mapping). |
| 4 | round 2+ test reuse section documents the reuse/heal/regenerate decision tree | VERIFIED | Lines 146-175: decision tree with clear mechanical thresholds (reuse: all pass or assertion-only; heal: 1-2 selector timeouts; regenerate: multiple timeouts or >50%). |
| 5 | Reference is technique-pure -- no "Used by" annotations, no critic-specific instructions | VERIFIED | git grep for "Used by" returns no matches (exit code 1). File describes HOW not WHO. |

#### Plan 03 Must-Haves (PLAYWRIGHT-01..02, TOKEN-02..05)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Perceptual-critic has a Read instruction pointing to PLAYWRIGHT-EVALUATION.md eval-first + resize+eval + console filtering sections | VERIFIED | `perceptual-critic.md` lines 39-41: instruction names all three sections explicitly before the Read. |
| 2 | Projection-critic has a Read instruction pointing to PLAYWRIGHT-EVALUATION.md write-and-run + snapshot-as-fallback + console filtering + test healing + round 2+ reuse sections | VERIFIED | `projection-critic.md` lines 39-41: instruction names all five sections before the Read. |
| 3 | Both critics use console error (filtered) not console (all messages) | VERIFIED | `perceptual-critic.md` line 54: `npx playwright-cli console error`. `projection-critic.md` line 61: `npx playwright-cli console error`. Both include reasoning in parenthetical. |
| 4 | Generator explicitly states dev tests in tests/ are independent from acceptance tests | VERIFIED | `generator.md` line 215: `**Dev test boundary:**` paragraph naming both paths, stating independence, and giving WHY-based rationale. |
| 5 | Projection-critic round 2+ logic: copy prior tests, run, decide reuse/heal/regenerate | VERIFIED | `projection-critic.md` lines 63-76: "Round 2+ Test Reuse" subsection with copy step, run step, and reuse/heal/regenerate decision tree with thresholds matching PLAYWRIGHT-EVALUATION.md. |
| 6 | Planner contains no mention of projection-critic or Playwright | VERIFIED | git grep for "projection-critic", "Playwright", "write-and-run", "ensemble" in planner.md returns no matches (exit code 1). |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md` | Acceptance Criteria section per feature with comment block examples | VERIFIED | Exists. `**Acceptance Criteria:**` section at line 65. Comment block with 3 good + 3 bad examples. 3 placeholder bullets. 108 lines total. |
| `plugins/application-dev/skills/application-dev/references/acceptance-criteria-guide.md` | ~50 lines, 5 sections, consumer-agnostic | VERIFIED | Exists. 70 lines (deviation documented). 5 sections present. No evaluation internals mentioned. Substantive content with paired good/bad examples. |
| `plugins/application-dev/agents/planner.md` | Read instruction for criteria guide + 2 new self-verification items | VERIFIED | Exists. Read instruction at line 71. Items 7 and 8 at lines 105-106. Consumer-agnostic -- no evaluation internals. |
| `plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md` | 7 technique sections, >=100 lines | VERIFIED | Exists. 174 lines. All 7 section headings confirmed. Technique-pure. |
| `plugins/application-dev/agents/perceptual-critic.md` | Read instruction for PLAYWRIGHT-EVALUATION.md + console error | VERIFIED | Exists. 114 lines (cap 130). Read instruction at line 41. Explicit `console error` command at line 54. |
| `plugins/application-dev/agents/projection-critic.md` | Read instruction for PLAYWRIGHT-EVALUATION.md + round 2+ subsection + console error | VERIFIED | Exists. 168 lines (cap 175). Read instruction at line 41. Round 2+ subsection at line 63. Explicit `console error` at line 61. |
| `plugins/application-dev/agents/generator.md` | Dev test boundary statement | VERIFIED | Exists. 255 lines. `**Dev test boundary:**` paragraph at line 215 with WHY-based rationale. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `planner.md` | `acceptance-criteria-guide.md` | Read instruction in "Writing Acceptance Criteria" section | WIRED | Line 71: `Read ${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/acceptance-criteria-guide.md` |
| `planner.md` | `SPEC-TEMPLATE.md` | "Output Format" section instructs planner to read and follow template | WIRED | Line 53: `Read the SPEC template at ${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/SPEC-TEMPLATE.md` |
| `perceptual-critic.md` | `PLAYWRIGHT-EVALUATION.md` | Read instruction in OBSERVE step specifying eval-first, resize+eval, console filtering | WIRED | Lines 39-41: instruction names sections + Read path. Pattern "Read.*PLAYWRIGHT-EVALUATION" matches. |
| `projection-critic.md` | `PLAYWRIGHT-EVALUATION.md` | Read instruction in TEST step specifying write-and-run, snapshot-as-fallback, console filtering, test healing, round 2+ | WIRED | Lines 39-41: instruction names sections + Read path. Pattern "Read.*PLAYWRIGHT-EVALUATION" matches. |
| `projection-critic.md` | SPEC.md acceptance criteria | write-and-run step 1 reads SPEC.md criteria; UNDERSTAND step extracts criteria | WIRED | Line 35: "Extract every feature, its acceptance criteria...". Line 45: "Read SPEC.md acceptance criteria (already done in UNDERSTAND)". |
| `generator.md` | `tests/` boundary (vs `evaluation/round-N/`) | Dev test boundary statement in Testing Skills section | WIRED | Line 215: explicit statement naming both paths and separation rationale. |

---

### Requirements Coverage

All requirement IDs claimed across plans cross-referenced against REQUIREMENTS.md:

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SPEC-01 | 08-01 | SPEC-TEMPLATE.md includes `**Acceptance Criteria:**` per feature | SATISFIED | `SPEC-TEMPLATE.md` line 65 |
| SPEC-02 | 08-01 | Core >= 3, Important >= 2, Nice-to-have >= 1 criteria | SATISFIED | `acceptance-criteria-guide.md` lines 35-43; `planner.md` item 8 |
| SPEC-03 | 08-01 | Criteria use measurable thresholds, no vague qualities | SATISFIED | `acceptance-criteria-guide.md` "Good vs bad examples" section; planner item 8 prohibits vague qualities |
| SPEC-04 | 08-01 | Planner agent updated with compact reference on writing testable criteria | SATISFIED | `acceptance-criteria-guide.md` exists (70 lines); `planner.md` has Read instruction and "Writing Acceptance Criteria" section |
| SPEC-05 | 08-01 | Planner self-verification checks criteria presence and quality | SATISFIED | `planner.md` items 7 and 8 at lines 105-106 |
| PLAYWRIGHT-01 | 08-03 | Generator writes dev tests in `tests/` as internal CI | SATISFIED | `generator.md` line 215 dev test boundary statement |
| PLAYWRIGHT-02 | 08-03 | Projection-critic writes SEPARATE acceptance tests from SPEC.md criteria | SATISFIED | `projection-critic.md` "Acceptance Test Independence" section + write-and-run methodology |
| PLAYWRIGHT-03 | 08-02 | Acceptance test generation: snapshot for selector discovery + SPEC.md criteria + accessibility-tree-first selectors | SATISFIED | `PLAYWRIGHT-EVALUATION.md` write-and-run section with skeleton test using getByRole, getByLabel, getByText, getByPlaceholder |
| PLAYWRIGHT-04 | 08-02 | `npx playwright test --reporter=json` -- browser interaction outside agent context | SATISFIED | `PLAYWRIGHT-EVALUATION.md` write-and-run step 4; `projection-critic.md` step 4 |
| PLAYWRIGHT-05 | 08-02 | Acceptance test healing: Playwright Heal pattern for selector failures | SATISFIED | `PLAYWRIGHT-EVALUATION.md` "test healing" section with selector vs assertion failure distinction |
| PLAYWRIGHT-06 | 08-02 | Rounds 2+: existing acceptance tests re-run first; regenerated only if structure changed | SATISFIED | `PLAYWRIGHT-EVALUATION.md` "round 2+ test reuse" section; `projection-critic.md` "Round 2+ Test Reuse" subsection with decision thresholds |
| TOKEN-01 | 08-02 | Dedicated PLAYWRIGHT-EVALUATION.md reference -- eval-first, write-and-run, snapshot-as-fallback | SATISFIED | File exists at 174 lines with all three techniques in dedicated sections |
| TOKEN-02 | 08-03 | Perceptual-critic uses eval for page state, resize+eval for responsive, screenshots only at key viewpoints | SATISFIED | `perceptual-critic.md` Read instruction + OBSERVE step content; PLAYWRIGHT-EVALUATION.md eval-first + resize+eval sections |
| TOKEN-03 | 08-03 | Projection-critic uses write-and-run -- 5 tool calls replace 30+ interactive | SATISFIED | `projection-critic.md` TEST step + Round 2+ subsection; PLAYWRIGHT-EVALUATION.md write-and-run 5-step workflow |
| TOKEN-04 | 08-03 | Both critics use `console error` (filtered) | SATISFIED | `perceptual-critic.md` line 54; `projection-critic.md` line 61 -- both explicit `npx playwright-cli console error` |
| TOKEN-05 | 08-03 | Structured summary.json written to files; raw data discarded on agent completion | SATISFIED | Both critics have REPORT sections with summary.json schemas; Token Efficiency sections confirm context holds summaries only |

**All 16 requirements (SPEC-01..05, PLAYWRIGHT-01..06, TOKEN-01..05) SATISFIED.**

No orphaned requirements: REQUIREMENTS.md traceability table maps these exact IDs to Phase 8, and all are claimed and implemented.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `generator.md` line 175 | "placeholder patterns" | Info | This is the Generator's instruction to detect placeholder patterns in screenshots -- not a stub in the deliverable. Non-issue. |
| `perceptual-critic.md` line 62 | "placeholder images" | Info | This is the critic's instruction to check for placeholder images in evaluated apps. Non-issue. |

No stubs, empty implementations, TODO/FIXME comments, or structural anti-patterns found in any Phase 8 deliverables.

---

### Human Verification Required

None. All phase 8 deliverables are agent definition files and reference documents -- their content is fully verifiable by static inspection. No UI behavior, real-time execution, or external service integration is involved.

---

### Gaps Summary

None. All 16 requirements satisfied. All 7 artifacts verified at all three levels (exists, substantive, wired). All 6 key links confirmed. No anti-patterns blocking goal achievement.

Phase goal is achieved:
- SPEC.md gains behavioral acceptance criteria per feature (SPEC-TEMPLATE.md + acceptance-criteria-guide.md + planner.md updates)
- PLAYWRIGHT-EVALUATION.md shared reference created with 7 token-efficient technique sections
- Both critics wired to the new reference with section-specific Read instructions
- Generator test boundary clarified explicitly from the Generator's perspective
- Projection-critic has embedded round 2+ test reuse decision tree

---

_Verified: 2026-04-01T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
