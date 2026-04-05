# AI Feature Inspiration

Use this reference when designing the AI Integration section and AI-related user
stories for a product spec. It teaches you how to think about ambitious AI
features -- not what features to copy.

**Escape hatch:** If the user's prompt explicitly excludes AI features (e.g.,
"no AI", "static site only") or describes purely static content with no
interactive element, skip AI integration entirely. Otherwise, every product
gets AI features.

## The Wow Spectrum

AI features exist on a spectrum from Regular (expected, unremarkable) to Wow
(ambitious, demo-worthy, unforgettable). Aim for Wow.

| Regular | Wow |
|---------|-----|
| Chatbot in sidebar calling an LLM API | On-device LLM running via WebGPU with persistent memory and domain knowledge |
| "Generate image" button wrapping DALL-E API | Real-time sketch-to-render pipeline where every brush stroke triggers AI |
| Cloud speech-to-text upload form | Live multilingual transcription chained into translation and action extraction |
| "AI suggestions" dropdown with generic completions | Context-aware intelligence that understands the product domain and adapts over time |
| Sentiment badge from a cloud API | On-device classifier that learns from user corrections via in-browser fine-tuning |

Regular means wrapping a cloud API with a button. Wow means the AI is
inseparable from the product experience.

## Thinking Heuristics

Apply these when brainstorming AI features for any product:

1. **On-device over cloud API.** WebGPU/WASM inference signals ambition and
   makes privacy a differentiator. "All processing happens locally" is itself
   a feature users value.
2. **Multi-modal pipelines.** Chain capabilities: voice -> transcription ->
   intent extraction -> action -> visual feedback. Pipelines create emergent
   value that single-step API calls cannot.
3. **Context-aware intelligence.** The AI should understand the product domain.
   A music app's AI thinks in terms of keys, tempos, and chord progressions --
   not generic text completion.
4. **Real-time over batch.** Live inference during interaction beats
   upload-then-wait. Streams, live previews, and continuous feedback loops
   feel like magic.
5. **Depth over breadth.** One deeply integrated AI feature outshines five
   shallow ones. Go deep on the feature that defines the product.
6. **Emergent behavior.** AI that learns, adapts, or surprises -- remembering
   previous sessions, improving from corrections, developing patterns the
   designer did not explicitly program.
7. **Privacy as a feature.** On-device processing means no data leaves the
   browser. This is a concrete selling point, not just a technical detail.

## AI Capability Menu

One-liner prompts per category to expand your vocabulary. Pick what fits the
product domain; do not include all of these.

**Generative:** text, image, audio, video, 3D models, code, SVG/vector,
sprites/game assets, procedural levels/maps, music/sound effects, color
palettes/themes, layouts/UI, synthetic datasets, narratives/quests, NPC
dialogue, data visualizations, presentations.

**Analytical:** text classification, sentiment analysis, entity recognition,
anomaly detection, forecasting, object detection, face/pose/gesture
recognition, content moderation, plagiarism detection, document classification,
knowledge graph construction.

**Transformation:** OCR, speech-to-text, translation, paraphrasing/rewriting,
grammar/proofreading, image upscaling, background removal, style transfer,
inpainting, colorization, audio enhancement, natural-language-to-query, image
captioning, voice cloning, sketch-to-UI conversion.

**Interactive:** smart autocomplete, recommendations, virtual avatars, game AI
opponents, adaptive tutoring, AI-assisted drawing, semantic search/RAG, smart
form filling, dynamic difficulty adjustment, real-time music composition.

**Accessibility:** auto alt-text, real-time captioning, cognitive
simplification, sign language recognition/generation.

**Agentic:** autonomous multi-step agents, workflow orchestration with
specialized agent roles.

## Browser AI Capabilities

What is actually possible in a browser today -- the Generator handles
implementation details, but knowing the boundaries expands your ambition:

- **WebGPU:** GPU-accelerated model inference at near-native speed
- **Transformers.js:** Thousands of Hugging Face models running in-browser
- **ONNX Runtime Web:** Cross-framework model execution via WebGPU/WASM
- **TensorFlow.js:** Training and inference, including transfer learning
- **MediaPipe:** Real-time vision (face, hand, pose, object detection)
- **Chrome Built-in AI:** Prompt API, Summarizer, Rewriter, Translator (Gemini Nano)
- **Web Audio API:** Real-time audio processing and synthesis
- **WebAssembly:** Near-native compute for heavy algorithms
- **Web Workers:** Parallel processing without blocking the UI
- **IndexedDB:** Local persistence for models, embeddings, and user data

## Anti-Patterns

These produce Regular-tier results. Flag and avoid them:

- **Sidebar chatbot.** Generic LLM chat panel with no domain knowledge -- replaceable by ChatGPT in another tab.
- **API-wrapper labels.** Slapping "AI-powered" on a single API call with no product integration.
- **Generic "ask AI" button.** Text box sending input to an LLM without context of what the user is doing.
- **Same features everywhere.** Every app gets chatbot + image generator + summarizer regardless of domain.
- **AI as an add-on.** AI lives in a separate panel instead of being woven into core workflows.
- **Breadth over depth.** Many shallow AI features instead of a few deeply integrated ones.

## Integration Depth

The best AI features amplify what the product already does -- they are the
product, not a bolt-on:

- A music app's AI understands music theory; a game maker's AI understands game design.
- AI appears where the user is already working: inline in the editor, live in the canvas,
  responsive during the workflow -- not behind a button in a separate panel.
- Chain capabilities into pipelines: voice -> transcription -> structured data -> visual update.
- Ask: what would be IMPOSSIBLE without AI? Those features are the most impressive.
- Ask: what does the user do repeatedly that AI could make instant? Those deliver the most value.
