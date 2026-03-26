# Prompt API (LanguageModel)

In-browser AI via Chrome/Edge's built-in language model. Use this as the default implementation for AI features in generated applications.

Spec: https://github.com/webmachinelearning/prompt-api (W3C WebML CG)
Docs: https://developer.chrome.com/docs/ai/prompt-api
Types: `npm install --save-dev @types/dom-chromium-ai`

## API Entry Point

The API is accessed via the global `LanguageModel` object -- no `window.ai` namespace.

```js
LanguageModel.availability(options)
LanguageModel.create(options)
```

Works in `window` and same-origin iframes. Cross-origin iframes require `allow="language-model"`. Not available in Web Workers.

## Feature Detection and Availability

```js
if (typeof LanguageModel === 'undefined') {
  // API not supported -- fall back to server-side AI or disable AI features
}

const availability = await LanguageModel.availability({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});
// Returns: "unavailable" | "downloadable" | "downloading" | "available"
```

Always pass the same options to `availability()` that you will pass to `create()`.

If availability is `"downloadable"`, `create()` requires user activation (click, keypress).

## Creating a Session

```js
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a helpful assistant.' },
    // Optional n-shot examples:
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

Rules for `initialPrompts`:
- `system` role must be at index 0 (or omitted entirely)
- Subsequent entries must alternate user/assistant roles
- If combined prompts exceed the context window, rejects with `QuotaExceededError`
- The system prompt is never evicted on context overflow

## Prompting

### Single response

```js
const result = await session.prompt('Write me a poem!');

// With abort
const result = await session.prompt('Write me a poem!', {
  signal: controller.signal,
});
```

### Streaming response

```js
const stream = session.promptStreaming('Write me a long poem!');
for await (const chunk of stream) {
  // Each chunk is a string
  outputElement.textContent += chunk;
}
```

### Multi-turn conversation

```js
const result = await session.prompt([
  { role: 'user', content: 'I need help with my presentation.' },
  { role: 'assistant', content: 'Happy to help!' },
  { role: 'user', content: 'How should I structure the intro?' },
]);
```

### Structured output (JSON Schema)

```js
const result = await session.prompt('Rate this review 0-5: "Amazing product!"', {
  responseConstraint: {
    type: 'object',
    required: ['rating'],
    additionalProperties: false,
    properties: { rating: { type: 'number', minimum: 0, maximum: 5 } },
  },
});
const parsed = JSON.parse(result);
```

Also supports `RegExp` values and `{ type: 'boolean' }`.

### Tool use

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
// Browser calls execute() automatically
```

## Context Management

```js
console.log(`${session.contextUsage} / ${session.contextWindow}`);

const usage = await session.measureContextUsage('Some prompt text');

session.addEventListener('contextoverflow', () => {
  console.log('Context overflowed; oldest non-system messages dropped.');
});
```

## Session Lifecycle

```js
const clone = await session.clone();   // Preserves context + initial prompts
session.destroy();                      // Frees memory, rejects pending prompts
```

## Multimodal Input (Chrome 140+)

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
    { type: 'image', value: imageBlob },
  ],
}]);
```

## Browser Support

| Context | Status | Version |
|---------|--------|---------|
| Chrome Extensions | Stable | Chrome 138+ |
| Web pages | Origin trial | Chrome 138+ |
| Edge | Not yet documented | -- |

## Hardware Requirements

- Storage: 22 GB free on Chrome profile volume
- GPU: >4 GB VRAM, OR CPU: >=16 GB RAM and >=4 cores
- Network: unmetered connection for initial model download only; fully offline after that

## Graceful Degradation Pattern

```js
async function createAISession(systemPrompt) {
  if (typeof LanguageModel === 'undefined') {
    return null; // AI features unavailable
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
