---
phase: quick-260406-cpo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - plugins/application-dev/skills/browser-built-in-ai/SKILL.md
  - plugins/application-dev/skills/vitest-browser/SKILL.md
autonomous: true
requirements: [QUICK-260406-CPO]

must_haves:
  truths:
    - "SKILL.md section 6 documents feature flags for all 7 Built-in AI APIs, not just the Prompt API"
    - "Chrome and Edge flag differences are clearly documented with a per-API reference table"
    - "Both example launchOptions configs (Edge Dev and Chrome Beta) include flags for all their supported APIs"
    - "vitest-browser SKILL.md section 3 headed mode example includes both Edge and Chrome configs with full flag sets"
    - "Edge config does NOT include TranslationAPI, LanguageDetectionAPI, or AIProofreadingAPI (unsupported)"
  artifacts:
    - path: "plugins/application-dev/skills/browser-built-in-ai/SKILL.md"
      provides: "Per-API flag reference table and expanded launchOptions configs in section 6"
      contains: "AISummarizationAPI,AIWriterAPI,AIRewriterAPI"
    - path: "plugins/application-dev/skills/vitest-browser/SKILL.md"
      provides: "Expanded headed mode examples in section 3 with both Edge and Chrome configs"
      contains: "AISummarizationAPI,AIWriterAPI,AIRewriterAPI"
  key_links:
    - from: "plugins/application-dev/skills/browser-built-in-ai/SKILL.md"
      to: "plugins/application-dev/skills/vitest-browser/SKILL.md"
      via: "Cross-reference in section 6 -> vitest-browser section 3"
      pattern: "browser-built-in-ai/SKILL.md.*section 6"
---

<objective>
Add Chrome and Edge feature flags for all 7 Browser Built-in AI APIs to the
Playwright/Vitest testing configuration documentation. Currently only the
Prompt API flags are documented; the other 6 APIs (Summarizer, Writer,
Rewriter, Translator, LanguageDetector, Proofreader) each have their own
`--enable-features` flag that must be included for testing.

Purpose: Generator and evaluator agents that test AI features beyond LanguageModel
will get the correct browser flags from the skill documentation, preventing
silent failures where AI globals return `undefined`.

Output: Updated SKILL.md files with complete flag coverage for both browsers.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@plugins/application-dev/skills/browser-built-in-ai/SKILL.md
@plugins/application-dev/skills/vitest-browser/SKILL.md
@.planning/quick/260406-cpo-add-chrome-edge-flags-to-playwright-brow/260406-cpo-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update browser-built-in-ai SKILL.md section 6 with per-API flags</name>
  <files>plugins/application-dev/skills/browser-built-in-ai/SKILL.md</files>
  <action>
Edit section 6 ("Testing browser AI features (headed mode)") of
`plugins/application-dev/skills/browser-built-in-ai/SKILL.md`. Make these changes:

1. **Add a per-API feature flag reference table** after the "Required configuration"
   heading and before the code block. The table documents which `--enable-features`
   value to use per API per browser:

   | API | Chrome `--enable-features` | Edge `--enable-features` |
   |-----|---------------------------|-------------------------|
   | LanguageModel | `PromptAPIForGeminiNano` | `AIPromptAPI` |
   | Summarizer | `AISummarizationAPI` | `AISummarizationAPI` |
   | Writer | `AIWriterAPI` | `AIWriterAPI` |
   | Rewriter | `AIRewriterAPI` | `AIRewriterAPI` |
   | Translator | `TranslationAPI` | -- (not available) |
   | LanguageDetector | `LanguageDetectionAPI` | -- (not available) |
   | Proofreader | `AIProofreadingAPI` | -- (not available) |

   Chrome also requires the foundational flag `OptimizationGuideOnDeviceModel`
   for all APIs. Add a note below the table stating this.

2. **Update the Edge Dev example config** (the main code block). Change the
   `args` array from:
   ```
   '--enable-features=AIPromptAPI',
   ```
   to:
   ```
   '--enable-features=AIPromptAPI,AISummarizationAPI,AIWriterAPI,AIRewriterAPI',
   ```
   Update the inline comment from "enable AI Prompt API and disable performance
   gating" to "enable all supported Edge AI APIs". Keep `--disable-features`
   and `ignoreDefaultArgs` unchanged.

3. **Update the Chrome Beta example config**. Change:
   ```
   '--enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano',
   ```
   to:
   ```
   '--enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano,AISummarizationAPI,AIWriterAPI,AIRewriterAPI,TranslationAPI,LanguageDetectionAPI,AIProofreadingAPI',
   ```
   Add a brief inline comment: "enable all 7 Chrome AI APIs".

4. **Keep everything else unchanged**: `headless: false`, `ignoreDefaultArgs`
   list, persistent browser context section, model warm-up section, and page
   navigation requirement section.

Do NOT modify sections 1-5 or the frontmatter.
  </action>
  <verify>
    <automated>git grep -c "AISummarizationAPI" -- "plugins/application-dev/skills/browser-built-in-ai/SKILL.md" | rg -o "[0-9]+" | head -1</automated>
    Expect count >= 2 (once in the reference table, at least once in the example configs).
    Also verify: `git grep "TranslationAPI" -- "plugins/application-dev/skills/browser-built-in-ai/SKILL.md"` returns matches in the Chrome config but NOT in the Edge config block.
  </verify>
  <done>
    Section 6 of browser-built-in-ai/SKILL.md contains: (a) a per-API flag
    reference table covering all 7 APIs with Chrome and Edge columns,
    (b) Edge Dev example with 4 APIs (AIPromptAPI + 3 writing APIs),
    (c) Chrome Beta example with all 7 APIs (foundation + 7 per-API flags),
    (d) all other sections unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update vitest-browser SKILL.md section 3 headed mode examples</name>
  <files>plugins/application-dev/skills/vitest-browser/SKILL.md</files>
  <action>
Edit section 3 ("Branded browser channels") of
`plugins/application-dev/skills/vitest-browser/SKILL.md`. Specifically update
the "Headed mode for AI API testing" subsection at the end of section 3.

1. **Update the existing Edge Dev example**. Change `args` from:
   ```
   '--enable-features=AIPromptAPI',
   ```
   to:
   ```
   '--enable-features=AIPromptAPI,AISummarizationAPI,AIWriterAPI,AIRewriterAPI',
   ```
   Update the inline comment to reflect all 4 Edge AI APIs. Keep
   `--disable-features=OnDeviceModelPerformanceParams`, `headless: false`, and
   `ignoreDefaultArgs` unchanged.

2. **Add a Chrome Beta example** immediately after the Edge Dev code block,
   before the closing paragraph about non-AI browser tests. Format:

   ```
   For Chrome Beta, replace the channel and args:
   ```

   Then a code block:
   ```typescript
   provider: playwright({
     launchOptions: {
       channel: 'chrome-beta',
       headless: false, // REQUIRED for Built-in AI APIs
       args: [
         '--enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano,AISummarizationAPI,AIWriterAPI,AIRewriterAPI,TranslationAPI,LanguageDetectionAPI,AIProofreadingAPI',
       ],
       ignoreDefaultArgs: [
         '--disable-field-trial-config',
         '--disable-background-networking',
         '--disable-component-update',
       ],
     },
   }),
   ```

   Chrome does not need `--disable-features=OnDeviceModelPerformanceParams`
   (that is Edge-specific).

3. **Keep all other parts of section 3 unchanged**: the branded channels table,
   the fallback chain, the `BROWSER_CHANNEL` environment variable pattern.

Do NOT modify sections 1-2, 4-9, or the frontmatter.
  </action>
  <verify>
    <automated>git grep -c "AISummarizationAPI" -- "plugins/application-dev/skills/vitest-browser/SKILL.md" | rg -o "[0-9]+" | head -1</automated>
    Expect count >= 2 (once in Edge example, once in Chrome example).
    Also verify: `git grep "chrome-beta" -- "plugins/application-dev/skills/vitest-browser/SKILL.md"` returns at least one match in the headed mode subsection.
  </verify>
  <done>
    Section 3 of vitest-browser/SKILL.md contains: (a) Edge Dev headed mode
    example with all 4 supported Edge AI API flags, (b) a new Chrome Beta
    headed mode example with all 7 Chrome AI API flags, (c) all other
    sections unchanged.
  </done>
</task>

</tasks>

<verification>
1. `git grep "AISummarizationAPI" -- "plugins/application-dev/skills/"` returns
   matches in both SKILL.md files.
2. `git grep "AIWriterAPI" -- "plugins/application-dev/skills/"` returns matches
   in both SKILL.md files.
3. `git grep "TranslationAPI" -- "plugins/application-dev/skills/browser-built-in-ai/SKILL.md"`
   returns matches (Chrome config and reference table).
4. `git grep "TranslationAPI" -- "plugins/application-dev/skills/vitest-browser/SKILL.md"`
   returns a match (Chrome Beta example).
5. Neither file has TranslationAPI, LanguageDetectionAPI, or AIProofreadingAPI
   in an Edge config block.
6. Both files retain their existing structure (frontmatter, all numbered sections).
</verification>

<success_criteria>
- Both SKILL.md files document feature flags for all 7 Built-in AI APIs
- Chrome and Edge differences are clearly shown (Chrome has 7 APIs, Edge has 4)
- Example launchOptions configs are copy-pasteable with correct flag sets
- No regressions to existing content (frontmatter, other sections)
</success_criteria>

<output>
After completion, create `.planning/quick/260406-cpo-add-chrome-edge-flags-to-playwright-brow/260406-cpo-01-SUMMARY.md`
</output>
