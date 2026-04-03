# Graceful Degradation Pattern

Use this pattern for AI features that enhance the application but are not
required. When a Built-in AI API is unavailable, hide or disable the feature.
Do NOT fall back to WebLLM -- it has a different API surface and is not a
drop-in replacement.

## Generic helper

Works with any Built-in AI API global (Summarizer, Writer, Rewriter,
Translator, LanguageDetector, LanguageModel). Pass the global object itself
-- `typeof` naturally handles feature detection when the global is undefined.

```javascript
async function tryCreateSession(ApiGlobal, options = {}) {
  if (typeof ApiGlobal === 'undefined') {
    return null;
  }

  const availability = await ApiGlobal.availability(options);

  if (availability === 'unavailable') {
    return null;
  }

  return ApiGlobal.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Download: ${Math.round(e.loaded * 100)}%`);
      });
    },
  });
}
```

## Per-API usage

```javascript
// Summarizer
const summarizer = await tryCreateSession(Summarizer, {
  type: 'key-points',
  format: 'markdown',
  length: 'short',
});
if (summarizer) {
  const summary = await summarizer.summarize(text);
  summarizer.destroy();
} else {
  // Hide summarization UI
}

// Writer
const writer = await tryCreateSession(Writer, { tone: 'formal' });
if (writer) {
  const draft = await writer.write(prompt);
  writer.destroy();
} else {
  // Hide AI writing assistance
}

// Translator
const translator = await tryCreateSession(Translator, {
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
if (translator) {
  const translated = await translator.translate(text);
  translator.destroy();
} else {
  // Hide translation feature
}

// LanguageModel (general-purpose)
const session = await tryCreateSession(LanguageModel, {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});
if (session) {
  const result = await session.prompt('Analyze this text...');
  session.destroy();
} else {
  // Hide AI analysis feature
}
```

## Key behaviors

- Returns `null` on unsupported browsers (global undefined)
- Returns `null` when the model is unavailable on the device
- Triggers model download if availability is `"downloadable"` (requires user activation)
- Shows download progress via the monitor callback
- The returned instance is ready to use with API-specific methods
- Always `destroy()` instances when done to free resources
