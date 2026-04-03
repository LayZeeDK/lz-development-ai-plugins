# Browser Built-in AI APIs -- Research Report

**Researched:** 2026-04-03
**Context:** Phase 15 (Generator Improvements) -- GEN-01 browser-agnostic LanguageModel guidance

## Overview

Chrome's "Built-in AI" initiative provides 7 distinct APIs, each exposed as
its own separate global object (not nested under `LanguageModel`). All run
on-device using small language models bundled with the browser.

## API Inventory

| API | Global Object | Core Methods | Backing Model |
|-----|--------------|--------------|---------------|
| Prompt API | `LanguageModel` | `create()`, `prompt()`, `promptStreaming()`, `clone()`, `destroy()`, `append()` | Gemini Nano (Chrome) / Phi-4-mini (Edge) |
| Summarizer API | `Summarizer` | `create()`, `summarize()`, `summarizeStreaming()` | Gemini Nano / Phi-4-mini |
| Writer API | `Writer` | `create()`, `write()`, `writeStreaming()` | Gemini Nano / Phi-4-mini |
| Rewriter API | `Rewriter` | `create()`, `rewrite()`, `rewriteStreaming()` | Gemini Nano / Phi-4-mini |
| Translator API | `Translator` | `create()`, `translate()`, `translateStreaming()` | Expert translation model (not Gemini Nano) |
| Language Detector API | `LanguageDetector` | `create()`, `detect()` | Fine-tuned detection model |
| Proofreader API | `Proofreader` | `create()`, proofread methods | Gemini Nano |

Every API shares the same pattern:

```javascript
// Feature detection
if ('Summarizer' in self) { /* supported */ }

// Availability check
const availability = await Summarizer.availability();

// Create session
const instance = await Summarizer.create(options);
```

## Global Object Architecture

Each API has its own top-level global -- they are NOT accessed through
`LanguageModel`. The old `window.ai.languageModel` / `self.ai.summarizer`
path is deprecated. Current access:

- `LanguageModel` -- general-purpose prompting (the Prompt API)
- `Summarizer` -- task-specific summarization
- `Writer` -- task-specific content generation
- `Rewriter` -- task-specific text refinement
- `Translator` -- translation between language pairs
- `LanguageDetector` -- language identification
- `Proofreader` -- grammar and spelling correction

The task-specific APIs (Summarizer, Writer, Rewriter, Translator, Language
Detector, Proofreader) are higher-level wrappers with constrained parameters
(tone, length, format, language pairs), while `LanguageModel` is the
general-purpose escape hatch for anything those APIs don't cover.

## Browser Support Status

### Chrome

| API | Status | Version |
|-----|--------|---------|
| Translator | Stable | 138+ |
| Language Detector | Stable | 138+ |
| Summarizer | Stable | 138+ |
| Prompt API (Extensions) | Stable | 138+ |
| Prompt API (Web) | Origin trial | 139-144 (ends March 2026), multimodal OT ongoing |
| Writer | Origin trial | 137-148 |
| Rewriter | Origin trial | 137-148 |
| Proofreader | Behind flag | ~140+ |
| Structured Output (`responseConstraint`) | Available | 137+ |

### Microsoft Edge

| API | Status | Version |
|-----|--------|---------|
| Prompt API (`LanguageModel`) | Developer preview | 138+ (Canary/Dev) |
| Summarizer | Developer preview | 138+ (Canary/Dev) |
| Writer | Developer preview | 138+ (Canary/Dev) |
| Rewriter | Developer preview | 138+ (Canary/Dev) |
| Translator | Planned (not yet available) | -- |

Edge uses Phi-4-mini (3.8B params) instead of Gemini Nano, but the API
surface is identical -- same global objects, same method signatures. Code
written for Chrome's `LanguageModel` works in Edge without changes.

### Other Browsers

Firefox and Safari: No implementation. Google has requested standards
positions from Mozilla and WebKit. No public commitments yet.

### Hardware Requirements (all Built-in AI APIs)

- Windows 10/11, macOS 13+, Linux, or ChromeOS (Chromebook Plus)
- 22 GB free storage for model files
- GPU with >4 GB VRAM, or CPU with >=16 GB RAM and >=4 cores
- No Android/iOS support yet

## Chrome (Gemini Nano) vs Edge (Phi-4-mini)

| Dimension | Chrome | Edge |
|-----------|--------|------|
| Backing model | Gemini Nano (small, optimized) | Phi-4-mini (3.8B params, more capable) |
| API surface | Full 7-API suite | Prompt + Summarizer + Writer + Rewriter |
| Translator | Stable (expert translation model) | Not yet available |
| Language Detector | Stable | Not yet available |
| Proofreader | Behind flag | Not yet available |
| Stability | Stable (extensions), Origin trial (web) | Developer preview |
| Structured output | Yes (`responseConstraint`) | Yes (same API) |
| Tool calling | Yes (native `tools` option) | Yes (same API) |

**Note:** The Phi-4-mini used in Edge's LanguageModel is the browser-bundled
version, which may differ from the standalone Phi-4-mini in quantization,
context window size, and supported features. Edge's version is optimized for
on-device inference within the browser's resource constraints.

## Tool Calling / Agentic Capabilities

The Prompt API supports native tool calling via the `tools` option on
`LanguageModel.create()`. This is specified in the W3C WebML prompt-api
proposal.

```javascript
const session = await LanguageModel.create({
  tools: [{
    name: "getWeather",
    description: "Get current weather for a location",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" }
      },
      required: ["location"]
    },
    async execute({ location }) {
      const res = await fetch(`https://weather.example/api?q=${location}`);
      return JSON.stringify(await res.json());
    }
  }]
});
```

Key design differences from cloud APIs (OpenAI, Anthropic):
- **Automatic execution**: You provide the `execute` callback; the browser
  invokes it when the model requests the tool and feeds the result back
  automatically. No manual tool-call loop.
- **Concurrent calls**: The model can invoke multiple tools in parallel; the
  browser uses `Promise.all()` internally before composing the final response.
- **Declared expectations**: Sessions using tools should declare
  `expectedInputs: [{type: "tool-response"}]` and
  `expectedOutputs: [{type: "tool-call"}]`.

Additional agentic features:
- Structured output via `responseConstraint` (JSON Schema or RegExp)
- Response prefilling (assistant prefix to guide output)
- Multimodal input (images, audio, video frames)
- Session cloning (fork conversation to explore multiple paths)
- Context management (`contextUsage`/`contextWindow` properties)

## Built-in AI vs WebLLM vs WebNN

| Dimension | Built-in AI APIs | WebLLM | WebNN |
|-----------|-----------------|--------|-------|
| What it is | Browser-native APIs for on-device LLM inference | JS library for in-browser LLM inference | Browser-native API for neural network inference |
| Model choice | Browser-provided (Gemini Nano / Phi-4-mini) | Any MLC-compiled model (Llama, Phi, Gemma, etc.) | Framework-dependent (ONNX models) |
| Model management | Browser handles download, caching, updates | Developer manages downloads and caching | Developer manages via frameworks |
| Acceleration | GPU, NPU, or CPU (browser decides) | WebGPU only (no NPU) | GPU, NPU, CPU (delegates to best hardware) |
| API level | High-level (prompt in, text out) | High-level (OpenAI-compatible chat) | Low-level (tensor ops, graph execution) |
| Tool calling | Native (`tools` option) | OpenAI-compatible function calling | N/A (not an LLM API) |
| Cross-browser | Chrome + Edge only | Any browser with WebGPU | Chrome + Edge (emerging) |
| Setup | Zero -- browser provides everything | Moderate -- bundle library, manage downloads | Complex -- framework integration |

**When to use each:**
- **Built-in AI APIs**: Zero-setup AI features. Task-specific APIs for
  summarization/rewriting/translation. LanguageModel for general-purpose,
  agentic, tool-calling use cases.
- **WebLLM**: Specific model selection (Llama 3, Mistral, domain-fine-tuned),
  cross-browser WebGPU support (Firefox), larger context windows.
- **WebNN**: Non-LLM inference (image classification, object detection,
  embeddings, speech recognition). NPU acceleration.

## W3C Standardization Status

- **Prompt API**: W3C Web Incubator Community Group (WICG) proposal,
  maintained by the WebML Working Group
  (https://github.com/webmachinelearning/prompt-api)
- **Writing Assistance APIs** (Summarizer, Writer, Rewriter): Adopted by
  W3C WebML Working Group. Community Group deliverable (not yet on Standards
  Track). See: https://github.com/webmachinelearning/writing-assistance-apis
- **Translator / Language Detector**: Stable in Chrome; standards proposals
  submitted to WICG
- **Mozilla/WebKit positions**: Requested but no public commitments

The spec notes there are "no guarantees of language model quality, stability,
or interoperability between browsers" -- quality is treated as an
implementation concern.

## Sources

- Built-in AI APIs overview: https://developer.chrome.com/docs/ai/built-in-apis
- Prompt API: https://developer.chrome.com/docs/ai/prompt-api
- Prompt API proposal (W3C): https://github.com/webmachinelearning/prompt-api
- Structured output: https://developer.chrome.com/docs/ai/structured-output-for-prompt-api
- Summarizer API: https://developer.chrome.com/docs/ai/summarizer-api
- Writer API: https://developer.chrome.com/docs/ai/writer-api
- Rewriter API: https://developer.chrome.com/docs/ai/rewriter-api
- Translator API: https://developer.chrome.com/docs/ai/translator-api
- Language Detector API: https://developer.chrome.com/docs/ai/language-detection
- Edge Prompt and Writing Assistance APIs: https://blogs.windows.com/msedgedev/2025/05/19/introducing-the-prompt-and-writing-assistance-apis/
- Edge Writing Assistance APIs docs: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/writing-assistance-apis
- Edge Prompt API docs: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api
- Client-side AI stack: https://web.dev/learn/ai/client-side
- Writing Assistance APIs spec (W3C): https://webmachinelearning.github.io/writing-assistance-apis/
- TypeScript types: @types/dom-chromium-ai
