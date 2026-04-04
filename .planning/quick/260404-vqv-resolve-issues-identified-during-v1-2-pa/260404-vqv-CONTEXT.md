# Quick Task 260404-vqv: Resolve issues identified during v1.2 patch.0 Dutch art museum test - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Task Boundary

Resolve issues identified during v1.2 "patch.0" Dutch art museum test. Issues span the orchestrator skill, generator agent, and evaluator workflow. End result and Git repo at D:\projects\sandbox\application-dev-test\v1.2-patch.0\dutch-art-museum-website.

Milestone v1.2 "patch.0" tested for Dutch art museum website using Opus 4.6 (1M context) with medium reasoning effort.

### Issues by component

**Step 0.x (Orchestrator workspace setup):**
- Tried to install hallucinated @anthropic-ai/claude-code-playwright package

**Orchestrator:**
- Output cleared during Generation round 2

**Generator:**
- Uses React TSX for website, not vanilla HTML/CSS/JS (violated own project-type heuristic)
- Uses Vite not Vite+
- Uses Vite favicon (framework default not replaced)
- Round 1 crashed the session (after being respawned following usage limit reset)
- Left uncommitted assets (default Vite/React images)
- Left uncommitted Playwright screenshots
- ASSETS.md contains "local" instead of URL for bundled images

**Evaluator:**
- Hit usage limit when Projection critic round 3 was completing
- EVALUATION.md wasn't committed for any rounds (gap in orchestrator flow)
- Still double static serve start and clipboard error on Windows

</domain>

<decisions>
## Implementation Decisions

### Tech stack enforcement
- The generator's existing project-type heuristic (generator.md:46-69) correctly classifies "museum" as a website and prescribes vanilla HTML/CSS/JS. The Generator ignored its own heuristic.
- Fix: strengthen the guardrail language, do not change the policy. Vanilla is correct for websites.
- Vanilla JS is also correct for AI features -- Built-in AI APIs (LanguageModel, Summarizer, etc.) are browser-native APIs with zero framework dependency.
- When classification is ambiguous, prefer "website" (already stated but ignored).

### ASSETS.md format (Dual URL required)
- Every bundled image must list both: original source URL + local path.
- The URL column must never contain "local" for images downloaded from external sources.
- Add a Local Path column to the ASSETS-TEMPLATE.md for bundled images.
- This lets critics verify provenance and check-assets validate URLs even after bundling.

### EVALUATION.md commit discipline (Orchestrator commits after compile-evaluation)
- Add explicit git add + git commit for EVALUATION.md right after compile-evaluation, before round-complete.
- Sequence: (1) critic summaries commit, (2) compile-evaluation creates EVALUATION.md, (3) NEW: commit EVALUATION.md, (4) round-complete reads it, (5) tag.
- Commit message: `eval(round-N): compiled evaluation report`
- Rationale: crash-safe, single responsibility (orchestrator created it, orchestrator commits it), follows existing artifact-then-commit pattern.

</decisions>

<specifics>
## Specific Ideas

- The hallucinated @anthropic-ai/claude-code-playwright package should be removed from Step 0.5 install instructions. Only @playwright/test and serve are needed.
- The "double static serve start" clipboard error is a Windows-specific `serve` package issue -- investigate suppressing the clipboard copy attempt.
- Uncommitted assets (Vite/React default images, Playwright screenshots) need gitignore or explicit commit instructions.

</specifics>

<canonical_refs>
## Canonical References

- plugins/application-dev/skills/application-dev/SKILL.md -- orchestrator skill (Step 0.5 workspace setup, Step 2 evaluation phase)
- plugins/application-dev/agents/generator.md -- generator agent (Tech Stack Selection section, project-type heuristic)
- plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md -- ASSETS.md schema

</canonical_refs>
