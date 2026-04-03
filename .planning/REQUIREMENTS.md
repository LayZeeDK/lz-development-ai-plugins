# Requirements: application-dev v1.2

**Defined:** 2026-04-02
**Core Value:** Hands-off prompt-to-application development -- not prompt-to-partial-application. The final output must be a working application with real assets, real AI features, and quality driven by adversarial iteration.

## v1.2 Requirements

Requirements for the Dutch Art Museum Test Fixes milestone. Addresses all remaining issues from Dutch art museum test #1 and adds the perturbation-critic (Robustness dimension).

### Perturbation Critic

- [x] **CRITIC-01**: New perturbation-critic agent with adversarial testing methodology (targeted input perturbation, viewport extremes, rapid navigation, console monitoring under stress) that scores the Robustness dimension
- [x] **CRITIC-02**: Robustness dimension added to DIMENSIONS constant with threshold 6, including auto-built regex and compile-evaluation assessmentSections entry
- [x] **CRITIC-03**: Robustness ceiling rules and calibration scenarios (below/at/above threshold) added to SCORING-CALIBRATION.md
- [x] **CRITIC-04**: Clear methodology boundaries between perturbation-critic and existing critics to prevent duplicate findings (perturbation tests EXTREME conditions, not normal responsive/functionality)

### Convergence Logic

- [x] **CONV-01**: Plateau threshold scaled with DIMENSIONS.length (derived from maxTotal, not hardcoded <= 1)
- [x] **CONV-02**: Crisis threshold (E-IV Catastrophic) scaled with DIMENSIONS.length (derived from maxTotal, not hardcoded <= 5)
- [x] **CONV-03**: Per-dimension pass/fail status included in round-complete output (informational, not gating)
- [x] **CONV-04**: Per-dimension scores included in get-trajectory output for Summary step enrichment
- [x] **CONV-05**: EMA-smoothed score trajectory for convergence detection (backward-compatible: alpha=1.0 degenerates to raw scores)

### Orchestrator Integration

- [x] **ORCH-01**: 3-critic parallel spawn in evaluation phase (perceptual + projection + perturbation)
- [x] **ORCH-02**: Resume-check generalized from spawn-both-critics to spawn-all-critics (CLI output + SKILL.md dispatch updated atomically)
- [x] **ORCH-03**: Retry logic generalized for N critics ("retry each failed critic individually" not "retry both")
- [x] **ORCH-04**: SAFETY_CAP wrap-up round includes perturbation-critic spawn
- [x] **ORCH-05**: Architecture section updated from 4 to 5 agents with perturbation-critic description

### Enhanced Critics

- [x] **EVAL-01**: Perceptual-critic enhanced with cross-page visual consistency checks (design token extraction, color/typography/spacing comparison across pages)
- [x] **EVAL-02**: Projection-critic enhanced with A->B->A navigation testing (round-trip navigation, state persistence, back-button behavior)
- [x] **EVAL-03**: Visual Design calibration scenarios in SCORING-CALIBRATION.md updated for expanded cross-page scope

### Generator Improvements

- [ ] **GEN-01**: Browser-agnostic LanguageModel guidance referencing both Chrome (Gemini Nano) and Edge (Phi-4-mini) with graceful degradation
- [ ] **GEN-02**: Vite+ skill refreshed for official vp CLI workflow (vp create, vp check, vp test, vp build) with alpha stability caveats
- [ ] **GEN-03**: Dependency freshness checking step in Generator workflow or as CLI subcommand
- [ ] **GEN-04**: Strengthened Vite+ adoption guidance with compatibility escape hatch (Angular, Nuxt incompatible)

### Documentation

- [ ] **DOCS-01**: Architecture principles reference file (references/architecture-principles.md) grounding the plugin design in GAN, Cybernetics, and Turing test principles

## v1.3 Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Convergence Enhancements

- **CONV-06**: Z-score anomaly detection on per-round scores (flags mode collapse, hallucinated evaluations, statistically improbable jumps)
- **CONV-07**: Rising thresholds (round-indexed threshold escalation) -- needs empirical score distribution data from v1.2 test runs
- **CONV-08**: Dimension-weighted scoring (Functionality/Product Depth weighted higher than Visual Design/Robustness) -- needs calibration data

### Advanced Perturbation

- **CRITIC-05**: LLM-driven behavioral adversarial sequences (double-click submit during async, navigate away mid-form, resize during animation) -- high complexity, add after basic perturbation-critic proves out

### Data Collection

- **DATA-01**: Score distribution statistics collection (--collect-stats flag on round-complete) for data-driven threshold calibration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full browser fuzzing framework | Untargeted fuzzing generates unbounded noise; perturbation-critic uses targeted adversarial testing within ~60K token budget |
| Per-dimension exit conditions | Combinatorial explosion (4^4 = 256 states); per-dimension tracking is advisory, exit conditions remain total-score-based |
| Automated Playwright test generation from SPEC.md | Generated scripts depend on unknown DOM structures; projection-critic's write-and-run pattern with snapshot discovery is more robust |
| WebLLM/WebNN as LanguageModel fallback | Fundamentally different APIs; graceful degradation to non-AI functionality is the correct approach |
| Source code metrics for Robustness | Violates GAN information barrier; Robustness assessed from product surface only |
| Renaming Visual Design to Visual Coherence | Multi-file breaking change for no functional benefit; scope expansion is instruction-level, not contract-level |
| Budget/balanced/quality profiles | Configuration complexity; deferred to v2 |
| Accessibility compliance (WCAG) | Planned for v2.0 accessibility-critic |
| Agent teams | Critical Claude Code bugs (#30499, #24316, #31977) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRITIC-01 | Phase 11 | Complete |
| CRITIC-02 | Phase 11 | Complete |
| CRITIC-03 | Phase 11 | Complete |
| CRITIC-04 | Phase 11 | Complete |
| CONV-01 | Phase 12 | Complete |
| CONV-02 | Phase 12 | Complete |
| CONV-03 | Phase 12 | Complete |
| CONV-04 | Phase 12 | Complete |
| CONV-05 | Phase 12 | Complete |
| ORCH-01 | Phase 13 | Complete |
| ORCH-02 | Phase 13 | Complete |
| ORCH-03 | Phase 13 | Complete |
| ORCH-04 | Phase 13 | Complete |
| ORCH-05 | Phase 13 | Complete |
| EVAL-01 | Phase 14 | Complete |
| EVAL-02 | Phase 14 | Complete |
| EVAL-03 | Phase 14 | Complete |
| GEN-01 | Phase 15 | Pending |
| GEN-02 | Phase 15 | Pending |
| GEN-03 | Phase 15 | Pending |
| GEN-04 | Phase 15 | Pending |
| DOCS-01 | Phase 16 | Pending |

**Coverage:**
- v1.2 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after research synthesis*
