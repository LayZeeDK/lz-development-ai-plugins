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
// GEN-01: generator.md must contain the 4-phase progressive CI sections
// ---------------------------------------------------------------------------
describe('GEN-01: generator.md has 4-phase progressive CI pattern', function () {
  it('contains Phase 1 Project Setup section', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('Phase 1: Project Setup'),
      'generator.md must contain "Phase 1: Project Setup"'
    );
  });

  it('contains Phase 2 Per-Feature Development section', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('Phase 2: Per-Feature Development'),
      'generator.md must contain "Phase 2: Per-Feature Development"'
    );
  });

  it('contains Phase 3 Integration section', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('Phase 3: Integration'),
      'generator.md must contain "Phase 3: Integration"'
    );
  });

  it('contains Phase 4 Pre-Handoff Diagnostic section', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('Phase 4: Pre-Handoff Diagnostic'),
      'generator.md must contain "Phase 4: Pre-Handoff Diagnostic"'
    );
  });
});

// ---------------------------------------------------------------------------
// GEN-02: generator.md frontmatter must list all 6 skills AND body must
//         contain Read fallback instructions for skill loading
// ---------------------------------------------------------------------------
describe('GEN-02: generator.md skills frontmatter and Read fallback instructions', function () {
  const REQUIRED_SKILLS = [
    'browser-prompt-api',
    'browser-webllm',
    'browser-webnn',
    'playwright-testing',
    'vitest-browser',
    'vite-plus',
  ];

  it('frontmatter skills field lists all 6 required skills', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    // Extract the YAML frontmatter block (between first --- and second ---)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatterMatch, 'generator.md must have YAML frontmatter');
    const frontmatter = frontmatterMatch[1];

    assert.ok(
      frontmatter.includes('skills:'),
      'frontmatter must have a skills field'
    );

    for (const skill of REQUIRED_SKILLS) {
      assert.ok(
        frontmatter.includes(skill),
        `frontmatter skills must include "${skill}"`
      );
    }
  });

  it('body contains Read fallback instructions for skills', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    // The body must contain explicit Read instructions referencing SKILL.md files
    // as the fallback mechanism for skill loading (documented workaround for bug #25834)
    const readInstructionPatterns = [
      'playwright-testing/SKILL.md',
      'vitest-browser/SKILL.md',
      'vite-plus/SKILL.md',
    ];

    for (const pattern of readInstructionPatterns) {
      assert.ok(
        content.includes(pattern),
        `generator.md body must contain a Read instruction referencing "${pattern}"`
      );
    }
  });

  it('body documents skill loading workaround rationale', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    // The note about skills frontmatter and Read fallback must be present
    assert.ok(
      content.includes('Skill loading') || content.includes('skill loading'),
      'generator.md must contain a "Skill loading" explanation note'
    );
  });
});

// ---------------------------------------------------------------------------
// GEN-03: generator.md must reference ASSETS-TEMPLATE.md AND the template
//         file must exist
// ---------------------------------------------------------------------------
describe('GEN-03: ASSETS-TEMPLATE.md exists and is referenced in generator.md', function () {
  it('ASSETS-TEMPLATE.md file exists at expected path', function () {
    const path = 'plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md';
    assert.ok(
      implExists(path),
      `ASSETS-TEMPLATE.md must exist at ${path}`
    );
  });

  it('generator.md references ASSETS-TEMPLATE.md by name', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('ASSETS-TEMPLATE.md'),
      'generator.md must contain a reference to ASSETS-TEMPLATE.md'
    );
  });

  it('ASSETS-TEMPLATE.md contains an asset manifest table with required columns', function () {
    const content = readImpl(
      'plugins/application-dev/skills/application-dev/references/ASSETS-TEMPLATE.md'
    );

    const requiredColumns = ['Asset', 'Type', 'Source', 'License', 'Attribution', 'URL', 'Verified'];
    for (const col of requiredColumns) {
      assert.ok(
        content.includes(col),
        `ASSETS-TEMPLATE.md must contain column header "${col}"`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// GEN-04: generator.md must contain Vite+ preference with
//         compatibility-conditional fallback (Angular/Nuxt excluded)
// ---------------------------------------------------------------------------
describe('GEN-04: generator.md Vite+ preference with compatibility fallback', function () {
  it('contains a Vite+ preference statement', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('Vite+ preference') || content.includes('Vite+'),
      'generator.md must contain a Vite+ preference statement'
    );
  });

  it('mentions Angular as incompatible with Vite+', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    // Angular must be called out as excluded/incompatible in the Vite+ section
    assert.ok(
      content.includes('Angular'),
      'generator.md must mention Angular as incompatible with Vite+'
    );
  });

  it('specifies a fallback to plain Vite when Vite+ is incompatible', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('plain Vite') || content.includes('fall back to plain Vite'),
      'generator.md must mention falling back to plain Vite when Vite+ is incompatible'
    );
  });

  it('reads vite-plus SKILL.md for framework compatibility details', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('vite-plus/SKILL.md'),
      'generator.md must contain a Read reference to vite-plus/SKILL.md'
    );
  });
});

// ---------------------------------------------------------------------------
// GEN-06: generator.md must contain latest-stable-versions instruction
// ---------------------------------------------------------------------------
describe('GEN-06: generator.md has latest-stable-versions instruction', function () {
  it('contains a latest stable versions instruction', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('latest stable') || content.includes('Latest stable'),
      'generator.md must contain a "latest stable versions" instruction'
    );
  });

  it('clarifies that old versions are only pinned when user explicitly requests it', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');
    assert.ok(
      content.includes('explicitly requests') || content.includes('explicitly request'),
      'generator.md must state that old versions are only pinned when user explicitly requests it'
    );
  });
});

// ---------------------------------------------------------------------------
// SKILL-01: vite-plus/SKILL.md must exist and cover vp CLI commands,
//           vite.config.ts format, framework support/compatibility, and
//           known limitations
// ---------------------------------------------------------------------------
describe('SKILL-01: vite-plus/SKILL.md exists and covers required content areas', function () {
  const SKILL_PATH = 'plugins/application-dev/skills/vite-plus/SKILL.md';

  it('vite-plus/SKILL.md file exists', function () {
    assert.ok(
      implExists(SKILL_PATH),
      `vite-plus/SKILL.md must exist at ${SKILL_PATH}`
    );
  });

  it('covers vp CLI commands (create, dev, check, test, build)', function () {
    const content = readImpl(SKILL_PATH);
    const commands = ['vp create', 'vp dev', 'vp check', 'vp test', 'vp build'];
    for (const cmd of commands) {
      assert.ok(
        content.includes(cmd),
        `vite-plus/SKILL.md must document the "${cmd}" command`
      );
    }
  });

  it('covers vite.config.ts unified config format', function () {
    const content = readImpl(SKILL_PATH);
    assert.ok(
      content.includes('vite.config.ts'),
      'vite-plus/SKILL.md must cover the vite.config.ts unified config format'
    );
  });

  it('covers framework support and compatibility', function () {
    const content = readImpl(SKILL_PATH);
    // Must address both supported and unsupported frameworks
    assert.ok(
      content.includes('React') && content.includes('Vue') && content.includes('Svelte'),
      'vite-plus/SKILL.md must list supported frameworks (React, Vue, Svelte)'
    );
    assert.ok(
      content.includes('Angular'),
      'vite-plus/SKILL.md must mention Angular (as unsupported/incompatible)'
    );
  });

  it('covers known limitations', function () {
    const content = readImpl(SKILL_PATH);
    assert.ok(
      content.toLowerCase().includes('limitation') || content.toLowerCase().includes('known'),
      'vite-plus/SKILL.md must include a known limitations section'
    );
  });

  it('meets minimum line count (150 lines per plan requirement)', function () {
    const content = readImpl(SKILL_PATH);
    const lineCount = content.split('\n').length;
    assert.ok(
      lineCount >= 150,
      `vite-plus/SKILL.md must be at least 150 lines (found ${lineCount})`
    );
  });
});
