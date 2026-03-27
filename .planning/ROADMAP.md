# Roadmap: application-dev Plugin v1 Hardening

## Overview

This milestone hardens the application-dev plugin from a working-but-fragile prototype into a reliable prompt-to-application system. The work moves from structural prerequisites (orchestrator integrity and role separation) through workflow mechanics (git version control and score-based looping) to agent-level quality improvements (Evaluator rigor, then Generator capabilities). Each phase delivers a verifiable capability that the next phase depends on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Orchestrator Integrity** - Enforce GAN role separation with tool allowlists, plugin hooks, and delegation-only orchestrator behavior
- [ ] **Phase 2: Git Workflow and Loop Control** - Add version control throughout the workflow and replace fixed round limits with score-based convergence detection
- [ ] **Phase 3: Evaluator Hardening** - Make the Evaluator an adversarial quality gate that catches broken assets, canned AI, and lenient scoring
- [ ] **Phase 4: Generator Hardening and Skills** - Give the Generator CI self-checks, AI feature skills, asset sourcing awareness, and the bundled Vite+ skill

## Phase Details

### Phase 1: Orchestrator Integrity
**Goal**: The orchestrator correctly delegates all work to agents and never performs agent tasks itself, with structural enforcement of role boundaries
**Depends on**: Nothing (first phase)
**Requirements**: ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, ORCH-06, ORCH-07
**Success Criteria** (what must be TRUE):
  1. When a user runs /application-dev and an agent spawn fails twice, the orchestrator errors out with a diagnostic message instead of attempting the agent's work
  2. Each agent (Planner, Generator, Evaluator) has a distinct tool allowlist that prevents cross-role tool usage -- Generator cannot use Evaluator tools and vice versa
  3. Plugin-level hooks enforce tool boundaries as defense-in-depth on top of allowlist and prompt guards
  4. The orchestrator passes only the file protocol described in SKILL.md to agents -- no extra context leaks into agent prompts
  5. A workflow state file tracks current step and round number so the orchestrator can resume after interruptions
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Git Workflow and Loop Control
**Goal**: Every agent commits its artifacts to git, and the orchestrator uses score-based convergence detection with named exit conditions to decide when to stop looping
**Depends on**: Phase 1 (agents need correct tool allowlists to use git; orchestrator must be delegation-only before adding loop logic)
**Requirements**: GIT-01, GIT-02, GIT-03, GIT-04, GIT-05, LOOP-01, LOOP-02, LOOP-03, LOOP-04, LOOP-05, LOOP-06, LOOP-07, LOOP-08, LOOP-09
**Success Criteria** (what must be TRUE):
  1. After running /application-dev, git log shows: a SPEC.md commit from the Planner, feature-by-feature commits from the Generator, and qa/round-N/ commits from the Evaluator -- with milestone tags at planning completion, each round, and final result
  2. The orchestrator stops looping when one of four named conditions fires: PASS (all criteria meet thresholds), PLATEAU (score improvement <=1 point over 3-round window), REGRESSION (2 consecutive total-score declines), or SAFETY CAP (10 rounds)
  3. When the safety cap is hit, the Generator consolidates into a working state and the Evaluator produces a final report documenting remaining gaps
  4. The orchestrator detects when the Generator removes features between rounds to game scores (feature count watchdog) and flags it in the exit decision
  5. In rounds 2+, the Generator fixes only what the Evaluator flagged -- it does not add new features or refactor working code
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Evaluator Hardening
**Goal**: The Evaluator catches the quality failures that slipped through in testing -- broken/stolen assets, canned AI responses, and lenient scoring
**Depends on**: Phase 2 (Evaluator needs qa/round-N/ folder structure from git workflow; score-based exit ensures enough rounds for adversarial testing to matter)
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05
**Success Criteria** (what must be TRUE):
  1. The Evaluator's QA report flags broken images, CORS-blocked resources, placeholder content, and images used without attribution -- with specific URLs and failure reasons
  2. The Evaluator sends varied inputs, nonsense queries, and semantic rephrasings to AI features and reports whether responses are real inference or keyword-triggered canned responses
  3. The Evaluator's scoring follows calibration examples and anti-leniency phrasing -- scores are anchored to rubric descriptors, not inflated
  4. The Evaluator checks all links and reports blocked asset/document/XHR requests with HTTP status codes
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Generator Hardening and Skills
**Goal**: The Generator produces higher-quality applications by self-checking with CI before Evaluator handoff, using real AI skills for in-app AI features, and sourcing assets responsibly
**Depends on**: Phase 3 (hardened Evaluator validates Generator improvements; without rigorous QA, Generator changes cannot be verified)
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, SKILL-01
**Success Criteria** (what must be TRUE):
  1. The Generator runs typecheck, build, and lint checks before handing off to the Evaluator -- CI failures are fixed in the same Generator turn, not deferred to QA
  2. The Generator has browser-* AI skills (Prompt API, WebLLM, WebNN) available via skills frontmatter and uses them to implement real AI features instead of keyword-matching if/else chains
  3. The Generator sources images through verifiable means (web search with license check, build-time generation, procedural/SVG) -- no fabricated URLs, no hotlinked external images without verification
  4. A Vite+ skill is bundled with the plugin providing correct vp CLI usage, and the Generator prefers Vite+ for greenfield web projects
  5. The Generator uses latest stable framework versions unless the user prompt specifies otherwise
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Orchestrator Integrity | 0/2 | Not started | - |
| 2. Git Workflow and Loop Control | 0/3 | Not started | - |
| 3. Evaluator Hardening | 0/2 | Not started | - |
| 4. Generator Hardening and Skills | 0/2 | Not started | - |
