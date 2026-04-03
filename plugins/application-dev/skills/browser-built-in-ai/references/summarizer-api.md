# Summarizer API Reference

Docs: https://developer.chrome.com/docs/ai/summarizer-api
MDN: https://developer.mozilla.org/en-US/docs/Web/API/Summarizer_API

Use the Summarizer API for text summarization tasks. It produces summaries in
configurable styles, formats, and lengths. For general-purpose prompting or
tasks beyond summarization, use LanguageModel (Prompt API) instead.

---

## Browser support

| Browser | Status |
|---------|--------|
| Chrome | Stable 138+ |
| Edge | Dev preview 138+ |

Permissions policy directive: `summarizer`.

---

## Configuration options

| Option | Values | Default | Purpose |
|--------|--------|---------|---------|
| `type` | `key-points`, `tl;dr`, `teaser`, `headline` | `key-points` | Summary style |
| `format` | `markdown`, `plain-text` | `markdown` | Output format |
| `length` | `short`, `medium`, `long` | `medium` | Output length |
| `sharedContext` | string | -- | Persistent context across multiple calls |
| `expectedInputLanguages` | array of BCP 47 codes | -- | Input language hints |
| `outputLanguage` | BCP 47 code | -- | Output language |

---

## Usage pattern

```javascript
// Create
const summarizer = await Summarizer.create({
  type: 'key-points',
  format: 'markdown',
  length: 'short',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// Summarize (single result)
const summary = await summarizer.summarize(longText, {
  context: 'This is a technical blog post about web performance.',
});

// Summarize (streaming)
const stream = summarizer.summarizeStreaming(longText, {
  context: 'Technical blog post.',
});
for await (const chunk of stream) {
  outputElement.textContent += chunk;
}

// Clean up
summarizer.destroy();
```

---

## Shared context

Use `sharedContext` at creation time for context that applies to every
`summarize()` call. Use per-call `context` for call-specific context.

```javascript
const summarizer = await Summarizer.create({
  type: 'tl;dr',
  sharedContext: 'These are customer support tickets for a SaaS product.',
});

// Each call inherits the shared context
const summary1 = await summarizer.summarize(ticket1);
const summary2 = await summarizer.summarize(ticket2);
```

---

## Summary types

- **`key-points`** -- Bullet-point list of main ideas. Best for articles, docs.
- **`tl;dr`** -- One-paragraph summary. Best for quick overview.
- **`teaser`** -- Enticing preview. Best for content previews, cards.
- **`headline`** -- Single-sentence headline. Best for notifications, lists.

---

## Gotchas

- Pass the same options to `availability()` and `create()` -- availability
  may differ based on language configuration.
- The `context` parameter on `summarize()` is optional metadata about the
  input, not additional text to summarize.
- `sharedContext` is set at creation; per-call `context` supplements it.
- Streaming chunks are incremental text fragments, not cumulative.
- Very short inputs may produce summaries longer than the input -- check
  input length and skip summarization for already-brief text.
