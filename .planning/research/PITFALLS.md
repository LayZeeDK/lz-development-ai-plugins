# Pitfalls Research: v1.1 Hardening

**Domain:** GAN-inspired multi-agent application development harness -- v1.1 feature additions
**Researched:** 2026-03-29
**Confidence:** HIGH (pitfalls derived from reading actual code, regex patterns, and template contracts)

This document covers pitfalls specific to the v1.1 hardening features. It does not
repeat the v1.0 pitfalls (Evaluator leniency, role collapse, mode collapse, etc.)
which remain valid and are documented in the v1.0 research archive.

---

## Critical Pitfalls

### Pitfall 1: Breaking Evaluation Report Parsing When Changing Scoring Dimensions

**What goes wrong:**
The EVALUATION-TEMPLATE.md and appdev-cli.mjs have a hard coupling through regex
patterns. The current `extractScores` function on line 92 of appdev-cli.mjs uses:

```
/\|\s*(Product Depth|Functionality|Visual Design|Code Quality)\s*\|\s*(\d+)\/10/gi
```

Renaming "Code Quality" to "Robustness" and "Visual Design" to "Visual Coherence"
will cause `extractScores` to find only 2 of the expected 4 criterion names. The
function explicitly checks `Object.keys(scores).length !== 4` and returns an error
if any are missing. The orchestrator treats this error as an Evaluator failure and
triggers a retry -- which produces the same report with the same new names, causing
an infinite retry loop until the 2-retry limit is exhausted and the user is asked to
intervene.

Worse, if only one dimension is renamed (partial migration), the function will find 3
of 4 and still fail -- but the error message will point to a single missing criterion,
making it look like the Evaluator "forgot" a dimension rather than a parsing mismatch.

**Why it happens:**
The regex pattern is a string literal in appdev-cli.mjs, the template has HTML
comments warning about regex sensitivity, and the evaluator.md references the four
criteria by name. These three files must be updated atomically, but they live in three
different directories and there is no automated check that they are in sync.

Additionally, the Score Justifications table in the template uses prose format
("(score of 10)") specifically to avoid colliding with `extractScores()`. The NOT
regex-parsed comment on line 35 of the template explains this. Adding new dimension
names to the scores table without also updating the justifications table risks creating
a new collision vector if the prose format accidentally matches the regex.

**How to avoid:**
1. Update all three files in a single commit: appdev-cli.mjs regex, EVALUATION-TEMPLATE.md
   criterion names + HTML comments, SCORING-CALIBRATION.md criterion names + ceiling rules
2. Add a unit test for `extractScores` that parses a sample report with the NEW criterion
   names and verifies all 4 are extracted correctly
3. Add a second test that parses a report with the OLD criterion names and verifies it
   FAILS -- this catches stale templates in the wild
4. Consider replacing the regex with a structured approach: parse the markdown table
   generically and validate criterion names against a constant list, rather than embedding
   names directly in the regex pattern. This makes future renames a one-line change
5. The `computeEscalation` and `determineExit` functions use `scores.total` (sum of all 4)
   -- this is name-agnostic and survives renames, but only if `extractScores` succeeds

**Warning signs:**
- appdev-cli round-complete returns `{"error": "Could not extract all 4 scores..."}`
- Evaluator retries exhausted on round 1 with no obvious agent failure
- State file shows round entry without scores (null scores)
- The error message names specific missing criteria -- compare against the template

**Phase to address:**
Must be the FIRST change in the Evaluator/scoring phase. Template + CLI + calibration
updated atomically before any other scoring changes.

---

### Pitfall 2: Evaluator Behavioral Regression When Removing Source Code Access

**What goes wrong:**
The current evaluator.md Step 10 ("Review Code (Read-Only)") produces findings that
feed into scoring for Code Quality (security vulnerabilities, error handling patterns,
dead code, project structure) and also cross-pollinate into Functionality scoring
(performance red flags like infinite loops, unbounded DOM growth). Removing source
code access eliminates these signal sources entirely.

The risk is not just lower Code Quality scores -- it is that the Evaluator loses the
ability to detect INVISIBLE bugs: security vulnerabilities (XSS via dangerouslySetInnerHTML),
memory leaks (missing cleanup of event listeners/timers), unbounded state growth, and
hardcoded API keys. These issues produce no visible symptoms during a short testing session
but are real deficiencies. The Evaluator will be unable to distinguish a well-structured
app from one held together with duct tape, as long as both look the same in the browser.

Additionally, the Evaluator currently uses source code to verify AI feature authenticity
(Step 8 references checking "source code contains switch/case or if/else chains matching
user input keywords"). Without source code access, the Evaluator must rely entirely on
behavioral probing to detect canned AI -- which is less reliable because a sophisticated
canned implementation can pass behavioral tests (e.g., using a large response map indexed
by embeddings rather than keyword matching).

**Why it happens:**
The GAN information barrier is architecturally correct -- in real GANs, the discriminator
only sees the output, not the generator's internal state. But the analog is imperfect:
real GANs operate on fixed-dimensionality outputs (images, audio) where all relevant
information is visible in the output. Web applications have a hidden dimension (source code)
that cannot be fully observed through the browser alone. The information barrier trades
detection capability for architectural purity.

**How to avoid:**
1. Replace "Code Quality" with "Robustness" and redefine it as an OBSERVABLE criterion:
   does the app handle errors gracefully? does it recover from bad input? does it work
   across viewports? does it handle slow network? This can be tested through the browser
   without source code
2. Move security testing to behavioral probes: attempt XSS through input fields, test
   for open redirects, check for exposed credentials in network requests, check for
   information leakage in error messages
3. Strengthen AI feature probing to compensate for lost source code inspection:
   - Add latency analysis (canned responses are instant, real AI has model load time)
   - Add output entropy analysis (canned responses have low variance)
   - Add adversarial input testing (gibberish, wrong language, domain-irrelevant queries)
   - Add the "Winograd schema" probes already in AI-PROBING-REFERENCE.md
4. Accept that some code quality signals are lost and do NOT try to reconstruct them
   through indirect observation -- that leads to unreliable heuristics and false confidence
5. Consider a "commit hygiene" dimension that examines git log and diff stats (observable
   without reading source) as a lightweight proxy for code organization

**Warning signs:**
- Evaluator reports become shorter (no Code Quality Assessment section content)
- Robustness scores cluster at 6-7 with vague justifications ("appears to handle errors")
- Security vulnerabilities survive multiple rounds undetected
- Canned AI features pass AI probing more often than before

**Phase to address:**
Evaluator phase -- must be coordinated with Pitfall 1 (dimension rename). The new
"Robustness" criterion must have calibration scenarios, ceiling rules, and rubric
descriptors written BEFORE the Evaluator agent definition is updated. Otherwise the
Evaluator has a new criterion name but no anchor for scoring it.

---

### Pitfall 3: Rising Thresholds Creating Impossible Convergence

**What goes wrong:**
If v1.1 raises score thresholds (e.g., from 7 to 8 for Product Depth, or from 6 to 7
for the new Robustness criterion), the GAN feedback loop may become impossible to
converge. The Generator reaches a quality plateau that cannot be exceeded within the
model's capability, and every round triggers FAIL, eventually hitting PLATEAU or
SAFETY_CAP exit without ever achieving PASS.

The mathematical problem is that the current `computeEscalation` function detects
plateau as "<=1 point improvement over 3-round window" (line 152 of appdev-cli.mjs).
If thresholds are raised such that the Generator's capability ceiling is between the
old threshold and the new threshold, the system enters a dead zone: scores are too high
to trigger REGRESSION but too low to achieve PASS, and improvement is too slow to avoid
PLATEAU detection. The system exits with PLATEAU after 3-4 rounds, having wasted
computation without achieving a better outcome than the lower threshold would have
accepted.

This is compounded by the proposed minimum round count. If a minimum of 2 rounds is
enforced AND thresholds are raised AND the model is capable of round-1 scores that
meet old thresholds, then the minimum round requirement forces unnecessary rounds
that risk introducing regressions (Pitfall 8 from v1.0) without improving quality.

**Why it happens:**
Threshold setting is disconnected from empirical measurement of what scores the
Generator actually achieves. The current thresholds (Product Depth 7, Functionality 7,
Visual Design 6, Code Quality 6) were chosen based on what "good enough" means
conceptually, not based on observed score distributions across test runs. Raising them
without empirical data risks setting targets the system cannot hit.

**How to avoid:**
1. Collect empirical score data from multiple test runs with the CURRENT thresholds
   before raising any thresholds. If round-3 scores for Functionality average 7.2 with
   std dev 1.1, raising the threshold to 8 means ~50% of runs will never converge
2. If thresholds must change, change them by at most 1 point at a time and validate
   with test runs before committing
3. For the new dimensions (Robustness replacing Code Quality, Visual Coherence
   replacing Visual Design), keep thresholds at the SAME level as the dimension they
   replace (6 for both) until empirical data shows the new dimension is calibrated
4. Make thresholds configurable in appdev-cli.mjs rather than hardcoded in the template.
   The template currently embeds threshold values ("7" and "6") -- move them to a
   configuration object that both the template and the CLI reference
5. Add a safeguard: if 3 consecutive rounds have all criteria within 1 point of their
   thresholds but never cross all simultaneously, exit with a new condition
   (NEAR_PASS or similar) rather than wasting rounds

**Warning signs:**
- Multiple test runs end with PLATEAU or SAFETY_CAP exit, never PASS
- Average total scores are high (e.g., 24-26/40) but one criterion consistently
  misses its threshold by 1 point
- The system produces 6-8 round runs where scores flatline after round 3

**Phase to address:**
Convergence logic hardening phase. Threshold changes should be the LAST scoring change
(after dimension renames and calibration scenarios are validated) and should be gated
on empirical data.

---

### Pitfall 4: Cross-Validation False Positives Blocking Legitimate PASS

**What goes wrong:**
The proposed cross-validation safeguard (e.g., requiring that cross-feature interaction
testing passes before issuing a PASS verdict) can generate false positives that block
legitimate PASS verdicts. Cross-feature interactions are inherently combinatorial: N
features produce N*(N-1)/2 interaction pairs. Testing all pairs is infeasible, so the
Evaluator tests a subset. If ANY cross-feature test fails, and cross-validation is a
hard gate on PASS, then a single minor interaction issue (e.g., opening the settings
modal while the search overlay is active causes a z-index overlap) blocks PASS even if
all individual criteria are above threshold.

The false positive rate scales with application complexity: a 12-feature app has 66
interaction pairs. Even if each pair has only a 5% chance of surfacing a minor issue,
the probability of at least one issue is 1 - 0.95^66 = 97%. Cross-validation as a hard
gate effectively guarantees that complex applications never pass.

**Why it happens:**
Cross-feature interaction testing is a good SIGNAL but a bad GATE. It finds real issues
(z-index conflicts, state pollution between features, navigation race conditions), but
these issues range from Critical to cosmetic. Treating all cross-feature issues as
PASS-blocking conflates severity levels.

**How to avoid:**
1. Cross-feature issues should feed into existing scoring dimensions (Functionality for
   bugs, Visual Coherence for layout conflicts) rather than being a separate gate
2. Only Critical and Major cross-feature bugs should block PASS -- Minor cross-feature
   issues should lower the Functionality score but not independently veto the verdict
3. Define a minimum cross-feature test count (e.g., "test at least 5 cross-feature
   interactions per evaluation round") rather than "test all interactions"
4. The Evaluator should prioritize testing interactions between Core features and between
   features that share state (e.g., both write to the same data store)
5. Do NOT add a separate "Cross-Validation" score or gate -- integrate findings into
   existing criteria to avoid the combinatorial explosion problem

**Warning signs:**
- Applications that score 7+ on all individual criteria but still receive FAIL verdict
  due to cross-feature issues
- Cross-feature bugs listed are all Minor severity but still block PASS
- The Evaluator spends most of its context budget on cross-feature testing and
  abbreviates individual feature testing
- Legitimate improvements in cross-feature behavior do not change the PASS/FAIL outcome

**Phase to address:**
Evaluator phase. Cross-feature testing should be specified as a SCORING INPUT, not a
separate gate. The evaluator.md update should explicitly state that cross-feature
findings are classified by severity and routed to the appropriate scoring dimension.

---

### Pitfall 5: Acceptance Test Plan Becoming a Ceiling Instead of a Floor

**What goes wrong:**
Adding an acceptance test plan to SPEC.md (as a Planner output) creates a concrete list
of "what to test." The risk is that both the Generator and Evaluator treat this list as
exhaustive rather than minimum:

- The Generator implements exactly what the test plan tests and nothing more -- "teaching
  to the test" behavior where features are optimized to pass the specific test scenarios
  rather than to work generally
- The Evaluator restricts its testing to the acceptance test plan and stops doing
  adversarial exploration -- the entire adversarial dynamic collapses because the
  Evaluator has a checklist to follow rather than a mandate to break things
- The acceptance test plan, written by the Planner at generation time, cannot anticipate
  the specific ways the Generator's implementation will be fragile. Real bugs live in
  the gaps between planned tests

This is the Goodhart's Law failure mode applied to testing: "When a measure becomes a
target, it ceases to be a good measure." The acceptance test plan, intended to ensure
minimum quality, becomes the maximum quality target.

**Why it happens:**
LLM agents are instruction-followers by nature. Given a checklist, they execute the
checklist. The current evaluator.md works against this by explicitly instructing
adversarial exploration ("try to break it", "test in unexpected orders", "one negative
test per feature"). But an acceptance test plan provides a competing instruction: "verify
these specific scenarios." When the agent has limited context budget, the concrete
checklist wins over the abstract adversarial mandate.

**How to avoid:**
1. Frame the acceptance test plan as "minimum acceptance criteria" in the SPEC-TEMPLATE.md,
   with explicit language: "The Evaluator MUST test all acceptance criteria AND perform
   adversarial testing beyond these criteria. Passing acceptance criteria alone is
   necessary but NOT sufficient for a PASS verdict."
2. In the evaluator.md, add a rule: "After completing the acceptance test plan, spend at
   least 30% of your testing time on adversarial exploration not covered by the plan"
3. The acceptance test plan should test OUTCOMES, not IMPLEMENTATIONS. "User can create a
   task with a title and due date" is an outcome. "User fills the title input, selects a
   date from the datepicker, clicks Submit, and sees the task in the list" is an
   implementation prescription that constrains the Generator's design space
4. Do NOT include the acceptance test plan in EVALUATION-TEMPLATE.md. Keep it in SPEC.md
   only. If it appears in the evaluation template, the Evaluator will treat it as a
   section to fill out rather than a minimum bar to clear
5. The Planner should write 3-5 acceptance tests per Core feature and 1-2 per
   Important feature -- not exhaustive test scenarios. Keep the plan small enough that
   it cannot substitute for adversarial testing

**Warning signs:**
- Evaluator report's testing section exactly mirrors the acceptance test plan with no
  additional tests
- Generator implements features in a way that passes acceptance tests but fails obvious
  unlisted scenarios
- Bug count in evaluator reports decreases after adding acceptance tests (fewer bugs
  found, not fewer bugs existing)
- Evaluator context budget consumed by acceptance test checking, adversarial testing
  section is brief or absent

**Phase to address:**
Planner phase (acceptance test plan format) and Evaluator phase (testing rules). Both
must be coordinated: the plan's framing in SPEC-TEMPLATE.md and the evaluator.md's
instructions about how to USE the plan must reinforce each other.

---

### Pitfall 6: Edge Browser Differences Breaking Evaluator Testing

**What goes wrong:**
The v1.1 milestone specifies "Edge-first for AI-feature applications" because Edge ships
Phi-4-mini via the Prompt API on stable (Edge 139+). But the Evaluator's testing
infrastructure (playwright-cli) defaults to Chromium, which does NOT include any built-in
AI model. If the Generator builds against Edge's Prompt API and the Evaluator tests with
default Chromium, all AI features will fail with "LanguageModel is not defined" -- the
Evaluator will report them as Critical bugs and cap Product Depth at 5 (canned AI ceiling).

Conversely, if the Evaluator is configured to use `channel: 'msedge'`, it gains access to
Phi-4-mini but loses access to Gemini Nano. Applications built targeting Chrome's Prompt
API (Gemini Nano) will work differently under Edge's Phi-4-mini: different response
quality, different token limits (Edge restricts to 9216 token context window), different
language support, and different hardware requirements (Edge needs 5.5 GB VRAM vs Chrome's
4 GB).

The underlying problem is that the Prompt API has identical JavaScript surface across
Chrome and Edge but uses DIFFERENT models with DIFFERENT capabilities. An application that
works perfectly in Chrome may produce worse results in Edge (or vice versa), and the
Evaluator's assessment is browser-dependent.

Additionally, Edge requires Windows 10/11 or macOS 13.3+ -- no Linux support. Users
running on Linux will have no Edge option and must fall back to Chrome's Gemini Nano
(if available in extensions) or skip browser AI features entirely.

**How to avoid:**
1. The browser-prompt-api skill already abstracts over Chrome vs Edge, but the Evaluator
   and Generator must agree on which browser to target. Add a "Browser Target" field to
   SPEC.md that the Planner sets based on the prompt requirements
2. The Evaluator's playwright-cli launch must use `channel: 'msedge'` when testing
   Edge-targeted applications. This must be explicit in the evaluator.md instructions,
   not left to inference
3. The Generator's graceful degradation code MUST be tested by the Evaluator in BOTH
   scenarios: (a) with the target browser (AI works) and (b) with default Chromium
   (AI unavailable). The existing ceiling rule "App non-functional without browser AI
   APIs -> Functionality max 4" already handles this, but the Evaluator must actually
   test the degradation path
4. For AI feature probing, the Evaluator should note which browser and model it tested
   against, so that behavioral differences between Gemini Nano and Phi-4-mini are
   documented rather than treated as bugs
5. Consider keeping Chromium as the default Evaluator browser for non-AI testing and
   switching to the branded channel only for AI feature probing. This isolates browser
   differences to the AI testing steps

**Warning signs:**
- AI features consistently fail in evaluation despite working when tested manually
- Evaluator reports "LanguageModel is not defined" as a Critical bug
- AI probing results are inconsistent between test runs (different hardware, different
  browser)
- Applications that pass on one developer's machine fail on another's due to browser
  or hardware differences

**Phase to address:**
Browser phase (Edge-first configuration) and Evaluator phase (browser channel selection).
The browser target must be set BEFORE the Generator runs, and the Evaluator must be told
which channel to use. This is a cross-cutting concern that affects Planner (spec),
Generator (implementation), and Evaluator (testing).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding new criterion names in regex without tests | Quick rename, single commit | Next rename repeats the breakage; no safety net against template drift | Never -- add tests first, then rename |
| Keeping old threshold values when renaming dimensions | Avoids threshold calibration effort | New dimension may have different score distributions, making old thresholds too easy or too hard | Acceptable as a temporary measure if validated empirically within 2-3 test runs |
| Making the Evaluator use `msedge` channel for ALL testing | Simplifies browser configuration | Misses Chrome-specific issues; Edge has different headless behavior; Edge not available on Linux | Only when the application explicitly targets Edge AI features |
| Adding acceptance test plan to EVALUATION-TEMPLATE.md | Evaluator can check off tests systematically | Evaluator becomes a checklist executor, adversarial testing dies | Never -- keep acceptance tests in SPEC.md only |
| Using `scores.total` as the primary convergence metric | Simple to compute, already implemented | Masks dimension-specific issues; a 10/10 Product Depth can compensate for a 4/10 Robustness in the total | Acceptable for trajectory analysis (which direction are scores moving) but NOT for PASS/FAIL decisions (which correctly uses per-criterion thresholds) |

## Integration Gotchas

Common mistakes when connecting v1.1 features to the existing system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| EVALUATION-TEMPLATE.md + appdev-cli.mjs | Update template dimension names but forget to update the regex in extractScores | Update regex, template, and calibration atomically in one commit; add unit tests |
| SCORING-CALIBRATION.md + evaluator.md | Add new calibration scenarios for Robustness but keep old Code Quality rubric descriptors in evaluator.md | Calibration scenarios and rubric descriptors must match -- they define the same dimension from different angles |
| Acceptance test plan in SPEC.md + evaluator.md | Planner writes prescriptive tests ("click button X") instead of outcome tests ("user can do Y") | SPEC-TEMPLATE.md must frame acceptance tests as outcomes; review examples in the template |
| Minimum round count + PASS on round 1 | Adding minimum rounds of 2 but not updating the PASS exit condition in determineExit() | The `current.verdict === "PASS"` check on line 195 of appdev-cli.mjs fires before the minimum round check; add `current.round < minRounds` guard |
| Cross-validation + Verdict logic | Adding a cross-validation gate as a new exit condition in determineExit() | Do NOT add a new exit condition -- route cross-feature findings into existing scoring dimensions |
| Edge browser channel + playwright-cli install | Using `channel: 'msedge'` but not checking that Edge is installed on the machine | Add a prerequisite check: `npx playwright-cli --version` with msedge channel; fail gracefully with a message about browser availability |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Cross-feature combinatorial explosion | Evaluator context exhaustion; testing takes 20+ minutes per round; later features not tested | Cap cross-feature tests at 5-8 per round; prioritize Core feature interactions | Applications with 10+ features (66+ interaction pairs) |
| Acceptance test plan in SPEC.md growing large | SPEC.md exceeds 8K tokens; Generator context consumed by test plan instead of feature descriptions | Limit to 3-5 tests per Core feature, 1-2 per Important feature; max ~40 acceptance tests total | Specs with 14+ features |
| Rising thresholds + minimum rounds | 6-8 round runs that plateau without PASS; total agent tokens consumed >500K per run | Keep thresholds at current levels until empirical data justifies raising them | When the model's capability ceiling is between old and new thresholds |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Dimension rename:** appdev-cli.mjs regex updated -- verify by running `node appdev-cli.mjs round-complete --round 1 --report test-report.md` with a report using new names
- [ ] **Dimension rename:** SCORING-CALIBRATION.md ceiling rules updated for new dimension names -- verify all 4 dimensions have ceiling rules
- [ ] **Dimension rename:** evaluator.md rubric descriptors updated for new dimension names -- verify the grade range descriptions (1-3, 4-5, 6-7, 8-10) match the new dimensions
- [ ] **Dimension rename:** evaluator.md Step 12 scoring instructions reference new names -- verify no stale references to "Code Quality" or "Visual Design"
- [ ] **Information barrier:** evaluator.md Step 10 removed or replaced -- verify no remaining instructions to "Read the source code"
- [ ] **Information barrier:** evaluator.md tools frontmatter still includes Read/Glob -- verify these are NOT removed (Evaluator still needs to Read SPEC.md, screenshots, network logs)
- [ ] **Acceptance test plan:** SPEC-TEMPLATE.md includes acceptance criteria section -- verify it frames criteria as outcomes, not implementations
- [ ] **Acceptance test plan:** evaluator.md references acceptance criteria as floor, not ceiling -- verify explicit "adversarial testing beyond these criteria" language
- [ ] **Browser target:** browser-prompt-api skill updated for Edge-first -- verify the skill does not hard-assume Chrome
- [ ] **Convergence:** appdev-cli.mjs determineExit enforces minimum round count -- verify PASS on round 1 is blocked if minimum rounds > 1
- [ ] **Cross-validation:** No separate cross-validation gate in determineExit -- verify findings route to existing scoring dimensions

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Broken score parsing (Pitfall 1) | LOW | Fix the regex in appdev-cli.mjs; re-run the evaluator for the failed round; the state file preserves rounds history so no data is lost |
| Evaluator blind spots after source removal (Pitfall 2) | MEDIUM | Cannot recover detection capability retroactively; must strengthen behavioral probes and re-evaluate. Consider temporary "code audit" step as a non-scoring advisory appendix |
| Impossible convergence from high thresholds (Pitfall 3) | LOW | Lower thresholds back to previous values; re-run from the current round. The state file and git tags preserve all history |
| Cross-validation false positives (Pitfall 4) | LOW | Re-classify cross-feature issues by severity; recompute verdict ignoring Minor cross-feature issues. Manual override via `appdev-cli complete --exit-condition PASS` |
| Acceptance test ceiling effect (Pitfall 5) | MEDIUM | Requires rewriting evaluator.md instructions and re-running evaluation. Existing scores may have been inflated by checklist-only testing -- round scores are unreliable |
| Edge/Chrome browser mismatch (Pitfall 6) | LOW | Re-run evaluator with correct browser channel. AI feature scores from the mismatched run are invalid but other scores are fine |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Broken score parsing (Pitfall 1) | Scoring dimension restructuring (FIRST phase) | Unit test: `extractScores` parses new names; integration test: full round-complete with sample report |
| Evaluator blind spots (Pitfall 2) | Evaluator hardening (after scoring restructure) | Compare evaluator reports pre/post information barrier: are security issues still detected via behavioral probes? |
| Impossible convergence (Pitfall 3) | Convergence logic hardening (AFTER empirical data collection) | Run 3+ test prompts with new thresholds; verify >50% achieve PASS within 5 rounds |
| Cross-validation false positives (Pitfall 4) | Evaluator hardening (cross-feature testing rules) | Verify cross-feature findings appear in scoring justifications, NOT as a separate gate; no new exit condition in appdev-cli |
| Acceptance test ceiling (Pitfall 5) | Planner phase (template) + Evaluator phase (rules) | Verify evaluator reports contain adversarial tests NOT in the acceptance plan; bug count does not decrease versus pre-acceptance-plan runs |
| Edge browser mismatch (Pitfall 6) | Browser phase (Edge-first) + Evaluator phase (channel config) | Verify evaluator uses correct browser channel for AI testing; verify graceful degradation tested in Chromium |

## Sources

### Primary (HIGH confidence -- derived from reading actual code)
- `plugins/application-dev/scripts/appdev-cli.mjs` lines 79-124 -- extractScores regex and validation logic
- `plugins/application-dev/skills/application-dev/references/evaluator/EVALUATION-TEMPLATE.md` -- REGEX-SENSITIVE comments on lines 12-21
- `plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md` -- ceiling rules and threshold values
- `plugins/application-dev/agents/evaluator.md` -- Steps 10 (code review), 12 (scoring), 14 (self-verification)
- `plugins/application-dev/skills/application-dev/SKILL.md` -- orchestrator workflow and convergence check
- `plugins/application-dev/skills/browser-prompt-api/SKILL.md` -- Chrome vs Edge model differences

### Secondary (MEDIUM confidence -- verified with official docs)
- [Playwright browsers documentation](https://playwright.dev/docs/browsers) -- channel selection for Chrome and Edge
- [Microsoft Edge Prompt API docs](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api) -- Phi-4-mini availability, system requirements, Edge 139+ stable
- [Chrome Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api) -- Gemini Nano, Chrome 138+ stable for extensions
- [Edge Prompt API context window limitation](https://github.com/MicrosoftEdge/MSEdgeExplainers/issues/1224) -- 9216 token limit on Phi-4-mini
- [Cross-browser testing with Playwright](https://ray.run/discord-forum/threads/65748-chromium-vs-edge-vs-chrome) -- Edge vs Chrome minimal differences for non-AI testing

### Tertiary (LOW confidence -- general principles, not project-specific)
- [Hidden feedback loops in ML systems (2025)](https://link.springer.com/article/10.1007/s10115-025-02560-w) -- mathematical model of convergence in feedback-dependent systems
- [ICLR 2026: adversarial CI evaluation](https://openreview.net/pdf?id=YuxgSGFaqb) -- dual-role adversarial evaluation protocol with reviewer constraints

---
*Pitfalls research for: v1.1 hardening of GAN-inspired application-dev plugin*
*Researched: 2026-03-29*
