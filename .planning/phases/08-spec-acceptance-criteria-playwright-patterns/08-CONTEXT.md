# Phase 8: SPEC Acceptance Criteria + Playwright Patterns - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

SPEC.md gains behavioral acceptance criteria per feature. The projection-critic
generates acceptance tests from these criteria using playwright-testing skill
patterns. Both critics use token-efficient eval-first Playwright patterns
documented in a dedicated reference. CLI gains regression detection across
rounds.

**Requirements:** SPEC-01..05, PLAYWRIGHT-01..06, TOKEN-01..05 (16 total)

</domain>

<decisions>
## Implementation Decisions

### Acceptance criteria format in SPEC-TEMPLATE.md

Bullet assertions, not Given/When/Then or hybrid. Each bullet maps 1:1 to a
Playwright test assertion. GWT adds ~3x token overhead for zero additional
information content. No Cucumber/BDD tooling in the stack.

**Placement:** After User Stories, before Data Model. Reading order: context
(user stories) then testable outcomes (criteria).

**Tier minimums (SPEC-02):**
- Core features: >= 3 criteria (happy path + edge case + error state prescribed)
- Important features: >= 2 criteria (count only, types flexible)
- Nice-to-have features: >= 1 criterion (count only, types flexible)

**Thresholds:** Include measurable thresholds where the SPEC naturally specifies
numbers ("at least 12 artworks", "adapts to 320px"). Do not force synthetic
thresholds on binary behaviors ("clicking opens detail view").

**Behavioral, not prescriptive:** Criteria describe observable outcomes, not UI
elements or implementation. "User can create a new artwork with title, artist,
and image" not "Clicking Add button opens a modal form with title input."

**Error states:** Require the error state exists and describe intent ("shows
validation feedback"), do not prescribe exact message text. Generator chooses
UX copy.

**Persistence:** Explicit when user-facing ("created artwork persists after
page refresh"). Never mention internal mechanism (localStorage, API, etc.).

**Scope rules:**
- Single-feature only -- no cross-feature criteria. Cross-feature testing is
  the projection-critic's job during test generation.
- AI criteria live on the feature that uses AI, not in the AI Integration
  section. AI Integration stays narrative, no criteria.
- Responsive criteria only on features with behavior that changes at different
  viewports. Generic responsive checks are perceptual-critic territory.
- Non-Functional Considerations stay narrative -- no criteria. These guide the
  Generator and perceptual-critic, not the projection-critic.
- Constraints and Non-Goals get no criteria. Off-spec detection in the
  projection-critic already catches unexpected features.

**Inline examples in template:** 2-3 good and 2-3 bad examples directly in
the SPEC-TEMPLATE.md Acceptance Criteria comment block. Teaches by
demonstration.

### Planner criteria guidance (SPEC-04, SPEC-05)

**New reference file:** `references/acceptance-criteria-guide.md` (~50 lines).
Follows Phase 7 progressive disclosure pattern -- planner.md stays compact,
reference holds protocol-heavy content.

**Structure (~50 lines):**
1. What makes criteria testable (~5 lines) -- observable outcome, one assertion
   per bullet, natural thresholds
2. Good vs bad examples (~15 lines) -- 4-5 universal paired examples covering
   display counts, user actions, error states, persistence, responsive
3. Tier rules (~10 lines) -- Core >= 3 with prescribed types, Important >= 2,
   Nice-to-have >= 1
4. Common pitfalls (~10 lines) -- vague qualities, UI-prescriptive, implementation
   leaks, cross-feature criteria
5. AI feature criteria (~5 lines) -- AI outputs are variable, test behavioral
   quality not exact content. 2 good/bad pairs.

**One universal example set.** No domain-specific sets (visual apps, CLI tools,
etc.). The planner adapts universal examples to the specific product.

**Consumer-agnostic.** The guide says "criteria must be verifiable by automated
tests" without naming the projection-critic, Playwright, or write-and-run.
Planner shouldn't know evaluation internals (GAN separation).

**Planner reading order:** Read acceptance-criteria-guide.md AFTER writing
features with user stories, BEFORE adding Acceptance Criteria per feature.
Same pattern as reading frontend-design-principles.md before Visual Design.

**Brief WHY in planner.md:** One sentence explaining that acceptance criteria
drive automated acceptance tests, then a Read instruction pointing to the
guide. No mention of the ensemble architecture.

**Self-verification (SPEC-05):** Add 2 checklist items to planner.md's
existing self-verification:
1. Every feature has an Acceptance Criteria section
2. Core features have >= 3 criteria (happy path + edge case + error state);
   Important >= 2; Nice-to-have >= 1. No vague qualities, no UI-prescriptive
   criteria, no implementation details.

### PLAYWRIGHT-EVALUATION.md reference design (TOKEN-01)

**Form:** Reference file, not a skill. Located at
`references/evaluator/PLAYWRIGHT-EVALUATION.md` alongside AI-SLOP-CHECKLIST.md,
AI-PROBING-REFERENCE.md, and SCORING-CALIBRATION.md. Technique guidance loaded
on demand by critics during their methodology steps.

**One shared reference, organized by technique.** Both critics read it; each
critic's agent definition specifies which sections to focus on. This follows
the ProjectedGAN (7.1) shared-feature-extractor pattern -- shared lower-level
techniques (how to interact with the browser efficiently), independent
higher-level scoring (what to look for, in critic-specific references).

Rationale for one file over separate per-critic files: evaluation techniques
(eval-first, write-and-run) are reusable across critics. At v2.0 with 5+
critics, per-critic files create O(N*M) duplication (eval-first in 3 files,
write-and-run in 3-4 files). One file provides O(1) maintenance.

**Technique-pure.** No "Used by" annotations -- follows dependency inversion
(lower-level component doesn't know its consumers). Each critic's agent
definition declares which sections to read.

**Sections:**
- eval-first: structured JSON via playwright-cli eval, token rationale
- write-and-run: 5-step workflow + skeleton acceptance test file showing
  criteria-to-test mapping
- snapshot-as-fallback: selector discovery only
- resize+eval: viewport resize then eval for responsive checks
- console filtering: console error (filtered), not console (all)
- test healing (evaluation context): re-snapshot, update selectors, re-run.
  Selector failures = test maintenance, assertion failures = real findings.
  Critics never fix the app (not the Generator's heal loop).
- round 2+ test reuse: reuse/heal/regenerate decision tree (see below)

**Depth per section:** Pattern description (brief WHY for token efficiency) +
2-3 concrete playwright-cli command examples. No specific token counts (they
vary by page). No JSON reporter format documentation (Playwright does not
follow semver -- format can change in any minor release; critics read actual
output).

**Wiring:** Out of scope for the reference itself. Phase 8 plan tasks update
critic agent definitions to include the Read instruction pointing to relevant
sections.

### Acceptance test reuse in rounds 2+ (PLAYWRIGHT-06)

**Always re-run existing tests first.** Round 2+ starts by copying
acceptance-tests.spec.ts from evaluation/round-{N-1}/projection/ to
evaluation/round-N/projection/, then running. Results show what changed: new
passes (fixed), new failures (broken), same failures (unfixed). Cost: 2 tool
calls for a strong signal.

**Reuse/heal/regenerate decision tree:**
- Reuse when: all tests pass OR tests fail on assertions only (behavior
  changed, structure intact -- report failures as findings)
- Heal when: 1-2 selector timeouts (minor UI rename/move -- re-snapshot,
  update selectors, re-run)
- Regenerate when: multiple selector timeouts or >50% tests fail on timeouts
  (major UI restructure -- full write-and-run from SPEC.md + fresh snapshot)

**No new tests in rounds 2+.** Round 1 writes acceptance tests covering all
SPEC.md criteria. Rounds 2+ reuse that set. SPEC.md is fixed after planning,
so criteria don't change. Consistent tests = consistent measurement =
meaningful CLI trajectory analysis.

**Projection-critic only.** Perceptual-critic re-evaluates the visual surface
fresh each round (eval + screenshot are cheap). No persistent test artifacts
to reuse.

**Round discovery:** Orchestrator passes round number ("This is evaluation
round N." per ENSEMBLE-10). Critic derives paths via arithmetic:
output = evaluation/round-N/projection/, prior = evaluation/round-{N-1}/
projection/. Round 1: no prior directory, write fresh tests.

**Missing prior tests fallback:** If round N-1 has no acceptance-tests.spec.ts
(critic crashed or was skipped), fall back to round 1 behavior (write fresh
tests from SPEC.md + snapshot). Full crash recovery is Phase 9 scope.

**Regression detection in CLI, not critic.** The projection-critic scores each
round independently -- no cross-round comparison logic. The CLI owns temporal
analysis (Phase 7 decision: temporal discriminator 9.x). CLI compares round N
vs round N-1 acceptance_tests.results in summary.json, flags PASS->FAIL
regressions in EVALUATION.md. This mirrors GAN training: the discriminator
judges a single sample, the training loop manages trajectory.

**Each round directory is self-contained.** Copy tests to new round directory
before running. Clean audit trail -- diff round N-1 vs round N tests to see
what changed. Prior rounds are immutable after completion.

### Claude's Discretion

- Exact content and wording of the 4-5 good/bad example pairs in the
  acceptance criteria guide
- Exact content of inline examples in SPEC-TEMPLATE.md comment block
- playwright-cli command examples in each PLAYWRIGHT-EVALUATION.md technique
  section
- Skeleton acceptance test file structure and example criteria mapping
- How critic agent definitions reference PLAYWRIGHT-EVALUATION.md sections
  (exact wording of Read instructions)
- Whether ASSET-VALIDATION-PROTOCOL.md needs updating or removal given the
  ensemble decomposition from Phase 7

</decisions>

<specifics>
## Specific Ideas

- Acceptance criteria bullet format directly mirrors Playwright assertions:
  "Gallery displays at least 12 artworks" -> expect(items).toHaveCount({min: 12}).
  The 1:1 mapping is the key design insight -- the planner writes criteria,
  the projection-critic mechanically translates them to tests.
- PLAYWRIGHT-EVALUATION.md is analogous to ProjectedGAN's shared feature
  extractor (7.1): shared lower-level browser interaction techniques,
  independent higher-level scoring in critic-specific references
  (AI-SLOP-CHECKLIST.md, AI-PROBING-REFERENCE.md)
- The round 2+ reuse pattern makes the projection-critic stateless per round
  (like a GAN discriminator with no memory across training steps) while the
  CLI handles all temporal analysis
- Playwright does not follow semver (same as TypeScript, both Microsoft) --
  breaking changes in any minor release. Do not document Playwright JSON
  reporter format in references. Critics read actual output.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SPEC-TEMPLATE.md` (86 lines): Current template with User Stories per
  feature but no Acceptance Criteria section. Needs Acceptance Criteria
  added after User Stories, before Data Model.
- `planner.md` (98 lines): Current planner with self-verification checklist
  (6 items). Needs 2 new checklist items for criteria + Read instruction for
  acceptance-criteria-guide.md.
- `perceptual-critic.md` (111 lines): Already describes eval-first and
  resize+eval in OBSERVE section (~15 lines). Needs Read instruction
  pointing to PLAYWRIGHT-EVALUATION.md eval-first + resize+eval + console
  filtering sections.
- `projection-critic.md` (150 lines): Already describes write-and-run in
  TEST section (~20 lines). Needs Read instruction pointing to
  PLAYWRIGHT-EVALUATION.md write-and-run + snapshot-as-fallback + console
  filtering + round 2+ test reuse sections.
- `playwright-testing` skill: Existing Generator-scoped skill with
  plan/generate/heal pattern and 3 reference files. NOT the target for
  evaluation patterns -- evaluation patterns go in a separate evaluator
  reference.
- `AI-SLOP-CHECKLIST.md`, `AI-PROBING-REFERENCE.md`: Existing critic-specific
  references. Pattern to follow for progressive disclosure.
- `SCORING-CALIBRATION.md`: Existing shared reference (both critics read their
  dimension's section). Precedent for shared references.

### Established Patterns
- Progressive disclosure: reference files for protocol-heavy content (>30 lines,
  single-step relevance). Apply to acceptance-criteria-guide.md and
  PLAYWRIGHT-EVALUATION.md.
- WHY-based rationale over ALL-CAPS emphasis. Apply to all new references.
- Dependency inversion: references are technique-pure, agent definitions
  declare which references/sections to read. Apply to PLAYWRIGHT-EVALUATION.md.
- Zero-dependency CLI pattern. If CLI gains regression detection, use only
  node:fs and node:path.
- Orchestrator spawns critics with minimal prompts ("This is evaluation
  round N.") per ENSEMBLE-10. Round number is the only context needed.

### Integration Points
- `SPEC-TEMPLATE.md` -> `planner.md`: Planner reads template, writes SPEC.md
  with criteria. Template change flows through all future SPEC.md files.
- `acceptance-criteria-guide.md` -> `planner.md`: New Read instruction in
  planner's workflow, after writing features, before writing criteria.
- `PLAYWRIGHT-EVALUATION.md` -> `perceptual-critic.md`: New Read instruction
  in OBSERVE step.
- `PLAYWRIGHT-EVALUATION.md` -> `projection-critic.md`: New Read instruction
  in TEST step.
- `appdev-cli.mjs compile-evaluation`: May need regression detection logic
  comparing round N vs round N-1 summary.json acceptance_tests.results.
- `planner.md` self-verification: 2 new checklist items (criteria presence +
  criteria quality).

</code_context>

<deferred>
## Deferred Ideas

- **CLI regression detection implementation** -- the architectural decision
  (CLI owns it, not critics) is captured here. Implementation details
  (comparison algorithm, EVALUATION.md regression section format) may
  straddle Phase 8 and Phase 9 depending on plan scoping.
- **ASSET-VALIDATION-PROTOCOL.md disposition** -- Phase 7 decomposed asset
  validation across the ensemble. This file may need updating, removal, or
  replacement. Planner should assess during Phase 8 planning.
- **playwright-api-testing skill** -- deferred from Phase 7 context. May
  straddle Phase 8 (Playwright patterns) or be a separate future phase.
  Not in Phase 8 requirements.
- **Cross-feature acceptance criteria** -- explicitly excluded from SPEC
  criteria. Could become a future phase if cross-feature bugs persist after
  v1.2's enhanced projection-critic with Temporal Triplet pattern.

</deferred>

---

*Phase: 08-spec-acceptance-criteria-playwright-patterns*
*Context gathered: 2026-04-01*
