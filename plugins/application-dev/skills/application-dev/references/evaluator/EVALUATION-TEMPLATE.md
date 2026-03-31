<!--
WARNING: The scores table format is parsed by appdev-cli.mjs (extractScores
function). Do not change the table column structure, criterion names, or
score format (N/10).

Regex used by extractScores():
  /\|\s*(Product Depth|Functionality|Visual Design)\s*\|\s*(\d+)\/10/gi

Verdict heading is parsed by:
  /##\s*Verdict:\s*(PASS|FAIL)/

This file is a TEMPLATE for CLI compile-evaluation output. The CLI fills in
placeholders at compile time. No agent writes this file directly.
-->

# Evaluation Report -- {product_name}

## Generation Round: {round}

<!-- Verdict is CLI-computed from per-criterion thresholds.
     Product Depth >= 7, Functionality >= 7, Visual Design >= 6.
     FAIL if ANY criterion is below its threshold. -->
## Verdict: {verdict}

A criterion FAILS if its score is below the threshold. The overall verdict is FAIL if ANY criterion fails.

<!-- REGEX-SENSITIVE: The following table is parsed by appdev-cli.mjs
     using the pattern /\|\s*(Product Depth|Functionality|Visual Design)\s*\|\s*(\d+)\/10/gi
     Do not change the criterion names, column structure, or score format. -->
## Scores

| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Product Depth | {pd_score}/10 | 7 | {pd_status} |
| Functionality | {fn_score}/10 | 7 | {fn_status} |
| Visual Design | {vd_score}/10 | 6 | {vd_status} |

## Score Justifications

Each score must cite specific findings from this report. Scores without evidence are invalid.

<!-- NOT regex-parsed: use prose format (not N/10) to avoid colliding with extractScores() -->

| Criterion | Justification |
|-----------|---------------|
| Product Depth | {pd_justification} |
| Functionality | {fn_justification} |
| Visual Design | {vd_justification} |

## Product Depth Assessment

*Source: CLI Ensemble (computed from acceptance test results)*

{pd_assessment}

## Functionality Assessment

*Source: Projection Critic*

{fn_assessment}

## Visual Design Assessment

*Source: Perceptual Critic*

{vd_assessment}

## Priority Fixes for Next Round

*Source: CLI Ensemble (merged from both critics, severity-ordered)*

{priority_fixes}
