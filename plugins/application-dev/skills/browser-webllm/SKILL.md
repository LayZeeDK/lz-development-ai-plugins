---
name: browser-webllm
version: "0.2.0"
description: >-
  This skill should be used when the Generator agent needs to add LLM chat or
  completion features to a web application using MLC-AI WebLLM. Triggers when:
  adding WebLLM to a project, using MLC-compiled models (Llama, Phi, Gemma,
  Qwen, DeepSeek, Mistral) for in-browser inference, implementing
  OpenAI-compatible chat completions with WebGPU acceleration, streaming LLM
  responses in the browser, or selecting and loading models at runtime.
  Do NOT trigger for server-side inference, the browser's built-in Prompt API
  (use browser-prompt-api instead), or neural network graph construction
  (use browser-webnn instead).
---

# Browser WebLLM Skill

Package: `@mlc-ai/web-llm`
Source: https://github.com/mlc-ai/web-llm
Docs: https://webllm.mlc.ai/

This skill provides the Generator agent with guidance for using MLC-AI WebLLM
-- in-browser LLM inference with WebGPU acceleration and WASM/CPU fallback.
WebLLM provides an OpenAI-compatible API (`engine.chat.completions.create()`)
running entirely client-side. Models are downloaded and cached by the app at
runtime.

---

## 1. Install

```bash
npm install @mlc-ai/web-llm
```

Or via CDN (no bundler needed):
```js
import * as webllm from "https://esm.run/@mlc-ai/web-llm";
```

---

## 2. WebGPU Feature Detection

WebLLM requires WebGPU. Detect it before attempting to create an engine:

```js
async function checkWebGPUSupport() {
  if (!navigator.gpu) {
    return { supported: false, reason: 'WebGPU not supported in this browser.' };
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return { supported: false, reason: 'No WebGPU adapter found.' };
  }

  // Some models (q4f16_1 quantization) require shader-f16
  const hasShaderF16 = adapter.features.has('shader-f16');

  return { supported: true, hasShaderF16 };
}
```

Models with `q4f32_1` quantization do NOT need `shader-f16` and work on more
devices. Prefer these for broad compatibility.

---

## 3. Create an Engine

### 3.1 Factory function (recommended)

Creates engine and loads model in one call:

```js
import { CreateMLCEngine } from '@mlc-ai/web-llm';

const engine = await CreateMLCEngine('Llama-3.2-1B-Instruct-q4f32_1-MLC', {
  initProgressCallback: (report) => {
    const pct = (report.progress * 100).toFixed(1);
    console.log(`${report.text} -- ${pct}%`);
  },
});
```

### 3.2 Web Worker (offload to background thread)

```js
// worker.ts
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
```

```js
// main.ts
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

const engine = await CreateWebWorkerMLCEngine(
  new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
  'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  { initProgressCallback: (report) => console.log(report.text) },
);
```

---

## 4. Chat Completion (Non-Streaming)

Uses OpenAI-compatible `engine.chat.completions.create()`:

```js
const reply = await engine.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a helpful AI assistant.' },
    { role: 'user', content: 'Summarize this text in one sentence.' },
  ],
  temperature: 0.7,
  max_tokens: 256,
});

console.log(reply.choices[0].message.content);
console.log(reply.usage); // includes prefill_tokens_per_s, decode_tokens_per_s
```

Supported parameters (OpenAI-compatible):
- `temperature`, `top_p`, `max_tokens`, `n`
- `frequency_penalty`, `presence_penalty`
- `stop` (string or string[])
- `logit_bias`, `logprobs`, `top_logprobs`
- `response_format` (`{ type: "json_object" }` for JSON mode)
- `seed` (reproducible output)
- `tools`, `tool_choice` (function calling, requires Hermes models)

The `model` parameter in the request is ignored -- model selection happens via
`CreateMLCEngine(modelId)` or `engine.reload(modelId)`.

---

## 5. Streaming Chat Completion

```js
const chunks = await engine.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a helpful AI assistant.' },
    { role: 'user', content: 'Write a short poem about the ocean.' },
  ],
  stream: true,
  stream_options: { include_usage: true },
});

let reply = '';
for await (const chunk of chunks) {
  reply += chunk.choices[0]?.delta?.content || '';
  // Update UI incrementally
  outputElement.textContent = reply;
}

// Alternative: get the full message after streaming completes
const fullReply = await engine.getMessage();
```

---

## 6. JSON Mode

```js
const reply = await engine.chat.completions.create({
  messages: [
    { role: 'user', content: 'Return a JSON object with name and age for a fictional person.' },
  ],
  response_format: { type: 'json_object' },
});

const parsed = JSON.parse(reply.choices[0].message.content);
```

---

## 7. Function Calling (Hermes Models)

Requires a function-calling-capable model like `Hermes-3-Llama-3.1-8B-q4f32_1-MLC`:

```js
const reply = await engine.chat.completions.create({
  messages: [{ role: 'user', content: 'What is the weather in Seattle?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
        required: ['location'],
      },
    },
  }],
});

// reply.choices[0].message.tool_calls contains the function call
```

---

## 8. Model Selection

Common model IDs (from `prebuiltAppConfig`):

| Model | ID | VRAM |
|-------|-----|------|
| Llama 3.2 1B | `Llama-3.2-1B-Instruct-q4f32_1-MLC` | 1.1 GB |
| Llama 3.2 3B | `Llama-3.2-3B-Instruct-q4f32_1-MLC` | 3.0 GB |
| Llama 3.1 8B | `Llama-3.1-8B-Instruct-q4f32_1-MLC` | 6.1 GB |
| Phi 3.5 Mini | `Phi-3.5-mini-instruct-q4f32_1-MLC` | -- |
| Qwen 2.5 1.5B | `Qwen2.5-1.5B-Instruct-q4f32_1-MLC` | -- |
| Gemma 2 2B | `gemma-2-2b-it-q4f32_1-MLC` | -- |
| SmolLM2 135M | `SmolLM2-135M-Instruct-q0f16-MLC` | 360 MB |
| Hermes 3 8B | `Hermes-3-Llama-3.1-8B-q4f32_1-MLC` | -- |

List all available models programmatically:
```js
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
console.log(prebuiltAppConfig.model_list.map(m => m.model_id));
```

**Guidance:** For broad device compatibility, prefer `q4f32_1` quantization
(does not need `shader-f16`). For lower memory, use `q4f16_1` (needs
`shader-f16`). For minimal footprint, use SmolLM2 or Llama 3.2 1B.

---

## 9. Model Loading Progress

```js
const engine = await CreateMLCEngine('Llama-3.2-1B-Instruct-q4f32_1-MLC', {
  initProgressCallback: (report) => {
    // report.progress: 0 to 1
    // report.timeElapsed: seconds
    // report.text: human-readable status
    document.getElementById('status').textContent =
      `${report.text} -- ${(report.progress * 100).toFixed(1)}%`;
  },
});
```

---

## 10. Cleanup and Cache Management

```js
// Unload model and release WebGPU resources
await engine.unload();

// Reset chat session (clears KV cache and conversation history)
await engine.resetChat();

// Interrupt in-progress generation
engine.interruptGenerate();

// Switch to a different model
await engine.reload('Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
```

Cache management for downloaded model files:
```js
import { hasModelInCache, deleteModelAllInfoInCache } from '@mlc-ai/web-llm';

const isCached = await hasModelInCache('Llama-3.2-1B-Instruct-q4f32_1-MLC');
await deleteModelAllInfoInCache('Llama-3.2-1B-Instruct-q4f32_1-MLC');
```

---

## 11. Graceful Degradation Pattern

```js
import { CreateMLCEngine } from '@mlc-ai/web-llm';

async function createWebLLMEngine(modelId, onProgress) {
  // Check WebGPU support
  if (!navigator.gpu) {
    return null; // WebLLM requires WebGPU
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return null;
  }

  try {
    return await CreateMLCEngine(modelId, {
      initProgressCallback: onProgress || (() => {}),
    });
  } catch (err) {
    console.error('Failed to create WebLLM engine:', err);
    return null;
  }
}

// Usage: AI features enhance the app but are not required
const engine = await createWebLLMEngine(
  'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  (report) => console.log(report.text),
);

if (engine) {
  // Enable AI-powered features
} else {
  // Hide or disable AI features gracefully
}
```

---

## 12. Best Practices

- Always detect WebGPU before creating an engine
- Show model download progress to the user (models are large)
- Prefer `q4f32_1` quantization for broad device compatibility
- Use Web Worker engines to avoid blocking the main thread
- Call `engine.unload()` when the AI feature is no longer needed
- Expose UI to clear cached models (`deleteModelAllInfoInCache`)
- Handle `engine.interruptGenerate()` for cancel buttons
- Use `response_format: { type: "json_object" }` for structured output
