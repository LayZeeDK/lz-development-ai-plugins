# Quick Task 260404-vqv: Resolve v1.2 patch.0 Remaining Issues - Research

**Researched:** 2026-04-04
**Domain:** Orchestrator skill, generator agent, evaluator workflow, static-serve CLI
**Confidence:** HIGH

## Summary

Research for remaining issues from the v1.2 "patch.0" Dutch art museum test. The previous quick task (260404-ft9) already addressed: TOCTOU race in static-serve, critic path guardrails, hallucinated --test-dir flag, project-type classification heuristic, image bundling, favicon, sequential critics, and commit checkpoint for critic summaries.

This task addresses five remaining issues: (1) hallucinated package name at runtime, (2) EVALUATION.md not committed after compile-evaluation, (3) clipboard error from serve package on Windows, (4) Generator ignoring its own website classification, (5) ASSETS-TEMPLATE.md missing Local Path column.

**Primary recommendation:** Fix the serve clipboard error via --no-clipboard flag, add EVALUATION.md commit step in two code paths, strengthen generator guardrail scoping, add Local Path column to ASSETS-TEMPLATE.md, and add a negative instruction for the hallucinated package.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tech stack enforcement:**
- The generator's existing project-type heuristic (generator.md:46-69) correctly classifies "museum" as a website and prescribes vanilla HTML/CSS/JS. The Generator ignored its own heuristic.
- Fix: strengthen the guardrail language, do not change the policy. Vanilla is correct for websites.
- Vanilla JS is also correct for AI features -- Built-in AI APIs (LanguageModel, Summarizer, etc.) are browser-native APIs with zero framework dependency.
- When classification is ambiguous, prefer "website" (already stated but ignored).

**ASSETS.md format (Dual URL required):**
- Every bundled image must list both: original source URL + local path.
- The URL column must never contain "local" for images downloaded from external sources.
- Add a Local Path column to the ASSETS-TEMPLATE.md for bundled images.
- This lets critics verify provenance and check-assets validate URLs even after bundling.

**EVALUATION.md commit discipline (Orchestrator commits after compile-evaluation):**
- Add explicit git add + git commit for EVALUATION.md right after compile-evaluation, before round-complete.
- Sequence: (1) critic summaries commit, (2) compile-evaluation creates EVALUATION.md, (3) NEW: commit EVALUATION.md, (4) round-complete reads it, (5) tag.
- Commit message: `eval(round-N): compiled evaluation report`
- Rationale: crash-safe, single responsibility (orchestrator created it, orchestrator commits it), follows existing artifact-then-commit pattern.

### Specific Ideas (not locked)

- The hallucinated @anthropic-ai/claude-code-playwright package should be removed from Step 0.5 install instructions. Only @playwright/test and serve are needed.
- The "double static serve start" clipboard error is a Windows-specific serve package issue -- investigate suppressing the clipboard copy attempt.
- Uncommitted assets (Vite/React default images, Playwright screenshots) need gitignore or explicit commit instructions.
</user_constraints>

## Finding 1: Hallucinated Package (@anthropic-ai/claude-code-playwright)

**Confidence:** HIGH

### Evidence

The package `@anthropic-ai/claude-code-playwright` does NOT exist on npm (verified: 404 from registry). It appears NOWHERE in the repo's tracked files (`git grep` returns zero matches).

The SKILL.md Step 0.5 (line 147) correctly instructs installing `@playwright/cli` -- a real package (v0.1.5, description "Playwright CLI"). The orchestrator agent hallucinated a different package name at runtime.

**Verification from the test workspace:** The initial commit (`31a52a1`) shows `package.json` with only `@playwright/test` and `serve` as devDependencies. `@playwright/cli` was NOT installed, confirming the orchestrator failed to install it (likely installed the hallucinated name, got an error, and moved on).

### Analysis of @playwright/cli necessity

Critics heavily use `npx playwright-cli` for screenshots, eval, console, viewport, and snapshot commands (28+ references across the 3 critic agents). The `@playwright/cli` package provides this binary. Without it, critics would need to fall back to `npx @playwright/cli` or have it available some other way.

However, the CONTEXT.md specifics suggest "Only @playwright/test and serve are needed." This is likely because `playwright-cli` may be installed via `@playwright/test` as a transitive dependency or via the `npx` resolution mechanism. The `npx playwright-cli` invocation works even without `@playwright/cli` being in devDependencies if it's available in the npm registry (npx downloads on demand).

### Recommendation

Two changes needed:

1. **SKILL.md Step 0.5:** Remove the `@playwright/cli` install line (line 146-148). Critics use `npx playwright-cli` which resolves via npx's package resolution without needing a local devDependency. Keeping the install instruction risks the orchestrator hallucinating a variant name. The fewer packages in the install list, the less room for hallucination.

2. **SKILL.md frontmatter (line 16):** Update compatibility note from "Requires @playwright/cli and @playwright/test" to "Requires @playwright/test and serve" -- matching the actual install list.

3. **SKILL.md .gitignore seed (line 165):** Keep `.playwright-cli/` in the gitignore seed since `npx playwright-cli` still creates that directory.

## Finding 2: EVALUATION.md Commit Gap

**Confidence:** HIGH

### Current Flow (SKILL.md lines 301-327)

```
1. git add evaluation/round-N/        (critic summaries)
2. git commit -m "eval(round-N): critic summaries"
3. compile-evaluation --round N       (creates EVALUATION.md)
4. Binary check: EVALUATION.md exists + contains ## Scores
5. round-complete --round N           (reads EVALUATION.md)
6. git tag -a appdev/round-N          (tags the round)
```

**Gap:** EVALUATION.md is created by compile-evaluation (step 3) but never committed before round-complete (step 5). If the session crashes between steps 3 and 6, EVALUATION.md is lost. Even if the session doesn't crash, the round tag at step 6 doesn't include EVALUATION.md in the tagged commit.

### Insertion Points

**Normal evaluation path (lines 315-327):** Insert after the binary check (line 320) and before the "Post-Evaluation Convergence Check" heading (line 322):

```
Bash(git add evaluation/round-N/EVALUATION.md)
Bash(git commit -m "eval(round-N): compiled evaluation report")
```

**SAFETY_CAP wrap-up path (lines 440-444):** Insert after compile-evaluation (line 440) and before round-complete (line 444):

```
Bash(git add evaluation/round-{N+1}/EVALUATION.md)
Bash(git commit -m "eval(round-{N+1}): compiled evaluation report")
```

### Resume-check Implications

The `resume-check` subcommand already has a `compile-evaluation` action that checks for EVALUATION.md existence. Adding the commit step makes `resume-check` more reliable -- if the session crashes after compile-evaluation but before commit, resume-check still detects EVALUATION.md in the working tree and can recover. No CLI changes needed.

## Finding 3: Static Serve Clipboard Error (Windows)

**Confidence:** HIGH

### Root Cause

The `serve` npm package (v14.2.6) attempts to copy the server URL to the system clipboard on startup. On Windows, this calls `clip.exe` or PowerShell's `Set-Clipboard`. In automated/detached processes (like the spawned serve process in static-serve), clipboard access may fail with "Adgang naegtet" (Danish "Access Denied" -- Windows locale-dependent error).

### Fix: --no-clipboard Flag

The `serve` package has a `-n` / `--no-clipboard` flag (verified via `npx serve --help`):

```
-n, --no-clipboard    Do not copy the local address to the clipboard
```

### Implementation

In `appdev-cli.mjs` line 1022, add `"-n"` to the serve args array:

```javascript
// Current (line 1022):
var serveArgs = [absDir, "-l", String(port)];

// Fixed:
var serveArgs = [absDir, "-l", String(port), "-n"];
```

This is safe on all platforms -- the flag is a no-op when clipboard isn't available anyway.

### Double Serve Observation

The "double static serve start" reported in CONTEXT.md was already addressed by the previous quick task (260404-ft9) which fixed the TOCTOU race with a mutex and re-read-after-lock pattern. The remaining "double" observation may have been the clipboard error appearing for each critic's static-serve call (even idempotent reuse), creating the illusion of multiple starts. With `--no-clipboard`, the error output disappears entirely.

Since `stdio: "ignore"` is already set on the spawned process (line 1031), the clipboard error likely appears in the Windows Event Log or as a system-level toast, not in stdout/stderr. The `--no-clipboard` flag prevents the attempt entirely, which is the correct fix regardless.

## Finding 4: Generator Ignoring Website Classification

**Confidence:** HIGH

### Root Cause Analysis

The generator.md Tech Stack Selection section has a structural problem:

1. **Lines 44-69:** Project-Type Classification with clear website vs app guidance. "Museum" is explicitly listed as a website keyword. Websites get "static HTML, CSS, and vanilla JavaScript."

2. **Lines 71-90:** General stack selection that opens with "Choose the best technology stack for the product based on your judgment" and lists "React/Vite" as a "common strong choice" for "single-page apps."

The Generator correctly classified "museum" as a website but then read lines 71-90 and selected React/Vite anyway. The general section effectively overrides the classification section because:
- "Choose the best technology stack" gives blanket permission to use any framework
- "React/Vite" is listed as a strong choice without qualification
- The Vite+ default section (line 84) says "For greenfield web projects, Vite+ is the default" -- "web projects" doesn't distinguish websites from apps

### Fix Strategy (per CONTEXT.md: strengthen language, don't change policy)

The general stack selection (lines 71-90) must be explicitly scoped to apps only. Websites have their stack determined by the classification -- no further selection is needed.

Specific changes:
1. Add a transition sentence after line 69 that makes the classification binding: the website stack is defined above and the remaining section applies only to app-classified projects.
2. Scope the "choose freely" paragraph (line 71) to app-classified projects only.
3. Scope the Vite+ default (line 84) to app-classified projects only, since websites don't use build tooling.
4. Add a negative instruction: "If the project was classified as a website, do not override the classification with a framework choice. Framework defaults (SPA routing, client-side rendering, build artifacts, default favicons) actively harm website quality."

### AI Features and Vanilla JS

The CONTEXT.md confirms: "Vanilla JS is also correct for AI features -- Built-in AI APIs (LanguageModel, Summarizer, etc.) are browser-native APIs with zero framework dependency." This should be reinforced in the website section (lines 58-62) to prevent the Generator from choosing React "because AI features need a framework."

## Finding 5: ASSETS-TEMPLATE.md Local Path Column

**Confidence:** HIGH

### Current State

The template has 7 columns: Asset, Type, Source, License, Attribution, URL, Verified.

When an image is downloaded and bundled locally, the URL column gets the source URL and there's no column for the local file path. Conversely, for generated/procedural assets, URL says "local" but there's no explicit local path.

### Problem

During the test, the Generator wrote "local" in the URL column for images that were actually downloaded from external sources. This loses provenance -- critics can't verify the source, and check-assets can't validate the URL.

### Fix

Add a **Local Path** column between Attribution and URL. The URL column always holds the original source URL (or "N/A" for truly local assets). The Local Path column holds the filesystem path (e.g., `public/images/hero.webp`) or "N/A" for assets not bundled locally.

Updated table:

| Asset | Type | Source | License | Attribution | Local Path | URL | Verified |
|-------|------|--------|---------|-------------|------------|-----|----------|
| hero-background.webp | image | web-search | CC0 | Unsplash / @photographer | public/images/hero.webp | https://unsplash.com/photos/abc123 | yes |
| app-logo.svg | icon | procedural/SVG | N/A | N/A | public/favicon.svg | N/A | yes |

### Column Definitions Update

- **Local Path** -- relative path to the asset file in the project, or `N/A` for assets referenced only by URL (e.g., CDN fonts loaded at runtime). For bundled images, this is the path in public/ or the static asset directory.
- **URL** -- original external source URL. For web-search and stock-api sources, this is the page or direct download link. For locally generated or procedural assets, use `N/A`.

### Impact on check-assets

The `check-assets` CLI subcommand parses the URL column to verify external URLs. With the column shift (Local Path inserted before URL), the URL column index changes. Check the `parseAssetsTable` function in appdev-cli.mjs -- it uses header detection (`urlColIndex`), not positional indexing, so it should adapt automatically. Verify this during implementation.

## Common Pitfalls

### Pitfall 1: Column Index Assumptions in check-assets
**What goes wrong:** Adding a column to ASSETS-TEMPLATE.md shifts the URL column position, breaking any positional parsing.
**How to avoid:** The `parseAssetsTable` function uses header-based column detection (`urlColIndex`). Verify this still works after the column addition.

### Pitfall 2: Missing EVALUATION.md commit in SAFETY_CAP path
**What goes wrong:** Fixing only the normal evaluation path but missing the SAFETY_CAP wrap-up path (lines 440-444).
**How to avoid:** Both code paths must get the EVALUATION.md commit step. There are exactly two: normal (line ~320) and SAFETY_CAP wrap-up (line ~440).

### Pitfall 3: Generator reading past its classification
**What goes wrong:** The Generator classifies correctly but then reads the general stack section and picks a framework anyway.
**How to avoid:** Make the classification binding by scoping the general section to apps only. Don't just add "prefer website" -- explicitly block framework selection for website-classified projects.

### Pitfall 4: serve --no-clipboard placement in args array
**What goes wrong:** Adding `-n` after `-s` (SPA mode) could be interpreted incorrectly.
**How to avoid:** Add `-n` to the base args array (line 1022) before the SPA flag is conditionally appended. Or add it at any position -- `serve` uses arg parsing that accepts flags in any order.

## Code Examples

### EVALUATION.md commit insertion (normal path)

```markdown
**Binary check:** Read `evaluation/round-N/EVALUATION.md` -- verify the file
exists and contains `## Scores`. Do NOT assess report quality -- the CLI
compiles mechanically from critic summaries.

**Commit compiled evaluation:** The orchestrator created EVALUATION.md via
compile-evaluation, so it commits the result for crash recovery and tag
integrity.

\```
Bash(git add evaluation/round-N/EVALUATION.md)
Bash(git commit -m "eval(round-N): compiled evaluation report")
\```

#### Post-Evaluation Convergence Check
```

### serve --no-clipboard fix (appdev-cli.mjs)

```javascript
// Line 1022 -- add -n to suppress clipboard copy attempt
var serveArgs = [absDir, "-l", String(port), "-n"];
```

### Generator classification binding (generator.md)

```markdown
When classification is ambiguous, prefer "website" -- content-focused projects
do not benefit from framework overhead, and framework defaults (routing,
favicon, boilerplate) actively harm the product quality for simple sites.

**The classification above is binding.** If the project is classified as a
website, use static HTML/CSS/JS as described. Do not override the
classification by selecting a framework below -- the following stack guidance
applies only to app-classified projects.
```

## Sources

### Primary (HIGH confidence)
- `plugins/application-dev/skills/application-dev/SKILL.md` -- orchestrator flow analysis
- `plugins/application-dev/agents/generator.md` -- tech stack section analysis
- `plugins/application-dev/scripts/appdev-cli.mjs` -- static-serve implementation (lines 901-1067)
- `npm view serve version` -- confirmed v14.2.6
- `npx serve --help` -- confirmed `-n`/`--no-clipboard` flag
- `npm view @playwright/cli version` -- confirmed real package v0.1.5
- `npm view @anthropic-ai/claude-code-playwright version` -- confirmed 404 (non-existent)
- `D:\projects\sandbox\application-dev-test\v1.2-patch.0\dutch-art-museum-website` -- test workspace evidence

### Secondary (MEDIUM confidence)
- Previous quick task 260404-ft9 verification report -- confirmed which issues were already addressed

## Metadata

**Confidence breakdown:**
- Hallucinated package: HIGH -- verified via npm registry + repo search + test workspace evidence
- EVALUATION.md commit gap: HIGH -- direct code reading, two insertion points identified precisely
- Clipboard error: HIGH -- serve --help confirms --no-clipboard flag exists
- Generator classification: HIGH -- structural analysis of conflicting sections in generator.md
- ASSETS-TEMPLATE.md: HIGH -- straightforward column addition with header-based parsing

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- instruction-level changes to agent definitions)
