# Pitfalls Research: v1.2 Feature Integration

**Domain:** GAN-inspired multi-agent application development harness -- v1.2 feature additions
**Researched:** 2026-04-02
**Confidence:** HIGH (pitfalls derived from reading actual v1.1 code paths and integration points)

This document covers pitfalls specific to the v1.2 feature integration. The v1.0 pitfalls
(Evaluator leniency, role collapse, mode collapse, etc.) and v1.1 pitfalls (regex contract
breakage, behavioral regression from info barrier, impossible convergence, etc.) remain
valid. This document focuses on NEW pitfalls introduced by v1.2's specific changes.

---

## Critical Pitfalls

### Pitfall 1: Hardcoded Magic Numbers in Convergence Logic Becoming Wrong with 4 Dimensions

**What goes wrong:**
The current `computeEscalation()` function (appdev-cli.mjs lines 257-306) uses two
hardcoded magic numbers calibrated for 3 dimensions (max total 30):

1. `current.scores.total <= 5` (E-IV Catastrophic crisis threshold) -- this is 16.7% of
   max total with 3 dimensions. With 4 dimensions (max total 40), the same absolute
   threshold becomes 12.5% -- making it harder to trigger E-IV. An app scoring 2/10 on
   every dimension (total 8) would NOT trigger E-IV despite being catastrophically bad.

2. `windowDelta <= 1` (E-II Plateau threshold) -- with 3 dimensions and max total 30, a
   1-point improvement over 3 rounds is genuinely stagnant. With 4 dimensions and max
   total 40, a 1-point improvement is an even stronger signal of stagnation. But if a
   future version adds a 5th dimension (max 50), the threshold becomes too sensitive
   relative to the scoring range.

3. `delta > 1` (E-0 Progressing threshold) -- same absolute-vs-relative problem.

**Why it happens:**
These thresholds were written for a 3-dimension system and never parameterized against
the DIMENSIONS constant. The DIMENSIONS constant governs score extraction and verdict
computation via loops, but escalation logic uses raw numbers.

**Consequences:**
- With 4 dimensions: E-IV becomes under-sensitive (fails to catch catastrophic scores)
- With 4 dimensions: E-II becomes slightly over-sensitive (relative to scoring range)
- False escalation levels lead to wrong exit conditions (premature PLATEAU or missed
  REGRESSION), causing the workflow to exit too early or too late

**Prevention:**
Derive ALL escalation thresholds from `DIMENSIONS.length * 10`:
```javascript
const maxTotal = DIMENSIONS.length * 10;
const crisisThreshold = Math.ceil(maxTotal * 0.2);   // E-IV: ~20% of max
const plateauThreshold = Math.ceil(maxTotal * 0.05);  // E-II: ~5% of max
```

Test with both 3-dimension and 4-dimension configurations to verify behavior is
consistent relative to the scoring range.

**Detection:**
- Apps with universally low scores (2-3/10 per dimension) not triggering E-IV Catastrophic
- Apps with 1-2 points improvement per round triggering E-II Plateau when they should
  be E-0 Progressing
- Exit conditions that feel wrong for the actual score trajectory

**Phase to address:** Phase 2 (Convergence Logic Hardening). Must be done after Phase 1
(DIMENSIONS constant stable with 4 entries).

---

### Pitfall 2: perturbation-critic Overlapping with Existing Critics' Scope

**What goes wrong:**
The perturbation-critic tests adversarial scenarios (viewport extremes, invalid inputs,
error states). But the existing critics already touch some of these:

- **perceptual-critic** already tests responsive behavior via viewport resizing
  (320px and 1280px in its methodology)
- **projection-critic** already tests error states via acceptance test negative cases
  ("one negative test per feature")
- **projection-critic** already tests form validation (invalid input testing)

If the perturbation-critic duplicates these tests, the same finding appears in two
critics' summaries with different IDs. The compile-evaluation merges findings from all
critics by severity, so duplicate findings appear twice in the Priority Fixes table.
The Generator sees the same issue listed twice and either: (a) wastes effort fixing it
twice, or (b) becomes confused about whether these are different issues.

**Why it happens:**
The three critics have overlapping observational surfaces (they all use playwright-cli
on the same running application). Clear boundaries on paper become blurry in practice.

**Consequences:**
- Duplicate findings inflate the Priority Fixes count, making the evaluation look worse
  than it is
- Generator in fix-only mode may misinterpret duplicates as two distinct issues
- Score impacts compound unfairly (same issue lowers both Functionality and Robustness)

**Prevention:**
Define clear METHODOLOGY boundaries (not just dimension boundaries):

| Testing Activity | Critic | Rationale |
|------------------|--------|-----------|
| Responsive LAYOUT at 320px, 768px, 1280px | Perceptual | Design identity preservation |
| Viewport EXTREMES (160px, 4K, rapid resize) | Perturbation | Stress testing beyond normal use |
| Feature FUNCTIONALITY (does the form submit?) | Projection | Feature correctness |
| Invalid INPUT HANDLING (empty, XSS-like, extreme length) | Perturbation | Adversarial resilience |
| Error STATE DISPLAY (does error show nicely?) | Perceptual | Visual design of error states |
| Navigation CORRECTNESS (A->B links work) | Projection | Feature correctness |
| Navigation STRESS (rapid back/forward/reload) | Perturbation | Recovery resilience |
| Console ERRORS from normal use | Projection | Functional bugs |
| Console ERRORS under stress | Perturbation | Stress-induced failures |

The perturbation-critic's instructions should explicitly state: "Do NOT test normal
responsive layout (that is the perceptual-critic's domain). Test EXTREME viewports
and rapid resize sequences. Do NOT test feature correctness under normal conditions
(that is the projection-critic's domain). Test feature RESILIENCE under adversarial
conditions."

**Detection:**
- Same finding appearing in two critics' summaries with similar descriptions
- Generator fix-only mode addressing the "same" issue twice
- Priority Fixes table with near-duplicate entries from different critics

**Phase to address:** Phase 1 (perturbation-critic agent definition). Clear methodology
boundaries must be specified in the agent instructions.

---

### Pitfall 3: resume-check spawn-both-critics Rename Breaking Crash Recovery

**What goes wrong:**
The current resume-check returns `"spawn-both-critics"` when all expected critics need
re-spawning (line 775 of appdev-cli.mjs). The orchestrator (SKILL.md) dispatches on
this exact string to determine which recovery action to take. Changing it to
`"spawn-all-critics"` is a cross-file contract change:

1. appdev-cli.mjs resume-check output
2. SKILL.md Step 0 dispatch table

If only one is updated, crash recovery fails: the orchestrator receives an action string
it does not recognize and falls through to an error state, losing the user's work.

**Why it happens:**
The action string is a stringly-typed contract between the CLI and the orchestrator.
There is no type checking, no enum validation -- it is a string match in markdown
instructions that an LLM follows.

**Consequences:**
- User's workflow crashes, they resume, and the orchestrator does not know how to
  proceed
- All prior work (spec, generated code, previous rounds) is potentially lost
- The user must manually intervene to restart the evaluation

**Prevention:**
1. Update BOTH files in the same commit
2. Add a test to test-appdev-cli.mjs that verifies resume-check returns
   `"spawn-all-critics"` when all 3 critics are missing (currently tests verify
   `"spawn-both-critics"` for 2 critics)
3. Consider making the action string computation generic: when all critics are invalid,
   return `"spawn-all-critics"` regardless of the count. When one specific critic is
   invalid, return `"spawn-{name}-critic"`. This is already how the single-critic case
   works (line 781).
4. Search SKILL.md for ALL occurrences of "spawn-both-critics" and update each one

**Detection:**
- Resume-check returns an action string that the orchestrator does not handle
- User sees "Resume from [current step]" but the orchestrator does not progress
- State file shows evaluate step but no critics are spawned on resume

**Phase to address:** Phase 3 (Orchestrator Integration). Both the CLI and SKILL.md
must be updated atomically.

---

### Pitfall 4: 3-Critic Parallel Spawning Exceeding Claude Code Concurrency Limits

**What goes wrong:**
The orchestrator spawns all critics in parallel via Agent() calls. With 2 critics (v1.1),
this works reliably. With 3 critics, the Claude Code platform may have undocumented
concurrency limits on simultaneous sub-agent spawns. If the platform queues the third
spawn, it runs after one of the first two completes -- increasing total evaluation time
but not breaking correctness. If the platform REJECTS the third spawn, the orchestrator
gets an Agent() error and enters the retry path.

**Why it happens:**
Claude Code's sub-agent concurrency model is not documented. The Agent tool appears to
support parallel calls (the orchestrator already spawns 2 in parallel), but the behavior
with 3+ simultaneous spawns is empirically untested.

**Consequences:**
- Best case: third critic queued, runs sequentially after one finishes (~60K tokens delayed)
- Medium case: third critic spawn fails, retry succeeds, one retry consumed unnecessarily
- Worst case: concurrency limit causes cascading failures, all 3 critics need re-spawning

**Prevention:**
1. Test empirically with 3 parallel Agent() calls before committing to the architecture
2. If concurrency is limited to 2, spawn perceptual + projection in parallel, then
   perturbation sequentially after both complete. This adds ~60K tokens of sequential
   latency but avoids concurrency failures.
3. Document the concurrency finding in SKILL.md so future critic additions know the limit
4. The retry logic already handles individual critic failure -- if one spawn fails, only
   that critic is retried. This is the safety net.

**Detection:**
- Third critic consistently fails on first attempt but succeeds on retry
- Evaluation phase takes noticeably longer than expected (2x instead of 1x the
  single-critic duration)
- Agent tool errors mentioning concurrency, queuing, or resource limits

**Phase to address:** Phase 3 (Orchestrator Integration). Empirical testing required.
If 3-way parallelism fails, the fallback is 2+1 sequential spawning.

---

## Moderate Pitfalls

### Pitfall 5: Robustness Dimension Score Inflation from Lack of Calibration Data

**What goes wrong:**
The new Robustness dimension has no empirical score distribution data. Unlike Visual
Design and Functionality which have been scored across multiple test runs (Dutch art
museum, DAW, RetroForge), Robustness has never been scored. The perturbation-critic
may produce scores that cluster around the threshold (6) or that are systematically
higher/lower than intended.

If Robustness scores are systematically high (most apps handle basic error cases),
the dimension becomes non-discriminating -- it always passes and does not drive
improvement. If scores are systematically low (aggressive adversarial testing flags
everything), it becomes the bottleneck that blocks PASS regardless of other dimensions'
quality.

**Prevention:**
1. Set the initial threshold at 6 (same as Visual Design) -- conservative but not
   aggressive
2. Run 3+ test prompts with the perturbation-critic and collect score distributions
   BEFORE hardening the threshold
3. Write calibration scenarios in SCORING-CALIBRATION.md BEFORE the critic agent is
   used in production -- the critic needs scoring anchors from day one
4. The perturbation-critic's ceiling rules should be mechanical (e.g., "app crashes
   on valid action -> max 4") to reduce subjective scoring variance

**Detection:**
- Robustness scores are always 6-7 across diverse applications (non-discriminating)
- Robustness is always the lowest-scoring dimension (over-aggressive)
- Score justifications are vague ("the app seems robust" without specific evidence)

**Phase to address:** Phase 1 (SCORING-CALIBRATION.md Robustness scenarios).

### Pitfall 6: Visual Design Scope Expansion Without Updated Calibration Scenarios

**What goes wrong:**
The perceptual-critic's enhanced methodology (cross-page consistency, responsive identity
preservation) expands what Visual Design measures. But the SCORING-CALIBRATION.md
scenarios were written for the original Visual Design scope (single-page assessment,
design language match, mobile layout). If the critic applies cross-page checks against
calibration scenarios that do not account for them, scores will be systematically lower
than intended -- the critic finds cross-page inconsistencies that the calibration says
should score 7, but the additional findings push it to 5.

**Prevention:**
1. Update SCORING-CALIBRATION.md Visual Design scenarios to include cross-page elements
2. Add at least one calibration scenario that describes cross-page inconsistency and
   its expected score impact
3. Add a ceiling rule: "Cross-page style inconsistency (>3 pages differ) -> max 5"

**Detection:**
- Visual Design scores drop by 1-2 points after the scope expansion
- Score justifications cite cross-page issues but calibration scenarios do not
  provide scoring guidance for them

**Phase to address:** Phase 4 (Enhanced Existing Critics). Calibration updates should
accompany the methodology expansion.

### Pitfall 7: Generator LanguageModel Guidance Creating Browser Lock-In

**What goes wrong:**
The v1.2 Generator improvements include "browser-agnostic LanguageModel" guidance.
If this is implemented as "use LanguageModel API instead of Chrome-specific APIs,"
the Generator may write code that works in Chrome and Edge but fails in Firefox/Safari
where LanguageModel is not available. The existing browser-prompt-api skill already
handles graceful degradation, but the Generator may not read the skill's degradation
patterns if the new guidance implies LanguageModel is universally available.

**Prevention:**
1. The guidance should say "use the LanguageModel API with graceful degradation" --
   not just "use LanguageModel"
2. Reference the browser-prompt-api skill's graceful degradation patterns explicitly
3. The perturbation-critic can test degradation by evaluating with a browser that
   does NOT have LanguageModel (standard Chromium without the flag)

**Detection:**
- Apps crash or show blank UI in browsers without LanguageModel
- The Browser AI Degradation ceiling rule (Functionality max 4) triggers frequently

**Phase to address:** Phase 5 (Generator Improvements).

---

## Minor Pitfalls

### Pitfall 8: Architecture Documentation Becoming Stale

**What goes wrong:**
The architecture-principles.md reference file documents the current architecture.
Future changes (v1.3, v2.0) may modify the architecture without updating the
documentation, creating misleading reference material.

**Prevention:**
1. Keep the document focused on PRINCIPLES (GAN, Cybernetics, Turing test) rather
   than SPECIFICS (exact file paths, dimension names)
2. Principles change rarely; implementation details change every milestone
3. Include a "last updated" date in the document

**Phase to address:** Phase 6 (Architecture Documentation).

### Pitfall 9: Vite+ Adoption Guidance Being Too Aggressive

**What goes wrong:**
If the Generator guidance is updated to "always use Vite+" instead of "prefer Vite+
when compatible," the Generator may force Vite+ onto frameworks that are incompatible
(Angular, Nuxt). The existing guidance already says "prefer Vite+ for greenfield web
projects" with compatibility caveats -- the v1.2 change should strengthen the nudge
without removing the escape hatch.

**Prevention:**
1. Keep the "if Vite+ is not compatible" fallback clause
2. Add specific examples of when NOT to use Vite+ (Angular, Nuxt)
3. Frame as "strongly prefer" not "always use"

**Phase to address:** Phase 5 (Generator Improvements).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Scoring + perturbation-critic | Pitfall 2 (scope overlap with existing critics) | Define clear methodology boundaries in agent instructions |
| Phase 1: Scoring + perturbation-critic | Pitfall 5 (Robustness score inflation/deflation) | Write calibration scenarios before first use |
| Phase 2: Convergence hardening | Pitfall 1 (magic numbers wrong with 4 dims) | Derive from DIMENSIONS.length * 10 |
| Phase 3: Orchestrator integration | Pitfall 3 (resume-check rename) | Update CLI + SKILL.md atomically |
| Phase 3: Orchestrator integration | Pitfall 4 (3-critic concurrency) | Test empirically; fallback to 2+1 |
| Phase 4: Enhanced critics | Pitfall 6 (Visual Design calibration gap) | Update calibration scenarios with scope expansion |
| Phase 5: Generator improvements | Pitfall 7 (LanguageModel browser lock-in) | Include degradation guidance |
| Phase 5: Generator improvements | Pitfall 9 (Vite+ too aggressive) | Keep compatibility escape hatch |
| Phase 6: Architecture docs | Pitfall 8 (staleness) | Focus on principles, not implementation details |

---

## Sources

### Primary (HIGH confidence -- derived from reading actual code)
- `plugins/application-dev/scripts/appdev-cli.mjs` lines 257-306 -- computeEscalation() hardcoded thresholds
- `plugins/application-dev/scripts/appdev-cli.mjs` lines 725-818 -- cmdResumeCheck() action string contract
- `plugins/application-dev/scripts/appdev-cli.mjs` lines 14-18 -- DIMENSIONS constant
- `plugins/application-dev/skills/application-dev/SKILL.md` lines 95-105 -- resume dispatch table
- `plugins/application-dev/agents/perceptual-critic.md` -- responsive testing methodology (viewport 320/1280)
- `plugins/application-dev/agents/projection-critic.md` -- negative test methodology, acceptance test reuse
- `plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md` -- existing ceiling rules and scenarios

---
*Pitfalls research for: v1.2 feature integration*
*Researched: 2026-04-02*
