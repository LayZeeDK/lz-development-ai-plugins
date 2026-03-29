# ASSETS.md Template

The Generator produces this manifest for all static assets in the project.
Every image, font, icon, video, and audio file gets an entry. This document
serves as provenance documentation -- where each asset came from, its license,
and whether its URL has been verified.

## Asset Manifest

| Asset | Type | Source | License | Attribution | URL | Verified |
|-------|------|--------|---------|-------------|-----|----------|
| hero-background.webp | image | web-search | CC0 | Unsplash / @photographer | https://unsplash.com/photos/abc123 | yes |
| app-logo.svg | icon | procedural/SVG | N/A | N/A | local | yes |
| inter-variable.woff2 | font | bundled-dependency | OFL-1.1 | Google Fonts | https://fonts.google.com/specimen/Inter | yes |
| onboarding-demo.mp4 | video | generated | N/A | N/A | local | yes |
| product-photo.jpg | image | stock-api | CC-BY-4.0 | Pexels / @creator | https://www.pexels.com/photo/123456 | no |
| notification.mp3 | audio | user-provided | unknown | User-supplied | local | yes |

## Column Definitions

- **Asset** -- filename or descriptive name of the asset
- **Type** -- `image`, `font`, `icon`, `video`, `audio`, or `other`
- **Source** -- how the asset was obtained:
  - `web-search` -- found via web search with license check
  - `generated` -- created by AI (browser AI + screenshot) or code generation
  - `procedural/SVG` -- built programmatically (inline SVG, canvas, CSS)
  - `stock-api` -- retrieved from a stock photo/media API
  - `bundled-dependency` -- provided by an npm package or framework
  - `user-provided` -- supplied by the user in their prompt or assets
- **License** -- `MIT`, `CC0`, `CC-BY-4.0`, `OFL-1.1`, `proprietary`,
  `unknown`, or `N/A` (for locally generated assets)
- **Attribution** -- required credit text, or `N/A` if none required
- **URL** -- external source URL, or `local` for generated/bundled assets
- **Verified** -- `yes` if the URL was checked with `check-assets` or
  visually confirmed; `no` if pending verification

## Verification

Run the asset verification CLI to check all external URLs:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/appdev-cli.mjs check-assets
```

This verifies that external URLs are reachable and return the expected
content type (detects soft-404s where CDNs return HTML for missing images).
