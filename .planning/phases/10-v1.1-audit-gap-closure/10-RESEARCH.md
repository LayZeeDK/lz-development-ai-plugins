# Phase 10: v1.1 Audit Gap Closure - Research

**Researched:** 2026-04-02
**Domain:** Integration bug fixes, stale artifact cleanup, verification gap closure
**Confidence:** HIGH

## Summary

Phase 10 closes all gaps identified by the v1.1 milestone audit. The work
falls into three categories: (1) four integration bugs that would cause
runtime failures during real usage, (2) stale artifacts left from the
evaluator-to-ensemble migration that either break tests or ship dead code to
users, and (3) a verification gap where 14 Phase 7 requirements are
"orphaned" because no 07-VERIFICATION.md was ever produced.

The integration bugs are well-understood and surgical: the install-dep
calling convention mismatch, the missing static-serve --stop in the
SAFETY_CAP wrap-up path, the missing @playwright/test dependency, and the
missing baseURL configuration in projection-critic acceptance tests. The
stale artifact cleanup is straightforward file editing. The verification gap
requires producing a Phase 7 VERIFICATION.md that formally closes the 14
orphaned requirements.

**Primary recommendation:** Fix the four integration bugs first (Plan 01)
since they affect runtime correctness, then clean up stale artifacts and
produce verification documentation (Plan 02). No new libraries, no
architecture changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENSEMBLE-01 | perceptual-critic agent definition | Re-verification only -- already implemented, needs 07-VERIFICATION.md |
| ENSEMBLE-02 | projection-critic agent definition | Re-verification only -- already implemented, needs 07-VERIFICATION.md |
| ENSEMBLE-03 | appdev-cli compile-evaluation | Re-verification only -- integration confirmed wired correctly |
| ENSEMBLE-04 | appdev-cli install-dep | **BUG FIX** -- agent calling convention uses `--dev` flag, CLI expects `--package` |
| ENSEMBLE-05 | Remove monolithic evaluator.md | Re-verification + **CLEANUP** -- file deleted but stale test + orphaned reference remain |
| ENSEMBLE-06 | 3 scoring dimensions | Re-verification + **CLEANUP** -- stale Code Quality reference in generator.md line 225 |
| ENSEMBLE-07 | EVALUATION-TEMPLATE.md redesigned | Re-verification only -- template uses {placeholder} syntax confirmed |
| ENSEMBLE-08 | SCORING-CALIBRATION.md updated | Re-verification only -- 3 dimensions with ceiling rules confirmed |
| ENSEMBLE-09 | summary.json extensible schema | Re-verification only -- any */summary.json auto-consumed confirmed |
| ENSEMBLE-10 | Orchestrator evaluation phase | Re-verification only -- parallel critic spawns confirmed |
| BARRIER-01 | Neither critic reads source code | Re-verification only -- tool allowlists exclude Glob/Edit confirmed |
| BARRIER-02 | Behavioral symptom findings | Re-verification only -- finding format enforced confirmed |
| BARRIER-03 | Critics don't modify app source | Re-verification only -- Write restriction confirmed |
| BARRIER-04 | Independent test suites | Re-verification only -- separate directories documented confirmed |
| RECOVERY-03 | Dev server lifecycle | **BUG FIX** -- SAFETY_CAP path missing static-serve --stop before wrap-up Generator |
| PLAYWRIGHT-02 | Projection-critic acceptance tests | **BUG FIX** -- @playwright/test not installed in Step 0.5; baseURL not configured |
| PLAYWRIGHT-04 | Acceptance test execution | **BUG FIX** -- same issues as PLAYWRIGHT-02 |
</phase_requirements>

## Standard Stack

No new libraries or dependencies. Phase 10 works entirely within the
existing stack:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| appdev-cli.mjs | N/A (zero-dep script) | CLI state management and ensemble aggregation | Already shipped, zero npm deps |
| Node.js test runner | node:test | Structural validation tests | Used throughout v1.0 and v1.1 |
| @playwright/cli | latest | Browser automation for critics | Already in Step 0.5 |
| @playwright/test | latest | Acceptance test framework | **NEW to Step 0.5** -- needed by projection-critic |
| serve | latest | Static file server for critics | Already in Step 0.5 |

### No New Dependencies
This phase adds `@playwright/test` to the Step 0.5 workspace setup (one
`npm install --save-dev` line) but introduces zero new dependencies to the
CLI or plugin infrastructure.

## Architecture Patterns

### Fix Pattern: CLI Calling Convention (ENSEMBLE-04)

The install-dep subcommand has a well-defined interface:

```
cmdInstallDep(argv) -> parseArgs(argv) -> requires args["package"]
```

**Current CLI behavior (line 1386-1388 of appdev-cli.mjs):**
```javascript
var packageName = args["package"] || "";
// ...
if (!packageName) {
  fail("Missing required argument: --package <name>");
}
```

**Current agent calling convention (perceptual-critic.md line 86):**
```
node *appdev-cli* install-dep --dev sharp imghash leven
```

**Current agent calling convention (projection-critic.md line 183):**
```
node *appdev-cli* install-dep --dev ajv
```

Two fix options:
1. **Update CLI to accept --dev flag** -- add `--dev` support to parseArgs,
   treat positional args after --dev as package names
2. **Update agent definitions to use --package flag** -- change calling
   convention in both critic .md files

**Recommendation: Option 2 (update agents).** The CLI's --package interface
is clean, well-tested (5 passing tests), and used by the test suite. The
agents are using a non-existent flag. However, there is a subtlety: the
agents want to install MULTIPLE packages at once (`sharp imghash leven`),
but `--package` takes a single value in the current parseArgs. Two
sub-options:

- **2a:** Update agents to call install-dep multiple times (one per
  package): `install-dep --package sharp`, `install-dep --package imghash`,
  `install-dep --package leven`. Safe but 3 calls instead of 1.
- **2b:** Update CLI to accept space-separated packages via --package:
  `install-dep --package "sharp imghash leven"`. Single call but requires
  CLI change.

The CLI already passes `packageName` directly to
`npm install --save-dev ${packageName}`, so passing `"sharp imghash leven"`
as a single string would work without CLI code changes -- npm install
handles multiple space-separated packages. But parseArgs stops consuming at
the next `--` flag, so `--package sharp imghash leven` would only capture
`sharp`. The current parseArgs (line 77) only consumes one token for
non-prompt flags.

**Best fix:** Update the agent calling convention to use `--package`:
```
node *appdev-cli* install-dep --package "sharp imghash leven"
```
This works because parseArgs assigns `args["package"] = "sharp imghash leven"`
(one token if quoted), and cmdInstallDep passes it directly to
`npm install --save-dev sharp imghash leven`. However, in Bash tool calls,
quotes inside the glob pattern may not be preserved.

**Safest fix:** Change parseArgs to support consuming multiple tokens for
`--package` (similar to `--prompt`), or update agents to call install-dep
once per package. The latter is simpler and requires no CLI test updates.

### Fix Pattern: SAFETY_CAP Stale Build (RECOVERY-03)

The SAFETY_CAP path in SKILL.md (lines 358-397) spawns a wrap-up Generator
at line 367 but does not stop the static-serve first. The fix is to add a
`static-serve --stop` call between the SAFETY_CAP tag (line 362) and the
Generator spawn (line 367), matching the pattern used by the "should_continue"
path (line 407).

**Exact insertion point in SKILL.md:** After the `git tag` for SAFETY_CAP
(line 362-363), before "Run one extra wrap-up round" (line 364):

```
  - Stop static servers before wrap-up generation:
    ```
    Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs static-serve --stop)
    ```
```

### Fix Pattern: @playwright/test Installation (PLAYWRIGHT-02, PLAYWRIGHT-04)

SKILL.md Step 0.5 currently installs:
```
Bash(npm install --save-dev @playwright/cli)
Bash(npm install --save-dev serve)
```

Needs to also install:
```
Bash(npm install --save-dev @playwright/test)
```

This ensures `npx playwright test` works for ALL app types, not just those
where the Generator happens to install it (3+ pages or complex flows).

### Fix Pattern: baseURL Configuration (PLAYWRIGHT-02, PLAYWRIGHT-04)

The projection-critic Step 0 says to use the port from static-serve but
does not provide explicit baseURL configuration for acceptance tests.

**Fix locations:**
1. **PLAYWRIGHT-EVALUATION.md skeleton test** -- add `test.use({ baseURL })`
   pattern showing how to configure the server URL
2. **projection-critic.md Step 0** -- specify that the port from
   static-serve must be used as baseURL in `playwright.config.ts` or
   `test.use()` in the test file

The skeleton test in PLAYWRIGHT-EVALUATION.md currently uses relative paths
(`await page.goto('/')`), which works only if baseURL is configured. The
fix adds explicit configuration.

### Cleanup Pattern: Stale Test File

`tests/evaluator-hardening-structure.test.mjs` has 21 tests, 15 of which
fail because they read `evaluator.md` (deleted in Phase 7). The file tests
v1.0 evaluator structure (EVAL-01 through EVAL-05, LOOP-06) which is no
longer relevant.

**Options:**
1. **Delete the file entirely** -- the behaviors it tested no longer exist
   in the v1.1 architecture. The 6 passing tests verify AI-PROBING-REFERENCE.md
   and SCORING-CALIBRATION.md content, but those files are stable and
   validated by Phase 7 manual review.
2. **Rewrite for ensemble architecture** -- test the new critic agent
   definitions and ensemble structure instead.

**Recommendation: Delete.** The v1.1 architecture has its own validation
strategy (07-VALIDATION.md with 26 automated tests in test-appdev-cli.mjs
+ 10 manual checks). Rewriting the test to validate .md file structure is
low value compared to the existing automated CLI tests and manual reviews.

### Cleanup Pattern: Orphaned ASSET-VALIDATION-PROTOCOL.md

This 48-line file was extracted for the monolithic evaluator's Step 7
(asset validation with sharp/imghash/leven). In v1.1, asset validation
is done differently:
- perceptual-critic references AI-SLOP-CHECKLIST.md for visual detection
- appdev-cli check-assets handles URL validation
- The ASSET-VALIDATION-PROTOCOL.md has no consumer

**Options:**
1. **Delete** -- no consumer, ships dead code to users
2. **Wire to perceptual-critic** -- add as progressive disclosure reference

**Recommendation: Delete.** The perceptual-critic already has AI-SLOP-CHECKLIST.md
for pattern detection and appdev-cli check-assets for URL validation. The
protocol's sharp/imghash/leven steps are called from perceptual-critic
directly (install-dep line). The protocol file adds no value.

### Cleanup Pattern: Generator Stale References

generator.md has two categories of stale references:

**1. Code Quality reference (line 225):**
```
If Code Quality is below 6, refactor.
```
Code Quality was removed as a dimension in Phase 7. This line gives dead
guidance.

**2. "Evaluator" terminology (10+ references):**
Lines 18, 29, 101, 203, 207, 209, 214, 223, 245, 249, 251 all reference
"Evaluator" instead of the v1.1 terminology (ensemble, critics, evaluation
report). These are terminological -- the behavior is correct (Generator
reads EVALUATION.md for feedback) -- but they are confusing and inconsistent
with the rest of the v1.1 architecture.

**Fix:** Replace "Evaluator" with appropriate v1.1 terms:
- "Evaluator's feedback" -> "evaluation report" or "critic feedback"
- "the Evaluator flagged" -> "the evaluation report flagged"
- "the Evaluator catches" -> "the critic ensemble catches"
- "the Evaluator's report" -> "the evaluation report"
- "belong to the Evaluator agent" -> "belong to the critic ensemble"

### Cleanup Pattern: README.md

The README.md is the user-facing documentation. It currently describes:
- 3 agents (Planner, Generator, Evaluator) -- should be 4 (+ Perceptual
  Critic, Projection Critic)
- "Evaluator: QAs the running app" -- should describe the ensemble
- 4 evaluation criteria including Code Quality -- should be 3 dimensions
- QA-REPORT.md file protocol -- should be EVALUATION.md
- "Up to 3 build/QA rounds" -- should be "Up to 10 rounds"
- Prerequisites mention playwright-cli on PATH -- should be npm devDependency
- Architecture section describes Generator/Evaluator pair -- should describe
  Generator vs critic ensemble

### Cleanup Pattern: AI-PROBING-REFERENCE.md Stale References

This file has 14 "Evaluator" references and 4 "Code Quality" references.
Since the file is loaded by projection-critic (not the deleted evaluator),
these references are terminologically stale.

**Fix:** Replace "Evaluator" with "projection-critic" or "critic" as
appropriate. Replace "Code Quality" references with the current dimension
names or remove them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-package install | Custom parseArgs multi-value parsing | One install-dep call per package in agent definitions | Simpler, no CLI test changes needed |
| Acceptance test config | Custom test runner configuration | `test.use({ baseURL })` in Playwright test file | Standard Playwright pattern, documented in official docs |
| Phase 7 verification | New automated test suite | Manual review + VERIFICATION.md template | 13/14 requirements are correctly wired -- verification, not reimplementation |

## Common Pitfalls

### Pitfall 1: parseArgs Positional Token Consumption
**What goes wrong:** Changing parseArgs to consume multiple tokens for
`--package` (like `--prompt`) could break other flag parsing if not
carefully scoped.
**Why it happens:** The parseArgs function has special multi-token logic
only for `--prompt`. Adding another multi-token flag requires matching
the same pattern.
**How to avoid:** Use the simplest fix: either one call per package (no
CLI changes) or pass all packages as a quoted string.
**Warning signs:** Test failures in test-appdev-cli.mjs install-dep suite.

### Pitfall 2: Static-serve --stop Placement
**What goes wrong:** Placing the --stop AFTER the wrap-up Generator spawn
instead of BEFORE. The Generator needs to produce a new build, and then
critics need a fresh server.
**Why it happens:** The pattern for other exit conditions (PASS, PLATEAU,
REGRESSION) stops servers after evaluation, not before. SAFETY_CAP is
unique because it spawns another Generator round.
**How to avoid:** Place --stop BEFORE the Generator spawn, matching the
pattern used by the "should_continue" path (which stops servers before
the next round's Generation Phase).
**Warning signs:** During SAFETY_CAP wrap-up, critics would evaluate the
stale round-N build instead of the fresh round-N+1 build.

### Pitfall 3: baseURL Hardcoding
**What goes wrong:** Hardcoding a port number (e.g., 5173) in the baseURL
configuration. The static-serve finds an available port starting from 5173
but may increment if that port is in use.
**Why it happens:** The developer assumes port 5173 is always available.
**How to avoid:** The projection-critic must read the port from
static-serve's JSON response and use it dynamically in the test
configuration.
**Warning signs:** Acceptance tests fail with ECONNREFUSED when another
process uses port 5173.

### Pitfall 4: README.md Over-Engineering
**What goes wrong:** Rewriting README.md with too much architectural detail,
making it harder for users to understand the plugin.
**Why it happens:** The cleanup scope is large (many stale references) and
it is tempting to document every v1.1 detail.
**How to avoid:** Keep README.md user-focused. Update only the factually
wrong parts: agent count, dimension list, file protocol, prerequisites.
Preserve the existing concise style.

### Pitfall 5: Test File Scope Creep
**What goes wrong:** Rewriting evaluator-hardening-structure.test.mjs into
a comprehensive v1.1 test suite, expanding scope beyond Phase 10.
**Why it happens:** The file has 21 tests, and the instinct is to replace
them 1:1.
**How to avoid:** Delete the file. The v1.1 architecture already has
adequate test coverage: 57 automated tests in test-appdev-cli.mjs + 10
manual verifications in 07-VALIDATION.md.

## Code Examples

### install-dep Fix: Agent Calling Convention

**Before (perceptual-critic.md line 86):**
```
node *appdev-cli* install-dep --dev sharp imghash leven
```

**After (one call per package):**
```
node *appdev-cli* install-dep --package sharp
node *appdev-cli* install-dep --package imghash
node *appdev-cli* install-dep --package leven
```

Or if CLI is updated to treat remaining args as package names:

**After (CLI-side fix):**
```
node *appdev-cli* install-dep --package sharp --package imghash --package leven
```

### SAFETY_CAP Fix: Static-serve --stop Insertion

**Before (SKILL.md SAFETY_CAP section):**
```markdown
- Tag the round:
  Bash(git tag -a appdev/round-N -m "Round N complete: SAFETY_CAP")
- Run one extra wrap-up round:
  - Spawn Generator:
    Agent(...)
```

**After:**
```markdown
- Tag the round:
  Bash(git tag -a appdev/round-N -m "Round N complete: SAFETY_CAP")
- Stop static servers before wrap-up generation:
  Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs static-serve --stop)
- Run one extra wrap-up round:
  - Spawn Generator:
    Agent(...)
```

### baseURL Fix: Acceptance Test Configuration

**Skeleton test with baseURL (PLAYWRIGHT-EVALUATION.md):**
```typescript
import { test, expect } from '@playwright/test';

// Configure baseURL from the static-serve port.
// The projection-critic reads the port from static-serve JSON response
// and sets it here.
test.use({ baseURL: 'http://localhost:5173' }); // port from static-serve

test.describe('Feature 1: Artwork Gallery [Core]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  // ...
});
```

### @playwright/test Installation (SKILL.md Step 0.5)

```markdown
Install @playwright/cli, @playwright/test, and serve as dev dependencies:

Bash(npm install --save-dev @playwright/cli)
Bash(npm install --save-dev @playwright/test)
Bash(npm install --save-dev serve)
```

## State of the Art

No technology changes. This phase is entirely about fixing integration
bugs and cleaning up artifacts within the existing v1.1 architecture.

| Old State | New State | Impact |
|-----------|-----------|--------|
| install-dep called with --dev flag | install-dep called with --package flag | Critics can install evaluation tooling |
| SAFETY_CAP misses static-serve --stop | --stop before wrap-up Generator | Fresh build served in wrap-up evaluation |
| @playwright/test not in Step 0.5 | Installed alongside @playwright/cli | Acceptance tests work for all app types |
| No baseURL in acceptance tests | Explicit baseURL from static-serve port | Tests hit the correct server |
| 15/21 tests fail (evaluator.md deleted) | Test file deleted | Clean test suite, 0 failures |
| ASSET-VALIDATION-PROTOCOL.md orphaned | File deleted | No dead code shipped to users |
| README.md describes v1.0 (3 agents) | README.md describes v1.1 (4 agents) | User documentation is accurate |
| generator.md has 10+ stale refs | Updated to v1.1 terminology | Consistent agent instructions |

## Open Questions

1. **install-dep multi-package strategy**
   - What we know: CLI expects `--package <name>`, agents call `--dev <packages>`
   - What is unclear: Whether to fix CLI or fix agents or both
   - Recommendation: Fix agent calling convention (simplest). Either use
     one call per package or update parseArgs to accept multiple --package
     values. The one-call-per-package approach requires zero CLI changes
     and zero test updates. The file-based mutex handles concurrent calls.

2. **AI-PROBING-REFERENCE.md cleanup scope**
   - What we know: 14 "Evaluator" refs and 4 "Code Quality" refs are stale
   - What is unclear: Whether this should be included in Phase 10 or
     deferred (the file is still functional -- projection-critic references
     it and the stale terminology does not change behavior)
   - Recommendation: Include in Phase 10 cleanup since the changes are
     purely terminological and the file ships to users. Stale "Code Quality"
     scoring references could confuse the projection-critic agent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none |
| Quick run command | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |
| Full suite command | `node plugins/application-dev/scripts/test-appdev-cli.mjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENSEMBLE-04 | install-dep accepts agent calling convention | unit | `node plugins/application-dev/scripts/test-appdev-cli.mjs` | Existing tests (5 in install-dep suite) -- may need update if CLI changes |
| RECOVERY-03 | SAFETY_CAP static-serve --stop | manual-only | Review SKILL.md SAFETY_CAP section | N/A -- orchestrator prompt review |
| PLAYWRIGHT-02 | @playwright/test installed in Step 0.5 | manual-only | Review SKILL.md Step 0.5 | N/A -- orchestrator prompt review |
| PLAYWRIGHT-04 | baseURL configured in acceptance tests | manual-only | Review PLAYWRIGHT-EVALUATION.md + projection-critic.md | N/A -- agent definition review |
| ENSEMBLE-01..03,05..10 | Phase 7 verification closure | manual-only | Produce 07-VERIFICATION.md from audit evidence | N/A -- verification documentation |
| BARRIER-01..04 | Phase 7 verification closure | manual-only | Produce 07-VERIFICATION.md from audit evidence | N/A -- verification documentation |
| ENSEMBLE-05 (cleanup) | Stale test file removed | unit | `node tests/evaluator-hardening-structure.test.mjs` should not exist | File exists -- will be deleted |
| ENSEMBLE-06 (cleanup) | No Code Quality refs in generator.md | manual-only | `git grep "Code Quality" -- plugins/application-dev/agents/generator.md` returns empty | N/A |

### Sampling Rate
- **Per task commit:** `node plugins/application-dev/scripts/test-appdev-cli.mjs`
- **Per wave merge:** Full CLI test suite (57 tests, ~17s)
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- None -- existing test infrastructure (57 tests in test-appdev-cli.mjs)
  covers all CLI behavior. If install-dep CLI is modified, existing
  install-dep tests (5 tests) will need update. If only agent definitions
  change, no new tests needed.

## Sources

### Primary (HIGH confidence)
- `plugins/application-dev/scripts/appdev-cli.mjs` -- direct code reading of cmdInstallDep (lines 1384-1461), parseArgs (lines 47-85)
- `plugins/application-dev/agents/perceptual-critic.md` line 86 -- install-dep --dev calling convention
- `plugins/application-dev/agents/projection-critic.md` line 183 -- install-dep --dev calling convention
- `plugins/application-dev/skills/application-dev/SKILL.md` lines 358-397 -- SAFETY_CAP path missing --stop
- `tests/evaluator-hardening-structure.test.mjs` -- 15/21 failing tests confirmed by direct execution
- `.planning/v1.1-MILESTONE-AUDIT.md` -- all integration findings verified against source code
- `plugins/application-dev/scripts/test-appdev-cli.mjs` -- 57/57 tests passing confirmed by direct execution

### Secondary (MEDIUM confidence)
- None needed -- all findings verified by direct code and test execution

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure code reading
- Architecture: HIGH -- all fixes are surgical edits to known files
- Pitfalls: HIGH -- all pitfalls derived from direct code analysis
- Integration bugs: HIGH -- every bug confirmed by reading source code and matching against calling conventions

**Research date:** 2026-04-02
**Valid until:** indefinite (no external dependencies or moving targets)
