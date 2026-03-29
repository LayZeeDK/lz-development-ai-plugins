# Requirements: application-dev Plugin v1 Hardening

**Defined:** 2026-03-28
**Core Value:** Hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration.

## v1 Requirements

Requirements for the v1 hardening milestone. Each maps to roadmap phases.

### Orchestrator Integrity

- [x] **ORCH-01**: Orchestrator skill must never perform agent work -- only delegate to agents, read output files, and coordinate the loop
- [x] **ORCH-02**: When an agent spawn fails (API error, rate limit, timeout), orchestrator retries up to 2 times then errors out with diagnostic -- never falls back to doing the work itself
- [x] **ORCH-03**: Orchestrator only passes to agents what is described in SKILL.md -- no extra context leaking beyond the defined file protocol
- [x] **ORCH-04**: Tool allowlists audited and tightened per agent role based on GAN separation of concerns (Generator: build tools, Evaluator: read + QA write, Planner: read + spec write, Orchestrator: agent spawn + read)
- [x] **ORCH-05**: Two-layer enforcement model per agent: structural tool allowlists (`tools` frontmatter) plus behavioral prompt guards (output-domain constraints in agent instructions). Plugin hooks dropped -- hooks are session-wide and cannot distinguish between agents, making them unsuitable for per-role enforcement.
- [x] **ORCH-06**: Belt-and-suspenders tool restriction uses two layers: `tools` allowlist (structural, enforced by runtime) + prompt guards (behavioral, enforced by agent instructions). `disallowedTools` is not available on skills/agents; plugin hooks dropped (session-wide scope). The two layers provide defense-in-depth without the infeasible four-layer design.
- [x] **ORCH-07**: Orchestrator maintains workflow state in a file (current step, round number, agent status) so it can resume the correct workflow step after user interruptions, error recovery, or context compaction

### Git Workflow

- [x] **GIT-01**: SPEC.md is committed to git after the Planner generates it (orchestrator commits on Planner's behalf since Planner has no Bash tool)
- [x] **GIT-02**: Generator commits frequently throughout its build (feature-by-feature), not just at round end
- [x] **GIT-03**: Generator adds/updates .gitignore with node_modules/, build output folder, and .playwright-cli/
- [x] **GIT-04**: Evaluator commits QA report and related artifacts into qa/round-N/ folder per round
- [x] **GIT-05**: Milestone git tags at key points: after planning, after each build/QA round, after final result

### Loop Control

- [x] **LOOP-01**: Score-based exit with plateau detection replaces fixed 3-round limit -- stop when total score improvement falls below threshold (<=1 point across all criteria over 3-round window)
- [x] **LOOP-02**: 10-round safety cap prevents runaway token costs
- [x] **LOOP-03**: Wrap-up phase when safety cap is hit -- Generator consolidates into working state, Evaluator produces final report documenting remaining gaps (Ralph Loop influence)
- [x] **LOOP-04**: Four exit conditions ordered by priority: PASS (all criteria meet thresholds), PLATEAU (scores converged), REGRESSION (2 consecutive total-score declines), SAFETY CAP (10 rounds reached)
- [x] **LOOP-05**: Escalation vocabulary (E-0 Normal through E-IV Catastrophic) structures orchestrator exit decisions into a named, debuggable framework
- [x] **LOOP-06**: Feature count watchdog -- detect when Generator games scores by removing hard-to-implement features between rounds (Evaluator performs the check; results feed into orchestrator's convergence loop)
- [x] **LOOP-07**: Generator scope constraint in rounds 2+ (cybernetics damping principle) -- fix only what the Evaluator flagged, do not add new features or refactor working code
- [x] **LOOP-08**: Context loading order optimization -- present QA-REPORT.md before SPEC.md to Generator in rounds 2+ to prime fixing behavior over building behavior
- [x] **LOOP-09**: Score trajectory tracking across rounds in a progress file that survives context compaction

### Template Extraction (Phase 02.1 -- INSERTED)

- [x] **TPL-01**: SPEC-TEMPLATE.md exists in references/ with all canonical section headings extracted from planner.md's inline format specification
- [x] **TPL-02**: EVALUATION-TEMPLATE.md exists in references/ with scores table format matching the appdev-cli.mjs extractScores() regex contract, and WARNING comments marking parsed sections
- [x] **TPL-03**: appdev-cli.mjs extractScores() regex is unchanged -- the template preserves the exact parse contract (criterion names, score format, verdict heading)
- [x] **TPL-04**: planner.md references SPEC-TEMPLATE.md via `${CLAUDE_PLUGIN_ROOT}` path and no longer contains the inline format code block
- [x] **TPL-05**: evaluator.md references EVALUATION-TEMPLATE.md via `${CLAUDE_PLUGIN_ROOT}` path and no longer contains the inline format code block

### Evaluator Quality

- [x] **EVAL-01**: Evaluator validates assets: catches broken images, blocked cross-origin requests (CORS/CORP/COEP), placeholder content, and stolen/unattributed images
- [x] **EVAL-02**: Evaluator probes AI features adversarially: sends varied inputs, nonsense queries, semantic rephrasings to detect keyword-triggered canned responses vs real AI inference
- [x] **EVAL-03**: Evaluator scoring calibration -- anti-leniency phrasing, mandatory bug-finding before scoring, score anchoring to rubric descriptors with few-shot calibration examples
- [x] **EVAL-04**: Evaluator checks for broken links and blocked asset/document/XHR requests
- [x] **EVAL-05**: Evaluator verifies images are not all placeholders -- visual-heavy sites must have real visual content

### Generator Quality

- [x] **GEN-01**: Generator runs CI checks (typecheck, build, lint, test) as inner feedback loop before handing off to Evaluator
- [x] **GEN-02**: Generator has browser-* AI skills (Prompt API, WebLLM, WebNN) preloaded via `skills` frontmatter so it can implement real AI features
- [x] **GEN-03**: Generator is aware of image sourcing approaches (web search with license verification, build-time generation via npm packages or browser AI + playwright screenshot, procedural/SVG generation) as examples, not prescriptions -- Generator remains tech stack-agnostic
- [x] **GEN-04**: Generator prefers Vite+ over Vite for greenfield web projects (preference, not mandate)
- [x] **GEN-05**: Generator must not fabricate/hallucinate image URLs -- all external URLs must be verified accessible
- [x] **GEN-06**: Generator uses latest stable versions of chosen frameworks/libraries unless the user prompt specifies otherwise

### Bundled Skills

- [x] **SKILL-01**: Vite+ skill bundled with the plugin providing correct vp CLI usage, config format, and toolchain documentation (Vite+Rolldown+tsdown, tsgo+Oxlint+Oxfmt, Vitest, vp run)

### Agent Definition Optimization (Phase 5)

- [x] **OPT-01**: Agent definitions use progressive disclosure -- protocol-heavy content (AI Slop Checklist, Asset Validation protocol) extracted to reference files, behavioral guidance stays inline, extraction threshold is ~30 lines + single-step-relevance
- [x] **OPT-02**: Evaluator Self-Verification deduplicated -- single instance in Step 14 of the workflow, standalone duplicate section removed
- [x] **OPT-03**: AI Slop Checklist extracted to references/evaluator/AI-SLOP-CHECKLIST.md with Read instruction in evaluator.md Step 5
- [x] **OPT-04**: SKILL.md restructured -- imperative voice consistently, workflow section before design rationale, educational content Claude already knows trimmed
- [x] **OPT-05**: No regression in appdev-cli integration, file-based communication protocol, agent prompt protocol, or regex-parsed output formats (Scores table, Verdict heading, evaluation file paths)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Profiles

- **PROF-01**: Budget/balanced/quality profiles determining model selection and round behavior
- **PROF-02**: Configurable round count or target grade via user prompt or config

### Production Output

- **PROD-01**: Generator produces static build output and static serve/run instructions (no dev server)
- **PROD-02**: Evaluator evaluates static serve/run, not development server

### Compliance

- **COMP-01**: Accessibility compliance evaluation (opt-in WCAG criteria)
- **COMP-02**: Web Core Vitals optimization evaluation (opt-in LCP, FID, CLS)

### Advanced Evaluation

- **AEVAL-01**: Chrome DevTools MCP/browser-agent integration for deeper Evaluator inspection
- **AEVAL-02**: Google Web Codegen Scorer integration for benchmarking

### Advanced AI

- **AAI-01**: Dedicated AI image generation skill/tool for build-time asset creation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Sprint-based decomposition (v1 harness) | Anthropic article v2 explicitly removed sprints; Opus 4.6 handles long coherent sessions |
| Real-time collaboration/multiplayer | Massive complexity, zero v1 value |
| User accounts/authentication (unless spec requires) | Adds backend complexity without improving core experience |
| Autopoietic learning (cybernetics) | Requires multi-session infrastructure beyond our single-run architecture |
| Context rotation (Ralph Loop) | Monolithic Ralph Loop pattern; our GAN architecture uses fresh context per agent spawn instead |
| Double bind detection (cybernetics) | Requires longer iteration horizons than 10-round single-run |
| VSM dashboard (cybernetics) | Monitoring infrastructure beyond v1 scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ORCH-01 | Phase 1 | Complete |
| ORCH-02 | Phase 1 | Complete |
| ORCH-03 | Phase 1 | Complete |
| ORCH-04 | Phase 1 | Complete |
| ORCH-05 | Phase 1 | Complete |
| ORCH-06 | Phase 1 | Complete |
| ORCH-07 | Phase 1 | Complete |
| GIT-01 | Phase 2 | Complete |
| GIT-02 | Phase 2 | Complete |
| GIT-03 | Phase 2 | Complete |
| GIT-04 | Phase 2 | Complete |
| GIT-05 | Phase 2 | Complete |
| LOOP-01 | Phase 2 | Complete |
| LOOP-02 | Phase 2 | Complete |
| LOOP-03 | Phase 2 | Complete |
| LOOP-04 | Phase 2 | Complete |
| LOOP-05 | Phase 2 | Complete |
| LOOP-06 | Phase 2 | Complete |
| LOOP-07 | Phase 2 | Complete |
| LOOP-08 | Phase 2 | Complete |
| LOOP-09 | Phase 2 | Complete |
| TPL-01 | Phase 02.1 | Complete |
| TPL-02 | Phase 02.1 | Complete |
| TPL-03 | Phase 02.1 | Complete |
| TPL-04 | Phase 02.1 | Complete |
| TPL-05 | Phase 02.1 | Complete |
| EVAL-01 | Phase 3 | Complete |
| EVAL-02 | Phase 3 | Complete |
| EVAL-03 | Phase 3 | Complete |
| EVAL-04 | Phase 3 | Complete |
| EVAL-05 | Phase 3 | Complete |
| GEN-01 | Phase 4 | Complete |
| GEN-02 | Phase 4 | Complete |
| GEN-03 | Phase 4 | Complete |
| GEN-04 | Phase 4 | Complete |
| GEN-05 | Phase 4 | Complete |
| GEN-06 | Phase 4 | Complete |
| SKILL-01 | Phase 4 | Complete |
| OPT-01 | Phase 5 | Complete |
| OPT-02 | Phase 5 | Complete |
| OPT-03 | Phase 5 | Complete |
| OPT-04 | Phase 5 | Complete |
| OPT-05 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-29 after Phase 05 completion*
