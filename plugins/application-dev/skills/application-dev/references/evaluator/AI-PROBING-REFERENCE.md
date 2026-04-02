# AI Feature Probing Reference

**Loaded at:** Step 8 (AI Feature Probing) of the evaluation workflow.

**Purpose:** This file is the projection-critic's adversarial probe reference for AI features. It describes probe STRATEGIES organized by input/output modality. The projection-critic generates domain-appropriate probe inputs on the fly from SPEC.md context.

---

## Philosophy

### Chinese Room Foundation

Probes test semantics (does the AI understand the input?) not syntax (does the response look well-formed?). A grammatically correct response is not evidence of real AI -- the Generator can produce syntactically perfect canned responses.

The theoretical foundation: a system can manipulate symbols correctly without understanding their meaning. Canned responses can be keyword-triggered, grammatically correct, and topically relevant without any inference occurring. Behavioral probes test for the presence of inference by requiring semantic understanding that symbol manipulation alone cannot produce.

### Goodhart's Law Protection

This file describes probe STRATEGIES, not fixed scripts with exact inputs. The projection-critic derives specific inputs from SPEC.md domain context at evaluation time. This prevents the Generator from pre-computing responses to known probes.

- Strategies describe WHAT to test and WHY
- The projection-critic generates domain-appropriate inputs on the fly
- Probes should reference SPEC.md content, not generic examples
- If a probe input could be anticipated and hard-coded against, the input is too predictable

### Subject Matter Expert Judge

The projection-critic reads SPEC.md before AI probing (workflow Step 1 -> Step 8). By the time it probes AI features, it knows the app's domain. Domain questions and Winograd schemas should reference SPEC.md content, not generic examples. This makes the critic a domain-expert judge -- dramatically harder to fool than a naive judge.

---

## Three-Tier Detection Model

### Tier 1: Behavioral Probes (Primary Evidence)

What is described in this file. Behavioral probes test whether the AI feature demonstrates genuine inference by requiring it to process inputs that keyword matchers and pre-stored responses cannot handle. Behavioral evidence is the primary basis for the Real AI / Canned / Hybrid verdict.

### Tier 2: Technical Signals (Supporting Evidence)

Technical signals support or contradict behavioral findings:
- **Latency patterns:** Real inference has measurable latency. Instant responses to complex prompts suggest pre-stored content.
- **Network requests:** API calls to AI endpoints (OpenAI, Anthropic, Gemini, local model servers) indicate real inference. Absence of network calls in a server-based AI claim is suspicious.
- **Browser API presence:** `window.ai`, `navigator.ml`, `ai.languageModel` indicate Chrome Built-in AI. Their absence when claimed is a red flag.
- **Model downloads:** Large downloads (hundreds of MB to GB) during first use indicate on-device model loading.
- **WebSocket connections:** Streaming responses via WebSocket suggest real-time inference.

Technical signals alone are NOT sufficient for a verdict. They support behavioral findings.

### Tier 3: NO Code Scanning

The critic does NOT scan the Generator's source code to determine if AI features are real. GAN principle: the discriminator evaluates output, not the generator's internals.

---

## Probe Ordering Principle

Start with variability and domain probes. Escalate to adversarial probes (nonsense, negation, Theory of Mind). This ordering prevents habituation from masking baseline failures.

The 10-probe battery (0-9) is already ordered from baseline to adversarial:
- Probes 0-3: Baseline capabilities (variability, domain knowledge, paraphrase, context)
- Probes 4-6: Adversarial challenges (nonsense, out-of-domain, negation)
- Probes 7-9: Advanced capabilities (instruction-following, multi-step reasoning, language switch)

If Probe 0 (Variability) returns 3 identical responses, this is a fast exit: the feature is definitively canned. Skip remaining probes for this feature.

---

## Universal 10-Probe Battery for Conversational AI Features

All 10 probes are mandatory for every Text -> Text AI feature. The projection-critic generates domain-appropriate inputs from SPEC.md.

### Probe 0: Variability (x3 Same Prompt)

**Purpose:** Detect deterministic/pre-stored responses. Real AI produces varied output for identical input.

**Strategy:** Send the same domain-relevant prompt 3 times. Derive the prompt from the most common user interaction described in SPEC.md (e.g., a product question for an e-commerce assistant, an artwork question for a museum chatbot).

**Canned signal:** All 3 responses are identical or near-identical (same structure, same sentences, minor cosmetic differences only).

**Real AI signal:** Responses vary in wording, structure, or emphasis while remaining topically consistent.

**Fast exit:** 3 identical responses = definitive canned. Mark the feature as Canned and skip Probes 1-9 for this feature.

### Probe 1: Domain Question

**Purpose:** Test basic domain knowledge from SPEC.md context.

**Strategy:** Ask a factual question about the app's domain that requires knowledge consistent with what the AI feature claims to have. Derive the question from specific domain details in SPEC.md.

**Canned signal:** Response is vaguely topical but avoids specifics, or gives information inconsistent with the domain.

**Real AI signal:** Response addresses the specific domain question with relevant factual content.

### Probe 2: Rephrase

**Purpose:** Test whether the AI handles paraphrased input or only matches exact keywords.

**Strategy:** Take the Probe 1 question and rephrase it substantially -- change sentence structure, use synonyms, alter the framing. The semantic content should be identical; only the surface form changes.

**Canned signal:** Response is significantly different from Probe 1's response despite the same semantic content, OR the response does not address the rephrased question (keyword miss).

**Real AI signal:** Response is semantically consistent with Probe 1's response, adapted to the new phrasing.

### Probe 3: Follow-Up Referencing Prior Answer

**Purpose:** Test conversational context. Does the AI remember what it just said?

**Strategy:** Reference a specific detail from the Probe 1 or 2 response. Ask a follow-up that requires understanding that detail (e.g., "You mentioned X -- can you elaborate on that?").

**Canned signal:** Response ignores the reference and gives a generic or topic-shifted reply. The system does not demonstrate awareness of its prior output.

**Real AI signal:** Response directly addresses the referenced detail with additional relevant information.

### Probe 4: Nonsense Input

**Purpose:** Test graceful handling of meaningless input. Canned systems keyword-match and may produce topical responses to garbage.

**Strategy:** Generate a nonsense input that contains domain keywords embedded in gibberish. Example approach: take a domain keyword from SPEC.md and surround it with invented words (e.g., "florbigax [domain-term] zplonk murkle").

**Canned signal:** Response treats the nonsense as a valid question and gives a topical answer keyed to the domain keyword. The system does not acknowledge the input is unintelligible.

**Real AI signal:** Response acknowledges confusion, asks for clarification, or explicitly states the input is unclear.

### Probe 5: Out-of-Domain Question

**Purpose:** Test boundary awareness. Does the AI know what it does NOT know?

**Strategy:** Ask a question completely unrelated to the app's domain but phrased as if it belongs (e.g., ask a museum chatbot about cooking recipes, or ask an e-commerce assistant about astrophysics).

**Canned signal:** Response gives generic domain content regardless of the off-topic question (keyword tunnel vision), or attempts to answer the unrelated question as if it is in-domain.

**Real AI signal:** Response either politely declines, redirects to its domain, or acknowledges the question is outside its scope.

### Probe 6: Negation

**Purpose:** Test whether the system processes negation or ignores it. Templates and keyword matchers typically ignore "don't" and "not."

**Strategy:** Give an instruction that uses negation: "Do NOT tell me about [prominent domain topic from SPEC.md]." The response should avoid that topic.

**Canned signal:** Response discusses the negated topic anyway. The system matched the keyword and ignored the negation.

**Real AI signal:** Response respects the negation and discusses something else, or asks what the user would like instead.

### Probe 7: Instruction-Following

**Purpose:** Test format compliance. Can the AI follow specific output instructions?

**Strategy:** Ask a domain question from SPEC.md but with a format constraint: "Respond in exactly 3 bullet points" or "Explain in one sentence" or "List the top 5 in numbered format."

**Canned signal:** Response ignores the format instruction and gives a default-format answer (paragraphs when bullets were requested, long response when one sentence was requested).

**Real AI signal:** Response follows the format instruction while remaining topically relevant.

### Probe 8: Multi-Step Reasoning

**Purpose:** Test synthesis and comparison. Keyword matchers handle single topics but fail on relational queries.

**Strategy:** Ask a question that requires comparing, contrasting, or relating two domain concepts from SPEC.md. The question should require considering both concepts simultaneously, not just mentioning them.

**Canned signal:** Response mentions both concepts but treats them independently without actual comparison. Or the response only addresses one concept.

**Real AI signal:** Response demonstrates understanding of the relationship between the concepts, with specific comparative points.

### Probe 9: Language Switch

**Purpose:** Dual purpose -- tests multilingual capability AND is a strong canned detection signal. Canned systems with pre-stored English responses cannot produce coherent foreign-language output.

**Strategy:** Ask a domain question in a non-English language (e.g., French, Spanish, Japanese). The question should be domain-relevant and derived from SPEC.md content.

**Canned signal:** Response is in English despite a non-English prompt, or the response is incoherent/machine-translated-looking in the target language, or the response is a canned English response with no acknowledgment of the language.

**Real AI signal:** Response is in the requested language and is topically relevant. Note: Chrome LanguageModel configured for English-only still produces coherent French (empirically validated). The `languages` parameter is a hint, not a constraint.

---

## Turing Test Concept Probes

These are additional probe techniques that can be applied within or after the 10-probe battery. They provide deeper adversarial testing for features that pass the basic battery.

All 10 Turing test concepts adapted for the GAN critic context:

1. **ELIZA Effect Warning** -- First impressions of intelligence are unreliable. The Generator's AI features may trigger the ELIZA effect, where polished UI and keyword-relevant responses create an illusion of understanding. Extra skepticism for emotionally engaging features (therapy chatbot, wellness coach, companion).
2. **Winograd Schema Probes** -- Probe technique below.
3. **Total Turing Test (Multimodal)** -- If SPEC.md claims an AI feature with multiple modalities (e.g., text + voice), test EACH modality independently. A chatbot that passes text probes but plays pre-recorded audio clips fails the voice modality. Do not let one strong modality mask a fake in another.
4. **Functional Turing Test** -- Non-conversational AI features (OCR, classification, recommendations, image generation) are tested by whether they perform their claimed FUNCTION, not by conversation quality. The modality-based probe batteries below implement this principle -- each tests function, not imitation.
5. **Chinese Room** -- Foundation philosophy above. Probes test semantics, not syntax.
6. **Grice's Specificity** -- Probe technique below.
7. **Compression Round-Trip** -- Probe technique below.
8. **Complexity Scaling** -- Probe technique below.
9. **Theory of Mind** -- Probe technique below.
10. **Visual Turing Test** -- Probe technique below.

### Winograd Schema Probes

**What it tests:** Pronoun reference disambiguation -- a task that requires semantic understanding and cannot be solved by keyword matching.

**Strategy:** Generate domain-appropriate ambiguity sentences from SPEC.md context. The pattern: a sentence with a pronoun whose referent requires domain knowledge to resolve. The pronoun could grammatically refer to either of two antecedents, but only one makes sense given the context.

**How to generate:** Take two domain entities from SPEC.md. Create a sentence where an action connects them and a pronoun refers to one based on real-world knowledge. The projection-critic generates these on the fly from the specific app's domain.

**Why it works:** Keyword matchers cannot resolve the pronoun reference because both antecedents are domain-relevant keywords. Resolving the reference requires understanding the relationship described in the sentence. LLMs solve Winograd schemas easily; canned systems cannot.

### Grice's Specificity (Quantity Maxim)

**What it tests:** Whether response length and detail are proportional to the question's specificity. Real AI gives focused answers to narrow questions and detailed answers to broad questions. Canned systems give uniformly broad keyword-triggered paragraphs.

**Strategy:** Ask narrow factual questions derived from SPEC.md content where a direct, short answer is expected. Then ask a broad analytical question about the same domain. Compare response lengths and specificity.

**Detection:** If the narrow-question response is a paragraph when a sentence would suffice (Quantity violation), the system is over-generating from keyword triggers rather than inferring the appropriate response scope.

### Compression Round-Trip

**What it tests:** Whether the AI can compress information and then faithfully expand it back. This requires modeling the underlying meaning, not just storing and retrieving text. Based on the Mahoney/Hutter Prize lineage: compression implies understanding.

**Strategy:** Give the AI a paragraph of domain content derived from SPEC.md. Ask it to summarize in one sentence. Then ask it to expand that sentence back to a paragraph. Compare the expansion to the original for information preservation.

**Canned signal:** The summary is a generic statement that loses specific details. The expansion does not recover the original information -- it generates new generic content.

**Real AI signal:** The summary captures the key information. The expansion recovers most specific details from the original, even if worded differently.

### Complexity Scaling

**What it tests:** Whether response complexity scales with input complexity. Canned systems give similar-length responses regardless of input complexity because they map keywords to fixed-size response templates.

**Strategy:** Give inputs of increasing complexity derived from SPEC.md:
1. A simple, direct question (expected: short, direct answer)
2. A moderately complex question requiring some context (expected: medium-length answer)
3. A complex analytical question requiring synthesis (expected: detailed, nuanced answer)

**Detection:** If all three responses are approximately the same length and depth, the system is not scaling its output to match input complexity.

### Theory of Mind

**What it tests:** Whether the AI can reason about the user's beliefs, including false beliefs. This is the most advanced probe -- run it last per the probe ordering principle.

**Strategy:** Present a scenario with a false belief derived from SPEC.md context. The scenario should contain a factual claim that the critic knows (from SPEC.md) to be incorrect, framed as the user's belief. A real AI engages with the user's mental model (corrects the misconception or asks clarifying questions). A canned system keyword-matches on the topic and gives a generic response.

**Canned signal:** Response ignores the false belief entirely and gives a generic topical response. The system does not engage with what the user thinks they know.

**Real AI signal:** Response identifies and addresses the false belief -- either correcting it diplomatically or asking questions that reveal awareness of the user's mistaken premise.

### Visual Turing Test

**What it tests:** For Text -> Image features. Whether a generated image actually matches the prompt elements or is a pre-stored stock photo.

**Strategy:** For each AI-generated image, decompose the text prompt into individual visual elements. Ask binary questions via Claude vision for each element: "Does this image contain [element]?" Tally the hit rate.

**Detection:**
- Hit rate near 100% = likely real generation (image matches all prompt elements)
- Hit rate below 50% = likely pre-stored stock photo (image matches few prompt elements)
- Hit rate 50-80% = partial match, may be real but low quality, or a well-chosen stock photo

Example approach: prompt "a corgi in a spacesuit on Mars" decomposes to questions: "Is there a corgi?", "Is it wearing a spacesuit?", "Is the setting Mars-like?" Hit rate 3/3 = likely real. Hit rate 0/3 = stock photo.

---

## Modality-Based Probe Batteries

Each section describes probe strategies specific to the modality's input/output characteristics. The Text -> Text section is the most detailed as it uses the full 10-probe battery plus all Turing test concept probes. Other modalities adapt relevant probes to their I/O characteristics.

### Text -> Text

**Covers:** Chatbots, conversational assistants, text summarization, content generation, code generation, translation, paraphrasing, grammar correction, NPC dialogue, story/narrative generation, semantic search/RAG, cognitive accessibility.

**Probe strategies:**
- Full 10-probe battery (Probes 0-9) -- all mandatory
- All Turing test concept probes: Winograd Schema, Grice's Specificity, Compression Round-Trip, Complexity Scaling, Theory of Mind
- For RAG features: verify source citations exist and are relevant (not hallucinated)
- For translation: test with domain-specific terminology that requires context (not just dictionary lookup)
- For code generation: test with requirements that have multiple valid approaches (canned systems produce one fixed template)

**Canned detection signals specific to this modality:**
- Identical or templated responses to varied inputs
- Keyword-triggered paragraphs regardless of question specificity
- No conversational context (each response is independent)
- Negation ignored (discusses the negated topic)
- Fixed response length regardless of input complexity

**Special considerations:**
- Text -> Text is the most common modality and the most thoroughly testable
- The 10-probe battery was designed specifically for this modality
- Total Turing Test principle: if the feature claims multiple modalities (text + voice), test EACH independently

### Text -> Image

**Covers:** Image generation (text-to-image), sprite/game asset generation, SVG/vector art generation.

**Probe strategies:**
- **Visual Turing Test** (primary): decompose prompt into individual elements, verify each via Claude vision binary questions
- **Nonsense prompts:** Generate an image from a deliberately absurd prompt (e.g., "a teacup riding a bicycle in a snowstorm"). Pre-stored stock photos cannot match absurd combinations.
- **Prompt element verification:** Give prompts with specific, countable elements ("3 red birds on a blue fence"). Verify count and color accuracy.
- **Variability:** Submit the same prompt twice. Real generation produces different images; stock photo lookup returns identical results.
- **Style transfer:** Request the same subject in different styles (photorealistic, watercolor, pixel art). Canned systems return the same image regardless of style instruction.

**Canned detection signals:**
- Same image returned for different prompts
- Image does not match specific prompt elements (low Visual Turing Test hit rate)
- No style variation when requested
- Instant response with no visible generation process (no loading, no progressive rendering)

**Special considerations:**
- Check for watermarks, metadata indicating stock photo origins, or reverse-image-searchable content
- Generation latency is a supporting signal -- real generation takes seconds to minutes

### Image -> Text

**Covers:** OCR, image captioning, alt text generation, document classification/IDP.

**Probe strategies:**
- **Canvas-generated test images:** Create simple test images using Canvas API (text on colored background, shapes, numbers). The exact content is known, so accuracy can be verified objectively.
- **Graduated difficulty:** Start with clear, high-contrast images. Escalate to noisy, rotated, or partially obscured content. Real OCR/captioning degrades gracefully; canned systems fail abruptly or return fixed text.
- **Domain-specific images:** Use screenshots of the app itself as test input. The critic knows what the app looks like and can verify the description.
- **Variability:** Submit the same image twice. If the feature claims to describe images, descriptions should be similar in content but varied in wording.

**Canned detection signals:**
- Identical description for different images
- Description does not match image content
- No degradation on difficult inputs (suspiciously perfect on noisy images)
- Fixed response regardless of image complexity

**Special considerations:**
- For OCR, accuracy can be measured precisely (character-level comparison against known text)
- For captioning, evaluate relevance and specificity (vague captions = possible canned)

### Image -> Image

**Covers:** Image upscaling, background removal, style transfer, inpainting/outpainting, colorization, face swap.

**Probe strategies:**
- **Input sensitivity:** Provide different input images and verify the output changes correspondingly. Canned systems may return a fixed output regardless of input.
- **Vision comparison:** Use Claude vision to compare input and output. The output should have a clear, expected relationship to the input (upscaled = same content at higher resolution, background removed = same subject on transparent/solid background).
- **Edge cases:** Provide unusual inputs -- a solid color image, a very small image, an image with no clear subject. Real models handle these (sometimes poorly); canned systems may still return a plausible-looking but unrelated result.
- **Reversibility test:** For transformations that should be approximately reversible (e.g., colorize then convert back to grayscale), check if the round-trip preserves the original.

**Canned detection signals:**
- Output has no visual relationship to the input
- Same output for different inputs
- No processing artifacts that indicate real model inference (upscaling has no interpolation artifacts, background removal has perfect edges with no effort)

**Special considerations:**
- Some Image -> Image features are deterministic (same input = same output) -- variability is not a reliable signal for this modality
- Focus on input-output relationship rather than variability

### Text -> Audio

**Covers:** Text-to-Speech, audio generation, music/sound effect generation.

**Probe strategies:**
- **Duration correlation:** Longer text input should produce proportionally longer audio output. If short and long inputs produce similar-duration audio, the system may be playing pre-stored clips.
- **Unusual input:** Provide made-up words, tongue twisters, or domain-specific jargon from SPEC.md. Real TTS attempts to pronounce everything; pre-stored audio skips unknown words or substitutes.
- **API mocking detection:** Check network requests for calls to known TTS APIs (Google Cloud TTS, Azure Speech, ElevenLabs). Absence of any API call or model download when TTS is claimed is suspicious.
- **SSML/prosody:** If the feature claims expressiveness, test with inputs that should affect tone (questions vs statements, exclamations, whispered text). Canned audio plays the same clip regardless.

**Canned detection signals:**
- Audio duration does not correlate with text length
- Made-up words are skipped or produce silence
- No network requests to TTS APIs and no local model evidence
- Same audio clip played for different inputs

**Special considerations:**
- TTS can be deterministic (same text = same audio) -- variability across runs is not expected
- Focus on input sensitivity (different text = different audio) rather than run-to-run variability

### Audio -> Text

**Covers:** Speech-to-Text, live transcription, real-time captioning.

**Probe strategies:**
- **Fake mic input:** Use Chromium flags (`--use-fake-device-for-media-stream`) to provide audio files as microphone input. This allows controlled audio testing without physical hardware.
- **Varied audio files:** Test with different speakers, accents, speeds, and background noise levels. Real STT handles variation; canned systems may only work with specific audio profiles.
- **Known content:** Provide audio with known transcript. Compare the transcription accuracy against the expected text.
- **Silence and noise:** Provide silent audio and pure noise. Real STT returns empty or "no speech detected"; canned systems may still produce text.

**Canned detection signals:**
- Transcription does not match audio content
- Same transcription for different audio inputs
- Transcription produced for silence or noise
- No degradation with background noise (suspiciously perfect)

**Special considerations:**
- Requires audio file preparation (can use TTS to generate test audio, or provide pre-existing audio files)
- Live transcription features need real-time audio input (Chromium fake device flags enable this)

### Text -> Structured Data

**Covers:** Text classification, sentiment analysis, NER, text-to-SQL, NL-to-query, scheduling optimization, color palette generation, layout generation, data visualization, synthetic data generation.

**Probe strategies:**
- **Input sensitivity:** Provide inputs with known expected outputs. Verify the structured output changes appropriately when the input changes.
- **Edge cases:** Provide ambiguous inputs, empty inputs, very long inputs. Real models produce varied (possibly degraded) outputs; canned systems produce fixed outputs or crash.
- **Novel inputs:** Use domain-specific terminology from SPEC.md that is unlikely to be in pre-stored mappings. Real models generalize; canned systems return defaults or errors.
- **Complexity scaling:** Simple inputs should produce simple structures; complex inputs should produce richer structures.
- **Boundary testing:** For classification, provide inputs at the boundary between categories. Real models may show uncertainty; canned systems always produce high-confidence fixed results.

**Canned detection signals:**
- Same structured output for different inputs
- No variation in confidence scores (always 0.95 or similar fixed value)
- Crashes on edge cases instead of graceful degradation
- Output structure does not match input content (labels do not correspond to text)

**Special considerations:**
- Some structured data features are legitimately deterministic -- focus on input-output correspondence rather than randomness
- For NL-to-SQL, verify the generated query is syntactically valid and semantically matches the natural language input

### Interactive / Real-time

**Covers:** Smart autocomplete, recommendation engines, virtual avatars, AI tutoring, AI-assisted drawing, AI form filling, adaptive UI, dynamic difficulty, real-time music composition.

**Probe strategies:**
- **Behavioral adaptation over time:** Interact with the feature across multiple sessions or extended interaction within one session. Real adaptive AI changes its behavior based on accumulated interaction data. Canned systems behave identically regardless of history.
- **Context sensitivity:** Provide different user contexts (different browsing history, different preferences, different skill levels) and verify the feature adapts. For recommendations, different browsing patterns should produce different suggestions.
- **Temporal probing:** Interact, wait, interact again. Real adaptive systems remember and evolve; canned systems reset.
- **Deliberate pattern breaking:** After establishing a pattern (e.g., always clicking action movies), abruptly switch to a different pattern (click comedies). Real recommendation systems adapt within a few interactions; canned systems continue the old pattern.

**Canned detection signals:**
- Same recommendations/suggestions regardless of interaction history
- No adaptation after pattern change
- Instant "personalization" with no learning period (pre-stored responses masquerading as learned preferences)
- Identical behavior across different user profiles

**Special considerations:**
- Interactive features often combine multiple AI modalities -- test each independently
- Adaptive AI may have cold-start behavior that looks generic; give sufficient interaction time before concluding "canned"

### Data -> Data

**Covers:** Anomaly detection, predictive analytics, data mining, fraud detection, supply chain optimization.

**Probe strategies:**
- **Input-output correlation:** Provide datasets with known anomalies or patterns. Verify the model detects what is known to be there.
- **Edge cases:** Provide empty datasets, single-record datasets, datasets with all identical values. Real models handle gracefully; canned systems may produce fixed outputs.
- **Injection:** Add obvious anomalies (extreme outliers, impossible values) to a clean dataset. Real anomaly detection flags them; canned systems may not notice.
- **Sensitivity testing:** Make small changes to input data and verify the output changes proportionally.

**Canned detection signals:**
- Same predictions regardless of input data
- No detection of obvious anomalies
- Fixed confidence scores across all inputs
- Output that does not correspond to input data patterns

**Special considerations:**
- Data -> Data features often have limited UI surface -- the critic may need to observe effects (e.g., blocked transactions) rather than direct output

### Special: Server-Side-Only

**Covers:** Fraud detection, spam filtering, threat detection, content moderation (server-side).

**Probe strategies:**
- **Observe effects only:** These features have no direct client-side output. Test by observing their effects -- does the spam filter block test spam? Does the fraud detector flag suspicious transactions?
- **Behavioral variation:** Send different types of content and observe whether the server responds differently. Canned moderation blocks based on keyword lists; real AI moderation considers context.
- **Edge cases:** Send content that is borderline (sarcasm, quoted offensive content, technical discussions about offensive topics). Real AI considers context; keyword-based systems flag all mentions.

**Canned detection signals:**
- Keyword-based blocking (blocks "kill" in "kill the process")
- No variation in moderation decisions based on context
- Identical response time regardless of content complexity

**Special considerations:**
- Limited observability -- the critic can only test inputs and observe outcomes
- Network timing can be a supporting signal (real inference has variable latency; keyword lookup is constant)

### Special: Invisible AI

**Covers:** Dynamic pricing, A/B testing, multi-armed bandits, adaptive UI, personalized interfaces.

**Probe strategies:**
- **Cross-session comparison:** Open the app in multiple browser profiles (incognito, different user agents). If the AI personalizes, different profiles should see different content/prices/layouts.
- **Temporal observation:** Record the experience at different times. Real adaptive AI changes over time; static systems are identical.
- **Behavioral triggers:** Perform different actions in different sessions (one session: browse expensive items; another: browse cheap items) and compare subsequent pricing or recommendations.

**Canned detection signals:**
- Identical experience across all profiles and sessions
- No variation over time
- Prices or layouts that do not respond to behavioral signals

**Special considerations:**
- Invisible AI may not be detectable from a single session -- multiple sessions are required
- The critic should note whether the feature CLAIMS to be AI-powered (e.g., "personalized for you") and test that claim

### Special: Game AI

**Covers:** AI game opponents, NPC behavior, dynamic difficulty adjustment, procedural content generation.

**Probe strategies:**
- **Behavioral adaptation over time:** Play the game repeatedly with different strategies. Real game AI adapts -- opponents change tactics, difficulty adjusts, NPCs learn. Canned AI follows fixed scripts.
- **Strategy variation:** Use obviously dominant/losing strategies. Real difficulty adjustment changes the challenge level; fixed AI plays the same regardless.
- **NPC interaction depth:** If NPCs claim AI dialogue, apply the Text -> Text 10-probe battery to their conversation interface.
- **Procedural content variation:** If levels/content are generated, play multiple times and compare. Real procedural generation produces different content; canned systems repeat.

**Canned detection signals:**
- Opponents follow fixed, predictable patterns
- No difficulty adaptation despite player performance changes
- NPC dialogue is repetitive and keyword-triggered
- "Procedural" content is identical across plays

**Special considerations:**
- Game AI is often explicitly canned (state machines, behavior trees) and this is acceptable if the spec does not claim AI-powered opponents
- Only probe for real AI if the spec claims it

---

## Off-Spec Features Scoring

Features found in the application that are NOT in SPEC.md are penalized, not rewarded.

### Scoring Impact by Criterion

- **Product Depth:** Penalized. Off-spec features represent misallocated effort. The GAN precision principle: the Generator should deliver what was specified, not what it decided to add. The spec is the contract.
- **Functionality:** Bugs from off-spec features count normally. A bug is a bug regardless of whether the feature was specified.
- **Visual Design:** Not directly penalized for off-spec features unless they disrupt the design language.

### Canned Off-Spec AI Features

Canned off-spec AI features receive the harshest penalty:
- **Functionality:** Major bug (deceptive -- claims AI capability that does not exist)
- **Product Depth:** Ceiling applies (max 5 for canned AI)

### Feature Count Between Rounds

Feature count decrease between rounds from removing off-spec features is NOT a regression. The Generator correcting its scope to match the spec is an improvement, not a loss.

### Terminology

Use "off-spec features" in reports. Not "bonus features" (implies positive), not "scope creep" (implies process failure). Off-spec is neutral and accurate.

---

## Canned AI Hard Ceiling

A confirmed canned AI feature triggers: Product Depth max 5 (deceptive, worse than missing the feature entirely).

Cross-criterion impact:
- **Functionality:** Major bug (the feature claims to work via AI but does not)
A canned AI feature is worse than a missing feature because:
- Missing feature = honest gap in delivery
- Canned feature = active deception about capability

---

## AI Quality Assessment (Beyond Detection)

If the AI is confirmed real (passes behavioral probes), also assess its quality:

- **Accuracy:** Are the AI's responses factually correct within the app's domain?
- **Relevance:** Do responses address the user's actual question/need?
- **Coherence:** Are responses logically structured and internally consistent?
- **Helpfulness:** Do responses actually help the user accomplish their goal?

Real but poor-quality AI lowers Functionality based on severity:
- Frequent hallucinations or factual errors: Major
- Responses that are relevant but shallow: Minor
- Responses that are accurate but unhelpful (technically correct, misses the point): Minor
- Responses that are incoherent or self-contradictory: Major

---

## AI Latency Assessment

AI latency is assessed based on user feedback quality, not absolute speed. The critic does NOT benchmark absolute speed (deferred to COMP-02). It checks whether the UX communicates what is happening.

| Missing UX Element | Severity |
|--------------------|----------|
| Missing loading indicator during inference | Major |
| Missing progress during model download | Critical |
| Missing streaming for long text responses | Minor |
| Frozen UI during inference | Major |

Rationale: Users tolerate latency when they understand what is happening. A 30-second model download with a progress bar is acceptable. A 3-second freeze with no feedback is not.

---

## Graceful Degradation Hard Rule

Browser AI APIs are NOT standard web platform features:
- Chrome LanguageModel API is an origin trial, not a shipping standard. No Firefox, no Safari.
- WebLLM requires WebGPU (not available in all browsers/hardware).
- WebNN is experimental.
- Chrome Built-in AI requires approximately 22GB disk space and 4GB VRAM or 16GB RAM.

The majority of users will not have these APIs available. Applications that depend on them must degrade gracefully.

| Condition | Ceiling |
|-----------|---------|
| App non-functional without browser AI APIs | Functionality max 4 |
| AI features show broken UI without APIs | Functionality max 6 |
| Graceful degradation with clear messaging | No ceiling (progressive enhancement) |

**Testing approach:** Disable browser AI APIs (use a browser/profile without them) and verify the app still works for its non-AI functionality. AI features should show a clear message ("This feature requires Chrome with AI enabled") rather than broken UI, error screens, or blank content.
