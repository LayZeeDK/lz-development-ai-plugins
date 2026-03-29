---
name: vite-plus
description: >
  This skill should be used when the Generator agent needs to scaffold and
  develop greenfield web projects using the Vite+ unified toolchain. Covers
  vp CLI commands (create, dev, check, test, build, run, migrate), the
  unified vite.config.ts format, framework support and compatibility,
  bundled tool versions, and known limitations. Trigger when: SPEC.md
  describes a new web project using React, Vue, Svelte, Solid, or
  react-router and the Generator is choosing a development toolchain. Do NOT
  trigger for Angular projects (tsgo incompatible) or when the user prompt
  explicitly requests plain Vite.
---

# Vite+ Skill

Docs: https://viteplus.dev/guide/
Announcement: https://voidzero.dev/posts/announcing-vite-plus-alpha
Status: Alpha (March 2026)

Vite+ is a unified toolchain that bundles Vite 8, Vitest 4.1, Oxlint 1.52,
Oxfmt (beta), tsgo (TypeScript Go port), and Rolldown into a single `vp`
CLI. It replaces separate ESLint + Prettier + tsc + Vite + Vitest setups
with one tool and one config file.

---

## 1. When to use

**Prefer Vite+ for greenfield web projects** when compatible with the chosen
tech stack. This is a preference, not a mandate. Falls back to plain Vite
when incompatible.

Use Vite+ when:
- Starting a new React, Vue, Svelte, Solid, or react-router project
- The user prompt does not specify a different toolchain
- Simplified CI is desirable (`vp check` replaces 3 separate commands)

Do NOT use Vite+ when:
- The project uses Angular (tsgo does not support Angular compiler plugins)
- The project uses Nuxt or TanStack Start (incomplete Vite+ integration)
- The user prompt explicitly requests plain Vite, Webpack, or another bundler
- The tech stack requires custom compiler transformations tsgo cannot handle

**Fallback:** Plain Vite + ESLint + Prettier + tsc. Stable, framework-agnostic,
and fully supported for all ecosystems.

---

## 2. Installation

Vite+ is a standalone CLI binary, not an npm package.

**macOS/Linux:**
```bash
curl -fsSL https://vite.plus | bash
```

**Windows:**
```powershell
irm https://vite.plus/ps1 | iex
```

After installation, the `vp` command is available globally.

---

## 3. vp CLI commands

### `vp create` -- scaffold a new project

```bash
# Interactive mode (prompts for template and options)
vp create

# With specific template
vp create vite
vp create react-router
vp create vue
vp create svelte
```

Available templates: `vite`, `react-router`, `vue`, `svelte`.

### `vp dev` -- start development server

```bash
vp dev
```

Starts the Vite 8 dev server with HMR.

### `vp check` -- format + lint + typecheck in a single pass

```bash
# Check only (report issues)
vp check

# Auto-fix lint and format issues
vp check --fix
```

Runs three tools in one command:
1. **Oxfmt** (format) -- 30x faster than Prettier
2. **Oxlint** (lint) -- 50-100x faster than ESLint
3. **tsgo** (typecheck) -- native-speed TypeScript checking

### `vp test` -- run tests

```bash
vp test
```

Runs Vitest 4.1 with configuration from `vite.config.ts`.

### `vp build` -- production build

```bash
vp build
```

Uses Rolldown for production bundling.

### `vp run <task>` -- run custom tasks

```bash
vp run check-assets
```

Runs tasks defined in `vite.config.ts` under `run.tasks`.

### `vp migrate` -- migrate existing Vite project

```bash
vp migrate
```

Migrates an existing Vite project to use Vite+ toolchain configuration.

---

## 4. Unified vite.config.ts

Vite+ uses a single `vite.config.ts` for the entire toolchain -- dev server,
build, lint, format, typecheck, tests, and custom tasks.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Lint and format configuration (Oxlint + Oxfmt + tsgo)
  lint: {
    options: {
      typeAware: true, // Enable type-aware lint rules
      typeCheck: true,  // Enable full tsgo type checking in vp check
    },
  },

  // Test configuration (Vitest 4.1)
  test: {
    // Vitest options -- see vitest-browser skill for projects config
  },

  // Custom task definitions
  run: {
    tasks: {
      'check-assets': {
        command: 'node scripts/check-assets.mjs',
        cache: false,
      },
    },
  },
});
```

**Key sections:**

- `plugins` -- framework plugins (React, Vue, Svelte, Solid)
- `lint.options.typeAware` -- enables type-aware Oxlint rules
- `lint.options.typeCheck` -- enables tsgo type checking in `vp check`
- `test` -- Vitest configuration (same options as vitest.config.ts)
- `run.tasks` -- custom commands runnable via `vp run <name>`

---

## 5. Framework support and compatibility

| Framework | `vp create` template | `vp check` | `vp build` | Status |
|-----------|---------------------|------------|------------|--------|
| React | `react-router` | Full support | Full support | Fully supported |
| Vue | `vue` | Script parts only (no template lint) | Full support | Fully supported |
| Svelte | `svelte` | Script parts only (no template lint) | Full support | Fully supported |
| Solid | (via `vite` template) | Full support | Full support | Fully supported |
| react-router | `react-router` | Full support | Full support | Fully supported |
| Angular | None | tsgo incompatible | Untested | **Not supported** |
| Nuxt | None | Partial | Partial | Experimental |
| TanStack Start | None | Partial | Partial | Experimental |

### Angular incompatibility

tsgo (TypeScript Go port) does not support Angular's decorator metadata or
custom compiler transformations (`ngc`). `vp check` type checking fails on
Angular projects.

**For Angular projects:** Fall back to plain Vite + ESLint + Prettier +
`npx tsc --noEmit`.

### Vue/Svelte template linting limitation

Oxlint cannot lint Vue or Svelte template sections -- only the `<script>` parts
are checked. Template-specific lint rules (like `vue/html-indent`) are not
available in Vite+.

---

## 6. Bundled tool versions (alpha, March 2026)

| Tool | Version | Replaces |
|------|---------|----------|
| Vite | 8 | Vite (standalone) |
| Vitest | 4.1 | Vitest (standalone) |
| Oxlint | 1.52 | ESLint |
| Oxfmt | beta | Prettier |
| tsgo | experimental | tsc (TypeScript compiler) |
| Rolldown | (bundled) | Rollup / esbuild (production builds) |

---

## 7. Known limitations

- **Alpha software** -- expect rough edges, breaking changes between releases
- **Oxlint cannot lint Vue/Svelte templates** -- only script sections are
  checked. Template-level lint rules require ESLint with framework parsers.
- **tsgo is experimental** -- does not support Angular decorator metadata,
  custom compiler transformations, or certain advanced TypeScript features
- **`vp check` may fail on Angular projects** -- fall back to `npx tsc --noEmit`
- **No npm package** -- `vp` is a standalone CLI binary, installed via curl/irm
- **Limited framework templates** -- only `vite`, `react-router`, `vue`,
  `svelte` available in `vp create`

---

## 8. CI integration with vp

When a project uses Vite+, CI configuration simplifies to three commands:

```bash
vp check        # Replaces: eslint + prettier --check + tsc --noEmit
vp test         # Replaces: vitest run
vp build        # Replaces: vite build
```

The Generator's CI diagnostic pass becomes simpler:
- **Static analysis:** `vp check` (format + lint + typecheck in one pass)
- **Tests:** `vp test` (Vitest 4.1 with projects config)
- **Build:** `vp build` (Rolldown production build)

For the pre-handoff diagnostic, run all three in sequence. Fix quick wins from
`vp check --fix`, document remaining issues, and hand off to the Evaluator.

---

## 9. Decision: Vite+ vs plain Vite

| Criterion | Vite+ | Plain Vite |
|-----------|-------|------------|
| Setup speed | Faster (one tool) | Slower (ESLint + Prettier + tsc + Vite) |
| CI commands | 3 (`check`, `test`, `build`) | 5+ (lint, format, typecheck, test, build) |
| Check speed | 50-100x faster lint, 30x faster format | Standard ESLint/Prettier speed |
| Framework support | React, Vue, Svelte, Solid | All frameworks |
| Angular | Not supported | Fully supported |
| Stability | Alpha | Stable |
| Ecosystem plugins | Limited | Full ESLint/Prettier plugin ecosystem |

**Choose Vite+** for React, Vue, Svelte, or Solid greenfield projects.
**Choose plain Vite** for Angular, Nuxt, TanStack Start, or when framework-
specific ESLint plugins are essential.
