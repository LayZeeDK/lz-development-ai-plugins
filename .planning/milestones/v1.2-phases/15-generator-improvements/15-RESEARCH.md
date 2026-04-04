# Phase 15: Generator Improvements - Research

**Researched:** 2026-04-03
**Domain:** Browser Built-in AI APIs, Vite+ toolchain, dependency freshness, skill architecture
**Confidence:** HIGH

## Summary

Phase 15 modifies Generator-side files only: the generator.md agent definition,
the browser-built-in-ai meta-skill (replacing browser-prompt-api), and the
vite-plus skill refresh. All four requirements (GEN-01 through GEN-04) are
documentation/instruction changes -- no CLI code, no critic changes, no
orchestrator changes.

The Browser Built-in AI platform has matured significantly since the current
browser-prompt-api skill was written. Chrome now offers 7 distinct APIs (each
with its own global object), Edge supports 4 of them via Phi-4-mini, and all
share an identical feature-detect/availability/create pattern. The Vite+ CLI
has evolved to v0.1.15 with breaking changes (env var prefix rename, argument
order change) and new commands (vpr shorthand, vp staged, vp config, vp env).
Dependency freshness is best handled as a Generator workflow instruction rather
than tooling -- greenfield context makes it a judgment call, not an automated
gate.

**Primary recommendation:** Create a browser-built-in-ai meta-skill with a lean
routing SKILL.md and 5 reference files, refresh vite-plus skill to v0.1.15,
add dependency freshness instruction to generator.md Step 1, and rewrite
generator.md Step 4 with the Built-in AI decision tree.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full Built-in AI hierarchy replaces the current three-equal-options framing
- Decision tree for Generator Step 4: (1) task-specific API, (2) LanguageModel, (3) WebLLM, (4) WebNN
- All Built-in AI APIs share identical pattern: feature detect global, check availability, create session
- Graceful degradation: when unavailable, degrade to non-AI functionality (no automatic WebLLM fallback)
- Replace browser-prompt-api skill with browser-built-in-ai meta-skill (angular-developer / playwright-testing pattern)
- Routing SKILL.md (~120 lines) with reference files per API loaded on demand
- Reference files: prompt-api.md, summarizer-api.md, writer-rewriter-api.md, translator-api.md, graceful-degradation.md
- WebLLM and WebNN remain separate skills
- Generator frontmatter changes from browser-prompt-api to browser-built-in-ai
- Dependency freshness: Generator workflow instruction in Phase 1 (Project Setup), Round 1 only
- Policy: always upgrade all dependencies to latest compatible version after scaffolding
- Fix forward on breakage; research latest docs only if fix-forward fails
- Round 2+ (fix-only mode): no dependency changes except when evaluation explicitly flags a dependency bug
- Named non-SemVer exceptions: Playwright (calver), TypeScript (minor breaks), 0.x packages
- Vite+ is the DEFAULT toolchain for compatible frameworks, not just a preference
- Generator must explicitly justify choosing plain Vite over Vite+ for a compatible framework
- Escape hatch: Angular (tsgo incompatible), Nuxt (incomplete), TanStack Start (incomplete), user prompt explicitly requests another bundler
- Adoption guidance lives in generator.md only -- orchestrator SKILL.md does not mention it
- CI diagnostic commands rewritten: vp commands primary, plain Vite equivalents in parentheses
- Full research from GitHub releases plus current viteplus.dev docs
- Prominent alpha caveat: on vp failure, research latest vite-plus docs or fall back to known working vp commands -- do NOT fall back to plain Vite

### Claude's Discretion
- Internal structure of reference files (sections, examples, code patterns) -- as long as they follow existing skill conventions
- Exact wording of dependency freshness instruction in generator.md
- How to restructure generator.md Step 4 (AI features) to reference the new decision tree
- Whether to combine or split Writer/Rewriter into one or two reference files (writer-rewriter-api.md suggested but flexible)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | Browser-agnostic LanguageModel guidance referencing both Chrome (Gemini Nano) and Edge (Phi-4-mini) with graceful degradation | Full 7-API inventory documented, Chrome vs Edge comparison table, graceful degradation patterns for all APIs, W3C spec status |
| GEN-02 | Vite+ skill refreshed for official vp CLI workflow with alpha stability caveats | v0.1.15 release notes, full CLI command inventory, breaking changes documented, updated installation URLs, bundled tool versions |
| GEN-03 | Dependency freshness checking step in Generator workflow | Best practices researched, non-SemVer exceptions documented, greenfield-specific guidance |
| GEN-04 | Strengthened Vite+ adoption guidance with compatibility escape hatch | Framework compatibility matrix updated, Angular/Nuxt/TanStack Start incompatibilities verified, default-with-escape-hatch wording patterns |
</phase_requirements>

## Standard Stack

This phase involves no new library installations. All changes are to skill
documentation and agent instructions.

### Core Technologies
| Technology | Version/Status | Purpose | Confidence |
|------------|---------------|---------|------------|
| Browser Built-in AI APIs | Chrome 138-141+ / Edge 138+ | 7 on-device AI APIs | HIGH |
| Vite+ (vp CLI) | v0.1.15 (alpha) | Unified frontend toolchain | HIGH |
| Vite | 8.0.3 (bundled in Vite+) | Dev server and build | HIGH |
| Vitest | 4.1.2 (bundled in Vite+) | Test framework | HIGH |
| Oxlint | 1.58.0 (bundled in Vite+) | Linter (ESLint replacement) | HIGH |
| Oxfmt | 0.43.0 (bundled in Vite+) | Formatter (Prettier replacement) | HIGH |
| tsgo | experimental (bundled in Vite+) | TypeScript checker (tsc replacement) | HIGH |
| Rolldown | 1.0.0-rc.12 (bundled in Vite+) | Production bundler | HIGH |

### Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-browser AI features | Custom model loading/inference | Built-in AI APIs (Summarizer, Writer, etc.) | Zero-setup, browser-managed, shared model download |
| General-purpose prompting | Raw WebGPU tensor ops | LanguageModel (Prompt API) | High-level API, native tool calling, structured output |
| Build + lint + typecheck | Separate ESLint + Prettier + tsc | `vp check` (single command) | 50-100x faster lint, 30x faster format, single config |
| Dependency freshness | Custom CLI subcommand or script | Generator workflow instruction | Greenfield-only context; judgment call, not automation |

## Architecture Patterns

### browser-built-in-ai Meta-Skill Structure

Follow the playwright-testing meta-skill pattern: lean routing SKILL.md
with on-demand reference files.

```
plugins/application-dev/skills/
|-- browser-built-in-ai/           # NEW meta-skill (replaces browser-prompt-api)
|   |-- SKILL.md                   # ~120 lines: decision tree, comparison table, shared patterns
|   '-- references/
|       |-- prompt-api.md          # LanguageModel: general-purpose, agentic, tool calling
|       |-- summarizer-api.md      # Summarizer API
|       |-- writer-rewriter-api.md # Writer and Rewriter APIs (combined -- shared W3C spec)
|       |-- translator-api.md      # Translator and LanguageDetector APIs
|       '-- graceful-degradation.md # Shared degradation pattern (migrated + generalized)
|-- browser-prompt-api/            # REMOVED (content migrated to browser-built-in-ai)
|-- browser-webllm/                # UNCHANGED
|-- browser-webnn/                 # UNCHANGED
'-- vite-plus/                     # UPDATED in place
    '-- SKILL.md                   # Refreshed to v0.1.15
```

### SKILL.md Routing Pattern

The routing SKILL.md must contain:

1. **Decision tree** -- which API to use based on the task
2. **Chrome vs Edge comparison table** -- API availability per browser
3. **Shared availability/create pattern** -- identical across all 7 APIs
4. **Graceful degradation summary** -- with Read instruction for full pattern
5. **Read instructions** -- pointing to the correct reference file per use case

### Generator Changes

```
plugins/application-dev/agents/
'-- generator.md                   # MODIFIED
    |-- frontmatter skills:        # browser-prompt-api -> browser-built-in-ai
    |-- Step 1 (Project Setup):    # ADD dependency freshness instruction
    |-- Step 4 (AI features):      # REWRITE with Built-in AI decision tree
    |-- Step 8 (diagnostic):       # REWRITE CI commands (vp primary, Vite in parens)
    '-- Vite+ preference:          # STRENGTHEN to default-with-escape-hatch
```

### Anti-Patterns to Avoid
- **Three-equal-options framing**: The old Step 4 listed Prompt API, WebLLM, and
  WebNN as equal choices. The new framing uses a clear hierarchy: task-specific
  Built-in AI API first, then LanguageModel, then WebLLM, then WebNN.
- **Automatic WebLLM fallback**: WebLLM is NOT a drop-in replacement for
  Built-in AI APIs. Different API surface, different model, different setup.
  Graceful degradation means hiding AI features, not switching to WebLLM.
- **Falling back to plain Vite on vp failure**: When Vite+ commands fail, the
  Generator should research latest vite-plus docs or fall back to known working
  vp commands -- NOT abandon Vite+ for plain Vite.

## Built-in AI APIs -- Detailed Findings

### API Inventory (7 APIs, each a separate global object)

| API | Global Object | Core Methods | Status (Chrome) | Status (Edge) |
|-----|--------------|--------------|-----------------|---------------|
| Prompt API | `LanguageModel` | create, prompt, promptStreaming, clone, destroy, append | Stable (extensions), OT (web 139-144) | Dev preview 138+ |
| Summarizer | `Summarizer` | create, summarize, summarizeStreaming, destroy | Stable 138+ | Dev preview 138+ |
| Writer | `Writer` | create, write, writeStreaming, destroy | OT 137-148 | Dev preview 138+ |
| Rewriter | `Rewriter` | create, rewrite, rewriteStreaming, destroy | OT 137-148 | Dev preview 138+ |
| Translator | `Translator` | create, translate, translateStreaming, destroy | Stable 138+ | Planned (not available) |
| Language Detector | `LanguageDetector` | create, detect | Stable 138+ | Planned (not available) |
| Proofreader | `Proofreader` | create, proofread methods | OT 141-145 | Not available |

**Confidence: HIGH** -- all data verified against Chrome developer docs, Edge
Microsoft Learn docs, and MDN Web Docs.

### Shared Pattern (identical across all APIs)

```javascript
// 1. Feature detection
if ('Summarizer' in self) { /* supported */ }

// 2. Availability check
const availability = await Summarizer.availability(options);
// Returns: "available" | "downloadable" | "downloading" | "unavailable"

// 3. Create session with monitor
const instance = await Summarizer.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
  // API-specific options here
});

// 4. Use the API
const result = await instance.summarize(text, { context: '...' });

// 5. Clean up
instance.destroy();
```

Replace `Summarizer` with any global object name. The pattern is identical.

### Chrome (Gemini Nano) vs Edge (Phi-4-mini)

| Dimension | Chrome | Edge |
|-----------|--------|------|
| Backing model | Gemini Nano (small, optimized) | Phi-4-mini (3.8B params) |
| API surface | Full 7-API suite | LanguageModel + Summarizer + Writer + Rewriter |
| Translator | Stable (expert translation model, not Gemini Nano) | Planned (not yet available) |
| Language Detector | Stable (fine-tuned detection model) | Planned (not yet available) |
| Proofreader | OT 141-145 | Not available |
| Stability | Stable (extensions) + OT (web) | Developer preview (Canary/Dev only) |
| Structured output | Yes (responseConstraint: JSON Schema, RegExp) | Yes (same API surface) |
| Tool calling | Yes (native `tools` option with auto-execution) | Yes (same API surface) |
| Multimodal input | Yes (Chrome 140+: images, canvas) | Not documented |
| Storage requirement | 22 GB free | 20 GB free |
| GPU requirement | >4 GB VRAM or CPU >=16 GB RAM | 5.5 GB VRAM |
| Enable flags | chrome://flags | edge://flags |

**Key insight for Generator**: The API surface is identical between Chrome and
Edge. Code written for Chrome works in Edge without changes. The difference is
which APIs are available and which model runs behind them. Feature detection
handles this transparently.

### Summarizer API Configuration

| Option | Values | Purpose |
|--------|--------|---------|
| `type` | `key-points`, `tl;dr`, `teaser`, `headline` | Summary style |
| `format` | `markdown`, `plain-text` | Output format |
| `length` | `short`, `medium`, `long` | Output length |
| `sharedContext` | string | Persistent context across multiple summarize calls |
| `expectedInputLanguages` | array of BCP 47 codes | Input language hints |
| `outputLanguage` | BCP 47 code | Output language |

### Writer API Configuration

| Option | Values | Purpose |
|--------|--------|---------|
| `tone` | `formal`, `neutral`, `casual` | Writing tone |
| `format` | `markdown`, `plain-text` | Output format |
| `length` | `short`, `medium`, `long` | Output length |
| `sharedContext` | string | Persistent context across multiple write calls |
| `expectedInputLanguages` | array of BCP 47 codes | Input language hints |
| `outputLanguage` | BCP 47 code | Output language |

### Rewriter API Configuration

| Option | Values | Purpose |
|--------|--------|---------|
| `tone` | `as-is`, `more-formal`, `more-casual` | Tone adjustment |
| `format` | `as-is`, `markdown`, `plain-text` | Format adjustment |
| `length` | `as-is`, `shorter`, `longer` | Length adjustment |
| `sharedContext` | string | Persistent context across multiple rewrite calls |
| `expectedInputLanguages` | array of BCP 47 codes | Input language hints |
| `outputLanguage` | BCP 47 code | Output language |

### Translator API Configuration

| Option | Values | Purpose |
|--------|--------|---------|
| `sourceLanguage` | BCP 47 code (e.g., `'en'`) | Source language |
| `targetLanguage` | BCP 47 code (e.g., `'fr'`) | Target language |
| `monitor` | Function | Download progress callback |

45+ languages supported. Uses expert translation model (not Gemini Nano).

### LanguageDetector API

```javascript
const detector = await LanguageDetector.create();
const results = await detector.detect(text);
// Returns: [{ detectedLanguage: 'en', confidence: 0.95 }, ...]
```

Results are a ranked array of `{ detectedLanguage, confidence }` objects.
Short text accuracy is low -- warn about single-word inputs.

### Proofreader API (behind flag, Chrome only)

OT 141-145. Provides correction and explanation. Not in Edge.
Include as informational in the meta-skill but note it is the least mature API.

### LanguageModel Tool Calling

The browser auto-executes tool callbacks -- no manual tool-call loop:

```javascript
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'tool-response' },
  ],
  expectedOutputs: [
    { type: 'text', languages: ['en'] },
    { type: 'tool-call' },
  ],
  tools: [{
    name: 'getWeather',
    description: 'Get weather for a location',
    inputSchema: {
      type: 'object',
      properties: { location: { type: 'string' } },
      required: ['location'],
    },
    async execute({ location }) {
      return JSON.stringify(await fetchWeather(location));
    },
  }],
});
```

### Graceful Degradation Pattern (Generalized)

The existing graceful-degradation.md pattern for LanguageModel generalizes to
all Built-in AI APIs. The same 3-step pattern works:

```javascript
async function createAISession(ApiClass, options) {
  if (typeof ApiClass === 'undefined') {
    return null;
  }

  const availability = await ApiClass.availability(options);

  if (availability === 'unavailable') {
    return null;
  }

  return ApiClass.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Download: ${Math.round(e.loaded * 100)}%`);
      });
    },
  });
}

// Usage:
const summarizer = await createAISession(Summarizer, { type: 'key-points' });
if (summarizer) {
  const summary = await summarizer.summarize(text);
} else {
  // Hide or disable summarization feature
}
```

**Note:** Pass the global object itself (not a string) -- this naturally
handles feature detection since `typeof Summarizer === 'undefined'` when the
browser does not support the API.

### Permissions Policy (all APIs)

Each API has its own permissions policy directive:

| API | Directive | iframe allow |
|-----|-----------|-------------|
| LanguageModel | `language-model` | `allow="language-model"` |
| Summarizer | `summarizer` | `allow="summarizer"` |
| Writer | `writer` | `allow="writer"` |
| Rewriter | `rewriter` | `allow="rewriter"` |
| Translator | `translator` | `allow="translator"` |
| LanguageDetector | `language-detector` | `allow="language-detector"` |

Default: `'self'` (same-origin access without configuration).
None available in Web Workers.

## Vite+ v0.1.15 -- Detailed Findings

### Breaking Changes Since Current Skill

The current vite-plus SKILL.md documents Vite+ at the alpha announcement level.
Key changes in v0.1.12 through v0.1.15:

1. **Environment variable prefix renamed**: `VITE_PLUS_*` -> `VP_*` (v0.1.15)
2. **`vp run` argument order changed**: Flags must come before task name.
   `vp run -r build` (correct) vs `vp run build -r` (old, now broken) (v0.1.15)
3. **Installation URL changed**: `curl -fsSL https://viteplus.dev/install.sh | bash`
   (macOS/Linux) or `irm https://viteplus.dev/install.ps1 | iex` (Windows).
   The old `https://vite.plus` URL still works as a redirect.
4. **TypeScript peer range**: `^6.0.0` (was unspecified)
5. **Bun package manager support**: First-class in `vp create` and install

### Updated Bundled Tool Versions (v0.1.15)

| Tool | Version | Replaces |
|------|---------|----------|
| Vite | 8.0.3 | Vite (standalone) |
| Vitest | 4.1.2 | Vitest (standalone) |
| Oxlint | 1.58.0 | ESLint |
| Oxfmt | 0.43.0 | Prettier |
| tsgo | experimental | tsc (TypeScript compiler) |
| Rolldown | 1.0.0-rc.12 | Rollup / esbuild |
| tsdown | 0.21.7 | tsup (library bundling) |

### Full CLI Command Inventory (v0.1.15)

**Start phase:**
- `vp create` -- scaffold new project (templates: vite, react-router, vue, svelte)
- `vp migrate` -- migrate existing Vite project to Vite+
- `vp config` -- configure commit hooks and agent integration
- `vp staged` -- run checks on staged files (pre-commit integration)
- `vp install` -- resolve dependencies (wraps npm/pnpm/yarn/bun)
- `vp env` -- manage Node.js versions (`vp env off` to opt out)

**Development phase:**
- `vp dev` -- start Vite dev server with HMR
- `vp check` -- format (Oxfmt) + lint (Oxlint) + typecheck (tsgo) in one pass
- `vp check --fix` -- auto-fix lint and format issues
- `vp lint` -- lint only (Oxlint)
- `vp fmt` -- format only (Oxfmt)
- `vp test` -- run tests (Vitest 4.1.2)

**Execution phase:**
- `vp run <task>` -- run custom tasks defined in vite.config.ts
- `vpr <task>` -- shorthand for `vp run` (NEW in v0.1.15)
- `vp run --parallel` -- ignore task dependencies, run all at once
- `vp run --concurrency-limit N` -- limit concurrent tasks (default: 4)
- `vp cache` -- clear task cache entries
- `vpx` -- execute binaries globally
- `vp exec` -- run local project binaries
- `vp dlx` -- run package binaries without install

**Build phase:**
- `vp build` -- production build (Rolldown)
- `vp pack` -- library packaging (tsdown)
- `vp preview` -- preview production build locally

**Dependency management:**
- `vp add`, `vp remove`, `vp update`, `vp dedupe`, `vp outdated`, `vp why`, `vp info`
- `vp pm <command>` -- access underlying package manager directly

**Maintenance:**
- `vp upgrade` -- update the vp CLI itself
- `vp implode` -- uninstall vp and remove related data

### Updated Installation

**macOS/Linux:**
```bash
curl -fsSL https://viteplus.dev/install.sh | bash
```

**Windows:**
```powershell
irm https://viteplus.dev/install.ps1 | iex
```

Environment variables for customization:
- `VP_VERSION` -- version to install (default: latest)
- `VP_HOME` -- installation directory (default: `~/.vite-plus`)

### Updated Framework Compatibility (v0.1.15)

| Framework | `vp create` template | `vp check` | `vp build` | Status |
|-----------|---------------------|------------|------------|--------|
| React | `react-router` | Full support | Full support | Fully supported |
| Vue | `vue` | Script parts only | Full support | Fully supported |
| Svelte | `svelte` | Script parts only | Full support | Fully supported |
| Solid | via `vite` template | Full support | Full support | Fully supported |
| react-router | `react-router` | Full support | Full support | Fully supported |
| Angular | None | tsgo incompatible | Untested | **Not supported** |
| Nuxt | None | Partial | Partial | **Experimental** |
| TanStack Start | None | Partial | Partial | **Experimental** |

### vite.config.ts Unified Configuration

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Lint and format configuration (Oxlint + Oxfmt + tsgo)
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  // Test configuration (Vitest 4.1.2)
  test: {
    // Vitest options
  },

  // Custom task definitions
  run: {
    tasks: {
      'check-assets': {
        command: 'node scripts/check-assets.mjs',
        cache: false,
      },
    },
  },
});
```

### Alpha Stability Caveat

Vite+ is alpha software (March 2026). The skill must include a prominent caveat:

> Vite+ is alpha software. When vp commands fail unexpectedly, research the
> latest vite-plus docs or fall back to known working vp commands from a
> previous version. Do NOT fall back to plain Vite -- Vite+ is the default
> toolchain and the Generator should exhaust vp troubleshooting before
> considering alternatives.

## Dependency Freshness -- Detailed Findings

### Generator Instruction Placement

Add to Phase 1 (Project Setup), after scaffolding and before feature work.
Round 1 only -- Round 2+ is fix-only mode (cybernetics damping principle).

### Recommended Instruction Pattern

After scaffolding (vp create or framework CLI), upgrade all dependencies to
latest compatible versions. This is a greenfield project -- there is no legacy
code to break. Use pre-trained knowledge to adapt code to new APIs if needed.
Only research latest docs if fix-forward based on existing knowledge fails.

### Non-SemVer Exceptions (for Generator awareness)

| Package | Versioning | Risk |
|---------|-----------|------|
| Playwright | Calendar versioning | Minors contain new browser versions and potential breaking changes |
| TypeScript | SemVer-ish | Minors add new type checks that may break existing code |
| 0.x packages | SemVer allows breakage | Breaking changes in minor AND patch versions |

### Not Recommended: Automated Tooling

The CONTEXT.md locks the decision that dependency freshness is a Generator
workflow instruction, not an automated tool or CLI subcommand. This is correct
for the greenfield context:

- `npm outdated` shows stale deps but cannot judge upgrade safety
- `npm-check-updates` can upgrade but may break framework compatibility
- The Generator has pre-trained knowledge of framework APIs and can adapt code
- Only when fix-forward fails should the Generator research latest docs

## Common Pitfalls

### Pitfall 1: LanguageModel Browser Lock-In (from Phase description)
**What goes wrong:** Generator implements AI features assuming only Chrome's
LanguageModel (Gemini Nano) without considering Edge (Phi-4-mini) or browsers
without Built-in AI support.
**Why it happens:** Feature detection for LanguageModel alone misses the task-
specific APIs and Edge availability differences.
**How to avoid:** Use the decision tree. Feature-detect each API separately.
The shared pattern means identical code works in both browsers. Graceful
degradation hides AI features entirely when APIs are unavailable.
**Warning signs:** Code that checks only `typeof LanguageModel !== 'undefined'`
and uses LanguageModel for everything instead of task-specific APIs.

### Pitfall 2: Vite+ Too Aggressive (from Phase description)
**What goes wrong:** Generator uses Vite+ for Angular or Nuxt projects where
tsgo or integration is incompatible.
**Why it happens:** The "default toolchain" framing is misread as "mandatory."
**How to avoid:** Escape hatch is preserved. Generator must check framework
compatibility before choosing Vite+. Angular, Nuxt, TanStack Start get plain
Vite. User prompt requesting another bundler overrides Vite+ default.
**Warning signs:** `vp check` failing on Angular decorator metadata, Nuxt
build errors from incomplete Vite+ integration.

### Pitfall 3: Stale Vite+ Skill Information
**What goes wrong:** The current skill references installation URLs, env var
prefixes, or command syntax from older versions.
**Why it happens:** Vite+ is alpha software with breaking changes between releases.
**How to avoid:** Skill must document tested version (v0.1.15) and include the
alpha caveat. Key changes: install URLs are now viteplus.dev, env vars are VP_*
not VITE_PLUS_*, vp run flags come before task name.
**Warning signs:** Installation scripts failing, env vars not being read, vp run
arguments being swallowed.

### Pitfall 4: WebLLM as Fallback for Built-in AI
**What goes wrong:** Generator automatically falls back to WebLLM when Built-in
AI APIs are unavailable.
**Why it happens:** Seems like a natural progressive enhancement.
**Why it's wrong:** WebLLM has a fundamentally different API (OpenAI-compatible),
requires WebGPU, downloads separate models, and has different setup. It is NOT
a drop-in replacement. The correct degradation is: hide AI features.
**Warning signs:** Code that wraps both LanguageModel and WebLLM behind a
unified interface.

### Pitfall 5: Dependency Upgrade in Fix-Only Rounds
**What goes wrong:** Generator upgrades dependencies in Round 2+ while fixing
evaluation feedback, introducing new breakage.
**Why it happens:** Generator sees outdated dependency while investigating a bug.
**How to avoid:** Explicit instruction: Round 2+ has no dependency changes.
Exception: evaluation explicitly flags a dependency bug.
**Warning signs:** Package.json changes in rounds 2+ that are not traced to
evaluation report items.

### Pitfall 6: Skill Content Exceeds Size Thresholds
**What goes wrong:** Reference files become too large, consuming excessive
context when loaded.
**Why it happens:** Trying to be comprehensive with code examples for every API
option and edge case.
**How to avoid:** Follow existing skill conventions. SKILL.md under 120 lines
(routing only). Reference files focus on patterns and gotchas, not exhaustive
API documentation. Link to official docs for full reference.
**Warning signs:** Reference file exceeding 300 lines, duplicating information
available in official documentation.

## Code Examples

### Generalized Graceful Degradation (for reference file)

```javascript
// Generic helper for any Built-in AI API
async function tryCreateSession(ApiGlobal, options = {}) {
  if (typeof ApiGlobal === 'undefined') return null;

  const availability = await ApiGlobal.availability(options);
  if (availability === 'unavailable') return null;

  return ApiGlobal.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Download: ${Math.round(e.loaded * 100)}%`);
      });
    },
  });
}

// Per-API usage
const summarizer = await tryCreateSession(Summarizer, {
  type: 'key-points',
  format: 'markdown',
  length: 'short',
});

const writer = await tryCreateSession(Writer, {
  tone: 'formal',
  format: 'plain-text',
  length: 'medium',
});

const translator = await tryCreateSession(Translator, {
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
```

### Decision Tree for Generator Step 4

```
SPEC.md mentions AI features?
|-- YES
|   |-- Task-specific need?
|   |   |-- Summarize text -> Summarizer API (references/summarizer-api.md)
|   |   |-- Write new content -> Writer API (references/writer-rewriter-api.md)
|   |   |-- Rewrite/refine text -> Rewriter API (references/writer-rewriter-api.md)
|   |   |-- Translate text -> Translator API (references/translator-api.md)
|   |   |-- Detect language -> LanguageDetector (references/translator-api.md)
|   |   |-- Proofread text -> Proofreader API (limited, Chrome only)
|   |   '-- None of the above -> continue below
|   |-- General-purpose / agentic / tool-calling?
|   |   '-- YES -> LanguageModel (references/prompt-api.md)
|   |-- Specific model selection (Llama, Mistral, etc.)?
|   |   '-- YES -> WebLLM (browser-webllm skill)
|   |-- Non-LLM inference (vision, audio, embeddings)?
|   |   '-- YES -> WebNN (browser-webnn skill)
|   '-- Always: graceful degradation (references/graceful-degradation.md)
'-- NO -> skip AI feature step
```

### Updated Generator Step 8 CI Commands

```
1. Build: `vp build` (or `npm run build` if using plain Vite)
2. Production build state recording
3. Static analysis: `vp check` (or `npx tsc --noEmit && npx eslint .` if plain Vite)
4. Unit tests: `vp test` (or `npx vitest run --project unit`)
5. Browser tests: `npx vitest run --project browser` (same regardless of Vite+)
6. E2e tests: `npx playwright test` (same regardless of Vite+)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.ai.languageModel` | `LanguageModel` global | Chrome 141 | Old namespace deprecated, use direct global |
| `window.ai.summarizer` | `Summarizer` global | Chrome 141 | Same pattern change |
| `topK`/`temperature` on LanguageModel | Deprecated (silently ignored in web) | Chrome 138 | Only honored in extension contexts |
| `curl -fsSL https://vite.plus \| bash` | `curl -fsSL https://viteplus.dev/install.sh \| bash` | v0.1.12+ | Old URL redirects but skill should use new |
| `irm https://vite.plus/ps1 \| iex` | `irm https://viteplus.dev/install.ps1 \| iex` | v0.1.12+ | Same redirect situation |
| `VITE_PLUS_*` env vars | `VP_*` env vars | v0.1.15 | Breaking change |
| `vp run build -r` | `vp run -r build` | v0.1.15 | Flags before task name now |
| Oxlint 1.52 | Oxlint 1.58.0 | v0.1.15 | Bundled tool upgrade |
| Vitest 4.1 | Vitest 4.1.2 | v0.1.15 | Bundled tool upgrade |

## Open Questions

1. **Proofreader API in SKILL.md**
   - What we know: OT 141-145 in Chrome, not in Edge, behind flag
   - What's unclear: Whether it is mature enough to recommend in Generated apps
   - Recommendation: Mention in comparison table as informational. Do not add a
     dedicated reference file -- it would be premature given its early state

2. **Writer/Rewriter Combined vs Separate Reference Files**
   - What we know: CONTEXT.md suggests writer-rewriter-api.md (combined). They
     share the W3C Writing Assistance APIs spec. Options differ slightly (tone
     values, length values use "as-is" prefix for Rewriter)
   - Recommendation: Combine into one file. They share the same spec, same
     create/monitor/destroy pattern, and differ only in option values. A single
     reference file is cleaner and avoids duplication

3. **Translator + LanguageDetector Combined vs Separate**
   - What we know: CONTEXT.md suggests translator-api.md covers both. MDN
     documents them together as "Translator and Language Detector APIs"
   - Recommendation: Combine in translator-api.md. LanguageDetector is often
     used alongside Translator (detect then translate). MDN treats them as paired

4. **Vite+ vp prepare and pre-commit hooks**
   - What we know: The docs mention `vp staged` and `vp config` for commit hooks
   - What's unclear: Exact configuration details for pre-commit integration
   - Recommendation: Mention in skill but do not detail -- Generator can use
     `vp config` interactively if needed. Not relevant to the diagnostic battery

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (documentation changes only) |
| Config file | N/A |
| Quick run command | Manual: Read modified files, verify content matches requirements |
| Full suite command | Manual: Full file review + generator.md frontmatter check |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-01 | browser-built-in-ai meta-skill routes to correct API reference based on use case | manual-only | Verify SKILL.md contains decision tree, Chrome vs Edge table, 5 reference files exist | N/A |
| GEN-02 | vite-plus skill reflects v0.1.15 CLI, breaking changes, alpha caveats | manual-only | Verify SKILL.md updated versions, installation URLs, env vars, breaking changes | N/A |
| GEN-03 | Generator workflow includes dependency freshness instruction in Step 1 | manual-only | Verify generator.md Step 1 contains upgrade instruction + non-SemVer exceptions | N/A |
| GEN-04 | Vite+ is default with escape hatch, CI commands vp-first | manual-only | Verify generator.md Vite+ paragraph + Step 8 commands updated | N/A |

**Justification for manual-only:** All changes are to Markdown instruction files
(agent definitions and skills). There is no executable code to test. Verification
is a content review confirming the documented patterns, tables, and instructions
match the research findings.

### Sampling Rate
- **Per task commit:** Read modified files, verify structure and content
- **Per wave merge:** Full review of all modified files
- **Phase gate:** Verify all 4 requirements addressed before /gsd:verify-work

### Wave 0 Gaps
None -- no test infrastructure needed. All deliverables are documentation.

## Sources

### Primary (HIGH confidence)
- Chrome Built-in AI overview: https://developer.chrome.com/docs/ai/built-in-apis
- Chrome Prompt API: https://developer.chrome.com/docs/ai/prompt-api
- Chrome Summarizer API: https://developer.chrome.com/docs/ai/summarizer-api
- Chrome Writer API: https://developer.chrome.com/docs/ai/writer-api
- Chrome Rewriter API: https://developer.chrome.com/docs/ai/rewriter-api
- Chrome Translator API: https://developer.chrome.com/docs/ai/translator-api
- Chrome Language Detection: https://developer.chrome.com/docs/ai/language-detection
- Chrome Proofreader API: https://developer.chrome.com/docs/ai/proofreader-api
- Edge Prompt API: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api
- Edge Writing Assistance APIs: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/writing-assistance-apis
- MDN Translator and Language Detector: https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs
- MDN Summarizer API: https://developer.mozilla.org/en-US/docs/Web/API/Summarizer_API
- W3C Prompt API proposal: https://github.com/webmachinelearning/prompt-api
- W3C Writing Assistance APIs: https://github.com/webmachinelearning/writing-assistance-apis
- Vite+ releases: https://github.com/voidzero-dev/vite-plus/releases
- Vite+ docs: https://viteplus.dev/guide/
- Vite+ announcement: https://voidzero.dev/posts/announcing-vite-plus-alpha
- Existing research: research/browser-built-in-ai-apis.md (committed to repo)

### Secondary (MEDIUM confidence)
- Edge blog announcement: https://blogs.windows.com/msedgedev/2025/05/19/introducing-the-prompt-and-writing-assistance-apis/
- Phi-4-mini model card: https://huggingface.co/microsoft/Phi-4-mini-instruct

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Built-in AI APIs: HIGH -- verified against Chrome developer docs, Edge Microsoft Learn, MDN, W3C specs
- Vite+ v0.1.15: HIGH -- verified against GitHub releases, viteplus.dev official docs
- Dependency freshness: HIGH -- well-understood domain, locked decision from CONTEXT.md
- Skill architecture: HIGH -- following established patterns already in the codebase (playwright-testing, angular-developer)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (Built-in AI APIs evolving; Vite+ releasing frequently)
