# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Multi-agent GAN-inspired orchestration for autonomous application development

**Key Characteristics:**
- Three specialized agents forming an adversarial feedback loop (Planner → Generator ← Evaluator)
- File-based communication through `SPEC.md` (product spec) and `QA-REPORT.md` (QA findings)
- Autonomous build/QA cycles (up to 3 rounds) without user intervention after initial prompt
- Separation of generation and evaluation to prevent self-praise bias
- Skill-based support system for browser APIs and design guidance

## Layers

**Command Layer:**
- Purpose: Entry point for user interaction
- Location: `plugins/application-dev/commands/application-dev.md`
- Contains: Slash command definition that accepts user's application prompt
- Depends on: Skill layer (orchestrator)
- Used by: Claude Code users triggering `/application-dev`

**Orchestration Layer (Skill):**
- Purpose: Coordinates the three-agent workflow and file-based communication
- Location: `plugins/application-dev/skills/application-dev/SKILL.md`
- Contains: Step-by-step workflow logic, agent spawning logic, verdict checking (PASS/FAIL), loop control (max 3 rounds)
- Depends on: Agent layer (Planner, Generator, Evaluator)
- Used by: Command layer, triggered when user runs `/application-dev`
- Key responsibility: Enforce workflow sequence (Plan → Build/QA loop → Summary), read/verify output files

**Agent Layer:**
- Purpose: Execute specialized roles in the development and evaluation process
- Location: `plugins/application-dev/agents/`
- Contains: Three agent definitions (planner.md, generator.md, evaluator.md)
- Depends on: Skill layer (application-dev), reference materials, file I/O tools
- Used by: Orchestration layer via Agent() calls

**Planner Agent:**
- Location: `plugins/application-dev/agents/planner.md`
- Responsibilities: Transform user's 1-4 sentence prompt into ambitious product spec (10-16+ features)
- Output: `SPEC.md` with product overview, visual design language, user journey, features with user stories, AI integration points, constraints/non-goals
- Tools: Read (frontend design principles), Write (SPEC.md)
- Design resource: `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md`

**Generator Agent:**
- Location: `plugins/application-dev/agents/generator.md`
- Responsibilities: Build complete application from SPEC.md; iterate based on QA-REPORT.md feedback
- Output: Working application files + git commits
- Tools: Read, Write, Edit, Glob, Bash
- Behavior: Tracks build round; reads prior QA feedback in rounds 2+; implements features incrementally; self-tests before finishing
- Decision logic: Chooses tech stack (honors constraints from SPEC.md if specified); selects AI implementation (Prompt API vs WebLLM vs WebNN based on spec requirements)

**Evaluator Agent:**
- Location: `plugins/application-dev/agents/evaluator.md`
- Responsibilities: QA test running application against SPEC.md; find bugs; grade against four criteria
- Output: `QA-REPORT.md` with verdict (PASS/FAIL), scored table, feature status, bugs grouped by root cause, regression detection, priority fixes
- Tools: Read, Write, Glob, Bash
- Behavior: Adversarial mindset (tries to break app), regression detection (rounds 2+), skeptical scoring, specific bug reporting with steps to reproduce
- Scoring criteria: Product Depth (7/10 threshold), Functionality (7/10 threshold), Visual Design (6/10 threshold), Code Quality (6/10 threshold)

**Skill Support Layer:**
- Purpose: Provide implementation guidance for browser-based AI features
- Location: `plugins/application-dev/skills/`
- Contains: Three specialized skills for browser AI integration
- Dependencies: Optional; used by Generator only when SPEC.md describes AI features
- Reference materials bundled with each skill

## Data Flow

**Round 1 (Initial Build):**

1. User invokes `/application-dev "<prompt>"` → Command layer routes to Orchestration skill
2. Orchestration skill → spawns Planner agent with user prompt
3. Planner → reads `frontend-design-principles.md`, writes `SPEC.md` to working directory
4. Orchestration skill → verifies `SPEC.md` exists and contains required sections
5. Orchestration skill → spawns Generator with "Build from SPEC.md, round 1"
6. Generator → reads `SPEC.md`, chooses tech stack, implements all features, writes project files, commits to git
7. Orchestration skill → spawns Evaluator with "Evaluate against SPEC.md, round 1"
8. Evaluator → starts dev server, uses playwright-cli to interact with running app, reads source code, writes `QA-REPORT.md`
9. Orchestration skill → reads `QA-REPORT.md`, checks Verdict field
10. If PASS → proceed to Step 3 (Summary). If FAIL and rounds < 3 → proceed to Round 2.

**Round 2+ (Iterative Improvement):**

1. Orchestration skill → spawns Generator with "Build round N, read QA-REPORT.md"
2. Generator → reads `SPEC.md` and `QA-REPORT.md`, identifies root causes from grouped bugs, makes targeted fixes, preserves working code, commits
3. Orchestration skill → spawns Evaluator with "Evaluate against SPEC.md, round N"
4. Evaluator → regression test (verifies features marked "Implemented" in prior report still work), finds new issues, checks if previous bugs are fixed, writes updated `QA-REPORT.md`
5. Orchestration skill → reads verdict, loops or advances

**Summary Phase:**

1. Orchestration skill → reads final `QA-REPORT.md` and project `README.md`
2. Presents to user: product name, key features implemented (from QA report feature table), final scores, number of rounds, how to run the app

**State Management:**

- `SPEC.md`: Immutable product specification created once by Planner; read by Generator and Evaluator every round
- `QA-REPORT.md`: Overwritten each Evaluator round; contains verdict, scores, feature status table, bugs grouped by root cause, regression detection (rounds 2+)
- Project files: Mutable; Generator writes/edits across rounds; Evaluator reads only; git history preserved for regression diagnosis
- Working directory: Single directory shared by all agents (no separate project directories)

## Key Abstractions

**Product Specification (SPEC.md):**
- Purpose: Contract between Planner and Generator; evaluation rubric for Evaluator
- Structure: Overview → Visual Design Language → User Journey → Constraints/Non-Goals → Features (Core/Important/Nice-to-have with user stories) → AI Integration → Non-Functional Considerations
- Pattern: Planner expands user's brief prompt into ambitious, detailed product vision with aesthetic direction and feature prioritization

**QA Report (QA-REPORT.md):**
- Purpose: Feedback loop from Evaluator to Generator; visibility into build quality to Orchestration
- Structure: Verdict (PASS/FAIL) → Scores table → Feature status table (Implemented/Partial/Missing/Broken) → Bugs grouped by root cause → Visual design assessment → Code quality assessment → Regressions (rounds 2+) → Priority fixes
- Pattern: Bugs grouped by shared root cause rather than listed individually, enabling Generator to fix causes not symptoms

**Browser AI Skills:**
- `browser-prompt-api`: In-browser LLM inference using browser's built-in model (Gemini Nano, Phi-4-mini); feature detection, session management, structured outputs via JSON Schema/RegExp, streaming, tool use
- `browser-webllm`: MLC-compiled LLMs (Llama, Phi, Mistral, etc.) with WebGPU acceleration; OpenAI-compatible chat API, streaming, JSON mode, function calling
- `browser-webnn`: W3C WebNN API for neural network inference graphs; NPU acceleration, ONNX model support; inference-only
- Pattern: Each skill provides feature-detect patterns, graceful degradation guidance, and code examples; Generator chooses based on SPEC.md requirements

**Design System Reference:**
- Purpose: Prevent generic "AI-slop" aesthetics (purple gradients, default framework components, cookie-cutter layouts)
- Location: `plugins/application-dev/skills/application-dev/references/frontend-design-principles.md`
- Pattern: Four design questions (Purpose, Tone, Constraints, Differentiation), actionable guidance on typography, color, spatial composition, motion; used by Planner to define design language and by Generator to implement it

## Entry Points

**User-Facing Entry Point:**
- Location: `/application-dev <prompt>`
- Triggers: Command layer (application-dev.md)
- Responsibilities: Parse user prompt, route to Orchestration skill

**Orchestration Entry Point:**
- Location: `plugins/application-dev/skills/application-dev/SKILL.md`
- Triggers: Command layer; spawns agents via Agent() calls
- Responsibilities: Coordinate workflow, spawn Planner → loop (spawn Generator → spawn Evaluator, check verdict) → output summary

**Agent Entry Points (Spawned by Orchestration):**
- Planner: Receives user prompt verbatim; writes SPEC.md
- Generator: Receives "Build round N" instruction + prior QA-REPORT.md if N > 1; writes project files and commits
- Evaluator: Receives "Evaluate round N" instruction; starts dev server, runs browser tests, writes QA-REPORT.md

## Error Handling

**Strategy:** File-based validation, explicit retry triggers, agent self-recovery, human-readable error feedback

**Patterns:**

1. **Missing/Incomplete Output Files:** Orchestration skill re-spawns agent with explicit note about what is missing (e.g., "re-spawn Planner with note about missing visual design language section")

2. **Build Failures:** Generator includes `npm run dev` / `python app.py` self-test; if server does not start, fix before finishing; Bash errors surfaced via tool output

3. **QA Report Malformation:** If QA-REPORT.md verdict or scores table missing, Orchestration re-spawns Evaluator with note to regenerate full report

4. **Regression Detection:** Evaluator compares QA-REPORT.md feature status table (rounds 2+) with prior report; flags regressions as high-priority

5. **Application Crashes:** Evaluator tests error states (empty forms, invalid data); Bash commands in Generator/Evaluator catch exit codes; tool failures surface in chat output

## Cross-Cutting Concerns

**Logging:** No centralized logging layer; agents use bash output and console logging within generated applications. Evaluator inspects `playwright-cli console` and `network` output for JavaScript errors.

**Validation:** Generator implements form validation and error handling in application code per spec. Evaluator tests invalid inputs to verify error handling. Orchestration validates file contents (SPEC.md sections, QA-REPORT.md verdict field).

**Authentication:** Not a concern; this is an autonomous development tool, not a user-facing app. Generated applications may include auth if specified in SPEC.md.

**Design Consistency:** Enforced by Planner defining visual design language in SPEC.md, Generator implementing per that language, Evaluator scoring visual design against the spec's design language description (not generic ideals). Design principles reference guides both Planner and Generator toward intentional, non-generic aesthetics.

**Tech Stack Flexibility:** Generator respects constraints from SPEC.md ("using React," "with Web Audio API") but chooses freely otherwise. Evaluator does not penalize tech stack choices; evaluates against spec requirements regardless of implementation technology.

**AI Feature Integration:** Generator detects AI-feature requirements in SPEC.md (look for "AI", "assistant", "LLM", "on-device", "browser-local" sections). Follows graceful degradation pattern from skill references (feature-detect, check availability, fall back if unsupported). All AI kept in-browser per SPEC.md privacy/offline constraints; never switches to remote APIs as fallback.

---

*Architecture analysis: 2026-03-27*
