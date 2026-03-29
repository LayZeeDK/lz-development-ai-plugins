# Asset Validation Protocol

Comprehensive asset validation procedure for the evaluator's Step 7. Uses the analysis toolchain installed in Step 3 (`sharp`, `imghash`, `leven`). Combines automated checks with visual inspection to catch placeholder assets, broken links, and lazy duplication.

## Validation Steps

### a. URL Collection

Combine network log URLs (from Step 5 scroll-and-inspect) with DOM-extracted URLs (data-src, hidden elements, srcset). Deduplicate the combined list.

### b. Per-Image Inspection

For every unique image (no cap):

- `curl -sI`: Content-Type, Content-Length, status code. Detect soft-404s (Content-Type: text/html for image URLs).
- `sharp`: dimensions, format, metadata, intrinsic vs display size.
- `sharp stats()`: solid-fill detection (all channel stdev < 1.0), gradient-only detection (low entropy + moderate stdev), placeholder pattern detection (entropy < 2.0).
- Claude visual inspection: navigate to image URL, screenshot, assess for watermarks, placeholders, quality, relevance to app context, AI generation artifacts, visual-context match (does image match its alt text? fit the page context? match spec's theme?).
- Save downloaded images to `evaluation/round-N/assets/`. Save sharp metadata as `analysis.json`.

### c. Perceptual Hashing

Hash all images with `imghash`, compare distances with `leven` (threshold <= 12 for visually similar). Report clusters. Apply context judgment: same entity in different views (gallery grid + detail page) = legitimate reuse. Different entities sharing one image = flag as lazy duplication.

### d. Link Checking

Internal links via playwright-cli navigation (404 = Major). External links via curl (4xx/5xx = Minor). Multiple dead `#` links = Major (pattern of stub navigation). Anchor links checked for matching element ID.

### e. Font Checking

Network log for failed .woff2/.woff requests. Visual comparison for typography mismatch with spec's design language.

### f. Meta Assets

Check favicon, og:image, apple-touch-icon, manifest icons. Missing = Minor. Declared-but-broken = Major.

### g. Alt Text

Missing alt = Minor (Major if >50% missing). Generic alt ('image', 'photo', 'placeholder') = Minor.

## Severity Rules

- **CORS-blocked resource:** always Major or Critical, never Minor -- structural issue where the resource is fundamentally inaccessible.
- **External image URLs:** lower the score because the Generator should prefer self-hosted assets. External CDN URLs for fonts/CSS are acceptable.
- **Severity escalation by app type:**
  - Visual-heavy app (gallery, portfolio): ALL placeholders = Critical, >50% = Major, 1-2 = Minor.
  - Utility app (dashboard, CLI tool): ALL = Major, >50% = Minor, 1-2 = Cosmetic.
- **Dynamic assets** (inline SVG, canvas, CSS art): legitimate if intentional. Flag only if broken, placeholder-patterned, or lazy substitute for spec-required imagery.
