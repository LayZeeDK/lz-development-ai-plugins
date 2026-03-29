# AI Slop Checklist

Visual patterns that indicate AI-generated default design rather than intentional creative choices. Check for these during visual assessment (scroll-and-inspect) and code review. Each match is evidence supporting the 4-5 range for Visual Design. Multiple matches strongly suggest AI-slop. The absence of these patterns is necessary but not sufficient for scores above 5.

## Typography Slop

- Inter, Roboto, Arial, or system-ui as the sole font choice
- No display/heading font -- same font at different sizes only
- Default browser or framework font stack with no customization

## Color Slop

- Purple-to-blue gradient hero sections
- Purple gradients on white card backgrounds
- Evenly-distributed, low-contrast color palette with no dominant accent
- Cliched tech startup palettes (purple/blue/teal gradients)

## Layout Slop

- Predictable 3-column card grid with uniform rounded corners and drop shadows
- Generic hero section with centered text and stock-style illustration
- Cookie-cutter component library look (Material UI defaults, Tailwind defaults without customization)
- Identical layout patterns that could belong to any industry

## Content Slop

- Headlines that say nothing specific: "Build the future", "Your all-in-one platform", "Scale without limits"
- Lorem ipsum or "Coming soon" placeholders
- Stock photo aesthetic (glossy, over-lit, perfect) rather than intentional photography

## Motion Slop

- Same fade-in animation on every element during scroll
- No purposeful motion or interaction feedback
- Excessive decoration animations that serve no functional purpose

## Design Identity Slop

- No clear aesthetic direction that matches the product domain
- A game maker that looks like a SaaS dashboard
- A creative tool with a corporate enterprise aesthetic
- Design that communicates nothing about the brand, product, or audience
