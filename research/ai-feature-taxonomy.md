# AI Feature Taxonomy for Web Applications

Researched: 2026-03-28
Purpose: Comprehensive list of AI feature categories for Evaluator probe design (Phase 3) and future Planner/Generator references.

## 1. GENERATIVE AI -- Creating new content

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 1.1 | Chatbot / Conversational assistant | Text -> Text | Well-covered by 10-probe battery |
| 1.2 | Text summarization | Text -> Text | Universal signals work |
| 1.3 | Content generation (articles, emails, marketing copy) | Text -> Text | Universal signals work |
| 1.4 | Image generation (text-to-image) | Text -> Image | Vision verification of prompt match |
| 1.5 | Audio generation / Text-to-Speech | Text -> Audio | Deterministic -- variability fails, need duration correlation + unusual input |
| 1.6 | Code generation | Text -> Text | High variability and latency. Universal signals work well. |
| 1.7 | Video generation (text-to-video, image-to-video) | Text -> Video | Very high latency (seconds to minutes). Easy to detect via network. |
| 1.8 | Music / Sound effect generation | Text -> Audio | Similar to audio gen but compositional. |
| 1.9 | 3D model generation (text-to-3D, image-to-3D) | Text/Image -> 3D | Emerging. High latency, specialized formats (glTF, OBJ). |
| 1.10 | Sprite / Game asset generation | Text -> Image | Subset of image gen with constraints (transparency, tile-ability, style consistency). |
| 1.11 | Level / Map / Procedural content generation | Text/Config -> Data | Generates game levels, terrain, dungeons. Output is structured data. |
| 1.12 | SVG / Vector art generation | Text -> SVG | Output is SVG markup. Detectable via variability. |
| 1.13 | Font generation | Text -> Font | Niche. Output is font files or glyph SVGs. |
| 1.14 | Color palette / Theme generation | Text -> Data | Low latency, small payload. May look like randomization. |
| 1.15 | Layout / UI generation | Text -> Structured | AI generates page layouts, wireframes. |
| 1.16 | Synthetic data generation | Config -> Data | Generates realistic fake datasets. |
| 1.17 | Story / Narrative / Quest generation | Text -> Text | Structured branching narratives. High variability. |
| 1.18 | NPC dialogue generation | Text -> Text | Real-time LLM-driven NPC conversations. |
| 1.19 | Data visualization / Chart generation | Text -> Visual | NL-to-SQL pipeline patterns. |
| 1.20 | Slide / Presentation generation | Text -> Structured | High variability, network calls. |

## 2. ANALYTICAL AI -- Analyzing and classifying content

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 2.1 | Text classification / Categorization | Text -> Label | Universal signals work |
| 2.2 | Sentiment analysis | Text -> Score | Low latency, small payload. |
| 2.3 | Named Entity Recognition (NER) | Text -> Structured | Extracts people, places, orgs. |
| 2.4 | Anomaly detection | Data -> Alert | Often server-side. Harder to probe from UI. |
| 2.5 | Predictive analytics / Forecasting | Data -> Predictions | Numeric predictions with confidence. |
| 2.6 | Object detection in images/video | Image -> Structured | Bounding boxes + labels. On-device via TF.js, MediaPipe. |
| 2.7 | Face detection / Recognition | Image -> Structured | Privacy-sensitive. On-device common. |
| 2.8 | Pose estimation (body/hand tracking) | Video -> Structured | Real-time. MediaPipe/TF.js models. |
| 2.9 | Gesture recognition | Video -> Label | Layered on pose estimation. |
| 2.10 | Emotion / Affect detection | Image/Audio/Text -> Label | Infers emotional state. |
| 2.11 | Content moderation / Toxicity detection | Text/Image -> Label | Required for UGC platforms. |
| 2.12 | Plagiarism / Similarity detection | Text -> Score | Compares against corpus. |
| 2.13 | AI-generated content detection | Content -> Score | Meta-category. |
| 2.14 | Document classification / IDP | Document -> Structured | Combines OCR + NLP + classification. |
| 2.15 | Activity / Action recognition | Video -> Label | Classifies human activities. |
| 2.16 | Data mining / Pattern discovery | Data -> Patterns | Clustering, association rules. |
| 2.17 | Knowledge graph construction | Text -> Graph | Entity-relationship extraction. |

## 3. TRANSFORMATION AI -- Converting or enhancing content

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 3.1 | OCR | Image -> Text | Need test images. Canvas API for generation. |
| 3.2 | Speech-to-Text | Audio -> Text | Fake mic input via Chromium flags. |
| 3.3 | Translation | Text -> Text | Chrome built-in Translator API. |
| 3.4 | Paraphrasing / Rewriting / Tone adjustment | Text -> Text | Universal signals work. |
| 3.5 | Grammar / Spelling / Proofreading | Text -> Text | Keystroke-triggered. |
| 3.6 | Image upscaling / Super-resolution | Image -> Image | Input sensitivity. |
| 3.7 | Background removal | Image -> Image | Segmentation model. On-device via TF.js. |
| 3.8 | Style transfer | Image -> Image | Dual-image input pattern. |
| 3.9 | Inpainting / Outpainting | Image+Mask -> Image | Mask + image input. |
| 3.10 | Colorization (B&W to color) | Image -> Image | Model API calls. |
| 3.11 | Audio enhancement / Noise removal | Audio -> Audio | Audio processing patterns. |
| 3.12 | Video transformation | Video -> Video | Frame-by-frame. Very high compute. |
| 3.13 | Text-to-SQL / NL to query | Text -> SQL/Data | LLM + database query. |
| 3.14 | Document summarization / Extraction | Document -> Text | Overlaps with IDP. |
| 3.15 | Image captioning / Alt text generation | Image -> Text | Vision model. |
| 3.16 | Voice cloning / Voice conversion | Audio -> Audio | Dual-input pattern. |
| 3.17 | Face swap / Deepfake | Image+Image -> Image | Privacy-sensitive. |
| 3.18 | Format conversion (image-to-code, sketch-to-UI) | Image -> Code | Vision + code gen pipeline. |

## 4. INTERACTIVE / REAL-TIME AI

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 4.1 | Smart autocomplete / Predictive text | Context -> Text | Context manipulation is key probe. |
| 4.2 | Recommendation engine | Behavior -> Items | Behavioral adaptation test. |
| 4.3 | Virtual avatar / Animated character | Text -> Animation+Audio | Multi-frame capture + speech correlation. |
| 4.4 | AI game opponents / NPC behavior | Game state -> Actions | Behavioral adaptation over time. |
| 4.5 | AI tutoring / Coaching | Performance -> Content | Adapts difficulty. |
| 4.6 | AI-assisted drawing / Painting | Strokes -> Strokes | Canvas interaction + model inference. |
| 4.7 | Semantic search / RAG | Text -> Text+Sources | Two-step: retrieve then generate. |
| 4.8 | AI form filling / Smart data entry | Context -> Fields | Field-prediction. |
| 4.9 | Dynamic pricing | Context -> Price | Cross-session comparison. |
| 4.10 | A/B testing / Multi-armed bandits | Traffic -> Variants | Invisible. Cross-session. |
| 4.11 | Adaptive UI / Personalized interface | Behavior -> Layout | Invisible. Cross-session. |
| 4.12 | AI music composition (real-time) | Input -> Audio | Audio gen + WebAudio. |
| 4.13 | Dynamic difficulty adjustment | Performance -> Config | Often deterministic-looking. |

## 5. INFRASTRUCTURE / SECURITY AI

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 5.1 | Fraud detection / Risk scoring | Transaction -> Score | Server-side. Minimal UI surface. |
| 5.2 | Bot detection / CAPTCHA | Behavior -> Challenge | Invisible. Telemetry scripts. |
| 5.3 | Biometric authentication | Face/Voice -> Auth | Camera/mic access during auth. |
| 5.4 | Spam filtering | Message -> Label | Server-side. |
| 5.5 | Threat detection | Logs -> Alerts | Server-side only. |

## 6. OPTIMIZATION / PLANNING AI

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 6.1 | Scheduling optimization | Constraints -> Schedule | Optimization API calls. |
| 6.2 | Route optimization | Waypoints -> Route | Mapping/routing APIs. |
| 6.3 | Digital twin / Simulation | Data -> Predictions | 3D visualization + predictions. |
| 6.4 | Inventory / Supply chain optimization | Data -> Decisions | Server-side batch. |

## 7. ACCESSIBILITY AI

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 7.1 | Auto alt-text generation | Image -> Text | Accessibility-specific output. |
| 7.2 | Audio description generation | Video -> Audio | Scene understanding + TTS. |
| 7.3 | Sign language recognition / Generation | Video -> Text / Text -> Animation | Pose estimation + classification. |
| 7.4 | AI-powered screen reader enhancement | DOM -> Text | Vision-language models. |
| 7.5 | Real-time captioning / Live transcription | Audio -> Text (streaming) | WebSocket + real-time updates. |
| 7.6 | Cognitive accessibility (simplification) | Text -> Text | Readability transformation. |

## 8. AGENTIC AI

| # | Category | Modality | Notes |
|---|----------|----------|-------|
| 8.1 | Autonomous AI agents | Task -> Multi-step actions | Chain-of-thought, tool-use patterns. |
| 8.2 | Browser automation agents | Task -> Browser actions | Automated interaction patterns. |
| 8.3 | Workflow orchestration | Task -> Multi-system actions | Sequential API calls. |

## Detection Signal Coverage

**Universal signals work well for:** All generative text/image/audio/video (1.x), text-analytical (2.1-2.5, 2.11-2.14), server-API transformations (3.x), search/RAG (4.7), optimization (6.x).

**Need special probe strategies:**
- On-device / Browser-native AI (TF.js, MediaPipe, WebNN, Chrome Built-in AI): No network signal. Detect via WASM/WebGPU, model downloads, web workers.
- Server-side-only AI (5.1, 5.4, 5.5): No client-observable signals beyond effects.
- Behavioral/invisible AI (4.9, 4.10, 4.11, 5.2): Cross-session comparison.
- Game AI (4.4, 4.13, 1.11): Often client-side, deterministic-looking. Behavioral adaptation over time.
- Real-time streaming AI (7.5, 4.12, 2.8): Continuous inference loops, WebSocket/WebRTC.

## Modality-Based Probe Grouping

| Modality | Probe Strategy | Categories |
|----------|---------------|------------|
| Text -> Text | Variability, rephrase, context, nonsense, Winograd schema | 1.1-1.3, 1.6, 1.17-1.18, 3.3-3.5, 4.7, 7.6 |
| Text -> Image | Vision verification of prompt match, nonsense prompts | 1.4, 1.10, 1.12 |
| Image -> Text | Canvas test images, graduated difficulty | 3.1, 3.15, 7.1 |
| Image -> Image | Input sensitivity, vision comparison | 3.6-3.10 |
| Text -> Audio | Duration correlation, unusual input, API mocking | 1.5, 1.8, 4.12 |
| Audio -> Text | Fake mic input, varied audio files | 3.2, 7.5 |
| Text -> Structured Data | Input sensitivity, edge cases, novel inputs | 1.11, 1.14-1.16, 2.1-2.5, 2.11, 3.13, 6.x |
| Interactive / Real-time | Behavioral adaptation, context sensitivity, temporal | 4.1-4.13 |
| Data -> Data | Input-output correlation, edge cases | 2.4, 2.16, 5.1, 6.x |

## Sources

- StackOne: 120+ Agentic AI Tools Mapped Across 11 Categories
- AIMultiple: Top 125 Generative AI Applications
- Google Cloud: 101 Real-World Gen AI Use Cases
- Chrome Built-in AI documentation
- WebNN: Bringing AI Inference to the Browser (Microsoft)
- Wikipedia: AI in Video Games
- AWS: Intelligent Document Processing
- AWS: Retrieval-Augmented Generation
- Gartner: 40% of Enterprise Apps to Feature AI Agents by 2026
