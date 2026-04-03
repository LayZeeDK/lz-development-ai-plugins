# Phase 15: Generator Improvements - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve the Generator's AI feature guidance, dependency management, and toolchain adoption. The Generator produces applications with browser-agnostic AI features using the full Built-in AI API suite, current dependencies, and modern Vite+ tooling where compatible. This phase modifies Generator-side files only (generator.md, skills, references) -- no changes to critics, orchestrator, or CLI.

</domain>

<decisions>
## Implementation Decisions

### Built-in AI API hierarchy (GEN-01)
- Full Built-in AI hierarchy replaces the current three-equal-options framing
- Decision tree for Generator Step 4:
  1. Task-specific need (summarize, write, rewrite, translate, detect language)? Use the matching Built-in AI API (Summarizer, Writer, Rewriter, Translator, LanguageDetector)
  2. General-purpose / agentic / tool-calling? Use LanguageModel (Prompt API) -- supports native tool calling with automatic browser-side execution, structured output, streaming, multimodal
  3. Need specific model selection (Llama, Mistral, etc.)? Use WebLLM
  4. Non-LLM inference (vision, audio, embeddings)? Use WebNN
- All Built-in AI APIs share identical pattern: feature detect global, check availability, create session
- Chrome uses Gemini Nano, Edge uses Phi-4-mini (3.8B params, more capable) -- API surface is identical, code once works in both
- Graceful degradation: when Built-in AI APIs are unavailable, degrade to non-AI functionality (hide AI features, show "not supported"). No automatic WebLLM fallback -- different API, different model, not a drop-in replacement

### browser-built-in-ai meta-skill (GEN-01)
- Replace browser-prompt-api skill with browser-built-in-ai meta-skill following angular-developer / playwright-testing pattern
- Routing SKILL.md (~120 lines): decision tree, Chrome vs Edge comparison table, graceful degradation pattern
- Reference files per API (loaded on demand):
  - prompt-api.md -- LanguageModel (general-purpose, agentic, tool calling, structured output)
  - summarizer-api.md -- Summarizer API
  - writer-rewriter-api.md -- Writer and Rewriter APIs
  - translator-api.md -- Translator and LanguageDetector APIs
  - graceful-degradation.md -- shared degradation pattern (migrated from current skill)
- WebLLM and WebNN remain separate skills (different platform, different use cases)
- Generator frontmatter changes from browser-prompt-api to browser-built-in-ai
- Full web research from multiple sources for each API reference during planning -- Chrome docs, Edge docs, W3C specs

### Dependency freshness (GEN-03)
- Generator workflow instruction in Phase 1 (Project Setup), Round 1 only
- Policy: always upgrade all dependencies to latest compatible version after scaffolding
- Fix forward on breakage: adapt code to new APIs using pre-trained knowledge; research latest docs only if fix-forward fails
- Greenfield-only context: upgrade failures signal stale Generator knowledge, not legacy code issues
- Round 2+ (fix-only mode): no dependency changes -- cybernetics damping principle. Exception: evaluation explicitly flags a dependency bug
- Named non-SemVer exceptions list for awareness:
  - Playwright -- calver, minors contain new browser versions + breaking changes
  - TypeScript -- minors add new type checks that may break existing code
  - 0.x packages -- SemVer allows breaking changes in minor AND patch versions
- Leave upgrade method to Generator judgment (no prescribed npm commands)

### Vite+ adoption strength (GEN-02, GEN-04)
- Vite+ is the DEFAULT toolchain for compatible frameworks (React, Vue, Svelte, Solid, react-router), not just a preference
- Generator must explicitly justify choosing plain Vite over Vite+ for a compatible framework
- Escape hatch preserved for: Angular (tsgo incompatible), Nuxt (incomplete), TanStack Start (incomplete), user prompt explicitly requests another bundler
- Adoption guidance lives in generator.md only -- orchestrator SKILL.md does not mention it (GAN separation: tech stack is Generator's domain)
- CI diagnostic commands rewritten: vp commands primary, plain Vite equivalents in parentheses
- Minimal escape hatch documentation in skill -- Generator knows plain Vite from pre-trained knowledge

### Vite+ skill refresh (GEN-02)
- Full research from GitHub releases (https://github.com/voidzero-dev/vite-plus/releases, v0.1.0 through v0.1.15) plus current viteplus.dev docs
- Target latest vp CLI, document tested version (v0.1.15 as of 2026-04-01)
- Prominent alpha caveat at top of skill: on vp failure, research latest vite-plus docs or fall back to known working vp commands -- do NOT fall back to plain Vite
- Structure decision after research: self-contained if under ~500 lines (skill-creator guideline, preferred), meta-skill pattern if approaching that limit. Plugin-dev uses word-based thresholds (1,500-2,000 words ideal, <3,000 without references) -- skill-creator's line-based guidance takes precedence

### Claude's Discretion
- Internal structure of reference files (sections, examples, code patterns) -- as long as they follow existing skill conventions
- Exact wording of dependency freshness instruction in generator.md
- How to restructure generator.md Step 4 (AI features) to reference the new decision tree
- Whether to combine or split Writer/Rewriter into one or two reference files (writer-rewriter-api.md suggested but flexible)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `browser-prompt-api/SKILL.md` (350 lines): current LanguageModel/Prompt API docs -- content migrates to `browser-built-in-ai/references/prompt-api.md`
- `browser-prompt-api/references/graceful-degradation.md` (53 lines): degradation pattern -- migrates to new skill's references/
- `vite-plus/SKILL.md` (281 lines): current vp CLI reference -- updated in place after research
- `research/browser-built-in-ai-apis.md`: freshly committed research with 7-API inventory, Chrome vs Edge comparison, tool calling details, and when-to-use decision matrix

### Established Patterns
- Meta-skill pattern (angular-developer style): lean routing SKILL.md + reference files. Used by playwright-testing (SKILL.md + 3 references). Generator loads 1-2 references per invocation via progressive disclosure.
- Generator skills frontmatter + Read fallback: `skills:` frontmatter for future auto-injection (bug #25834), explicit Read instructions as working mechanism
- Self-contained skill pattern: single SKILL.md under 500 lines (vitest-browser at 307 lines, browser-webllm, browser-webnn). Used when content fits without progressive disclosure.

### Integration Points
- `generator.md` Step 4 (AI features): rewrite decision tree from three equal options to Built-in AI hierarchy
- `generator.md` Step 1 (Project Setup): add dependency freshness instruction
- `generator.md` Vite+ preference paragraph: strengthen to default-with-escape-hatch
- `generator.md` Step 8 (diagnostic battery): reorder to lead with vp commands
- `generator.md` frontmatter `skills:` list: replace browser-prompt-api with browser-built-in-ai
- `plugin.json`: may need skill name update if it references browser-prompt-api

</code_context>

<specifics>
## Specific Ideas

- "LanguageModel supports other APIs than Prompt API" -- the Built-in AI platform is 7 separate globals, not just the Prompt API. The meta-skill should route to the right API based on use case.
- "Phi-4-mini is more powerful than Gemini Nano but the browser-bundled version differs from standalone" -- document Chrome vs Edge comparison noting Phi-4-mini (3.8B params) vs Gemini Nano, but flag that Edge's version may differ from standalone in quantization and context window.
- "Some dependencies don't follow SemVer. Even minor versions should be upgraded" -- Playwright, TypeScript. For 0.x versions, patch versions should be upgraded.
- "Always upgrade all dependencies to latest compatible version" -- not just major-behind ones.
- "Don't fall back to plain Vite if vp commands fail, research latest or fall back to known vite-plus version/commands instead" -- Vite+ is the default, not a nice-to-have.
- "Only research on breakage later in Round 1 generation based on existing knowledge" -- no preemptive doc research during dependency upgrade step.
- "Full research on the web, using several sources" for each Built-in AI API reference file.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 15-generator-improvements*
*Context gathered: 2026-04-03*
