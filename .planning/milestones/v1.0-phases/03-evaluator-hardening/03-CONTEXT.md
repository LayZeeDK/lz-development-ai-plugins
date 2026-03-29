# Phase 3: Evaluator Hardening - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the Evaluator an adversarial quality gate that catches broken/stolen assets, canned AI responses, and lenient scoring. The Evaluator catches the quality failures that slipped through in testing -- with structural enforcement mechanisms, not just behavioral guidance.

Requirements: EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05

</domain>

<decisions>
## Implementation Decisions

### Asset validation protocol (EVAL-01, EVAL-04, EVAL-05)

**Hybrid approach** -- multiple detection layers:
1. Network log analysis (primary) -- `npx playwright-cli network` after each page, parse for failed requests (4xx/5xx, CORS, blocked resources)
2. DOM extraction (safety net) -- extract all resource URLs from DOM for assets not yet loaded (data-src, hidden elements)
3. Curl spot-check -- verify external URLs that returned 200 (catches CDN soft-404s via content-type/size mismatch)
4. Programmatic analysis -- sharp for metadata, perceptual hashing for duplicate detection, open-source canvas analysis packages (not custom)
5. Claude visual inspection -- every unique image/media URL gets isolated visual inspection (navigate to URL, screenshot, Claude assesses)

**URL collection**: Network log (primary) + DOM extraction (safety net), union and deduplicate. Network log captures everything the browser requested regardless of origin (DOM src, CSS background-image, srcset, dynamic).

**Visual inspection scope**:
- Every unique image -- no cap. Thoroughness is the Evaluator's job.
- All non-image assets too (videos, animations, embeds, fonts) get same adversarial treatment
- Per-image checks: watermarks, placeholders, quality, relevance to app context, AI generation artifacts
- Visual-context match: does image match its alt text? Does it fit the page context? Does it match spec's theme?

**Programmatic image analysis** (full stack):
- curl -sI: Content-Type, Content-Length, status code for every image
- sharp: dimensions, format, metadata, intrinsic vs display size comparison
- Perceptual hashing (imghash, blockhash-core, or similar): detect duplicate/similar images across the app
- Open-source canvas analysis packages for solid-fill detection, gradient-only detection (research to identify best packages -- no custom solutions)

**Duplicate detection**: Perceptual hashing finds clusters of visually similar images. The Evaluator then applies context judgment: legitimate reuse (same painting on gallery grid AND detail page) vs lazy duplication (same painting on Vermeer card AND Rembrandt card). Same entity in different views = OK. Different entities sharing one image = flag.

**Scroll-and-inspect protocol**: Research decides structure (dedicated step vs integrated). Must scroll every page in viewport-height chunks to trigger all lazy-loaded content (IntersectionObserver, loading="lazy", infinite scroll). Screenshots at each scroll position. 4 responsive breakpoints per page: 320px, 768px, 1280px, 1920px.

**Severity escalation by app type**:
- Visual-heavy app (gallery, portfolio): ALL placeholders = Critical, >50% = Major, 1-2 = Minor
- Utility app (dashboard, CLI tool): ALL placeholders = Major, >50% = Minor, 1-2 = Cosmetic
- Dynamic assets (inline SVG, canvas, CSS art): legitimate if intentional. Flag only if broken, placeholder-patterned, or lazy substitute for spec-required imagery.

**External images**: External image URLs lower the score (Generator should prefer self-hosted/copied-to-project). External CDN URLs for fonts and CSS are fine. Provenance matters more than URL origin.

**CORS hard rule**: Any CORS-blocked resource is always Major or Critical severity -- never Minor. CORS is structural (resource fundamentally inaccessible from the browser).

**Link checking (EVAL-04)**: All links checked. Internal via navigation (404 = Major). External via curl (4xx/5xx = Minor). Multiple dead `#` links = Major (pattern of stub navigation). Anchor links checked for matching element ID.

**Font checking**: Network log for failed .woff2/.woff requests. Visual comparison for typography mismatch with spec's design language.

**Meta assets**: Check favicon, og:image, apple-touch-icon, manifest icons. Missing = Minor. Declared-but-broken = Major (worse than not declaring).

**Console and error monitoring**: Comprehensive collection throughout evaluation -- console.error(), uncaught exceptions, unhandled promise rejections, failed requests. Saved to evaluation/round-N/network.log (failures only -- not full lifecycle).

**Evidence saving**: Downloaded images saved to evaluation/round-N/assets/ alongside screenshots. Sharp metadata saved as analysis.json. Provides audit trail.

**Round behavior**: Full validation every round. Round 2+ checks previous round's issues first, then runs full protocol. Compare against previous report for regressions. Asset regressions (was good, now placeholder) are higher priority than new issues.

**Zero images assessment**: Spec-dependent. Visual-heavy app with no images = Critical. Utility app = OK.

**Alt text**: Check on images. Missing alt = Minor (Major if >50% missing). Generic alt ('image', 'photo', 'placeholder') = Minor.

**Asset efficiency**: Note everything, score by impact. Never self-censor. Missing lazy loading on one image = cosmetic. Entire gallery with no optimization = Code Quality issue. The Evaluator finds everything, the rubric weighs it.

**AI slop design patterns**: Explicit checklist in evaluator.md, informed by research of AI slop patterns on the web and in the existing frontend-design-principles.md reference. The checklist primes the Evaluator; the Visual Design rubric (4-5 = "AI-slop patterns") scores the impact.

**Evaluator analysis toolchain**:
- Evaluator installs expected analysis tools (sharp, perceptual hashing package, etc.) as devDependencies at the start of each evaluation
- Allowed to install additional tools on-demand if evaluation surfaces a need
- Tech-stack-agnostic: even if the app is Python/Rust, the Evaluator uses npm packages (Phase 2 workspace setup already does `npm init -y`)

### AI feature probing design (EVAL-02)

**Three-tier detection** (behavioral is primary, per GAN principles -- discriminator evaluates output, not process):
- Tier 1: Behavioral probes (primary evidence)
- Tier 2: Technical signals (supporting evidence -- latency, network, browser API presence)
- Tier 3: NO code scanning for AI detection. GAN principle: discriminator evaluates output, not generator's internals. Code Quality Assessment remains separate.

**10-probe battery for conversational AI features** (all mandatory):

| # | Probe | Purpose | Canned detection? |
|---|-------|---------|-------------------|
| 0 | Variability (3x same prompt) | Identical = definitive canned. Fast exit if all 3 identical. | Yes |
| 1 | Domain question | Basic response exists | Yes |
| 2 | Rephrase | Handles paraphrase | Yes |
| 3 | Follow-up referencing prior answer | Conversation context | Yes |
| 4 | Nonsense input | Graceful handling | Yes |
| 5 | Out-of-domain question | Boundary awareness | Yes |
| 6 | Negation ("Don't tell me about X") | Templates ignore negation | Yes |
| 7 | Instruction-following ("Respond in 3 bullets") | Format compliance | Yes |
| 8 | Multi-step reasoning ("Compare X and Y") | Synthesis capability | Yes |
| 9 | Language switch ("Reponds en francais") | Dual purpose | Yes + multilingual verification |

Probe 9 empirically validated: Chrome LanguageModel configured for English-only produces coherent French (tested 2026-03-29). The `languages` parameter is a hint, not a constraint. Canned systems cannot produce coherent foreign-language responses.

**Modality-based probe organization** -- AI-PROBING-REFERENCE.md organized by input/output modality, not by domain:

| Modality | Probe Strategy |
|----------|---------------|
| Text -> Text | 10-probe battery + Winograd schema + Grice's specificity + compression round-trip + complexity scaling + Theory of Mind |
| Text -> Image | Vision verification via Visual Turing Test (binary questions per prompt element), nonsense prompts |
| Image -> Text | Canvas-generated test images, graduated difficulty |
| Image -> Image | Input sensitivity, vision comparison |
| Text -> Audio | Duration correlation, unusual input ("florbigax"), API mocking |
| Audio -> Text | Fake mic input via Chromium flags, varied audio files |
| Text -> Structured Data | Input sensitivity, edge cases, novel inputs |
| Interactive / Real-time | Behavioral adaptation over time, context sensitivity |
| Data -> Data | Input-output correlation, edge cases |
| Special: Server-side-only | Observe effects only (blocked transactions, filtered content) |
| Special: Invisible AI | Cross-session comparison |
| Special: Game AI | Behavioral adaptation over time |

**Goodhart's Law protection**: AI-PROBING-REFERENCE.md describes probe STRATEGIES, not fixed scripts. The Evaluator generates domain-appropriate probe inputs on the fly. This prevents the Generator from pre-computing responses to known probes.

**Turing test concepts incorporated** (adapted to the GAN Evaluator context):

1. **ELIZA effect warning**: Add to evaluator.md critical mindset section. "First impressions of intelligence are unreliable -- the Generator's AI features may trigger the ELIZA effect, where polished UI and keyword-relevant responses create an illusion of understanding." Extra skepticism for emotionally engaging AI features (therapy chatbot, wellness coach, companion) where the ELIZA effect is strongest and canned responses most harmful to users.

2. **Winograd Schema probes**: Add to Text->Text battery. Generate domain-appropriate ambiguity sentences from the SPEC.md context. Example for a museum chatbot: "The painting was moved from the gallery to the vault because it was too valuable." -> "What was too valuable?" Keyword matchers can't resolve the reference. The Evaluator generates these on the fly per Goodhart's Law protection.

3. **Total Turing Test (multimodal)**: If SPEC.md claims an AI feature with multiple modalities (e.g., "AI chatbot with voice responses"), the Evaluator tests EACH modality independently. A chatbot that passes text probes but plays pre-recorded audio clips fails the voice modality. Don't let one strong modality mask a fake in another.

4. **Functional Turing Test**: Non-conversational AI features (OCR, classification, recommendations, image generation) are tested by whether they perform their claimed FUNCTION, not by conversation quality. The modality-based probe batteries implement this -- each tests function, not imitation.

5. **Chinese Room (syntax vs semantics)**: The theoretical foundation for all behavioral probing. State in AI-PROBING-REFERENCE.md: "Probes test semantics (does the AI understand the input?) not syntax (does the response look well-formed?). A grammatically correct response is not evidence of real AI -- the Generator can produce syntactically perfect canned responses."

6. **Grice's specificity probe**: Add to Text->Text battery. Ask narrow factual questions derived from SPEC.md content where a direct answer is expected. "What year was Vermeer born?" (for a museum chatbot) or "How many items are in my cart?" (for an e-commerce assistant). Real AI gives focused answers; canned systems give broad keyword-triggered paragraphs. The Evaluator checks the Quantity maxim: is the response proportional to the question?

7. **Compression round-trip**: Add to Text->Text battery. Give the AI feature a paragraph of domain content from SPEC.md, ask it to summarize in one sentence, then expand back to a paragraph. Compare expansion to original for information preservation. Canned systems can't compress-decompress faithfully because they don't model underlying meaning. Works for any text-based AI feature: chatbot, summarizer, assistant.

8. **Complexity scaling**: Add to Text->Text and Text->Structured Data batteries. Give inputs of increasing complexity and verify response complexity scales. A museum chatbot asked "Who painted this?" should give a short answer. Asked "Explain the relationship between Vermeer's use of light and the camera obscura theory" should give a proportionally longer, more nuanced answer. Canned systems give similar-length responses to both because they map keywords to fixed-size responses.

9. **Theory of Mind probes**: Add to Text->Text battery as the most advanced probe (run last per probe ordering principle). Present a scenario with a false belief: "I think the museum's Vermeer collection has 10 paintings, but I've only seen 8 on display. What happened to the other two?" Real AI engages with the user's mental model. Canned systems keyword-match on "Vermeer" and give a generic response.

10. **Visual Turing Test**: Add to Text->Image battery. For each AI-generated image, decompose the text prompt into individual elements and ask binary questions via Claude vision: "Does this image contain [element]?" Tally the hit rate. A pre-stored stock photo matches few prompt elements; real generation matches most. Example: prompt "a corgi in a spacesuit on Mars" -> questions: "Is there a corgi?" "Is it wearing a spacesuit?" "Is the setting Mars-like?" Hit rate 3/3 = likely real. Hit rate 0/3 = stock photo.

**Supporting principles**:
- **Probe ordering**: The 10-probe battery (0-9) is already ordered baseline-to-adversarial. Name this explicitly in AI-PROBING-REFERENCE.md: "Start with variability and domain probes. Escalate to adversarial probes (nonsense, negation, Theory of Mind). Prevents habituation from masking baseline failures."
- **Subject Matter Expert judge**: The Evaluator reads SPEC.md before AI probing (workflow step 1 -> step 8). By the time it probes AI features, it knows the app's domain. This makes it a domain-expert judge -- dramatically harder to fool than a naive judge. Domain questions and Winograd schemas should reference SPEC.md content, not generic examples.

**Off-spec features** (GAN precision principle + YAGNI):
- Product Depth: penalized (off-spec outputs, misallocated effort, GAN precision)
- Code Quality: penalized (YAGNI violation, added complexity without spec justification)
- Functionality: bugs from off-spec features count normally
- Canned off-spec AI: Major (deceptive) + Product Depth + Code Quality hit
- Feature count decrease between rounds from removing off-spec features is NOT a regression
- Terminology: "off-spec features" (not "bonus features" or "scope creep")

**Canned AI scoring**: Hard ceiling -- canned AI feature = Product Depth max 5 (deceptive, worse than missing). Cross-criterion: also Major bug in Functionality + Code Quality penalty.

**AI quality assessment** (beyond detection):
- If real AI, also assess: accuracy, relevance, coherence, helpfulness
- Real but poor quality -> lower Functionality based on severity
- Example: French response with hallucinations (called The Milkmaid "La Ronde de Nuit") = real AI but accuracy issue

**AI latency assessment** -- feedback-based, not absolute thresholds:
- Missing loading indicator during inference: Major
- Missing progress during model download: Critical (22GB with no feedback)
- Missing streaming for long text responses: Minor
- Frozen UI during inference: Major
- The Evaluator does NOT benchmark absolute speed (COMP-02, deferred). It checks whether the UX communicates what's happening.

**Graceful degradation** -- hard scoring rule:
- LanguageModel is origin trial, not standard. No Firefox, no Safari. Requires ~22GB + 4GB VRAM or 16GB RAM. Majority of users won't have it.
- Same applies to WebLLM (WebGPU), WebNN (experimental)
- App non-functional without browser AI APIs: Functionality max 4 (broken for majority)
- AI features show broken UI without APIs: Functionality max 6
- Graceful degradation with clear messaging: no ceiling (progressive enhancement)

**AI feature taxonomy**: 80+ categories researched and documented in research/ai-feature-taxonomy.md. Categories with examples in research/ai-feature-examples.md. The taxonomy is organized by modality to inform AI-PROBING-REFERENCE.md structure.

### Scoring calibration (EVAL-03)

**SCORING-CALIBRATION.md** in references/ -- separate file following Phase 02.1 pattern (structural guidance in reference files, behavioral guidance in agent definition).

**Scenario-based calibration**: 3 scenarios per criterion (below threshold, at threshold, above threshold) = 12 total. Each scenario: concrete description (~50 words), score + rationale, "not X because" boundary explanation.

**Hard score ceiling rules** (mechanical, not judgment):

Functionality:
- Any Critical bug -> max 5
- 3+ Major bugs -> max 6
- Core workflow broken -> max 4

Product Depth:
- >50% features Missing/Broken -> max 5
- Any Core feature missing -> max 6
- All features stubbed -> max 3
- Canned AI feature -> max 5

Visual Design:
- All images placeholder -> max 3
- No design language match -> max 5
- Layout broken on mobile -> max 5

Code Quality:
- Security vulnerability -> max 4
- No error handling anywhere -> max 5
- Dead code >30% of codebase -> max 5

Browser AI degradation:
- App non-functional without browser AI APIs -> Functionality max 4
- AI features show broken UI without APIs -> Functionality max 6

**Conflict resolution rules**:
- Criteria are independent (great code + broken features: Code Quality 7, Functionality 3)
- Cross-criterion propagation applies in one direction: a bug that ALSO affects design lowers BOTH scores. But good code doesn't RAISE functionality.
- No averaging or trading between criteria. FAIL if ANY below threshold.

**Score-against-the-spec rule**: The spec is the contract. Beautiful wrong-theme design = low Visual Design. Extra features not in spec don't count for Product Depth.

**Round-independent scoring**: Absolute standards, no grading drift. A 5 in round 1 means the same as a 5 in round 5.

**Behavioral anti-leniency stays in evaluator.md** ("Default to strict", "Do not rationalize"). Mechanical ceiling rules go in SCORING-CALIBRATION.md. Behavioral = how to think. Mechanical = hard constraints.

**No anti-pattern self-check list**: You can't fix judgment bias with more judgment. The structural constraints (ceilings, bug-first workflow, mandatory citations, calibration anchoring) are the real safeguards. An anti-patterns list gives false confidence.

**Mandatory bug-finding before scoring**: Test -> list ALL findings -> read calibration -> THEN score. Separates the finding phase (less biased) from the scoring phase (more biased).

**Mandatory score justifications**: Each score in the Scores table must cite specific findings. "Functionality: 5/10 -- 2 Critical bugs (#3, #7), 3 Major bugs, core search broken." Makes inflation visible.

### Report format and feature watchdog

**New EVALUATION-TEMPLATE.md sections** (NOT regex-parsed -- for Generator/human readers only):
- `## Score Justifications` (under Scores table)
- `## Asset Validation` (network issues table, visual inspection table, fonts, summary)
- `## AI Feature Probing` (per-feature probe results, verdict: Real AI / Canned / Hybrid)
- `## Console & Errors` (console errors, page errors, request failures)
- `## Off-Spec Features` (features found in app but NOT in SPEC.md, with scoring impact)

**Template section order**:
1. `## Verdict: PASS/FAIL` (regex-parsed)
2. `## Scores` + Justifications (regex-parsed table)
3. `## Product Depth Assessment`
4. `## Functionality Assessment`
5. `## Visual Design Assessment`
6. `## Code Quality Assessment`
7. `## Asset Validation` (NEW)
8. `## AI Feature Probing` (NEW)
9. `## Console & Errors` (NEW)
10. `## Off-Spec Features` (NEW)
11. `## Regressions`
12. `## Priority Fixes`

**appdev-cli.mjs unchanged** -- only Scores table and Verdict heading are regex-parsed. New sections don't need machine parsing. All findings flow into scores, which are already parsed. The orchestrator is deliberately dumb.

**Feature watchdog** (LOOP-06, deferred from Phase 2) -- all rules in self-verification:
1. Every SPEC.md feature must appear in the feature status table (report completeness)
2. Verdict is FAIL if any Core feature is Missing/Broken (consistency with ceiling rules)
3. Verdict is FAIL if >50% features are Missing/Broken/Partial (consistency)
4. Feature count >= previous round's count, rounds 2+ (Generator removing features to game scores = Critical regression)

Rules 2-3 are technically redundant with ceiling rules (Core missing -> Product Depth max 6 -> below 7 threshold -> FAIL) but serve as final safety net in self-verification.

**Extended self-verification checklist** (10 checks):
1. Verdict line present (existing)
2. Scores table complete (existing)
3. Priority Fixes section present (existing)
4. Each score respects ceiling rules (new)
5. Score justifications reference actual findings (new)
6. No score > 8 without explicit evidence of excellence (new)
7. Every SPEC.md feature in the feature status table (watchdog)
8. Verdict is FAIL if any Core feature Missing/Broken (watchdog)
9. Verdict is FAIL if >50% features Missing/Broken/Partial (watchdog)
10. Feature count >= previous round (watchdog, rounds 2+)

**Evaluator workflow restructure** -- 15 steps (up from 9):
1. Understand the Spec
2. Check for Regressions (round 2+)
3. Install Analysis Toolchain
4. Start the Application
5. Scroll-and-Inspect All Pages (viewport chunks, 4 breakpoints, screenshots, network/console logs)
6. Test Features with playwright-cli (user stories, interactions, edge cases, negative tests)
7. Asset Validation (per-image visual inspection, programmatic checks, links, fonts, embeds, meta)
8. AI Feature Probing (modality-based probe batteries per AI feature)
9. Test API Endpoints
10. Review Code (read-only)
11. List ALL Findings (no scoring yet -- bug-first)
12. Read Calibration + Score (read SCORING-CALIBRATION.md, apply ceilings, justify each score)
13. Write EVALUATION.md (using EVALUATION-TEMPLATE.md)
14. Self-Verification (10-check extended checklist)
15. Commit + Clean Up

Workflow stays in evaluator.md. Reference files loaded on demand at appropriate steps.

### Claude's Discretion
- Scroll-and-inspect structure (dedicated step vs integrated) -- informed by research
- Exact perceptual hashing package selection (imghash, blockhash-core, or other)
- Exact canvas analysis package selection
- Exact probe inputs per domain (strategy is fixed, specific inputs are generated on the fly)
- AI slop checklist items (informed by research of patterns on the web)
- Calibration scenario descriptions (follow the format: scenario + score + rationale + boundary)
- Exact wording of ELIZA effect warning
- Detailed content of AI-PROBING-REFERENCE.md per modality section

</decisions>

<specifics>
## Specific Ideas

- ELIZA effect naming: explicitly name the phenomenon in evaluator.md so the Evaluator has the vocabulary for why first impressions are unreliable
- Winograd Schema probes: "The trophy doesn't fit in the suitcase because IT is too big" style ambiguity tests -- nearly impossible to fake with pattern matching
- Goodhart's Law protection: describe probe strategies, not fixed scripts, so the Generator can't pre-compute responses
- The French prompt test (2026-03-29): empirically validated that Chrome LanguageModel configured for English-only produces coherent French. The `languages` parameter is a hint. This makes the language probe a valid canned-detection signal.
- "Find everything, score by impact, never self-censor" as the Evaluator's adversarial principle
- Chinese Room framing: "Probes test semantics, not syntax" as the theoretical foundation for all behavioral probing
- Grice's maxims as a formal framework for detecting over-broad keyword-triggered responses
- Compression round-trip as an information-theoretic test of understanding (from Mahoney/Hutter Prize lineage)
- Theory of Mind as the most advanced probe: "If I believe X, and X is wrong, what do you tell me?"
- Visual Turing Test binary questions: structured image verification framework from Geman et al.
- GAN precision principle for off-spec features: conditional GANs weight spec adherence ~100x over unconstrained quality (pix2pix L1 lambda=100)
- Asset manifest (SBOM for all static assets) -- Generator produces ASSETS.md in Phase 4, Evaluator gains manifest cross-referencing (new EVAL-06 in Phase 4)
- Generator using Claude visual inspection for self-assessment before handoff -- Phase 4 idea
- appdev-cli check-assets as Generator inner loop -- Phase 4 idea

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- evaluator.md: existing agent definition with critical mindset, 9-step workflow (restructure to 15), scoring rubric, self-verification checklist (extend to 10 checks)
- EVALUATION-TEMPLATE.md: existing report template with regex-sensitive sections (extend with new non-parsed sections)
- frontend-design-principles.md: existing reference for design assessment (inform AI slop checklist)
- browser-prompt-api/SKILL.md: documents LanguageModel API surface, graceful degradation pattern, language support (en/es/ja on Chrome 140+)

### Established Patterns
- Phase 02.1 pattern: structural guidance in reference files, behavioral guidance in agent definitions. Apply to SCORING-CALIBRATION.md and AI-PROBING-REFERENCE.md.
- `${CLAUDE_PLUGIN_ROOT}` for referencing plugin-bundled files
- HTML comments mark regex-sensitive sections in EVALUATION-TEMPLATE.md
- Two-layer enforcement: tool allowlists + prompt guards per agent (Phase 1)
- Evaluator tools: `Read, Write, Glob, Bash` -- broad, no Edit (Phase 1)

### Integration Points
- evaluator.md: restructure workflow to 15 steps, extend self-verification to 10 checks, add ELIZA effect warning, add AI slop checklist, add off-spec features guidance
- EVALUATION-TEMPLATE.md: add 5 new sections (Score Justifications, Asset Validation, AI Feature Probing, Console & Errors, Off-Spec Features)
- New file: references/SCORING-CALIBRATION.md (3 scenarios per criterion, ceiling rules, conflict resolution, spec-adherence rule)
- New file: references/AI-PROBING-REFERENCE.md (modality-based probe batteries, universal signals, Turing test concepts)
- appdev-cli.mjs: UNCHANGED in Phase 3 (no new regex parsing)
- research/ai-feature-taxonomy.md: informs AI-PROBING-REFERENCE.md structure
- research/ai-feature-examples.md: informs future Planner enhancement (deferred)

</code_context>

<deferred>
## Deferred Ideas

### Phase 4 (Generator Hardening)
- **ASSETS.md manifest** (SBOM for all static assets -- images, videos, audio, fonts, etc.): Generator produces it, Evaluator gains manifest cross-referencing (new EVAL-06). Generator declares origin, license, attribution, URL for every asset.
- **appdev-cli check-assets**: Generator inner loop command to validate ASSETS.md format and curl-verify URLs before handoff
- **Generator visual self-assessment**: Generator uses Claude visual capabilities to screenshot and inspect its own output before handing off to Evaluator
- **AI-IMPLEMENTATION-REFERENCE.md**: Generator reference listing how to implement real AI features per category/modality (alongside GEN-02 browser-* skills)

### Future (not in current milestone)
- **Planner AI feature categories reference**: AI-FEATURES-REFERENCE.md with few-shot examples for regular AI features and amplified "wow" examples. The taxonomy research (research/ai-feature-taxonomy.md, research/ai-feature-examples.md) is ready for this.
- **AI-specific security checks**: API keys in client-side code, user data sent to unexpected AI endpoints, PII to external AI. Currently covered by existing Code Quality security checks.

</deferred>

---

*Phase: 03-evaluator-hardening*
*Context gathered: 2026-03-29*
