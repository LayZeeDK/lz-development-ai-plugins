# Graceful Degradation Pattern

Use this pattern for AI features that enhance the application but are not
required. Returns a session if the Prompt API is available, or `null` if not.

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
```

## Usage

```js
const ai = await createAISession('You are a helpful assistant.');
if (ai) {
  // Enable AI-powered features
  const result = await ai.prompt('Summarize this text...');
} else {
  // Hide or disable AI features gracefully
}
```

## Key behaviors

- Returns `null` on unsupported browsers (no LanguageModel global)
- Returns `null` when the model is unavailable on the device
- Triggers model download if availability is `"downloadable"` (requires user activation)
- Shows download progress via the monitor callback
- The returned session is ready to use with `prompt()` or `promptStreaming()`
