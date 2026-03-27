# Technology Stack

**Analysis Date:** 2026-03-27

## Overview

This is a Claude Code plugin marketplace that provides autonomous application development capabilities. The application itself is plugin-based and does not have a traditional technology stack with language runtime or dependencies. Instead, it defines architecture, instructions, and skills for three collaborative AI agents (Planner, Generator, Evaluator) that build complete applications autonomously.

The plugin orchestrates development workflows through **agent coordination** and **file-based communication**, not through compiled code or package dependencies.

## Languages

**Primary:**
- **Markdown** - All agent definitions, skills, and documentation are written in Markdown with YAML frontmatter
- **JavaScript/TypeScript** - Generated applications use JavaScript/TypeScript (chosen by Generator based on project requirements)

**Secondary:**
- **Python** - Optional runtime for generated applications (Generator may choose Python + FastAPI for full-stack projects)
- **Bash** - Shell scripting for agent operations and file management

## Runtime

**Environment:**
- Claude Code (plugin platform)
- No language runtime required by the plugin itself
- Generated applications run in: Node.js, Python, browsers, or other runtimes depending on Generator's tech stack choice

**Package Manager:**
- Not applicable to the plugin itself
- Generated applications use npm/pnpm/yarn (Node.js) or pip (Python) depending on stack choice

## Frameworks

**Core:**
- **Claude Code Agent Framework** - Agents communicate via framework-provided Agent() tool
  - Planner agent reads design principles, writes `SPEC.md`
  - Generator agent implements full applications from specs
  - Evaluator agent tests applications via `playwright-cli`

**Skills (Agent Extensions):**
- **application-dev** skill - Orchestrates the three-agent build/QA loop
- **browser-prompt-api** skill - Guides generators to use W3C LanguageModel Prompt API (Gemini Nano on Chrome 138+, Phi-4-mini on Edge)
- **browser-webllm** skill - Guides generators to use MLC-AI WebLLM for browser-based LLM inference with WebGPU
- **browser-webnn** skill - Guides generators to use W3C WebNN API for neural network inference

**Generated Application Frameworks (Common):**
- React 18+ with Vite - Single-page applications
- Next.js 13+ - Full-stack applications
- SvelteKit - Alternative full-stack framework
- Vanilla HTML/CSS/JavaScript - Simpler projects
- FastAPI - Python backends for data-heavy applications

## Key Dependencies

**For Generated Applications (Not Plugin Dependencies):**

**Frontend:**
- `@mlc-ai/web-llm` [Optional] - MLC-AI WebLLM for in-browser LLM inference
- `playwright` [Optional] - Browser automation for testing (Evaluator uses `playwright-cli` binary)
- `typescript` - TypeScript for type-safe development (Evaluator expects `.ts`/`.tsx` files)
- `@types/dom-chromium-ai` [Optional] - Type definitions for browser Prompt API

**Backend:**
- `fastapi` [Optional, Python] - Web framework for Python backends
- `sqlite3` or PostgreSQL [Optional] - Database persistence (chosen by Generator)
- `sqlalchemy` [Optional, Python] - ORM for Python backends

**Build Tools (Generated Applications Use):**
- Vite - Primary bundler for React/Vue single-page apps
- Next.js internal build system - For full-stack Next.js projects
- TypeScript compiler - For TypeScript projects

## Configuration

**Environment:**
- Plugin loaded via Claude Code plugin system
- No environment variables required for the plugin itself
- Generated applications may require:
  - `NODE_ENV` (development/production)
  - `PORT` (dev server port, usually 5173 or 3000)
  - Database credentials (if backend uses database)
  - API keys (if backend integrates external services)

**Agent Configuration:**
- Agent model selection: `model: inherit` (uses user's Claude Code default)
- Recommended model: Opus 4.6 for sustained multi-hour autonomous development
- Agents defined in `plugins/application-dev/agents/`:
  - `planner.md` - Color: blue, Tools: Read, Write
  - `generator.md` - Color: green, Tools: Read, Write, Edit, Glob, Bash
  - `evaluator.md` - Color: yellow, Tools: Read, Write, Glob, Bash

## Build and Development

**Build Tooling:**
- Agent code (Markdown) requires no build step
- Generated applications build themselves:
  - Node.js projects: `npm install && npm run dev`
  - Python projects: `pip install -r requirements.txt && python app.py`

**Verification:**
- Generator self-tests applications: starts dev server, verifies port listening (`curl`)
- Evaluator uses `playwright-cli` to perform browser-based QA testing
- File-based verification: Re-reads generated files after writing to confirm existence

**Communication Protocol:**
- **File-based inter-agent communication:**
  - `SPEC.md` - Written by Planner, read by Generator and Evaluator
  - `QA-REPORT.md` - Written by Evaluator, read by Generator (next round)

## Platform Requirements

**Development:**
- Claude Code (no version constraint, compatible with latest)
- `playwright-cli` binary on PATH (required for Evaluator agent)
- Sufficient disk space for generated applications

**Production (Generated Applications):**
- Hosting depends on Generator's tech stack choice:
  - Single-page apps: Static hosting (Vercel, Netlify, GitHub Pages)
  - Full-stack Node.js: Server with Node.js runtime
  - Python backend: Server with Python runtime
  - Browser-local AI: Modern browser with WebGPU support (Chrome 138+, Edge, Safari 18+)

**Browser Support (Generated Applications with AI Features):**
- **Prompt API:** Chrome 138+ (extensions stable, web pages in origin trial), Edge (Phi-4-mini)
- **WebLLM:** Any browser with WebGPU support (Chrome, Edge, Safari 18+)
- **WebNN:** W3C WebNN spec-compliant browsers (experimental support, evolving)

## Key Architectural Decisions

**Multi-Agent Coordination:**
- Agents are separate Claude instances with distinct roles
- No shared state except files on disk (`SPEC.md`, `QA-REPORT.md`)
- Generator and Evaluator form adversarial pair (GAN-inspired)
- Separation prevents self-praise bias and improves quality

**File Protocol Over APIs:**
- All communication is file-based (no HTTP, no databases, no queues)
- Agents read/write to local filesystem in working directory
- Supports long-running operations (up to 3 build/QA rounds)

**Browser-First for Generated Applications:**
- AI features stay fully in-browser (Prompt API, WebLLM, WebNN)
- No cloud AI service calls required
- Privacy-preserving: data never leaves user's device

---

*Stack analysis: 2026-03-27*
