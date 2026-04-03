# LanguageModel (Prompt API) Reference

Spec: https://github.com/webmachinelearning/prompt-api (W3C WebML CG)
Docs: https://developer.chrome.com/docs/ai/prompt-api

Use LanguageModel for general-purpose prompting, agentic workflows, tool
calling, structured output, and multimodal input. For task-specific needs
(summarize, write, translate), prefer the dedicated APIs instead.

---

## Browser support

| Context | Chrome | Edge |
|---------|--------|------|
| Extensions | Stable 138+ | -- |
| Web pages | OT 139-144 | Dev preview 138+ |
| Backing model | Gemini Nano | Phi-4-mini (3.8B params) |

Language support (Chrome 140+): English (`en`), Spanish (`es`), Japanese (`ja`).
Permissions policy directive: `language-model`.

### Hardware requirements

- Storage: ~22 GB free (Chrome) / ~20 GB free (Edge)
- GPU: >4 GB VRAM, OR CPU: >=16 GB RAM and >=4 cores (Chrome); 5.5 GB VRAM (Edge)
- Network: unmetered connection for initial model download; fully offline after

### Development setup (Chrome)

Enable both flags in `chrome://flags`, then restart:
1. `chrome://flags/#optimization-guide-on-device-model` -- Enabled
2. `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` -- Enabled

Verify: `await LanguageModel.availability()` in DevTools Console.

---

## Session creation

```javascript
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
    });
  },
});
```

**`initialPrompts` rules:**
- `system` role must be at index 0 (or omitted); elsewhere throws `TypeError`
- Subsequent entries must alternate `user`/`assistant` roles
- Combined prompts exceeding context window rejects with `QuotaExceededError`
- System prompt is never evicted on context overflow

**Deprecated:** `topK` and `temperature` are silently ignored in web page
contexts. Only honored in Chrome Extension contexts.

---

## Prompting

```javascript
// Single response
const result = await session.prompt('Write me a poem!');

// Streaming
const stream = session.promptStreaming('Write me a long poem!');
for await (const chunk of stream) {
  outputElement.textContent += chunk;
}

// Multi-turn conversation
const result = await session.prompt([
  { role: 'user', content: 'I need help with my presentation.' },
  { role: 'assistant', content: 'Happy to help!' },
  { role: 'user', content: 'How should I structure the intro?' },
]);

// Prefix mode (force output format)
const result = await session.prompt([
  { role: 'user', content: 'Create a TOML character sheet for a gnome barbarian' },
  { role: 'assistant', content: '```toml\n', prefix: true },
]);

// Append context without prompting
await session.append([{
  role: 'user',
  content: 'Background context to remember.',
}]);
```

---

## Structured output

Pass `responseConstraint` per-prompt (not per-session):

```javascript
// JSON Schema
const result = await session.prompt('Rate this review 0-5: "Amazing product!"', {
  responseConstraint: {
    type: 'object',
    required: ['rating'],
    additionalProperties: false,
    properties: { rating: { type: 'number', minimum: 0, maximum: 5 } },
  },
});
const parsed = JSON.parse(result); // { rating: 5 }

// Boolean
const result = await session.prompt('Is this about pottery?\n\n' + text, {
  responseConstraint: { type: 'boolean' },
});

// RegExp
const email = await session.prompt('Create a fictional email for Bob.', {
  responseConstraint: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
});
```

Set `omitResponseConstraintInput: true` to avoid sending the schema into the
model's context (saves tokens but you must describe the format in the prompt).

Errors: `NotSupportedError` (unsupported schema), `SyntaxError` (constraint
unsatisfiable), `TypeError` (invalid type).

---

## Tool calling

The browser auto-executes tool callbacks -- no manual tool-call loop needed.
Include `'tool-response'` in `expectedInputs` and `'tool-call'` in
`expectedOutputs`.

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

// The browser calls execute() automatically when the model requests a tool
const result = await session.prompt('What is the weather in Seattle?');
```

---

## Multimodal input (Chrome 140+)

```javascript
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

Not documented for Edge yet.

---

## Context management

```javascript
console.log(`${session.contextUsage} / ${session.contextWindow}`);

// Measure token cost without executing
const usage = await session.measureContextUsage('Some prompt text');

// Context overflow listener (oldest non-system messages get evicted)
session.addEventListener('contextoverflow', () => {
  console.log('Context overflowed; oldest non-system messages dropped.');
});
```

---

## Session lifecycle

```javascript
// Clone (preserves context + initial prompts)
const clone = await session.clone();

// Destroy (frees memory, rejects pending prompts)
session.destroy();
```

---

## Best practices

**Prompting:** Set a clear system prompt. Keep prompts concise. Use N-shot
examples for classification/extraction. Prefer `responseConstraint` for
structured tasks.

**Reliability:** Handle `NotSupportedError`, `SyntaxError`, `TypeError`,
`AbortError`. Wire a cancel button to an `AbortController`. Surface download
status when availability is `"downloadable"`.

**Resources:** Limit concurrent sessions. Destroy idle sessions in `finally`.
Monitor `contextUsage` / `contextWindow` to avoid silent eviction.

**User consent:** Disclose model download size (~22 GB). Provide opt-out.
Avoid logging sensitive prompt content.
