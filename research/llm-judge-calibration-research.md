# LLM-as-Judge Calibration: Preventing Grade Inflation in GAN-Inspired Code Evaluation

Research report for the application-dev plugin's critic scoring system.

## 1. Grade Inflation Is a Known, Well-Documented Problem

LLM judges exhibit systematic leniency bias across every study examined. The core
findings:

- **Agreeableness bias** produces TPR > 96% but TNR < 25%, meaning judges almost
  always approve good work but rarely reject bad work (the exact failure mode
  observed in round 1 scoring).
- **Overly positive skew** causes score compression -- most scores cluster near
  the high end of the scale, destroying the system's ability to discriminate
  between mediocre and good outputs.
- **Self-enhancement bias** inflates scores 5-7% when the judge model evaluates
  outputs from the same model family. Since our Generator and Critics both use
  Claude, this is directly relevant.

The Anthropic harness design article confirms this explicitly: "When asked to
evaluate work they've produced, agents tend to respond by confidently praising the
work -- even when, to a human observer, the quality is obviously mediocre." Even
after separating generator from evaluator, "the evaluator is still an LLM that is
inclined to be generous towards LLM-generated outputs."

**Root cause:** LLMs are trained via RLHF to be agreeable and helpful. This
training objective directly conflicts with the evaluator role, which requires
adversarial skepticism. The model's default behavior is to find reasons to approve
rather than reasons to reject.

## 2. Hard Score Ceilings: Proven Effective, Already in Use

The current SCORING-CALIBRATION.md already implements hard ceilings (e.g., "all
images placeholder -> Visual Design max 3"). Research supports this approach:

**Pros (supported by evidence):**

- **Deterministic guardrails** prevent the most egregious leniency failures. When
  every image is a placeholder, no amount of LLM reasoning should produce a
  Visual Design score of 8. The ceiling makes this mechanically impossible.
- **DAG scorer pattern** (from Confident AI research) -- decision-tree scoring
  where constraint violations gate the maximum achievable score -- is the
  recommended approach for "extremely clear" success criteria.
- **Rules-based evals** "provide near-instant feedback on every commit, catching
  obvious breaks and formatting issues for pennies per run."
- **Localization and categorization** -- GoDaddy's RaR (Rubrics as Rewards)
  framework recommends yes/no constraint checks that "pinpoint exactly where
  errors occur" and "group errors by type."

**Cons and risks:**

- **Over-conservative error handling** was the third most common failure mode
  (20.8% of 600 failure cases studied) -- evaluators penalizing code for not
  handling things the task did not require.
- Ceilings must be spec-relative, not absolute. A ceiling like "no images = max 3"
  is wrong for a CLI tool or data dashboard where images are not expected.
- Too many rigid ceilings can make the evaluator brittle. The GoDaddy article
  recommends "implicit aggregation" (rubric-informed holistic judgment) over
  pure checklist scoring because it "leverages the LLM's superior nuanced
  understanding of how criteria interact."

**Recommendation:** The current ceiling system is sound and well-designed. Keep it.
But ensure ceilings are always scoped to spec requirements (which the current
"Score-Against-the-Spec Rule" already does). The problem is not the ceiling rules
-- it is that critics are not consistently detecting the conditions that trigger
ceilings.

## 3. Rubric-Based vs. Holistic Scoring

Research is clear: **hybrid is best**. Use rubric-based reasoning to inform a final
holistic score.

Key findings:

- **Analytic (per-dimension) scoring** has lower human agreement on individual
  traits but provides interpretable, actionable feedback. This is what the current
  4-dimension system does.
- **Holistic scoring** has higher overall agreement with humans but obscures what
  needs fixing. Useless for a feedback loop.
- **Implicit aggregation** (LLM evaluates against rubric criteria step-by-step,
  then assigns a holistic score) outperforms explicit aggregation (checklist
  scoring) according to GoDaddy's research and the Scale AI RaR paper.
- **Narrower scales** (1-5) produce better calibration than broad scales (1-10).
  Autorubric deliberately excludes continuous scores because "LLM judges exhibit
  poor calibration when asked to produce unbounded numeric scores."
- **Prompt granularity affects strictness**: feeding one rubric point at a time
  slashes average scores by 33% (leniency -0.329), while feeding the whole rubric
  hovers near human leniency (+0.081).

**Recommendation:** The current 1-10 scale with 4 dimensions is reasonable because
the calibration scenarios and ceiling rules compensate for the broad scale. However,
consider whether the critics should evaluate individual sub-criteria FIRST (binary
pass/fail per checklist item), THEN synthesize into a 1-10 score. This matches the
"feed one rubric point at a time" finding that produces stricter evaluation.

## 4. Anchoring and Reference-Based Scoring: The Most Effective Single Technique

The current SCORING-CALIBRATION.md already uses calibration scenarios with boundary
explanations. Research strongly validates this approach:

- **Anchor examples significantly improve consistency** -- "by providing a clear
  example of what a 5-star response and a 1-star response look like, you anchor
  the judge's understanding of your scoring scale."
- **Boundary explanations** ("Not 6 because...") are particularly valuable. The
  RULERS framework identifies "scale misalignment" as a primary failure mode and
  proposes "locked rubrics" with evidence-anchored scoring to prevent it.
- **Few-shot calibration** with pre-graded samples is the single most recommended
  technique across all sources examined.
- **Anchored exemplars reduce scoring error** but do not solve discriminative
  validity -- "the models behave less like independent evaluators and more like
  systems inferring where marks are expected to lie on average."

**Recommendation:** The existing calibration scenarios are excellent. The gap is
that they are loaded as a reference file that critics read mid-evaluation. If the
critic's context is congested or the critic skips reading the file, calibration
breaks. Consider:

1. Moving 2-3 critical anchor examples directly into each critic's agent prompt
   (not just a reference file) so they are always in context.
2. Adding a "below threshold: round 1 typical" anchor that describes what a
   first-generation app usually looks like (bland, placeholder-heavy, generic)
   and anchors it to a specific low score range. This directly addresses the
   round 1 inflation problem.

## 5. Multi-Round Evaluation Dynamics

This is where the research is most directly relevant to the observed problem.

**Key finding from Meeseeks benchmark:** The biggest quality gains occur in the
first 1-3 rounds (50+ percentage point improvement in utility rates). This means
round 1 scores SHOULD be low -- a high round 1 score almost certainly means the
evaluator is not being critical enough.

**The Anthropic article's observation:** "Scores generally improved over iterations
before plateauing, with headroom still remaining. Even on the first iteration,
outputs were noticeably better than a baseline with no prompting at all, suggesting
the criteria and associated language themselves steered the model away from generic
defaults before any evaluator feedback led to further refinement."

Critically: "I regularly saw cases where I preferred a middle iteration over the
last one." Non-monotonic improvement is normal.

**Convergence dynamics** from the geometric dynamics paper:

- **Contractive** (stable convergence) -- scores increase and stabilize. Desired.
- **Oscillatory** (cycling) -- scores bounce. Indicates rubric instability.
- **Exploratory** (divergent) -- scores decrease or wander. Indicates the generator
  is going off-rails.

**The current system's problem:** The "Round-Independent Scoring" rule in
SCORING-CALIBRATION.md is correct in principle (absolute scoring, not relative).
But the problem is not that scores are relative -- it is that the critics are not
detecting issues at all in round 1. The first generation is typically:

- Placeholder images everywhere (should trigger VD ceiling max 3)
- Generic AI-slop patterns (should trigger VD ceiling max 5)
- Broken or missing features (should trigger FN/PD ceilings)
- No error handling (should trigger Robustness ceiling max 5)

If critics applied ceilings correctly in round 1, scores would be low. The
inflation is happening because critics are either (a) not detecting the conditions,
(b) not loading the ceiling rules, or (c) rationalizing away the conditions.

**Recommendation:**

1. Add explicit "round 1 expectation setting" to critic prompts: "Round 1
   applications typically score 3-5 on most dimensions. A score of 7+ in round 1
   is exceptional and requires extraordinary evidence."
2. Make ceiling detection procedural, not judgmental. Instead of asking the critic
   "are all images placeholder?", run a deterministic check (the `check-assets`
   CLI command) and feed the result to the critic as a constraint.
3. Consider a "mandatory defect quota" for round 1: the critic must identify at
   least N findings before scoring. This prevents the common failure mode where
   the critic does a superficial review, finds nothing wrong, and scores high.

## 6. The Anthropic Approach (Harness Design Article)

Prithvi Rajasekaran's approach includes several calibration strategies:

**A. Criteria design with intentional weighting:**
The evaluator uses four criteria (Design Quality, Originality, Craft,
Functionality) but weights the first two higher because "Claude already scored well
on craft and functionality by default." The criteria "explicitly penalized highly
generic 'AI slop' patterns."

**B. Few-shot calibration:**
"I calibrated the evaluator using few-shot examples with detailed score breakdowns.
This ensured the evaluator's judgment aligned with my preferences, and reduced score
drift across iterations."

**C. Active browser-based evaluation:**
The evaluator uses Playwright MCP to "interact with the live page directly before
scoring each criterion and writing a detailed critique." It "navigate[d] the page
on its own, screenshotting and carefully studying the implementation before
producing its assessment."

**D. Sprint contracts with hard thresholds:**
"Each criterion had a hard threshold, and if any one fell below it, the sprint
failed and the generator got detailed feedback on what went wrong."

**E. Iterative evaluator tuning:**
"The tuning loop was to read the evaluator's logs, find examples where its judgment
diverged from mine, and update the QA's prompt to solve for those issues. It took
several rounds of this development loop before the evaluator was grading in a way
that I found reasonable."

**F. Known limitation -- LLM evaluator leniency:**
"Out of the box, Claude is a poor QA agent. In early runs, I watched it identify
legitimate issues, then talk itself into deciding they weren't a big deal and
approve the work anyway."

This last point is the exact pathology. The fix was persistent prompt tuning, not a
single technique.

## 7. Theoretical Foundations: Discriminator Calibration in Adversarial Systems

This section grounds the LLM-critic calibration problem in three theoretical
frameworks: GAN/WGAN discriminator theory, cybernetics (Ashby and Beer), and
Turing test theory. Each framework illuminates a different facet of the same
problem: how to design an evaluation function that provides useful, calibrated
feedback to a generative system.

### 7.1. GAN Discriminator Overconfidence and Mode Collapse

**Core theory (Goodfellow et al., 2014).** In the original GAN formulation, the
discriminator D is trained to maximize the probability of correctly classifying
real data and generated data. The optimal discriminator for a fixed generator G
is:

    D*(x) = p_data(x) / (p_data(x) + p_g(x))

At the Nash equilibrium of the minimax game, when the generator perfectly matches
the data distribution (p_g = p_data), the optimal discriminator outputs exactly
0.5 everywhere -- it is maximally confused, unable to distinguish real from
generated. This is the theoretical target: a perfectly calibrated discriminator
that reflects the true density ratio.

**The overconfidence pathology.** In practice, the discriminator learns much faster
than the generator, especially in early training. When the supports of the real
and generated distributions are disjoint (which is typical early on), the optimal
discriminator achieves near-perfect classification. The sigmoid activation pushes
outputs toward 0 or 1. This creates a catastrophic problem: the gradients of the
binary cross-entropy loss vanish when the discriminator's outputs are near 0 or
1. The generator receives almost no useful signal about how to improve.

As Goodfellow noted in the original paper: "In practice, [the minimax loss
function] may not provide sufficient gradient for G to learn well. Early in
learning, when G is poor, D can reject samples with high confidence because they
are clearly different from the training data. In this case, log(1 - D(G(z)))
saturates."

**Consequences:**

- **Vanishing gradients for the generator**: When D is too confident, the
  generator's loss saturates and the gradient approaches zero. The generator
  stops learning -- not because it has converged, but because the feedback signal
  has collapsed.

- **Mode collapse**: Without useful gradient information, the generator exploits
  whatever narrow path fools the discriminator. It learns to produce one or a few
  outputs that score well rather than covering the full data distribution. Each
  iteration over-optimizes for the current discriminator, and the discriminator
  never escapes the local minimum. The system oscillates through a small set of
  outputs.

- **Training instability**: The minimax game becomes a dynamic system where each
  parameter update changes the optimization landscape for the other player. If
  the discriminator dominates, the adversarial balance breaks down entirely.

**Direct mapping to LLM critics:** An LLM critic that scores outputs 8-10 by
default is the evaluator equivalent of a GAN discriminator that outputs 0 or 1
with extreme confidence. The score is saturated near the ceiling. The generator
(the LLM producing code) receives a weak signal: "everything is great, keep
doing what you're doing." Without meaningful gradient -- without scores that
distinguish between "mediocre" and "good" and "excellent" -- the generator has
no direction for improvement. This is exactly the vanishing gradient problem
recast in evaluation terms. The critic has become overconfident (in the positive
direction), and the generator stops improving.

### 7.2. One-Sided Label Smoothing (Salimans et al., 2016)

**The technique.** In "Improved Techniques for Training GANs," Salimans,
Goodfellow et al. proposed one-sided label smoothing: replace the target label
for real data from 1.0 to a softer value like 0.9, while keeping the fake label
at 0.

**The mathematical basis.** When label smoothing is applied with smoothed
positive label alpha and smoothed negative label beta, the optimal discriminator
becomes:

    D(x) = (alpha * p_data(x) + beta * p_model(x)) / (p_data(x) + p_model(x))

The critical insight: if beta != 0 (two-sided smoothing), p_model appears in the
numerator. In regions where p_data is approximately 0 but p_model is large --
meaning the generator is producing samples far from the real data -- the
discriminator's optimal behavior actually reinforces those erroneous samples
rather than pushing them toward real data. The generator has no incentive to move
toward the data distribution.

Setting beta = 0 (one-sided smoothing) eliminates the p_model term from the
numerator. The only effect is that the discriminator's target for real data is
capped below 1.0. This prevents the discriminator from developing arbitrarily
large logits for real examples -- its confidence is bounded.

**Why it works (intuition):**

- The discriminator can no longer be 100% confident that real data is real. It
  is told "real data is 0.9, not 1.0." This prevents extreme logit values and
  maintains a non-vanishing gradient for the generator.

- Fake data remains labeled at 0. The generator still receives a clear signal
  that its outputs are fake. There is no perverse incentive for fake samples to
  stay where they are.

- The asymmetry is crucial: soften the ceiling (how good "perfect" can look)
  without softening the floor (how bad "bad" should look).

**Practical impact.** Goodfellow, in his NIPS 2016 tutorial, stated: "The idea
of one-sided label smoothing is to replace the target for the real examples with
a value slightly less than one, such as 0.9. This prevents extreme extrapolation
behavior in the discriminator." Ablation experiments showed removing label
smoothing incurred a noticeable performance drop.

**Direct mapping to LLM critics:** One-sided label smoothing translates directly
to the scoring system:

- **Soft ceiling on "perfect" scores**: Never allow a 10/10. Cap the maximum
  achievable score at 9 (or even 8 for round 1). This is the evaluator analogue
  of smoothing the "real" label from 1.0 to 0.9.

- **No softening of the floor**: A genuinely broken application should still
  score 1-2. The "pain signal" must remain unambiguous.

- **The asymmetry matters**: A system that softens both the ceiling AND the floor
  (e.g., "never score below 3, never score above 8") creates the two-sided
  smoothing pathology -- mediocre outputs have no incentive to improve because
  the floor has been raised. One-sided smoothing means: lower the ceiling, but
  keep the floor honest.

### 7.3. WGAN Critic Design: Continuous Scores and the Lipschitz Constraint

**From binary classification to continuous scoring (Arjovsky et al., 2017).**
The Wasserstein GAN (WGAN) fundamentally reimagined the discriminator. Instead
of a binary classifier with sigmoid output (probability of "real"), the WGAN
uses a "critic" that outputs an unbounded, continuous real-valued score. There
is no sigmoid activation in the final layer. The critic estimates the
Wasserstein (Earth Mover's) distance between the real and generated
distributions.

**Why this matters for LLM evaluation.** The WGAN critic is a much better
analogy for a 1-10 scoring system than the vanilla GAN discriminator:

| Property | GAN Discriminator | WGAN Critic | LLM Critic (1-10) |
|----------|-------------------|-------------|---------------------|
| Output | Binary (0/1) | Continuous, unbounded | Continuous (1-10) |
| Activation | Sigmoid | None (linear) | Rubric-based |
| Saturation | Saturates at 0 and 1 | Does not saturate | Saturates at 9-10 |
| Gradient signal | Vanishes when confident | Stable everywhere | Vanishes when lenient |
| Interpretation | Probability of real | Distance estimate | Quality estimate |

**The Lipschitz constraint and gradient penalty.**

The WGAN critic must satisfy the 1-Lipschitz constraint:

    |f(x1) - f(x2)| <= K * |x1 - x2|

Intuitively: the critic's score cannot change faster than the inputs change. If
two inputs are similar, their scores must be similar. This prevents the critic
from making arbitrarily sharp distinctions -- it enforces smoothness.

The original WGAN enforced this via weight clipping (clamping all weights to
[-0.01, 0.01]), which was crude and led to pathologies. WGAN-GP (Gulrajani et
al., 2017) replaced this with a gradient penalty: the critic is penalized if the
norm of its gradient with respect to its input deviates from 1. The penalty is
applied along interpolated points between real and generated samples.

**Key theoretical result (Arjovsky et al., 2017):** Unlike standard GANs, it is
safe and beneficial to train the WGAN critic to optimality. "The more we train
the critic, the more reliable the gradient of the Wasserstein distance becomes.
For the JS divergence, as the discriminator gets better the gradients get more
reliable but the true gradient is 0 since the JS is locally saturated." The
WGAN critic "can't saturate, and converges to a linear function that gives
remarkably clean gradients everywhere."

**Why WGAN produces more stable training:**

1. **Non-vanishing gradients**: The Wasserstein distance provides a smooth,
   continuous measure of distributional distance. Unlike JS divergence, it does
   not saturate when the distributions are disjoint. The critic always has a
   useful signal to provide.

2. **Loss correlates with quality**: In vanilla GANs, the generator loss does
   not correlate with output quality -- you cannot tell from the loss value
   whether the generator is improving. In WGANs, the critic's estimated
   Wasserstein distance directly correlates with sample quality. The loss
   function itself becomes a meaningful diagnostic.

3. **Training the critic harder improves the generator**: In vanilla GANs,
   training the discriminator too much kills the generator's gradient. In
   WGANs, training the critic more gives the generator better gradients. The
   adversarial balance becomes cooperative rather than destructive.

**Caveat (Mescheder et al., 2018):** Later theoretical work showed that WGAN
convergence guarantees depend on training the critic to full optimality at each
step, which is impractical with a finite number of updates. With a fixed number
of critic updates per generator step (the standard practice), convergence to
Nash equilibrium is not guaranteed. This was addressed by instance noise,
zero-centered gradient penalties, and consensus optimization.

**Direct mapping to LLM critics:**

- **Lipschitz constraint -> Score smoothness**: An LLM critic should not give
  wildly different scores to similar outputs. If two generated applications
  differ only in the color scheme, the critic should not score one a 3 and the
  other an 8. The Lipschitz principle says: similar inputs deserve similar
  scores. This is enforced in our system via calibration scenarios with boundary
  explanations ("this is a 5 because X; this is a 6 because X+Y").

- **Gradient penalty -> Score delta constraints**: The gradient penalty prevents
  the critic from making arbitrary jumps. The analogy: constrain how much a
  score can change between rounds. A single iteration should not produce a jump
  from 3 to 9 -- the spectral normalization analogue caps the rate of change.

- **Training to optimality is safe -> Investing in critic quality pays off**: In
  the vanilla GAN paradigm, making the discriminator stronger hurts the
  generator. In the WGAN paradigm, making the critic better helps the generator.
  This maps directly: investing effort in calibrating LLM critics (better
  prompts, more anchor examples, procedural ceiling detection) does not
  over-penalize the generator. It gives the generator better feedback.

- **Loss correlates with quality -> Scores should be diagnostic**: A well-
  calibrated critic's scores should track actual improvement. If the generator
  makes meaningful changes and the critic's score does not move, the critic is
  poorly calibrated (the WGAN equivalent of a saturated discriminator).

### 7.4. The Discriminator as a Learned Loss Function

**Core concept (Goodfellow et al., 2014).** In the GAN framework, the
discriminator IS the loss function for the generator. Unlike a static loss
function (MSE, cross-entropy), the discriminator is itself a neural network
that is trained during the process. The generator's only signal about quality
comes from the discriminator.

This is a profound architectural insight: the quality of the generator's output
is entirely determined by the quality of the discriminator's feedback. If the
discriminator is poorly calibrated -- if it gives high scores to bad outputs --
the generator receives a weak signal and stops improving. The generator is only
as good as its loss function, and its loss function is the discriminator.

**The calibration requirement.** For the minimax game to converge, the
discriminator must satisfy a delicate balance:

- **Too weak (lenient)**: The discriminator cannot distinguish real from
  generated data. The generator receives no useful gradient -- there is no
  direction of improvement indicated. The generator stagnates.

- **Too strong (overconfident)**: The discriminator perfectly classifies all
  inputs. The gradient saturates at 0 or 1. The generator receives vanishing
  gradients -- it knows it is failing but gets no information about how to
  improve.

- **Well-calibrated**: The discriminator correctly identifies the direction of
  improvement (real vs. fake) but with moderate confidence, providing a smooth,
  non-vanishing gradient. The generator can follow this gradient toward
  improvement.

The non-saturating loss modification by Goodfellow addressed the "too strong"
case by changing the generator's objective from minimizing log(1 - D(G(z))) to
maximizing log(D(G(z))). This provides stronger gradients early in training
while preserving the same fixed point.

**Direct mapping to LLM critics:** The LLM critic IS the loss function for the
LLM generator. The generator (code-producing agent) only knows how good its
output is through the critic's scores and findings. If the critic is lenient
(the "too weak" case), the generator has no reason to improve -- it already
scored 8/10, what more is there to do? If the critic is impossibly harsh (the
"too strong" case), every output scores 1-2 and the generator receives no
signal about which direction to improve.

The well-calibrated critic provides:

1. A score that distinguishes current quality from target quality (non-saturated)
2. Specific findings that indicate the direction of improvement (the gradient)
3. Scores that change meaningfully when the generator makes real improvements
   (non-vanishing gradient)

### 7.5. Ashby's Law of Requisite Variety

**The law (Ashby, 1956).** "Only variety can absorb variety." Formally: for a
regulator R to successfully control outcomes when faced with disturbances D of
variety V_D, R must possess variety V_R >= V_D. The minimum achievable outcome
variety is V_D - V_R. If the regulator has fewer states than the disturbance,
some disturbances will pass through unregulated.

**Connection to Shannon's information theory.** Ashby showed the law is
homologous to Shannon's Theorem 10: the amount of noise that can be removed by
a correction channel is limited by the channel's information capacity. The
regulator is a correction channel; the disturbances are noise; the goal
(homeostasis) is a message of entropy zero (constancy). R's capacity as a
regulator cannot exceed R's capacity as a channel of communication.

**What happens when the critic has less variety than the generator.**

Consider the generator's output space: it can produce applications with hundreds
of distinguishable quality variations -- different levels of feature
completeness, different kinds of visual design quality, different error handling
approaches, different accessibility characteristics. The variety of the
generator's output space is enormous.

Now consider a critic that uses a compressed scale -- effectively scoring
everything 7-10, with 80% of outputs receiving 8 or 9. This critic has an
effective variety of approximately 4 states (7, 8, 9, 10). The generator's
output variety might be 100+.

By Ashby's law: V_outcome >= V_generator - V_critic. If V_generator = 100 and
V_critic = 4, then at least 96 distinct quality levels pass through the critic
unregulated. The critic literally cannot distinguish between them. A mediocre
application and a good application both score 8. A good application and an
excellent application both score 9. The generator receives no signal about the
differences between these quality levels.

**The channel capacity analogy.** The critic is a communication channel between
the quality of the generated output and the generator's next iteration. If this
channel has low capacity (few distinguishable score levels), the information
about quality that reaches the generator is correspondingly limited. Shannon's
theorem guarantees this: you cannot transmit more information through a channel
than its capacity permits.

**Practical implications for our critic system:**

- A 1-10 scale that effectively operates as a 7-10 scale has the variety of a
  2-bit channel (4 distinguishable states). A 1-10 scale that uses the full
  range has the variety of a 3.3-bit channel (10 distinguishable states).
  Expanding the effective range from 4 to 10 states more than doubles the
  information capacity of the critic.

- Each evaluation dimension adds variety multiplicatively. Four dimensions with
  10 effective states each provide 10^4 = 10,000 distinguishable quality
  profiles. Four dimensions with 4 effective states each provide only 4^4 = 256.
  The compressed scale loses 97.5% of the critic's potential variety.

- Ashby's law explains why "score inflation" is not merely an aesthetic problem
  but a fundamental control-theoretic failure: the regulator has lost requisite
  variety and can no longer effectively regulate the system.

### 7.6. The Conant-Ashby Good Regulator Theorem

**The theorem (Conant & Ashby, 1970).** "Every good regulator of a system must
be a model of that system." More precisely: any regulator that is both maximally
successful and maximally simple must be isomorphic (or at least homomorphic)
with the system being regulated. The making of a model is not optional -- it is
a mathematical necessity for effective regulation.

**Implication for critics.** An LLM critic that does not model the quality
dimensions of the generated output -- that does not internally represent what
"good visual design" or "robust error handling" looks like in the context of
this specific application type -- cannot be an effective regulator. The critic
must be a model of the quality space it evaluates.

This is why generic evaluation prompts fail: they do not contain a model of the
specific system being evaluated. The calibration scenarios, ceiling rules, and
spec-relative scoring in the current system are all attempts to give the critic
a model of the generator's output space. The Conant-Ashby theorem says this
modeling effort is not optional -- it is a prerequisite for effective regulation.

### 7.7. Beer's Viable System Model: The Algedonic Signal

**The concept (Beer, 1972).** In Beer's Viable System Model, the algedonic
signal (from Greek algos "pain" and hedos "pleasure") is an emergency channel
that bypasses normal hierarchical communication. When performance deviates
significantly from capability -- either positively (pleasure/innovation) or
negatively (pain/failure) -- an algedonic alert is sent directly to System 5
(policy/identity), the highest level of management.

**The somnolent state danger.** Beer identified a critical pathology: "If the
3-4 homeostat is working well, there may be little for System 5 to do.
Effectively, System 5 will continuously receive the signal that everything is
ok. This is fine, as long as System 5 does not fall into a somnolent state, and
fail to wake up when action is necessary."

When only pleasure signals flow upward -- when the system reports "all is well"
continuously -- the highest level of management falls asleep. It stops
monitoring. It loses the ability to respond to genuine threats when they
eventually arrive. The algedonic channel exists specifically to break through
this complacency.

**The risk of a system that only signals pleasure (high scores).**

In our evaluation system, the generator-critic loop is a recursive viable
system. The critic is the algedonic channel -- it is supposed to signal both
pain (defects found, scores below threshold) and pleasure (improvements noted,
thresholds met). If the critic only signals pleasure:

1. **The generator enters a somnolent state**: It receives consistent 8-10
   scores, interprets this as "the work is done," and makes only superficial
   changes in subsequent rounds. This is the exact analogue of System 5 falling
   asleep.

2. **Real defects go undetected**: Placeholder images, missing features, broken
   error handling -- all pass through because the critic's pain signal is
   suppressed. The system has no mechanism to escalate genuine problems.

3. **The evaluation loop converges prematurely**: High scores trigger the
   "threshold met" exit condition. The system declares success and stops
   iterating. This is the organizational equivalent of a company whose internal
   reporting always says "on track" until the project catastrophically fails.

4. **Loss of diagnostic value**: Just as Beer warned that System 5 loses the
   ability to distinguish routine from exceptional, a lenient critic loses the
   ability to distinguish improvement from stagnation. All rounds look the same.

**The algedonic design principle:** A viable evaluation system must have both
pain and pleasure channels, and the pain channel must be able to bypass the
generator's self-assessment. In our system, this means:

- Ceiling rules that trigger automatically on detected conditions (pain that
  cannot be rationalized away)
- Mandatory defect quotas that force the critic to look for problems
- Score priors that treat high scores as exceptional rather than default

### 7.8. Turing Test Theory: Interrogator Effort and Detection Accuracy

**The structure (Turing, 1950).** The Turing test is inherently adversarial: a
machine (the generator) attempts to fool an interrogator (the discriminator/
critic), while the interrogator attempts to distinguish machine from human.
The test's power depends entirely on the quality of the interrogator.

**Dennett's weak vs. strong interrogator problem.** Dennett (1984, 1997)
identified a central issue: when interrogators are naieve or unsophisticated,
even primitive programs can fool them. The first Loebner Prize was won by "a
mindless program with no identifiable intelligence that managed to fool naive
interrogators." The winner succeeded partly by imitating human typing errors.

Dennett later lamented that the Turing test "requires too much Disney and not
enough science." The test was measuring the sophistication of the interrogators,
not the intelligence of the machines. When expert interrogators (philosophers,
computer scientists) were deployed, the bar rose dramatically.

**The interrogator effort principle.** Robert French (1990) argued that careful,
probing questioning can unmask any machine -- but the effort required to do so
may be enormous. A weak interrogator asks surface-level questions that any
pattern-matcher can answer. A strong interrogator probes for deep understanding,
consistency, and subcognitive capacities that expose the machine's limitations.

Detection accuracy is a function of interrogator effort, not just interrogator
capability. A capable interrogator who asks lazy questions will fail to detect
a competent machine. This is the distinction between a critic that CAN detect
defects and a critic that DOES detect defects.

**The confederate effect.** In Turing test experiments, human confederates are
sometimes misidentified as machines. What interrogators expect as "human" is not
necessarily typical of actual humans. This maps to a calibration problem: what
the critic expects as "good code" may not match what is actually good code. The
critic may have an internal model of quality that is miscalibrated -- rating
generic AI-slop as "good" because it pattern-matches to well-structured code,
even though the content is hollow.

**Direct mapping to LLM critics:**

- **Weak interrogator problem**: An LLM critic with a generic prompt ("evaluate
  this code") is a weak interrogator. It asks surface-level questions: does the
  code compile? Does it have reasonable structure? Does it look professional?
  These are the typing-error-level tricks that fool naive evaluators. A strong
  interrogator (calibrated critic) asks: does this actually implement the spec?
  Are these real images or placeholders? Does error handling actually work, or
  does it just exist?

- **Interrogator effort maps to prompt investment**: The detection accuracy of
  the critic is a direct function of the effort invested in its evaluation
  prompt. A two-sentence prompt produces a weak interrogator. A prompt with
  calibration scenarios, ceiling rules, mandatory defect quotas, and spec-
  relative scoring produces a strong interrogator.

- **The confederate effect maps to AI-slop acceptance**: LLM-generated code has
  a distinctive "look" -- clean structure, verbose comments, reasonable variable
  names -- that pattern-matches to quality. An LLM critic is particularly
  susceptible to this because it has the same training data and the same
  aesthetic. It sees well-formatted code and infers quality, even when the
  code is substantively wrong or incomplete. This is the confederate effect:
  the critic's model of "good" is miscalibrated toward surface features.

### 7.9. Synthesis: What the Theoretical Frameworks Collectively Recommend

All five frameworks converge on the same conclusion: **a lenient critic is a
broken critic, and a broken critic produces a stagnant generator.**

| Framework | Core Principle | Failure Mode | Design Remedy |
|-----------|---------------|--------------|---------------|
| GAN (Goodfellow) | Discriminator IS the loss function | Overconfident D -> vanishing gradients | Non-saturating loss; label smoothing |
| WGAN (Arjovsky) | Continuous critic with Lipschitz constraint | Weight clipping pathologies; finite-step non-convergence | Gradient penalty; train critic harder |
| Label Smoothing (Salimans) | One-sided soft ceiling on "real" label | Two-sided smoothing creates perverse incentives | Soften the ceiling, keep the floor honest |
| Requisite Variety (Ashby) | Regulator variety >= system variety | Compressed scoring destroys information capacity | Use the full scale range |
| Good Regulator (Conant-Ashby) | Regulator must model the system | Generic evaluation misses domain-specific quality | Calibration scenarios; spec-relative scoring |
| Algedonic Signal (Beer) | Pain channel must reach the top | Pleasure-only signals cause somnolent state | Mandatory defect detection; automatic ceiling triggers |
| Turing Test (Turing/Dennett) | Detection accuracy = f(interrogator effort) | Weak interrogator fooled by surface features | Invest in critic prompt quality; probe deeply |

The common thread: **the evaluation function must be well-calibrated -- neither
too lenient nor too harsh, with sufficient variety to distinguish quality levels,
and enough interrogative depth to detect genuine defects rather than accepting
surface-level quality.**

## Actionable Recommendations

Ordered by expected impact, highest first:

### 1. Procedural Ceiling Detection (High Impact, Medium Effort)

Move ceiling-triggering conditions from critic judgment to deterministic checks.
The `check-assets` CLI command already exists for image validation. Extend it:

- `check-assets --placeholder-audit` -> returns boolean "all images placeholder"
- Add a `check-features` command that compares SPEC.md feature list against
  acceptance test results -> returns feature coverage percentage
- Feed these booleans to critics as pre-computed constraints: "The asset audit
  found: all images are placeholders. Per SCORING-CALIBRATION.md, Visual Design
  ceiling is max 3."

This removes the critic's opportunity to rationalize away ceiling conditions.

### 2. Embed Critical Anchors in Agent Prompts (High Impact, Low Effort)

Move the "below threshold" calibration scenarios directly into each critic's agent
definition (perceptual-critic.md, projection-critic.md, perturbation-critic.md).
Not the full set -- just the 1-2 scenarios most relevant to round 1 inflation.

Add a new scenario: "Round 1 Typical" that describes the generic first-generation
output and anchors it to score 4-5.

### 3. Mandatory Defect Quota (Medium Impact, Low Effort)

Add to each critic's prompt: "You must identify at least 3 findings before
assigning any score. If you cannot find 3 issues, look harder -- round 1
applications always have issues."

This counters the superficial-review failure mode where the critic glances at the
app, finds nothing obviously wrong, and scores 7+.

### 4. Chain-of-Thought Before Score (Medium Impact, Low Effort)

Require critics to output their full reasoning (all findings, all ceiling checks,
all spec comparisons) BEFORE outputting the score number. Research consistently
shows CoT produces more accurate evaluations. The current system has the score in
summary.json -- ensure critics write findings FIRST, then compute the score from
findings, not the other way around.

### 5. Round 1 Score Prior (Medium Impact, Low Effort)

Add to critic prompts: "First-generation applications typically score between 3 and
5 on each dimension. A round 1 score above 6 on any dimension requires explicit
justification against the calibration scenarios explaining why this application is
better than the threshold example."

This is label smoothing for LLM judges -- it shifts the prior distribution
downward, forcing the critic to argue for high scores rather than defaulting to
them.

### 6. Reduce Scale Breadth (Low Impact, High Effort -- Defer)

Research favors 1-5 scales over 1-10 for LLM judges. However, the current system
has extensive calibration infrastructure built around 1-10. A scale change would
require rewriting all calibration scenarios, ceiling rules, and thresholds. Defer
unless other mitigations prove insufficient.

### 7. Multi-Judge Ensemble (Low Impact for Cost, High Effort -- Defer)

Running 3-5 different judge models reduces bias 30-40% but costs 3-5x more. The
current system already uses three specialized critics (perceptual, projection,
perturbation) which provides domain-specific diversity. Adding model diversity
(e.g., running one critic on a different model) could help but is expensive.

---

## Sources

- [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) -- Prithvi Rajasekaran, Mar 2026
- [GoDaddy: Calibrating Scores of LLM-as-a-Judge](https://www.godaddy.com/resources/news/calibrating-scores-of-llm-as-a-judge) -- Harsh Nilesh Pathak, Nov 2025
- [Kinde: LLM-as-a-Judge Done Right](https://www.kinde.com/learn/ai-for-software-engineering/best-practice/llm-as-a-judge-done-right-calibrating-guarding-debiasing-your-evaluators/)
- [LangChain: How to Calibrate LLM-as-a-Judge with Human Corrections](https://www.langchain.com/articles/llm-as-a-judge)
- [arXiv 2411.15594: A Survey on LLM-as-a-Judge](https://arxiv.org/abs/2411.15594)
- [arXiv 2506.22316: Evaluating Scoring Bias in LLM-as-a-Judge](https://arxiv.org/html/2506.22316v1)
- [arXiv 2501.00274: LLM-Rubric: Multidimensional Calibrated Evaluation](https://arxiv.org/html/2501.00274v1)
- [arXiv 2503.23989: Rubric Is All You Need (Code Evaluation)](https://arxiv.org/html/2503.23989v1)
- [arXiv 2601.08654: RULERS: Locked Rubrics and Evidence-Anchored Scoring](https://arxiv.org/html/2601.08654)
- [arXiv 2603.00077: Autorubric: Unified Framework for Rubric-Based LLM Evaluation](https://arxiv.org/html/2603.00077v1)
- [arXiv 2604.00259: LLM Essay Scoring Under Holistic and Analytic Rubrics](https://arxiv.org/html/2604.00259)
- [arXiv 2504.21625: Meeseeks: Multi-Turn Instruction-Following Evaluation](https://arxiv.org/html/2504.21625v1)
- [arXiv 2512.10350: Geometric Dynamics of Agentic Loops](https://arxiv.org/html/2512.10350v5)
- [Beyond Consensus: Mitigating Agreeableness Bias in LLM Judge Evaluations](https://aicet.comp.nus.edu.sg/wp-content/uploads/2025/10/Beyond-Consensus-Mitigating-the-agreeableness-bias-in-LLM-judge-evaluations.pdf)
- [OpenReview: Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge](https://openreview.net/forum?id=3GTtZFiajM)
- [IIETA: Application of Smoothing Labels to Alleviate Overconfident GAN Discriminator](https://www.iieta.org/journals/ria/paper/10.18280/ria.380204)
- [Cameron Wolfe: Using LLMs for Evaluation](https://cameronrwolfe.substack.com/p/llm-as-a-judge)
- [Evidently AI: LLM-as-a-Judge Complete Guide](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
- [Confident AI: LLM Evaluation Metrics Guide](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation)
- [Label Your Data: LLM as a Judge 2026 Guide](https://labelyourdata.com/articles/llm-as-a-judge)
- [Google: GAN Training](https://developers.google.com/machine-learning/gan/training)
- [DEV: Implementing Automated Rules-Based Evaluations](https://dev.to/kalio/implementing-automated-rules-based-evaluations-for-llm-applications-468j)

### Theoretical Foundations Sources (Section 7)

**GAN Theory:**
- [Goodfellow et al., 2014: Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) -- Original GAN paper, optimal discriminator D*(x), minimax formulation
- [Salimans et al., 2016: Improved Techniques for Training GANs](https://arxiv.org/abs/1606.03498) -- One-sided label smoothing, feature matching, historical averaging
- [Arjovsky et al., 2017: Wasserstein GAN](https://arxiv.org/abs/1701.07875) -- WGAN critic design, Earth Mover's distance, safe to train critic to optimality
- [Gulrajani et al., 2017: Improved Training of Wasserstein GANs](https://arxiv.org/abs/1704.00028) -- WGAN-GP, gradient penalty replacing weight clipping
- [Mescheder et al., 2018: Which Training Methods for GANs do actually Converge?](https://arxiv.org/abs/1801.04406) -- Convergence analysis, finite-step critic training limitations
- [Lilian Weng: From GAN to WGAN](https://lilianweng.github.io/posts/2017-08-20-gan/) -- Comprehensive overview of GAN to WGAN theory
- [David Leon: GAN Convergence and Stability -- Eight Techniques Explained](https://davidleonfdez.github.io/gan/2022/05/17/gan-convergence-stability.html)
- [Google: GAN Common Problems](https://developers.google.com/machine-learning/gan/problems) -- Discriminator overconfidence, mode collapse, training instability
- [Neptune.ai: Understanding GAN Loss Functions](https://neptune.ai/blog/gan-loss-functions) -- Discriminator as learned loss function
- [Neptune.ai: GAN Failure Modes](https://neptune.ai/blog/gan-failure-modes) -- Vanishing gradients, convergence failure

**Cybernetics:**
- [Ashby, 1956: An Introduction to Cybernetics](https://www.panarchy.org/ashby/variety.1956.html) -- Law of Requisite Variety, Shannon connection
- [Conant & Ashby, 1970: Every Good Regulator of a System Must Be a Model of That System](https://pespmc1.vub.ac.be/books/Conant_Ashby.pdf) -- Good Regulator Theorem
- [Wikipedia: Variety (cybernetics)](https://en.wikipedia.org/wiki/Variety_(cybernetics)) -- Variety attenuation and amplification
- [BusinessBalls: Ashby's Law of Requisite Variety](https://www.businessballs.com/strategy-innovation/ashbys-law-of-requisite-variety/)
- [Systems Thinking Alliance: Ashby's Law Explained](https://systemsthinkingalliance.org/ashbys-law-of-requisite-variety/)
- [Wikipedia: Viable System Model](https://en.wikipedia.org/wiki/Viable_system_model) -- Beer's VSM, algedonic signals
- [BusinessBalls: Stafford Beer's Viable System Model](https://www.businessballs.com/strategy-innovation/viable-system-model-stafford-beer/) -- Algedonic alerts, somnolent state danger
- [Wikipedia: Good Regulator Theorem](https://en.wikipedia.org/wiki/Good_regulator_theorem) -- Conant-Ashby theorem, ethical regulator extension

**Turing Test Theory:**
- [Dennett, 1984/1992: Can Machines Think?](https://aaai.org/ojs/index.php/aimagazine/article/view/993/911) -- Weak vs. strong interrogators, defense of Turing test
- [PhilSci Archive: Can Machines Think? The Controversy That Led to the Turing Test](https://philsci-archive.pitt.edu/20484/1/turing-test-controversy-preprint.pdf) -- Turing test underspecification, Loebner Prize critique
- [Wikipedia: Turing Test](https://en.wikipedia.org/wiki/Turing_test) -- Historical overview, confederate effect
- [Jones et al., 2025: Large Language Models Pass the Turing Test](https://arxiv.org/abs/2503.23674) -- GPT-4.5 passes standard Turing test, interrogator effort analysis
- [Gao et al., 2021: An Adversarially-Learned Turing Test for Dialog Generation](https://arxiv.org/abs/2104.08231) -- Adversarial training for robust discriminators
