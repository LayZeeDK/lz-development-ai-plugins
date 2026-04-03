import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function readImpl(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// EVAL-01: Perceptual-critic enhanced with cross-page visual consistency
// checks (design token extraction, color/typography/spacing comparison
// across pages).
// ---------------------------------------------------------------------------
describe('EVAL-01: Perceptual-critic cross-page visual consistency audit', function () {
  const filePath = 'plugins/application-dev/agents/perceptual-critic.md';

  it('EVAL-01-a: tools array contains Bash(npx playwright test *)', function () {
    const content = readImpl(filePath);

    assert.ok(
      content.includes('Bash(npx playwright test *)'),
      'perceptual-critic.md tools array must contain "Bash(npx playwright test *)" for write-and-run audit execution'
    );
  });

  it('EVAL-01-b: contains "consistency-audit" text', function () {
    const content = readImpl(filePath);

    assert.ok(
      content.includes('consistency-audit'),
      'perceptual-critic.md must contain "consistency-audit" text for the cross-page audit'
    );
  });

  it('EVAL-01-c: contains reference to consistency-audit.spec.ts or consistency-audit.json', function () {
    const content = readImpl(filePath);

    assert.ok(
      content.includes('consistency-audit.spec.ts') || content.includes('consistency-audit.json'),
      'perceptual-critic.md must reference "consistency-audit.spec.ts" or "consistency-audit.json"'
    );
  });

  it('EVAL-01-d: consistency audit content appears within or after the OBSERVE section', function () {
    const content = readImpl(filePath);
    const observeIndex = content.indexOf('### OBSERVE');
    const detectIndex = content.indexOf('### DETECT');
    const auditIndex = content.indexOf('consistency-audit');

    assert.ok(
      observeIndex !== -1,
      'perceptual-critic.md must contain "### OBSERVE" heading'
    );

    assert.ok(
      detectIndex !== -1,
      'perceptual-critic.md must contain "### DETECT" heading'
    );

    assert.ok(
      auditIndex !== -1,
      'perceptual-critic.md must contain "consistency-audit" text'
    );

    assert.ok(
      auditIndex > observeIndex && auditIndex < detectIndex,
      'consistency-audit content must appear between OBSERVE and DETECT sections ' +
        `(OBSERVE at ${observeIndex}, audit at ${auditIndex}, DETECT at ${detectIndex})`
    );
  });
});

// ---------------------------------------------------------------------------
// EVAL-02: Projection-critic enhanced with A->B->A navigation testing
// (round-trip navigation, state persistence, back-button behavior).
// ---------------------------------------------------------------------------
describe('EVAL-02: Projection-critic A->B->A round-trip navigation testing', function () {
  const filePath = 'plugins/application-dev/agents/projection-critic.md';

  it('EVAL-02-a: contains "Round-trip" or "round-trip" or "A->B->A" text', function () {
    const content = readImpl(filePath);
    const lower = content.toLowerCase();

    assert.ok(
      lower.includes('round-trip') || content.includes('A->B->A'),
      'projection-critic.md must contain "Round-trip", "round-trip", or "A->B->A" text'
    );
  });

  it('EVAL-02-b: contains reference to "goBack"', function () {
    const content = readImpl(filePath);

    assert.ok(
      content.includes('goBack'),
      'projection-critic.md must reference "goBack" (from page.goBack())'
    );
  });

  it('EVAL-02-c: mentions FN- finding prefix in round-trip context', function () {
    const content = readImpl(filePath);
    const lower = content.toLowerCase();

    assert.ok(
      lower.includes('round-trip') || content.includes('A->B->A'),
      'projection-critic.md must contain round-trip context'
    );

    assert.ok(
      content.includes('FN-'),
      'projection-critic.md must mention "FN-" finding prefix for round-trip test failures'
    );
  });

  it('EVAL-02-d: states round-trip tests are excluded from acceptance_tests.results[]', function () {
    const content = readImpl(filePath);

    assert.ok(
      content.includes('acceptance_tests.results'),
      'projection-critic.md must reference "acceptance_tests.results"'
    );

    const lower = content.toLowerCase();

    assert.ok(
      lower.includes('not included') ||
        lower.includes('excluded') ||
        lower.includes('not') && lower.includes('acceptance_tests.results'),
      'projection-critic.md must state that round-trip tests are excluded from acceptance_tests.results[]'
    );
  });
});

// ---------------------------------------------------------------------------
// EVAL-03: Visual Design calibration scenarios in SCORING-CALIBRATION.md
// updated for expanded cross-page scope.
// ---------------------------------------------------------------------------
describe('EVAL-03: SCORING-CALIBRATION.md Visual Design calibration update', function () {
  const filePath =
    'plugins/application-dev/skills/application-dev/references/evaluator/SCORING-CALIBRATION.md';

  it('EVAL-03-a: Visual Design ceiling table contains shared component divergence row with max 6', function () {
    const content = readImpl(filePath);

    // Find the Visual Design ceiling section
    const vdIndex = content.indexOf('### Visual Design');
    const nextSection = content.indexOf('###', vdIndex + 1);
    const vdSection = content.slice(vdIndex, nextSection !== -1 ? nextSection : undefined);

    assert.ok(
      (vdSection.includes('shared component') || vdSection.includes('nav/footer')) &&
        vdSection.includes('max 6'),
      'SCORING-CALIBRATION.md Visual Design ceiling table must contain a shared component/nav-footer divergence row with "max 6"'
    );
  });

  it('EVAL-03-b: 6/10 scenario mentions nav consistency or cross-page language', function () {
    const content = readImpl(filePath);

    // Find the Visual Design 6/10 scenario area (At Threshold)
    const atThresholdIndex = content.indexOf('At Threshold: 6/10', content.indexOf('### Visual Design'));
    const aboveThresholdIndex = content.indexOf('Above Threshold: 8/10', content.indexOf('### Visual Design'));

    assert.ok(
      atThresholdIndex !== -1,
      'SCORING-CALIBRATION.md must contain "At Threshold: 6/10" in the Visual Design section'
    );

    const scenario6 = content.slice(atThresholdIndex, aboveThresholdIndex !== -1 ? aboveThresholdIndex : undefined);
    const lower6 = scenario6.toLowerCase();

    assert.ok(
      lower6.includes('nav') || lower6.includes('cross-page') || lower6.includes('across') || lower6.includes('consistency'),
      'SCORING-CALIBRATION.md 6/10 scenario must mention nav consistency or cross-page language'
    );
  });

  it('EVAL-03-c: 8/10 scenario contains "ACROSS ALL PAGES" or equivalent cross-page language', function () {
    const content = readImpl(filePath);

    // Find the Visual Design 8/10 scenario area (Above Threshold)
    const aboveThresholdIndex = content.indexOf('Above Threshold: 8/10', content.indexOf('### Visual Design'));
    const robustnessIndex = content.indexOf('### Robustness');

    assert.ok(
      aboveThresholdIndex !== -1,
      'SCORING-CALIBRATION.md must contain "Above Threshold: 8/10" in the Visual Design section'
    );

    const scenario8 = content.slice(aboveThresholdIndex, robustnessIndex !== -1 ? robustnessIndex : undefined);

    assert.ok(
      scenario8.includes('ACROSS ALL PAGES') ||
        scenario8.includes('across all pages') ||
        scenario8.includes('every page'),
      'SCORING-CALIBRATION.md 8/10 scenario must contain "ACROSS ALL PAGES" or equivalent cross-page language'
    );
  });
});
