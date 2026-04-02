# Phase 11: Scoring Foundation + Perturbation Critic - Research

**Researched:** 2026-04-02
**Domain:** Scoring system extension (3->4 dimensions) + adversarial critic agent definition
**Confidence:** HIGH

## Summary

Phase 11 adds Robustness as a fourth scoring dimension and defines the perturbation-critic agent. The codebase is designed for this extension: the DIMENSIONS constant at appdev-cli.mjs:14 is the single source of truth, and all downstream logic (extractScores regex, computeVerdict thresholds, compile-evaluation assessment sections, total computation) derives from it. Adding a fourth entry propagates automatically to most code paths.

The perturbation-critic agent follows the established agent definition pattern (YAML frontmatter + Information Barrier + Write Restriction + Step 0 + Methodology sections) used by both existing critics. Its tool allowlist mirrors the projection-critic's (including `Bash(npx playwright test *)` for write-and-run adversarial tests). The key differentiator is the boundary rule: perturbation-critic tests EXTREME conditions (beyond spec parameters), while perceptual and projection critics test NORMAL conditions (within spec parameters).

The main risk areas are: (1) the `cmdComputeVerdict` function which hardcodes `--pd`, `--fn`, `--vd` flags and must be updated for `--rb`, (2) the EVALUATION-TEMPLATE.md which hardcodes 3-dimension regex and comments, (3) the test file which hardcodes 3-dimension helpers and assertions across all test suites, and (4) the resume-check logic which outputs "spawn-both-critics" as a string literal rather than deriving from `state.critics`. This last item is Phase 13's concern (ORCH-02) but must be known for planning.

**Primary recommendation:** Organize into 3 plans: (1) DIMENSIONS constant + CLI code changes + test updates, (2) SCORING-CALIBRATION.md Robustness section, (3) perturbation-critic agent definition with methodology boundaries.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Robustness calibration anchors grounded in Ashby's Law of Requisite Variety (1956), Wiener's damping principle (1948), and Christie's robustness-vs-resilience distinction (Cynefin/FRAM)
- Below threshold 5/10 (Undamped + insufficient variety), At threshold 7/10 (Critically damped + adequate variety), Above threshold 9/10 (Overdamped + full variety) -- with full scenario descriptions and boundary explanations
- Methodology boundaries: Perceptual = standard FID (normal visual), Projection = standard FID (normal functional), Perturbation = R-FID (adversarial quality change). Boundary rule: within-spec = perceptual/projection, beyond-spec = perturbation
- Explicit condition-to-owner mapping table (standard breakpoints = Perceptual, below 320px/above 2560px = Perturbation, valid form data = Projection, XSS/extreme inputs = Perturbation, etc.)
- Adversarial test priorities: Must-have (input perturbation, console monitoring under stress, rapid navigation), Important (viewport extremes, error recovery), Stretch (JS disabled)
- Console monitoring runs DURING all other perturbation categories (concurrent, not sequential)
- Robustness ceiling rules table: crash/freeze = max 4, unrecoverable state = max 5, no error handling = max 5, 3+ uncaught exceptions = max 6, console warnings only = max 7. Lowest ceiling wins.
- Finding ID prefix: RB- for Robustness (Claude's discretion confirmed)

### Claude's Discretion
- Exact perturbation-critic agent definition structure and section ordering
- Finding ID prefix convention (research suggests RB- for Robustness)
- Summary.json schema field names and structure (must match universal schema)
- Test file organization for 4-dimension test cases
- Order of adversarial test categories within the agent methodology

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRITIC-01 | New perturbation-critic agent with adversarial testing methodology | Agent definition structure documented from existing critics; tool allowlist pattern established; methodology sections mapped from CONTEXT.md adversarial test priorities |
| CRITIC-02 | Robustness dimension added to DIMENSIONS constant with threshold 6 | DIMENSIONS constant at line 14; all downstream derivation paths identified (extractScores, computeVerdict, compile-evaluation assessmentSections, cmdComputeVerdict); test impacts mapped |
| CRITIC-03 | Robustness ceiling rules and calibration scenarios in SCORING-CALIBRATION.md | Existing file structure analyzed; Robustness section format follows Functionality/Visual Design pattern; calibration scenarios from CONTEXT.md locked decisions |
| CRITIC-04 | Clear methodology boundaries between critics | Boundary rule documented in CONTEXT.md; condition-to-owner table locked; R-FID vs standard FID framing established |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in test runner | node:test | Test framework for appdev-cli.mjs | Already used in test-appdev-cli.mjs; zero dependencies policy |
| Node.js built-in assert | node:assert/strict | Test assertions | Already used; zero dependencies policy |
| @playwright/cli | latest | Browser interaction for perturbation-critic | Already in existing critics' tool allowlists |
| @playwright/test | latest | Write-and-run adversarial tests | Already used by projection-critic for acceptance tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| serve | latest | Static file server for evaluation | Already installed in workspace setup; used by all critics |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright for adversarial tests | Puppeteer | Playwright already standardized; switching adds complexity for no benefit |
| Node built-in test runner | Jest/Vitest | Project has zero npm dependencies policy for appdev-cli.mjs |

**Installation:**
No new packages required. All dependencies already exist in the project.

## Architecture Patterns

### Recommended Change Structure
```
plugins/application-dev/
|-- scripts/
|   |-- appdev-cli.mjs           # DIMENSIONS + cmdComputeVerdict + assessmentSections changes
|   '-- test-appdev-cli.mjs      # All test suites updated from 3 to 4 dimensions
|-- agents/
|   '-- perturbation-critic.md   # NEW: adversarial testing agent definition
|-- skills/application-dev/references/evaluator/
|   |-- SCORING-CALIBRATION.md   # ADD: Robustness ceiling rules + calibration scenarios
|   '-- EVALUATION-TEMPLATE.md   # ADD: Robustness dimension to template
```

### Pattern 1: DIMENSIONS Constant as Single Source of Truth
**What:** All dimension-related logic derives from the DIMENSIONS array at appdev-cli.mjs:14. Adding a new entry automatically propagates through extractScores regex, computeVerdict threshold checks, compile-evaluation score gathering, and total computation.
**When to use:** Always -- this is the established Pitfall 1 prevention pattern.
**Example:**
```javascript
// Source: appdev-cli.mjs:14 (current)
const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
];

// After Phase 11:
const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
  { name: "Robustness", key: "robustness", threshold: 6 },
];
```

### Pattern 2: Agent Definition Structure
**What:** YAML frontmatter (name, description, model, color, tools) followed by role statement, Information Barrier, Write Restriction, Step 0 (static-serve), then methodology sections.
**When to use:** For the new perturbation-critic.md agent.
**Example structure:**
```markdown
---
name: perturbation-critic
description: |
  Use this agent to evaluate a running application's resilience through adversarial testing.
  Spawned by the application-dev orchestrator during evaluation phase.
  Should not be triggered directly by users.
model: inherit
color: yellow
tools: ["Read", "Write", "Bash(npx playwright-cli *)", "Bash(node *appdev-cli* install-dep *)", "Bash(npx playwright test *)", "Bash(node *appdev-cli* static-serve*)"]
---
```

### Pattern 3: Summary.json Universal Schema
**What:** Every critic writes a summary.json with the same base fields: critic, dimension, score, threshold, pass, findings[], ceiling_applied, justification, off_spec_features[].
**When to use:** The perturbation-critic's summary.json must follow this exact schema.
**Example:**
```json
{
  "critic": "perturbation",
  "dimension": "Robustness",
  "score": 7,
  "threshold": 6,
  "pass": true,
  "findings": [
    {
      "id": "RB-1",
      "severity": "Major",
      "title": "Short description",
      "description": "Behavioral symptom under adversarial condition",
      "affects_dimensions": ["Robustness"]
    }
  ],
  "ceiling_applied": null,
  "justification": "Score justification citing findings by ID"
}
```

### Pattern 4: assessmentSections Array Extension
**What:** The assessmentSections array in compile-evaluation maps dimension keys to source labels for EVALUATION.md generation.
**When to use:** Must add a Robustness entry mapping to "Perturbation Critic".
**Example:**
```javascript
// Source: appdev-cli.mjs:1336 (current, 3 entries)
var assessmentSections = [
  { key: "product_depth", name: "Product Depth", source: "CLI Ensemble (computed from acceptance test results)", ... },
  { key: "functionality", name: "Functionality", source: "Projection Critic", ... },
  { key: "visual_design", name: "Visual Design", source: "Perceptual Critic", ... },
];

// After Phase 11 (add 4th entry):
// { key: "robustness", name: "Robustness", source: "Perturbation Critic", ... }
```

### Anti-Patterns to Avoid
- **Hardcoding dimension count:** Never check `=== 3` or `=== 4`. Use `DIMENSIONS.length`. The existing code already does this correctly in most places, but some test helpers and the cmdComputeVerdict function are hardcoded.
- **Overlapping critic methodologies:** The perturbation-critic must NOT test standard breakpoints (360px-1920px) or valid form inputs -- those belong to perceptual and projection critics respectively.
- **Scoring Robustness on happy-path behavior:** Robustness is quality CHANGE under adversarial conditions, not quality itself. A form that works with valid data scores 0 on Robustness relevance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score extraction regex | Custom regex per dimension | DIMENSIONS-derived regex (already exists) | Auto-updates when DIMENSIONS changes |
| Verdict computation | Manual threshold checking | computeVerdict function (already exists) | Single source of truth for pass/fail logic |
| Summary auto-discovery | Hardcoded critic directory names | readdirSync + existsSync pattern (already exists in compile-evaluation) | Automatically discovers any new critic directory |
| Static server management | Custom server code | appdev-cli static-serve (already exists) | Idempotent, concurrent-safe, cleanup-tracked |

**Key insight:** The codebase was deliberately designed for N-critic extensibility. The compile-evaluation auto-discovery pattern and the resume-check dynamic critic list mean most changes are data additions, not logic changes.

## Common Pitfalls

### Pitfall 1: cmdComputeVerdict Hardcoded Flags
**What goes wrong:** The `cmdComputeVerdict` function at appdev-cli.mjs:1193-1207 accepts `--pd`, `--fn`, `--vd` as hardcoded flags. Adding Robustness requires adding `--rb` and updating the validation and score object construction.
**Why it happens:** This CLI convenience function was written for 3 dimensions and uses shorthand flag names.
**How to avoid:** Add `--rb` parameter parsing, update the `isNaN` check to include it, add `robustness` to the scores object. Consider whether to keep shorthand flags or switch to a more extensible approach.
**Warning signs:** compute-verdict tests fail with "Missing required arguments" error.

### Pitfall 2: Scope Overlap Between Critics (Phase Pitfall 2)
**What goes wrong:** The perturbation-critic tests responsive behavior at standard breakpoints, duplicating the perceptual-critic's work. Or it tests form submission with valid data, duplicating the projection-critic.
**Why it happens:** Adversarial testing boundaries are not clear in the agent definition.
**How to avoid:** Embed the boundary rule directly in the perturbation-critic agent definition: "If the condition is within the spec's stated parameters, it belongs to perceptual or projection. If it pushes beyond spec parameters, it is perturbation." Include the condition-to-owner table from CONTEXT.md.
**Warning signs:** Duplicate finding IDs (VD-* and RB-* for the same issue), overlapping test scenarios in different critic outputs.

### Pitfall 3: Robustness Calibration Gap (Phase Pitfall 5)
**What goes wrong:** The perturbation-critic scores without anchored calibration scenarios, leading to inconsistent scoring across rounds and runs.
**Why it happens:** Ceiling rules exist but no concrete scenario examples to anchor what a 5 vs 7 vs 9 looks like.
**How to avoid:** Write the SCORING-CALIBRATION.md Robustness section BEFORE the perturbation-critic agent definition. The agent definition references calibration scenarios; they must exist first.
**Warning signs:** Robustness scores cluster at 7 (threshold anchoring) across different quality levels.

### Pitfall 4: Test Helpers Hardcoded for 3 Dimensions
**What goes wrong:** The test file has `make3DimReport(pd, fn, vd)` and `make4DimReport(pd, fn, vd, cq)` helpers. The "4-dim" helper is for the OLD retired dimension (Code Quality), not the new Robustness dimension. Tests that create reports with only 3 dimensions will fail after DIMENSIONS is updated to 4.
**Why it happens:** Test helpers were written for the current dimension count.
**How to avoid:** Update `make3DimReport` to become a 4-dimension helper that includes Robustness. Rename the existing `make4DimReport` (Code Quality rejection test) to something like `makeOld4DimReport` for clarity. Update all test assertions (total should be max 40, not 30).
**Warning signs:** Almost every test in the file fails simultaneously after DIMENSIONS update.

### Pitfall 5: EVALUATION-TEMPLATE.md Regex Comment Drift
**What goes wrong:** The EVALUATION-TEMPLATE.md contains a regex comment that documents what extractScores parses: `/\|\s*(Product Depth|Functionality|Visual Design)\s*\|\s*(\d+)\/10/gi`. After adding Robustness, this comment becomes stale documentation.
**Why it happens:** The template comment is a human-readable description of the runtime regex, not the runtime regex itself.
**How to avoid:** Update the regex comment in EVALUATION-TEMPLATE.md to include Robustness. Also update the Scores table, Score Justifications table, and add a Robustness Assessment section.
**Warning signs:** Developers reading the template get confused about supported dimensions.

### Pitfall 6: assessmentSections Robustness Justification Source
**What goes wrong:** The compile-evaluation function builds assessment sections by looking up justifications from `dimJustifications[dim.name]`. For Robustness, the justification comes from the perturbation-critic's summary.json `justification` field with dimension name "Robustness". This works automatically IF the perturbation-critic writes `"dimension": "Robustness"` (exact name match with DIMENSIONS entry).
**Why it happens:** The dimension name string is the join key between summary.json and DIMENSIONS.
**How to avoid:** Ensure the perturbation-critic agent definition specifies `"dimension": "Robustness"` exactly matching the DIMENSIONS entry `{ name: "Robustness", ... }`.
**Warning signs:** Robustness assessment section shows "No Robustness summary found" in compiled EVALUATION.md.

## Code Examples

Verified patterns from the existing codebase:

### DIMENSIONS Constant Addition
```javascript
// Source: appdev-cli.mjs:14 -- add as 4th entry
const DIMENSIONS = [
  { name: "Product Depth", key: "product_depth", threshold: 7 },
  { name: "Functionality", key: "functionality", threshold: 7 },
  { name: "Visual Design", key: "visual_design", threshold: 6 },
  { name: "Robustness", key: "robustness", threshold: 6 },
];
```

### cmdComputeVerdict Update
```javascript
// Source: appdev-cli.mjs:1193 -- must add --rb parameter
function cmdComputeVerdict(argv) {
  const args = parseArgs(argv);
  var pd = parseInt(args.pd, 10);
  var fn = parseInt(args.fn, 10);
  var vd = parseInt(args.vd, 10);
  var rb = parseInt(args.rb, 10);

  if (isNaN(pd) || isNaN(fn) || isNaN(vd) || isNaN(rb)) {
    fail("Missing required arguments: --pd <N> --fn <N> --vd <N> --rb <N>");
  }

  var scores = { product_depth: pd, functionality: fn, visual_design: vd, robustness: rb };
  var verdict = computeVerdict(scores);

  output({ verdict: verdict, scores: scores });
}
```

### assessmentSections Extension
```javascript
// Source: appdev-cli.mjs:1336 -- add 4th entry
var assessmentSections = [
  { key: "product_depth", name: "Product Depth", source: "CLI Ensemble (computed from acceptance test results)", justification: pdResult.justification, ceiling: pdResult.ceiling_applied },
  { key: "functionality", name: "Functionality", source: "Projection Critic", justification: dimJustifications["Functionality"] || "" },
  { key: "visual_design", name: "Visual Design", source: "Perceptual Critic", justification: dimJustifications["Visual Design"] || "" },
  { key: "robustness", name: "Robustness", source: "Perturbation Critic", justification: dimJustifications["Robustness"] || "" },
];
```

### Test Helper Update Pattern
```javascript
// Current: make3DimReport(pd, fn, vd) -- must become 4-dim
function make4DimReport(pd, fn, vd, rb) {
  return [
    "# Evaluation Report",
    "",
    "## Verdict: PASS",
    "",
    "## Scores",
    "",
    "| Criterion | Score | Threshold | Status |",
    "|-----------|-------|-----------|--------|",
    "| Product Depth | " + pd + "/10 | 7 | " + (pd >= 7 ? "PASS" : "FAIL") + " |",
    "| Functionality | " + fn + "/10 | 7 | " + (fn >= 7 ? "PASS" : "FAIL") + " |",
    "| Visual Design | " + vd + "/10 | 6 | " + (vd >= 6 ? "PASS" : "FAIL") + " |",
    "| Robustness | " + rb + "/10 | 6 | " + (rb >= 6 ? "PASS" : "FAIL") + " |",
    "",
  ].join("\n");
}

// Old 4-dim (Code Quality) rejection test helper -- rename for clarity
function makeOldCodeQualityReport(pd, fn, vd, cq) {
  // ... existing make4DimReport content for Code Quality rejection tests
}
```

### Perturbation Summary.json Helper for Tests
```javascript
// New test helper for perturbation critic summary
function makePerturbationSummary(score, findings) {
  return {
    critic: "perturbation",
    dimension: "Robustness",
    score: score,
    threshold: 6,
    pass: score >= 6,
    findings: findings || [],
    ceiling_applied: null,
    justification: "Robustness " + score + "/10",
    off_spec_features: [],
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4 dimensions with Code Quality | 3 dimensions (PD, Fn, VD) | v1.1 Phase 7 | Code Quality retired; source code review violated GAN barrier |
| Agent-extracted verdict | CLI-computed verdict | v1.1 Phase 7 | computeVerdict() from DIMENSIONS thresholds |
| Hardcoded critic discovery | Auto-discovery via readdirSync | v1.1 Phase 7 | Any */summary.json auto-discovered by compile-evaluation |

**Deprecated/outdated:**
- Code Quality dimension: Removed in v1.1 because scoring source code violated the GAN information barrier. The `make4DimReport` test helper in tests is a REJECTION test for this old format, not a forward-looking pattern.

## Specific Implementation Details

### Files That Must Change

**appdev-cli.mjs (4 locations):**
1. Line 14: DIMENSIONS array -- add Robustness entry
2. Lines 1193-1207: cmdComputeVerdict -- add --rb flag
3. Lines 1336-1340: assessmentSections -- add Robustness entry
4. Line 1375: Priority Fixes source comment -- update from "both critics" to "all critics"

**test-appdev-cli.mjs (pervasive changes):**
1. Line 65-80: make3DimReport helper -- rename and add Robustness column
2. Line 83-99: make4DimReport helper -- rename to indicate Code Quality rejection test
3. Lines 147-215: extractScores tests -- all assertions change (total 20->27-ish, dimensions 3->4)
4. Lines 222-256: computeVerdict tests -- add Robustness parameter, add Robustness threshold test
5. Lines 276-577: compile-evaluation tests -- all setupRound calls need perturbation summary
6. Lines 672-742: roundComplete tests -- report helpers need Robustness
7. New test: verify perturbation summary.json integration in compile-evaluation

**SCORING-CALIBRATION.md (additions only):**
1. Add Robustness ceiling rules section after Visual Design section
2. Add Robustness calibration scenarios (Below/At/Above threshold)
3. Update "Loaded by" header comment to include perturbation-critic
4. Update "No Averaging or Trading" section to list Robustness threshold: 6

**EVALUATION-TEMPLATE.md (additions only):**
1. Update regex comment to include Robustness
2. Add Robustness row to Scores table
3. Add Robustness row to Score Justifications table
4. Add Robustness Assessment section
5. Update verdict threshold comment to include Robustness >= 6
6. Update Priority Fixes source comment

**perturbation-critic.md (new file):**
1. YAML frontmatter
2. Role statement
3. Information Barrier
4. Write Restriction
5. Step 0: Start Evaluation Server
6. Methodology sections: UNDERSTAND, PERTURB, MONITOR, SCORE, REPORT
7. Finding Format
8. Token Efficiency

### Propagation Analysis

Adding `{ name: "Robustness", key: "robustness", threshold: 6 }` to DIMENSIONS automatically handles:
- extractScores regex construction (line 112-115): auto-includes "Robustness" in pattern
- extractScores expected keys (line 124-126): auto-includes "robustness" key
- extractScores dimension count validation (line 128): auto-checks for 4 dimensions
- extractScores total computation (lines 139-144): auto-sums 4 dimensions
- computeVerdict threshold check (lines 150-158): auto-checks Robustness >= 6
- compile-evaluation dimension score gathering (lines 1283-1296): auto-includes robustness key
- compile-evaluation scores table rows (lines 1326-1333): auto-adds Robustness row

Does NOT automatically handle (manual changes needed):
- cmdComputeVerdict (lines 1193-1207): hardcoded --pd/--fn/--vd flags
- assessmentSections (lines 1336-1340): hardcoded 3-entry array
- EVALUATION-TEMPLATE.md: hardcoded regex comment and table
- Test helpers: hardcoded report generators
- SCORING-CALIBRATION.md: no Robustness section exists

## Open Questions

1. **compile-evaluation Robustness score source**
   - What we know: Product Depth is computed by CLI from acceptance_tests. Visual Design and Functionality come from critic summary.json `score` field.
   - What's unclear: Robustness score should come directly from perturbation-critic's summary.json `score` field, same as Functionality and Visual Design. The existing code path handles this automatically via `dimScores[dimName]` lookup.
   - Recommendation: No special handling needed. The perturbation-critic writes `"dimension": "Robustness"` and the existing auto-discovery + dimension lookup handles it.

2. **resume-check "spawn-both-critics" string literal**
   - What we know: The resume-check outputs "spawn-both-critics" at line 775 even when `expectedCritics` has more than 2 entries. Phase 13 (ORCH-02) handles generalizing this.
   - What's unclear: Should Phase 11 update this, or leave it for Phase 13?
   - Recommendation: Leave for Phase 13. Phase 11's scope is scoring + agent definition. The orchestrator still spawns 2 critics in Phase 11; Phase 13 adds the third spawn.

3. **Threshold for Robustness: 6 vs 7**
   - What we know: CONTEXT.md specifies threshold 6. The calibration anchors use 7/10 as "at threshold" but the DIMENSIONS threshold is 6 (meaning 6 is the minimum pass score).
   - What's unclear: Nothing -- this is consistent. "At threshold" calibration scenario (7/10) is above the pass threshold (6). The pass threshold means "6 is the minimum acceptable score." The calibration scenario shows what "adequate" (7) looks like.
   - Recommendation: Use threshold 6 as specified. This matches Visual Design's pattern (threshold 6, calibration "at threshold" is 6/10).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None -- tests run directly via `node --test` |
| Quick run command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| Full suite command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRITIC-01 | Perturbation-critic agent definition exists with correct YAML frontmatter | manual-only | Visual inspection of agents/perturbation-critic.md | -- Wave 0 (new file) |
| CRITIC-02 | DIMENSIONS includes Robustness with threshold 6; extractScores parses 4 dims; computeVerdict checks 4 thresholds; compile-evaluation produces 4-dimension EVALUATION.md | unit | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` | -- existing file, tests must be updated |
| CRITIC-03 | SCORING-CALIBRATION.md contains Robustness ceiling rules and calibration scenarios | manual-only | Visual inspection of SCORING-CALIBRATION.md | -- existing file, content added |
| CRITIC-04 | Methodology boundaries prevent overlap | manual-only | Review perturbation-critic.md boundary rule section | -- Wave 0 (new file) |

### Sampling Rate
- **Per task commit:** `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Per wave merge:** `node --test plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Update test helpers in `test-appdev-cli.mjs` from 3 to 4 dimensions (part of CRITIC-02 implementation)
- [ ] Add new test cases for Robustness score extraction, verdict computation, and assessment section generation
- [ ] Add compile-evaluation test with perturbation summary.json (3-critic scenario)

*(Test infrastructure exists. Gaps are new test cases, not framework setup.)*

## Sources

### Primary (HIGH confidence)
- appdev-cli.mjs source code -- DIMENSIONS constant, extractScores, computeVerdict, compile-evaluation, cmdComputeVerdict, assessmentSections
- test-appdev-cli.mjs source code -- all test suites, helper functions, assertion patterns
- SCORING-CALIBRATION.md -- existing structure, ceiling rules format, calibration scenario format
- EVALUATION-TEMPLATE.md -- regex comments, table structure, assessment section pattern
- perceptual-critic.md -- agent definition structure, YAML frontmatter, methodology sections
- projection-critic.md -- agent definition structure, tool allowlist, write-and-run pattern
- 11-CONTEXT.md -- all locked decisions, calibration anchors, methodology boundaries, ceiling rules

### Secondary (MEDIUM confidence)
- SKILL.md orchestrator -- resume-check dispatch, critic spawn pattern, error recovery
- PLAYWRIGHT-EVALUATION.md -- eval-first, write-and-run, console filtering techniques

### Tertiary (LOW confidence)
None -- all findings are from direct source code analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - direct codebase analysis, zero external dependencies
- Architecture: HIGH - extending established patterns with clear propagation paths
- Pitfalls: HIGH - identified from code review of hardcoded values and test helpers

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable internal codebase, no external API changes)
