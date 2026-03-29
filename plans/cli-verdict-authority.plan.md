# Design: Move PASS/FAIL Verdict Authority from Evaluator to appdev-cli

## Problem Statement

The Evaluator agent currently serves two roles: scoring the application AND
deciding the verdict. This violates the GAN separation principle (the
Discriminator does not decide when training stops), creates a trust boundary
gap (CLI trusts verdict without cross-checking scores), and enables threshold
anchoring (the Evaluator can score exactly at pass thresholds to trigger PASS).

## Research Findings

### 1. Anthropic's Harness Design Article

The Anthropic engineering blog post on harness design for long-running apps
describes a system where "the evaluator agent makes the pass/fail verdict, not
an external mechanism." The evaluator owned scoring and verdicts. The harness
orchestrated agent sequencing but did not override the evaluator's judgment.

Critically, the author acknowledged the calibration challenge: "The tuning loop
was to read the evaluator's logs, find examples where its judgment diverged
from mine, and update the QA prompt to solve for those issues." This was manual
human-in-the-loop calibration with no automated cross-validation.

**Our divergence from Anthropic's design is intentional.** Their system had a
human operator monitoring every run and manually recalibrating the evaluator's
prompt. Our system is fully autonomous after the initial prompt. Without a
human observer, the system needs a mechanical check on the evaluator's
judgment -- the CLI serves as that mechanical check.

### 2. GAN Training Loop Control

Research confirms the core principle:

- **The Discriminator does not decide when training stops.** In GAN training,
  the discriminator's loss function is part of the adversarial game. Using it as
  the stopping criterion creates a circularity -- the discriminator would be
  both judge and referee. (Sources: Google ML, arXiv:2405.20987v1,
  MachineLearningMastery)

- **External metrics decide stopping.** FID (Frechet Inception Distance),
  IS (Inception Score), and MS-SSIM are computed on a held-out validation set
  by a separate, pre-trained network (Inception v3). These metrics are
  independent of the discriminator. (Source: Heusel et al., 2017)

- **The discriminator's own loss is unreliable.** "Generative adversarial
  networks lack an objective function, which makes it difficult to compare
  performance of different models." The discriminator can overfit to training
  data (98% training accuracy but 50-55% validation accuracy -- no better than
  random guessing). (Source: BigGAN research via LessWrong)

- **Combined external criteria work best.** The arXiv:2405.20987v1 paper
  proposes stopping when: (a) loss patterns show training problems, (b)
  MS-SSIM drops below thresholds, (c) FID achieves acceptable levels, AND (d)
  no improvement persists across patience epochs. No single internal metric
  suffices.

**Mapping to our system:**

| GAN Concept | Our System |
|-------------|------------|
| Generator | Generator agent |
| Discriminator | Evaluator agent |
| Discriminator's loss | Evaluator's verdict field |
| FID on held-out data | CLI's score-based computation |
| Human practitioner | The absent user (fully autonomous) |
| Inception network | CLI's mechanical rules + ceiling checks |

### 3. Cybernetics: Separation of Observation and Control

The cybernetic feedback loop model clearly separates roles:

- **Sensor** -- measures the system state (the Evaluator observes and scores)
- **Comparator** -- compares measurement against reference (the CLI compares
  scores against thresholds)
- **Controller** -- decides corrective action (the CLI decides continue/stop)
- **Actuator** -- executes the action (the orchestrator spawns the next round
  or exits)

Currently, the Evaluator is both sensor AND comparator. The CLI should be the
comparator and controller.

**Ashby's Law of Requisite Variety** provides additional justification. The
controller must have variety >= the system's variety. Right now the CLI's
"controller" for the PASS case has variety 1 (trust the evaluator's string).
After this change, the CLI's controller has variety matching the scoring space
(4 dimensions x 10 levels = 10,000 possible score combinations), plus
cross-validation checks. This gives the controller requisite variety to
regulate the evaluation loop.

**Conant-Ashby Good Regulator Theorem:** "Every good regulator of a system
must be (or have) a model of that system." By computing the verdict from
scores, the CLI gains a model of the evaluation state rather than treating it
as opaque. It can then detect anomalies that a simple string-pass-through
cannot.

### 4. Trust Boundary Analysis

Current flow (Evaluator decides):

```
Evaluator: scores=[7,7,6,6], verdict=PASS
CLI: reads verdict string "PASS" -> exits
```

The CLI does not verify that scores actually meet thresholds. The Evaluator
could write `PASS` with a 3/10 Functionality score and the CLI would exit.

After change (CLI decides):

```
Evaluator: scores=[7,7,6,6], findings=[bugs, features, observations]
CLI: reads scores, validates against thresholds [7,7,6,6] >= [7,7,6,6],
     cross-validates against findings, computes verdict
```

---

## Design

### Overview

The Evaluator becomes a pure sensor: it observes, tests, scores, and reports
findings. The CLI becomes the comparator and controller: it reads scores,
validates them against thresholds and findings, and computes the verdict.

### Component Changes

#### A. Evaluator Agent (evaluator.md)

**Stops doing:**
- Writing `## Verdict: PASS` or `## Verdict: FAIL`
- Making the binary pass/fail decision
- Applying the verdict rules in Step 14 (self-verification checks 8 and 9)

**Keeps doing:**
- All testing, probing, and observation (Steps 1-11)
- Scoring with calibration anchors and ceiling rules (Step 12)
- Classifying bugs by severity (Critical/Major/Minor)
- Classifying features by status (Implemented/Partial/Missing/Broken)
- Writing the Priority Fixes section
- Self-verification of score quality (checks 1-7 and 10 from Step 14, minus
  the verdict checks)

**New responsibilities:**
- Writing a structured `## Findings Summary` section that the CLI can parse
  for cross-validation. This section aggregates key facts in a machine-readable
  format:

```markdown
## Findings Summary

| Metric | Value |
|--------|-------|
| Critical bugs | 0 |
| Major bugs | 2 |
| Minor bugs | 3 |
| Features: Implemented | 6 |
| Features: Partial | 2 |
| Features: Missing | 0 |
| Features: Broken | 0 |
| Core features: Missing/Broken | 0 |
| Canned AI features | 0 |
| Console errors | 1 |
| Regressions | 0 |
```

This table replaces the verdict line as the primary machine-readable output.
The Evaluator already produces all of these counts in its report -- this
section simply aggregates them for the CLI to parse without ambiguity.

**GAN justification:** The Discriminator produces a continuous signal (real/fake
probability per sample), not a binary "stop training" decision. Analogously,
the Evaluator should produce continuous signals (scores, bug counts, feature
counts) that the external controller interprets.

#### B. EVALUATION-TEMPLATE.md

**Remove:**
- The `## Verdict: PASS/FAIL` heading
- The REGEX-SENSITIVE comment about verdict parsing
- The verdict-related instructions

**Add:**
- The `## Findings Summary` section template (structured table above)
- A REGEX-SENSITIVE comment for the new findings table format

**Modify the Scores table:**
- Remove the `Status` column (PASS/FAIL per criterion). The Evaluator should
  not pre-compute pass/fail per criterion -- that is the CLI's job.
- The table becomes: `| Criterion | Score | Threshold |`

**Rationale:** Removing the per-criterion Status column eliminates a subtle
verdict leak. If the Evaluator writes "PASS" next to each score, it has
effectively computed the verdict even without the heading. The threshold column
remains because it documents the contract for human readers, but the Evaluator
does not evaluate against it.

**Actually, keep the threshold column for human readability** but remove the
Status column. The CLI reads scores and thresholds independently.

Updated template:

```markdown
## Scores

| Criterion | Score | Threshold |
|-----------|-------|-----------|
| Product Depth | X/10 | 7 |
| Functionality | X/10 | 7 |
| Visual Design | X/10 | 6 |
| Code Quality | X/10 | 6 |
```

#### C. appdev-cli.mjs -- New Verdict Computation

**Replace `extractScores()` with `extractReport()`:**

The new function extracts scores AND findings:

```javascript
function extractReport(reportPath) {
  // ... existing file read logic ...

  // Extract scores (existing regex, unchanged)
  const scorePattern = /\|\s*(Product Depth|Functionality|Visual Design|Code Quality)\s*\|\s*(\d+)\/10/gi;

  // Extract findings summary (new)
  const findingsPattern = /\|\s*(Critical bugs|Major bugs|Minor bugs|Features: Implemented|Features: Partial|Features: Missing|Features: Broken|Core features: Missing\/Broken|Canned AI features|Console errors|Regressions)\s*\|\s*(\d+)\s*\|/gi;

  // ... parse both ...

  return { scores, findings };
  // Note: no verdict field -- the CLI will compute it
}
```

**New `computeVerdict()` function:**

```javascript
const THRESHOLDS = {
  product_depth: 7,
  functionality: 7,
  visual_design: 6,
  code_quality: 6,
};

function computeVerdict(scores, findings) {
  const result = {
    verdict: null,
    per_criterion: {},
    warnings: [],
    cross_validation: { passed: true, issues: [] },
  };

  // 1. Threshold check: each score must meet its threshold
  let allPass = true;
  for (const [criterion, threshold] of Object.entries(THRESHOLDS)) {
    const score = scores[criterion];
    const passes = score >= threshold;
    result.per_criterion[criterion] = {
      score,
      threshold,
      passes,
    };
    if (!passes) {
      allPass = false;
    }
  }

  // 2. Cross-validation: scores must be consistent with findings
  const cv = crossValidate(scores, findings);
  result.cross_validation = cv;

  // 3. Final verdict
  if (allPass && cv.passed) {
    result.verdict = "PASS";
  } else {
    result.verdict = "FAIL";
    if (!cv.passed) {
      result.warnings.push(
        "Cross-validation failed: " + cv.issues.join("; ")
      );
    }
  }

  return result;
}
```

**New `crossValidate()` function -- the key addition:**

Cross-validation catches inconsistencies between scores and findings. These
rules encode the ceiling rules from SCORING-CALIBRATION.md as mechanical
checks:

```javascript
function crossValidate(scores, findings) {
  const issues = [];

  // CV-1: Critical bugs should cap Functionality at 5
  if (findings.critical_bugs > 0 && scores.functionality > 5) {
    issues.push(
      "Functionality=" + scores.functionality +
      " but " + findings.critical_bugs +
      " Critical bug(s) found (ceiling: max 5)"
    );
  }

  // CV-2: 3+ Major bugs should cap Functionality at 6
  if (findings.major_bugs >= 3 && scores.functionality > 6) {
    issues.push(
      "Functionality=" + scores.functionality +
      " but " + findings.major_bugs +
      " Major bugs found (ceiling: max 6)"
    );
  }

  // CV-3: >50% features Missing/Broken should cap Product Depth at 5
  const totalFeatures =
    findings.features_implemented +
    findings.features_partial +
    findings.features_missing +
    findings.features_broken;
  const badFeatures = findings.features_missing + findings.features_broken;
  if (totalFeatures > 0 && badFeatures / totalFeatures > 0.5 && scores.product_depth > 5) {
    issues.push(
      "Product Depth=" + scores.product_depth +
      " but " + badFeatures + "/" + totalFeatures +
      " features Missing/Broken (ceiling: max 5)"
    );
  }

  // CV-4: Any Core feature Missing/Broken should cap Product Depth at 6
  if (findings.core_features_missing_broken > 0 && scores.product_depth > 6) {
    issues.push(
      "Product Depth=" + scores.product_depth +
      " but " + findings.core_features_missing_broken +
      " Core feature(s) Missing/Broken (ceiling: max 6)"
    );
  }

  // CV-5: Canned AI feature should cap Product Depth at 5
  if (findings.canned_ai_features > 0 && scores.product_depth > 5) {
    issues.push(
      "Product Depth=" + scores.product_depth +
      " but " + findings.canned_ai_features +
      " Canned AI feature(s) found (ceiling: max 5)"
    );
  }

  // CV-6: Any Core feature Missing/Broken means verdict must be FAIL
  //        (regardless of scores)
  if (findings.core_features_missing_broken > 0) {
    issues.push(
      "Core feature(s) Missing/Broken: automatic FAIL"
    );
  }

  // CV-7: >50% features Missing/Broken/Partial means verdict must be FAIL
  const nonFullFeatures =
    findings.features_partial + findings.features_missing + findings.features_broken;
  if (totalFeatures > 0 && nonFullFeatures / totalFeatures > 0.5) {
    issues.push(
      nonFullFeatures + "/" + totalFeatures +
      " features not fully implemented: automatic FAIL"
    );
  }

  return {
    passed: issues.length === 0,
    issues: issues,
  };
}
```

**Anomaly detection -- suspicious scoring patterns:**

```javascript
function detectAnomalies(scores, rounds) {
  const warnings = [];

  // A-1: All scores identical (e.g., 7-7-7-7)
  const vals = Object.values(scores);
  const allIdentical = vals.every(function (v) { return v === vals[0]; });
  if (allIdentical && vals.length === 4) {
    warnings.push(
      "All 4 scores identical (" + vals[0] + "/10) -- " +
      "suspicious uniformity, may indicate lazy scoring"
    );
  }

  // A-2: All scores exactly at threshold
  const atThreshold =
    scores.product_depth === THRESHOLDS.product_depth &&
    scores.functionality === THRESHOLDS.functionality &&
    scores.visual_design === THRESHOLDS.visual_design &&
    scores.code_quality === THRESHOLDS.code_quality;
  if (atThreshold) {
    warnings.push(
      "All scores exactly at pass thresholds (7,7,6,6) -- " +
      "suspicious threshold anchoring"
    );
  }

  // A-3: Implausible improvement (>8 point total jump in one round)
  if (rounds.length > 1) {
    const prev = rounds[rounds.length - 2];
    const current = rounds[rounds.length - 1];
    if (prev.scores && current.scores) {
      const delta = current.scores.total - prev.scores.total;
      if (delta > 8) {
        warnings.push(
          "Total score jumped +" + delta + " in one round -- " +
          "improvement >8 points is implausible"
        );
      }
    }
  }

  return warnings;
}
```

**Anomaly warnings are informational, not blocking.** They appear in the CLI
output and the orchestrator logs them. They do not override the verdict. The
reason: false positives from anomaly detection could prevent legitimate PASS
verdicts. However, the warnings provide a signal for future development
(e.g., triggering a re-evaluation round if anomalies are detected).

Future enhancement: if anomaly count exceeds a threshold across rounds, the
CLI could trigger an additional evaluation round with a different prompt
("Verify the previous round's scores are accurate"). This is the "held-out
validation set" analogy -- a second evaluation pass to confirm the first.

#### D. appdev-cli.mjs -- Updated `determineExit()`

```javascript
function determineExit(rounds, escalation, maxRounds) {
  const current = rounds[rounds.length - 1];

  // CLI-computed verdict replaces Evaluator verdict
  // computeVerdict() was called before determineExit()
  // and the result is stored in current.computed_verdict
  if (current.computed_verdict === "PASS") {
    return { exit_condition: "PASS", should_continue: false };
  }

  // Rest unchanged: PLATEAU, REGRESSION, SAFETY_CAP checks
  // ...
}
```

#### E. appdev-cli.mjs -- Updated `cmdRoundComplete()`

```javascript
function cmdRoundComplete(argv) {
  // ... existing arg parsing ...

  // Extract scores AND findings (no verdict from Evaluator)
  const extracted = extractReport(args.report);
  if (extracted.error) {
    output({ error: extracted.error });
    process.exit(1);
  }

  const state = readState();

  // Compute verdict mechanically
  const verdictResult = computeVerdict(extracted.scores, extracted.findings);

  // Detect anomalies
  const anomalies = detectAnomalies(
    extracted.scores,
    [...state.rounds, { scores: extracted.scores }]
  );

  const entry = {
    round: round,
    scores: extracted.scores,
    findings: extracted.findings,
    computed_verdict: verdictResult.verdict,
    per_criterion: verdictResult.per_criterion,
    cross_validation: verdictResult.cross_validation,
    anomalies: anomalies,
    escalation: null,
    escalation_label: null,
  };

  // ... existing round storage and escalation logic ...

  const result = {
    round: round,
    verdict: verdictResult.verdict,  // CLI-computed, not Evaluator-written
    scores: extracted.scores,
    findings: extracted.findings,
    per_criterion: verdictResult.per_criterion,
    cross_validation: verdictResult.cross_validation,
    anomalies: anomalies,
    escalation: escalation.level,
    escalation_label: escalation.label,
    exit_condition: exitResult.exit_condition,
    should_continue: exitResult.should_continue,
    trajectory: trajectory,
  };

  output(result);
}
```

#### F. Orchestrator (SKILL.md) -- Minimal Changes

The orchestrator already delegates to appdev-cli and acts on JSON output. The
changes are:

1. **Binary check change:** The Evaluator binary check currently looks for
   `## Verdict` in the file. Change to check for `## Findings Summary`:

   ```
   **Binary check:** Read `evaluation/round-N/EVALUATION.md` -- verify the file
   exists and contains `## Findings Summary`. Do NOT assess report quality.
   ```

2. **No other orchestrator changes needed.** The orchestrator reads
   `exit_condition` and `should_continue` from appdev-cli output. These fields
   are unchanged in structure. The orchestrator does not need to know how the
   verdict was computed.

3. **New fields in output are informational.** The orchestrator can optionally
   log `anomalies` and `cross_validation` warnings, but does not act on them
   differently. This preserves the "orchestrator does not diagnose agent
   output" rule.

#### G. Evaluator Self-Verification (Step 14) Updates

Remove checks 8 and 9 (verdict-dependent):
- ~~**Check 8:** Verdict is FAIL if any Core feature Missing/Broken~~
- ~~**Check 9:** Verdict is FAIL if >50% features Missing/Broken/Partial~~

These rules move to `crossValidate()` in the CLI (CV-6 and CV-7).

Keep checks 1-7 and 10, modified:
- **Check 1 (modified):** `## Findings Summary` table present (replaces
  verdict line check)
- **Checks 2-7:** Unchanged (scores table, priority fixes, ceiling rules,
  justifications, evidence of excellence, feature status completeness)
- **Check 10:** Feature count >= previous round (unchanged)

Add new check:
- **Check 11:** Findings Summary table row counts match report body counts.
  The Evaluator cross-checks its own summary against the detailed sections
  (e.g., count of bugs in the Bugs Found section matches the Critical/Major/
  Minor counts in the summary table). This internal consistency check
  supplements the CLI's cross-validation.

### Data Flow (Before and After)

**Before:**

```
Evaluator writes:
  - Scores: [7, 7, 6, 6]
  - Verdict: "PASS"     <-- Evaluator decides
  - Bugs: [list]
  - Features: [table]

CLI reads:
  - Verdict string -> "PASS"
  - Scores (for trajectory only)
  -> exit_condition = "PASS"
```

**After:**

```
Evaluator writes:
  - Scores: [7, 7, 6, 6]
  - Findings Summary: {critical_bugs: 0, major_bugs: 2, ...}
  - Bugs: [list]
  - Features: [table]
  (No verdict line)

CLI reads:
  - Scores -> checks against thresholds -> all pass
  - Findings -> cross-validates against scores -> CV-2 fires:
    "Functionality=7 but 2 Major bugs -- not 3+, so no ceiling violation"
    (2 Major bugs < 3 threshold, so CV-2 does not fire)
  - Anomaly check -> all scores not identical, not at exact threshold
  -> computed_verdict = "PASS"
  -> exit_condition = "PASS"
```

**Cross-validation catch example:**

```
Evaluator writes:
  - Scores: [7, 7, 6, 6]
  - Findings Summary: {critical_bugs: 1, major_bugs: 0, ...}

CLI reads:
  - Scores -> all meet thresholds -> would be PASS
  - Cross-validation -> CV-1 fires:
    "Functionality=7 but 1 Critical bug (ceiling: max 5)"
  -> cross_validation.passed = false
  -> computed_verdict = "FAIL"
  -> The Evaluator scored 7/10 Functionality despite reporting a Critical bug.
     The CLI catches the inconsistency.
```

### Configuration

Pass thresholds are currently hardcoded in both the Evaluator prompt and the
CLI. After this change, they live in one canonical location -- the CLI:

```javascript
const THRESHOLDS = {
  product_depth: 7,
  functionality: 7,
  visual_design: 6,
  code_quality: 6,
};
```

The Evaluator's prompt retains the threshold numbers for context (the Evaluator
needs to know what "good enough" means to write useful Priority Fixes), but the
thresholds in the prompt are documentation, not enforcement. Enforcement is
mechanical in the CLI.

### What the Evaluator's Role Becomes

The Evaluator becomes a **pure measurement instrument**:

1. **Observes** -- tests the application, interacts with it as a user
2. **Measures** -- scores 4 dimensions using calibration anchors
3. **Reports findings** -- bugs with severity, features with status, AI probe
   results, asset issues, console errors, regressions
4. **Aggregates** -- writes the Findings Summary table
5. **Prioritizes** -- writes Priority Fixes for Next Round (this judgment is
   valuable; it tells the Generator what to work on next)

The Evaluator retains all scoring judgment. The question "is this application a
5/10 or a 7/10 on Functionality?" requires observational expertise that the CLI
cannot replicate. The question "does 7/10 meet the threshold?" is mechanical
and belongs in the CLI.

**Analogy:** A thermometer measures temperature (the Evaluator scores). A
thermostat compares temperature against a setpoint and turns the heater on/off
(the CLI compares scores against thresholds and continues/stops the loop). The
thermometer should not contain thermostat logic.

### Risks and Mitigations

#### Risk 1: Evaluator writes inconsistent findings

The Evaluator might report 0 Critical bugs in the Findings Summary but
describe a Critical bug in the Bugs Found section. The Findings Summary could
be stale or wrong.

**Mitigation:** The Evaluator's self-verification Step 14 includes Check 11
(findings summary matches report body). Additionally, the CLI's
cross-validation serves as a second check -- if scores are suspiciously high
given the bug counts, the warning provides a signal.

**Future enhancement:** Parse the full Bugs Found section to count severities
independently, rather than trusting the summary table. This is more complex
(requires parsing markdown lists with severity annotations) but provides
end-to-end cross-validation.

#### Risk 2: Evaluator inflates findings to match inflated scores

If the Evaluator wants to PASS, it could both inflate scores AND deflate bug
counts (report 0 Critical bugs when there are Critical bugs, inflate feature
statuses). The cross-validation would not catch this because the scores and
findings would be internally consistent but both wrong.

**Mitigation:** This is the fundamental limit of single-evaluator systems. In
GAN terms, it is equivalent to a discriminator that overfits -- it reports high
confidence on generated samples that are actually low quality. The mitigations
are:

1. The Evaluator's prompt is strongly calibrated toward strictness ("Default to
   strict", "Do not inflate scores", calibration scenarios, ceiling rules).
   This is equivalent to regularization in the discriminator.
2. Anomaly detection catches surface-level gaming (identical scores, threshold
   anchoring, implausible improvement jumps).
3. Future: A "second opinion" evaluation round triggered by anomalies, using a
   different evaluation prompt that explicitly asks to verify the previous
   round's assessment. This is the "validation set" analogy.

#### Risk 3: Breaking change to existing tests

The test file `tests/appdev-cli-convergence.test.mjs` creates evaluation
reports with `## Verdict: PASS/FAIL` and asserts on the `verdict` field in CLI
output. All tests pass a verdict string to `makeEvalReport()`.

**Mitigation:** Update tests in the same changeset:
- `makeEvalReport()` removes the verdict line, adds Findings Summary table
- Test assertions check `verdict` field (still present in output, but now
  CLI-computed rather than Evaluator-extracted)
- Add new tests for cross-validation logic
- Add new tests for anomaly detection

#### Risk 4: Evaluator prompt drift

Removing the verdict from the Evaluator's output could cause confusion if the
Evaluator's prompt references "declare PASS/FAIL" in multiple places.

**Mitigation:** Comprehensive search-and-replace across evaluator.md and all
referenced files. The verdict heading, self-verification checks, and template
all need coordinated updates.

#### Risk 5: Missing findings in early rounds

If the Evaluator fails to write the Findings Summary (e.g., crashes before
reaching that step), the CLI cannot cross-validate. The CLI would have scores
but no findings.

**Mitigation:** If the Findings Summary table is absent, the CLI falls back to
threshold-only verdict (scores >= thresholds, no cross-validation). This is
strictly better than the current system (which would also fail if the verdict
line were absent). The CLI logs a warning that cross-validation was skipped.

#### Risk 6: Overly aggressive cross-validation blocks legitimate PASS

The ceiling rules in SCORING-CALIBRATION.md are "should" rules that require
Evaluator judgment. Making them mechanical in the CLI could create false
negatives -- e.g., the Evaluator carefully considered a Critical bug and
determined the score should be 6, but the CLI caps it at 5.

**Mitigation:** Cross-validation issues produce a FAIL verdict AND detailed
warnings. The orchestrator can present these to the user if desired. The
ceiling rules are already mechanical by design (SCORING-CALIBRATION.md says
"the score CANNOT exceed the ceiling") -- the Evaluator should already be
applying them. If the Evaluator violates a ceiling rule, that IS an error that
the CLI should catch.

This risk is actually a feature: a strict CLI catches Evaluator leniency, which
is the exact problem this design solves.

### Implementation Order

1. **Update EVALUATION-TEMPLATE.md** -- Remove verdict heading, add Findings
   Summary table, remove Status column from Scores table
2. **Update evaluator.md** -- Remove verdict-writing instructions, add Findings
   Summary writing step, update self-verification checks
3. **Update appdev-cli.mjs** -- Replace `extractScores()` with
   `extractReport()`, add `computeVerdict()`, `crossValidate()`,
   `detectAnomalies()`, update `cmdRoundComplete()` and `determineExit()`
4. **Update SKILL.md (orchestrator)** -- Change binary check from `## Verdict`
   to `## Findings Summary`
5. **Update SCORING-CALIBRATION.md** -- Add note that ceiling rules are
   enforced mechanically by the CLI, not just by the Evaluator's judgment
6. **Update tests** -- Modify `makeEvalReport()`, add cross-validation and
   anomaly detection tests

### GAN/Cybernetics Justification Summary

| Change | GAN Principle | Cybernetics Principle |
|--------|---------------|----------------------|
| Remove verdict from Evaluator | Discriminator measures, does not decide stopping | Sensor measures, comparator decides |
| CLI computes verdict from scores | External metric (FID) on held-out data decides stopping | Controller compares against setpoint |
| Cross-validation of scores vs findings | Combined external criteria (FID + IS + MS-SSIM) | Requisite variety: controller needs model of system |
| Anomaly detection (suspicious patterns) | Mode collapse detection via external monitoring | Error detection in feedback loop |
| Threshold enforcement in CLI, not Evaluator | Training hyperparameters live in harness, not in network | Setpoint lives in controller, not in sensor |
| Findings Summary table | Discriminator outputs probability distribution, not binary | Sensor provides continuous measurement signal |

### Non-Goals (Explicit Exclusions)

- **Moving scoring from Evaluator to CLI.** The Evaluator retains all scoring
  judgment. Scoring requires observational expertise (testing the app, reading
  code, visual inspection). The CLI cannot replicate this.
- **Adding a second evaluator agent.** This would be the ideal GAN analog
  (validation set evaluated by an independent network) but doubles the cost
  and complexity. Filed as a future enhancement.
- **Making thresholds dynamic.** Thresholds are fixed at [7,7,6,6]. Dynamic
  thresholds (e.g., raising thresholds after round 3) add complexity without
  clear benefit at this stage.
- **Blocking on anomaly warnings.** Anomalies are informational. Blocking on
  them would create false negatives. Future work can explore
  anomaly-triggered re-evaluation.
