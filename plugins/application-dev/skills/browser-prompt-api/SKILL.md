---
name: browser-prompt-api
description: >
  Skill for using the browser's LanguageModel Prompt API (Chrome/Edge) for
  on-device LLM prompting, streaming, structured output, tool use, and session
  management. Aligned with the W3C WebML Prompt API spec.
---

# Browser Prompt API Skill

Spec: https://github.com/webmachinelearning/prompt-api (W3C WebML CG)
Docs: https://developer.chrome.com/docs/ai/prompt-api
Types: `npm install --save-dev @types/dom-chromium-ai`

This skill defines a spec-aligned workflow for using the browser's
**LanguageModel Prompt API** for on-device inference:

- **Chrome 138+** (Gemini Nano) -- stable in extensions, origin trial for web pages
- **Microsoft Edge** (Phi-4-mini) -- not yet documented officially

The API is accessed via the global `LanguageModel` object. There is no
`window.ai` namespace -- all static methods hang directly off `LanguageModel`.
Works in `window` and same-origin iframes. Cross-origin iframes require
`allow="language-model"`. Not available in Web Workers.

---

## 1. Purpose

Use this skill when a generated application needs to:

- Run summarization, rewriting, extraction, classification, or Q&A **locally**
- Produce **structured outputs** (JSON Schema or RegExp) via `responseConstraint`
- Use **N-shot prompting** with `initialPrompts`
- Stream tokens for incremental UI
- Use **tool calling** with automatic browser-side execution
- Maintain conversational context via `append` and `clone`
- Respect privacy by keeping all data on-device

---

## 2. Browser support

| Context | Status | Version |
|---------|--------|---------|
| Chrome Extensions | Stable | Chrome 138+ |
| Web pages | Origin trial | Chrome 138+ |
| Edge | Phi-4-mini built-in | Not yet documented |

Language support (Chrome 140+): English (`en`), Spanish (`es`), Japanese (`ja`).

### Development setup (Chrome)

Enable both flags in `chrome://flags`, then restart:
1. `chrome://flags/#optimization-guide-on-device-model` -- set to **Enabled**
2. `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` -- set to **Enabled**

Verify: `await LanguageModel.availability()` in DevTools Console.

### Hardware requirements

- Storage: ~22 GB free on Chrome profile volume
- GPU: >4 GB VRAM, **OR** CPU: >=16 GB RAM and >=4 cores
- Network: unmetered connection for initial model download only; fully offline after

---

## 3. Feature detection and availability

### 3.1 Feature detection

```js
if (typeof LanguageModel === 'undefined') {
  // Prompt API not supported in this browser
  // Disable AI features or fall back to another in-browser approach
}
```

### 3.2 Availability check

```js
const availability = await LanguageModel.availability({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

// Returns a string: "available" | "downloadable" | "downloading" | "unavailable"
```

**Always pass the same options to `availability()` that you will pass to
`create()`.** Some models may not support certain modalities or languages.

### 3.3 User activation

If availability is `"downloadable"`, `create()` requires user activation
(click, keypress, etc.):

```js
button.onclick = async () => {
  const session = await LanguageModel.create({ /* ... */ });
};
```

---

## 4. Session creation

```js
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a helpful assistant.' },
    // Optional N-shot examples (must alternate user/assistant):
    { role: 'user', content: 'Example input' },
    { role: 'assistant', content: 'Example output' },
  ],
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
  signal: controller.signal,
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${Math.round(e.loaded * 100)}%`);
      // e.loaded is 0..1, e.total is always 1
    });
  },
});
```

**`initialPrompts` rules:**
- `system` role must be at index 0 (or omitted entirely); elsewhere throws `TypeError`
- Subsequent entries must alternate `user`/`assistant` roles
- If combined prompts exceed the context window, rejects with `QuotaExceededError`
- The system prompt is never evicted on context overflow

---

## 5. Prompting

### 5.1 Single response

```js
const result = await session.prompt('Write me a poem!');

// With abort support
const controller = new AbortController();
const result = await session.prompt('Write me a poem!', {
  signal: controller.signal,
});
```

### 5.2 Streaming response

```js
const stream = session.promptStreaming('Write me a long poem!');
for await (const chunk of stream) {
  outputElement.textContent += chunk; // Each chunk is a string
}
```

### 5.3 Multi-turn conversation

```js
const result = await session.prompt([
  { role: 'user', content: 'I need help with my presentation.' },
  { role: 'assistant', content: 'Happy to help!' },
  { role: 'user', content: 'How should I structure the intro?' },
]);
```

### 5.4 Prefix mode

```js
const result = await session.prompt([
  { role: 'user', content: 'Create a TOML character sheet for a gnome barbarian' },
  { role: 'assistant', content: '```toml\n', prefix: true },
]);
```

### 5.5 Appending context without prompting

```js
await session.append([{
  role: 'user',
  content: 'Here is some background context to remember.',
}]);
// Later:
const analysis = await session.prompt('Summarize the context I gave you.');
```

---

## 6. Structured output

Pass `responseConstraint` per-prompt (not per-session):

### JSON Schema

```js
const result = await session.prompt('Rate this review 0-5: "Amazing product!"', {
  responseConstraint: {
    type: 'object',
    required: ['rating'],
    additionalProperties: false,
    properties: { rating: { type: 'number', minimum: 0, maximum: 5 } },
  },
});
const parsed = JSON.parse(result); // { rating: 5 }
```

### Boolean

```js
const result = await session.prompt('Is this about pottery?\n\n' + text, {
  responseConstraint: { type: 'boolean' },
});
JSON.parse(result); // true or false
```

### RegExp

```js
const email = await session.prompt('Create a fictional email for Bob.', {
  responseConstraint: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
});
```

Set `omitResponseConstraintInput: true` to avoid sending the schema into the
model's context (saves tokens, but you must describe the format in the prompt).

Errors:
- Unsupported schema features: `NotSupportedError`
- Unable to satisfy constraint: `SyntaxError`
- Invalid `responseConstraint` type: `TypeError`

---

## 7. Tool use

```js
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You are a helpful assistant.' }],
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
    description: 'Get the weather in a location.',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name.' },
      },
      required: ['location'],
    },
    async execute({ location }) {
      const res = await fetch(`https://api.example.com/weather?city=${location}`);
      return JSON.stringify(await res.json());
    },
  }],
});

const result = await session.prompt('What is the weather in Seattle?');
// Browser calls execute() automatically; multiple tools may run concurrently
```

---

## 8. Context management

```js
// Current usage vs. total context window
console.log(`${session.contextUsage} / ${session.contextWindow}`);

// Measure how many tokens a prompt would consume without executing it
const usage = await session.measureContextUsage('Some prompt text');

// Listen for context overflow (oldest non-system messages get evicted)
session.addEventListener('contextoverflow', () => {
  console.log('Context overflowed; oldest non-system messages dropped.');
});
```

---

## 9. Session lifecycle

```js
// Clone a session (preserves context + initial prompts)
const clone = await session.clone();

// Destroy a session (frees memory, rejects pending prompts)
session.destroy();
```

---

## 10. Multimodal input (Chrome 140+)

```js
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

const response = await session.prompt([{
  role: 'user',
  content: [
    { type: 'text', value: 'Describe this image:' },
    { type: 'image', value: imageBlob }, // Blob, HTMLImageElement, HTMLCanvasElement
  ],
}]);
```

---

## 11. Sampling parameters (extensions only)

`topK` and `temperature` on `LanguageModel.create()` are **deprecated** and
**only honored in Chrome Extension contexts**. `LanguageModel.params()` is also
extension-only. In web page contexts, these are silently ignored.

---

## 12. Permissions policy

```html
<!-- Delegate to cross-origin iframe -->
<iframe src="https://example.com/" allow="language-model"></iframe>
```

Default allowlist is `'self'` -- same-origin access works without configuration.

---

## 13. Graceful degradation pattern

Use this pattern for AI features that enhance but are not required:

```js
async function createAISession(systemPrompt) {
  if (typeof LanguageModel === 'undefined') {
    return null;
  }

  const availability = await LanguageModel.availability({
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
  });

  if (availability === 'unavailable') {
    return null;
  }

  return LanguageModel.create({
    initialPrompts: [{ role: 'system', content: systemPrompt }],
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
      });
    },
  });
}

// Usage: AI features enhance the app but are not required
const ai = await createAISession('You are a helpful assistant.');
if (ai) {
  // Enable AI-powered features
} else {
  // Hide or disable AI features gracefully
}
```

---

## 14. Best practices

### Prompting
- Always set a clear system prompt for role and style
- Keep prompts concise to reduce latency and context usage
- Use N-shot examples for classification/extraction
- Prefer JSON Schema via `responseConstraint` for structured tasks

### Reliability
- Handle `NotSupportedError`, `SyntaxError`, `TypeError`, and `AbortError`
- Provide a cancel button wired to an `AbortController`
- Surface download status to the user when availability is `"downloadable"`

### Resource management
- Limit concurrent sessions
- Destroy idle sessions in a `finally` block
- Monitor `contextUsage` / `contextWindow` to avoid silent eviction

### User consent
- Disclose local model download and approximate disk usage (~22 GB)
- Provide opt-out and a way to delete downloaded model files
- Avoid logging sensitive prompt content
