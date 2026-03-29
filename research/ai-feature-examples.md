# AI Feature Examples by Category

Concrete examples for each AI feature category in a web application taxonomy.
Each entry has two tiers: a **Regular** example (straightforward, expected) and a
**Wow** example (ambitious, demo-worthy, pushing browser limits).

---

## GENERATIVE AI

**Chatbot / Conversational assistant**
- Regular: A customer support chatbot powered by an LLM API (e.g., OpenAI or
  Anthropic) that answers product FAQs, handles returns, and escalates to a human
  agent when confidence is low. Uses a system prompt with company knowledge and
  conversation history.
- Wow: A fully offline, in-browser conversational assistant running Llama 3.2 1B
  or DeepSeek R1 1.5B via Transformers.js + WebGPU. No server, no API key, no
  data leaves the device. Users chat with a reasoning model at ~60 tokens/second
  entirely client-side, with conversation memory persisted in IndexedDB.

**Text summarization**
- Regular: A Chrome extension using Chrome's built-in Summarizer API (Gemini
  Nano) to condense long articles into bullet points without any server calls.
- Wow: A multi-document research assistant that ingests 20+ open browser tabs,
  builds a client-side vector index (using Transformers.js embeddings + HNSW in
  WASM), clusters documents by topic, and generates a structured synthesis report
  with citations -- all running on-device via WebGPU. Think "literature review
  copilot" that works offline.

**Content generation (text)**
- Regular: A blog post drafting tool where users provide a topic and tone, and an
  LLM API generates an outline, first draft, and SEO metadata. Includes a
  revision chat to refine the output.
- Wow: An in-browser creative writing studio running a local LLM (via WebLLM /
  WebGPU) that generates text in real-time as you type -- not autocomplete, but a
  split-pane "AI co-author" that mirrors your writing style by fine-tuning
  attention on your previous paragraphs. Includes a "voice" slider that
  interpolates between your style and various literary styles, computed entirely
  client-side.

**Image generation (text-to-image)**
- Regular: A web app calling the DALL-E or Stable Diffusion API to generate
  marketing images from text prompts, with style presets, aspect ratio controls,
  and batch generation.
- Wow: Running Stable Diffusion Turbo entirely in the browser via ONNX Runtime
  Web + WebGPU, generating 512x512 images in ~1 second on an RTX GPU -- no server
  at all. Users see the diffusion process live on a canvas element, can
  interrupt mid-generation to adjust the prompt, and use an interactive
  img2img mode where they sketch on a canvas and watch the AI render their
  doodle into a photorealistic image in real-time.

**Audio generation / Text-to-Speech**
- Regular: A web app using ElevenLabs or Google Cloud TTS API to convert blog
  posts into podcast-quality audio with selectable voices and speaking rates.
- Wow: A 500M-parameter multilingual TTS model (English, Chinese, Korean,
  Japanese) running entirely in-browser via WebGPU with zero-shot voice cloning.
  Users record a 10-second sample of their voice, and the model synthesizes new
  speech in their voice -- all on-device, no upload. Combined with the Whisper
  WebGPU model for a fully offline voice-to-voice translation pipeline: speak
  English, hear yourself back in Japanese.

**Code generation**
- Regular: An in-browser code editor (Monaco-based) with an LLM-powered sidebar
  that generates functions from natural language descriptions, explains selected
  code, and suggests refactors. Uses an API like Claude or GPT.
- Wow: A browser IDE that runs a local code LLM via WebGPU, generates code, then
  immediately executes it in a WebAssembly sandbox (e.g., Pyodide for Python,
  QuickJS for JavaScript) -- showing live output alongside the generated code. The
  AI iterates on its own output by reading execution errors and self-correcting,
  all client-side. Essentially an in-browser autonomous coding agent with no
  server dependency.

**Video generation**
- Regular: A web app using the Sora 2 API (or alternatives like Kling, Veo) to
  generate short video clips from text prompts for social media content, with
  preset camera movements and aspect ratios.
- Wow: A browser-based video storyboard tool where users sketch rough scenes on
  a canvas, add text descriptions per frame, and an AI generates a coherent
  video sequence with synchronized dialogue and sound effects. Users can inject
  their own likeness (via uploaded selfie video) into the generated scenes with
  accurate appearance preservation, and edit individual scenes via inpainting
  without regenerating the whole video.

**Music / Sound effect generation**
- Regular: A web app calling the Suno API to generate complete songs (vocals,
  instrumentation, lyrics) from a text prompt describing mood and genre, with
  controls for duration and structure.
- Wow: A real-time browser-based DAW (like Suno Studio) where users hum a melody
  into their microphone, the AI transcribes it to MIDI via on-device pitch
  detection, generates full orchestral accompaniment around it, and produces a
  mixed track with stems -- all in a timeline editor. Users can regenerate
  individual stems (drums, bass, vocals) independently and use an AI inpainting
  tool to fix specific 2-second sections of a track without regenerating the rest.

**3D model generation**
- Regular: A web app using Meshy AI or Tripo AI APIs to generate textured 3D
  models from text prompts, viewable in a Three.js viewport with basic orbit
  controls.
- Wow: A browser-based 3D modeling environment using WebGPU where users type a
  prompt, a neural model generates a 3D Gaussian Splat scene in real-time, and
  users can walk through the scene with first-person controls. The system uses
  feedforward generative 3DGS with per-frame inference as GPU compute passes,
  allowing real-time editing: users click on parts of the scene and prompt changes
  ("make this chair wooden", "add a window here") that update the Gaussian field
  in-place.

**Sprite / Game asset generation**
- Regular: Using PixelLab or Rosebud AI to generate pixel art character sprites
  and tilesets from text prompts, exportable as sprite sheets compatible with
  Unity/Godot.
- Wow: SEELE's browser-based game engine that generates pixel art sprites,
  animates them (walk/run/attack cycles), applies game physics, and deploys a
  playable web game -- all from text prompts, without leaving the browser. Users
  describe a character ("a knight with a flaming sword"), get an animated sprite
  sheet, drag it into a side-scrolling level also generated by AI, and play-test
  immediately in the same tab.

**Level / Map / Procedural content generation**
- Regular: A web tool that uses an LLM to generate dungeon layouts as JSON,
  rendered in a 2D tile-based map viewer with rooms, corridors, and item
  placements.
- Wow: An "infinite RPG" browser game inspired by Wildermyth, where the entire
  world is pre-generated using seeded procedural algorithms + LLM narration.
  Thousands of cities, characters (rendered as procedural SVGs with dynamic
  expressions), and quest lines are generated and cached. Players explore a
  living world where NPCs remember previous interactions, react emotionally (SVG
  eyebrows shift), and generate contextually coherent dialogue -- with
  EventSourcing-style world history ensuring narrative consistency across
  sessions.

**SVG / Vector art generation**
- Regular: A web app like Recraft or SVGMaker where users type a prompt and get a
  clean SVG illustration with editable paths, downloadable as SVG/PDF/React JSX.
  Supports style presets (flat, isometric, outline, line art).
- Wow: A brand identity generator that takes a company name and values, generates
  a complete SVG design system -- logo variations, icon set, illustration library,
  and pattern tiles -- all in a consistent style with a shared color palette. The
  output is an interactive Figma-like canvas where every element is a live SVG
  with editable paths, and users can prompt changes ("make the logo more
  geometric") that propagate across all generated assets simultaneously.

**Font generation**
- Regular: A web app that generates custom display fonts from a text description
  of the desired style ("art deco bold serif with sharp angles"), previewed
  instantly on sample text.
- Wow: A browser tool where users hand-draw 5-6 reference characters on a canvas,
  and an AI extrapolates the full alphabet (uppercase, lowercase, numbers,
  punctuation, diacritics) maintaining consistent stroke weight, x-height, and
  style. The generated font is rendered live in an OpenType preview and
  downloadable as a WOFF2 file -- all computed client-side using a neural model
  running on WebGPU.

**Color palette / Theme generation**
- Regular: Using Huemint or Adobe Generative Recolor to generate harmonious color
  palettes from a text prompt ("warm sunset tones for a meditation app"),
  previewed on UI mockups.
- Wow: A design system theme generator that analyzes a product screenshot (via
  on-device vision model), extracts the visual language, and generates a complete
  design token set (colors, spacing, typography scale, border radii, shadows) as
  CSS custom properties and Tailwind config. Users tweak a single "mood" slider
  and watch the entire theme update in real-time across a live preview of their
  actual website, with accessibility contrast ratios validated automatically.

**Layout / UI generation**
- Regular: Figma Make's prompt-to-UI feature that generates responsive layouts
  with components and styling from a natural language description, editable in
  Figma's canvas.
- Wow: A browser tool where users photograph a hand-drawn wireframe on paper
  (phone camera), an on-device vision model (SmolVLM via Transformers.js) parses
  the sketch into a component tree, and a code generation model produces a
  working React + Tailwind application deployed to a live preview URL in under 30
  seconds. Users can then iterate by voice: "make the header sticky" or "add a
  dark mode toggle" -- with changes applied in real-time via an AI agent that
  modifies the running code.

**Synthetic data generation**
- Regular: A web UI for generating realistic test datasets (names, emails,
  addresses, transaction records) using tools like MOSTLY AI or Gretel, with
  statistical properties matching a real dataset.
- Wow: A browser-based data lab where users upload a small CSV (e.g., 100 rows of
  patient records), an LLM generates a statistically faithful synthetic dataset
  of 100K rows with differential privacy guarantees, and an interactive
  visualization (D3.js) shows side-by-side distribution comparisons proving the
  synthetic data preserves correlations while eliminating re-identification risk.
  The entire pipeline runs through a WASM-compiled privacy engine with formal
  epsilon-delta guarantees displayed in the UI.

**Story / Narrative / Quest generation**
- Regular: A web app for game designers that generates branching quest lines from
  a premise and character roster, outputting a visual dialogue tree with
  Mermaid.js flowcharts.
- Wow: A collaborative storytelling platform where multiple users contribute to a
  shared narrative in real-time, and an AI "Dungeon Master" agent mediates --
  maintaining narrative coherence, introducing plot twists based on story
  structure theory (three-act structure, hero's journey), generating
  illustrations for key scenes (via client-side Stable Diffusion), and producing
  an audio narration of each chapter (via browser TTS). The story world has
  persistent state managed in a client-side knowledge graph.

**NPC dialogue generation**
- Regular: A game dialogue tool where designers define NPC personality traits and
  lore constraints, and an LLM generates contextual dialogue options for each
  game state.
- Wow: A browser-playable demo where NPCs run on a local LLM (via WebLLM) with
  persistent memory -- they remember what you said three conversations ago, hold
  grudges, form alliances, and gossip about you to other NPCs. The system uses
  typed world state (TypeScript interfaces for traits, relationships, history)
  and EventSourcing to maintain narrative consistency. NPC facial expressions
  update via procedural SVGs that react to their emotional state in real-time.

**Data visualization / Chart generation**
- Regular: Using Graphy or ChatSlide to paste a CSV and generate interactive
  charts (bar, line, scatter, pie) from a natural language query like "show
  monthly revenue by region."
- Wow: A data storytelling tool where users paste raw data and describe a
  narrative, and the AI generates an animated, scrollytelling data visualization
  (D3.js) with annotated insights, smooth transitions between views, and a
  voiceover script. The tool auto-selects the optimal chart types, generates
  accessible descriptions, and produces a shareable URL -- all from a single
  prompt.

**Slide / Presentation generation**
- Regular: Using Gamma or Canva's AI presentation maker to generate a full slide
  deck from a topic and outline, with consistent branding, stock images, and
  speaker notes.
- Wow: A presentation tool where users upload a research paper PDF, and the AI
  generates a conference-ready slide deck with: extracted key findings as bullet
  points, auto-generated diagrams from textual descriptions (using Mermaid.js
  and SVG generation), relevant data re-visualized as interactive charts,
  speaker notes with timing estimates, and a "rehearsal mode" where an AI
  audience asks tough questions based on the paper content. All rendering happens
  client-side; the deck is a self-contained HTML file.

---

## ANALYTICAL AI

**Text classification / Categorization**
- Regular: A web app that classifies customer support tickets by category
  (billing, technical, feature request) using a fine-tuned model via API, with
  confidence scores and auto-routing.
- Wow: A browser-based email triage system running a local classifier
  (DistilBERT via Transformers.js) that categorizes, prioritizes, and
  summarizes incoming emails entirely on-device. It learns from the user's
  manual corrections via in-browser fine-tuning (transfer learning on WebGPU),
  getting more accurate over time without any data leaving the device.

**Sentiment analysis**
- Regular: A dashboard that analyzes product reviews using a sentiment analysis
  API, showing overall sentiment distribution, trends over time, and flagging
  the most negative reviews.
- Wow: A real-time social media sentiment heatmap that streams live posts (via
  WebSocket), runs sentiment classification on-device (Transformers.js), plots
  sentiment geographically on a WebGL globe, and uses anomaly detection to
  alert when sentiment for a topic suddenly shifts -- all in-browser. Combined
  with entity extraction to show sentiment per-brand or per-product on the
  same visualization.

**Named Entity Recognition (NER)**
- Regular: A web tool that highlights people, organizations, locations, and dates
  in pasted text using a cloud NER API, with entity type color coding and
  export to structured JSON.
- Wow: A browser-based investigative journalism tool that runs NER on-device
  (Transformers.js), automatically extracts entities from uploaded documents
  (PDFs via PDF.js + WASM OCR), builds an interactive relationship graph
  (D3.js force-directed layout) showing connections between people, orgs, and
  locations, and surfaces hidden patterns -- like the same person appearing
  across 50 documents. All processing is local, critical for handling sensitive
  source documents.

**Anomaly detection**
- Regular: A web dashboard that monitors time-series metrics (server load,
  transaction volumes) and flags anomalies using statistical methods, with
  configurable sensitivity thresholds.
- Wow: A browser-based IoT monitoring system that ingests sensor data via
  WebSocket, runs a TensorFlow.js autoencoder for anomaly detection in
  real-time, visualizes normal vs anomalous patterns on a WebGL scatterplot,
  and uses an on-device LLM to generate natural language explanations of each
  anomaly ("Temperature spike in Sensor 7 correlates with humidity drop in
  Sensor 12, suggesting a ventilation failure"). The entire detection and
  explanation pipeline runs client-side.

**Predictive analytics / Forecasting**
- Regular: A web app that takes historical sales data (CSV upload) and generates
  revenue forecasts using a time-series API, with confidence intervals and
  trend decomposition charts.
- Wow: A browser-based "what-if" scenario planning tool that runs ONNX-format
  forecasting models (Prophet/N-BEATS compiled to WASM) entirely client-side.
  Users drag sliders for variables (marketing spend, pricing, seasonality),
  and forecasts update in real-time across multiple interconnected charts.
  An LLM overlay narrates the implications: "Increasing price by 10% reduces
  volume by 8% but improves margin by 15%, netting $2.3M over 6 months."

**Object detection in images/video**
- Regular: A web app using a cloud vision API to detect and label objects in
  uploaded photos, with bounding boxes and confidence scores.
- Wow: Real-time multi-object detection running entirely in-browser via
  TensorFlow.js + WebGL, processing a live webcam feed at 30+ FPS using
  YOLO11. Users can fine-tune detection for custom objects by uploading 10-20
  labeled images and running transfer learning in the browser. Combined with
  depth estimation (Depth Anything V2 via Transformers.js) to show detected
  objects in a 3D spatial map rendered with Three.js.

**Face detection / Recognition**
- Regular: A web app that detects faces in uploaded photos using a cloud API and
  groups them by identity for photo album organization.
- Wow: A privacy-preserving, fully on-device face clustering system that
  processes a user's photo library entirely in-browser. Face detection (via
  MediaPipe), embedding extraction (via ONNX Runtime Web), and clustering
  (DBSCAN in WASM) all run client-side. No face data is ever transmitted.
  Users can search their photos by pointing the webcam at a person and
  finding all their photos -- running face matching at 50+ FPS on WebGPU.

**Pose estimation (body/hand tracking)**
- Regular: A web app using MediaPipe Pose or MoveNet (TensorFlow.js) to track
  body keypoints from a webcam feed, displayed as a skeleton overlay.
- Wow: A browser-based physical therapy / fitness coach that uses MoveNet
  Lightning for real-time pose estimation at 50+ FPS, compares the user's
  form against reference poses using cosine similarity on joint angles,
  provides audio feedback ("straighten your back", "bend your knee more"),
  and tracks progress over time with rep counting and range-of-motion charts.
  All processing is local; no video is transmitted. Works on mobile browsers
  for use at a gym.

**Gesture recognition**
- Regular: A web app using MediaPipe Hands to recognize basic hand gestures
  (thumbs up, peace sign, open palm) from a webcam feed, triggering UI actions.
- Wow: A browser-based presentation controller where the speaker uses hand
  gestures (detected via MediaPipe on WebGPU) to advance slides, zoom into
  charts, highlight bullet points, and trigger animations -- no clicker needed.
  Combined with face expression detection to pause the presentation
  automatically if the speaker looks confused. The gesture vocabulary is
  customizable: users "teach" new gestures by demonstrating them 5 times,
  with a few-shot classifier trained in-browser.

**Emotion / Affect detection**
- Regular: A web app that detects facial expressions (happy, sad, surprised,
  angry, neutral) from a webcam feed using a TensorFlow.js model, displaying
  the dominant emotion label.
- Wow: A browser-based UX research tool that records a user's screen and webcam
  simultaneously, runs on-device emotion detection frame-by-frame, and
  generates a timestamped "emotional heatmap" overlaid on the screen recording
  -- showing exactly which UI elements triggered frustration, confusion, or
  delight. The analysis runs entirely in-browser using Web Workers for
  parallel processing, with an LLM generating a summary report of UX pain
  points.

**Content moderation / Toxicity detection**
- Regular: A web app that checks user-generated content against a toxicity API
  (Perspective API, OpenAI Moderation) before posting, with severity scores
  and category breakdowns (harassment, hate speech, self-harm).
- Wow: A real-time on-device content filter that runs a toxicity classifier
  (DistilBERT) via Transformers.js in a Web Worker, analyzing every keystroke
  as users type in a social platform's compose box. Toxic content is flagged
  before the user even clicks "post", with a non-judgmental "rethink"
  prompt that uses Chrome's built-in Rewriter API to suggest a less harmful
  rephrasing of the same message.

**Plagiarism / Similarity detection**
- Regular: A web app that checks submitted text against a database using an API
  like Copyleaks, highlighting matching passages with source links and a
  similarity percentage.
- Wow: A browser-based academic integrity tool that computes sentence embeddings
  on-device (all-MiniLM-L6-v2 via Transformers.js), builds a local vector
  index of a student's previous submissions, and detects self-plagiarism and
  paraphrased copying without sending any text to a server. Includes a visual
  similarity matrix showing which passages are suspiciously close to each
  other, with UMAP dimensionality reduction plotted in a WebGL scatterplot.

**AI-generated content detection**
- Regular: A web tool that analyzes text and reports the probability of it being
  AI-generated, with per-paragraph scores and highlighted suspicious sections.
  Uses an API like Pangram Labs or Copyleaks.
- Wow: A browser extension that runs a local AI detection model (fine-tuned
  classifier via Transformers.js) on every webpage visited, adding a subtle
  overlay badge indicating what percentage of the page content is likely
  AI-generated. Works on news sites, social media, and product reviews,
  helping users gauge content authenticity without any data leaving their
  browser. Includes statistical analysis of linguistic patterns (burstiness,
  perplexity) computed client-side.

**Document classification / IDP**
- Regular: A web app that accepts uploaded PDFs, classifies them by type
  (invoice, contract, receipt, letter) using a document AI API, and extracts
  key fields into structured data.
- Wow: A fully on-device intelligent document processing pipeline: PDF.js
  renders pages, Tesseract.js (WASM) performs OCR, a LayoutLM model
  (ONNX Runtime Web) classifies document type and extracts fields, and an
  LLM validates and corrects extracted data. Users drag-drop a stack of
  mixed documents, and the system auto-sorts, extracts, and populates a
  structured spreadsheet -- all in-browser with zero server calls. Handles
  handwritten notes alongside printed text.

**Activity / Action recognition**
- Regular: A web app using a cloud video analysis API to detect activities in
  uploaded video clips (walking, running, falling, waving).
- Wow: A browser-based workplace safety monitor that processes a live webcam feed
  using TensorFlow.js action recognition, detects unsafe behaviors (not
  wearing PPE, entering restricted zones, improper lifting), and generates
  real-time alerts with screenshots. Uses a combination of pose estimation
  and object detection running in parallel Web Workers, achieving 15+ FPS
  entirely client-side. Includes a dashboard showing safety compliance trends
  over time.

**Knowledge graph construction**
- Regular: A web app that extracts entities and relationships from pasted text
  using an LLM API and visualizes them as an interactive knowledge graph
  using D3.js or vis.js.
- Wow: AGENTiGraph-style multi-agent system accessible via a browser: users
  upload a collection of documents, and a team of AI agents (running via API)
  collaboratively extract entities, classify relationships, resolve
  duplicates, and build a navigable knowledge graph. Users explore the graph
  in a 3D WebGL visualization (Three.js), ask natural language questions
  ("How is Company X connected to Person Y?"), and the system traces paths
  through the graph to answer -- combining Graph RAG with interactive
  exploration. Achieves 95%+ classification accuracy on domain-specific
  corpora.

---

## TRANSFORMATION AI

**OCR**
- Regular: A web app that accepts photos of documents (via camera or file upload)
  and extracts text using a cloud OCR API like Google Vision or Azure AI,
  with output formatted as editable text.
- Wow: A fully offline, in-browser OCR pipeline using Tesseract.js (WASM) with
  custom language pack support, combined with a layout analysis model that
  preserves document structure (tables, columns, headers). Users photograph a
  printed page with their phone camera, get structured text output in under
  2 seconds, and can export as Markdown with table formatting intact -- all
  without internet. Supports 100+ languages with on-demand model download
  and caching via Service Worker.

**Speech-to-Text**
- Regular: A web app using a cloud ASR API (Whisper API, Google Speech-to-Text)
  to transcribe uploaded audio files with speaker diarization and timestamps.
- Wow: Whisper running entirely in-browser via Transformers.js + WebGPU,
  performing real-time transcription from the microphone at near-native speed
  (~3x real-time on a mid-range GPU). Supports 100+ languages with auto-
  detection, works completely offline once the ~200MB model is cached, and
  includes live translation (speak in French, see English text). Combined
  with a local LLM to generate structured meeting notes with action items
  from the raw transcript -- all on-device.

**Translation**
- Regular: A web app using Chrome's built-in Translator API or a cloud
  translation API to translate text between languages, with language auto-
  detection and side-by-side display.
- Wow: A real-time "universal translator" browser app that chains three
  on-device models: Whisper (speech-to-text via WebGPU), an OPUS-MT
  translation model (Transformers.js), and a multilingual TTS model --
  creating a live interpreter that listens in one language and speaks in
  another with <2 second latency, entirely offline. Users set it on the table
  during a conversation with someone who speaks a different language, and it
  mediates in real-time through the browser.

**Paraphrasing / Rewriting**
- Regular: A web app using Chrome's built-in Rewriter API (Gemini Nano) to
  rephrase selected text in different tones (formal, casual, concise),
  running entirely on-device.
- Wow: A "style chameleon" writing tool that analyzes a reference text sample
  (e.g., a Hemingway paragraph) on-device, extracts its stylistic fingerprint
  (sentence length distribution, vocabulary complexity, passive voice ratio),
  and rewrites user input to match that style. Users paste text and select a
  target author/publication style, and the tool produces a faithful
  stylistic adaptation while preserving meaning. Includes a visual "style
  radar chart" comparing the original and rewritten text across multiple
  linguistic dimensions.

**Grammar / Spelling / Proofreading**
- Regular: A web app using Chrome's built-in Proofreader API (Gemini Nano) to
  check grammar and spelling in real-time as users type, with inline
  corrections and explanations.
- Wow: A multilingual proofreading assistant running entirely on-device that
  not only corrects grammar but understands context-dependent style rules
  (AP style vs Chicago Manual, British vs American English), flags
  inconsistencies within a document ("you used 'colour' on page 1 and
  'color' on page 3"), and provides readability scores with targeted
  simplification suggestions. Runs as a Service Worker that intercepts all
  text input across every website the user visits.

**Image upscaling / Super-resolution**
- Regular: A web app that upscales low-resolution images using a cloud API,
  with 2x/4x options and before/after comparison slider.
- Wow: Real-time video super-resolution running in-browser via WebSR + WebGPU.
  Users play a low-resolution video, and a neural network (RealESRGAN /
  Anime4K) upscales each frame in real-time to 4K on the fly, with custom
  models trainable for specific content types. The browser becomes a live
  video enhancer -- perfect for upscaling old family videos or low-bitrate
  streams, running at 30+ FPS client-side.

**Background removal**
- Regular: A web app using remove.bg's API to strip backgrounds from product
  photos with one click, with edge refinement and transparent PNG export.
- Wow: Real-time background removal from a live webcam feed running entirely
  in-browser using Segment Anything (SAM) via ONNX Runtime Web + WebGPU.
  Users see themselves with the background replaced in real-time (like a
  virtual green screen), can click to select specific objects to keep or
  remove, and the segmentation mask is accurate enough for hair strands.
  Works as a virtual background for any video call platform via a virtual
  camera feed from a canvas element.

**Style transfer**
- Regular: A web app that applies artistic styles (Van Gogh, Monet, Picasso) to
  uploaded photos using a cloud API, with style intensity slider.
- Wow: Real-time video style transfer running in-browser via WebGPU, processing
  a live webcam feed. Users select a style painting (or provide any image),
  and their live video is rendered in that style at 24+ FPS. The model allows
  continuous interpolation between styles -- users can smoothly morph from
  Monet to Picasso by dragging a slider. Combined with pose estimation to
  apply different styles to the person vs the background.

**Inpainting / Outpainting**
- Regular: A web app where users upload an image, mask an area with a brush, and
  describe what should fill it, using a Stable Diffusion inpainting API.
- Wow: A browser-based photo editor running Stable Diffusion inpainting via ONNX
  Runtime Web + WebGPU, entirely client-side. Users paint over unwanted
  objects and they vanish (context-aware fill), or extend the canvas edges
  and the AI generates seamless outpainting. The system preserves EXIF data
  and operates at near-interactive speeds (<3 seconds per inpaint on a decent
  GPU). Combined with SAM for click-to-select object removal: click an
  object, it's segmented, masked, and inpainted in one step.

**Colorization (B&W to color)**
- Regular: A web app that colorizes black-and-white photos using a cloud API,
  with automatic colorization and optional manual color hints.
- Wow: A browser-based photo restoration suite that takes old, damaged B&W
  photos and applies a pipeline entirely on-device: scratch/damage repair
  (inpainting via WebGPU), super-resolution (2x upscaling), and AI
  colorization. Users can guide the colorization by clicking areas and
  specifying colors ("this dress should be blue"), and the model respects
  those hints while colorizing the rest naturally. Includes a before/after
  scrubber with animated transitions.

**Audio enhancement / Noise removal**
- Regular: A web app that processes uploaded audio files through a noise
  reduction API, removing background noise while preserving speech clarity.
- Wow: Real-time audio enhancement running in-browser via a WASM-compiled
  neural noise suppression model (like RNNoise or DeepFilterNet). Users
  enable it as a "virtual microphone" via the Web Audio API, and all their
  audio (calls, recordings, voice memos) passes through the AI denoiser in
  real-time with <10ms latency. Background noise (keyboard clicks, traffic,
  construction) vanishes live. Works with any web-based video call platform.

**Text-to-SQL / NL to query**
- Regular: A web app where users type questions about their data in plain
  English, and an LLM API generates and executes SQL queries against a
  connected database, returning results as tables and charts.
- Wow: A fully browser-based "data analyst" that loads a SQLite database into
  WASM (sql.js), runs an on-device LLM (via WebGPU) to convert natural
  language to SQL, executes queries locally, and visualizes results with
  auto-selected chart types (D3.js). Users have a conversation with their
  data: "What were the top products last quarter?" followed by "Now break
  that down by region" -- with the AI maintaining query context. All data
  stays in the browser. Includes query explanation and self-correction when
  queries return unexpected results.

**Image captioning / Alt text generation**
- Regular: A web app that generates descriptive alt text for uploaded images
  using a cloud vision API, with options for brevity level and audience.
- Wow: A browser extension running SmolVLM (vision-language model via
  Transformers.js + WebGPU) that automatically generates alt text for every
  image on every webpage -- in real-time, as the user browses. The model
  understands context (a chart needs a data description, a portrait needs
  different alt text than a landscape), generates multiple description levels
  (brief for screen readers, detailed for image search), and works entirely
  offline after model download. Directly patches the DOM, improving
  accessibility of the entire web for visually impaired users.

**Voice cloning / Voice conversion**
- Regular: A web app using ElevenLabs' API where users upload a voice sample and
  generate speech in their cloned voice from typed text.
- Wow: A browser-based voice dubbing studio where users upload a video of
  themselves speaking English, an on-device pipeline translates the speech to
  another language, clones their voice in that language (zero-shot via
  Transformers.js), generates lip-synced mouth movements (via a MediaPipe-
  based model), and produces a dubbed video where they appear to speak
  fluent Japanese -- all processed client-side. The user never uploads their
  voice or video to any server.

**Format conversion (sketch-to-UI, image-to-code)**
- Regular: A web app using UI2CODE or TeleportHQ to convert a screenshot of a
  UI design into HTML/CSS/React code with reasonable accuracy.
- Wow: A multimodal conversion pipeline where users photograph a hand-drawn
  wireframe, and a browser-based vision model (SmolVLM via WebGPU) parses it
  into a component tree, a code generation model produces responsive React +
  Tailwind code, the code runs live in an iframe preview, and users iterate
  by voice ("swap the sidebar to the right", "make buttons rounded") with
  changes applied in real-time. Google Stitch's multimodal approach -- mixing
  sketch images with text descriptions -- taken to its client-side extreme.

---

## INTERACTIVE / REAL-TIME AI

**Smart autocomplete / Predictive text**
- Regular: A search box with predictive suggestions using Algolia or a custom
  model, ranking results by user history and trending queries.
- Wow: An on-device predictive text system running a small language model via
  WebGPU that adapts to the individual user's writing style over time. It
  doesn't just suggest the next word -- it predicts entire sentences, adapts
  to the current context (email vs code vs chat), and uses the Chrome Prompt
  API to run completions with zero latency. The model learns from the user's
  typing patterns (stored locally in IndexedDB), getting more personalized
  without any data transmission.

**Recommendation engine**
- Regular: A product recommendation widget on an e-commerce site using a cloud
  recommendation API (Amazon Personalize, Dynamic Yield) to show "customers
  also bought" and personalized suggestions.
- Wow: A fully client-side recommendation engine that computes item embeddings
  in-browser using Transformers.js, builds a nearest-neighbor index in WASM,
  and generates personalized recommendations based on the user's browsing
  session -- without any tracking pixels, cookies, or server-side user
  profiles. Privacy by design: the recommendation model runs locally, user
  preferences never leave the device, yet the quality matches cloud-based
  systems. Includes a "why this recommendation?" explainability panel showing
  the embedding similarity reasoning.

**Virtual avatar / Animated character**
- Regular: A web app using Synthesia or HeyGen API to create a talking-head
  avatar video from text input, with selectable avatar appearances.
- Wow: A real-time 3D AI companion rendered in Three.js with a customizable VRM
  anime-style avatar, powered by Google Gemini's real-time API. The avatar
  responds to voice with <500ms latency, features real-time lip-sync,
  emotional facial expressions, body language, and automatic blinking.
  Users speak naturally and the avatar converses back using a cloned voice
  with matching mouth movements. The avatar runs in a Google Colab or fully
  in-browser via WebGPU, and users can swap the 3D model, background, and
  personality via config files.

**AI game opponents / NPC behavior**
- Regular: A browser chess or Go game where the AI opponent uses a cloud API to
  compute moves, with adjustable difficulty levels.
- Wow: Browser-based game NPCs powered by a local LLM (WebLLM) that exhibit
  emergent behavior -- they don't just follow scripts but form goals, make
  plans, adapt to player strategies, and coordinate with each other. In a
  real-time strategy web game, enemy AI commanders learn from player tactics
  across sessions (state persisted in IndexedDB), develop counter-strategies,
  and even attempt to deceive the player. Combined with reinforcement
  learning running in TensorFlow.js for combat optimization, achieving
  superhuman performance in the browser.

**AI tutoring / Coaching**
- Regular: A web-based math tutoring app where students solve problems and an
  LLM API provides hints, step-by-step explanations, and Socratic follow-up
  questions.
- Wow: An adaptive learning platform that runs a local LLM (Gemini Nano via
  Chrome Prompt API) for instant Socratic tutoring, combined with
  TensorFlow.js-powered dynamic difficulty adjustment. The system keeps the
  student in their "zone of proximal development" -- correct answers lead
  to harder problems, errors trigger scaffolding. The AI generates
  personalized practice problems, visualizes solutions with animated
  diagrams (Canvas API), tracks mastery per concept in a knowledge graph,
  and adapts its teaching style based on the student's learning patterns.
  All data stays on-device; parents can review progress without any cloud
  account.

**AI-assisted drawing / Painting**
- Regular: A canvas-based drawing app where users sketch rough shapes and an AI
  (via API) generates a polished illustration based on the sketch + a text
  prompt.
- Wow: Microsoft Paint Cocreator's approach taken to the extreme: a browser
  canvas app where every brush stroke triggers a real-time AI rendering.
  Users draw with simple lines, and a Stable Diffusion ControlNet model
  (running via WebGPU) continuously renders a photorealistic or stylized
  interpretation of their sketch in a side-by-side panel, updating at ~2 FPS.
  The style changes as users type descriptions ("watercolor landscape",
  "cyberpunk cityscape"), and the AI respects the spatial layout of the
  sketch while filling in details, textures, and lighting. A true AI
  "painting partner" that runs entirely in the browser.

**Semantic search / RAG**
- Regular: A web app with a search bar that uses vector embeddings (via API) to
  find semantically similar documents rather than keyword matches, returning
  results ranked by relevance with snippet previews.
- Wow: A fully client-side RAG system: users upload a collection of documents
  (PDFs, notes, bookmarks), Transformers.js computes embeddings on-device,
  stores them in an in-browser vector database (via IndexedDB + HNSW in
  WASM), and a local LLM (WebLLM) answers questions grounded in the user's
  personal knowledge base with cited sources. Works offline after initial
  setup. Users build a private, searchable "second brain" that runs entirely
  in their browser -- no cloud, no subscription, no privacy concerns.

**AI form filling / Smart data entry**
- Regular: A Chrome extension that auto-fills web forms using saved user data
  and field label matching, like Fill A Form AI.
- Wow: FormGoat-style intelligent data entry where users upload a scanned PDF
  (e.g., a tax return or medical form), the browser performs OCR
  (Tesseract.js), an LLM extracts structured data, and the system
  auto-navigates to a web form and fills every field correctly by
  semantically matching extracted data to form labels -- even handling
  multi-step forms, dropdowns, and date pickers. The AI agent visually
  highlights each field as it fills it, asks for confirmation on ambiguous
  fields, and works across any website without custom configuration.

**Dynamic pricing**
- Regular: An admin dashboard for an e-commerce site that suggests price
  adjustments based on competitor prices, inventory levels, and demand
  forecasts from an AI pricing API.
- Wow: A real-time pricing simulation environment where users define product
  catalogs and market conditions, and an RL-trained pricing agent (running
  in TensorFlow.js) optimizes prices live, showing the impact on revenue,
  conversion rate, and market share in an animated dashboard. Users can
  introduce "shocks" (competitor price drop, viral social media post, supply
  disruption) and watch the AI adapt in real-time. Includes an A/B testing
  simulator that runs 10,000 Monte Carlo simulations in WASM to estimate
  pricing strategy ROI.

**AI music composition (real-time)**
- Regular: A web app where users set mood, tempo, and genre parameters, and a
  cloud API generates a background music loop that adapts to content (e.g.,
  for a podcast or video).
- Wow: A browser-based instrument that generates music in real-time from user
  gestures. Users wave their hands in front of a webcam (tracked via
  MediaPipe), and hand position/velocity/pose maps to musical parameters
  (pitch, volume, instrument, tempo). A neural music model running in Web
  Audio API worklets generates harmonically coherent music that follows the
  user's conducting gestures in real-time -- essentially an AI orchestra
  that you conduct with your hands, performing live in the browser.

**Dynamic difficulty adjustment**
- Regular: A browser-based puzzle game that tracks solve times and error rates,
  increasing or decreasing puzzle complexity based on player performance.
- Wow: A browser-based language learning game with an RL-powered DDA system
  (TensorFlow.js) that maintains a real-time model of the student's
  knowledge across vocabulary, grammar, pronunciation, and listening
  comprehension. The system generates custom exercises at exactly the right
  difficulty using spaced repetition curves computed on-device, adapts to
  the student's learning speed (not just accuracy), and transitions between
  modalities (reading -> listening -> speaking) based on where the student
  needs the most practice. An on-device LLM generates contextual example
  sentences tailored to the student's interests. Feels like a personal tutor
  that knows exactly what you need to practice next.

---

## ACCESSIBILITY AI

**Auto alt-text generation**
- Regular: A CMS plugin that automatically generates alt text for uploaded images
  using a cloud vision API, with an editor for manual refinement before
  publishing.
- Wow: Google TalkBack's approach brought to the web: a browser extension
  running SmolVLM (vision-language model) via Transformers.js + WebGPU that
  generates context-aware alt text for every image on every webpage -- live,
  as the user browses. Unlike static alt text, the model understands the
  surrounding article text and generates descriptions like "Chart showing
  Q3 revenue exceeding Q2 by 15%, supporting the article's claim about
  growth" rather than just "a bar chart." Users can ask follow-up questions
  about any image ("what color is the car?"). All on-device; works offline.

**Real-time captioning / Live transcription**
- Regular: A web app using a cloud ASR API to provide live captions during video
  calls or presentations, with speaker identification.
- Wow: Chrome's built-in Live Caption feature taken further: a browser-based
  meeting tool with Whisper running on WebGPU for real-time multilingual
  transcription, automatic translation into the viewer's language, sentiment-
  tagged timestamps ("heated discussion at 14:32"), automatic meeting
  summary generation (via local LLM), and "Expressive Captions" that convey
  tone and emotion (whispered, shouted, sarcastic) -- all on-device. Works
  for any audio source: browser tabs, microphone, system audio. Deaf users
  get not just words but communication nuance.

**Cognitive accessibility (simplification)**
- Regular: A browser extension using Chrome's built-in Rewriter API to simplify
  complex text into plain language, with reading level targeting (e.g., 6th
  grade).
- Wow: EduAdapt-style neurodivergent-friendly reading mode: a browser extension
  that transforms any webpage for users with ADHD or dyslexia. It uses a
  local LLM to simplify text, restructures content into shorter paragraphs
  with clear headings, adds TL;DR summaries, replaces jargon with plain
  language, and adjusts visual presentation (font, spacing, colors) based on
  evidence-based readability research. Users set their accessibility profile
  once, and every webpage adapts. Includes a "focus mode" that progressively
  reveals content paragraph-by-paragraph to reduce cognitive overload.

**Sign language recognition / Generation**
- Regular: A web app using MediaPipe Hands and a trained classifier to recognize
  basic ASL alphabet signs from a webcam feed, displaying the corresponding
  letter.
- Wow: A bidirectional sign language communication bridge in the browser: one
  side uses YOLOv11 + MediaPipe for real-time ASL recognition at 98%+
  accuracy (translating sign to text/speech), while the other side uses
  Google SignGemma (on-device via TensorFlow Lite / WASM) to generate an
  animated 3D avatar that signs the text response in ASL. Two people -- one
  deaf, one hearing -- can have a real-time conversation through the browser,
  with the AI mediating between speech and sign language in both directions,
  all on-device. The avatar renders in Three.js with natural facial
  expressions and fingerspelling.

---

## AGENTIC AI

**Autonomous AI agents**
- Regular: A web-based task automation tool (like AgentGPT) where users describe
  a goal, and an LLM agent breaks it down into subtasks, executes web
  searches, and compiles results into a report.
- Wow: A fully in-browser autonomous AI agent (inspired by Chrome Auto Browse /
  Claude for Chrome) that can navigate websites, fill forms, extract data,
  compare prices across sites, and complete multi-step workflows
  autonomously -- with a visible action trace so users see every click and
  decision. The agent uses a local LLM (WebLLM) for planning and a vision
  model for understanding page layout, operates within a user-defined
  permission sandbox (can browse but not purchase without confirmation), and
  maintains a persistent memory of learned workflows across sessions. Users
  say "find the cheapest flight from NYC to London next month" and watch the
  agent research across multiple airline sites in real-time.

**Workflow orchestration**
- Regular: A web-based workflow builder (node-graph UI) where users chain
  together AI capabilities (summarize -> translate -> generate image) and
  trigger them on schedules or events.
- Wow: A CrewAI/MetaGPT-style multi-agent orchestration platform running in the
  browser, where users define a team of specialized AI agents (researcher,
  writer, reviewer, designer) with distinct roles, and the agents
  collaborate autonomously to complete complex projects. Users describe a
  goal ("create a marketing campaign for our new product"), and the agents
  divide work, share intermediate results, critique each other's output, and
  produce a polished deliverable (copy, images, presentation). The
  orchestration runs via a visual DAG editor (react-flow), with real-time
  agent chat logs visible. Combines local LLMs (WebLLM for fast tasks) with
  cloud LLMs (for complex reasoning), with a cost tracker showing exactly
  how much each agent spent.
