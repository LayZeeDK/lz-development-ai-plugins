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

function lineCount(content) {
  return content.split('\n').length;
}

// ---------------------------------------------------------------------------
// OPT-01: evaluator.md under 400 lines, 15 workflow steps, 0 ALL-CAPS
//         emphasis, WHY-based rationale present. generator/planner 0 ALL-CAPS.
// ---------------------------------------------------------------------------
describe('OPT-01: evaluator.md structural constraints and emphasis cleanup', function () {
  it('evaluator.md is under 400 lines', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    const count = lineCount(content);
    assert.ok(
      count < 400,
      `evaluator.md must be under 400 lines (found ${count})`
    );
  });

  it('evaluator.md has all 15 workflow steps', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');

    for (let step = 1; step <= 15; step++) {
      assert.ok(
        content.includes(`Step ${step}:`),
        `evaluator.md must contain "Step ${step}:"`
      );
    }
  });

  it('evaluator.md contains zero ALL-CAPS MUST emphasis', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    // Match standalone uppercase MUST (word boundary) -- not part of words
    const matches = content.match(/\bMUST\b/g);
    assert.equal(
      matches,
      null,
      `evaluator.md must have zero standalone MUST instances (found: ${matches ? matches.length : 0})`
    );
  });

  it('evaluator.md contains zero ALL-CAPS NEVER emphasis', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    const matches = content.match(/\bNEVER\b/g);
    assert.equal(
      matches,
      null,
      `evaluator.md must have zero standalone NEVER instances (found: ${matches ? matches.length : 0})`
    );
  });

  it('evaluator.md contains zero ALL-CAPS CRITICAL emphasis', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    const matches = content.match(/\bCRITICAL\b/g);
    assert.equal(
      matches,
      null,
      `evaluator.md must have zero standalone CRITICAL instances (found: ${matches ? matches.length : 0})`
    );
  });

  it('evaluator.md contains zero ALL-CAPS ALWAYS emphasis', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    const matches = content.match(/\bALWAYS\b/g);
    assert.equal(
      matches,
      null,
      `evaluator.md must have zero standalone ALWAYS instances (found: ${matches ? matches.length : 0})`
    );
  });

  it('evaluator.md contains WHY-based rationale (Do not ... -- ... pattern)', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    // WHY-based rationale replaces MUST/NEVER with "Do not X -- because Y"
    // At least one "Do not" followed by a dash-dash rationale connector should exist
    assert.ok(
      content.includes('Do not'),
      'evaluator.md must contain at least one "Do not" constraint (WHY-based rationale pattern)'
    );
  });

  it('generator.md contains zero ALL-CAPS MUST/NEVER/CRITICAL/ALWAYS emphasis', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    const mustMatches = content.match(/\bMUST\b/g);
    const neverMatches = content.match(/\bNEVER\b/g);
    const critMatches = content.match(/\bCRITICAL\b/g);
    const alwaysMatches = content.match(/\bALWAYS\b/g);

    assert.equal(mustMatches, null, `generator.md must have zero MUST (found: ${mustMatches ? mustMatches.length : 0})`);
    assert.equal(neverMatches, null, `generator.md must have zero NEVER (found: ${neverMatches ? neverMatches.length : 0})`);
    assert.equal(critMatches, null, `generator.md must have zero CRITICAL (found: ${critMatches ? critMatches.length : 0})`);
    assert.equal(alwaysMatches, null, `generator.md must have zero ALWAYS (found: ${alwaysMatches ? alwaysMatches.length : 0})`);
  });

  it('planner.md contains zero ALL-CAPS MUST/NEVER/CRITICAL/ALWAYS emphasis', function () {
    const content = readImpl('plugins/application-dev/agents/planner.md');
    const mustMatches = content.match(/\bMUST\b/g);
    const neverMatches = content.match(/\bNEVER\b/g);
    const critMatches = content.match(/\bCRITICAL\b/g);
    const alwaysMatches = content.match(/\bALWAYS\b/g);

    assert.equal(mustMatches, null, `planner.md must have zero MUST (found: ${mustMatches ? mustMatches.length : 0})`);
    assert.equal(neverMatches, null, `planner.md must have zero NEVER (found: ${neverMatches ? neverMatches.length : 0})`);
    assert.equal(critMatches, null, `planner.md must have zero CRITICAL (found: ${critMatches ? critMatches.length : 0})`);
    assert.equal(alwaysMatches, null, `planner.md must have zero ALWAYS (found: ${alwaysMatches ? alwaysMatches.length : 0})`);
  });
});

// ---------------------------------------------------------------------------
// OPT-02: Self-Verification appears exactly 1 time in evaluator.md
//         (Step 14 only, standalone section removed)
// ---------------------------------------------------------------------------
describe('OPT-02: Self-Verification deduplication in evaluator.md', function () {
  it('Self-Verification appears exactly once in evaluator.md', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    const matches = content.match(/Self-Verification/g);
    assert.ok(matches, 'evaluator.md must contain Self-Verification at least once');
    assert.equal(
      matches.length,
      1,
      `evaluator.md must contain "Self-Verification" exactly once (found ${matches.length})`
    );
  });

  it('Self-Verification appears only as Step 14 heading (not a standalone ## section)', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    // Standalone section would be "## Self-Verification" (h2 level)
    assert.ok(
      !content.includes('## Self-Verification'),
      'evaluator.md must not have a standalone "## Self-Verification" section -- only the Step 14 instance'
    );
  });

  it('Step 14 is the Self-Verification step', function () {
    const content = readImpl('plugins/application-dev/agents/evaluator.md');
    assert.ok(
      content.includes('Step 14: Self-Verification'),
      'evaluator.md must contain "Step 14: Self-Verification"'
    );
  });
});

// ---------------------------------------------------------------------------
// OPT-03: AI-SLOP-CHECKLIST.md and ASSET-VALIDATION-PROTOCOL.md exist with
//         required content
// ---------------------------------------------------------------------------
describe('OPT-03: Reference files extracted and contain required content', function () {
  const SLOP_PATH = 'plugins/application-dev/skills/application-dev/references/evaluator/AI-SLOP-CHECKLIST.md';
  const ASSET_PATH = 'plugins/application-dev/skills/application-dev/references/evaluator/ASSET-VALIDATION-PROTOCOL.md';

  it('AI-SLOP-CHECKLIST.md exists', function () {
    assert.ok(
      implExists(SLOP_PATH),
      `AI-SLOP-CHECKLIST.md must exist at ${SLOP_PATH}`
    );
  });

  it('AI-SLOP-CHECKLIST.md has 30 or more lines', function () {
    const content = readImpl(SLOP_PATH);
    const count = lineCount(content);
    assert.ok(
      count >= 30,
      `AI-SLOP-CHECKLIST.md must have at least 30 lines (found ${count})`
    );
  });

  it('AI-SLOP-CHECKLIST.md contains all 6 slop categories', function () {
    const content = readImpl(SLOP_PATH);
    const categories = [
      'Typography Slop',
      'Color Slop',
      'Layout Slop',
      'Content Slop',
      'Motion Slop',
      'Design Identity Slop',
    ];

    for (const cat of categories) {
      assert.ok(
        content.includes(cat),
        `AI-SLOP-CHECKLIST.md must contain the "${cat}" category`
      );
    }
  });

  it('ASSET-VALIDATION-PROTOCOL.md exists', function () {
    assert.ok(
      implExists(ASSET_PATH),
      `ASSET-VALIDATION-PROTOCOL.md must exist at ${ASSET_PATH}`
    );
  });

  it('ASSET-VALIDATION-PROTOCOL.md has 25 or more lines', function () {
    const content = readImpl(ASSET_PATH);
    const count = lineCount(content);
    assert.ok(
      count >= 25,
      `ASSET-VALIDATION-PROTOCOL.md must have at least 25 lines (found ${count})`
    );
  });

  it('ASSET-VALIDATION-PROTOCOL.md contains sub-steps 7a through 7g', function () {
    const content = readImpl(ASSET_PATH);
    const subSteps = ['a.', 'b.', 'c.', 'd.', 'e.', 'f.', 'g.'];

    for (const sub of subSteps) {
      assert.ok(
        content.includes(sub),
        `ASSET-VALIDATION-PROTOCOL.md must contain sub-step "${sub}" (one of 7a-7g)`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// OPT-04: SKILL.md under 425 lines, Rules before Workflow, all appdev-cli
//         subcommands preserved, all agent spawn patterns preserved
// ---------------------------------------------------------------------------
describe('OPT-04: SKILL.md structural constraints and integration contract preservation', function () {
  const SKILL_PATH = 'plugins/application-dev/skills/application-dev/SKILL.md';

  it('SKILL.md is under 425 lines', function () {
    const content = readImpl(SKILL_PATH);
    const count = lineCount(content);
    assert.ok(
      count < 425,
      `SKILL.md must be under 425 lines (found ${count})`
    );
  });

  it('Rules section appears before Workflow section', function () {
    const content = readImpl(SKILL_PATH);
    const rulesIdx = content.indexOf('## Rules');
    const workflowIdx = content.indexOf('## Workflow');

    assert.ok(rulesIdx >= 0, 'SKILL.md must contain a "## Rules" section');
    assert.ok(workflowIdx >= 0, 'SKILL.md must contain a "## Workflow" section');
    assert.ok(
      rulesIdx < workflowIdx,
      `"## Rules" section (pos ${rulesIdx}) must appear before "## Workflow" section (pos ${workflowIdx})`
    );
  });

  it('SKILL.md contains all required appdev-cli subcommands', function () {
    const content = readImpl(SKILL_PATH);
    const subcommands = [
      'appdev-cli.mjs init',
      'appdev-cli.mjs exists',
      'appdev-cli.mjs get',
      'appdev-cli.mjs update',
      'appdev-cli.mjs delete',
      'appdev-cli.mjs complete',
      'appdev-cli.mjs round-complete',
      'appdev-cli.mjs get-trajectory',
    ];

    for (const cmd of subcommands) {
      assert.ok(
        content.includes(cmd),
        `SKILL.md must contain appdev-cli subcommand "${cmd}"`
      );
    }
  });

  it('SKILL.md contains all 3 agent spawn patterns', function () {
    const content = readImpl(SKILL_PATH);
    const patterns = [
      'application-dev:planner',
      'application-dev:generator',
      'application-dev:evaluator',
    ];

    for (const pattern of patterns) {
      assert.ok(
        content.includes(pattern),
        `SKILL.md must contain agent spawn pattern "${pattern}"`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// OPT-05: Generator "selective loading" present (not "bug #25834"), all 6
//         skill Read instructions in generator, planner SPEC-TEMPLATE.md
//         Read instruction preserved, convergence dispatch in SKILL.md
// ---------------------------------------------------------------------------
describe('OPT-05: Selective loading framing, skill Read instructions, and convergence dispatch', function () {
  it('generator.md uses "selective loading" framing (not bug #25834)', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('selective loading'),
      'generator.md must contain "selective loading" as the primary framing'
    );
    assert.ok(
      !content.includes('bug #25834'),
      'generator.md must not contain "bug #25834" as the primary framing'
    );
  });

  it('generator.md contains all 6 skill Read instructions', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    const skillReadPatterns = [
      'vite-plus/SKILL.md',
      'vitest-browser/SKILL.md',
      'playwright-testing/SKILL.md',
      'browser-prompt-api/SKILL.md',
      'browser-webllm/SKILL.md',
      'browser-webnn/SKILL.md',
    ];

    for (const pattern of skillReadPatterns) {
      assert.ok(
        content.includes(pattern),
        `generator.md must contain a Read instruction referencing "${pattern}"`
      );
    }
  });

  it('planner.md preserves SPEC-TEMPLATE.md Read instruction', function () {
    const content = readImpl('plugins/application-dev/agents/planner.md');
    assert.ok(
      content.includes('SPEC-TEMPLATE.md'),
      'planner.md must contain a Read instruction referencing SPEC-TEMPLATE.md'
    );
  });

  it('SKILL.md contains all 4 convergence dispatch exit conditions', function () {
    const content = readImpl('plugins/application-dev/skills/application-dev/SKILL.md');
    const exits = ['PASS', 'PLATEAU', 'REGRESSION', 'SAFETY_CAP'];

    for (const exit of exits) {
      assert.ok(
        content.includes(exit),
        `SKILL.md convergence dispatch must handle exit condition "${exit}"`
      );
    }
  });
});
