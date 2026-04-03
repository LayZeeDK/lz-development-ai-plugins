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
// GEN-01: Browser-agnostic LanguageModel guidance with Chrome/Edge and
// graceful degradation. browser-built-in-ai meta-skill with decision tree
// routing, Chrome vs Edge comparison table, 5 reference files, and
// generalized graceful degradation pattern.
// ---------------------------------------------------------------------------
describe('GEN-01: browser-built-in-ai meta-skill with 7-API routing and graceful degradation', function () {
  const skillPath = 'plugins/application-dev/skills/browser-built-in-ai/SKILL.md';
  const refDir = 'plugins/application-dev/skills/browser-built-in-ai/references';

  it('GEN-01-a: SKILL.md exists with decision tree routing to 5 reference files', function () {
    assert.ok(implExists(skillPath), 'browser-built-in-ai/SKILL.md must exist');

    const content = readImpl(skillPath);

    // Decision tree present
    assert.ok(
      content.includes('Summarizer API') && content.includes('Writer API'),
      'SKILL.md must contain decision tree routing to task-specific APIs'
    );
    assert.ok(
      content.includes('LanguageModel') || content.includes('Prompt API'),
      'SKILL.md must reference LanguageModel / Prompt API for general-purpose use'
    );
    assert.ok(
      content.includes('WebLLM') && content.includes('WebNN'),
      'SKILL.md must route WebLLM and WebNN to separate skills'
    );
  });

  it('GEN-01-b: all 5 reference files exist', function () {
    const refs = [
      'prompt-api.md',
      'summarizer-api.md',
      'writer-rewriter-api.md',
      'translator-api.md',
      'graceful-degradation.md',
    ];

    for (const ref of refs) {
      assert.ok(
        implExists(join(refDir, ref)),
        `Reference file ${ref} must exist in browser-built-in-ai/references/`
      );
    }
  });

  it('GEN-01-c: SKILL.md contains Chrome vs Edge comparison table covering all 7 APIs', function () {
    const content = readImpl(skillPath);

    // All 7 API rows in the comparison table
    const apis = [
      'LanguageModel',
      'Summarizer',
      'Writer',
      'Rewriter',
      'Translator',
      'LanguageDetector',
      'Proofreader',
    ];

    for (const api of apis) {
      assert.ok(
        content.includes(api),
        `SKILL.md Chrome vs Edge table must include ${api}`
      );
    }

    // Both browser columns
    assert.ok(
      content.includes('Chrome') && content.includes('Edge'),
      'SKILL.md must have both Chrome and Edge columns in the comparison table'
    );
  });

  it('GEN-01-d: SKILL.md has Read instructions pointing to each reference file', function () {
    const content = readImpl(skillPath);

    const refs = [
      'references/prompt-api.md',
      'references/summarizer-api.md',
      'references/writer-rewriter-api.md',
      'references/translator-api.md',
      'references/graceful-degradation.md',
    ];

    for (const ref of refs) {
      assert.ok(
        content.includes(ref),
        `SKILL.md must contain a Read instruction referencing ${ref}`
      );
    }
  });

  it('GEN-01-e: graceful-degradation.md uses generic tryCreateSession helper (not LanguageModel-specific)', function () {
    const content = readImpl(join(refDir, 'graceful-degradation.md'));

    assert.ok(
      content.includes('tryCreateSession'),
      'graceful-degradation.md must contain the tryCreateSession generic helper'
    );

    // Accepts ApiGlobal parameter (generic, not LanguageModel-specific)
    assert.ok(
      content.includes('ApiGlobal'),
      'tryCreateSession must accept an ApiGlobal parameter for any Built-in AI API'
    );

    // Shows per-API usage examples (not just LanguageModel)
    assert.ok(
      content.includes('Summarizer') && content.includes('Writer') && content.includes('Translator'),
      'graceful-degradation.md must include per-API usage examples for Summarizer, Writer, and Translator'
    );
  });

  it('GEN-01-f: old browser-prompt-api directory no longer exists', function () {
    assert.ok(
      !implExists('plugins/application-dev/skills/browser-prompt-api'),
      'browser-prompt-api directory must have been removed (migrated to browser-built-in-ai)'
    );
  });
});

// ---------------------------------------------------------------------------
// GEN-02: Vite+ skill refreshed for vp CLI with alpha caveats.
// vite-plus/SKILL.md updated to v0.1.15 with breaking changes, new CLI
// commands, updated tool versions, VP_* env vars, and viteplus.dev URLs.
// ---------------------------------------------------------------------------
describe('GEN-02: Vite+ skill refreshed to v0.1.15 with alpha caveats', function () {
  const skillPath = 'plugins/application-dev/skills/vite-plus/SKILL.md';

  it('GEN-02-a: SKILL.md references v0.1.15 version', function () {
    const content = readImpl(skillPath);

    assert.ok(
      content.includes('v0.1.15'),
      'vite-plus/SKILL.md must reference v0.1.15'
    );
  });

  it('GEN-02-b: SKILL.md uses VP_* environment variable prefix (not old VITE_PLUS_*)', function () {
    const content = readImpl(skillPath);

    assert.ok(
      content.includes('VP_'),
      'vite-plus/SKILL.md must use VP_* environment variable prefix'
    );

    // The old prefix should be mentioned only in the breaking changes section
    // to document the migration, not as the current standard
    const vpCount = (content.match(/VP_/g) || []).length;

    assert.ok(
      vpCount >= 3,
      'vite-plus/SKILL.md must have multiple VP_* references (VP_VERSION, VP_HOME, etc.)'
    );
  });

  it('GEN-02-c: SKILL.md uses viteplus.dev URLs (not old vite.plus)', function () {
    const content = readImpl(skillPath);

    assert.ok(
      content.includes('viteplus.dev'),
      'vite-plus/SKILL.md must use viteplus.dev URLs for installation'
    );
  });

  it('GEN-02-d: SKILL.md has breaking changes section', function () {
    const content = readImpl(skillPath);
    const lower = content.toLowerCase();

    assert.ok(
      lower.includes('breaking change'),
      'vite-plus/SKILL.md must have a breaking changes section'
    );

    // Key breaking changes documented
    assert.ok(
      content.includes('VITE_PLUS_') && content.includes('VP_'),
      'Breaking changes must document the VITE_PLUS_* to VP_* env var rename'
    );

    assert.ok(
      content.includes('vp run') && content.includes('flag'),
      'Breaking changes must document the vp run argument order change'
    );
  });

  it('GEN-02-e: SKILL.md has alpha caveat prominently at top', function () {
    const content = readImpl(skillPath);

    // Alpha caveat should appear near the top, before major sections
    const alphaIndex = content.toLowerCase().indexOf('alpha');
    const firstSectionIndex = content.indexOf('## 1.');

    assert.ok(
      alphaIndex !== -1,
      'vite-plus/SKILL.md must mention alpha status'
    );

    assert.ok(
      alphaIndex < firstSectionIndex,
      'Alpha caveat must appear before the first major section (## 1.) ' +
        `(alpha at ${alphaIndex}, first section at ${firstSectionIndex})`
    );
  });

  it('GEN-02-f: SKILL.md has updated bundled tool versions', function () {
    const content = readImpl(skillPath);

    // Check for updated versions from the plan
    assert.ok(
      content.includes('1.58') || content.includes('1.58.0'),
      'vite-plus/SKILL.md must reference Oxlint 1.58.x'
    );

    assert.ok(
      content.includes('4.1') || content.includes('4.1.2'),
      'vite-plus/SKILL.md must reference Vitest 4.1.x'
    );

    assert.ok(
      content.includes('Rolldown'),
      'vite-plus/SKILL.md must reference Rolldown as the production bundler'
    );
  });
});

// ---------------------------------------------------------------------------
// GEN-03: Dependency freshness checking step in Generator workflow.
// generator.md contains dependency freshness instruction scoped to Round 1
// with non-SemVer exceptions and Round 2+ prohibition.
// ---------------------------------------------------------------------------
describe('GEN-03: Dependency freshness checking step in Generator workflow', function () {
  const agentPath = 'plugins/application-dev/agents/generator.md';

  it('GEN-03-a: generator.md contains "Dependency freshness" instruction', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('Dependency freshness'),
      'generator.md must contain "Dependency freshness" instruction'
    );
  });

  it('GEN-03-b: dependency freshness is scoped to Round 1 only', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('Round 1 only'),
      'generator.md dependency freshness must be scoped to "Round 1 only"'
    );
  });

  it('GEN-03-c: contains non-SemVer exceptions (Playwright, TypeScript, 0.x)', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('Playwright') && content.includes('calendar versioning'),
      'generator.md must list Playwright as a non-SemVer exception with calendar versioning note'
    );

    assert.ok(
      content.includes('TypeScript') && content.includes('minor'),
      'generator.md must list TypeScript as a non-SemVer exception with minor version warning'
    );

    assert.ok(
      content.includes('0.x'),
      'generator.md must list 0.x packages as a non-SemVer exception'
    );
  });

  it('GEN-03-d: contains Round 2+ prohibition for dependency upgrades', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('Do NOT upgrade dependencies in Round 2+'),
      'generator.md must contain explicit Round 2+ prohibition: "Do NOT upgrade dependencies in Round 2+"'
    );
  });
});

// ---------------------------------------------------------------------------
// GEN-04: Strengthened Vite+ adoption with compatibility escape hatch.
// generator.md uses "default" language for Vite+, explicit justification
// requirement, vp-first diagnostics, browser-built-in-ai in frontmatter,
// and escape hatch for Angular/Nuxt/TanStack Start.
// ---------------------------------------------------------------------------
describe('GEN-04: Strengthened Vite+ adoption with compatibility escape hatch', function () {
  const agentPath = 'plugins/application-dev/agents/generator.md';

  it('GEN-04-a: generator.md uses "default" language for Vite+ (not "preference")', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('Vite+ default') || content.includes('default toolchain'),
      'generator.md must use "default" language for Vite+ (Vite+ default or default toolchain)'
    );

    // Verify the old "preference" framing is gone
    assert.ok(
      !content.includes('Vite+ preference'),
      'generator.md must not contain the old "Vite+ preference" framing'
    );
  });

  it('GEN-04-b: generator.md requires explicit justification for choosing plain Vite', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('explicitly justify'),
      'generator.md must require explicit justification for choosing plain Vite over Vite+'
    );
  });

  it('GEN-04-c: generator.md Step 8 leads with vp build commands (not npm first)', function () {
    const content = readImpl(agentPath);

    // Find Step 8 content
    const step8Index = content.indexOf('Step 8');

    assert.ok(
      step8Index !== -1,
      'generator.md must contain Step 8'
    );

    const step8Content = content.slice(step8Index);

    // First build command should be vp build, not npm run build
    const vpBuildIndex = step8Content.indexOf('vp build');
    const npmBuildIndex = step8Content.indexOf('npm run build');

    assert.ok(
      vpBuildIndex !== -1,
      'Step 8 must contain "vp build" command'
    );

    assert.ok(
      vpBuildIndex < npmBuildIndex,
      'Step 8 must lead with "vp build" before "npm run build" ' +
        `(vp build at ${vpBuildIndex}, npm run build at ${npmBuildIndex})`
    );
  });

  it('GEN-04-d: generator.md frontmatter skills list includes browser-built-in-ai (not browser-prompt-api)', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('browser-built-in-ai'),
      'generator.md frontmatter skills list must include "browser-built-in-ai"'
    );

    assert.ok(
      !content.includes('browser-prompt-api'),
      'generator.md must not contain any reference to the old "browser-prompt-api" skill'
    );
  });

  it('GEN-04-e: generator.md contains escape hatch for Angular, Nuxt, TanStack Start', function () {
    const content = readImpl(agentPath);

    assert.ok(
      content.includes('Angular'),
      'generator.md must mention Angular as a Vite+ incompatibility'
    );

    assert.ok(
      content.includes('Nuxt') || content.includes('TanStack Start'),
      'generator.md must mention Nuxt or TanStack Start as Vite+ incompatibilities'
    );

    assert.ok(
      content.includes('tsgo'),
      'generator.md must explain the Angular incompatibility reason (tsgo)'
    );
  });
});

// ---------------------------------------------------------------------------
// Cross-file wiring: generator.md references browser-built-in-ai and
// vite-plus skill paths; SKILL.md references all 5 reference file paths.
// ---------------------------------------------------------------------------
describe('Cross-file wiring: generator.md and SKILL.md reference correct paths', function () {
  it('generator.md references browser-built-in-ai/SKILL.md path', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    assert.ok(
      content.includes('browser-built-in-ai/SKILL.md'),
      'generator.md must reference the browser-built-in-ai/SKILL.md path'
    );
  });

  it('generator.md references vite-plus/SKILL.md path', function () {
    const content = readImpl('plugins/application-dev/agents/generator.md');

    assert.ok(
      content.includes('vite-plus/SKILL.md'),
      'generator.md must reference the vite-plus/SKILL.md path'
    );
  });

  it('browser-built-in-ai/SKILL.md references all 5 reference file paths', function () {
    const content = readImpl('plugins/application-dev/skills/browser-built-in-ai/SKILL.md');

    const refs = [
      'references/prompt-api.md',
      'references/summarizer-api.md',
      'references/writer-rewriter-api.md',
      'references/translator-api.md',
      'references/graceful-degradation.md',
    ];

    for (const ref of refs) {
      assert.ok(
        content.includes(ref),
        `browser-built-in-ai/SKILL.md must reference ${ref}`
      );
    }
  });
});
