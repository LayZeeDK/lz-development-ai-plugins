# Translator and LanguageDetector API Reference

Docs: https://developer.chrome.com/docs/ai/translator-api
Docs: https://developer.chrome.com/docs/ai/language-detection
MDN: https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs

Translator translates text between 45+ languages using an expert translation
model (not Gemini Nano). LanguageDetector identifies the language of input
text. These APIs are commonly used together: detect the language, then
translate.

---

## Browser support

| API | Chrome | Edge |
|-----|--------|------|
| Translator | Stable 138+ | Planned (not available) |
| LanguageDetector | Stable 138+ | Planned (not available) |

Permissions policy directives: `translator` and `language-detector`.

Both APIs are Chrome-only for now. Edge has announced plans but neither API
is available yet. Feature-detect before use and degrade gracefully.

---

## Translator

### Configuration

| Option | Values | Purpose |
|--------|--------|---------|
| `sourceLanguage` | BCP 47 code (e.g., `'en'`) | Source language |
| `targetLanguage` | BCP 47 code (e.g., `'fr'`) | Target language |

45+ languages supported. Uses an expert translation model, not the general-
purpose Gemini Nano model. Translation quality is significantly better than
prompting LanguageModel to translate.

### Checking language pair availability

```javascript
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'ja',
});
// "available" | "downloadable" | "downloading" | "unavailable"
```

Not all language pairs are supported. Always check availability before
creating a Translator instance.

### Usage

```javascript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// Translate (single result)
const translated = await translator.translate('Hello, how are you?');

// Translate (streaming)
const stream = translator.translateStreaming(longText);
for await (const chunk of stream) {
  outputElement.textContent += chunk;
}

translator.destroy();
```

---

## LanguageDetector

### Usage

```javascript
const detector = await LanguageDetector.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

const results = await detector.detect('Bonjour, comment allez-vous?');
// Returns: [{ detectedLanguage: 'fr', confidence: 0.95 }, ...]
```

Results are a ranked array of `{ detectedLanguage, confidence }` objects,
sorted by confidence (highest first). The `detectedLanguage` values are
BCP 47 language codes.

### Expected language hints

```javascript
const detector = await LanguageDetector.create({
  expectedInputLanguages: ['en', 'fr', 'de', 'es'],
});
```

Constraining expected languages improves detection accuracy for ambiguous
inputs.

---

## Common pattern: detect then translate

```javascript
async function detectAndTranslate(text, targetLanguage) {
  const detector = await LanguageDetector.create();
  const [top] = await detector.detect(text);
  detector.destroy();

  if (!top || top.detectedLanguage === targetLanguage) {
    return text; // Already in target language or undetectable
  }

  const availability = await Translator.availability({
    sourceLanguage: top.detectedLanguage,
    targetLanguage,
  });

  if (availability === 'unavailable') {
    return null; // Language pair not supported
  }

  const translator = await Translator.create({
    sourceLanguage: top.detectedLanguage,
    targetLanguage,
  });

  const translated = await translator.translate(text);
  translator.destroy();

  return translated;
}
```

---

## Gotchas

- **Short text accuracy:** LanguageDetector is unreliable for single words
  or very short phrases. Require a minimum input length (roughly 20+
  characters) before trusting detection results.
- **Language pair availability:** Not all 45x45 language pairs are supported.
  Always check `Translator.availability()` for the specific pair.
- **Expert translation model:** Translator uses a dedicated translation model,
  not Gemini Nano. Translation quality is much better than prompting
  LanguageModel with "translate this to French."
- **No Edge support yet:** Both APIs are Chrome-only. Edge has announced plans
  but has not shipped either API. Always feature-detect and degrade gracefully.
- **Separate downloads:** Each language pair may require a separate model
  download. Show download progress to the user.
- **Destroy instances:** Both Translator and LanguageDetector instances hold
  resources. Destroy them when done, especially if creating instances for
  different language pairs.
