# <Product Name> -- <Tagline>

## Overview

<2-3 paragraphs describing:>
- What the product is and what problem it solves
- Who the target audience is and what they care about
- What makes this product distinctive
- The key modules or areas of the product

## Visual Design Language

### Aesthetic Direction
<Describe the overall mood, visual identity, and design philosophy. Reference concrete aesthetic traditions -- e.g., "pixel-art retro computing," "Swiss minimalist design," "dark-mode IDE aesthetic." Avoid vague platitudes like "clean and modern.">

### Color Palette
<Define a cohesive color philosophy -- not hex codes, but the character of the palette. E.g., "warm earth tones with a single vibrant accent color for interactive elements" or "high-contrast dark theme with neon highlights inspired by retro arcade cabinets.">

### Typography
<Describe the typographic approach -- hierarchy, personality, readability priorities.>

### Layout Principles
<Describe spatial organization, density, whitespace philosophy, responsive behavior.>

## User Journey

<2-3 paragraphs describing how a user moves through the product:>
- What does a first-time user see and do? What is the onboarding flow?
- What does a returning user do? What is their typical session?
- How do the features connect? What leads to what?
- What is the user's mental model of the product?

This is not a feature list -- it is a narrative that describes the product experience end-to-end.

## Constraints and Non-Goals

<Explicitly state what the product does NOT include in this version. This prevents scope creep and misaligned expectations.>

Examples of non-goals:
- No authentication or user accounts (unless the prompt requires it)
- No real-time collaboration
- No offline mode
- No custom theming
- No mobile-native features (web only)

Be specific. The Generator will not build what is listed here, and the Evaluator will not penalize its absence.

## Features

List features in priority order within three tiers:
- **Core**: Must be implemented for the product to function. These are built first.
- **Important**: Significantly enhance the product. Built after core features are solid.
- **Nice-to-have**: Polish and delight. Built if time and scope allow.

### 1. <Feature Name> [Core/Important/Nice-to-have]

<1-2 paragraphs explaining what this feature is, why users need it, and how it fits into the overall product.>

**User Stories:**
- As a user, I want to <action>, so that <benefit>
- As a user, I want to <action>, so that <benefit>
- As a user, I want to <action>, so that <benefit>
- ...

**Acceptance Criteria:**
<!--
Behavioral, testable assertions. Each bullet = one automated test.

Good: "Gallery displays at least 12 artworks on initial load"
  -- Observable outcome with a natural numeric threshold from the spec.
Good: "User can filter artworks by artist name"
  -- User action producing a verifiable result.
Good: "Created artwork persists after page refresh"
  -- Persistence stated as user-facing behavior, no mechanism named.

Bad:  "The gallery looks good on mobile"
  -- Vague quality with no observable threshold.
Bad:  "Clicking Add opens a modal with a form"
  -- Prescribes specific UI elements instead of describing behavior.
Bad:  "Data is saved to localStorage"
  -- Exposes implementation mechanism instead of user-facing outcome.
-->
- <observable outcome with measurable threshold if natural>
- <observable outcome>
- <observable outcome>

**Data Model:** (if applicable)
<Describe the key data entities, their fields, and their relationships to other entities.>

### 2. <Feature Name> [Core/Important/Nice-to-have]
...

(Continue for all 10-16+ features)

## AI Integration

<!--
For each AI-powered feature, describe what it does from the user's perspective.
Aim for Wow-tier: on-device inference, multi-modal pipelines, contextual intelligence.
A chatbot in a sidebar is Regular tier. AI that deeply understands and enhances the
product domain is Wow tier.
-->

<For each AI-powered feature, describe:>
- What it does from the user's perspective
- Where it appears in the product workflow
- What capabilities it provides (generation, suggestion, analysis, etc.)

## Non-Functional Considerations

- Performance expectations
- Accessibility considerations
- Data persistence approach (local storage, database, file system, etc.)
- Any platform constraints from the user's prompt
