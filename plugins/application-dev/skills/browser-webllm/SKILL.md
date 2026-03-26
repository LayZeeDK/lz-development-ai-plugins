---
name: browser-webllm
description: >
  High‑performance, fully local WebGPU/WASM LLM inference using MLC‑AI WebLLM,
  providing OpenAI‑compatible chat completions, streaming, structured task
  templates, provenance metadata, and safe deterministic generation for
  summarization, extraction, translation, and general LLM tasks.
author: Lars Gyrup Brink Nielsen
version: 0.1.0
license: MIT
tags:
  - llm
  - webgpu
  - local-inference
  - mlc
  - browser
  - streaming
capabilities:
  - chat-completions
  - streaming
  - summarization
  - extraction
  - translation
  - provenance
  - model-selection
requires:
  - webgpu-or-wasm
---

## 1. Purpose  
This skill enables agents to run large language models **directly on the user’s device**, providing:

- **Local, private inference** — no prompts or outputs leave the device  
- **WebGPU‑accelerated performance** with WASM/CPU fallback  
- **OpenAI‑style Chat Completions API**  
- **Structured task templates** for summarization, extraction, translation, and more  
- **Provenance metadata** when grounding on user‑provided URLs  
- **Deterministic, controlled generation** with explicit limits  

Use this skill when agents need **offline**, **privacy‑preserving**, or **cost‑free** inference.

## 2. Capabilities

### Core  
- Load, unload, and reload WebLLM models  
- Execute chat completions (streaming or non‑streaming)  
- Switch models at runtime  
- Inspect GPU adapter capabilities  
- Optional model listing (if host exposes it)

### Generation Features  
- `temperature`, `top_p`, `max_tokens`, `stop`  
- `presence_penalty`, `frequency_penalty`  
- `logit_bias`, `logprobs`, `n`, `seed`  
- JSON mode via `json_mode` or `response_format`  
- Optional thinking/trace metadata  
- Latency breakdown reporting  

### Task‑Level Features (from Skill #3)  
- Prompt templating for summarization, extraction, translation, classification, code generation  
- Provenance metadata when grounding on user‑provided URLs  
- Resource controls: token caps, timeouts, concurrency limits  
- Structured outputs with warnings and metadata  

### Model Support  
Compatible with any MLC‑compiled model, including:  
Llama, Phi, Gemma, Mistral, Qwen, and custom models.

## 3. Intents & Triggers  
The skill supports both **low‑level chat completions** and **high‑level task intents**.

### High‑Level Intents  
| Intent | Description |
|:--|:--|
| **webllm.summarize** | Summarize content; optionally fetch user‑provided URL; attach provenance |
| **webllm.complete** | Direct model completion using a prompt or template |
| **webllm.stream** | Streaming generation for long outputs or code |
| **webllm.extract** | Structured extraction with provenance |
| **webllm.translate_summarize** | Translate then summarize grounded content |

**Behavior:**  
On intent match, the skill validates inputs, selects a model, applies templates, optionally fetches the provided URL, enforces limits, runs inference, and returns structured output.

## 4. Actions (Low‑Level API)

### `webllm.chatCompletion`  
Run a single OpenAI‑style chat completion.

#### Input  
- **`modelId`** *(string, required)*  
- **`messages`** *(array, required)*  
  - `role`: `"system" | "user" | "assistant" | "tool"`  
  - `content`: string  
  - `name`: optional  
- **Generation parameters (optional):**  
  - `temperature`, `top_p`, `max_tokens`, `stop`, `seed`  
  - `presence_penalty`, `frequency_penalty`  
  - `logit_bias`, `logprobs`, `n`  
  - `json_mode` or `response_format`  
- **`engineConfig`** *(optional)*  
  - `appConfig.model_list`  
  - `appConfig.cacheBackend`: `"cache" | "indexeddb" | "cross-origin"`  
  - `initProgressCallback` or `initProgressCallbackEnabled`  
  - `logitProcessorRegistry`  

#### Output  
- `id`, `model`, `created`, `object: "chat.completion"`  
- `choices[]`:  
  - `index`  
  - `message: { role, content }`  
  - `finish_reason`  
- `usage`: optional token counts  

### `webllm.streamChatCompletion`  
Streaming version of `chatCompletion`.

#### Input  
Same as above, plus:

- **`stream: true`**  
- `stream_options.include_usage` *(optional)*  

#### Output (chunked)  
- `object: "chat.completion.chunk"`  
- `choices[].delta` with incremental text  
- Final chunk may include `usage`

### `webllm.listModels` (optional)  
Returns available WebLLM models if the host exposes them.

## 5. High‑Level Task API (Skill #3 Integration)

### Inputs  
| Field | Required | Type | Notes |
|:--|:--|:--|:--|
| **intent** | Yes | enum | Determines operation |
| **prompt_template** | Yes | string | Template name or raw prompt |
| **model** | Yes | string | Validated against available models |
| **url** | No | string | Single user‑provided URL to fetch |
| **max_tokens** | No | integer | Hard cap |
| **temperature** | No | float | Recommended 0.0–1.2 |
| **stream** | No | boolean | Enable streaming |
| **metadata** | No | object | Template parameters |

### Outputs  
| Field | Type | Description |
|:--|:--|:--|
| **text** | string | Final generated text |
| **tokens_used** | integer | Token usage |
| **model** | string | Model used |
| **provenance** | array | `{ url, snippet, offset }` entries |
| **warnings** | array | Safety or quality notes |

**Streaming:** emits `chunk_text` events and a final payload.

## 6. Environment & Runtime  
- Browser environment with WebLLM loaded  
- WebGPU strongly recommended  
- WASM/CPU fallback supported  
- Caching via Cache API, IndexedDB, or cross‑origin cache  
- Hosts may enforce allow‑lists, integrity checks, or progress UI  

## 7. Error Handling  
| Code | Meaning |
|:--|:--|
| **400** | Invalid input or missing fields |
| **404** | Model not found or URL unreachable |
| **429** | Token, timeout, or concurrency limits exceeded |
| **500** | Internal runtime error |

Additional structured errors:  
- Missing WebGPU support  
- Invalid model files  
- Worker initialization failures  
- Out‑of‑memory or GPU device loss  

## 8. Design Principles  
- **Isolation:** each engine instance is sandboxed  
- **Determinism:** explicit parameters, no hidden defaults  
- **Streaming‑first:** responsive generation  
- **Graceful degradation:** fallback to WASM/CPU  
- **Privacy:** all inference is local  
- **Provenance:** minimal, relevant snippets only  

## 9. Usage Examples

### Summarize a web page
```json
{"intent":"summarize","url":"https://example.com/article","model":"Llama-3-8B","max_tokens":300}
```

### Direct completion
```json
{
  "intent":"complete",
  "prompt_template":"Write a professional email: {{context}}",
  "model":"Llama-3-8B",
  "metadata":{"context":"requesting a meeting"}
}
```

### Streaming code generation
```json
{
  "intent":"stream",
  "prompt_template":"Generate Python function for {{task}}",
  "model":"Llama-3-8B",
  "stream":true,
  "metadata":{"task":"CSV to JSON converter"}
}
```

### Low‑level streaming chat
```jsonc
{
  "action": "webllm.streamChatCompletion",
  "input": {
    "modelId": "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Write a haiku about WebGPU." }
    ],
    "stream": true
  }
}
```

## 10. Security, Privacy, and Limits  
- Validate and sanitize URLs, templates, and metadata  
- Enforce token caps, timeouts, and concurrency limits  
- Detect and redact sensitive data when required  
- Do not persist fetched content beyond request lifecycle  
- Provenance includes only minimal necessary snippets  

## 11. Testing & Maintenance  
- Unit tests for intent routing, templates, and errors  
- Integration tests for streaming, timeouts, provenance  
- Quality monitoring for hallucination rates  
- Versioning via `skill_version` with changelog entries  

## 12. Operational Guidance  
Use conservative temperatures and explicit token caps for production tasks.  
Require human review for high-  stakes outputs.
