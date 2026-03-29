# Phase 03: Evaluator Hardening - Research

**Researched:** 2026-03-29
**Domain:** Adversarial evaluation quality -- asset validation, AI feature probing, scoring calibration, report format
**Confidence:** HIGH

## Summary

Phase 3 transforms the Evaluator from a general-purpose critic into an adversarial quality gate with structural enforcement. The phase touches four domains: (1) programmatic asset validation using sharp and perceptual hashing, (2) AI feature probing using modality-based behavioral batteries grounded in Turing test theory, (3) scoring calibration with mechanical ceiling rules and few-shot anchoring, and (4) report format extension with new non-parsed sections.

The implementation produces three deliverables: modifications to `evaluator.md` (restructured 15-step workflow, ELIZA effect warning, AI slop checklist, off-spec features guidance, extended self-verification), a new `references/SCORING-CALIBRATION.md` (3 scenarios per criterion, ceiling rules, conflict resolution), and a new `references/AI-PROBING-REFERENCE.md` (modality-based probe batteries, universal signals, Turing test concepts). The EVALUATION-TEMPLATE.md gains five new sections that are NOT regex-parsed.

**Primary recommendation:** Follow the established Phase 02.1 pattern -- structural/mechanical guidance in reference files, behavioral guidance in agent definitions. The appdev-cli.mjs remains unchanged; new sections are for Generator/human consumption only.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Asset validation protocol (EVAL-01, EVAL-04, EVAL-05):**
- Hybrid approach: network log analysis (primary) + DOM extraction (safety net) + curl spot-check + programmatic analysis (sharp, perceptual hashing, open-source canvas analysis) + Claude visual inspection
- Every unique image gets isolated visual inspection -- no cap
- Per-image checks: watermarks, placeholders, quality, relevance, AI generation artifacts, visual-context match
- Programmatic: curl -sI, sharp (dimensions/format/metadata), perceptual hashing (duplicate detection), canvas analysis packages (solid-fill/gradient detection)
- Duplicate detection via perceptual hashing with context judgment (legitimate reuse vs lazy duplication)
- Scroll-and-inspect: viewport-height chunks, 4 responsive breakpoints (320px, 768px, 1280px, 1920px), screenshots at each position
- Severity escalation by app type (visual-heavy vs utility)
- CORS hard rule: always Major or Critical, never Minor
- Link checking: internal via navigation, external via curl, anchor links for matching element ID
- Font checking: network log for failed .woff2/.woff, visual comparison for typography mismatch
- Meta assets: favicon, og:image, apple-touch-icon, manifest icons
- Console/error monitoring: comprehensive collection, saved to evaluation/round-N/network.log
- Evidence saving: downloaded images to evaluation/round-N/assets/, sharp metadata as analysis.json
- Full validation every round; round 2+ checks previous issues first
- Evaluator installs analysis tools as devDependencies at start of each evaluation

**AI feature probing design (EVAL-02):**
- Three-tier detection: Tier 1 behavioral probes (primary), Tier 2 technical signals (supporting), Tier 3 NO code scanning
- 10-probe battery for conversational AI (variability, domain, rephrase, follow-up, nonsense, out-of-domain, negation, instruction-following, multi-step reasoning, language switch)
- Modality-based organization in AI-PROBING-REFERENCE.md
- Goodhart's Law protection: strategies not scripts
- Turing test concepts: ELIZA effect warning, Winograd Schema probes, Total Turing Test (multimodal), Functional Turing Test, Chinese Room foundation, Grice's specificity, compression round-trip, complexity scaling, Theory of Mind, Visual Turing Test
- Off-spec features: penalized across Product Depth, Code Quality, Functionality
- Canned AI: hard ceiling Product Depth max 5
- AI quality assessment beyond detection (accuracy, relevance, coherence, helpfulness)
- AI latency assessment: feedback-based, not absolute thresholds
- Graceful degradation hard scoring rule

**Scoring calibration (EVAL-03):**
- SCORING-CALIBRATION.md in references/ (separate file, Phase 02.1 pattern)
- 3 scenarios per criterion (below/at/above threshold) = 12 total
- Hard score ceiling rules (mechanical, not judgment)
- Conflict resolution: criteria independent, cross-criterion propagation one-directional, no averaging
- Score-against-the-spec rule
- Round-independent scoring (absolute standards)
- Behavioral anti-leniency stays in evaluator.md
- No anti-pattern self-check list
- Mandatory bug-finding before scoring
- Mandatory score justifications citing specific findings

**Report format and feature watchdog:**
- 5 new EVALUATION-TEMPLATE.md sections (Score Justifications, Asset Validation, AI Feature Probing, Console & Errors, Off-Spec Features) -- NOT regex-parsed
- Template section order: 12 sections as specified in CONTEXT.md
- appdev-cli.mjs UNCHANGED
- Feature watchdog: 4 rules in self-verification
- Extended self-verification: 10 checks
- Evaluator workflow: 15 steps (up from 9)

### Claude's Discretion
- Scroll-and-inspect structure (dedicated step vs integrated) -- informed by research
- Exact perceptual hashing package selection (imghash, blockhash-core, or other)
- Exact canvas analysis package selection
- Exact probe inputs per domain (strategy is fixed, specific inputs are generated on the fly)
- AI slop checklist items (informed by research of patterns on the web)
- Calibration scenario descriptions (follow the format: scenario + score + rationale + boundary)
- Exact wording of ELIZA effect warning
- Detailed content of AI-PROBING-REFERENCE.md per modality section

### Deferred Ideas (OUT OF SCOPE)
- Phase 4: ASSETS.md manifest, appdev-cli check-assets, Generator visual self-assessment, AI-IMPLEMENTATION-REFERENCE.md
- Future: Planner AI feature categories reference, AI-specific security checks
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EVAL-01 | Evaluator validates assets: catches broken images, blocked cross-origin requests (CORS/CORP/COEP), placeholder content, and stolen/unattributed images | Asset validation toolchain (sharp stats, perceptual hashing, curl spot-check), network log analysis, DOM extraction, Claude visual inspection protocol |
| EVAL-02 | Evaluator probes AI features adversarially: sends varied inputs, nonsense queries, semantic rephrasings to detect keyword-triggered canned responses vs real AI inference | 10-probe battery design, modality-based probe organization, Winograd schemas, Grice's maxims, compression round-trip, Visual Turing Test, complexity scaling |
| EVAL-03 | Evaluator scoring calibration -- anti-leniency phrasing, mandatory bug-finding before scoring, score anchoring to rubric descriptors with few-shot calibration examples | Calibration scenario format, mechanical ceiling rules, conflict resolution rules, bug-first workflow, mandatory score justifications |
| EVAL-04 | Evaluator checks for broken links and blocked asset/document/XHR requests | Network log analysis for failed requests, curl verification for external URLs, link checking protocol (internal navigation, external curl, anchor element ID matching) |
| EVAL-05 | Evaluator verifies images are not all placeholders -- visual-heavy sites must have real visual content | sharp stats() for solid-fill/gradient detection, perceptual hashing for duplicate clusters, severity escalation by app type, zero-images assessment |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.x | Image metadata, dimensions, format, pixel statistics | Fastest Node.js image processor (libvips), stats() provides per-channel mean/stdev/min/max for solid-fill detection, dominant color, entropy, sharpness |
| imghash | 1.1.x | Perceptual image hashing (pHash/DCT-based) | Most popular Node.js perceptual hashing package, clean API, Hamming distance comparison via `leven` |
| leven | 4.x | Levenshtein distance for hash comparison | Standard distance metric for perceptual hash similarity |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fast-average-color | 9.5.x | Average color extraction from images | Backup signal for solid-fill detection if sharp stats alone is insufficient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| imghash | blockhash-core | blockhash uses Block Mean Value algorithm (spatial), imghash uses DCT (frequency domain). DCT is more robust to minor modifications. imghash has higher npm usage. |
| imghash | sharp raw pixel buffer + custom hash | Eliminates a dependency but requires implementing hash algorithm from scratch -- violates "don't hand-roll" |
| fast-average-color | get-image-colors | get-image-colors extracts palette (multiple colors), fast-average-color is simpler for the solid-fill use case |

### Not Needed: Separate Canvas Analysis Package

**Key finding:** sharp's `stats()` method provides sufficient programmatic analysis for solid-fill and gradient detection without a separate canvas analysis package:

- **Solid-fill detection:** If all channels have `stdev` near zero (< 1.0), the image is a solid color. The `dominant` field gives the color.
- **Gradient-only detection:** If `stdev` is moderate (5-30 range) but the image has low `entropy` and high `sharpness` near zero, it is likely a smooth gradient.
- **Placeholder pattern detection:** Very low entropy + uniform-ish stdev across channels = programmatic placeholder.

This eliminates the CONTEXT.md's "open-source canvas analysis packages" requirement -- sharp already covers it. The planner should note this finding and use sharp stats as the canvas analysis solution rather than adding another dependency.

**Installation:**
```bash
npm install --save-dev sharp imghash leven
```

## Architecture Patterns

### Deliverable Structure

```
plugins/application-dev/
|-- agents/
|   '-- evaluator.md               # MODIFY: 15-step workflow, ELIZA warning,
|                                   #   AI slop checklist, extended self-verification
|-- skills/
|   '-- application-dev/
|       '-- references/
|           |-- EVALUATION-TEMPLATE.md  # MODIFY: 5 new sections
|           |-- SCORING-CALIBRATION.md  # NEW: ceiling rules, calibration scenarios
|           '-- AI-PROBING-REFERENCE.md # NEW: modality-based probe batteries
'-- scripts/
    '-- appdev-cli.mjs              # UNCHANGED
```

### Pattern 1: Structural vs Behavioral Guidance (Phase 02.1 Pattern)

**What:** Mechanical/structural rules go in reference files; behavioral/judgment guidance stays in agent definitions.
**When to use:** Always -- this is the established project pattern from Phase 02.1.
**Example:**
- evaluator.md: "Default to strict. Do not rationalize issues away." (behavioral)
- SCORING-CALIBRATION.md: "Any Critical bug -> Functionality max 5" (structural/mechanical)
- AI-PROBING-REFERENCE.md: "Text->Text modality: use variability, rephrase, context probes" (structural strategy)
- evaluator.md: "Try to break it. Be skeptical of surface impressions." (behavioral mindset)

### Pattern 2: Non-Parsed Report Sections

**What:** New EVALUATION-TEMPLATE.md sections are for Generator/human readers only. The appdev-cli only parses Scores table and Verdict heading.
**When to use:** For all 5 new sections (Score Justifications, Asset Validation, AI Feature Probing, Console & Errors, Off-Spec Features).
**Key constraint:** Do NOT add HTML comment warnings about regex parsing to new sections. Only the existing Scores table and Verdict heading have that constraint.

### Pattern 3: On-Demand Reference Loading

**What:** The Evaluator loads reference files at the appropriate workflow step, not all at once.
**When to use:** SCORING-CALIBRATION.md is loaded at step 12 (Read Calibration + Score). AI-PROBING-REFERENCE.md is loaded at step 8 (AI Feature Probing). This follows the existing pattern where frontend-design-principles.md is loaded when assessing visual design.
**Path pattern:** `${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/<file>.md`

### Pattern 4: Bug-First Workflow

**What:** Separate the finding phase from the scoring phase. Steps 5-10 find issues. Step 11 lists ALL findings without scoring. Step 12 reads calibration THEN scores.
**Why:** Finding bugs is less biased than scoring. Listing all findings before scoring prevents the "I've already given it a 7 so I'll downplay this next bug" trap.

### Pattern 5: Evaluator Toolchain Self-Installation

**What:** The Evaluator installs sharp, imghash, and leven as devDependencies at the start of each evaluation (Step 3: Install Analysis Toolchain).
**Why:** Tech-stack-agnostic. Even if the app is Python, the Evaluator uses npm packages (Phase 2 workspace setup already does `npm init -y`).
**Implementation:** `npm install --save-dev sharp imghash leven` in step 3.

### Anti-Patterns to Avoid

- **Regex parsing new sections:** The appdev-cli only parses Scores table and Verdict. Adding regex parsing for new sections couples the orchestrator to report content, violating the "deliberately dumb orchestrator" principle.
- **Code scanning for AI detection:** The Evaluator must NOT inspect the Generator's source code to determine if AI features are real. GAN principle: discriminator evaluates output, not generator's internals. Code Quality Assessment is a separate concern.
- **Fixed probe scripts:** AI-PROBING-REFERENCE.md describes strategies, not fixed inputs. The Evaluator generates domain-appropriate inputs on the fly from SPEC.md context. This prevents the Generator from pre-computing responses (Goodhart's Law).
- **Anti-pattern self-check lists:** The CONTEXT.md explicitly rejects these. Structural constraints (ceilings, bug-first workflow, mandatory citations) are the real safeguards. An anti-patterns list gives false confidence.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image metadata extraction | Custom EXIF parser | sharp metadata() | Handles all formats (JPEG, PNG, WebP, AVIF, TIFF, GIF), intrinsic vs display size, ICC profiles |
| Solid-fill/gradient detection | Custom pixel sampling with canvas | sharp stats() | Per-channel stdev, entropy, dominant color -- all needed signals in one call |
| Perceptual image hashing | Custom DCT or block mean hash | imghash + leven | Edge cases in hash computation (rotation, crop, color shift) are well-handled |
| Hash distance comparison | Custom Hamming distance | leven | Standard Levenshtein distance, handles hex string comparison correctly |
| HTTP header inspection | Custom HTTP client | curl -sI | Already available in Bash, handles redirects, returns Content-Type/Content-Length/status |
| Network log analysis | Custom request interceptor | playwright-cli network | Built into the Evaluator's existing toolchain |

**Key insight:** The Evaluator already has `Bash` in its tool allowlist, so curl and npm commands are available. sharp's stats() eliminates the need for a separate canvas analysis package entirely -- this is the key discretionary finding.

## Common Pitfalls

### Pitfall 1: Score Inflation Drift Across Rounds
**What goes wrong:** The Evaluator gives progressively higher scores in later rounds because "it improved" even when absolute quality has not reached the threshold.
**Why it happens:** Relative comparison bias -- the Evaluator compares to the previous round instead of the spec.
**How to avoid:** Round-independent scoring (absolute standards). SCORING-CALIBRATION.md anchors with concrete scenarios. The "score-against-the-spec" rule makes the spec the contract, not the previous round.
**Warning signs:** Scores trending upward without corresponding bug count decreasing.

### Pitfall 2: ELIZA Effect in AI Feature Assessment
**What goes wrong:** The Evaluator sees a polished chat UI with keyword-relevant responses and concludes the AI is real.
**Why it happens:** First impressions of intelligence are unreliable. Polished UI and keyword-triggered responses create an illusion of understanding (the ELIZA effect, named after Weizenbaum's 1966 program).
**How to avoid:** The ELIZA effect warning in evaluator.md names the phenomenon explicitly. The 10-probe battery starts with variability (Probe 0) as a fast exit -- 3 identical responses to the same prompt = definitive canned.
**Warning signs:** High confidence after only seeing the happy path. Especially dangerous with emotionally engaging AI features (therapy chatbot, wellness coach).

### Pitfall 3: Goodhart's Law Gaming
**What goes wrong:** The Generator learns the exact probe inputs and pre-computes responses that pass the battery.
**Why it happens:** If AI-PROBING-REFERENCE.md contains fixed scripts with exact inputs, the Generator can pattern-match against them.
**How to avoid:** AI-PROBING-REFERENCE.md describes probe STRATEGIES, not fixed scripts. The Evaluator generates domain-appropriate inputs on the fly from SPEC.md context. Probe inputs should be derived from the specific app's domain.
**Warning signs:** Generator code that handles specific edge cases matching probe patterns but fails on slight variations.

### Pitfall 4: Missing Lazy-Loaded Content
**What goes wrong:** The Evaluator screenshots the page and misses 80% of content below the fold or behind lazy loading.
**Why it happens:** Modern web apps use IntersectionObserver, loading="lazy", infinite scroll, and viewport-triggered animations.
**How to avoid:** Scroll-and-inspect protocol: scroll every page in viewport-height chunks. Screenshots at each scroll position. 4 responsive breakpoints. Network log analysis captures dynamically loaded resources.
**Warning signs:** Short evaluation reports for content-heavy apps. Few images found on pages known to have galleries.

### Pitfall 5: False Positive Duplicate Detection
**What goes wrong:** Perceptual hashing flags legitimate image reuse as lazy duplication.
**Why it happens:** The same painting appears on a gallery grid AND its detail page -- visually identical but different contexts.
**How to avoid:** Context judgment after hash clustering: same entity in different views = OK. Different entities sharing one image = flag. The Evaluator must check SPEC.md to understand which entities should have distinct visual representations.
**Warning signs:** Many "duplicate" flags for gallery/detail page pairs or thumbnail/full-size pairs.

### Pitfall 6: Over-Strict CORS Classification
**What goes wrong:** The Evaluator flags CORS issues for resources that are intentionally blocked (e.g., hotlink protection on external CDNs).
**Why it happens:** CORS is always Major or Critical per the CONTEXT.md decision, but some CORS blocks are expected behavior.
**How to avoid:** The CORS hard rule applies because CORS means the resource is fundamentally inaccessible from the browser. If an image is CORS-blocked, it is broken for every user regardless of intent. The severity is correct -- the Generator should not reference CORS-blocked resources.
**Warning signs:** External CDN images that return 200 to curl but fail in the browser.

## Code Examples

### sharp stats() for Solid-Fill and Gradient Detection

```javascript
// Source: sharp.pixelplumbing.com/api-input/ (stats method)
const sharp = require('sharp');

async function analyzeImage(imagePath) {
  const stats = await sharp(imagePath).stats();
  const metadata = await sharp(imagePath).metadata();

  // Solid-fill detection: all channels have near-zero stdev
  const isSolidFill = stats.channels.every(ch => ch.stdev < 1.0);

  // Gradient-only detection: moderate stdev, low entropy
  const isGradientOnly = stats.entropy < 3.0
    && stats.channels.some(ch => ch.stdev > 5 && ch.stdev < 50);

  // Placeholder pattern: very low entropy + uniform stdev
  const isPlaceholder = stats.entropy < 2.0
    || isSolidFill
    || (isGradientOnly && stats.sharpness < 1.0);

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    dominant: stats.dominant,
    entropy: stats.entropy,
    sharpness: stats.sharpness,
    isOpaque: stats.isOpaque,
    channels: stats.channels.map(ch => ({
      mean: ch.mean,
      stdev: ch.stdev,
      min: ch.min,
      max: ch.max,
    })),
    flags: {
      isSolidFill,
      isGradientOnly,
      isPlaceholder,
    },
  };
}
```

### Perceptual Hashing for Duplicate Detection

```javascript
// Source: github.com/pwlmaciejewski/imghash + npmjs.com/package/leven
const imghash = require('imghash');
const leven = require('leven');

async function findDuplicates(imagePaths) {
  const hashes = await Promise.all(
    imagePaths.map(async (path) => ({
      path,
      hash: await imghash.hash(path, 16), // 16-bit hex hash
    }))
  );

  const clusters = [];

  for (let i = 0; i < hashes.length; i++) {
    for (let j = i + 1; j < hashes.length; j++) {
      const distance = leven(hashes[i].hash, hashes[j].hash);

      if (distance <= 12) { // threshold for visual similarity
        clusters.push({
          a: hashes[i].path,
          b: hashes[j].path,
          distance,
          verdict: 'visually_similar',
        });
      }
    }
  }

  return clusters;
}
```

### curl Spot-Check for Soft 404 Detection

```bash
# Check Content-Type and Content-Length for CDN soft-404 detection
curl -sI "https://example.com/image.jpg" | head -20

# Expected: Content-Type: image/jpeg, Content-Length: > 0
# Soft 404: Content-Type: text/html (CDN error page returned as 200)
# Soft 404: Content-Length: < 1000 for what should be a large image
```

### Winograd Schema Probe Generation (Conceptual)

```
// AI-PROBING-REFERENCE.md strategy for Text->Text modality
// The Evaluator generates these on the fly from SPEC.md context

For a museum chatbot (SPEC.md mentions Vermeer, Dutch masters):
  "The painting was moved from the gallery to the vault because it was
   too valuable. What was too valuable?"
  Expected: "The painting" (requires understanding that value motivates
   vault storage, not gallery display)

For an e-commerce assistant (SPEC.md mentions products, cart):
  "The customer returned the product to the store because it was
   defective. What was defective?"
  Expected: "The product" (keyword matchers can't resolve the reference)

// Canned systems keyword-match on "painting" or "product" and give a
// generic response about the topic rather than resolving the pronoun.
```

### Grice's Quantity Maxim Probe

```
// AI-PROBING-REFERENCE.md strategy for Text->Text modality
// Tests whether response is proportional to question

Narrow question: "What year was Vermeer born?"
  Real AI: "1632" or "Johannes Vermeer was born in 1632."
  Canned: A paragraph about Vermeer's life, work, and artistic legacy
  Detection: Response length >> question specificity = Quantity violation

Broad question: "Explain Vermeer's use of light and its relationship
  to camera obscura theory."
  Real AI: Multi-paragraph analysis with specific references
  Canned: Same-length response as the narrow question
  Detection: Response length ~= narrow question response = no scaling
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual visual inspection only | Programmatic analysis (sharp stats) + visual inspection | This phase | Catches solid-fill placeholders, gradient-only images that look passable at glance |
| Fixed probe scripts | Strategy-based probes with on-the-fly generation | This phase (Goodhart's Law protection) | Generator cannot game known inputs |
| Subjective scoring | Mechanical ceiling rules + calibration anchoring | This phase | Score inflation structurally prevented |
| 9-step evaluator workflow | 15-step workflow with bug-first separation | This phase | Finding and scoring are decoupled, reducing bias |
| Winograd Schema Challenge (2016) | Winograd schemas as canned-detection probes | Adapted for this project | LLMs solve Winograd schemas; canned systems cannot. Effective discriminator for real vs canned AI. |

**Deprecated/outdated:**
- Original Winograd Schema Challenge dataset: considered "defeated" since 2019 by transformer models. However, the schema CONCEPT remains powerful as a canned-detection probe because canned systems are not transformers -- they are keyword matchers. The Evaluator uses Winograd schemas not to test AI capability but to discriminate real AI from pattern-matching fakes.

## AI Slop Checklist (Research Finding for Claude's Discretion)

Based on web research of AI slop patterns in web design (2025-2026), the following checklist items are recommended for the evaluator.md AI slop detection section. These are specific, observable patterns:

**Typography Slop:**
- Inter, Roboto, Arial, or system-ui as the sole font choice
- No display/heading font -- same font at different sizes only
- Default browser or framework font stack with no customization

**Color Slop:**
- Purple-to-blue gradient hero sections
- Purple gradients on white card backgrounds
- Evenly-distributed, low-contrast color palette with no dominant accent
- Cliched tech startup palettes (purple/blue/teal gradients)

**Layout Slop:**
- Predictable 3-column card grid with uniform rounded corners and drop shadows
- Generic hero section with centered text + stock-style illustration
- Cookie-cutter component library look (Material UI defaults, Tailwind defaults)
- Identical layout patterns that could belong to any industry

**Content Slop:**
- Headlines that say nothing specific: "Build the future", "Your all-in-one platform", "Scale without limits"
- Lorem ipsum or "Coming soon" placeholders
- Stock photo aesthetic (glossy, over-lit, perfect) rather than intentional photography

**Motion Slop:**
- Same fade-in animation on every element during scroll
- No purposeful motion or interaction feedback
- Excessive decoration animations that serve no functional purpose

**Design Identity Slop:**
- No clear aesthetic direction that matches the product domain
- A game maker that looks like a SaaS dashboard
- A creative tool with a corporate enterprise aesthetic
- Design that communicates nothing about the brand, product, or audience

## Scroll-and-Inspect Structure (Research Recommendation for Claude's Discretion)

**Recommendation: Dedicated step (Step 5).**

Rationale:
1. Lazy-loaded content must be triggered BEFORE feature testing (Step 6) and asset validation (Step 7). If scroll-and-inspect is integrated into feature testing, the Evaluator may test features against incomplete content.
2. The 4 responsive breakpoints (320px, 768px, 1280px, 1920px) require systematic viewport changes that are orthogonal to feature testing.
3. Network log collection during scrolling captures all dynamically loaded resources, building the complete URL set for asset validation.
4. Screenshots at each scroll position provide the visual evidence base for later assessment steps.

The CONTEXT.md already lists this as Step 5 in the 15-step workflow, confirming this structure.

## Perceptual Hashing Package Recommendation (Claude's Discretion)

**Recommendation: imghash + leven.**

| Criterion | imghash | blockhash-core |
|-----------|---------|----------------|
| Algorithm | pHash (DCT-based, frequency domain) | Block Mean Value (spatial) |
| Robustness | More robust to minor modifications, rotation, crop | Faster but more sensitive to spatial changes |
| npm downloads | Higher (12 dependents) | Lower (9 dependents) |
| API simplicity | `imghash.hash(path, bits)` returns hex string | Requires raw pixel data input |
| Maintained | Last published 3 months ago | Last published years ago |

imghash is the better choice because DCT-based hashing is more robust for the Evaluator's use case (detecting the same image at different sizes, with different compression, or with minor edits). The Evaluator compares hash distances using `leven` (Levenshtein distance on hex strings), with a threshold of ~12 for "visually similar."

## Canvas Analysis Package Recommendation (Claude's Discretion)

**Recommendation: No separate package needed. Use sharp stats().**

sharp's `stats()` method returns per-channel standard deviation, entropy, sharpness, and dominant color. This covers all canvas analysis needs:

| Detection | sharp stats() Signal | Threshold |
|-----------|---------------------|-----------|
| Solid-fill image | All channel stdev < 1.0 | HIGH confidence |
| Gradient-only image | Low entropy (< 3.0) + moderate stdev (5-50) + low sharpness | MEDIUM confidence (verify with Claude visual inspection) |
| Low-complexity placeholder | Entropy < 2.0 | MEDIUM confidence |
| Transparent/empty image | isOpaque = false + very low entropy | HIGH confidence |

This avoids adding a dependency like `fast-average-color` or `get-image-colors` that would duplicate what sharp already provides. The Evaluator already needs sharp for metadata -- adding stats() is zero marginal cost.

## Open Questions

1. **Imghash on Windows ARM64**
   - What we know: imghash depends on jimp for image decoding, which is pure JavaScript. Should work on ARM64 without native compilation issues.
   - What's unclear: Whether performance is acceptable for evaluating apps with many images (50+).
   - Recommendation: Acceptable risk. The Evaluator processes images sequentially, not in bulk. If performance is an issue, it surfaces as slow evaluation, not a crash.

2. **sharp on Windows ARM64**
   - What we know: sharp 0.34.x has prebuilt binaries for win32-arm64 (added in 0.33.x). Uses libvips which has ARM64 Windows support.
   - What's unclear: Whether all features (stats, metadata) work correctly on ARM64 Windows.
   - Recommendation: HIGH confidence this works. sharp is one of the most widely used Node.js native modules and has extensive platform support.

3. **Perceptual Hash Threshold Tuning**
   - What we know: A Levenshtein distance of <= 12 on a 16-bit hex hash is the commonly cited threshold for "visually similar."
   - What's unclear: Whether this threshold is appropriate for the Evaluator's specific use case (detecting placeholder reuse vs artistic variations).
   - Recommendation: Start with 12, document the threshold in AI-PROBING-REFERENCE.md, and note that the Evaluator should use judgment for borderline cases (distance 10-15).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected -- no test infrastructure in project |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements --> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EVAL-01 | Asset validation catches broken images, CORS, placeholders | manual-only | N/A -- requires running application + browser | N/A |
| EVAL-02 | AI probing detects canned vs real AI | manual-only | N/A -- requires running AI features in browser | N/A |
| EVAL-03 | Scoring calibration prevents inflation | manual-only | N/A -- requires human judgment assessment | N/A |
| EVAL-04 | Link checking finds broken links | manual-only | N/A -- requires running application + browser | N/A |
| EVAL-05 | Placeholder detection for visual-heavy sites | manual-only | N/A -- requires running application + browser | N/A |

**Justification for manual-only:** All EVAL requirements are about the Evaluator agent's behavioral quality when evaluating a running application. These cannot be unit-tested because they require:
1. A running application with known defects
2. A browser (playwright-cli) to interact with it
3. The Evaluator agent to produce a report
4. Human assessment of report quality

The correct validation approach for this phase is integration testing via actual end-to-end runs of the appdev workflow with known-defective applications, which is beyond the scope of automated test infrastructure.

### Sampling Rate
- N/A -- no automated tests for this phase

### Wave 0 Gaps
None -- manual-only validation is the appropriate strategy for evaluator behavioral requirements. No test infrastructure needs to be created.

## Sources

### Primary (HIGH confidence)
- [sharp API documentation](https://sharp.pixelplumbing.com/api-input/) - stats(), metadata(), channel statistics
- [imghash npm package](https://www.npmjs.com/package/imghash) - API, version, usage patterns
- [Playwright network documentation](https://playwright.dev/docs/network) - request monitoring, requestfailed events

### Secondary (MEDIUM confidence)
- [AI Slop Web Design Guide (925 Studios)](https://www.925studios.co/blog/ai-slop-web-design-guide) - AI slop patterns in web design, verified against multiple sources
- [AI Slop Detection (Glukhov)](https://www.glukhov.org/post/2025/12/ai-slop-detection/) - Technical detection approaches
- [Winograd Schema Challenge (Wikipedia)](https://en.wikipedia.org/wiki/Winograd_schema_challenge) - Schema structure, examples, history
- [Gricean Maxims in NLP Survey (ACL 2024)](https://aclanthology.org/2024.inlg-main.39.pdf) - Framework application to AI evaluation
- [Language Models in Dialogue (arXiv 2024)](https://arxiv.org/html/2403.15115v1) - Extended Gricean framework for human-AI interaction

### Tertiary (LOW confidence)
- fast-average-color npm page -- mentioned as backup but likely unnecessary given sharp stats()

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - sharp and imghash are well-established, APIs verified against official documentation
- Architecture: HIGH - follows established Phase 02.1 pattern (structural vs behavioral), integration points clearly mapped to existing files
- Pitfalls: HIGH - based on direct project experience (ELIZA effect, Goodhart's Law, score drift are well-documented phenomena with specific mitigations defined in CONTEXT.md decisions)
- AI slop checklist: MEDIUM - based on web research from multiple sources, cross-verified but specific to 2025-2026 patterns that may evolve
- Perceptual hash thresholds: MEDIUM - commonly cited values but untested in this specific project context

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stack is stable, patterns are architectural)
