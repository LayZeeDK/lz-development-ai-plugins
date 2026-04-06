# Quick Task: Add Chrome/Edge Flags for Built-in AI APIs - Research

**Researched:** 2026-04-06
**Domain:** Chromium/Edge feature flags for Browser Built-in AI APIs
**Confidence:** MEDIUM-HIGH

## Summary

The existing SKILL.md section 6 (testing configuration) only documents flags for
the Prompt API (`LanguageModel`). Chrome and Edge each have per-API feature flags
that must be enabled via `--enable-features` for the remaining 6 APIs: Summarizer,
Writer, Rewriter, Translator, LanguageDetector, and Proofreader.

Chrome and Edge use **different flag names** for the same APIs. Chrome's flags
control Gemini Nano; Edge's flags control Phi-4-mini. The `ignoreDefaultArgs`
list is the same for all APIs -- no API-specific additions needed.

**Primary recommendation:** Add a comprehensive flag reference table to SKILL.md
section 6, with separate Chrome and Edge flag sets, and provide ready-to-copy
`launchOptions` configs for both browsers covering all 7 APIs.

## Feature Flags by API

### Chrome (`--enable-features` Finch/base feature names)

Chrome requires two foundational flags for all Gemini Nano-backed APIs, plus
per-API flags for APIs that are in origin trial or not yet shipped by default.

| API | `--enable-features` value | chrome://flags name | Status |
|-----|--------------------------|---------------------|--------|
| (Foundation) | `OptimizationGuideOnDeviceModel` | `#optimization-guide-on-device-model` | Required for all APIs |
| LanguageModel | `PromptAPIForGeminiNano` | `#prompt-api-for-gemini-nano` | OT 139-144 (web) |
| Summarizer | `AISummarizationAPI` | `#summarization-api-for-gemini-nano` | Stable 138+ |
| Writer | `AIWriterAPI` | `#writer-api-for-gemini-nano` | OT 137-148 |
| Rewriter | `AIRewriterAPI` | `#rewriter-api-for-gemini-nano` | OT 137-148 |
| Translator | `TranslationAPI` | `#translation-api` | Stable 138+ |
| LanguageDetector | `LanguageDetectionAPI` | `#language-detection-api` | Stable 138+ |
| Proofreader | `AIProofreadingAPI` | `#proofreader-api-for-gemini-nano` | OT 141-146 |

**Confidence:** HIGH for Summarizer (`AISummarizationAPI`), LanguageDetector
(`LanguageDetectionAPI`), TranslationAPI, and AIProofreadingAPI -- all confirmed
via chromestatus.com entries and the Brave browser issue #49502 which listed all
Chromium built-in AI feature flags. MEDIUM for Writer/Rewriter -- the Blink
runtime feature names are `AIWriterAPI`/`AIRewriterAPI`, but the base::Feature
(Finch) names may be `EnableAIWriterAPI`/`EnableAIRewriterAPI`. Both variants
should be tried; the Blink names are more likely correct for `--enable-features`.

**Note on stable APIs:** Summarizer, Translator, and LanguageDetector are stable
in Chrome 138+ and may not strictly need `--enable-features` flags to work.
However, including them ensures they work on localhost without manual
chrome://flags setup, and is harmless if already enabled.

### Edge (`--enable-features` names)

Edge shares the Chromium codebase but has its own flag descriptions (e.g.,
"Prompt API for Phi mini" instead of "Prompt API for Gemini Nano"). The
`--enable-features` names are the same Chromium feature names since Edge is
Chromium-based.

| API | `--enable-features` value | edge://flags description | Status |
|-----|--------------------------|--------------------------|--------|
| LanguageModel | `AIPromptAPI` | Prompt API for Phi mini | Dev preview 138+ |
| Summarizer | `AISummarizationAPI` | Summarization API for Phi mini | Dev preview 138+ |
| Writer | `AIWriterAPI` | Writer API for Phi mini | Dev preview 138+ |
| Rewriter | `AIRewriterAPI` | Rewriter API for Phi mini | Dev preview 138+ |
| Translator | -- | -- | Planned (not available) |
| LanguageDetector | -- | -- | Planned (not available) |
| Proofreader | -- | -- | Not available |

**Confidence:** HIGH for AIPromptAPI (already working in current SKILL.md).
MEDIUM for AISummarizationAPI, AIWriterAPI, AIRewriterAPI -- confirmed by Brave
issue #49502 listing these as Chromium feature names, and by Microsoft's
edge://flags UI naming convention. Edge may also accept the umbrella
`BuiltInAIAPI` feature, but this is unverified.

**Edge `--disable-features`:** `OnDeviceModelPerformanceParams` remains
required -- it bypasses hardware performance gating that would block the model
in automated testing environments.

### Umbrella flag: `BuiltInAIAPI`

The Brave issue #49502 lists `BuiltInAIAPI` as an "umbrella feature" in
Chromium. This may enable all built-in AI APIs at once. However, this is
LOW confidence -- no official documentation confirms it works as a catch-all
via `--enable-features`, and it may only be a compile-time grouping. Do NOT
rely on it; use per-API flags.

## `ignoreDefaultArgs` (unchanged)

The current `ignoreDefaultArgs` in SKILL.md section 6 are correct for ALL
APIs, not just the Prompt API:

```typescript
ignoreDefaultArgs: [
  '--disable-field-trial-config',    // Enables Finch field trials (required for feature flags)
  '--disable-background-networking', // Allows model download in background
  '--disable-component-update',      // Allows on-device model component updates
],
```

These three args are injected by Playwright's default Chromium launch to create
a clean testing environment, but they prevent the on-device AI model system from
functioning. No additional `ignoreDefaultArgs` are needed for any specific API.

## Recommended Configuration Updates

### Chrome Beta config (new)

```typescript
// Chrome Beta: all 7 APIs
args: [
  '--enable-features=' + [
    'OptimizationGuideOnDeviceModel',
    'PromptAPIForGeminiNano',
    'AISummarizationAPI',
    'AIWriterAPI',
    'AIRewriterAPI',
    'TranslationAPI',
    'LanguageDetectionAPI',
    'AIProofreadingAPI',
  ].join(','),
],
```

### Edge Dev config (updated from current)

```typescript
// Edge Dev: 4 supported APIs (Translator, LanguageDetector, Proofreader not available)
args: [
  '--enable-features=' + [
    'AIPromptAPI',
    'AISummarizationAPI',
    'AIWriterAPI',
    'AIRewriterAPI',
  ].join(','),
  '--disable-features=OnDeviceModelPerformanceParams',
],
```

### What changes from current SKILL.md section 6

Current config only has:
- Edge: `--enable-features=AIPromptAPI`
- Chrome: `--enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano`

New config adds:
- Edge: `AISummarizationAPI,AIWriterAPI,AIRewriterAPI` to the feature list
- Chrome: `AISummarizationAPI,AIWriterAPI,AIRewriterAPI,TranslationAPI,LanguageDetectionAPI,AIProofreadingAPI` to the feature list
- Both: `ignoreDefaultArgs` stays the same
- Both: `headless: false` stays the same

## Browser Availability Matrix (for reference)

This table already exists in SKILL.md section 2. No changes needed there --
the flag table is a new addition to section 6.

| API | Chrome Flag | Edge Flag | Notes |
|-----|-------------|-----------|-------|
| LanguageModel | `PromptAPIForGeminiNano` | `AIPromptAPI` | Different names |
| Summarizer | `AISummarizationAPI` | `AISummarizationAPI` | Same name |
| Writer | `AIWriterAPI` | `AIWriterAPI` | Same name |
| Rewriter | `AIRewriterAPI` | `AIRewriterAPI` | Same name |
| Translator | `TranslationAPI` | -- | Chrome only |
| LanguageDetector | `LanguageDetectionAPI` | -- | Chrome only |
| Proofreader | `AIProofreadingAPI` | -- | Chrome only |

## Common Pitfalls

### Pitfall 1: Using wrong flag variant for Writer/Rewriter
**What goes wrong:** Chromium has both Blink runtime feature names
(`AIWriterAPI`) and base::Feature names (`EnableAIWriterAPI`). Using the wrong
one in `--enable-features` silently does nothing.
**How to avoid:** Use the Blink runtime feature names (`AIWriterAPI`,
`AIRewriterAPI`) -- these are what `--enable-features` maps to internally.
The `Enable`-prefixed variants are base::Feature names used for Finch
server-side configuration.

### Pitfall 2: Assuming stable APIs work without flags in Playwright
**What goes wrong:** Summarizer, Translator, and LanguageDetector are stable
in Chrome 138+, so developers skip their flags. But Playwright's
`--disable-field-trial-config` (stripped by `ignoreDefaultArgs`) interacts
with the Finch system that gates these features.
**How to avoid:** Always include all API flags explicitly, even for stable
APIs. The cost is zero (redundant flags are ignored) and it prevents
intermittent failures.

### Pitfall 3: Enabling Edge flags for unsupported APIs
**What goes wrong:** Adding `TranslationAPI` or `LanguageDetectionAPI` to
Edge's `--enable-features` when those APIs are not available in Edge.
**How to avoid:** The flags are silently ignored for unsupported APIs, so
this is not harmful. But the SKILL.md should document which APIs are
Edge-supported to set correct expectations.

## Files to Modify

| File | Change |
|------|--------|
| `plugins/application-dev/skills/browser-built-in-ai/SKILL.md` | Update section 6 with per-API flag table and expanded `launchOptions` configs |
| `plugins/application-dev/skills/vitest-browser/SKILL.md` | Update section 3 headed mode example to match expanded flags |

## Open Questions

1. **Writer/Rewriter flag ambiguity:** Are the correct `--enable-features`
   names `AIWriterAPI`/`AIRewriterAPI` or `EnableAIWriterAPI`/`EnableAIRewriterAPI`?
   The Brave issue uses the `AI*API` form, which is likely correct since those
   are the Blink runtime feature names. Validation: test with actual browser.
   - Recommendation: Use `AIWriterAPI`/`AIRewriterAPI` (Blink names) -- these
     are what chromestatus lists and what Brave disables.

2. **BuiltInAIAPI umbrella flag:** Does passing `BuiltInAIAPI` in
   `--enable-features` enable all APIs? Unknown -- no official docs confirm this.
   - Recommendation: Do not use; explicit per-API flags are reliable.

## Sources

### Primary (HIGH confidence)
- Brave browser issue #49502 -- complete list of Chromium built-in AI feature
  flags: `BuiltInAIAPI`, `AIPromptAPI`, `AIPromptAPIMultimodalInput`,
  `AIRewriterAPI`, `AISummarizationAPI`, `AIWriterAPI`, `LanguageDetectionAPI`,
  `TranslationAPI`, `AIProofreadingAPI`
  https://github.com/brave/brave-browser/issues/49502
- Microsoft Learn -- Edge Writing Assistance APIs documentation
  https://learn.microsoft.com/en-us/microsoft-edge/web-platform/writing-assistance-apis
- Microsoft Learn -- Edge Prompt API documentation
  https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api
- Microsoft Learn -- BuiltInAIAPIsEnabled policy (lists LanguageModel,
  Summarization, Writer, Rewriter as covered APIs)
  https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/builtinaiapisenabled
- Chrome developer docs -- Get started with built-in AI
  https://developer.chrome.com/docs/ai/get-started

### Secondary (MEDIUM confidence)
- chromestatus.com Summarizer API entry -- confirms `AISummarizationAPI` as
  Finch feature name
  https://chromestatus.com/feature/5193953788559360
- blink-dev mailing list -- confirms `LanguageDetectionAPI` as Finch name
  https://www.mail-archive.com/blink-dev@chromium.org/msg13549.html
- blink-dev mailing list -- confirms `AIProofreadingAPI` as Finch name
  https://www.mail-archive.com/blink-dev@chromium.org/msg14608.html
- Edge DevBlog -- Introducing Prompt and Writing Assistance APIs (May 2025)
  https://blogs.windows.com/msedgedev/2025/05/19/introducing-the-prompt-and-writing-assistance-apis/

### Tertiary (LOW confidence)
- WebSearch claims about `EnableAIWriterAPI`/`EnableAIRewriterAPI` as base
  feature names (not directly verified in source)
