# Writer and Rewriter API Reference

Spec: https://github.com/webmachinelearning/writing-assistance-apis (W3C)
Docs: https://developer.chrome.com/docs/ai/writer-api
Docs: https://developer.chrome.com/docs/ai/rewriter-api

Writer generates new text from a prompt. Rewriter transforms existing text
(tone, length, format adjustments). Both share the W3C Writing Assistance
APIs spec and follow the same create/use/destroy lifecycle.

---

## Browser support

| API | Chrome | Edge |
|-----|--------|------|
| Writer | OT 137-148 | Dev preview 138+ |
| Rewriter | OT 137-148 | Dev preview 138+ |

Permissions policy directives: `writer` and `rewriter` (separate directives).

---

## Writer

### Configuration

| Option | Values | Default | Purpose |
|--------|--------|---------|---------|
| `tone` | `formal`, `neutral`, `casual` | `neutral` | Writing tone |
| `format` | `markdown`, `plain-text` | `plain-text` | Output format |
| `length` | `short`, `medium`, `long` | `medium` | Output length |
| `sharedContext` | string | -- | Persistent context across calls |
| `expectedInputLanguages` | array of BCP 47 codes | -- | Input language hints |
| `outputLanguage` | BCP 47 code | -- | Output language |

### Usage

```javascript
const writer = await Writer.create({
  tone: 'formal',
  format: 'markdown',
  length: 'medium',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// Write (single result)
const text = await writer.write('Write a product description for noise-canceling headphones.', {
  context: 'E-commerce product page for audiophiles.',
});

// Write (streaming)
const stream = writer.writeStreaming('Write an introduction to web accessibility.', {
  context: 'Technical documentation for developers.',
});
for await (const chunk of stream) {
  outputElement.textContent += chunk;
}

writer.destroy();
```

---

## Rewriter

### Configuration

| Option | Values | Default | Purpose |
|--------|--------|---------|---------|
| `tone` | `as-is`, `more-formal`, `more-casual` | `as-is` | Tone adjustment |
| `format` | `as-is`, `markdown`, `plain-text` | `as-is` | Format adjustment |
| `length` | `as-is`, `shorter`, `longer` | `as-is` | Length adjustment |
| `sharedContext` | string | -- | Persistent context across calls |
| `expectedInputLanguages` | array of BCP 47 codes | -- | Input language hints |
| `outputLanguage` | BCP 47 code | -- | Output language |

The Rewriter uses `as-is` defaults, preserving the original characteristic
unless explicitly changed. This is the key difference from Writer, which
uses `neutral` / `plain-text` / `medium` defaults.

### Usage

```javascript
const rewriter = await Rewriter.create({
  tone: 'more-formal',
  length: 'shorter',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// Rewrite (single result)
const revised = await rewriter.rewrite(
  'Hey! So basically the app is super cool and does a bunch of stuff.',
  { context: 'Professional product landing page.' }
);

// Rewrite (streaming)
const stream = rewriter.rewriteStreaming(existingText, {
  context: 'Rewriting for a formal annual report.',
});
for await (const chunk of stream) {
  outputElement.textContent += chunk;
}

rewriter.destroy();
```

---

## Shared context

Both Writer and Rewriter support `sharedContext` at creation time plus
per-call `context`. Use `sharedContext` for context that applies to every
call (e.g., "Marketing copy for a fintech startup"). Use per-call `context`
for call-specific guidance.

```javascript
const writer = await Writer.create({
  tone: 'casual',
  sharedContext: 'Blog posts for a travel website aimed at young adults.',
});

const post1 = await writer.write('Write about backpacking in Portugal.');
const post2 = await writer.write('Write about street food in Bangkok.');
```

---

## When to use Writer vs Rewriter

| Scenario | API | Why |
|----------|-----|-----|
| Generate from a prompt | Writer | Creating new content from instructions |
| Adjust tone of existing text | Rewriter | Preserves content, changes style |
| Shorten / lengthen existing text | Rewriter | `length: 'shorter'` or `'longer'` |
| Convert format (markdown to plain) | Rewriter | `format: 'plain-text'` |
| Compose email from bullet points | Writer | Generating new prose from notes |
| Make informal draft professional | Rewriter | `tone: 'more-formal'` |

---

## Gotchas

- Writer and Rewriter are separate globals with separate `create()` calls.
  Do not try to rewrite with a Writer instance or vice versa.
- The `context` parameter describes the writing context, not additional content
  to include. Keep it short and descriptive.
- Rewriter's `as-is` defaults mean creating a Rewriter with no options and
  calling `rewrite()` may return text very similar to the input.
- Both APIs are origin trial in Chrome (137-148). Register for the OT at
  https://developer.chrome.com/origintrials/ to use on production domains.
- Streaming chunks are incremental text fragments, not cumulative.
