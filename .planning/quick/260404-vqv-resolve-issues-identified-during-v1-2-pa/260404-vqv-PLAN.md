---
phase: 260404-vqv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - plugins/application-dev/skills/application-dev/SKILL.md
  - plugins/application-dev/scripts/appdev-cli.mjs
  - plugins/application-dev/agents/generator.md
  - plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md
autonomous: true
requirements: [VQV-01, VQV-02, VQV-03, VQV-04, VQV-05]

must_haves:
  truths:
    - "SKILL.md Step 0.5 does not reference @playwright/cli or any hallucinated package name"
    - "EVALUATION.md is committed after compile-evaluation in both normal and SAFETY_CAP evaluation paths"
    - "Static serve starts without clipboard error on Windows (--no-clipboard flag)"
    - "Generator cannot override website classification with a framework choice"
    - "ASSETS-TEMPLATE.md has a Local Path column between Attribution and URL"
  artifacts:
    - path: "plugins/application-dev/skills/application-dev/SKILL.md"
      provides: "Orchestrator workflow with EVALUATION.md commit step and no hallucinated package"
      contains: "eval(round-N): compiled evaluation report"
    - path: "plugins/application-dev/scripts/appdev-cli.mjs"
      provides: "Static serve with --no-clipboard flag"
      contains: '"-n"'
    - path: "plugins/application-dev/agents/generator.md"
      provides: "Binding classification guardrail for websites"
      contains: "The classification above is binding"
    - path: "plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md"
      provides: "Asset manifest template with Local Path column"
      contains: "Local Path"
  key_links:
    - from: "plugins/application-dev/skills/application-dev/SKILL.md"
      to: "plugins/application-dev/scripts/appdev-cli.mjs"
      via: "compile-evaluation -> commit -> round-complete sequence"
      pattern: "git commit.*compiled evaluation report"
    - from: "plugins/application-dev/agents/generator.md"
      to: "plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md"
      via: "Generator reads ASSETS-TEMPLATE.md in Phase 4 Step 7"
      pattern: "Local Path"
---

<objective>
Fix five remaining issues from the v1.2 patch.0 Dutch art museum test: (1) hallucinated
@anthropic-ai/claude-code-playwright package in SKILL.md, (2) EVALUATION.md not committed
after compile-evaluation, (3) clipboard error from serve on Windows, (4) Generator
ignoring its own website classification, (5) ASSETS-TEMPLATE.md missing Local Path column.

Purpose: Prevent recurrence of orchestrator, evaluator, and generator issues observed during
the patch.0 test run. Each fix addresses a specific failure mode observed in the test.

Output: Updated SKILL.md, appdev-cli.mjs, generator.md, and ASSETS-TEMPLATE.md.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@plugins/application-dev/skills/application-dev/SKILL.md
@plugins/application-dev/scripts/appdev-cli.mjs
@plugins/application-dev/agents/generator.md
@plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md
@.planning/quick/260404-vqv-resolve-issues-identified-during-v1-2-pa/260404-vqv-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix orchestrator and evaluator issues (SKILL.md + appdev-cli.mjs)</name>
  <files>plugins/application-dev/skills/application-dev/SKILL.md, plugins/application-dev/scripts/appdev-cli.mjs</files>
  <action>
Three changes across two files:

**SKILL.md -- Remove hallucinated package from Step 0.5 (lines 144-148):**

1. Delete the `@playwright/cli` install block entirely (lines 144-148: the instruction
   text "Install @playwright/cli, @playwright/test, and serve as dev dependencies:" and
   the code block `Bash(npm install --save-dev @playwright/cli)`). Replace the instruction
   text with: "Install @playwright/test and serve as dev dependencies:" Keep only the
   two remaining install blocks for @playwright/test and serve.

2. Add a negative instruction after the serve install block (after current line 158, the
   "The `serve` package..." paragraph). Insert:

   ```
   Do NOT install @playwright/cli, @anthropic-ai/claude-code-playwright, or any other
   Playwright package besides @playwright/test. Critics use `npx playwright-cli` which
   resolves via npx's remote package resolution -- no local devDependency needed.
   ```

3. Update frontmatter compatibility note (line 14-17). Change:
   `Requires @playwright/cli and @playwright/test as project devDependencies`
   to:
   `Requires @playwright/test and serve as project devDependencies`

**SKILL.md -- Add EVALUATION.md commit after compile-evaluation (two paths):**

4. Normal evaluation path: After the binary check paragraph (lines 318-320, ending with
   "compiles mechanically from critic summaries.") and BEFORE the "#### Post-Evaluation
   Convergence Check" heading (line 322), insert:

   ```markdown
   **Commit compiled evaluation:** The orchestrator created EVALUATION.md via
   compile-evaluation, so it commits the result for crash recovery and tag integrity.

   ```
   Bash(git add evaluation/round-N/EVALUATION.md)
   Bash(git commit -m "eval(round-N): compiled evaluation report")
   ```
   ```

5. SAFETY_CAP wrap-up path: After the compile-evaluation call (line 440) and BEFORE the
   "Run convergence check:" line (line 442), insert the same commit block but with
   round {N+1}:

   ```markdown
   - Commit compiled evaluation:
     ```
     Bash(git add evaluation/round-{N+1}/EVALUATION.md)
     Bash(git commit -m "eval(round-{N+1}): compiled evaluation report")
     ```
   ```

**appdev-cli.mjs -- Add --no-clipboard flag to serve (line 1022):**

6. Change line 1022 from:
   `var serveArgs = [absDir, "-l", String(port)];`
   to:
   `var serveArgs = [absDir, "-l", String(port), "-n"];`

   The `-n` flag suppresses the clipboard copy attempt that causes "Access Denied"
   errors on Windows in automated/detached processes.
  </action>
  <verify>
    <automated>git grep -c "@playwright/cli" -- "plugins/application-dev/skills/application-dev/SKILL.md" | rg ":0$" && git grep -c "compiled evaluation report" -- "plugins/application-dev/skills/application-dev/SKILL.md" | rg ":[2-9]" && git grep -c '"-n"' -- "plugins/application-dev/scripts/appdev-cli.mjs" | rg ":[1-9]"</automated>
  </verify>
  <done>
SKILL.md no longer references @playwright/cli in Step 0.5 install instructions.
SKILL.md frontmatter says "Requires @playwright/test and serve".
SKILL.md has a negative instruction against installing hallucinated Playwright packages.
EVALUATION.md commit step exists in both normal evaluation and SAFETY_CAP paths.
appdev-cli.mjs passes "-n" to serve args to suppress clipboard copy.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix generator classification and ASSETS-TEMPLATE (generator.md + ASSETS-TEMPLATE.md)</name>
  <files>plugins/application-dev/agents/generator.md, plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md</files>
  <action>
Two changes across two files:

**generator.md -- Make website classification binding (lines 69-71):**

1. After line 69 ("...actively harm the product quality for simple sites.") and BEFORE
   line 71 ("Choose the best technology stack..."), insert a binding classification
   paragraph:

   ```markdown
   **The classification above is binding.** If the project is classified as a website,
   use static HTML/CSS/JS as described above. Do not override the classification by
   selecting a framework in the section below -- the following stack guidance applies
   only to app-classified projects. Framework defaults (SPA routing, client-side
   rendering, build artifacts, default favicons) actively harm website quality. Vanilla
   JS is also correct for AI features -- Built-in AI APIs (LanguageModel, Summarizer,
   etc.) are browser-native APIs with zero framework dependency.
   ```

2. Scope the general stack selection paragraph. Change line 71 from:
   `Choose the best technology stack for the product based on your judgment. Consider:`
   to:
   `**For app-classified projects**, choose the best technology stack based on your judgment. Consider:`

3. Scope the Vite+ default paragraph. Change line 84 from:
   `**Vite+ default:** For greenfield web projects, Vite+ is the default toolchain...`
   to:
   `**Vite+ default:** For greenfield app projects, Vite+ is the default toolchain...`
   (Change "web projects" to "app projects" to prevent websites from being caught
   by this default.)

**ASSETS-TEMPLATE.md -- Add Local Path column:**

4. Update the table header from:
   `| Asset | Type | Source | License | Attribution | URL | Verified |`
   to:
   `| Asset | Type | Source | License | Attribution | Local Path | URL | Verified |`

5. Update the separator row to match (add one more column separator).

6. Update every example row to include a Local Path value. Per the research findings:
   - hero-background.webp: `public/images/hero-background.webp`
   - app-logo.svg: `public/favicon.svg`
   - inter-variable.woff2: `public/fonts/inter-variable.woff2`
   - onboarding-demo.mp4: `public/media/onboarding-demo.mp4`
   - product-photo.jpg: `public/images/product-photo.jpg`
   - notification.mp3: `public/audio/notification.mp3`

7. For rows with external URLs (hero-background, inter-variable, product-photo), keep
   the URL column as-is (the actual external URL). For rows previously showing `local`
   in URL, change URL to `N/A` since the Local Path column now holds the local path.

8. Update the Column Definitions section. Add a new definition for Local Path (insert
   between Attribution and URL definitions):
   - **Local Path** -- relative path to the asset file in the project, or `N/A` for
     assets referenced only by URL (e.g., CDN fonts loaded at runtime). For bundled
     images, this is the path in public/ or the static asset directory.

9. Update the URL definition to clarify the dual-column semantics:
   - **URL** -- original external source URL. For web-search and stock-api sources,
     this is the page or direct download link. For locally generated or procedural
     assets, use `N/A`. Never write `local` in this column -- use the Local Path
     column for filesystem paths.
  </action>
  <verify>
    <automated>git grep -c "classification above is binding" -- "plugins/application-dev/agents/generator.md" | rg ":[1-9]" && git grep -c "app-classified projects" -- "plugins/application-dev/agents/generator.md" | rg ":[1-9]" && git grep -c "Local Path" -- "plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md" | rg ":[3-9]"</automated>
  </verify>
  <done>
generator.md has a binding classification paragraph between the website/app classification
and the general stack selection. The general stack section is explicitly scoped to
app-classified projects. Vite+ default says "app projects" not "web projects".
ASSETS-TEMPLATE.md has an 8-column table with Local Path between Attribution and URL.
All example rows have appropriate Local Path values. URL column never shows "local" --
locally generated assets use "N/A" for URL. Column Definitions include Local Path with
clear guidance on when to use N/A.
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `git grep "@playwright/cli" -- "plugins/application-dev/skills/application-dev/SKILL.md"` returns ZERO matches (not in install instructions, not in compatibility note)
2. `git grep "compiled evaluation report" -- "plugins/application-dev/skills/application-dev/SKILL.md"` returns at least 2 matches (normal path + SAFETY_CAP path)
3. `git grep '"-n"' -- "plugins/application-dev/scripts/appdev-cli.mjs"` returns at least 1 match in the serveArgs line
4. `git grep "classification above is binding" -- "plugins/application-dev/agents/generator.md"` returns 1 match
5. `git grep "Local Path" -- "plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md"` returns 3+ matches (header, definition, examples)
6. `git grep "| local |" -- "plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md"` returns ZERO matches (no more "local" in URL column)
</verification>

<success_criteria>
- SKILL.md Step 0.5 installs only @playwright/test and serve (2 packages, not 3)
- SKILL.md has negative instruction against hallucinated Playwright packages
- EVALUATION.md commit appears in both normal and SAFETY_CAP evaluation paths
- serve launched with -n flag to suppress clipboard copy
- Generator cannot read past website classification into framework selection
- ASSETS-TEMPLATE.md tracks both Local Path and URL as separate columns
- No "local" values appear in the URL column of the template
</success_criteria>

<output>
After completion, create `.planning/quick/260404-vqv-resolve-issues-identified-during-v1-2-pa/260404-vqv-01-SUMMARY.md`
</output>
