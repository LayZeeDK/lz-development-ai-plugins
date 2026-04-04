# Quick Task 260404-ft9: Resolve issues identified during v1.2 Dutch art museum test - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Task Boundary

Resolve 7 issues identified during the v1.2 Dutch art museum website test session. Issues span the Orchestrator, Generator, and Evaluation (critic) agents within the application-dev plugin.

Reported issues:
1. Orchestrator output cleared -- unable to see progress or running sub-agents (context compaction in long multi-agent sessions)
2. Evaluation agents crashed/lost context without committing results -- silent failures
3. Generator chose React Router for a content website -- heavyweight, unnecessary
4. Generator used default React Router favicon.ico
5. Generator used external image URLs instead of bundling locally -- Wikimedia 429 errors
6. Perturbation critic wrote test results to duplicate nested path
7. Projection critic passed invalid `--test-dir` flag to Vitest

</domain>

<decisions>
## Implementation Decisions

### Image handling
- Generator MUST download images during generation and commit them to public/
- External URLs for images are acceptable sources IF license-compliant (e.g., Wikimedia Commons public domain)
- Attribution must be respected -- include license info alongside bundled images
- No runtime external image fetches in the generated application

### Framework selection
- For **website** prompts (museum, portfolio, blog, landing page): zero-meta-framework dependency. Output is static HTML/CSS with vanilla JS for interactivity. No build step, no framework runtime.
- For **app** prompts (dashboard, task manager, chat): SPA with Vite + vanilla JS or Vite + React is acceptable.
- The **Planner does NOT specify tech stack** -- existing rule (planner.md line 44) stays. No project_type field in SPEC.md.
- The **Generator** classifies the project type itself from the SPEC content and applies the website/app heuristic to guide its own framework choice.
- The `spa` field in appdev-cli state should reflect the actual project type, not default to `true`.

### Critic failure handling
- **Sequential critic spawning** -- spawn critics one at a time instead of parallel. Trades speed for reliability given platform bugs (agent freeze #37521, memory leaks #32304, context dump #14118).
- **Git commit checkpoint** after all 3 critics finish, before compile-evaluation. Single commit: `git add evaluation/round-N/` then `git commit -m "eval(round-N): critic summaries"`.
- **Reduce critic context consumption** -- add explicit instructions for summary reporters, fewer screenshots, write-and-run discipline.
- Binary file-exists checks already sufficient for detection (no change needed).

### Output clearing
- Sequential critics is enough -- reduces context pressure on orchestrator session.
- No progress log file needed. Document context compaction as known behavior.
- Platform issue: context compaction clears terminal output when orchestrator context grows large. No plugin-level fix.

### Favicon
- Generator should produce a project-appropriate favicon, not use framework defaults.

### Critic path bugs
- Add path construction guardrails with negative examples to all 3 critic agents.
- Add negative instruction to projection-critic: do not pass `--test-dir` flag.
- Fix static-serve TOCTOU race: re-read state after acquiring mutex.

### Claude's Discretion
- Issue #1 (output clearing): Documented as platform limitation, no code fix
- Specific fix approaches for TOCTOU race and path nesting bugs

</decisions>

<specifics>
## Specific Ideas

- The Generator's Tech Stack Selection section gets a project-type classification heuristic: read SPEC.md content, classify as website vs. app, apply framework guidance accordingly
- For websites, the Generator's heuristic should guide toward "static HTML/CSS/JS, vanilla JS only for interactivity"
- Image download could use the same fetch mechanism the Generator already has access to (Bash curl/wget)
- Static-serve TOCTOU fix: move idempotent check inside mutex (re-read state after lock acquisition)

</specifics>

<canonical_refs>
## Canonical References

- Test output: D:\projects\sandbox\application-dev-test\v1.2\dutch-art-museum-website
- Session logs: C:\Users\LarsGyrupBrinkNielse\.claude\projects\D--projects-sandbox-application-dev-test-v1-2-dutch-art-museum-website
- Plugin source: plugins/application-dev/
- Claude Code bugs research: .planning/quick/260404-ft9-resolve-issues-identified-during-v1-2-du/260404-ft9-RESEARCH-claude-bugs.md
- Key platform bugs: #24181 (classifyHandoffIfNeeded), #14867 (no subagent auto-compact), #37521 (agent freeze), #32304 (memory leak)

</canonical_refs>
