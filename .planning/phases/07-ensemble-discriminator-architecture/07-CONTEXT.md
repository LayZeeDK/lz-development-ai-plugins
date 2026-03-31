# Phase 7: Ensemble Discriminator Architecture - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the monolithic Evaluator agent (392 lines, 15 steps, crashes at ~200
tool calls / ~400K tokens) with 2 parallel WGAN critics and a deterministic CLI
ensemble aggregator. Each critic scores one dimension in its own isolated context
(~60K tokens max). The CLI computes Product Depth and assembles EVALUATION.md.
No single agent exceeds safe context limits.

**Requirements:** ENSEMBLE-01..10, BARRIER-01..04 (14 total)

</domain>

<decisions>
## Implementation Decisions

### Naming convention: technique-based from GAN taxonomy

Critics are named by their **primary discriminator technique** from the GAN
discriminator taxonomy (`.planning/research/gan-discriminator-taxonomy.md`).
The filename IS the taxonomy reference -- traceable from agent name to taxonomy
section.

**v1.1 agents:**
- `perceptual-critic` (Section 7.3: Perceptual + Multi-Scale + Style) -- scores Visual Design
- `projection-critic` (Section 3.3: Projection + ProjectedGAN 7.1) -- scores Functionality

**Future agents follow the same convention:**
- v1.2: `spectral-critic` (Section 11.1) -- Robustness
- v2.0: `semantic-critic` (Section 24.x) -- Content Fidelity
- v2.0: `fairness-critic` (Section 21.1) -- Accessibility

The full technique stack (primary + secondary patterns) is documented in
ROADMAP.md's WGAN Critic Roadmap table. Agent filename carries the primary
technique only.

**Rationale (GAN taxonomy):** Technique-based naming scales to any taxonomy
entry. Dimension-based naming breaks when multiple techniques serve the same
dimension. Metric-based naming (precision/recall) only has 2 values and is
already inconsistent in the current roadmap. The naming dictionary IS the
taxonomy.

**Action required:** Update ROADMAP.md's WGAN Critic Roadmap table and all
references from `precision-critic`/`recall-critic` to
`perceptual-critic`/`projection-critic`.

### Critic count: 2 agents + CLI aggregator

Exactly 2 critic agents for Phase 7, plus CLI `compile-evaluation` as the
deterministic ensemble aggregator.

- `perceptual-critic` -- Visual Design dimension
- `projection-critic` -- Functionality dimension
- CLI `compile-evaluation` -- Product Depth (computed from acceptance test pass/fail)

**Rationale (GAN theory):** GAN Precision and Recall (Kynkaanniemi et al., 2019)
are the two fundamental complementary axes for evaluating generative models --
orthogonal and complete. Every v1.1 evaluation concern maps to one of these axes.
Product Depth is derived from recall's acceptance test results, not independently
evaluated.

**Rationale (crash fix):** Two contexts at ~60K each gives 3x safety margin
over the crash threshold. Token-efficient patterns (eval-first for perceptual,
write-and-run for projection) keep each critic lean.

**Rationale (extensibility):** summary.json contract supports N critics. v1.2
adds `spectral-critic` as the third. Progressive ensemble growth -- analogous to
ProGAN's (18.1) progressive training.

### Evaluator capability decomposition across ensemble

The monolithic evaluator's 15 steps decompose across the ensemble. No dedicated
steps survive -- capabilities emerge from each actor's methodology.

**perceptual-critic owns (Precision axis):**
- Visual assessment via eval-first + screenshots at key viewpoints (TOKEN-02)
- Responsive testing via resize + eval (Multi-Scale discriminator 1.3)
- AI slop detection (Perceptual discriminator 7.3 -- authenticity assessment)
- Asset quality: placeholder detection, watermark detection, perceptual hash
  duplicate detection, font styling consistency (Perceptual + Multi-Scale + Style)
- Visual regression: comparing current visual state to prior round observations
- Console errors filtered for visual-relevant issues (TOKEN-04)

**projection-critic owns (Recall axis):**
- Feature testing via write-and-run acceptance tests (Projection discriminator 3.3)
- AI feature probing -- real vs canned detection (InfoGAN 4.1 -- mutual information)
- API endpoint testing via dedicated `playwright-api-testing` skill (see below)
- Off-spec feature detection via SPEC.md-to-app mapping (Projection -- spec conformance)
- Asset coverage: broken URLs as acceptance test failures (Coverage)
- Behavioral regression: re-running acceptance tests from prior round (PLAYWRIGHT-06)
- Console errors filtered for functional-relevant issues (TOKEN-04)

**CLI owns (deterministic, zero LLM tokens):**
- Product Depth computation from acceptance test pass/fail
- Score trajectory analysis and escalation detection (Temporal discriminator 9.x)
- URL validation via existing `appdev-cli check-assets`
- EVALUATION.md compilation from summary.json files
- Priority Fixes assembly (severity-ordered across both critics)

**Orchestrator owns:**
- Dev server lifecycle: start before evaluation, verify port, reuse on resume (RECOVERY-03)

**Removed (GAN information barrier):**
- Code review (old Step 10) -- requires source code access, violates BARRIER-01
- Code Quality scoring -- see "Code Quality retirement" below

**Rationale (GAN taxonomy):** Asset validation decomposes per discriminator type:
Perceptual (7.3) catches visual quality defects, Multi-Scale (1.3) catches
responsive issues, Projection (3.3) catches coverage gaps through acceptance
tests, and the CLI handles deterministic URL checking. No monolithic "asset
validation step" -- coverage emerges from the ensemble.

### New skill: playwright-api-testing

The projection-critic uses two complementary evaluation tools:
1. `playwright-testing` skill (existing) -- browser-based write-and-run acceptance
   tests from SPEC.md criteria
2. `playwright-api-testing` skill (new) -- browserless API contract validation via
   Playwright's `APIRequestContext`

**Key patterns from Playwright API testing docs:**
- `APIRequestContext` sends HTTP from Node.js directly -- no browser, milliseconds
  per request
- JSON schema validation via AJV for structural contract checking (mechanical,
  not LLM-subjective)
- `storageState` sharing: auth once via API, reuse in browser context (efficient
  for authenticated apps)
- `expect.poll()` for eventual consistency without brittle sleep loops
- Hybrid cross-validation: create data via API, verify it renders in UI (catches
  defects invisible to either layer alone)

**Scope note:** Skill creation may straddle Phase 7 (architecture -- projection-critic
needs this tool) and Phase 8 (Playwright patterns -- PLAYWRIGHT-01..06). The
planner should scope appropriately.

### Code Quality dimension: retired entirely

Code Quality (threshold 6) is dropped as a scoring dimension. No redistribution
of ceiling rules. The dimension count moves from 4 to 3: Product Depth (7),
Functionality (7), Visual Design (6).

**Rationale (GAN information barrier):** Code Quality required source code access
(old Step 10: "Read the source code to assess quality"). BARRIER-01 bans source
code access. This is a deliberate cybernetic variety reduction (Ashby's Law) --
constraining the discriminator to judge output, not implementation. The old
evaluator reading source code was "reaching past the interface" into the
Generator's domain.

**Product-surface symptoms are already covered:**
- Console errors: both critics via TOKEN-04
- Error state handling: projection-critic's acceptance tests (SPEC-02 requires
  error state criteria per feature)
- Visual error states: perceptual-critic via screenshots
- Performance issues: both critics observe response times, frozen UI

**Future path:** Generator's internal CI checks (via `playwright-testing` and
`vitest-browser` skills) can be extended in future phases to catch code quality
concerns at the source -- where they belong in a GAN architecture.

### Generator feedback format: unified EVALUATION.md

CLI `compile-evaluation` produces a single EVALUATION.md that the Generator
reads. The Generator never sees summary.json files. The ensemble is invisible
to the Generator.

**Structure:**
1. Verdict (CLI-determined)
2. Scores table (3 dimensions, CLI-assembled)
3. Product Depth Assessment (CLI-computed from acceptance test pass/fail)
4. Functionality Assessment (from projection-critic summary.json, attributed:
   "Source: Projection Critic")
5. Visual Design Assessment (from perceptual-critic summary.json, attributed:
   "Source: Perceptual Critic")
6. Priority Fixes for Next Round (CLI-assembled: merged from both critics,
   ordered by severity descending, then by distance-below-threshold for
   maximum marginal impact)

**Rationale (GAN ensemble):** GMAN (12.1) pattern -- individual discriminator
signals are aggregated before being fed back to the generator. The generator
receives one coherent feedback signal, not multiple conflicting ones.

### summary.json contract: fixed outer schema, flexible inner content

The data contract between critics and CLI follows ProjectedGAN (7.1) pattern --
uniform interface between each discriminator and the aggregator.

**Directory structure:**
```
evaluation/round-N/
  perceptual/summary.json    <- perceptual-critic writes
  projection/summary.json    <- projection-critic writes
  EVALUATION.md              <- CLI compiles from both
```

Directory names match GAN technique names from the taxonomy (same as agent
filenames).

**Universal schema fields (every critic writes):**
- `critic` -- taxonomy technique name ("perceptual", "projection", future "spectral")
- `dimension` -- scoring dimension ("Visual Design", "Functionality")
- `score` -- 1-10 continuous WGAN score
- `threshold` -- pass threshold for this dimension
- `pass` -- boolean (score >= threshold)
- `findings[]` -- structured array:
  - `id` -- unique ID (e.g., "VD-1", "FN-3")
  - `severity` -- "Critical" / "Major" / "Minor"
  - `title` -- short description
  - `description` -- actionable detail for Generator
  - `affects_dimensions[]` -- enables cross-criterion propagation
- `ceiling_applied` -- which ceiling rule capped the score, if any
- `justification` -- score justification citing findings by ID
- `off_spec_features[]` -- features found in app but not in SPEC.md (optional)

**Projection-critic extension (for Product Depth):**
- `acceptance_tests` -- { total, passed, failed, skipped, results[] }
  - Each result: { feature, criteria, status, details }
  - CLI reads this to compute Product Depth score deterministically

**Extensibility proof:** `compile-evaluation` globs `evaluation/round-N/*/summary.json`.
Each uses the same outer schema. Adding `spectral/summary.json` in v1.2 requires
zero CLI code changes. Directory name = GAN technique = taxonomy reference.

### Claude's Discretion

- Exact summary.json field names and JSON structure (schema above is guidance,
  not specification)
- perceptual-critic and projection-critic agent definition structure and line
  count (target: <150 lines each, compact per SkillsBench)
- `compile-evaluation` Product Depth scoring formula (must be deterministic
  from acceptance test pass/fail)
- `install-dep` mutex implementation details (file-based, ENSEMBLE-04)
- EVALUATION-TEMPLATE.md redesign for CLI-compiled output
- SCORING-CALIBRATION.md updates for 3 dimensions
- Priority Fixes ordering algorithm details

</decisions>

<specifics>
## Specific Ideas

- Technique-based naming must be reflected in ROADMAP.md's WGAN Critic Roadmap
  table across v1.1, v1.2, and v2.0 sections
- `playwright-api-testing` skill based on Playwright's APIRequestContext docs
  (https://playwright.dev/docs/api-testing) -- browserless, AJV schema validation,
  storageState sharing, expect.poll(), hybrid API+browser cross-validation
- Asset validation is NOT a monolithic step -- it decomposes across the ensemble
  per GAN discriminator type (Perceptual catches visual defects, Projection catches
  coverage failures, CLI handles URL checking)
- The GAN information barrier is a deliberate cybernetic variety reduction, not a
  limitation -- Code Quality retirement is the barrier working as designed

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `appdev-cli.mjs` (709 lines, 9 subcommands): State management, score extraction,
  escalation computation, trajectory analysis. Needs 2 new subcommands
  (`compile-evaluation`, `install-dep`) and score regex update (4 -> 3 dimensions)
- `appdev-cli check-assets`: Existing deterministic URL checker. Can feed into
  `compile-evaluation` or be used by perceptual-critic directly
- `EVALUATION-TEMPLATE.md`: Current template with regex-sensitive patterns. Must be
  redesigned as CLI-compiled output with provenance sections
- `SCORING-CALIBRATION.md`: Current 4-dimension calibration. Must be updated to
  3 dimensions (remove Code Quality, update ceiling rules)
- `AI-SLOP-CHECKLIST.md`: Stays as perceptual-critic reference (unchanged)
- `AI-PROBING-REFERENCE.md`: Stays as projection-critic reference (unchanged)
- `ASSET-VALIDATION-PROTOCOL.md`: Decomposes -- visual quality parts become
  perceptual-critic reference, coverage parts are handled by projection-critic's
  acceptance tests, URL checking stays in CLI
- `playwright-testing` skill: Existing skill used by Generator and projection-critic
  for browser-based testing (plan/generate/heal pattern)

### Established Patterns
- Progressive disclosure: reference files for protocol-heavy content (>30 lines,
  single-step relevance). Apply to critic agent definitions.
- WHY-based rationale over ALL-CAPS emphasis. Apply to critic instructions.
- Two-layer enforcement (tool allowlists + prompt guards). Apply to critic
  allowed-tools.
- Zero-dependency CLI pattern (`appdev-cli.mjs` uses only node:fs and node:path).
  New subcommands must follow this -- no npm dependencies in CLI.
- Orchestrator spawns agents with minimal prompts ("This is evaluation round N.")
  per ENSEMBLE-10.

### Integration Points
- `extractScores()` in appdev-cli.mjs: regex pattern must update from 4 dimensions
  to 3 (remove Code Quality, keep Product Depth + Functionality + Visual Design)
- `computeEscalation()`: total score calculation changes (max 30 instead of 40)
- `determineExit()`: threshold check logic unchanged (per-criterion, not total)
- SKILL.md orchestrator: evaluation phase changes from spawning 1 evaluator to
  spawning 2 critics in parallel + CLI compile step
- `evaluation/round-N/` directory: now contains `perceptual/`, `projection/`,
  and CLI-compiled `EVALUATION.md` instead of a single agent-written report

</code_context>

<deferred>
## Deferred Ideas

- **Generator internal CI extension** for code quality coverage -- future
  phases/milestones can extend the Generator to add more internal CI checks
  (linting, type checking, security scanning) to cover concerns previously
  caught by the Code Quality dimension
- **AI probing as standalone critic** -- InfoGAN (4.1) mutual information
  testing could become a dedicated `infogan-critic` if the probe battery
  grows complex enough (v2.0+ consideration)
- **Hybrid API+browser cross-validation patterns** -- full write-up of
  cross-layer validation (create via API, verify in UI) deferred to Phase 8
  Playwright patterns

</deferred>

---

*Phase: 07-ensemble-discriminator-architecture*
*Context gathered: 2026-03-31*
