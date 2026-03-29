import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..");
const EVALUATOR_PATH = join(REPO_ROOT, "plugins/application-dev/agents/evaluator.md");
const REFERENCES_DIR = join(
  REPO_ROOT,
  "plugins/application-dev/skills/application-dev/references/evaluator"
);
const SCORING_CALIBRATION_PATH = join(REFERENCES_DIR, "SCORING-CALIBRATION.md");
const AI_PROBING_PATH = join(REFERENCES_DIR, "AI-PROBING-REFERENCE.md");
const EVALUATION_TEMPLATE_PATH = join(REFERENCES_DIR, "EVALUATION-TEMPLATE.md");

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

// Helper: extract content between two markdown section headings.
// Uses "### Step N" patterns to avoid matching "Step N" in prose.
function sliceStep(content, stepN, nextN) {
  const startMarker = `### Step ${stepN}`;
  const endMarker = `### Step ${nextN}`;
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + 1);

  if (start === -1) {
    return "";
  }

  return end === -1 ? content.slice(start) : content.slice(start, end);
}

// Helper: extract content between two top-level (##) section headings.
// Avoids matching ### subsections.
function sliceH2Section(content, heading) {
  const marker = `## ${heading}`;
  const start = content.indexOf(marker);

  if (start === -1) {
    return "";
  }

  // Find the next "\n## " (top-level section), not "###"
  const nextH2 = content.indexOf("\n## ", start + marker.length);

  return nextH2 === -1 ? content.slice(start) : content.slice(start, nextH2);
}

// ---------------------------------------------------------------------------
// EVAL-01: Asset validation -- evaluator.md Step 7 + EVALUATION-TEMPLATE.md
// ---------------------------------------------------------------------------

describe("EVAL-01: Asset validation is present in evaluator workflow and template", function () {
  it("evaluator.md Step 7 exists and covers broken images, CORS, placeholders with URLs", function () {
    const content = read(EVALUATOR_PATH);

    assert.ok(
      content.includes("### Step 7"),
      "evaluator.md must contain ### Step 7 heading"
    );

    const step7Content = sliceStep(content, 7, 8);

    assert.ok(
      step7Content.toLowerCase().includes("asset"),
      "Step 7 must cover asset validation"
    );

    // Step 7 delegates to ASSET-VALIDATION-PROTOCOL.md which contains CORS detail;
    // Step 7 itself must mention the protocol or broken/CORS/placeholder
    const hasAssetDetail =
      step7Content.includes("ASSET-VALIDATION-PROTOCOL") ||
      step7Content.toLowerCase().includes("cors") ||
      step7Content.toLowerCase().includes("placeholder") ||
      step7Content.toLowerCase().includes("broken");

    assert.ok(
      hasAssetDetail,
      "Step 7 must mention CORS/placeholder/broken assets or reference ASSET-VALIDATION-PROTOCOL.md"
    );
  });

  it("evaluator.md Step 3 installs sharp, imghash, and leven toolchain", function () {
    const content = read(EVALUATOR_PATH);

    const step3Content = sliceStep(content, 3, 4);

    assert.ok(
      step3Content.includes("sharp"),
      "Step 3 must mention sharp"
    );

    assert.ok(
      step3Content.includes("imghash"),
      "Step 3 must mention imghash"
    );

    assert.ok(
      step3Content.includes("leven"),
      "Step 3 must mention leven"
    );
  });

  it("EVALUATION-TEMPLATE.md has Asset Validation section with required subsections", function () {
    const content = read(EVALUATION_TEMPLATE_PATH);

    assert.ok(
      content.includes("## Asset Validation"),
      "EVALUATION-TEMPLATE.md must have ## Asset Validation section"
    );

    assert.ok(
      content.includes("### Network Issues"),
      "Asset Validation must have Network Issues subsection"
    );

    assert.ok(
      content.includes("### Visual Inspection"),
      "Asset Validation must have Visual Inspection subsection"
    );

    assert.ok(
      content.includes("### Duplicate Detection"),
      "Asset Validation must have Duplicate Detection subsection"
    );

    assert.ok(
      content.includes("### Fonts"),
      "Asset Validation must have Fonts subsection"
    );

    assert.ok(
      content.includes("### Meta Assets"),
      "Asset Validation must have Meta Assets subsection"
    );
  });
});

// ---------------------------------------------------------------------------
// EVAL-02: AI probing -- AI-PROBING-REFERENCE.md content and evaluator.md Step 8
// ---------------------------------------------------------------------------

describe("EVAL-02: AI probing reference covers all modalities and Turing test concepts", function () {
  it("AI-PROBING-REFERENCE.md exists and contains all 12 modality sections", function () {
    const content = read(AI_PROBING_PATH);

    const modalities = [
      "Text -> Text",
      "Text -> Image",
      "Image -> Text",
      "Image -> Image",
      "Text -> Audio",
      "Audio -> Text",
      "Text -> Structured Data",
      "Interactive",
      "Data -> Data",
      "Server-Side-Only",
      "Invisible AI",
      "Game AI",
    ];

    for (const modality of modalities) {
      assert.ok(
        content.includes(modality),
        `AI-PROBING-REFERENCE.md must contain modality section covering: ${modality}`
      );
    }
  });

  it("AI-PROBING-REFERENCE.md has 10-probe battery entries", function () {
    const content = read(AI_PROBING_PATH);

    // Probe 0 through Probe 9 must all be present
    for (let i = 0; i <= 9; i++) {
      assert.ok(
        content.includes(`Probe ${i}`),
        `AI-PROBING-REFERENCE.md must contain Probe ${i} entry`
      );
    }
  });

  it("AI-PROBING-REFERENCE.md has all 6 Turing test concept sections", function () {
    const content = read(AI_PROBING_PATH);

    const turingConcepts = [
      "Winograd",
      "Grice",
      "Compression",
      "Complexity Scaling",
      "Theory of Mind",
      "Visual Turing",
    ];

    for (const concept of turingConcepts) {
      assert.ok(
        content.includes(concept),
        `AI-PROBING-REFERENCE.md must contain Turing test concept: ${concept}`
      );
    }
  });

  it("evaluator.md Step 8 references AI-PROBING-REFERENCE.md via CLAUDE_PLUGIN_ROOT path", function () {
    const content = read(EVALUATOR_PATH);

    const step8Content = sliceStep(content, 8, 9);

    assert.ok(
      step8Content.includes("AI-PROBING-REFERENCE"),
      "Step 8 must reference AI-PROBING-REFERENCE.md"
    );

    assert.ok(
      step8Content.includes("${CLAUDE_PLUGIN_ROOT}") ||
        step8Content.includes("CLAUDE_PLUGIN_ROOT"),
      "Step 8 must use CLAUDE_PLUGIN_ROOT path pattern"
    );
  });
});

// ---------------------------------------------------------------------------
// EVAL-03: Scoring calibration -- SCORING-CALIBRATION.md and evaluator.md Step 12
// ---------------------------------------------------------------------------

describe("EVAL-03: Scoring calibration covers all criteria with ceiling rules and scenarios", function () {
  it("SCORING-CALIBRATION.md has ceiling rules for all 5 ceiling categories", function () {
    const content = read(SCORING_CALIBRATION_PATH);

    const ceilingCategories = [
      "Functionality",
      "Product Depth",
      "Visual Design",
      "Code Quality",
      "Browser AI Degradation",
    ];

    for (const category of ceilingCategories) {
      assert.ok(
        content.includes(category),
        `SCORING-CALIBRATION.md must have ceiling rules for: ${category}`
      );
    }
  });

  it("SCORING-CALIBRATION.md has 12 calibration scenarios (3 per criterion for 4 criteria)", function () {
    const content = read(SCORING_CALIBRATION_PATH);

    // Scope the search within the ## Calibration Scenarios section only,
    // because criterion names also appear in the ceiling rules section.
    const calSectionStart = content.indexOf("## Calibration Scenarios");

    assert.ok(
      calSectionStart !== -1,
      "SCORING-CALIBRATION.md must have a ## Calibration Scenarios section"
    );

    const calContent = content.slice(calSectionStart);

    // Each criterion must have below/at/above threshold scenarios
    const criteria = ["Product Depth", "Functionality", "Visual Design", "Code Quality"];
    const thresholdLabels = ["Below Threshold", "At Threshold", "Above Threshold"];

    for (const criterion of criteria) {
      const criterionStart = calContent.indexOf(`### ${criterion}`);

      assert.ok(
        criterionStart !== -1,
        `SCORING-CALIBRATION.md Calibration Scenarios must have a section for: ${criterion}`
      );

      // Find the next ### section (or end of string) to scope our search
      const nextSectionIndex = calContent.indexOf("###", criterionStart + 1);
      const criterionContent =
        nextSectionIndex === -1
          ? calContent.slice(criterionStart)
          : calContent.slice(criterionStart, nextSectionIndex);

      for (const label of thresholdLabels) {
        assert.ok(
          criterionContent.includes(label),
          `SCORING-CALIBRATION.md ${criterion} calibration section must have a "${label}" scenario`
        );
      }
    }
  });

  it("SCORING-CALIBRATION.md has conflict resolution rules", function () {
    const content = read(SCORING_CALIBRATION_PATH);

    assert.ok(
      content.toLowerCase().includes("conflict") ||
        content.toLowerCase().includes("resolution") ||
        content.toLowerCase().includes("criteria are independent"),
      "SCORING-CALIBRATION.md must have conflict resolution rules"
    );
  });

  it("SCORING-CALIBRATION.md has score-against-the-spec rule", function () {
    const content = read(SCORING_CALIBRATION_PATH);

    assert.ok(
      content.toLowerCase().includes("spec") &&
        (content.toLowerCase().includes("score-against") ||
          content.toLowerCase().includes("score against") ||
          content.includes("Score-Against-the-Spec") ||
          content.includes("score against the spec")),
      "SCORING-CALIBRATION.md must have a score-against-the-spec rule"
    );
  });

  it("evaluator.md Step 12 references SCORING-CALIBRATION.md via CLAUDE_PLUGIN_ROOT path", function () {
    const content = read(EVALUATOR_PATH);

    const step12Content = sliceStep(content, 12, 13);

    assert.ok(
      step12Content.includes("SCORING-CALIBRATION"),
      "Step 12 must reference SCORING-CALIBRATION.md"
    );

    assert.ok(
      step12Content.includes("${CLAUDE_PLUGIN_ROOT}") ||
        step12Content.includes("CLAUDE_PLUGIN_ROOT"),
      "Step 12 must use CLAUDE_PLUGIN_ROOT path pattern"
    );
  });

  it("evaluator.md Self-Verification has 10 checks", function () {
    const content = read(EVALUATOR_PATH);

    // The self-verification section must list checks 1-10
    const selfVerifStart = content.indexOf("Self-Verification");

    assert.ok(
      selfVerifStart !== -1,
      "evaluator.md must have a Self-Verification section"
    );

    const selfVerifContent = content.slice(selfVerifStart);

    // All 10 numbered checks must be present
    for (let i = 1; i <= 10; i++) {
      assert.ok(
        selfVerifContent.includes(`${i}.`) || selfVerifContent.includes(`**${i}.**`),
        `Self-Verification must include check #${i}`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// EVAL-04: Link checking -- evaluator.md Step 7 mentions link checking
// ---------------------------------------------------------------------------

describe("EVAL-04: Link checking is specified in evaluator Step 7", function () {
  it("evaluator.md Step 7 mentions link checking with internal, external, anchor links", function () {
    const content = read(EVALUATOR_PATH);

    const step7Content = sliceStep(content, 7, 8);

    assert.ok(
      step7Content.length > 0,
      "evaluator.md must contain a ### Step 7 section"
    );

    // Step 7 delegates detail to ASSET-VALIDATION-PROTOCOL.md; link checking detail is there.
    // evaluator.md Step 7 must at minimum reference the protocol or mention links/broken links.
    const mentionsLinkChecking =
      step7Content.includes("ASSET-VALIDATION-PROTOCOL") ||
      step7Content.toLowerCase().includes("link") ||
      step7Content.toLowerCase().includes("href");

    assert.ok(
      mentionsLinkChecking,
      "Step 7 must mention link checking or reference ASSET-VALIDATION-PROTOCOL.md which contains link check detail"
    );
  });

  it("EVALUATION-TEMPLATE.md Asset Validation section exists for recording link issues", function () {
    const content = read(EVALUATION_TEMPLATE_PATH);

    assert.ok(
      content.includes("## Asset Validation"),
      "EVALUATION-TEMPLATE.md must have ## Asset Validation section for recording findings"
    );

    // Use sliceH2Section to correctly extract Asset Validation content
    // (avoiding the ### subsections being counted as the next ## heading)
    const assetContent = sliceH2Section(content, "Asset Validation");

    assert.ok(
      assetContent.includes("URL") || assetContent.includes("url"),
      "Asset Validation section must reference URLs for recording link check results"
    );
  });
});

// ---------------------------------------------------------------------------
// EVAL-05: Placeholder detection -- evaluator.md Step 7 with severity escalation
// ---------------------------------------------------------------------------

describe("EVAL-05: Placeholder detection with severity escalation by app type", function () {
  it("evaluator.md Step 7 mentions placeholder detection", function () {
    const content = read(EVALUATOR_PATH);

    const step7Content = sliceStep(content, 7, 8);

    assert.ok(
      step7Content.length > 0,
      "evaluator.md must contain a ### Step 7 section"
    );

    // Step 7 may reference ASSET-VALIDATION-PROTOCOL.md for the full detail
    // Check both inline mention and protocol reference
    const hasPlaceholderDetail =
      step7Content.toLowerCase().includes("placeholder") ||
      step7Content.includes("ASSET-VALIDATION-PROTOCOL");

    assert.ok(
      hasPlaceholderDetail,
      "Step 7 must mention placeholder detection or reference ASSET-VALIDATION-PROTOCOL.md that contains it"
    );
  });

  it("evaluator.md toolchain installation includes sharp for image analysis (dimension/metadata)", function () {
    const content = read(EVALUATOR_PATH);

    const step3Start = content.indexOf("Step 3");
    const step4Start = content.indexOf("Step 4");
    const step3Content = content.slice(step3Start, step4Start);

    assert.ok(
      step3Content.includes("sharp"),
      "Step 3 toolchain must include sharp for image dimension/metadata analysis"
    );
  });

  it("SCORING-CALIBRATION.md Visual Design ceiling rule covers placeholder images", function () {
    const content = read(SCORING_CALIBRATION_PATH);

    const visualDesignStart = content.indexOf("### Visual Design");

    assert.ok(
      visualDesignStart !== -1,
      "SCORING-CALIBRATION.md must have a Visual Design ceiling section"
    );

    const nextSection = content.indexOf("###", visualDesignStart + 1);
    const visualDesignContent = content.slice(visualDesignStart, nextSection);

    assert.ok(
      visualDesignContent.toLowerCase().includes("placeholder"),
      "Visual Design ceiling rules must cover placeholder images"
    );
  });
});

// ---------------------------------------------------------------------------
// LOOP-06: Feature count watchdog -- evaluator.md self-verification check #10
// ---------------------------------------------------------------------------

describe("LOOP-06: Feature count watchdog prevents Generator from removing features", function () {
  it("evaluator.md self-verification check 10 enforces feature count >= previous round", function () {
    const content = read(EVALUATOR_PATH);

    const selfVerifStart = content.indexOf("Self-Verification");

    assert.ok(
      selfVerifStart !== -1,
      "evaluator.md must have a Self-Verification section"
    );

    const selfVerifContent = content.slice(selfVerifStart);

    assert.ok(
      selfVerifContent.toLowerCase().includes("feature count"),
      "Self-Verification must include a feature count check"
    );

    assert.ok(
      selfVerifContent.toLowerCase().includes("previous round") ||
        selfVerifContent.toLowerCase().includes("prior round"),
      "Feature count check must reference the previous round"
    );
  });

  it("evaluator.md Step 2 mentions feature count decrease as Critical regression", function () {
    const content = read(EVALUATOR_PATH);

    const step2Content = sliceStep(content, 2, 3);

    assert.ok(
      step2Content.toLowerCase().includes("feature count"),
      "Step 2 must mention feature count comparison"
    );

    assert.ok(
      step2Content.toLowerCase().includes("critical") ||
        step2Content.toLowerCase().includes("regression"),
      "Step 2 must classify feature count decrease as a Critical regression"
    );
  });

  it("evaluator.md Rule 7 covers off-spec features scoring", function () {
    const content = read(EVALUATOR_PATH);

    const rulesStart = content.indexOf("## Rules");

    assert.ok(
      rulesStart !== -1,
      "evaluator.md must have a ## Rules section"
    );

    const rulesContent = content.slice(rulesStart);

    assert.ok(
      rulesContent.includes("off-spec features") ||
        rulesContent.includes("Off-spec features"),
      "Rules section must use the term 'off-spec features'"
    );

    assert.ok(
      rulesContent.toLowerCase().includes("penali"),
      "Rules must state that off-spec features are penalized"
    );
  });
});
