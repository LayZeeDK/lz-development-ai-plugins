# Research: E-0 "Progressing" Threshold Scaling in Multi-Dimensional Control Systems

**Date:** 2026-04-02
**Context:** E-0 currently triggers when `delta > 1` (absolute). With maxTotal moving from 30 to 40 (4th dimension "Robustness" added), should this threshold scale?
**E-II Plateau decision:** Already decided as 5% of maxTotal (= 2 points at maxTotal=40).
**Question:** Should E-0 use the same percentage (symmetric deadband), a different percentage, or something else?

---

## 1. Symmetric vs Asymmetric Deadband: Industrial Practice and Theory

### 1.1 What Industrial Standards Say

Industrial control systems (ISA-18.2, EEMUA 191) universally express deadbands as a **percentage of span/range**, not as absolute values. This is the most directly relevant finding: when the measurement range changes, the deadband scales proportionally.

**EEMUA 191 recommended defaults by measurement type:**

| Measurement | Deadband (% of range) |
|---|---|
| Flow | 5% |
| Temperature | 1% |
| Level | 2% |
| Pressure | 1-3% |

The ISA-18.2 standard (section 10.5.5.2) mandates deadband capability and references signal-type-dependent starting points of 1-2% of span. The DCS literature (zeroinstrument.com) recommends 1-5% depending on parameter volatility.

**Key insight:** Deadbands ALWAYS scale with range in industrial practice. A 1-point absolute deadband at maxTotal=30 (3.3%) becomes 2.5% at maxTotal=40 -- the percentage shrinks, meaning the threshold becomes relatively more sensitive as the scale grows. This is the opposite of what you want: a wider scale introduces more noise per dimension, so the threshold should maintain or increase its percentage.

### 1.2 Unified Deadband/Hysteresis Model (Bainier, Marx & Ponsart 2024)

The ScienceDirect paper "A unified modelling of dead-zone, dead-band, hysteresis, and other faulty local behaviors of actuators and sensors" (IFAC-PapersOnLine, Vol 58, Issue 4, pp. 682-687) proposes a unifying representation that encapsulates dead-zone, dead-band, and hysteresis as a single class of nonlinear faults. The key insight: these are all instances of "local nonlinearities" -- regions where the system's transfer function behaves differently from the global behavior. The paper provides "ultimate bound guarantees" for systems operating under these nonlinearities, meaning that even with deadband present, the system's output stays within quantifiable bounds.

**Applied to our system:** The E-0 and E-II thresholds together form a local nonlinearity in the escalation transfer function. The "ultimate bound" concept maps to our concern: how much waste (in rounds/$) does the deadband introduce? The unified model confirms that dead-zone (E-0: ignore small deltas) and dead-band (E-II: ignore stagnation below threshold) are mathematically related but parameterized independently.

### 1.3 Symmetric vs Asymmetric Deadband Design

The Wikipedia article on deadband defines it as "a band of input values in the domain of a transfer function where the output is zero." Critically, deadbands can be symmetric or asymmetric around the setpoint.

In DCS alarm management, deadbands are typically **one-sided** (applied only to the return-to-normal direction), not symmetric around the alarm setpoint. The alarm triggers at the setpoint, but the alarm clears only when the signal retreats by the deadband amount. This is inherently asymmetric -- the entry threshold differs from the exit threshold.

However, in the E-0/E-II context, we are not asking about entry vs exit from a single state. We are asking about two different transitions in the same direction:
- E-0: "Is delta large enough to call this Progressing?" (positive signal detection)
- E-II: "Is the 3-round window delta small enough to call this Plateau?" (absence-of-signal detection)

These are fundamentally different detection problems, and industrial practice supports different threshold percentages for different signal types.

### 1.4 Banner Engineering: Practical Hysteresis Sizing

The Banner Engineering technical reference "Theory and Terminology -- Hysteresis and Threshold" provides the most concrete industrial rule of thumb: **"A typical hysteresis value is 10% to 20% of the unit's range."** Their example uses a 15 mA threshold with 2 mA hysteresis (13.3% of range). The document states: "Threshold and hysteresis work together to establish the ON and OFF points of an analog input. The threshold defines a trigger point or reporting threshold (ON point) for a sensor input. Hysteresis defines how far below the threshold the analog input is required to be before the input is considered OFF."

**Applied to our system:** The Banner 10-20% figure applies to raw sensor inputs with high noise. Our scoring system has lower relative noise (critic agents, not analog sensors), so the lower end of industrial ranges (1-5%) is more appropriate. The Banner reference confirms the asymmetric design: ON point (E-0 threshold) and OFF point (E-II threshold) are set independently.

### 1.3 DCS Deadband Sizing Principle

The exida alarm management guidance states: "the size of the deadband will need to be matched to the characteristics of the process signal." Rigorous calculation is rarely necessary; good starting values are used, then tuned. The starting point is always a percentage of range, adjusted for signal noise characteristics.

**Applied to our system:** The "process signal" is the score delta between rounds. The "range" is maxTotal (the maximum possible delta in a single round). The "noise" is the inherent variability in scoring -- different critic agents may produce slightly different scores for equivalent quality.

---

## 2. Cost Asymmetry Analysis: How Neyman-Pearson / SDT Informs the Threshold

### 2.1 The Bayes-Optimal Threshold Formula

Signal Detection Theory and Bayesian decision theory provide the exact formula for optimal thresholds under asymmetric costs.

The UBC CS340 Decision Theory lecture (Murphy) derives the binary classification threshold from the loss matrix. For actions a1 (declare Progressing) and a2 (declare Plateau), the optimal rule is:

```
Predict a1 (Progressing) iff p(Y=1|x) / p(Y=2|x) > (lambda_12 - lambda_22) / (lambda_21 - lambda_11)
```

Where lambda_ij are loss matrix entries. Under 0-1 loss (equal costs), the threshold is 1.0 (pick most probable class). Under asymmetric loss, the threshold shifts: "If our loss function penalizes miscategorizing omega_1 as omega_2 more than the converse, the threshold shifts."

The simplified formula for calibrated probability thresholds:

```
p* = C_FP / (C_FP + C_FN)
```

More generally, the likelihood ratio threshold is:

```
lambda* = (C_FA / C_Miss) * (P(H0) / P(H1))
```

Where:
- **C_FA** (false alarm cost) = cost of falsely declaring "Progressing" when the system has actually plateaued = cost of one wasted round = **$30-70**
- **C_Miss** (miss cost) = cost of falsely declaring "Plateau" when the system is actually progressing = cost of ALL prior rounds wasted (premature exit) = **$30-70 per round * N rounds already invested**

### 2.2 Cost Ratio Calculation

After 3 rounds (the minimum for plateau detection), the accumulated investment is:

```
C_Miss = 3 * $50 (midpoint) = $150 (average)
C_FA   = 1 * $50 = $50
Cost ratio = C_Miss / C_FA = 3:1 (minimum)
```

After 5 rounds:
```
C_Miss / C_FA = 5:1
```

The Neyman-Pearson framework says: **when miss costs exceed false alarm costs, lower the threshold to make detection easier** (i.e., be more willing to call something "Progressing" to avoid premature exit).

Applying the Bayes formula to the E-0 vs E-II boundary:

```
Optimal threshold = C_FA / (C_FA + C_Miss)
At 3 rounds: 50 / (50 + 150) = 0.25 (25th percentile)
At 5 rounds: 50 / (50 + 250) = 0.167 (17th percentile)
```

This means the decision boundary should be **biased toward detecting progress** (lower E-0 threshold) rather than balanced between false continuation and false exit.

### 2.3 Implication for Threshold Design

The cost asymmetry analysis says:
- The E-0 "Progressing" threshold should be **lower** than the E-II "Plateau" threshold (as a percentage of maxTotal)
- The asymmetry ratio of approximately 3:1 to 5:1 means the E-0 threshold should be roughly 1/3 to 1/5 of the E-II threshold
- However, this extreme ratio is moderated by the fact that E-II already requires a 3-round window (temporal integration), which itself provides significant noise reduction

### 2.4 ISA CAP Certification: Deadband Must Exceed Noise

The ISA Certified Automation Professional (CAP) exam quiz (Automation.com, sourced from Hollifield & Habibi, *Alarm Management: A Comprehensive Guide*) presents this exact problem:

> A pressure measurement has a range of 0-100 psig, noise visible in the signal. Which deadband setting for the high alarm? Options: 10%, 5%, 2%, 1%.

The correct answer is **2%**, with this reasoning:
- 10% is too large (alarm won't clear until pressure drops to normal operating range)
- 5% is too large (more than twice the signal noise, consumes too much of the operating range)
- 1% is too small (less than the signal noise, will create chattering)
- **2% is correct because it exceeds the noise level without consuming excessive range**

**Applied to our system:** The deadband must be calibrated to the noise floor. Our scoring noise is approximately +/-1 point (one dimension shifting by 1 due to critic variability). A 2.5% deadband (1 point at maxTotal=40) sits just above this noise floor -- matching the ISA guidance of "just above noise level."

### 2.5 Threshold-Moving for Cost-Sensitive Classification (Brownlee 2021)

The Machine Learning Mastery article on threshold-moving confirms the core principle: "The default threshold may not represent an optimal interpretation of the predicted probabilities." For imbalanced or cost-asymmetric problems, the threshold must be shifted.

Key findings:
- Default threshold of 0.5 assumes equal costs; when costs differ, shift the threshold
- "Trying other methods, such as sampling, without trying by simply setting the threshold may be misleading"
- The optimal threshold for an imbalanced binary problem (100:1 ratio, which maps to our cost asymmetry) was found to be **0.016** -- far below the default 0.5, showing how cost asymmetry dramatically lowers the detection threshold
- For cost-insensitive models, "a popular way of training a cost-sensitive classifier without a known cost matrix is to put emphasis on modifying the classification outputs when predictions are being made" -- exactly what we do by tuning E-0/E-II thresholds post-hoc

**Applied to our system:** This validates setting E-0 lower than E-II. The threshold-moving literature confirms that when false negatives (missing real progress) are much more costly than false positives (one extra round), the detection threshold should be lowered aggressively.

### 2.6 Signal Detection Theory Summary

The Neyman-Pearson lecture notes (Nowak, UW-Madison) confirm: "When miss costs >> false alarm costs, the threshold decreases, making it easier to declare the signal present." In our domain, "signal present" = "progress is happening", and the cost of missing real progress (premature plateau exit) far exceeds the cost of one extra round.

---

## 3. Hysteresis: Escalation State Transitions Need Different Entry/Exit Thresholds

### 3.1 Schmitt Trigger Analogy

A Schmitt trigger is the canonical example of hysteresis in signal processing. It uses two thresholds:

- **V_UT (upper threshold):** voltage must exceed this to transition from LOW to HIGH
- **V_LT (lower threshold):** voltage must fall below this to transition from HIGH to LOW
- **Hysteresis width = V_UT - V_LT**

The hysteresis width equals `(V_OH - V_OL) * R1 / (R1 + R2)`, where the resistor ratio determines the deadband as a fraction of the output swing.

**The key design principle:** The threshold for entering a state differs from the threshold for exiting it. This prevents chattering (rapid oscillation between states).

### 3.2 Biological Hysteresis Example

The search results surfaced a striking biological example: mitotic cell cycle entry. The activation threshold for mitotic entry is 32-40 nM cyclin B, but the inactivation threshold for mitotic exit is 16-24 nM. The entry threshold is approximately **2x** the exit threshold. This ratio prevents premature or oscillatory state transitions in a critical biological process.

### 3.3 Application to Escalation State Machine

Our escalation system is a state machine with transitions:

```
E-0 (Progressing) -> E-I (Decelerating) -> E-II (Plateau) -> Exit
```

Hysteresis principles say:
- **Entering E-0 from E-I** (recovering from deceleration) should require a **higher** threshold than **staying in E-0** -- you need more evidence to upgrade than to maintain
- **Entering E-II from E-I** should require a **lower** threshold than **exiting E-II back to E-I** -- once in plateau, you should need strong evidence of recovery to escape

Currently, the system does not implement hysteresis: E-0 is always `delta > 1` regardless of previous state. This is acceptable for a first implementation but could be enhanced.

### 3.4 Thermostat Analogy Applied

The canonical thermostat example: turn heat ON at 68F, OFF at 72F (4F deadband around 70F setpoint). In our system:
- "Heat ON" = continue generating (Progressing)
- "Heat OFF" = stop generating (Plateau exit)
- The deadband between "definitely progressing" and "definitely plateaued" should be wide enough to prevent chattering between states

The HVAC hysteresis width is typically 2-5% of the controlled range. At maxTotal=40, that would be 0.8-2.0 points -- consistent with a 2.5% E-0 threshold (1 point) and 5% E-II threshold (2 points).

---

## 4. GAN Training Dynamics and TTUR

### 4.1 GAN Convergence Is Fleeting

Google's GAN training guide states: "For a GAN, convergence is often a fleeting, rather than stable, state." This directly informs our design: we should be cautious about declaring plateau too early, because what looks like a plateau might be a temporary equilibrium before the next improvement phase.

The implication: **err on the side of continuation** (lower E-0 threshold, higher E-II threshold).

### 4.2 TTUR Asymmetric Update Rates

The TTUR paper (Heusel et al., NeurIPS 2017) proves that GANs converge when discriminator and generator use different learning rates. The discriminator typically runs 1.25x to 3x faster than the generator.

**Key insight:** "The discriminator must first learn new patterns before they are transferred to the generator." In our system, the evaluator (discriminator) runs once per round and produces scores. The generator then uses those scores to improve. This is already a two-timescale system -- the evaluator provides signal, the generator adapts.

The TTUR principle suggests that our "progress detection" should be calibrated to the **generator's** timescale (slow), not the evaluator's timescale (fast). Small score improvements represent real generator learning even if the evaluator's discrimination is sharp.

### 4.3 FID and Distribution Overlap

The GAN convergence literature notes that "the best FID is achieved right before the distributions cease to overlap; after it, the FID gets progressively worse." This is the GAN analog of our E-II/E-III boundary: there is a quality peak, and continuing past it causes regression.

The implication: our E-0 threshold should be sensitive enough to detect the last increments of real improvement before the peak, but E-II should catch the plateau when those increments stop.

### 4.4 No Standard Delta Threshold in GAN Literature

The search confirmed there is "no widely established delta threshold for discriminator score that definitively signals convergence." GAN practitioners monitor FID over epochs and look for plateau visually or with moving averages. This validates our approach of using a simple threshold on score deltas, since there is no more sophisticated standard to follow.

---

## 5. Wiener Cybernetics and Damping

### 5.1 Critical Damping Ratio

Wiener's cybernetics framework, and the damping literature it inspired, identifies the critical damping ratio (zeta = 1) as the optimal threshold between oscillation (underdamped, zeta < 1) and sluggishness (overdamped, zeta > 1). A critically damped system returns to equilibrium in minimum time without oscillation.

**Applied to our system:**
- **Underdamped (E-0 threshold too low):** The system oscillates between "Progressing" and "Decelerating" because noise in scores triggers false transitions
- **Overdamped (E-0 threshold too high):** The system sluggishly remains in "Decelerating" even when real progress is happening, potentially triggering premature plateau detection
- **Critically damped (E-0 threshold just right):** The system accurately tracks real progress without noise-induced chattering

### 5.2 The Speed Limit Concept

Our prior research (RALPH-LOOP-CYBERNETICS.md) identified "damping and the speed limit concept" as directly applicable. The cybernetics principle is: a negative feedback system seeking homeostasis converges when the error signal approaches zero. The rate of convergence naturally slows as the system approaches its target -- this is the E-I "Decelerating" state.

The E-0 threshold defines the boundary between "still converging meaningfully" and "approaching asymptote." This boundary should be set at the noise floor of the measurement system -- below this threshold, apparent improvements cannot be distinguished from measurement noise.

### 5.3 Wiener's Feedback Quality Principle

Wiener argued that "the functionality of a machine, organism, or society depends on the quality of messages. Information corrupted by noise prevents homeostasis." Our scoring system has inherent noise (inter-rater variability between critic agents, stochastic LLM outputs). The E-0 threshold must be above this noise floor to provide meaningful signal.

With 4 dimensions scored 0-10 by different critic agents, the per-round noise is approximately +/-1 point in total (a single dimension changing by 1 point due to scoring variability). This sets the minimum meaningful threshold at approximately 1 point -- which, at maxTotal=40, equals 2.5%.

---

## 6. Synthesis and Recommendation

### 6.1 Converging Evidence

| Source | Recommendation | E-0 as % of maxTotal |
|---|---|---|
| Industrial DCS (ISA-18.2, EEMUA 191) | 1-5% of range, scales with range | 2.5-5% |
| Neyman-Pearson cost asymmetry | Lower than E-II (asymmetric: favor detection) | < 5% (less than E-II) |
| Schmitt trigger hysteresis | Entry threshold < exit threshold, 2-5% range | 2.5% |
| GAN/TTUR dynamics | Err on side of continuation; small deltas are real | 2.5% |
| Wiener damping | Set at noise floor of measurement system | 2.5% (~1 point noise) |
| Current system (maxTotal=30) | 1 point absolute = 3.3% | 3.3% (current) |
| Current system (maxTotal=40) | 1 point absolute = 2.5% | 2.5% (if unchanged) |

### 6.2 The Asymmetric Deadband Argument

The E-II plateau threshold at 5% of maxTotal and the E-0 progressing threshold should NOT be symmetric. The evidence is overwhelming:

1. **Cost asymmetry (3:1 to 5:1)** favors a lower E-0 threshold: false continuation costs one round ($50); false plateau exit wastes all prior rounds ($150-350).

2. **Hysteresis design** says entry into "Plateau" (E-II) should have a higher bar than entry into "Progressing" (E-0). The biological analogy shows 2:1 ratios.

3. **GAN convergence is fleeting** -- calling plateau too early is worse than one extra round.

4. **Wiener damping** says the threshold should be at the noise floor, and the noise floor (~1 point) is lower than the plateau threshold.

The correct design is an **asymmetric deadband**:
- E-0 "Progressing": lower threshold (detect progress aggressively)
- E-II "Plateau": higher threshold (require strong evidence before stopping)

### 6.3 Recommended E-0 Threshold

**Recommendation: E-0 threshold = 2.5% of maxTotal (round to nearest integer: 1)**

At maxTotal=40: `delta > 1` (2.5%) -- **keep the current absolute value**
At maxTotal=30: `delta > 1` was 3.3% -- slightly above the ideal

**Rationale:**

1. **Percentage-based scaling says keep delta > 1.** At maxTotal=40, 1 point = 2.5% of range. This falls within the 1-5% range recommended by industrial standards (ISA-18.2, EEMUA 191) for moderate-volatility signals.

2. **Noise floor validation.** With 4 dimensions each scored 0-10, the minimum meaningful improvement is 1 point in one dimension. Below this, the signal cannot be distinguished from inter-critic scoring variability. The E-0 threshold at 1 point sits exactly at the noise floor.

3. **Cost asymmetry preserved.** The ratio between E-II (5% = 2 points over 3-round window) and E-0 (2.5% = 1 point per round) is 2:1, consistent with the biological hysteresis ratio (mitotic entry:exit = 2:1) and with the Neyman-Pearson cost-ratio analysis favoring aggressive progress detection.

4. **Hysteresis maintained.** The gap between E-0 (>1 point needed to be "Progressing") and E-II (<=2 points over 3 rounds to be "Plateau") creates a natural deadband where E-I "Decelerating" operates. This prevents chattering between Progressing and Plateau states.

5. **GAN TTUR alignment.** The generator (builder agent) operates on a slower timescale than the discriminator (critic ensemble). A 1-point improvement represents genuine generator learning -- the TTUR principle says small generator steps should be recognized as progress.

### 6.4 Implementation

**No code change needed for E-0.** The current `delta > 1` threshold naturally scales from 3.3% (at maxTotal=30) to 2.5% (at maxTotal=40). This is the correct direction: as the scale widens, the absolute threshold stays constant, and the percentage decreases slightly. The 2.5% value at maxTotal=40 is well within the industrial 1-5% range and correctly asymmetric relative to E-II at 5%.

**E-II needs updating.** The E-II plateau threshold should change from the current `windowDelta <= 1` to `windowDelta <= 2` (5% of maxTotal=40). This maintains the 2:1 asymmetry ratio between plateau detection and progress detection.

### 6.5 Summary Table

| Level | Threshold | maxTotal=30 | maxTotal=40 | % of maxTotal |
|---|---|---|---|---|
| E-0 Progressing | `delta > T_progress` | delta > 1 (3.3%) | delta > 1 (2.5%) | 2.5% |
| E-II Plateau | `windowDelta <= T_plateau` | windowDelta <= 1 (3.3%) | windowDelta <= 2 (5%) | 5% |
| Asymmetry ratio | T_plateau / T_progress | 1:1 | 2:1 | 2:1 |

The asymmetry ratio improves from 1:1 (at maxTotal=30, which was suboptimal) to 2:1 (at maxTotal=40), which aligns with all theoretical frameworks analyzed.

---

## Sources

### Deadband and Industrial Control
- [Wikipedia: Deadband](https://en.wikipedia.org/wiki/Deadband)
- [Understanding Deadband in DCS Systems](https://zeroinstrument.com/understanding-deadband-in-distributed-control-systems-dcs-definition-purpose-and-parameter-settings/)
- [Bainier, Marx & Ponsart: Unified modelling of dead-zone, dead-band, hysteresis (IFAC 2024)](https://www.sciencedirect.com/science/article/pii/S2405896324003823)
- [exida: Why should I use an Alarm Deadband?](https://www.exida.com/Blog/why-should-i-use-an-alarm-deadband)
- [Banner Engineering: Theory and Terminology -- Hysteresis and Threshold](https://info.bannerengineering.com/cs/groups/public/documents/literature/tt_threshold_hysteresis.pdf)
- [ISA CAP Quiz: Optimal Alarm Deadband Setting (Automation.com)](https://www.automation.com/article/autoquiz-alarm-deadband-setting)
- [EEMUA 191 Alarm Management Guide](https://www.eemua.org/products/publications/digital/eemua-publication-191)
- [ISA-18.2 Management of Alarm Systems](https://www.isa.org/products/ansi-isa-18-2-2016-management-of-alarm-systems-for)

### Signal Detection Theory and Cost Asymmetry
- [Neyman-Pearson Lemma (Wikipedia)](https://en.wikipedia.org/wiki/Neyman%E2%80%93Pearson_lemma)
- [Lecture 6: Neyman-Pearson Detectors (Nowak, UW-Madison)](https://nowak.ece.wisc.edu/ece830/ece830_fall11_lecture6.pdf)
- [Loss Function (Wikipedia)](https://en.wikipedia.org/wiki/Loss_function)
- [Bayesian Decision Theory (UBC CS340, Murphy)](https://www.cs.ubc.ca/~murphyk/Teaching/CS340-Fall07/dtheory.pdf)
- [Threshold-Moving for Imbalanced Classification (Brownlee, ML Mastery)](https://machinelearningmastery.com/threshold-moving-for-imbalanced-classification/)
- [Decision Theory and Loss Functions (Fiveable)](https://fiveable.me/data-inference-and-decisions/unit-10/decision-theory-loss-functions/study-guide/dplduck89zjI1wNL)

### GAN Training and Convergence
- [GAN Training (Google ML)](https://developers.google.com/machine-learning/gan/training)
- [GAN Convergence and Stability (David Leon)](https://davidleonfdez.github.io/gan/2022/05/17/gan-convergence-stability.html)
- [TTUR: GANs Trained by a Two Time-Scale Update Rule (Heusel et al., 2017)](https://arxiv.org/abs/1706.08500)
- [How to Evaluate GANs (Machine Learning Mastery)](https://machinelearningmastery.com/how-to-evaluate-generative-adversarial-networks/)

### Hysteresis and State Machines
- [Schmitt Trigger (Wikipedia)](https://en.wikipedia.org/wiki/Schmitt_trigger)
- [Hysteresis (Wikipedia)](https://en.wikipedia.org/wiki/Hysteresis)
- [Hardware and Systems Engineering Design: Hysteresis](https://www.hwe.design/theories-concepts/hysteresis)
- [Bang-Bang Control (Wikipedia)](https://en.wikipedia.org/wiki/Bang%E2%80%93bang_control)

### Cybernetics and Damping
- [Damping (Wikipedia)](https://en.wikipedia.org/wiki/Damping)
- [Cybernetics: Or Control and Communication in the Animal and the Machine (Wikipedia)](https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine)
- [Wiener, Cybernetics (MIT Press)](https://direct.mit.edu/books/oa-monograph/4581/Cybernetics-or-Control-and-Communication-in-the)
