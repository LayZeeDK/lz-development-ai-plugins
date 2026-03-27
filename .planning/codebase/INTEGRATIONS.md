# External Integrations

**Analysis Date:** 2026-03-27

## Overview

This plugin does not directly integrate with external APIs, databases, or authentication providers. Instead, it provides **skills and guidance** for generated applications to integrate browser-local AI and custom backends.

The plugin itself is a Claude Code plugin that orchestrates three agents. Generated applications may optionally integrate external services based on their product specifications.

## Agent Platform Integration

**Claude Code:**
- **Framework:** Claude Code Agent Framework (spawns agents via `Agent()` tool)
- **Communication:** File-based (agents read/write `SPEC.md`, `QA-REPORT.md`)
- **Models:** Agents use `model: inherit` -- defaults to user's Claude Code session model
- **Recommended Model:** Opus 4.6 for best sustained long-running results

## Browser APIs (Guidance for Generated Applications)

**Prompt API (W3C WebML CG):**
- **Purpose:** On-device LLM inference using browser's built-in model
- **Where:** Chrome 138+ (Gemini Nano), Microsoft Edge (Phi-4-mini)
- **Skill:** `plugins/application-dev/skills/browser-prompt-api/SKILL.md`
- **Model Download:** ~22 GB disk space required (one-time)
- **Hardware:** GPU >4 GB VRAM OR CPU >=16 GB RAM
- **Features Supported:**
  - N-shot prompting via `initialPrompts`
  - Structured outputs via `responseConstraint` (JSON Schema, RegExp)
  - Streaming via `promptStreaming`
  - Tool use with automatic execution
  - Multimodal inputs (text, images)
  - Session management with context preservation

**WebLLM (MLC-AI):**
- **Purpose:** LLM chat and completions with WebGPU acceleration
- **Package:** `@mlc-ai/web-llm`
- **Models Supported:** Llama, Phi, Gemma, Mistral, Qwen, DeepSeek, and others (MLC-compiled)
- **Skill:** `plugins/application-dev/skills/browser-webllm/SKILL.md`
- **API:** OpenAI-compatible (`engine.chat.completions.create()`)
- **Acceleration:** WebGPU (GPU), WASM (CPU fallback)
- **Fallback:** CPU inference if GPU unavailable
- **Features:**
  - Streaming responses
  - JSON mode (structured outputs)
  - Function calling (tool use)
  - Model download and client-side caching

**WebNN (W3C):**
- **Purpose:** Hardware-accelerated neural network inference (NPU, GPU, CPU)
- **Spec:** W3C Candidate Recommendation Draft
- **Skill:** `plugins/application-dev/skills/browser-webnn/SKILL.md`
- **Backend Options:** NPU (low-power, best performance), GPU, CPU
- **Use Cases:** Image classification, audio processing, ONNX-converted models
- **Security:** HTTPS only, Permissions Policy `allow="webnn"` for cross-origin iframes
- **Graph API:** `MLGraphBuilder` for constructing inference graphs
- **Inference-Only:** No training or fine-tuning

## Testing & QA Infrastructure

**playwright-cli:**
- **Purpose:** Browser automation for QA testing
- **Required:** Binary on PATH (not npm package)
- **Used By:** Evaluator agent
- **Capabilities:**
  - Navigation and page interaction
  - Accessibility snapshots (element ref IDs)
  - Screenshot capture
  - Form filling and clicking
  - Console and network inspection
  - Keyboard/mouse simulation
- **Integration:** Evaluator launches dev server, then controls browser via `playwright-cli` commands
- **Not Required:** Evaluator provides embedded usage instructions -- playwright skill not needed

## Data Storage (Guidance for Generated Applications)

**Local Storage Options (No External Service Required):**
- Browser localStorage API
- IndexedDB
- File System Access API (user-granted)

**Backend Database Options (Generator May Choose):**
- SQLite (serverless, file-based)
- PostgreSQL (if backend server required)
- Other databases as needed

**Constraints from Plugin:**
- No default cloud storage
- Plugin does not specify data persistence approach
- Generator chooses based on product requirements
- Spec calls out data persistence approach in Non-Functional Considerations section

## Authentication & Identity

**Approach:**
- Plugin does not require or implement authentication
- Generated applications may include custom auth if specified in SPEC.md
- No OAuth/third-party identity providers integrated by default
- If authentication needed: Generator implements custom auth or instructs how to add it

## Monitoring & Observability

**Error Tracking:**
- Not integrated by plugin
- Generated applications may include browser console logging
- Evaluator checks `playwright-cli console` for JavaScript errors during testing

**Logs:**
- Evaluator collects and reports:
  - Accessibility snapshots (element structure)
  - Screenshots (visual state)
  - Console errors and warnings
  - Network responses

## CI/CD & Deployment

**Hosting (Guidance, Not Integrated):**
- Depends on Generator's tech stack choice
- Static hosting for single-page apps (Vercel, Netlify, GitHub Pages)
- Server hosting for full-stack apps (AWS, Heroku, DigitalOcean, Railway, etc.)

**CI Pipeline:**
- Not integrated by plugin
- Generator may create GitHub Actions workflows if app includes it
- No external CI service configured by plugin

## Environment Configuration

**Plugin (Not User-Configurable):**
- Agent models: `model: inherit` in `plugins/application-dev/agents/*.md`
- No environment variables required to run plugin
- No secrets or credentials needed

**Generated Applications (Per-Project):**
- `NODE_ENV` - development/production
- `PORT` - dev server port (5173 for Vite, 3000 for Next.js)
- Optional: Database URLs, API keys (if backend integrates external services)
- Evaluator expects: Project can start from `npm run dev` or `python app.py`

## Webhooks & Callbacks

**None Integrated:**
- Plugin does not provide webhook endpoints
- Generated applications may include webhook endpoints if specified in SPEC.md
- File protocol used instead: `SPEC.md` -> Generator -> `QA-REPORT.md` -> feedback loop

## Design & Reference Materials

**Bundled Design Principles:**
- Location: `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md`
- Source: Derived from Anthropic's frontend-design skill (Apache 2.0)
- Used By: Planner and Generator to produce distinctive, non-generic visual design
- Covers: Typography, color, spatial composition, motion, anti-patterns

## Skill References (Bundled in Plugin)

**Graceful Degradation Pattern:**
- Location: `plugins/application-dev/skills/browser-prompt-api/references/graceful-degradation.md`
- Purpose: Guide generators on handling unsupported browsers and unavailable models
- Used By: Generator when implementing Prompt API features

## External Documentation References (Not Integrated)

**Specs and Standards:**
- W3C Prompt API: https://github.com/webmachinelearning/prompt-api
- W3C WebNN: https://www.w3.org/TR/webnn/
- Chrome AI docs: https://developer.chrome.com/docs/ai/prompt-api

**Generator Guidance:**
- Based on Anthropic research: "Harness design for long-running application development" (2026)
- Locally available at: `research/anthropic-harness-design-for-long-running-application-development.md`

## Research Materials (Repo-Only)

**Not Shipped to Users:**
- `research/agent-skills-spec.md` - Internal agent skill specification
- `research/anthropic-harness-design-for-long-running-application-development.md` - GAN-inspired architecture reference
- `research/github-copilot/` - Copilot CLI research (deprecated, removed from Generator)

---

*Integration audit: 2026-03-27*
