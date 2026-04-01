import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function readImpl(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

function implExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

// ---------------------------------------------------------------------------
// RECOVERY-03: SKILL.md SAFETY_CAP section stops static-serve BEFORE
// spawning the wrap-up Generator, not only after it.
// ---------------------------------------------------------------------------
describe('RECOVERY-03: SAFETY_CAP section stops static-serve before wrap-up Generator spawn', function () {
  it('SKILL.md contains static-serve --stop in the SAFETY_CAP block', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/SKILL.md'
    );

    assert.ok(
      content.includes('static-serve --stop'),
      'SKILL.md must contain at least one "static-serve --stop" call'
    );
  });

  it('SKILL.md static-serve --stop appears before wrap-up Generator spawn in SAFETY_CAP section', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/SKILL.md'
    );

    // Locate the SAFETY_CAP block
    const safetyCapIndex = content.indexOf('"SAFETY_CAP"');

    assert.ok(
      safetyCapIndex !== -1,
      'SKILL.md must contain the SAFETY_CAP exit_condition block'
    );

    // Within the SAFETY_CAP block, find the first static-serve --stop
    const stopIndex = content.indexOf('static-serve --stop', safetyCapIndex);

    assert.ok(
      stopIndex !== -1,
      'SKILL.md must contain static-serve --stop after the SAFETY_CAP marker'
    );

    // The wrap-up Generator spawn appears after the --stop call
    // It is identified by the wrap-up generation round comment
    const generatorSpawnIndex = content.indexOf(
      'application-dev:generator',
      safetyCapIndex
    );

    assert.ok(
      generatorSpawnIndex !== -1,
      'SKILL.md SAFETY_CAP block must contain a Generator spawn'
    );

    assert.ok(
      stopIndex < generatorSpawnIndex,
      'static-serve --stop must appear BEFORE the wrap-up Generator spawn in the SAFETY_CAP block ' +
        `(stop at index ${stopIndex}, Generator spawn at index ${generatorSpawnIndex})`
    );
  });
});

// ---------------------------------------------------------------------------
// PLAYWRIGHT-02: SKILL.md Step 0.5 installs @playwright/test
// as a devDependency alongside @playwright/cli.
// ---------------------------------------------------------------------------
describe('PLAYWRIGHT-02: Step 0.5 installs @playwright/test alongside @playwright/cli', function () {
  it('SKILL.md contains npm install for @playwright/test', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/SKILL.md'
    );

    assert.ok(
      content.includes('@playwright/test'),
      'SKILL.md Step 0.5 must include an install line for @playwright/test'
    );
  });

  it('SKILL.md @playwright/test install uses --save-dev flag', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/SKILL.md'
    );

    assert.ok(
      content.includes('npm install --save-dev @playwright/test'),
      'SKILL.md must install @playwright/test with --save-dev flag'
    );
  });

  it('SKILL.md installs @playwright/cli before @playwright/test', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/SKILL.md'
    );

    const cliIndex = content.indexOf('@playwright/cli');
    const testIndex = content.indexOf('@playwright/test');

    assert.ok(
      cliIndex !== -1,
      'SKILL.md must contain @playwright/cli install'
    );

    assert.ok(
      testIndex !== -1,
      'SKILL.md must contain @playwright/test install'
    );

    assert.ok(
      cliIndex < testIndex,
      '@playwright/cli must appear before @playwright/test in SKILL.md'
    );
  });
});

// ---------------------------------------------------------------------------
// PLAYWRIGHT-04: PLAYWRIGHT-EVALUATION.md skeleton test has explicit
// test.use({ baseURL }) configuration before the first test.describe.
// ---------------------------------------------------------------------------
describe('PLAYWRIGHT-04: PLAYWRIGHT-EVALUATION.md skeleton test has test.use({ baseURL })', function () {
  it('PLAYWRIGHT-EVALUATION.md contains test.use({ baseURL })', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md'
    );

    assert.ok(
      content.includes('test.use('),
      'PLAYWRIGHT-EVALUATION.md skeleton must contain a test.use() call'
    );
  });

  it('PLAYWRIGHT-EVALUATION.md test.use baseURL includes localhost', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md'
    );

    assert.ok(
      content.includes('baseURL') && content.includes('localhost'),
      'PLAYWRIGHT-EVALUATION.md test.use must configure baseURL with localhost'
    );
  });

  it('PLAYWRIGHT-EVALUATION.md test.use appears before first test.describe', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/references/evaluator/PLAYWRIGHT-EVALUATION.md'
    );

    const testUseIndex = content.indexOf('test.use(');
    const firstDescribeIndex = content.indexOf('test.describe(');

    assert.ok(
      testUseIndex !== -1,
      'PLAYWRIGHT-EVALUATION.md must contain test.use()'
    );

    assert.ok(
      firstDescribeIndex !== -1,
      'PLAYWRIGHT-EVALUATION.md must contain test.describe()'
    );

    assert.ok(
      testUseIndex < firstDescribeIndex,
      'test.use() must appear before the first test.describe() in the skeleton ' +
        `(test.use at index ${testUseIndex}, test.describe at index ${firstDescribeIndex})`
    );
  });
});

// ---------------------------------------------------------------------------
// ENSEMBLE-05: Deleted stale artifacts must not exist on disk.
// tests/evaluator-hardening-structure.test.mjs and
// ASSET-VALIDATION-PROTOCOL.md must be absent.
// ---------------------------------------------------------------------------
describe('ENSEMBLE-05: Stale artifacts deleted from repository', function () {
  it('tests/evaluator-hardening-structure.test.mjs does not exist', function () {
    const exists = implExists('tests/evaluator-hardening-structure.test.mjs');

    assert.equal(
      exists,
      false,
      'tests/evaluator-hardening-structure.test.mjs must have been deleted -- it referenced the removed evaluator.md'
    );
  });

  it('ASSET-VALIDATION-PROTOCOL.md does not exist in shipped plugin files', function () {
    const exists = implExists(
      'plugins/application-dev/skills/application-dev/references/evaluator/ASSET-VALIDATION-PROTOCOL.md'
    );

    assert.equal(
      exists,
      false,
      'ASSET-VALIDATION-PROTOCOL.md must have been deleted -- it was an orphaned reference with no consumer'
    );
  });
});

// ---------------------------------------------------------------------------
// ENSEMBLE-06: generator.md has zero stale "Code Quality" references.
// The Code Quality dimension was removed in Phase 7; any remaining reference
// would confuse the Generator's fix-only mode prioritization.
// ---------------------------------------------------------------------------
describe('ENSEMBLE-06: generator.md has no stale Code Quality references', function () {
  it('generator.md contains no "Code Quality" text', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    assert.ok(
      !content.includes('Code Quality'),
      'generator.md must not contain "Code Quality" -- that dimension was removed in Phase 7'
    );
  });
});

// ---------------------------------------------------------------------------
// ENSEMBLE-01..10, BARRIER-01..04: v1.1 terminology consistency.
// No stale "Evaluator" agent-name references, no "QA-REPORT" strings in
// the three key shipped plugin files.
// ---------------------------------------------------------------------------
describe('ENSEMBLE/BARRIER: v1.1 terminology consistency in shipped plugin files', function () {
  it('generator.md has no stale "Evaluator" agent-name reference', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    // "Evaluator" as agent name -- capitalized, not a generic English word
    // The term "evaluation" (lowercase) is fine; "Evaluator" (capital E) is stale
    assert.ok(
      !content.includes('Evaluator'),
      'generator.md must not contain "Evaluator" -- replaced by "critic ensemble" or "evaluation report"'
    );
  });

  it('AI-PROBING-REFERENCE.md has no stale "Evaluator" agent-name reference', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/references/evaluator/AI-PROBING-REFERENCE.md'
    );

    // The file teaches probe strategies for the projection-critic.
    // All "Evaluator" references should have been replaced with projection-critic/critic.
    assert.ok(
      !content.includes('Evaluator'),
      'AI-PROBING-REFERENCE.md must not contain "Evaluator" -- replaced by "projection-critic" or "critic"'
    );
  });

  it('README.md has no stale "Evaluator" agent-name reference', function () {
    const content = readImpl('plugins/application-dev/README.md');

    assert.ok(
      !content.includes('Evaluator'),
      'README.md must not contain "Evaluator" -- replaced by "Perceptual Critic" and "Projection Critic"'
    );
  });

  it('generator.md has no QA-REPORT reference', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    assert.ok(
      !content.includes('QA-REPORT'),
      'generator.md must not contain "QA-REPORT" -- replaced by evaluation/round-N/EVALUATION.md protocol'
    );
  });

  it('AI-PROBING-REFERENCE.md has no QA-REPORT reference', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/references/evaluator/AI-PROBING-REFERENCE.md'
    );

    assert.ok(
      !content.includes('QA-REPORT'),
      'AI-PROBING-REFERENCE.md must not contain "QA-REPORT"'
    );
  });

  it('README.md has no QA-REPORT reference', function () {
    const content = readImpl('plugins/application-dev/README.md');

    assert.ok(
      !content.includes('QA-REPORT'),
      'README.md must not contain "QA-REPORT" -- replaced by EVALUATION.md file protocol'
    );
  });

  it('README.md describes four agents including Perceptual Critic', function () {
    const content = readImpl('plugins/application-dev/README.md');

    assert.ok(
      content.includes('Perceptual Critic'),
      'README.md must describe the Perceptual Critic agent (v1.1 ensemble architecture)'
    );
  });

  it('README.md describes four agents including Projection Critic', function () {
    const content = readImpl('plugins/application-dev/README.md');

    assert.ok(
      content.includes('Projection Critic'),
      'README.md must describe the Projection Critic agent (v1.1 ensemble architecture)'
    );
  });
});
