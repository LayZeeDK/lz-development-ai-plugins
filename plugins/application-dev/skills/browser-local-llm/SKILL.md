---
name: browser-local-llm
description: >
  Unified skill for using the browser’s LanguageModel Prompt API (Chrome/Edge)
  for on-device LLM prompting, streaming, structured output, and session
  management, aligned with the Prompt API draft spec.
---

# Browser Local LLM Skill

This skill defines a consistent, spec-aligned workflow for using the browser’s
**LanguageModel Prompt API**:

- **Chrome** (Gemini Nano, built-in AI)
- **Microsoft Edge** (Phi‑4‑mini, built-in AI)

It abstracts availability, session lifecycle, prompting, streaming, structured
outputs, and fallbacks into a stable procedure that agents can call.

---

## 1. Purpose

Use this skill when an agent needs to:

- Run summarization, rewriting, extraction, classification, or Q&A **locally**
- Produce **structured outputs** (JSON Schema or RegExp) via `responseConstraint`
- Use **N‑shot prompting** with `initialPrompts`
- Stream tokens for incremental UI
- Maintain or reset conversational context via `append` and `clone`
- Respect privacy by keeping data on-device when the browser does so

The design follows the Prompt API explainer and draft spec.

---

## 2. Capabilities (spec-aligned)

### 2.1 Core operations

- `LanguageModel.availability(options)` to check model availability
- `LanguageModel.create(options)` to create a session
- `session.prompt(input, options)` for single responses
- `session.promptStreaming(input, options)` for streaming responses
- `session.append(input, options)` to add context without a response
- `session.measureContextUsage(input, options)` for context usage
- `session.clone(options)` to fork a configured session
- `session.destroy()` to free resources

### 2.2 Structured output

Structured output is provided via **`responseConstraint`**:

- **JSON Schema object** → response is a JSON string that must parse and validate
- **RegExp** → response is a string that must match the regex

Errors:

- Unsupported schema features → `NotSupportedError`
- Unable to satisfy constraint → `SyntaxError`
- Invalid `responseConstraint` type → `TypeError`

You can optionally set `omitResponseConstraintInput: true` to avoid sending the
schema/regex into the model’s context (but then you must guide the format in
the prompt text).

### 2.3 Sampling parameters (extensions only)

Per the explainer and spec:

- `topK` and `temperature` on `LanguageModel.create()` are **deprecated** and
  **only honored in extension contexts**
- `LanguageModel.params()` and `languageModel.topK/temperature` are also
  **extension-only** and deprecated

In **web page contexts**, agents must assume these are ignored.

---

## 3. Environment & prerequisites

### 3.1 Browser & feature

- Prompt API proposal: `LanguageModel` exposed on `Window`
- Gated by permissions policy feature `"language-model"` (default allowlist `'self'`)

### 3.2 Hardware & storage (practical guidance)

Typical requirements for on-device models:

- ~**22 GB free disk** for model download
- Recommended:
  - GPU with **≥4 GB VRAM**, or
  - CPU with **≥16 GB RAM and 4 cores**

### 3.3 User consent & UX

Host apps using this skill should:

- Disclose local model download, storage location, and approximate disk usage
- Provide opt-out and a way to delete downloaded model files
- Allow pausing downloads and canceling inferences
- Avoid logging sensitive prompt content

---

## 4. Required workflow

### 4.1 Availability

Always check availability before creating a session:

```js
const availability = await LanguageModel.availability({
  expectedInputs:  [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
  tools: [] // if tools are used, include them here
});

// Typical values include "readily", "after-download", "downloading", "unavailable"
if (availability.status !== "readily") {
  // Decide: show download UI, wait, or present an explicit unsupported-model state
}
```

If the model is not readily available, the skill should return a structured
error and let the agent choose another in-browser strategy, such as waiting for
the browser model, guiding the user through model download, or evaluating
WebLLM/WebNN.

### 4.2 Session creation

Use `LanguageModel.create()` with:

- `initialPrompts`:
  - First message may be `role: "system"` (system prompt)
  - Additional `user`/`assistant` messages for N‑shot examples
- `expectedInputs` / `expectedOutputs`:
  - Declare modalities (e.g. text, image, audio) and languages
- `tools`:
  - Tool definitions with `inputSchema` and async `execute`
- `monitor`:
  - For download progress and readiness events
- `signal`:
  - For cancellation

Example:

```js
const session = await LanguageModel.create({
  initialPrompts: [
    { role: "system", content: "You are a concise assistant." },
    { role: "user", content: "Example input" },
    { role: "assistant", content: "Example output" }
  ],
  expectedInputs:  [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
  tools,   // optional
  monitor: (event) => {
    // handle downloadprogress, ready, error
  }
});
```

### 4.3 Prompting

**Single-shot:**

```js
const result = await session.prompt("Summarize this text:", {
  responseConstraint,          // JSON schema object or RegExp
  omitResponseConstraintInput: false,
  signal                       // optional AbortSignal
});
// result is a string (possibly JSON if schema used)
```

**Streaming:**

```js
const controller = new AbortController();
const stream = session.promptStreaming("Explain how to reset a password", {
  responseConstraint,          // optional
  signal: controller.signal
});

for await (const chunk of stream) {
  // chunk is a string (text fragment)
  renderChunk(chunk);
}
// controller.abort() to cancel
```

### 4.4 Context management

- `session.append(messages)`:
  - Append messages without requesting a response (e.g. preloading context)
- `session.clone({ signal })`:
  - Create a new session with the same configuration and context
- `session.measureContextUsage(prompt, options)`:
  - Estimate context usage (including `responseConstraint` if provided)

### 4.5 Cleanup

- Call `session.destroy()` when done
- Or use an `AbortSignal` passed to `create()` to abort creation and destroy

Destroying a session:

- Rejects ongoing `prompt()` calls with `AbortError`
- Errors `promptStreaming()` streams
- Allows the user agent to unload the model from memory

---

## 5. Skill procedure: `local_llm_prompt`

### 5.1 Input schema (for the agent)

```json
{
  "type": "object",
  "properties": {
    "task": { "type": "string" },
    "input": {
      "oneOf": [
        { "type": "string" },
        {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "role": { "type": "string", "enum": ["user", "assistant", "system"] },
              "content": { "type": "string" }
            },
            "required": ["role", "content"]
          }
        }
      ]
    },
    "system": { "type": "string" },
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "user": { "type": "string" },
          "assistant": { "type": "string" }
        },
        "required": ["user", "assistant"]
      }
    },
    "responseConstraint": {},   // JSON Schema object or RegExp description
    "omitResponseConstraintInput": { "type": "boolean" },
    "stream": { "type": "boolean" }
  },
  "required": ["input"]
}
```

### 5.2 Algorithm

1. **Availability**
   - Call `LanguageModel.availability()` with appropriate `expectedInputs`,
     `expectedOutputs`, and `tools` (if any).
   - If status is not `"readily"`, return:
     ```json
     { "success": false, "error": "local_model_unavailable" }
     ```

2. **Build `initialPrompts`**
   - If `system` is provided, add `{ role: "system", content: system }` as the
     first message.
   - For each example `{ user, assistant }`, add:
     - `{ role: "user", content: user }`
     - `{ role: "assistant", content: assistant }`

3. **Create session**
   - Call `LanguageModel.create()` with:
     - `initialPrompts`
     - `expectedInputs` / `expectedOutputs` (text-only unless multimodal needed)
     - `tools` if required
     - `monitor` and `signal` as needed

4. **Prepare prompt**
   - If `input` is a string, pass it directly to `prompt`/`promptStreaming`.
   - If `input` is an array of `{ role, content }`, convert to
     `LanguageModelMessage[]` and pass as `LanguageModelPrompt`.

5. **Call model**
   - If `stream = true`:
     - Use `promptStreaming(input, { responseConstraint, omitResponseConstraintInput, signal })`
     - Collect chunks into `tokens[]` and final `text`
   - Else:
     - Use `prompt(input, { responseConstraint, omitResponseConstraintInput, signal })`
     - Result is a string `text`

6. **Parse structured output**
   - If `responseConstraint` is a JSON Schema:
      - `JSON.parse(text)` and validate against the schema
      - On failure, treat as error or an alternate in-browser path
   - If `responseConstraint` is a RegExp:
     - Ensure `text` matches; otherwise treat as error

7. **Destroy session**
   - Call `session.destroy()` in a `finally` block.

### 5.3 Output format

On success:

```json
{
  "success": true,
  "text": "...",          // final text output
  "json": { },            // parsed JSON if JSON Schema was used
  "tokens": ["..."],      // if streaming was used
  "meta": {
    "model": "browser-local",
    "structured": true
  }
}
```

On failure:

```json
{
  "success": false,
  "error": "string"       // e.g. "local_model_unavailable", "constraint_error"
}
```

---

## 6. Best practices

### 6.1 Prompting

- Always set a clear system prompt for role and style
- Keep prompts concise to reduce latency and context usage
- Use N‑shot examples for classification/extraction
- For structured tasks:
  - Prefer JSON Schema via `responseConstraint`
  - Use `omitResponseConstraintInput: true` only if you also describe the
    format in the prompt text

### 6.2 Reliability & safety

- Handle `NotSupportedError`, `SyntaxError`, `TypeError`, and `AbortError`
- Retry with adjusted prompts for transient failures
- Provide a cancel button wired to an `AbortController`
- Avoid logging raw prompts or responses containing sensitive data

### 6.3 Resource management

- Limit concurrent sessions
- Destroy idle sessions
- Expose UI to clear downloaded model artifacts if the browser supports it

---

## 7. Extensions & tools

- In extension contexts:
  - `topK`, `temperature`, and `LanguageModel.params()` are available but
    deprecated; use sparingly and expect removal.
- Tools:
  - Define tools via `tools: LanguageModelTool[]` with `inputSchema` and
    async `execute`
  - Expect concurrent tool calls; implementations should be re-entrant

---

## 8. Example use cases

- Summarization of page content
- Entity extraction with JSON Schema
- Sentiment or label classification with RegExp constraints
- Page-aware assistants that stay on-device
- Offline-capable AI features in web apps or extensions
