# Quick Task: Prime the Planner to Add Wow-Tier AI Features - Research

**Researched:** 2026-04-05
**Domain:** Planner agent instruction design, progressive disclosure, AI feature taxonomy
**Confidence:** HIGH

## Summary

The Planner currently has a single instruction line (planner.md line 81): "Weave AI features throughout. Find natural opportunities to integrate AI-powered functionality: intelligent assistants, auto-generation, natural language interfaces, smart suggestions." This is vague and produces Regular-tier AI features (chatbots, basic text generation) rather than Wow-tier features (on-device models via WebGPU, multi-modal pipelines, privacy-preserving client-side AI). The fix has three parts: (1) a new reference doc that teaches the Planner *how to think* about ambitious AI features, (2) strengthened instructions in planner.md, and (3) optionally a minor SPEC-TEMPLATE.md enhancement.

**Primary recommendation:** Create a ~80-120 line reference doc `ai-feature-inspiration.md` loaded via the same `${CLAUDE_PLUGIN_ROOT}` Read pattern used by `frontend-design-principles.md`, paired with ~15 lines of strengthened instruction in planner.md replacing the current single-line AI directive.

## Current State Analysis

### How the Planner Currently Handles AI Features

**Instruction text (planner.md line 81):**
```
4. **Weave AI features throughout.** Find natural opportunities to integrate
   AI-powered functionality: intelligent assistants, auto-generation, natural
   language interfaces, smart suggestions. These should feel like genuine
   enhancements, not gimmicks.
```

This instruction is the weakest of the critical rules. Compare:
- Visual design gets a dedicated reference doc (68 lines) + 15 lines of Guidelines + anti-slop patterns
- Acceptance criteria get a dedicated reference doc (70 lines) + explicit Read directive
- AI features get one bullet point with four generic examples

**Result:** The Planner defaults to Regular-tier patterns -- chatbots, basic autocomplete, LLM API calls -- because it has no vocabulary for what Wow-tier looks like.

### SPEC-TEMPLATE.md AI Section

The template already has an `## AI Integration` section (lines 96-100):
```markdown
## AI Integration

<For each AI-powered feature, describe:>
- What it does from the user's perspective
- Where it appears in the product workflow
- What capabilities it provides (generation, suggestion, analysis, etc.)
```

This is adequate as a structural container. The problem is not the template format -- it is the Planner's knowledge of what to put in it.

### Self-Verification Checklist

Item 6 of the self-verification (planner.md line 143) checks:
```
6. **AI integration** -- if the user prompt implies AI features, an `## AI Integration`
   section describing each AI-powered feature from the user's perspective
```

This conditional ("if the user prompt implies AI features") is problematic. The task goal is to have AI features in *every* spec, not only when the user explicitly asks. This condition should become unconditional.

## Progressive Disclosure Pattern

### How Reference Docs Are Loaded

The Planner loads two reference docs via explicit Read directives:

**Pattern 1 -- frontend-design-principles.md (line 34):**
```markdown
**Before writing the Visual Design Language section**, read the design principles
reference at `${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/
frontend-design-principles.md` in the repository root (relative path). Use it to
inform your aesthetic direction...
```

**Pattern 2 -- acceptance-criteria-guide.md (lines 107-111):**
```markdown
## Writing Acceptance Criteria
...read the criteria guide before adding Acceptance Criteria to each feature:

Read `${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/acceptance-criteria-guide.md`
```

Both use `${CLAUDE_PLUGIN_ROOT}` path prefix. Both are Read-before-write directives: "read X before writing section Y." This is the pattern to follow.

### Token Budget

Existing reference docs loaded per Planner invocation:
- `SPEC-TEMPLATE.md`: ~100 lines (~1,500 tokens)
- `frontend-design-principles.md`: 68 lines (~1,000 tokens)
- `acceptance-criteria-guide.md`: 70 lines (~1,000 tokens)

Total reference overhead: ~3,500 tokens. Adding ~100 lines (~1,500 tokens) brings it to ~5,000 tokens -- well within budget for a Planner invocation that typically runs 50K-100K tokens total. An 80-120 line doc is the right size.

## Reference Doc Design

### What It Must NOT Be

The raw research files are the wrong format:
- `ai-feature-taxonomy.md` (167 lines): a flat category list with detection notes -- evaluator-focused, not planner-focused
- `ai-feature-examples.md` (827 lines): comprehensive but far too large (827 lines = ~12K tokens). Loading this every Planner invocation wastes context.

### What It Must Be

A principles-first reference doc (~80-120 lines) structured to teach the Planner *how to think at the Wow tier*, not to enumerate every possible AI feature. The doc should:

1. **Define the Regular vs Wow spectrum** with 3-4 concrete contrastive pairs (not 40+)
2. **Provide thinking heuristics** -- what makes a feature Wow? (on-device, multi-modal, pipeline chaining, privacy-preserving, real-time, emergent behavior)
3. **List AI capability categories** as a lightweight menu (one line each, not detailed examples) to trigger the Planner's imagination
4. **Include anti-patterns** (what makes AI features feel gimmicky or Regular-tier)
5. **Tie to browser capabilities** -- the Generator builds browser apps, so the reference should emphasize what browsers can actually do (WebGPU, Transformers.js, Web Audio, MediaPipe, Chrome Built-in AI APIs)

### Recommended Structure

```
# AI Feature Inspiration

## The Wow Spectrum (definitions + 3-4 contrastive pairs)     ~25 lines
## Thinking Heuristics (6-8 principles)                       ~20 lines
## AI Capability Menu (one-liner categories as prompts)        ~30 lines
## Browser AI Capabilities (what's actually possible)          ~15 lines
## Anti-Patterns (Regular-tier traps to avoid)                 ~15 lines
## Integration Depth (weaving AI into the product, not bolting on) ~15 lines
```

Total: ~120 lines, ~1,500 tokens.

### Key Content Principles

**Wow-tier heuristics to encode:**
1. **On-device over cloud API** -- running models in-browser via WebGPU/WASM signals ambition
2. **Multi-modal pipelines** -- chaining capabilities (voice -> text -> action -> visualization)
3. **Context-aware intelligence** -- AI that understands the product domain, not generic chatbot wrappers
4. **Privacy as a feature** -- "all processing happens locally" is itself a differentiator
5. **Real-time over batch** -- live inference during user interaction, not upload-then-wait
6. **Emergent behavior** -- AI that learns, adapts, or surprises, not just transforms input to output
7. **Depth over breadth** -- one deeply integrated AI feature outshines five shallow ones

**Regular-tier anti-patterns to flag:**
- A chatbot bolted onto the sidebar that has no domain knowledge
- "AI-powered" labels on features that are just API calls with no product integration
- Generic "ask AI to generate X" without contextual awareness
- Same AI features regardless of product domain (every app gets a chatbot)

## Planner Instruction Changes

### Changes to planner.md

**1. Replace Critical Rule #4 (line 81) with a stronger directive + Read instruction:**

Current:
```
4. **Weave AI features throughout.** Find natural opportunities to integrate
   AI-powered functionality: intelligent assistants, auto-generation, natural
   language interfaces, smart suggestions. These should feel like genuine
   enhancements, not gimmicks.
```

Proposed replacement (before the "Create a distinctive visual design language" rule):
```
4. **Design ambitious AI features.** Before writing the AI Integration section and
   AI-related user stories, read the AI feature reference at
   `${CLAUDE_PLUGIN_ROOT}/skills/application-dev/references/ai-feature-inspiration.md`.
   Every spec includes AI features -- not as bolt-on chatbots, but as deeply
   integrated capabilities that make the product feel intelligent. Aim for the
   Wow tier: on-device inference, multi-modal pipelines, context-aware
   intelligence, and features that could not exist without AI. The reference
   teaches you how to think at this level.
```

**2. Update Self-Verification item 6 (line 143) to remove the conditional:**

Current:
```
6. **AI integration** -- if the user prompt implies AI features, an `## AI Integration`
   section describing each AI-powered feature from the user's perspective
```

Proposed:
```
6. **AI integration** -- an `## AI Integration` section describing each AI-powered
   feature from the user's perspective. Every product has AI features -- the
   reference doc guides their design.
```

**3. Update Quality Bar example (line ~129) to strengthen the AI expectation:**

The existing quality bar example says:
```
- Include AI features like prompt-based sprite generation and intelligent level design
```

Strengthen to:
```
- Include Wow-tier AI features like on-device sprite generation running via
  WebGPU, intelligent level design that learns from play-test results, and
  NPC behavior driven by a local language model -- not just API-wrapped chatbots
```

### Changes to SPEC-TEMPLATE.md

The template's `## AI Integration` section is adequate structurally. One optional enhancement: add a comment hint about the Wow tier, similar to the acceptance criteria comments:

```markdown
## AI Integration

<!--
For each AI-powered feature, describe what it does from the user's perspective.
Aim for Wow-tier: on-device inference, multi-modal pipelines, contextual
intelligence. A chatbot in a sidebar is Regular tier. AI that deeply
understands and enhances the product domain is Wow tier.
-->
```

This is a minor change. The instruction in planner.md is the primary lever.

## File Changes Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `plugins/application-dev/skills/application-dev/references/ai-feature-inspiration.md` | CREATE | ~80-120 lines (new reference doc) |
| `plugins/application-dev/agents/planner.md` | EDIT | ~15 lines (replace rule #4, update self-verification, update quality bar) |
| `plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md` | EDIT | ~5 lines (add comment hint to AI Integration section) |

## Common Pitfalls

### Pitfall 1: Reference Doc Too Large
**What goes wrong:** A 200+ line reference doc eats into the Planner's context budget and causes it to skim or ignore content.
**How to avoid:** Keep the reference doc under 120 lines. Use one-liner category prompts, not detailed examples. The Planner already knows about most AI technologies from training -- it needs heuristics and ambition calibration, not a textbook.

### Pitfall 2: Prescriptive Feature Lists
**What goes wrong:** If the reference doc lists 40 specific features, the Planner will cherry-pick from the list instead of inventing features tailored to the product domain. Every spec starts looking the same.
**How to avoid:** Structure the reference as thinking principles, not a feature catalog. The category menu should be single-line prompts ("on-device image processing", "behavioral adaptation") that trigger creativity, not full specs to copy.

### Pitfall 3: Ignoring Product Domain Fit
**What goes wrong:** The Planner adds impressive-sounding AI features that have no connection to the product's purpose (a DAW with AI image generation, a game maker with sentiment analysis).
**How to avoid:** The reference doc's "Integration Depth" section should emphasize domain relevance: "The best AI features amplify what the product already does. A music app's AI should understand music. A game maker's AI should understand game design."

### Pitfall 4: Making AI Features Unconditional When User Wants None
**What goes wrong:** A user prompt that explicitly says "no AI" or is a purely static content site still gets AI features forced in.
**How to avoid:** The instruction should say "Every product includes AI features unless the user's prompt explicitly excludes them." The Constraints and Non-Goals section in the spec provides the escape hatch.

## Open Questions

1. **Should the reference doc include browser-specific capability details?**
   - What we know: The Generator already has the browser-built-in-ai meta-skill with 7 API references. The Planner only needs to know what is *possible*, not how to implement it.
   - Recommendation: Include a lightweight browser capability inventory (WebGPU, Transformers.js, Chrome APIs, MediaPipe, Web Audio, WASM) as a "what's possible" section. Leave implementation details to the Generator's skills.

2. **Should the Planner reference doc reference the examples file?**
   - What we know: The examples file (827 lines) is rich inspiration but too large to load.
   - Recommendation: The reference doc is self-contained. The examples file remains in `research/` as an offline inspiration source for humans (and for future reference doc updates), not loaded by the Planner.

## Sources

### Primary (HIGH confidence)
- `plugins/application-dev/agents/planner.md` -- current Planner instructions (read directly)
- `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md` -- reference doc loading pattern (read directly)
- `plugins/application-dev/skills/application-dev/references/acceptance-criteria-guide.md` -- second reference doc pattern (read directly)
- `plugins/application-dev/skills/application-dev/references/SPEC-TEMPLATE.md` -- template structure (read directly)
- `research/ai-feature-taxonomy.md` -- 8-category taxonomy, 100+ feature types (read directly)
- `research/ai-feature-examples.md` -- Regular vs Wow tier contrastive pairs (read directly)

## Metadata

**Confidence breakdown:**
- Reference doc design: HIGH -- follows established patterns in this codebase
- Instruction changes: HIGH -- small, targeted edits to known file
- Pitfall analysis: HIGH -- grounded in observed Planner behavior from test runs

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- no external dependency changes expected)
