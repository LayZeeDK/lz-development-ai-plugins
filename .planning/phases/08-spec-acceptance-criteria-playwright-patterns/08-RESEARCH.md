# Phase 8: SPEC Acceptance Criteria + Playwright Patterns - Research

**Researched:** 2026-04-01
**Domain:** Acceptance criteria authoring, Playwright evaluation patterns, token-efficient browser testing
**Confidence:** HIGH

## Summary

Phase 8 adds behavioral acceptance criteria to SPEC-TEMPLATE.md, creates a shared PLAYWRIGHT-EVALUATION.md reference for token-efficient browser evaluation, updates both critic agent definitions to reference it, creates a planner guidance reference for writing testable criteria, and clarifies the Generator vs. projection-critic test boundary.

The core technical insight is the 1:1 mapping between SPEC criteria bullets and Playwright test assertions. The planner writes criteria, the projection-critic mechanically translates them into acceptance tests. This means criteria quality directly determines test quality -- vague criteria produce untestable assertions, prescriptive criteria over-constrain the Generator.

The playwright-cli tool (`@playwright/cli`) provides the token-efficient foundation. Its `eval`, `snapshot`, `resize`, `console`, and `screenshot` commands replace verbose MCP interactions (~4x token reduction per Playwright team benchmarks). The write-and-run pattern (write test file to disk, run via `npx playwright test --reporter=json`, read JSON results) keeps test execution entirely outside agent context.

**Primary recommendation:** Decompose into 3 plans: (1) SPEC-TEMPLATE.md + acceptance-criteria-guide.md + planner.md updates, (2) PLAYWRIGHT-EVALUATION.md reference creation, (3) critic agent definition updates + Generator test boundary clarification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Acceptance criteria use bullet assertion format (not Given/When/Then or hybrid). Each bullet maps 1:1 to a Playwright test assertion. No Cucumber/BDD tooling.
- Placement: After User Stories, before Data Model in each feature section.
- Tier minimums: Core >= 3 (happy path + edge case + error state prescribed), Important >= 2 (count only), Nice-to-have >= 1 (count only).
- Measurable thresholds only when the SPEC naturally specifies numbers. Do not force synthetic thresholds on binary behaviors.
- Behavioral, not prescriptive: observable outcomes, not UI elements or implementation.
- Error states: require existence and describe intent, do not prescribe exact message text.
- Persistence: explicit when user-facing, never mention internal mechanism.
- Scope: single-feature only, no cross-feature criteria. AI criteria live on the feature that uses AI. AI Integration, Non-Functional Considerations, Constraints, and Non-Goals get no criteria.
- Inline examples: 2-3 good and 2-3 bad examples in SPEC-TEMPLATE.md comment block.
- New reference file: `references/acceptance-criteria-guide.md` (~50 lines) following progressive disclosure. Consumer-agnostic (no mention of projection-critic, Playwright, or write-and-run).
- Planner reading order: read acceptance-criteria-guide.md AFTER writing features with user stories, BEFORE adding Acceptance Criteria per feature.
- Brief WHY in planner.md: one sentence + Read instruction. No mention of ensemble architecture.
- Self-verification: 2 new checklist items (criteria presence + criteria quality).
- PLAYWRIGHT-EVALUATION.md is a reference file at `references/evaluator/PLAYWRIGHT-EVALUATION.md`. Technique-pure, no "Used by" annotations. Dependency inversion.
- One shared reference organized by technique. Both critics read it; each critic's agent definition specifies which sections to focus on.
- Sections: eval-first, write-and-run, snapshot-as-fallback, resize+eval, console filtering, test healing (evaluation context), round 2+ test reuse.
- No specific token counts. No JSON reporter format documentation (Playwright does not follow semver).
- Round 2+ test reuse: always re-run existing tests first. Reuse/heal/regenerate decision tree. No new tests in rounds 2+. Projection-critic only.
- Round discovery: orchestrator passes round number. Critic derives paths via arithmetic.
- Regression detection in CLI, not critic. CLI compares round N vs N-1 acceptance_tests.results in summary.json.

### Claude's Discretion
- Exact content and wording of 4-5 good/bad example pairs in acceptance criteria guide
- Exact content of inline examples in SPEC-TEMPLATE.md comment block
- playwright-cli command examples in each PLAYWRIGHT-EVALUATION.md technique section
- Skeleton acceptance test file structure and example criteria mapping
- How critic agent definitions reference PLAYWRIGHT-EVALUATION.md sections (exact wording of Read instructions)
- Whether ASSET-VALIDATION-PROTOCOL.md needs updating or removal given Phase 7 ensemble decomposition

### Deferred Ideas (OUT OF SCOPE)
- CLI regression detection implementation details (Phase 8/9 boundary -- architectural decision captured, implementation deferred)
- ASSET-VALIDATION-PROTOCOL.md disposition (assess during planning but defer detailed work)
- playwright-api-testing skill (not in Phase 8 requirements)
- Cross-feature acceptance criteria (explicitly excluded from SPEC criteria)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPEC-01 | SPEC-TEMPLATE.md includes `**Acceptance Criteria:**` per feature -- behavioral, testable, not prescriptive | Template structure analysis + criteria format patterns |
| SPEC-02 | Core >= 3 criteria (happy path, edge case, error state); Important >= 2; Nice-to-have >= 1 | Tier system documented in architecture patterns |
| SPEC-03 | Criteria use measurable thresholds -- no vague qualities | Good/bad example patterns in criteria guide research |
| SPEC-04 | Planner agent updated with compact reference on writing testable behavioral criteria | Progressive disclosure pattern + planner.md integration analysis |
| SPEC-05 | Planner self-verification checklist checks acceptance criteria presence and quality | Existing checklist structure analyzed (6 items, adding 2) |
| PLAYWRIGHT-01 | Generator writes dev tests using playwright-testing skill (Plan -> Generate -> Heal) in tests/ | Generator agent already has playwright-testing skill; needs explicit boundary statement |
| PLAYWRIGHT-02 | Projection-critic writes SEPARATE acceptance tests in evaluation/round-N/acceptance-tests.spec.ts | Write-and-run pattern documented in PLAYWRIGHT-EVALUATION.md |
| PLAYWRIGHT-03 | Acceptance test generation: snapshot for selector discovery + SPEC.md criteria for test logic | Snapshot + accessibility-tree-first selector pattern |
| PLAYWRIGHT-04 | Acceptance test execution deterministic: `npx playwright test --reporter=json` | JSON reporter configuration research |
| PLAYWRIGHT-05 | Acceptance test healing: Playwright Heal pattern for selector failures | Evaluation-context healing (distinct from Generator healing) |
| PLAYWRIGHT-06 | Rounds 2+: existing acceptance tests re-run first; only regenerated if app structure changed | Reuse/heal/regenerate decision tree in PLAYWRIGHT-EVALUATION.md |
| TOKEN-01 | PLAYWRIGHT-EVALUATION.md reference -- eval-first, write-and-run, snapshot-as-fallback | Reference structure and technique sections researched |
| TOKEN-02 | Perceptual-critic uses eval for page state, resize+eval for responsive | Existing perceptual-critic OBSERVE section + resize command |
| TOKEN-03 | Projection-critic uses write-and-run -- 5 tool calls replace 30+ interactive | 5-step write-and-run workflow documented |
| TOKEN-04 | Both critics use `console error` (filtered) instead of `console` (all messages) | playwright-cli `console` command with min-level filter |
| TOKEN-05 | Structured summary.json + hard GC via process destruction | Existing summary.json schema + agent context management |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/cli | latest | Token-efficient browser automation for critics | Microsoft's official CLI for coding agents; ~4x fewer tokens than MCP |
| @playwright/test | 1.58+ | Test runner for acceptance tests (npx playwright test) | Already in playwright-testing skill; JSON reporter for structured results |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:test | built-in | Test runner for appdev-cli.mjs unit tests | Existing test infrastructure (test-appdev-cli.mjs) |
| node:fs, node:path | built-in | CLI file operations | Zero-dependency CLI pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bullet assertions | Given/When/Then (GWT) | GWT adds ~3x token overhead for zero additional info. Decision locked: bullets. |
| Separate per-critic references | One shared PLAYWRIGHT-EVALUATION.md | Per-critic creates O(N*M) duplication at v2.0 with 5+ critics. Decision locked: shared. |
| Documenting JSON reporter format | Reading actual output | Playwright does not follow semver -- format can change in any minor. Decision locked: no format docs. |

**Installation:** No new npm dependencies. This phase creates reference files and modifies agent definitions. `@playwright/cli` is already installed in Step 0.5 of the orchestrator workflow.

## Architecture Patterns

### Recommended File Structure
```
plugins/application-dev/
|-- agents/
|   |-- planner.md              # MODIFY: add Read instruction + 2 checklist items
|   |-- generator.md            # MODIFY: clarify test boundary (PLAYWRIGHT-01)
|   |-- perceptual-critic.md    # MODIFY: add Read instruction for PLAYWRIGHT-EVALUATION.md
|   '-- projection-critic.md    # MODIFY: add Read instruction + round 2+ reuse logic
|-- skills/application-dev/
|   '-- references/
|       |-- SPEC-TEMPLATE.md    # MODIFY: add Acceptance Criteria section per feature
|       |-- acceptance-criteria-guide.md  # NEW: ~50 lines, planner guidance
|       '-- evaluator/
|           |-- PLAYWRIGHT-EVALUATION.md  # NEW: shared evaluation techniques
|           |-- AI-SLOP-CHECKLIST.md      # EXISTING (unchanged)
|           |-- AI-PROBING-REFERENCE.md   # EXISTING (unchanged)
|           |-- SCORING-CALIBRATION.md    # EXISTING (unchanged)
|           |-- EVALUATION-TEMPLATE.md    # EXISTING (unchanged)
|           '-- ASSET-VALIDATION-PROTOCOL.md  # EXISTING (assess disposition)
'-- scripts/
    '-- appdev-cli.mjs          # POSSIBLY MODIFY: regression detection stub (if in scope)
```

### Pattern 1: Acceptance Criteria Bullet Format
**What:** Each feature in SPEC-TEMPLATE.md gets an `**Acceptance Criteria:**` section with bullet assertions that map 1:1 to Playwright test assertions.
**When to use:** Every feature in the Features section of SPEC.md.
**Example:**
```markdown
### 1. Artwork Gallery [Core]

<feature description>

**User Stories:**
- As a user, I want to browse artwork, so that I can discover new pieces
- ...

**Acceptance Criteria:**
<!-- Each bullet = one testable assertion. Behavioral, not prescriptive. -->
- Gallery displays at least 12 artworks on initial load
- User can filter artworks by artist name
- Filtering with no matches shows an empty-state message
- Gallery adapts layout from single column at 320px to multi-column at 1024px

**Data Model:** (if applicable)
...
```

### Pattern 2: Progressive Disclosure for Planner
**What:** Planner reads acceptance-criteria-guide.md at a specific point in its workflow, between writing features and adding criteria.
**When to use:** Following the Phase 7 pattern (frontend-design-principles.md read before Visual Design section).
**Example integration in planner.md:**
```
Acceptance criteria drive automated acceptance tests that verify each feature works
as specified. Before adding Acceptance Criteria to each feature, read the guide:

Read `${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/acceptance-criteria-guide.md`
```

### Pattern 3: Technique-Pure Shared Reference (PLAYWRIGHT-EVALUATION.md)
**What:** A single reference file teaching Playwright evaluation techniques, consumed by both critics. Each critic's agent definition specifies which sections to read. The reference itself has no "Used by" annotations.
**When to use:** Follows the ProjectedGAN (7.1) shared-feature-extractor pattern and the existing SCORING-CALIBRATION.md precedent.
**Section structure:**
```
## eval-first
- What: structured JSON via playwright-cli eval, replacing verbose snapshots
- Why: eval returns targeted data (~100 tokens) vs snapshot (~2000 tokens)
- Commands: eval "document.title", eval "document.querySelectorAll('.card').length", etc.

## write-and-run
- What: 5-step workflow for acceptance test generation
- Why: tests execute outside agent context (~5 tool calls vs ~30+ interactive)
- Steps: read SPEC -> snapshot -> write tests -> run tests -> read results
- Skeleton: acceptance-tests.spec.ts structure showing criteria-to-test mapping

## snapshot-as-fallback
- What: snapshot for selector/ref discovery when eval is insufficient
- Why: only use when you need element ref IDs for interaction

## resize+eval
- What: viewport resize then eval for responsive checks
- Commands: resize <width> <height>, then eval, then screenshot

## console filtering
- What: console error (filtered) instead of console (all messages)
- Commands: console error

## test healing (evaluation context)
- What: re-snapshot, update selectors, re-run
- Key insight: selector failures = test maintenance, assertion failures = real findings
- Critics never fix the app (not the Generator's heal loop)

## round 2+ test reuse
- What: reuse/heal/regenerate decision tree
- Flow: copy tests from round N-1 -> run -> decide (reuse/heal/regenerate)
- Reuse when: all pass OR assertion-only failures (report as findings)
- Heal when: 1-2 selector timeouts (minor UI rename)
- Regenerate when: multiple selector timeouts or >50% timeout (major restructure)
```

### Pattern 4: Independent Test Suites
**What:** Generator's dev tests (tests/) and projection-critic's acceptance tests (evaluation/round-N/projection/) are completely independent.
**When to use:** Always. This is a GAN information barrier enforcement.
**Distinction:**
- Generator tests: white-box, implementation-aware, committed to repo, use Plan->Generate->Heal skill
- Projection-critic tests: black-box, product-surface only, per-round artifacts, use write-and-run from SPEC criteria

### Anti-Patterns to Avoid
- **Prescriptive criteria:** "Clicking the Add button opens a modal form with title input" -- prescribes UI elements. Use: "User can create a new artwork with title, artist, and image."
- **Vague qualities:** "Works well on mobile" -- untestable. Use: "Gallery adapts layout to single column at 320px width."
- **Implementation leaks:** "Data persists in localStorage" -- reveals mechanism. Use: "Created artwork persists after page refresh."
- **Cross-feature criteria:** "Creating an artwork makes it appear in the gallery and in search results" -- spans two features. Test each feature independently.
- **Documenting Playwright JSON format:** Playwright does not follow semver. Do not hardcode reporter schema in references. Critics read actual output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser evaluation | Custom browser scripting | playwright-cli eval/snapshot/resize commands | Token-efficient, maintained by Microsoft, handles edge cases |
| Test execution | Interactive browser commands (~30+ calls) | write-and-run pattern (write file + npx playwright test --reporter=json) | 4-6x fewer tool calls, test execution outside agent context |
| Acceptance test structure | Ad-hoc test scripts | Playwright Test framework with describe/test/expect | Auto-waiting assertions, structured JSON reporter, parallel execution |
| Criteria-to-test mapping | Manual translation each round | Mechanical mapping from SPEC bullets to test assertions | 1:1 mapping is the design insight -- planner writes criteria, critic translates mechanically |
| Round-over-round comparison | Critic-internal comparison logic | CLI regression detection (summary.json diff) | GAN principle: discriminator judges single sample, training loop manages trajectory |

**Key insight:** The entire Phase 8 architecture rests on separation of concerns: the planner writes testable criteria (not knowing how they'll be tested), the projection-critic mechanically translates criteria to tests (not knowing how the app was built), and the CLI compares rounds (not knowing the content of tests). Each actor has minimal knowledge of the others.

## Common Pitfalls

### Pitfall 1: Criteria That Cannot Be Automated
**What goes wrong:** Planner writes criteria like "the design feels professional" or "the app is intuitive to use" -- these cannot be translated into Playwright assertions.
**Why it happens:** Human reviewers can assess subjective qualities; automated tests cannot. The planner does not know criteria drive automated tests (by design -- GAN separation).
**How to avoid:** The acceptance-criteria-guide.md teaches observable outcomes. Good/bad examples demonstrate the difference. Self-verification checklist catches vague criteria before handoff.
**Warning signs:** Criteria using words like "well", "good", "intuitive", "professional", "clean", "fast" without measurable thresholds.

### Pitfall 2: Prescriptive Criteria Constraining the Generator
**What goes wrong:** Criteria specify UI elements ("modal", "sidebar", "dropdown") instead of behavior. The Generator cannot choose the best UI pattern for the task.
**Why it happens:** It is natural to describe features in terms of UI components. The planner needs guidance to separate behavior from implementation.
**How to avoid:** acceptance-criteria-guide.md explicitly warns against this. Bad examples include UI-prescriptive criteria paired with good behavioral alternatives.
**Warning signs:** Criteria mentioning specific HTML elements, CSS classes, component names, or layout patterns.

### Pitfall 3: Selector Churn Between Rounds
**What goes wrong:** Acceptance tests from round 1 fail in round 2 purely because the Generator renamed elements or restructured the DOM, not because behavior changed.
**Why it happens:** The Generator's heal loop can change element structure while preserving behavior.
**How to avoid:** Accessibility-tree-first selectors (getByRole, getByLabel, getByText) are resilient to DOM restructuring. The round 2+ decision tree distinguishes selector timeouts (heal) from assertion failures (real findings).
**Warning signs:** Multiple timeout errors with 0 assertion failures -- indicates structural change, not behavioral regression.

### Pitfall 4: Token Budget Exhaustion in Critics
**What goes wrong:** A critic loads too much data into context (full snapshots, full console output, full test output) and hits the ~60K token budget.
**Why it happens:** Without the eval-first and write-and-run patterns, browser interaction generates massive context.
**How to avoid:** PLAYWRIGHT-EVALUATION.md teaches eval-first (targeted JSON) over snapshot (full accessibility tree), write-and-run (tests on disk) over interactive testing (tests in context), and console error (filtered) over console (all messages).
**Warning signs:** Agent hitting autocompact, losing context of earlier findings, or crashing during evaluation.

### Pitfall 5: Critic Modifying Application Code
**What goes wrong:** During test healing, a critic "fixes" a selector failure by modifying the application source code instead of updating the test.
**Why it happens:** The Generator's heal workflow includes both test fixes and app fixes. The critic's heal workflow must be test-only.
**How to avoid:** PLAYWRIGHT-EVALUATION.md test healing section explicitly states: "Selector failures = test maintenance, assertion failures = real findings. Critics never fix the app." Tool allowlists already prevent Write outside evaluation/ directory (BARRIER enforcement from Phase 7).
**Warning signs:** Critic attempting to use Edit tool on non-evaluation files (blocked by allowlist).

### Pitfall 6: Viewport Command Name Confusion
**What goes wrong:** References use `viewport` but the CLI command is `resize`, or vice versa.
**Why it happens:** The perceptual-critic.md (from Phase 7) currently uses `npx playwright-cli viewport 320 800` but the official SKILL.md lists the command as `resize`.
**How to avoid:** Verify the command name. The existing perceptual-critic.md uses `viewport` in its code example. PLAYWRIGHT-EVALUATION.md should use the same name for consistency with existing agent definitions. If the command was renamed, update both the reference and the agent definitions.
**Warning signs:** "Unknown command" errors from playwright-cli during evaluation.

## Code Examples

Verified patterns from existing codebase and official sources:

### Acceptance Criteria in SPEC-TEMPLATE.md
```markdown
### 1. <Feature Name> [Core/Important/Nice-to-have]

<1-2 paragraphs explaining what this feature is, why users need it, and how it fits into the overall product.>

**User Stories:**
- As a user, I want to <action>, so that <benefit>
- As a user, I want to <action>, so that <benefit>
- As a user, I want to <action>, so that <benefit>
- ...

**Acceptance Criteria:**
<!--
Behavioral, testable assertions. Each bullet = one automated test.
Good: "Gallery displays at least 12 artworks on initial load"
Good: "User can filter artworks by artist name"
Good: "Created artwork persists after page refresh"
Bad:  "The gallery looks good on mobile" (vague quality)
Bad:  "Clicking Add opens a modal with a form" (prescriptive of UI)
Bad:  "Data is saved to localStorage" (implementation detail)
-->
- <observable outcome with measurable threshold if natural>
- <observable outcome>
- <observable outcome>

**Data Model:** (if applicable)
<Describe the key data entities, their fields, and their relationships.>
```

### Projection-Critic Write-and-Run Pattern (5 Tool Calls)
```
1. Read SPEC.md (already done in UNDERSTAND step)

2. npx playwright-cli snapshot
   -> Saves .playwright-cli/page-{timestamp}.yml
   -> Agent reads for selector discovery (element refs)

3. Write evaluation/round-N/projection/acceptance-tests.spec.ts
   -> Maps SPEC criteria to test assertions
   -> Uses accessibility-tree-first selectors from snapshot

4. npx playwright test evaluation/round-N/projection/acceptance-tests.spec.ts --reporter=json
   -> Executes tests outside agent context
   -> Writes JSON results to stdout or file

5. Read JSON results
   -> Extract passed/failed/skipped counts
   -> Map failures to SPEC criteria for findings
```

### Acceptance Test Skeleton (criteria-to-test mapping)
```typescript
// evaluation/round-N/projection/acceptance-tests.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature 1: Artwork Gallery [Core]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Criteria: Gallery displays at least 12 artworks on initial load
  test('displays at least 12 artworks', async ({ page }) => {
    const items = page.getByRole('listitem');

    await expect(items).toHaveCount({ min: 12 });
  });

  // Criteria: User can filter artworks by artist name
  test('filters artworks by artist name', async ({ page }) => {
    await page.getByPlaceholder(/filter|search/i).fill('Vermeer');
    await expect(page.getByRole('listitem')).not.toHaveCount(0);
  });

  // Criteria: Filtering with no matches shows empty-state message
  test('shows empty state for no filter matches', async ({ page }) => {
    await page.getByPlaceholder(/filter|search/i).fill('xyznonexistent');
    await expect(page.getByText(/no results|no artworks/i)).toBeVisible();
  });
});
```

### eval-first Pattern (perceptual-critic)
```bash
# Structured data extraction -- ~100 tokens vs ~2000 for full snapshot
npx playwright-cli eval "document.title"
npx playwright-cli eval "document.querySelectorAll('img').length"
npx playwright-cli eval "getComputedStyle(document.body).backgroundColor"
npx playwright-cli eval "document.querySelectorAll('[role=navigation]').length"

# Responsive check via resize + eval
npx playwright-cli resize 320 800
npx playwright-cli eval "document.querySelectorAll('.card').length"
npx playwright-cli screenshot --filename=mobile-320.png
npx playwright-cli resize 1280 800
npx playwright-cli screenshot --filename=desktop-1280.png
```

### Console Filtering Pattern
```bash
# Filtered: only errors (functional or visual depending on critic)
npx playwright-cli console error

# NOT this -- too much noise, wastes tokens:
# npx playwright-cli console
```

### Round 2+ Test Reuse Flow
```
Round N (N >= 2):
1. Copy acceptance-tests.spec.ts from evaluation/round-{N-1}/projection/
   to evaluation/round-N/projection/
2. Run: npx playwright test evaluation/round-N/projection/acceptance-tests.spec.ts --reporter=json
3. Read results:
   - All pass -> reuse (report: all criteria met)
   - Assertion failures only -> reuse (report failures as findings)
   - 1-2 selector timeouts -> heal (re-snapshot, update selectors, re-run)
   - Multiple selector timeouts or >50% timeouts -> regenerate (full write-and-run from SPEC)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Playwright MCP for browser automation | playwright-cli (@playwright/cli) | Early 2026 | ~4x token reduction; snapshots to disk not context |
| Monolithic evaluator agent | Ensemble of specialized critics | Phase 7 (2026-03-31) | Context isolation, parallel evaluation, extensible |
| No acceptance criteria in SPEC | Behavioral acceptance criteria per feature | Phase 8 (this phase) | Mechanical test generation from criteria, consistent quality |
| Interactive browser testing (30+ calls) | Write-and-run pattern (5 calls) | Phase 8 (this phase) | Dramatic token reduction, deterministic execution |

**Deprecated/outdated:**
- `evaluator.md`: Deleted in Phase 7. Replaced by perceptual-critic.md + projection-critic.md.
- ASSET-VALIDATION-PROTOCOL.md: May need updating or removal. Asset validation was decomposed across the ensemble in Phase 7. Planner should assess disposition.

## Open Questions

1. **viewport vs resize command name**
   - What we know: Perceptual-critic.md (Phase 7) uses `npx playwright-cli viewport 320 800`. The SKILL.md from Microsoft lists `resize` as the command name.
   - What's unclear: Whether the CLI actually accepts both names, or only one.
   - Recommendation: Use the name already in perceptual-critic.md (`viewport`) for consistency. If PLAYWRIGHT-EVALUATION.md uses a different name, it creates a discrepancy. Verify during implementation by checking `playwright-cli --help` output. If `resize` is canonical, update perceptual-critic.md too.

2. **CLI regression detection scope**
   - What we know: The architectural decision is captured (CLI owns regression detection, not critics). Implementation involves comparing round N vs N-1 acceptance_tests.results in summary.json.
   - What's unclear: Whether implementation belongs in Phase 8 or Phase 9. CONTEXT.md defers this as "may straddle Phase 8 and Phase 9 depending on plan scoping."
   - Recommendation: Phase 8 should define the summary.json schema extension (acceptance_tests.results is already present from Phase 7 -- see projection-critic summary.json schema). Regression detection implementation (the comparison algorithm) should be Phase 9 or a separate task if time allows.

3. **ASSET-VALIDATION-PROTOCOL.md disposition**
   - What we know: Phase 7 decomposed the monolithic evaluator. Asset validation logic was split: URL checking went to appdev-cli check-assets, perceptual inspection went to perceptual-critic.
   - What's unclear: Whether the reference file is still useful, needs updating, or should be removed.
   - Recommendation: Assess during planning. The file describes a monolithic evaluator workflow (Step 3, Step 7 references). If perceptual-critic already handles everything the file describes, it can be removed. If it provides useful technique guidance, update it for the ensemble architecture.

4. **Playwright test configuration for acceptance tests**
   - What we know: The projection-critic writes tests to evaluation/round-N/projection/. The project already has a playwright.config.ts for the Generator's dev tests.
   - What's unclear: Whether the acceptance tests need a separate playwright config or can use the existing one.
   - Recommendation: Acceptance tests should use the existing playwright.config.ts (which has webServer config for the dev server). The `--reporter=json` flag overrides the config reporter. The test file path is specified explicitly on the command line. No separate config needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js 20+) |
| Config file | none -- tests run directly via `node --test` |
| Quick run command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |
| Full suite command | `node --test plugins/application-dev/scripts/test-appdev-cli.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPEC-01 | SPEC-TEMPLATE.md has Acceptance Criteria per feature | manual-only | Visual inspection of template structure | N/A |
| SPEC-02 | Tier minimums: Core >= 3, Important >= 2, Nice-to-have >= 1 | manual-only | Criteria count verification in template comments | N/A |
| SPEC-03 | Measurable thresholds, no vague qualities | manual-only | Example quality review in guide | N/A |
| SPEC-04 | Planner updated with criteria reference | manual-only | Verify Read instruction + workflow ordering in planner.md | N/A |
| SPEC-05 | Planner self-verification checks criteria | manual-only | Verify 2 new checklist items in planner.md | N/A |
| PLAYWRIGHT-01 | Generator writes dev tests in tests/ | manual-only | Verify generator.md references playwright-testing skill (already present) | N/A |
| PLAYWRIGHT-02 | Projection-critic writes separate acceptance tests | manual-only | Verify projection-critic.md write-and-run references PLAYWRIGHT-EVALUATION.md | N/A |
| PLAYWRIGHT-03 | Snapshot + SPEC criteria for acceptance test generation | manual-only | Verify write-and-run section in PLAYWRIGHT-EVALUATION.md | N/A |
| PLAYWRIGHT-04 | npx playwright test --reporter=json deterministic execution | manual-only | Command documented in PLAYWRIGHT-EVALUATION.md | N/A |
| PLAYWRIGHT-05 | Test healing for selector failures | manual-only | Verify healing section in PLAYWRIGHT-EVALUATION.md | N/A |
| PLAYWRIGHT-06 | Round 2+ test reuse decision tree | manual-only | Verify reuse section in PLAYWRIGHT-EVALUATION.md | N/A |
| TOKEN-01 | PLAYWRIGHT-EVALUATION.md exists with all technique sections | manual-only | File existence + section presence check | N/A |
| TOKEN-02 | Perceptual-critic uses eval-first, resize+eval | manual-only | Verify Read instruction in perceptual-critic.md | N/A |
| TOKEN-03 | Projection-critic uses write-and-run (5 tool calls) | manual-only | Verify workflow in projection-critic.md | N/A |
| TOKEN-04 | Both critics use console error (filtered) | manual-only | Verify console filtering in both critic definitions | N/A |
| TOKEN-05 | summary.json + hard GC | manual-only | Already implemented in Phase 7 (process destruction) | N/A |

### Sampling Rate
- **Per task commit:** Visual inspection of modified files against requirements
- **Per wave merge:** Full checklist review against all 16 requirements
- **Phase gate:** All requirements checked before `/gsd:verify-work`

### Wave 0 Gaps
None -- this phase creates reference documentation and modifies agent definitions. No new test infrastructure is required. The existing test-appdev-cli.mjs covers CLI functionality. If CLI regression detection is added (deferred), it would need new test cases in that file.

## Sources

### Primary (HIGH confidence)
- Existing codebase: planner.md (98 lines), generator.md (497 lines), perceptual-critic.md (111 lines), projection-critic.md (150 lines), SPEC-TEMPLATE.md (86 lines), SCORING-CALIBRATION.md (198 lines), appdev-cli.mjs (1143 lines), test-appdev-cli.mjs
- [microsoft/playwright-cli GitHub](https://github.com/microsoft/playwright-cli) -- SKILL.md command reference, README with full command list
- [Playwright Test Reporters](https://playwright.dev/docs/test-reporters) -- JSON reporter configuration
- 08-CONTEXT.md -- All locked decisions from user discussion

### Secondary (MEDIUM confidence)
- [Playwright CLI TestDino guide](https://testdino.com/blog/playwright-cli/) -- Command syntax verification, resize command name
- [TestCollab Playwright CLI article](https://testcollab.com/blog/playwright-cli) -- Token efficiency benchmarks (~4x reduction)

### Tertiary (LOW confidence)
- playwright-cli `viewport` vs `resize` command naming -- needs runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - All patterns follow established Phase 7 conventions (progressive disclosure, dependency inversion, technique-pure references)
- Pitfalls: HIGH - Based on direct analysis of existing agent definitions and GAN architecture constraints
- Playwright CLI commands: MEDIUM - verified via GitHub SKILL.md and README, but viewport/resize naming needs runtime verification

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- reference documentation, no fast-moving dependencies)
