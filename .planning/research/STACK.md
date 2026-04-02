# Stack Research: v1.2 Feature Integration

**Domain:** Claude Code plugin -- autonomous application development (GAN-inspired)
**Researched:** 2026-04-02
**Confidence:** HIGH (verified against existing codebase -- no new dependencies needed)

This research covers the stack implications of v1.2 feature additions. The v1.1 stack
(ensemble critics, CLI aggregator, zero-dependency appdev-cli.mjs, six bundled skills)
is validated and not re-researched.

## Recommended Stack

### Core Framework (unchanged)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Claude Code Plugin System | 1.0.33+ | Plugin runtime | Only framework; auto-discovers agents, skills, commands |
| Node.js built-ins (fs, path, child_process, net) | Node.js 18+ | appdev-cli.mjs | Zero-dependency CLI pattern established in v1.0 |
| @playwright/cli | 0.1.1+ | Browser automation for all 3 critics | Already installed in workspace setup (Step 0.5) |
| @playwright/test | 1.58+ | Acceptance test execution (projection-critic) | Already installed in workspace setup |

### Supporting Libraries (unchanged)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | devDependency | Image analysis (perceptual-critic) | Installed by perceptual-critic at evaluation start |
| imghash + leven | devDependency | Perceptual hash duplicate detection | Installed by perceptual-critic at evaluation start |
| ajv | devDependency | JSON schema validation (projection-critic) | Installed if app has API endpoints |
| serve | devDependency | Static file server for production builds | Already installed in workspace setup |

## Stack Changes for v1.2

### No New Dependencies

All v1.2 features are implementable with the existing stack:

| v1.2 Feature | Stack Impact | Why No New Dependencies |
|--------------|-------------|------------------------|
| perturbation-critic | New agent .md file + existing playwright-cli | Adversarial testing uses the same browser automation as existing critics |
| Convergence logic hardening | Modify appdev-cli.mjs functions | Threshold scaling is arithmetic on DIMENSIONS.length; no stats libraries needed |
| Enhanced perceptual-critic | Modify agent .md instructions | Cross-page consistency uses existing screenshot/eval commands |
| Enhanced projection-critic | Modify agent .md instructions | A->B->A navigation uses existing playwright-cli navigation commands |
| Generator Vite+ adoption | Modify agent .md instructions | Vite+ skill already exists; this is a guidance strengthening |
| Generator LanguageModel | Modify agent .md instructions | browser-prompt-api skill already handles LanguageModel API |
| Architecture documentation | New reference .md file | Documentation only |

### appdev-cli.mjs Changes (Zero New Imports)

The CLI script already imports everything it needs:
```javascript
import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, mkdirSync, rmdirSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execSync as nodeExecSync, spawnSync, spawn } from "node:child_process";
import { Socket } from "node:net";
```

v1.2 changes to the CLI:
1. **DIMENSIONS constant** -- Add one entry (Robustness). No import changes.
2. **computeEscalation()** -- Replace magic numbers with `DIMENSIONS.length * 10` expressions. No import changes.
3. **cmdRoundComplete()** -- Add `dimension_status` to output JSON. No import changes.
4. **cmdGetTrajectory()** -- Add per-dimension scores to trajectory. No import changes.
5. **cmdCompileEvaluation()** -- Add Robustness to assessmentSections array. No import changes.
6. **cmdResumeCheck()** -- Change `"spawn-both-critics"` to `"spawn-all-critics"`. No import changes.

### perturbation-critic Tool Allowlist

The perturbation-critic uses the same tools as the projection-critic:
```yaml
tools: ["Read", "Write", "Bash(npx playwright-cli *)", "Bash(node *appdev-cli* install-dep *)", "Bash(npx playwright test *)", "Bash(node *appdev-cli* static-serve*)"]
```

No new tool requirements. The perturbation-critic may additionally need:
- `Bash(npx playwright-cli console *)` -- for monitoring console errors under stress (already covered by the `Bash(npx playwright-cli *)` glob pattern)
- Network throttling -- playwright-cli does not currently support network simulation directly; perturbation-critic uses page-level observation (console errors, loading states) as proxy

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Robustness testing | playwright-cli adversarial patterns | puppeteer with network interception | Playwright is already the standard; adding puppeteer adds dependency and fragmentation |
| Network simulation | Observe loading states and console errors | playwright-cli network throttling API | playwright-cli does not expose Chromium DevTools Protocol network conditions directly; observation-based testing is sufficient for v1.2 |
| Statistics for convergence | Inline arithmetic with DIMENSIONS.length | simple-statistics library | Zero-dependency CLI pattern; the math is `Math.ceil(n * 0.05)` |
| Architecture docs format | Markdown reference file | Interactive diagram (Mermaid, D2) | Plugin distribution is markdown files; rendering engines not available in all contexts |

## Installation

No new installation steps for v1.2. The existing Step 0.5 workspace setup is sufficient:

```bash
# Already in Step 0.5 (no changes needed for v1.2)
npm init -y
npm install --save-dev @playwright/cli
npm install --save-dev @playwright/test
npm install --save-dev serve
```

## Sources

- Direct codebase analysis of `plugins/application-dev/scripts/appdev-cli.mjs` (1525 lines) -- verified all imports and dependencies
- Direct codebase analysis of all 4 agent definitions -- verified tool allowlists
- `plugins/application-dev/.claude-plugin/plugin.json` -- verified plugin manifest
- `plugins/application-dev/skills/application-dev/SKILL.md` -- verified workspace setup (Step 0.5)

---
*Stack research for: application-dev plugin v1.2 feature integration*
*Researched: 2026-04-02*
