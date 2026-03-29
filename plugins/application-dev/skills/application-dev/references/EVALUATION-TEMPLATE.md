<!--
WARNING: The scores table format and verdict heading are parsed by
appdev-cli.mjs (extractScores function). Do not change the table column
structure, criterion names, score format (N/10), or verdict heading format
(## Verdict: PASS/FAIL).
-->

# Evaluation Report -- <Product Name>

## Generation Round: <N>

<!-- REGEX-SENSITIVE: The following heading is parsed by appdev-cli.mjs
     using the pattern /##\s*Verdict:\s*(PASS|FAIL)/
     Do not change the heading format. -->
## Verdict: <PASS or FAIL>

A criterion FAILS if its score is below the threshold. The overall verdict is FAIL if ANY criterion fails.

<!-- REGEX-SENSITIVE: The following table is parsed by appdev-cli.mjs
     using the pattern /\|\s*(Product Depth|Functionality|Visual Design|Code Quality)\s*\|\s*(\d+)\/10/gi
     Do not change the criterion names, column structure, or score format. -->
## Scores

| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Product Depth | X/10 | 7 | PASS/FAIL |
| Functionality | X/10 | 7 | PASS/FAIL |
| Visual Design | X/10 | 6 | PASS/FAIL |
| Code Quality | X/10 | 6 | PASS/FAIL |

## Score Justifications

Each score must cite specific findings from this report. Scores without evidence are invalid.

| Criterion | Justification |
|-----------|---------------|
| Product Depth | <score>/10 -- <cite specific feature statuses, missing features, stubbed features> |
| Functionality | <score>/10 -- <cite specific bug counts by severity, broken workflows> |
| Visual Design | <score>/10 -- <cite specific design observations, spec match/mismatch> |
| Code Quality | <score>/10 -- <cite specific code issues, patterns, security concerns> |

## Product Depth Assessment

<For each feature in the spec, state its status:>

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Feature Name | Implemented / Partial / Missing / Broken | Brief explanation |
| 2 | Feature Name | ... | ... |
| ... | ... | ... | ... |

**Scoring "Partial" strictly:** Partial is not a safe middle ground. If the missing part of a feature is essential to its purpose, treat it as Broken. A form that submits but does not validate is Broken, not Partial. A dashboard missing one optional widget is Partial. Ask: "Can a user accomplish the feature's core purpose?" If no, it is Broken.

<Detailed commentary on feature coverage. What is missing? What is superficial?>

## Functionality Assessment

<Describe what you tested and exactly what happened. Be specific about failures.>

### Bugs Found

1. **<Bug title>**
   - **Steps to reproduce:** <exact steps>
   - **Expected:** <what should happen>
   - **Actual:** <what actually happens>
   - **Severity:** Critical / Major / Minor

2. **<Bug title>**
   - ...

(List ALL bugs found, not just a few examples.)

**Group related issues under a shared root cause when possible.** If multiple symptoms trace back to one underlying problem (e.g., four layout issues caused by one broken flex container), group them and identify the root cause. This helps the Generator fix the cause instead of chasing symptoms.

## Visual Design Assessment

<Does the design match the spec's design language? Is it distinctive or generic? Specific observations about color, typography, layout, spacing, and overall identity. Note any AI-slop patterns: purple gradients on white cards, generic hero sections, excessive shadows, default component library look.>

## Code Quality Assessment

<Project structure, code patterns, consistency, error handling, dependency choices. Specific observations, not vague praise.>

## Asset Validation

### Network Issues

| # | URL | Type | Issue | Severity |
|---|-----|------|-------|----------|
| 1 | <url> | image/font/script/style | <4xx/5xx/CORS/timeout/soft-404> | Critical/Major/Minor |

### Visual Inspection

| # | URL | Dimensions | Findings | Verdict |
|---|-----|-----------|----------|---------|
| 1 | <url> | WxH | <watermark/placeholder/quality/relevance/AI artifacts> | OK/Flag |

### Duplicate Detection

<Perceptual hash clusters. For each cluster: list images, context judgment (legitimate reuse vs lazy duplication), verdict.>

### Fonts

<Failed font requests from network log. Typography mismatch with spec's design language.>

### Meta Assets

<Favicon, og:image, apple-touch-icon, manifest icons. Present/missing/broken status.>

### Summary

- Total images inspected: N
- Placeholders detected: N
- Broken/blocked resources: N
- Duplicate clusters: N
- Overall asset health: <assessment>

## AI Feature Probing

### <AI Feature Name>

**Claimed capability:** <from SPEC.md>
**Modality:** <input -> output type>

#### Behavioral Probes (Tier 1)

| # | Probe | Input Summary | Response Summary | Canned Signal? |
|---|-------|---------------|------------------|----------------|
| 0 | Variability (x3) | <same prompt 3x> | <identical/varied> | <Yes/No> |
| 1 | Domain question | <domain input> | <response> | <Yes/No> |
| ... | ... | ... | ... | ... |

#### Technical Signals (Tier 2)

- Network: <API calls observed? To where?>
- Latency: <response timing pattern>
- Browser API: <window.ai / navigator.ml present?>
- Loading UX: <indicator/progress/streaming present?>

#### Verdict: <Real AI / Canned / Hybrid>

<Rationale citing specific probe results. If canned: Product Depth ceiling applies.>
<If real AI: quality assessment (accuracy, relevance, coherence, helpfulness).>
<If hybrid: which parts are real, which are canned.>

(Repeat for each AI feature in SPEC.md)

## Console & Errors

### Console Errors

| # | Page/Action | Error | Count | Severity |
|---|-------------|-------|-------|----------|
| 1 | <page or action> | <error message> | N | Critical/Major/Minor |

### Uncaught Exceptions

| # | Page/Action | Exception | Stack Trace Summary |
|---|-------------|-----------|---------------------|
| 1 | <page or action> | <exception> | <key frames> |

### Failed Requests

| # | URL | Method | Status | Page/Action |
|---|-----|--------|--------|-------------|
| 1 | <url> | GET/POST | <status code> | <context> |

<Saved to evaluation/round-N/network.log (failures only).>

## Off-Spec Features

Features found in the application that are NOT in SPEC.md.

| # | Feature | In SPEC.md? | Scoring Impact |
|---|---------|-------------|----------------|
| 1 | <feature name> | No | Product Depth: <impact>, Code Quality: <impact> |

- Off-spec features are penalized in Product Depth (misallocated effort) and Code Quality (YAGNI violation)
- Bugs from off-spec features count normally in Functionality
- Canned off-spec AI features: Major bug + Product Depth + Code Quality penalty
- Feature count decrease from removing off-spec features between rounds is NOT a regression

## Regressions (Rounds 2+ Only)

<If this is round 2 or later, list any regressions -- features or behaviors that worked in the previous round but are now broken. If no regressions, state "No regressions detected.">

| Previously Working | Now Broken | Likely Cause |
|--------------------|------------|--------------|
| <feature/behavior> | <what fails> | <git diff context> |

## Priority Fixes for Next Round

<If verdict is FAIL, list the fixes most likely to move scores above thresholds, in priority order:>

1. **<Highest priority fix>** -- <which criterion it improves and why>
2. **<Next priority fix>** -- ...
3. ...
