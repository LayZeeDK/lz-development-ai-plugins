---
name: browser-built-in-ai
description: >
  This skill should be used when the Generator agent needs to implement on-device
  AI features using any Browser Built-in AI API. Covers the full 7-API suite:
  Summarizer, Writer, Rewriter, Translator, LanguageDetector, Proofreader, and
  LanguageModel (Prompt API). Routes to the correct API based on the task, with
  Chrome (Gemini Nano) and Edge (Phi-4-mini) browser-agnostic guidance and
  graceful degradation. Trigger when: SPEC.md references Built-in AI, Summarizer,
  Writer, Rewriter, Translator, LanguageDetector, Proofreader, LanguageModel,
  Prompt API, on-device AI, Gemini Nano, Phi-4-mini, or browser-local AI.
  Do NOT trigger for WebLLM (use browser-webllm) or WebNN (use browser-webnn).
---

# Browser Built-in AI Skill

Seven on-device AI APIs sharing an identical availability/create pattern.
Chrome uses Gemini Nano; Edge uses Phi-4-mini (3.8B params). The API surface
is the same -- code once, works in both. Feature detection handles differences.

Types: `npm install --save-dev @types/dom-chromium-ai`

**Default browser channel:** `msedge` (Phi-4-mini, 3.8B params -- more capable
than Chrome's Gemini Nano for most tasks). When configuring Playwright or Vitest
Browser Mode for testing browser AI features, prefer `channel: 'msedge'`. See
`vitest-browser/SKILL.md` section 3 for fallback chain.

---

## 1. Which API to use

```
SPEC.md mentions AI features?
|-- YES
|   |-- Task-specific need?
|   |   |-- Summarize text         -> Summarizer API
|   |   |-- Write new content      -> Writer API
|   |   |-- Rewrite / refine text  -> Rewriter API
|   |   |-- Translate text         -> Translator API
|   |   |-- Detect language        -> LanguageDetector
|   |   |-- Proofread text         -> Proofreader (Chrome OT only, limited)
|   |   '-- None of the above      -> continue below
|   |-- General-purpose / agentic / tool-calling / structured output?
|   |   '-- YES -> LanguageModel (Prompt API)
|   |-- Need specific model (Llama, Mistral, etc.)?
|   |   '-- YES -> WebLLM (browser-webllm skill)
|   |-- Non-LLM inference (vision, audio, embeddings)?
|   |   '-- YES -> WebNN (browser-webnn skill)
|   '-- Always apply graceful degradation
'-- NO -> skip AI feature step
```

**Read the matching reference file for implementation details:**

| Use case | Reference file |
|----------|---------------|
| Summarize text | `references/summarizer-api.md` |
| Write or rewrite text | `references/writer-rewriter-api.md` |
| Translate or detect language | `references/translator-api.md` |
| General-purpose / agentic / tool calling | `references/prompt-api.md` |
| Graceful degradation pattern | `references/graceful-degradation.md` |

---

## 2. Chrome vs Edge comparison

| API | Global Object | Chrome | Edge |
|-----|--------------|--------|------|
| Prompt API | `LanguageModel` | Stable (extensions), OT 139-144 (web) | Dev preview 138+ |
| Summarizer | `Summarizer` | Stable 138+ | Dev preview 138+ |
| Writer | `Writer` | OT 137-148 | Dev preview 138+ |
| Rewriter | `Rewriter` | OT 137-148 | Dev preview 138+ |
| Translator | `Translator` | Stable 138+ | Planned (not available) |
| Language Detector | `LanguageDetector` | Stable 138+ | Planned (not available) |
| Proofreader | `Proofreader` | OT 141-145 | Not available |

Chrome backs all APIs with Gemini Nano (except Translator which uses an expert
translation model). Edge backs LanguageModel, Summarizer, Writer, and Rewriter
with Phi-4-mini. The API surface is identical between browsers -- feature
detection handles availability transparently.

---

## 3. Shared availability/create pattern

All 7 APIs follow the same 3-step pattern. Replace the global name as needed:

```javascript
// 1. Feature detection
if (typeof Summarizer === 'undefined') { /* not supported */ }

// 2. Availability check
const availability = await Summarizer.availability(options);
// Returns: "available" | "downloadable" | "downloading" | "unavailable"

// 3. Create with download monitor
const instance = await Summarizer.create({
  ...options,
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});
```

If availability is `"downloadable"`, `create()` requires user activation
(click, keypress). Always pass the same options to `availability()` and
`create()`. None of the APIs are available in Web Workers.

---

## 4. Graceful degradation

When a Built-in AI API is unavailable, hide or disable the AI feature. Do NOT
fall back to WebLLM -- it has a different API surface, different model, and
different setup. It is not a drop-in replacement.

Use the generic `tryCreateSession(ApiGlobal, options)` helper that works with
any Built-in AI API. Read `references/graceful-degradation.md` for the full
pattern with per-API usage examples.

---

## 5. Permissions policy

Each API has its own directive. Default allowlist is `'self'` (same-origin
works without configuration). Cross-origin iframes need `allow="<directive>"`.

| API | Directive |
|-----|-----------|
| LanguageModel | `language-model` |
| Summarizer | `summarizer` |
| Writer | `writer` |
| Rewriter | `rewriter` |
| Translator | `translator` |
| LanguageDetector | `language-detector` |
