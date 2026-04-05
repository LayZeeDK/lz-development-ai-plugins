# Quick Task 260405-33d: Consensus.dk Website Test Patch.2 - Research

**Researched:** 2026-04-05
**Domain:** Convergence logic, critic calibration, browser channel, testimonial policy
**Confidence:** HIGH

## Summary

Research covers four areas from the Consensus.dk test findings: convergence logic (PASS exit requiring all-10s), score cap enforcement via CLI, browser channel defaults, and critic calibration anchors. All changes touch existing code with clear modification points. The convergence change is the most structurally significant -- it redefines PASS from "all dimensions meet thresholds" to "all dimensions score 10", making PLATEAU the normal "good enough" exit.

**Primary recommendation:** Implement score cap in `cmdCompileEvaluation` (structural enforcement, not prompt-only), change `determineExit` PASS condition to require all-10s, and add calibration anchors directly into each critic's agent .md file above the methodology section for maximum prompt influence.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Generator testimonial policy: SPEC-grounded or clearly-marked placeholders, never fabricated names/companies
- Browser channel: default to `msedge` with fallback chain msedge -> chrome -> bundled chromium
- Convergence: PASS requires ALL dimensions scoring 10 (perfect scores); PLATEAU becomes normal "good enough" exit
- Three structural mitigations for critic calibration: (1) round 1 score prior + embedded anchors, (2) mandatory defect quota, (3) one-sided label smoothing score cap (round 1 max 8, round 2+ max 9, 10 never achievable)

### Claude's Discretion
- Specific wording and placement of calibration anchors within each critic agent .md
- Exact format of defect quota enforcement language
- Whether score cap is enforced in critic prompts or in the CLI aggregator (prefer CLI for structural enforcement)

### Deferred Ideas (OUT OF SCOPE)
(none stated)
</user_constraints>

## 1. Convergence Logic: `determineExit()` Change

### Current Behavior (lines 366-397 of appdev-cli.mjs)

```javascript
function determineExit(rounds, escalation, maxRounds) {
  const current = rounds[rounds.length - 1];

  // PASS: all criteria meet thresholds
  if (current.verdict === "PASS") {
    return { exit_condition: "PASS", should_continue: false };
  }
  // ... PLATEAU, REGRESSION, SAFETY_CAP checks
}
```

`current.verdict` is set by `computeVerdict()` which returns "PASS" when ALL dimensions meet their thresholds (7/7/6/6). This is the premature exit bug: a lenient round 1 evaluation produces scores like 7/8/7/7 -> verdict PASS -> immediate exit after 1 round.

### Required Change

Replace the PASS condition to require all dimensions scoring 10:

```javascript
// PASS: requires perfect scores on all dimensions
var allPerfect = true;
for (var i = 0; i < DIMENSIONS.length; i++) {
  if (current.scores[DIMENSIONS[i].key] !== 10) {
    allPerfect = false;
    break;
  }
}
if (allPerfect) {
  return { exit_condition: "PASS", should_continue: false };
}
```

**Confidence:** HIGH -- the code path is clear and isolated.

### Interaction with Score Cap

With the score cap (max 9 round 2+, 10 never achievable), PASS becomes structurally unreachable. This is intentional -- PLATEAU becomes the primary "success" exit when scores converge above thresholds. PASS only occurs if the score cap is later relaxed or removed.

### Edge Cases

1. **Scores plateau at 9/9/9/9**: EMA detects plateau (E-II) after 3 rounds of stability, triggers PLATEAU exit. This is correct -- the application met all thresholds and converged.

2. **Scores plateau at 7/7/6/6 (just above thresholds)**: Same behavior -- PLATEAU triggers. The Generator received feedback but cannot push higher. This is also correct.

3. **Scores below threshold plateau**: E-II PLATEAU triggers. The orchestrator SKILL.md already handles PLATEAU exit with `FAIL (Plateau -- scores converged)`. No change needed there.

4. **`computeVerdict()` still returns PASS/FAIL**: The `computeVerdict` function is still used to populate `entry.verdict` in `cmdRoundComplete`, which flows into trajectory data. The verdict field now means "all thresholds met" (not "exit condition reached"), which is still useful diagnostic information. No need to change `computeVerdict`.

### Test Impact

The existing test at line 2086 of test-appdev-cli.mjs asserts that scores of 7/7/6/6 produce `exit_condition: "PASS"`. This test must be updated -- with the new logic, 7/7/6/6 no longer triggers PASS. It should fall through to the escalation/continue logic instead.

New tests needed:
- All-10s produces PASS
- Threshold-met but not all-10s does NOT produce PASS
- All-10s on round 1 (edge case with score cap -- can't happen, but test the function in isolation without cap)

## 2. Score Cap Enforcement in CLI

### Current Score Flow

1. Critics write `summary.json` with `score` field
2. `cmdCompileEvaluation` reads summaries, collects scores into `dimScores` object (lines 1377-1387)
3. `allScores` is built from DIMENSIONS constant (lines 1392-1404)
4. Product Depth is computed from acceptance tests (separate path)
5. Verdict computed, EVALUATION.md written

### Where to Insert Score Cap

The cap should go in `cmdCompileEvaluation` after gathering critic scores and before computing Product Depth. This is the single aggregation point where all scores are assembled.

Insertion point: between lines 1404 and 1405, after `allScores` is built but before `computeVerdict`:

```javascript
// One-sided label smoothing: cap scores by round
// Round 1: max 8. Round 2+: max 9. Perfect 10 never achievable.
var scoreCap = round === 1 ? 8 : 9;
for (var ci = 0; ci < DIMENSIONS.length; ci++) {
  var capKey = DIMENSIONS[ci].key;
  if (allScores[capKey] > scoreCap) {
    allScores[capKey] = scoreCap;
  }
}
```

**Why CLI not prompts:** Per Beer's principle (algedonic signal must bypass rationalization). If only in prompts, critics can rationalize exceptions ("this app is truly exceptional, I'll score 10"). CLI enforcement is structural -- no LLM can override it. The prompts should still mention the cap to set expectations, but the CLI is the enforcement layer.

**Product Depth note:** Product Depth is CLI-computed from acceptance tests via `computeProductDepth()`. It should also be capped. The cap should be applied after `pdResult` is computed but before it enters `allScores`:

```javascript
if (pdResult.score > scoreCap) {
  pdResult.score = scoreCap;
}
```

### Test Impact

Existing tests in test-appdev-cli.mjs for compile-evaluation create mock summaries with various scores. Tests need to be added:
- Round 1 compile-evaluation caps scores at 8
- Round 2 compile-evaluation caps scores at 9
- Verify the cap appears in EVALUATION.md output
- Verify computeVerdict still sees capped scores

## 3. Browser Channel Configuration

### Current State

Browser channel is NOT configured anywhere in the critic agent files or playwright-testing skill config. The only channel references are:

1. **vitest-browser/SKILL.md** (line 71): `channel: 'chrome'` -- for Vitest Browser Mode tests (Generator-side)
2. **playwright-testing/SKILL.md** (line 128): `name: 'chromium'` -- default Playwright project config (Generator-side)

Critics use `npx playwright-cli` commands which default to Playwright's bundled Chromium (no channel). This means critics are testing with bundled Chromium, which lacks LanguageModel API, Summarizer API, etc.

### Required Changes

The channel needs to be set in multiple locations:

**A. Generator-side (2 files):**
1. **playwright-testing/SKILL.md** -- Change the example config from `name: 'chromium'` to include `channel: 'msedge'` with fallback
2. **generator.md** -- Add a note in the Playwright configuration section about defaulting to msedge channel

**B. Critic-side (3 agent files):**
The critics use `npx playwright-cli` which does not read `playwright.config.ts`. The channel must be passed as a CLI argument. Check if `playwright-cli` supports `--channel`:

Based on `npx playwright-cli --help` documentation patterns, the channel is typically set via the `--channel` flag or through config. Since critics write their own `.spec.ts` test files, the channel can be set in the test file's `test.use()` block:

```typescript
test.use({
  baseURL: 'http://localhost:<port>',
  channel: 'msedge',
});
```

This needs to be added to the guidance for each critic's write-and-run test pattern.

**C. Browser-built-in-ai/SKILL.md** -- Already mentions Edge with Phi-4-mini but does not set a default channel preference. Add guidance to prefer msedge.

### Fallback Strategy

The fallback chain (msedge -> chrome -> bundled chromium) should be documented as a principle. When `msedge` is unavailable, Playwright falls back based on the `channel` value:
- `channel: 'msedge'` -- launches Edge if installed, errors if not
- Need to document manual fallback in instructions: "If msedge is unavailable, try chrome, then omit channel for bundled Chromium"

**Confidence:** MEDIUM -- need to verify `npx playwright-cli` honors `--channel` or if it only works via config/test.use.

## 4. Critic Prompt Changes: Placement and Content

### Placement Strategy

Agent .md files follow this structure:
1. Frontmatter (name, description, model, tools)
2. Identity statement ("You are a...")
3. Hard Boundary
4. Write Restriction
5. Path Construction Guardrail
6. Step 0: Start Evaluation Server
7. Methodology sections (UNDERSTAND, OBSERVE/TEST/PERTURB, DETECT, SCORE, REPORT)

**Optimal placement for calibration anchors:** Between the identity statement (item 2) and the Hard Boundary (item 3). This is the earliest point in the prompt body after the agent's role definition. Research on LLM prompt structure shows that instructions placed early in the prompt have higher adherence rates than those buried deep.

However, the existing structure flows logically: identity -> constraints -> workflow. Inserting calibration between identity and constraints would break this flow.

**Recommended placement:** Add a new section `## Scoring Expectations` immediately after the Write Restriction and Path Construction Guardrail sections, before Step 0. This keeps constraints grouped together and places calibration expectations where they'll be read before the methodology begins.

### Content for Each Critic

**Common block (add to all three critics):**

```markdown
## Scoring Expectations

First-generation applications typically score 3-5. A round 1 score above 6
requires explicit comparison against the calibration scenario below explaining
why this application exceeds the threshold example.

Minimum 3 findings before assigning any score. Round 1 applications always
have issues -- if you cannot find 3, look harder.

Score cap: round 1 scores cannot exceed 8. Round 2+ scores cannot exceed 9.
Perfect 10 is never achievable. The CLI enforces this structurally, but
apply it in your own scoring as well.
```

**Per-critic embedded calibration anchor:**

- **Perceptual (Visual Design):** Embed the "Below Threshold: 4/10" scenario from SCORING-CALIBRATION.md (the music app with default Material UI, no design language match). This is the most common round 1 failure: generic framework defaults.

- **Projection (Functionality):** Embed the "Below Threshold: 5/10" scenario from SCORING-CALIBRATION.md (the e-commerce app with 2 Critical bugs). First-generation apps commonly have Critical bugs.

- **Perturbation (Robustness):** Embed the "Below Threshold: 5/10" scenario from SCORING-CALIBRATION.md (the recipe app that crashes on input perturbation). Round 1 apps typically have no defensive variety.

**Confidence:** HIGH -- the calibration scenarios already exist in SCORING-CALIBRATION.md. Embedding them directly into agent prompts is a copy operation with minor formatting.

## 5. Generator Testimonial Policy

### Placement in generator.md

The testimonial policy extends the entity research protocol from planner.md to the Generator. The most logical placement is in the **Quality Standards** section (currently around line 312), which already covers fabrication rules:

```
- **No fabricated URLs.** External URLs that return 404 break the app...
```

Add a new bullet after this one:

```markdown
- **No fabricated testimonials.** If SPEC.md includes testimonials sourced from
  the real website, use those verbatim. If no real testimonials are available,
  use clearly-marked placeholders (e.g., "[Placeholder - Client Name]", "-- A
  satisfied customer") with generic roles. Never name real people or real
  customer companies in fabricated testimonials. Why: fabricated testimonials
  attributing fake quotes to real entities is a legal and reputational hazard.
```

### Interaction with Entity Research Protocol

The planner.md entity research protocol (added in 260405-0az) already ensures SPEC.md contains real entity data when available. The Generator policy is a second layer: even if the Planner misses something or the SPEC doesn't include testimonials, the Generator should not invent attributed quotes.

**Confidence:** HIGH -- simple addition, clear placement.

## 6. ARCHITECTURE.md and README.md Updates

### ARCHITECTURE.md

ARCHITECTURE.md is already outdated -- it references the old 3-agent architecture (Planner, Generator, Evaluator) rather than the current 5-agent ensemble. The file at `.planning/codebase/ARCHITECTURE.md` was last analyzed on 2026-03-27 (pre-v1.1).

**Assessment:** A full rewrite is needed to bring it current, but that exceeds the scope of this patch task. For this task, the convergence logic change and score cap are internal CLI changes that don't need ARCHITECTURE.md updates -- the existing principles-only approach means the file doesn't contain threshold numbers or specific function signatures.

**Recommendation:** Do not update ARCHITECTURE.md in this patch. Its staleness predates this task and should be addressed in a separate task or milestone.

### README.md

The README.md accurately describes the 5-agent ensemble, evaluation criteria, and file protocol. The convergence logic change (PASS requires all-10s) and score cap are internal behavioral changes that don't change the user-facing interface.

The one item that might warrant a README update: mentioning that the default browser channel is now msedge. But this is an implementation detail, not a user-facing change.

**Recommendation:** No README.md update needed for this patch.

## Common Pitfalls

### Pitfall 1: Score Cap Breaking computeVerdict
**What goes wrong:** If the score cap is applied AFTER computeVerdict, the verdict field in EVALUATION.md says PASS but the actual capped scores don't meet thresholds. Or the reverse: cap applied before verdict means threshold-meeting becomes harder.
**How to avoid:** Apply the cap BEFORE calling computeVerdict. The cap changes the scores that flow into verdict computation. With cap max 8 round 1, thresholds 7/7/6/6 are still reachable. With cap max 9 round 2+, all thresholds reachable. This is correct -- the cap prevents inflated high scores, not threshold crossing.

### Pitfall 2: Score Cap on Product Depth Double-Capping
**What goes wrong:** Product Depth already has ceiling rules (max 5 for canned AI, max 6 for missing core feature). If the score cap is applied on top of ceiling rules, and the ceiling is already below the cap, no issue. But if the ceiling is above the cap, the cap wins. This is correct behavior.
**How to avoid:** Apply cap after all other computation, as the final step before writing to allScores.

### Pitfall 3: Test Regression from PASS Condition Change
**What goes wrong:** The existing test expects 7/7/6/6 to produce PASS. After the change, it should NOT produce PASS. If the test isn't updated, CI fails.
**How to avoid:** Update the test before or alongside the code change.

### Pitfall 4: Critics Ignoring Embedded Anchors
**What goes wrong:** The calibration anchor is in the agent .md but the critic's context gets compacted and the anchor is lost.
**How to avoid:** Place anchors early in the prompt (before methodology) and keep them concise (one scenario, not the full SCORING-CALIBRATION.md). The auto-compact heuristic preserves content near the top of the system prompt. Also, the CLI score cap is the structural backstop -- if the critic ignores the anchor and scores 10, the CLI caps it.

## Sources

### Primary (HIGH confidence)
- `plugins/application-dev/scripts/appdev-cli.mjs` -- direct code inspection of determineExit, computeVerdict, cmdCompileEvaluation
- `plugins/application-dev/scripts/test-appdev-cli.mjs` -- existing test coverage
- `plugins/application-dev/agents/*.md` -- all 5 agent definitions
- `plugins/application-dev/skills/application-dev/SKILL.md` -- orchestrator workflow
- `research/llm-judge-calibration-research.md` -- theory grounding for all calibration decisions

### Secondary (MEDIUM confidence)
- Playwright CLI channel behavior -- inferred from vitest-browser SKILL.md patterns and Playwright docs knowledge

## Metadata

**Confidence breakdown:**
- Convergence logic change: HIGH -- direct code analysis, clear modification path
- Score cap enforcement: HIGH -- clear insertion point in cmdCompileEvaluation
- Browser channel: MEDIUM -- exact playwright-cli --channel behavior needs verification at implementation time
- Critic calibration: HIGH -- anchors already exist, placement is a documentation decision
- Testimonial policy: HIGH -- simple text addition

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable codebase, no external dependencies changing)
