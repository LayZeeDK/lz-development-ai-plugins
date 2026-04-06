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
Status: Alpha (tested: v0.1.15)

> Vite+ is alpha software (tested: v0.1.15). When vp commands fail
> unexpectedly, research the latest vite-plus docs or fall back to known
> working vp commands from a previous version. Do NOT fall back to plain
> Vite -- Vite+ is the default toolchain and the Generator should exhaust
> vp troubleshooting before considering alternatives.

Vite+ is a unified toolchain that bundles Vite 8, Vitest 4.1, Oxlint,
Oxfmt, tsgo (TypeScript Go port), Rolldown, and tsdown into a single `vp`
CLI. It replaces separate ESLint + Prettier + tsc + Vite + Vitest setups
with one tool and one config file.

---

## 1. When to use

**Vite+ is the default toolchain for greenfield web projects** when
compatible with the chosen framework. The Generator must explicitly justify
choosing plain Vite over Vite+ for a compatible framework.

Use Vite+ when:
- Starting a new React, Vue, Svelte, Solid, or react-router project
- The user prompt does not specify a different toolchain
- Simplified CI is desirable (`vp check` replaces 3 separate commands)

Do NOT use Vite+ when:
- The project uses Angular (tsgo does not support Angular compiler plugins)
- The project uses Nuxt or TanStack Start (incomplete Vite+ integration)
- The user prompt explicitly requests plain Vite, Webpack, or another bundler
- The tech stack requires custom compiler transformations tsgo cannot handle

**Escape hatch:** Plain Vite + ESLint + Prettier + tsc. Stable, framework-
agnostic, and fully supported for all ecosystems. The Generator knows plain
Vite from pre-trained knowledge -- no skill documentation needed.

---

## 2. Breaking changes (v0.1.12 through v0.1.15)

Breaking changes between alpha releases are expected. Key changes since the
initial announcement:

1. **Environment variable prefix renamed:** `VITE_PLUS_*` -> `VP_*`
   (v0.1.15). Old prefix no longer recognized.
2. **`vp run` argument order changed:** Flags must come before the task
   name. `vp run -r build` (correct) vs `vp run build -r` (broken, v0.1.15).
3. **Installation URL changed:** Primary URL is now `viteplus.dev`. The old
   `vite.plus` URL still redirects but the skill uses the canonical URL.
4. **TypeScript peer range:** `^6.0.0` (was unspecified in earlier alphas).
5. **Bun package manager support:** First-class in `vp create` and install.

---

## 3. Installation

Vite+ is a standalone CLI binary, not an npm package.

**macOS/Linux:**
```bash
curl -fsSL https://viteplus.dev/install.sh | bash
```

**Windows:**
```powershell
irm https://viteplus.dev/install.ps1 | iex
```

**Environment variables for customization:**
- `VP_VERSION` -- version to install (default: latest)
- `VP_HOME` -- installation directory (default: `~/.vite-plus`)

After installation, the `vp` command is available globally.

---

## 4. vp CLI commands

### Start phase

| Command | Purpose |
|---------|---------|
| `vp create` | Scaffold new project (templates: `vite`, `react-router`, `vue`, `svelte`) |
| `vp migrate` | Migrate existing Vite project to Vite+ |
| `vp config` | Configure commit hooks and agent integration |
| `vp staged` | Run checks on staged files (pre-commit integration) |
| `vp install` | Resolve dependencies (wraps npm/pnpm/yarn/bun) |
| `vp env` | Manage Node.js versions (`vp env off` to opt out) |

### Development phase

| Command | Purpose |
|---------|---------|
| `vp dev` | Start Vite 8 dev server with HMR |
| `vp check` | Format (Oxfmt) + lint (Oxlint) + typecheck (tsgo) in one pass |
| `vp check --fix` | Auto-fix lint and format issues |
| `vp lint` | Lint only (Oxlint) |
| `vp fmt` | Format only (Oxfmt) |
| `vp test` | Run tests (Vitest 4.1.2) |

### Execution phase

| Command | Purpose |
|---------|---------|
| `vp run <task>` | Run custom tasks defined in vite.config.ts |
| `vpr <task>` | Shorthand for `vp run` |
| `vp run --parallel` | Ignore task dependencies, run all at once |
| `vp run --concurrency-limit N` | Limit concurrent tasks (default: 4) |
| `vp cache` | Clear task cache entries |
| `vpx` | Execute binaries globally |
| `vp exec` | Run local project binaries |
| `vp dlx` | Run package binaries without install |

### Build phase

| Command | Purpose |
|---------|---------|
| `vp build` | Production build (Rolldown) |
| `vp pack` | Library packaging (tsdown) |
| `vp preview` | Preview production build locally |

### Dependency management

| Command | Purpose |
|---------|---------|
| `vp add <pkg>` | Add dependency |
| `vp remove <pkg>` | Remove dependency |
| `vp update` | Update dependencies |
| `vp dedupe` | Deduplicate dependency tree |
| `vp outdated` | List outdated packages |
| `vp why <pkg>` | Show why a package is installed |
| `vp info <pkg>` | Show package information |
| `vp pm <command>` | Access underlying package manager directly |

### Maintenance

| Command | Purpose |
|---------|---------|
| `vp upgrade` | Update the vp CLI itself |
| `vp implode` | Uninstall vp and remove related data |

---

## 5. Unified vite.config.ts

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

  // Test configuration (Vitest 4.1.2)
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

## 6. Framework support and compatibility

| Framework | `vp create` template | `vp check` | `vp build` | Status |
|-----------|---------------------|------------|------------|--------|
| React | `react-router` | Full support | Full support | Fully supported |
| Vue | `vue` | Script parts only | Full support | Fully supported |
| Svelte | `svelte` | Script parts only | Full support | Fully supported |
| Solid | via `vite` template | Full support | Full support | Fully supported |
| react-router | `react-router` | Full support | Full support | Fully supported |
| Angular | None | tsgo incompatible | Untested | **Not supported** |
| Nuxt | None | Partial | Partial | **Experimental** |
| TanStack Start | None | Partial | Partial | **Experimental** |

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

## 7. Bundled tool versions (v0.1.15)

| Tool | Version | Replaces |
|------|---------|----------|
| Vite | 8.0.3 | Vite (standalone) |
| Vitest | 4.1.2 | Vitest (standalone) |
| Oxlint | 1.58.0 | ESLint |
| Oxfmt | 0.43.0 | Prettier |
| tsgo | experimental | tsc (TypeScript compiler) |
| Rolldown | 1.0.0-rc.12 | Rollup / esbuild (production builds) |
| tsdown | 0.21.7 | tsup (library bundling) |

---

## 8. Known limitations

- **Alpha software** -- expect breaking changes between releases. The skill
  documents v0.1.15; later versions may change CLI flags, env vars, or
  command behavior.
- **Oxlint cannot lint Vue/Svelte templates** -- only script sections are
  checked. Template-level lint rules require ESLint with framework parsers.
- **tsgo is experimental** -- does not support Angular decorator metadata,
  custom compiler transformations, or certain advanced TypeScript features.
- **`vp check` may fail on Angular projects** -- fall back to
  `npx tsc --noEmit`.
- **No npm package** -- `vp` is a standalone CLI binary, installed via
  curl/irm.
- **Limited framework templates** -- only `vite`, `react-router`, `vue`,
  `svelte` available in `vp create`.
- **Port conflicts with `vp dev` and `vp preview`** -- If port 5173 (or the
  configured port) is already in use, `vp dev` and `vp preview` may fail
  silently or error. Before starting the dev server, kill any existing
  process on the target port. Use `npx kill-port 5173` or
  `lsof -ti:5173 | xargs kill -9` (macOS/Linux) /
  `netstat -ano | findstr :5173` + `taskkill /PID <pid> /F` (Windows).
  Alternatively, pass `--port 0` to auto-assign an available port (Vite 8
  supports this).

---

## 9. CI integration with vp

When a project uses Vite+, CI configuration simplifies to three commands:

```bash
vp check        # Replaces: eslint + prettier --check + tsc --noEmit
vp test         # Replaces: vitest run
vp build        # Replaces: vite build
```

The Generator's CI diagnostic pass becomes simpler:
- **Static analysis:** `vp check` (format + lint + typecheck in one pass)
- **Tests:** `vp test` (Vitest 4.1.2 with projects config)
- **Build:** `vp build` (Rolldown production build)

For the pre-handoff diagnostic, run all three in sequence. Fix quick wins from
`vp check --fix`, document remaining issues, and hand off to the Evaluator.

---

## 10. Decision: Vite+ vs plain Vite

| Criterion | Vite+ | Plain Vite |
|-----------|-------|------------|
| Setup speed | Faster (one tool) | Slower (ESLint + Prettier + tsc + Vite) |
| CI commands | 3 (`check`, `test`, `build`) | 5+ (lint, format, typecheck, test, build) |
| Check speed | 50-100x faster lint, 30x faster format | Standard ESLint/Prettier speed |
| Framework support | React, Vue, Svelte, Solid | All frameworks |
| Angular | Not supported | Fully supported |
| Stability | Alpha (breaking changes expected) | Stable |
| Ecosystem plugins | Limited | Full ESLint/Prettier plugin ecosystem |

**Choose Vite+** for React, Vue, Svelte, Solid, or react-router greenfield
projects (default).
**Choose plain Vite** for Angular, Nuxt, TanStack Start, or when the user
prompt explicitly requests another bundler.
