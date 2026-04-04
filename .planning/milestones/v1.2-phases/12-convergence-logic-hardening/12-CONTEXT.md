# Phase 12: Convergence Logic Hardening - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Convergence detection scales correctly with any number of scoring dimensions and provides per-dimension trajectory visibility. This covers: scaled thresholds (CONV-01, CONV-02), per-dimension pass/fail in round-complete (CONV-03), per-dimension scores in get-trajectory (CONV-04), and EMA-smoothed convergence detection (CONV-05).

</domain>

<decisions>
## Implementation Decisions

### Threshold scaling formulas

All hardcoded thresholds in `computeEscalation()` replaced with formulas derived from `maxTotal = DIMENSIONS.length * 10`. Three independent theoretical traditions converge on percentage-of-maxTotal: Hotelling T-squared (multivariate SPC control limits scale linearly with dimension count p), DCS deadband practice (express as percentage of full scale, ISA-18.2 / EEMUA 191), and Ashby's Requisite Variety (controller detection surface must scale with state space).

| Threshold | Current | Formula | Theory | N=3 | N=4 |
|---|---|---|---|---|---|
| E-IV crisis floor | `<= 5` | `ceil(maxTotal * 0.15)` | CISQ 3-sigma, Wiener zeta=0 (undamped divergence) | 5 | 6 |
| E-IV 50% drop | relative | unchanged | Already dimensionless (percentage of previous total) | -- | -- |
| E-III 2 declines | raw direction | hybrid: raw AND EMA | Simplex Architecture dual-path (Sha, 2001) | -- | -- |
| E-II plateau window | `<= 1` | `ceil(maxTotal * 0.05)` | DCS deadband 2-5% of full scale | 2 | 2 |
| E-0 progressing | `> 1` | `> ceil(maxTotal * 0.025)` | Neyman-Pearson cost asymmetry + Schmitt trigger 2:1 | >1 | >1 |
| E-I decelerating | direction | unchanged | Already dimensionless (delta shrinking) | -- | -- |

The E-0 threshold is ASYMMETRIC with E-II (2.5% vs 5%, ratio 2:1). This is NOT the same deadband applied in both directions. Three independent reasons:
1. Neyman-Pearson: false plateau exit costs 3-5x more than false continuation ($150-350 vs $30-70). Bayes-optimal threshold biases toward detecting progress.
2. Schmitt trigger: standard hysteresis ratio is 2:1 (biological precedent: mitotic entry 32-40nM vs exit 16-24nM). E-0 entry at 2.5%, E-II entry at 5%.
3. ISA CAP: 2% deadband is "just above noise level" for noisy signals. 2.5% sits correctly above the 1-point noise floor.
4. EMA dampening compensation: at alpha=0.4, EMA reflects ~40% of raw change. A symmetric 5% threshold would classify a 4-point raw improvement (10%!) as "Decelerating" because EMA dampens it to 1.6 (< 2). The 2.5% threshold compensates for this dampening.

### Per-dimension output shape

Two commands enhanced with per-dimension data, grounded in Mason-Young-Tracy decomposition (aggregate T2 + per-variable contributions) and Conant-Ashby Good Regulator Theorem ("every good regulator must contain a model of that system" -- the Generator needs per-dimension pass/fail to select correct corrective actions).

**round-complete (CONV-03):** Add `dimension_status` array alongside existing `scores` object. Array of objects follows the MYT decomposition pattern -- aggregate signal (verdict/total) plus per-variable contributions with metadata. MCL-GAN (NeurIPS 2022) confirms: multi-discriminator architectures maintain per-expert scores as vectors, not scalars.

```json
{
  "dimension_status": [
    { "name": "Product Depth", "key": "product_depth", "score": 7, "threshold": 7, "pass": true },
    { "name": "Functionality", "key": "functionality", "score": 6, "threshold": 7, "pass": false },
    { "name": "Visual Design", "key": "visual_design", "score": 7, "threshold": 6, "pass": true },
    { "name": "Robustness", "key": "robustness", "score": 5, "threshold": 6, "pass": false }
  ]
}
```

The `scores` object is preserved for backward compatibility. `dimension_status` is the diagnostic overlay, not a replacement. This mirrors MYT: T2 is the aggregate, decomposition is the diagnostic layer.

Per-dimension scores do NOT violate the GAN information barrier. In multi-discriminator architectures (MCL-GAN, Albuquerque et al. ICML 2019), per-expert-discriminator scores are the intended feedback mechanism. Scores tell the Generator WHERE to look without prescribing WHAT to do.

**get-trajectory (CONV-04):** Add `dimensions` keyed object per trajectory entry. Compact format for time-series extraction by the Summary step. Follows the MOEA Pareto front pattern (per-objective values preserved as vector per solution) and TensorBoard per-loss logging (flat dict keyed by name).

```json
{
  "trajectory": [
    { "round": 1, "total": 25, "dimensions": { "product_depth": 7, "functionality": 6, "visual_design": 7, "robustness": 5 }, "escalation": "E-0" }
  ]
}
```

Array format for round-complete (self-describing with metadata for immediate action), object format for trajectory (compact for trend extraction). No state schema change -- both commands map from data already stored per round.

### EMA smoothing strategy

EMA-smoothed total score trajectory for convergence detection, with dual-path signal architecture formally named the Simplex Architecture (Sha, 2001) / Safety Filter pattern (Hsu, Hu, Fisac 2024, Annual Reviews).

**Default alpha = 0.4:**
- CDC `alert_ewma` w1=0.4 for gradual shift detection (validated for noisy longitudinal data)
- NIST EWMA: lambda=0.2-0.3 for small shifts, scaled up for n<=10
- N_eff = 2/0.4 - 1 = 4 rounds. Time constant tau = 1.96 rounds.
- Our noise profile: 3-5 point swings (7.5-12.5% of maxTotal) from Generator stochasticity. Moderate-to-high noise, closer to CDC's regime.
- alpha=1.0 degenerates to raw scores (backward compatible per CONV-05)

**Dual-path signal architecture (Safety Filter pattern):**

Safety path (raw, immediate response):
- PASS verdict: actual quality, not smoothed. IEC 61511: no filtering on safety functions.
- E-IV catastrophic floor: safety interlock, minimum response time.
- E-IV 50% drop: safety interlock, immediate response.

Hybrid path (raw AND EMA must agree):
- E-III regression: 2 consecutive raw declines AND EMA trend confirms decline direction. Prevents false regression from noise (EMA filters single bad rounds) while catching genuine regression (raw detects when EMA agrees). Formally: `rawDelta < 0 AND prevRawDelta < 0 AND emaDelta < 0`.

Trend path (EMA, noise-filtered):
- E-II plateau: EMA 3-round window improvement <= plateauThreshold
- E-I decelerating: EMA delta positive but shrinking
- E-0 progressing: EMA delta > progressingThreshold

Hsu et al. (2024) Proposition 1 formally proves safety can be designed independently of task objectives. This justifies the clean separation: safety checks (E-IV, PASS) need no knowledge of the trend-smoothing parameters.

**Total-only EMA:** MEWMA uses single lambda across all dimensions. Covariance estimation impractical at n<=10 (need substantially more observations than dimensions). Per-dimension scores in trajectory output remain raw. Total EMA sufficient for aggregate convergence detection.

**Initialization:** EMA_0 = round 1 total score (NIST standard). No bias correction -- Adam-style correction at alpha=0.4 over-weights x_2, counterproductive. At alpha=0.4, bias washes out by round 3, and E-II plateau already requires 3+ rounds.

**EMA computed on-the-fly:** Not stored in state. Pure function of raw scores + alpha. Avoids state schema change, allows alpha tuning without migration.

### Claude's Discretion

- Implementation of `computeEMA(totals, alpha)` helper function
- Whether `computeEscalation()` takes an `{ alpha }` options parameter or reads from a constant
- Test structure for 3-dim vs 4-dim parameterized verification
- Refactoring order (extract maxTotal first, then thresholds, then EMA, then per-dimension output)
- Exact placement of `dimension_status` computation in `cmdRoundComplete`
- Whether `dimensions` in get-trajectory reuses the stored `scores` object directly or builds a new one without `total`

</decisions>

<specifics>
## Specific Ideas

- The dual-path architecture (Safety Filter) maps precisely to industrial process control: filtered signals for PID loop control (gradual optimization), instantaneous signals for safety interlocks (SIL/SIS). A chemical plant does not smooth away a pressure spike before triggering emergency shutdown. Similarly, E-IV does not smooth away a crash-level score.
- The ADA overfitting heuristic from GAN training (Karras et al., r_t=0.6 threshold) is structurally identical to our escalation ladder: a metric (score delta) compared against thresholds to determine the control action. This validates the escalation vocabulary design.
- The "best FID before overlap ceases" pattern from GAN training maps to our `findBestRound()` rollback: the best total score typically precedes regression, so E-III/E-IV exits revert to the round with peak score.
- MEPC+MSPC > either alone (Yang & Sheu 2006): combining the generator (engineering process control) with the critic ensemble (statistical process control) outperforms either approach independently.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- DIMENSIONS constant (appdev-cli.mjs:14): Single source of truth. `DIMENSIONS.length * 10` gives maxTotal. All threshold formulas derive from this.
- State rounds array (appdev-cli.mjs:590): Already stores full `scores` object per round including per-dimension values. No schema migration needed for per-dimension output -- just add mapping in output functions.
- `computeEscalation()` (appdev-cli.mjs:258): Self-contained function with clear structure (E-IV -> E-III -> E-II -> E-I -> E-0 priority chain). Threshold scaling is localized to this function.
- `findBestRound()` (appdev-cli.mjs:309): Already finds peak-score round for regression rollback. No changes needed.

### Established Patterns
- Priority chain in `computeEscalation()`: E-IV checked first, E-0 last. Higher severity overrides lower. EMA integration must preserve this ordering.
- `determineExit()` maps escalation levels to exit conditions: E-II -> PLATEAU, E-III/E-IV -> REGRESSION. No changes to this mapping.
- `cmdRoundComplete()` builds a `result` object and calls `output()`. Adding `dimension_status` is appending to this result.
- `cmdGetTrajectory()` maps `state.rounds` to trajectory entries. Adding `dimensions` is extending the map function.

### Integration Points
- `computeEscalation(rounds)` -> needs new signature: `computeEscalation(rounds, alpha)` with alpha defaulting to 0.4
- New helper: `computeEMA(totals, alpha)` returns array of smoothed values
- New constant: `const PLATEAU_PCT = 0.05` and `const PROGRESSING_PCT = 0.025` and `const CRISIS_PCT = 0.15`
- `cmdRoundComplete()` line 631: add `dimension_status` to result object
- `cmdGetTrajectory()` line 658: add `dimensions` to each trajectory entry
- Test file (test-appdev-cli.mjs): needs tests for scaled thresholds at both 3-dim and 4-dim, EMA computation, hybrid E-III, per-dimension output fields

</code_context>

<deferred>
## Deferred Ideas

- **Per-dimension EMA (MEWMA)**: Track EMA per dimension independently for dimension-level stagnation detection. Deferred to v1.3 if score distributions reveal dimension-level noise (CONV-06 candidate).
- **Formal hysteresis state machine**: Different entry/exit thresholds per escalation level with state memory. EMA provides equivalent noise filtering for ~10 rounds. Consider if round count increases significantly.
- **CDC dual-alpha**: CDC uses w1=0.4 (gradual) AND w2=0.9 (sudden) simultaneously. Our hybrid E-III approach handles the "sudden" case via raw signal, making w2 unnecessary. Revisit if hybrid proves insufficient.
- **Z-score anomaly detection**: Already planned as CONV-06 in v1.3 REQUIREMENTS.md. Detects suspicious score patterns (jumps, mode collapse 7/7/7).
- **Rising thresholds**: Round-indexed threshold escalation (CONV-07 in v1.3). Needs empirical score distribution data from v1.2 runs.

</deferred>

---

*Phase: 12-convergence-logic-hardening*
*Context gathered: 2026-04-02*
*Theoretical grounding: Hotelling T-squared (multivariate SPC), DCS deadband (ISA-18.2, EEMUA 191), Ashby's Requisite Variety (1956), Wiener damping (1948), Neyman-Pearson (1933), Schmitt trigger hysteresis, CDC EWMA alert_ewma, NIST EWMA handbook, IEC 61511 SIS/BPCS separation, Simplex Architecture (Sha 2001), Safety Filter (Hsu et al. 2024), Conant-Ashby Good Regulator Theorem (1970), Mason-Young-Tracy T2 decomposition, MCL-GAN (NeurIPS 2022), Albuquerque et al. (ICML 2019), MOEA/D Pareto front, TTUR (Heusel et al. 2017), ADA overfitting heuristic (Karras et al.)*
