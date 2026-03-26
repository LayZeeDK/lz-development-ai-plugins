# Frontend Design Principles

Derived from Anthropic's [frontend-design skill](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design) (Apache 2.0).

Use these principles when writing the Visual Design Language section of a product spec.

## Design Thinking

Before defining the visual direction, answer four questions:

1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: Commit to a BOLD aesthetic direction. Pick from: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian -- or invent one that fits the product's domain. Use these for inspiration but design one that is true to the aesthetic direction.
3. **Constraints**: Technical requirements, platform, audience.
4. **Differentiation**: What makes this UNFORGETTABLE? What is the one thing someone will remember about this interface?

The key is intentionality, not intensity. Bold maximalism and refined minimalism both work.

## Typography

- Choose fonts that are beautiful, unique, and interesting
- AVOID generic fonts: Inter, Roboto, Arial, system fonts -- these are AI-slop markers
- Pair a distinctive display font with a refined body font
- Vary between projects -- NEVER converge on the same font choices

## Color and Theme

- Commit to a cohesive aesthetic through color
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- Use CSS variables for consistency
- AVOID: purple gradients on white backgrounds, cliched color schemes

## Spatial Composition

- Unexpected layouts beat predictable ones
- Consider: asymmetry, overlap, diagonal flow, grid-breaking elements
- Choose between generous negative space OR controlled density -- both work, but commit to one
- AVOID: cookie-cutter component layouts, predictable grid patterns

## Backgrounds and Visual Details

- Create atmosphere and depth rather than defaulting to solid colors
- Consider: gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, grain overlays
- Every detail should match the overall aesthetic
- AVOID: flat solid backgrounds with no visual interest

## Motion and Interaction

- Use animations for effects and micro-interactions
- Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions
- Use scroll-triggering and hover states that surprise
- Match implementation complexity to aesthetic vision -- maximalist designs need elaborate animations, minimalist designs need restraint

## Anti-Patterns (AI-Slop Markers)

These patterns immediately signal generic AI-generated design. Actively avoid them:

- Overused font families (Inter, Roboto, Arial, system fonts)
- Purple gradients on white backgrounds
- Predictable card-based layouts with excessive rounded corners and shadows
- Generic hero sections with stock-style illustrations
- Evenly-distributed, timid color palettes
- Cookie-cutter component libraries used without customization
- Default framework styling (Material UI defaults, Tailwind defaults)
- Identical layout patterns across different projects

## The Standard

Every design should feel like it was created by a human designer with a specific point of view, not assembled from framework components. The goal is an interface that is distinctive, intentional, and memorable.
