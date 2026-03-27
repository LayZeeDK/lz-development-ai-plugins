# Coding Conventions

**Analysis Date:** 2026-03-27

## Overview

This codebase is primarily a Claude Code plugin marketplace with instruction documents and agent definitions. The "code" consists mostly of:
- Agent definitions in markdown with YAML frontmatter (`plugins/application-dev/agents/*.md`)
- Skill definitions in markdown (`plugins/application-dev/skills/*/SKILL.md`)
- Reference documentation (`plugins/application-dev/skills/*/references/*.md`)
- JavaScript code examples (`plugins/application-dev/skills/*/examples/*.js`)
- Plugin manifest in JSON (`plugins/application-dev/.claude-plugin/plugin.json`)

There are no traditional source files (TypeScript, Python, etc.). Conventions apply to these markdown-based instruction documents and the JavaScript examples they contain.

## Naming Patterns

**Files:**
- Agent definitions: lowercase with hyphens (e.g., `generator.md`, `evaluator.md`, `planner.md`)
- Skill definitions: kebab-case directory names matching feature (e.g., `browser-prompt-api`, `browser-webllm`, `browser-webnn`)
- Core skill file: always named `SKILL.md` (uppercase)
- Reference files: descriptive kebab-case (e.g., `graceful-degradation.md`, `frontend-design-principles.md`)
- Examples: descriptive lowercase with extension (e.g., `tool-use.js`)
- Documentation files: uppercase (`README.md`, `AGENTS.md`, `CLAUDE.md`)

**Within markdown frontmatter:**
- YAML keys: lowercase (e.g., `name`, `description`, `model`, `tools`, `color`)
- Agent names: lowercase (`planner`, `generator`, `evaluator`)
- Color indicators: lowercase (`blue`, `green`, `yellow`)

**Within JavaScript code:**
- Functions: camelCase (e.g., `LanguageModel.create()`, `session.prompt()`, `session.destroy()`)
- Constants/APIs: PascalCase for constructors/globals (e.g., `LanguageModel`, `AbortController`)
- Variables: camelCase (e.g., `initialPrompts`, `responseConstraint`, `expectedInputs`)
- Event listeners: camelCase with `on` prefix or `addEventListener` (e.g., `monitor(m)` callback pattern)
- Object properties: camelCase (e.g., `role`, `content`, `type`, `languages`)

## Code Style

**Markdown Structure:**
- Use ATX-style headers (`#`, `##`, `###`) consistently
- Include YAML frontmatter for agent/skill definitions with `---` delimiters
- Maintain consistent indentation (2 or 4 spaces in code blocks)
- Link to files using relative paths where possible

**Frontmatter Pattern for Agents:**
```yaml
---
name: [agent-name]
description: |
  [Multi-line description with examples]
model: inherit
color: [blue|green|yellow]
tools: ["Tool1", "Tool2"]
---
```

**Frontmatter Pattern for Skills:**
```yaml
---
name: [skill-name]
description: >-
  [Folded multi-line description]
license: MIT
compatibility: >-
  [Requirements/browser support]
metadata:
  author: [Author Name]
allowed-tools: [Tool list]
---
```

**Code Block Formatting:**
- Specify language identifier (e.g., ` ```js`, ` ```bash`, ` ```typescript`)
- Include comments explaining non-obvious patterns
- Show realistic, runnable examples
- For API documentation, show common patterns before edge cases

**Example from `tool-use.js`:**
```javascript
// Block comment before complex operation
const session = await LanguageModel.create({
  // Comments explaining required fields
  initialPrompts: [
    { role: 'system', content: 'You are a helpful assistant.' },
  ],
  // ...
});
```

## Instruction Document Patterns

**Agent instructions (`agents/*.md`):**
- Include `<example>` blocks showing when/how the agent is spawned
- Use `<commentary>` sections to explain context
- List operational requirements in clear sections (e.g., "## Mission", "## Workflow")
- Include numbered procedural steps for complex workflows
- Quote spec/reference files using path references with `${CLAUDE_PLUGIN_ROOT}` or relative paths

**Skill instructions (`skills/*/SKILL.md`):**
- Start with spec link and documentation link (section 1)
- Include browser support table for APIs
- Show feature detection code before usage examples
- Organize sections by feature or lifecycle phase
- Include error handling patterns and specific error types

**Reference documents (`skills/*/references/*.md`):**
- Provide concrete implementation patterns
- Show both happy path and error cases
- Link back to the main SKILL.md
- Include design philosophy (e.g., frontend-design-principles.md explains "why" before examples)

## Error Handling

**Pattern in Agent Instructions:**
- Describe recoverable failures and retry strategies (e.g., "if write fails because directory does not exist yet, create the missing parent directories and retry")
- Specify file-based communication errors (e.g., reading `SPEC.md` and handling missing or incomplete files)
- Provide clear recovery instructions in the workflow

**Pattern in Skill Instructions:**
- List specific error types by name (e.g., `NotSupportedError`, `SyntaxError`, `QuotaExceededError`)
- Group errors by category (validation, resource, permission)
- Show error handling in code examples using try/catch where applicable
- Document signal-based cancellation (`AbortController`, `signal` parameter)

**Example from browser-prompt-api SKILL.md (section 6):**
```
Errors:
- Unsupported schema features: `NotSupportedError`
- Unable to satisfy constraint: `SyntaxError`
- Invalid `responseConstraint` type: `TypeError`
```

## Logging

**Patterns:**
- Within markdown: use inline code blocks (backticks) for command output examples
- Within JavaScript examples: use `console.log()` for informational output, `console.error()` for errors
- Show progress output in shell command examples (e.g., bash commands that tail logs)
- Document monitoring patterns using event listeners (e.g., `monitor(m)` callbacks)

**Example from browser-prompt-api (section 4):**
```javascript
monitor(m) {
  m.addEventListener('downloadprogress', (e) => {
    console.log(`Downloaded ${Math.round(e.loaded * 100)}%`);
  });
}
```

## Comments

**When to comment:**
- Complex decision logic in code examples (e.g., when to use `initialPrompts` vs `append`)
- Non-obvious API usage (e.g., "system role must be at index 0")
- Gotchas and deprecation warnings (e.g., "`topK` and `temperature` are deprecated in web contexts")
- Decision rationales in procedural workflows (e.g., "Why refactor instead of patch?")

**JSDoc/TSDoc:**
- Not used in this codebase (markdown examples don't require type annotations in the same way)
- Function descriptions placed inline in code blocks with comments

**Markdown comments:**
- Use HTML comments `<!-- -->` for reviewer notes or TODOs in markdown that should not render
- Do not use `<!-- TODO -->` for incomplete features in distributed plugins -- the codebase has a strict "no stubs" policy enforced by the Evaluator agent

## Function Design

**Size:**
- Instructional examples in SKILL.md: show complete workflows in single blocks (20-50 lines typical)
- Agent instructions: break into logical sections with numbered steps
- Avoid fragmenting examples across many small code blocks

**Parameters:**
- Show all required parameters in initial examples
- Show optional parameters with defaults in subsequent examples
- Document parameter constraints in adjacent comments (e.g., "entries must alternate user/assistant roles")

**Return Values:**
- Always show what functions return in code examples
- For APIs with side effects (e.g., `session.destroy()`), document both return value and side effects

**Example from browser-prompt-api (section 5.1):**
```javascript
const result = await session.prompt('Write me a poem!');

// With abort support
const controller = new AbortController();
const result = await session.prompt('Write me a poem!', {
  signal: controller.signal,
});
```

## Module Design

**Exports:**
- Not applicable to markdown-based instructions
- JavaScript examples use global `LanguageModel` object (no modules)
- Each SKILL.md stands alone and can be read independently

**Organization:**
- Organize SKILL.md by feature or API lifecycle:
  1. Purpose and scope
  2. Browser support matrix
  3. Feature detection and availability
  4. Session creation
  5. Core operations (prompting, structured output, etc.)
  6. Lifecycle management
  7. Best practices

**Skill registration:**
- Skill plugins in `plugins/application-dev/skills/` are self-contained directories
- Each skill has: `SKILL.md`, optional `examples/` subdirectory, optional `references/` subdirectory
- Directory name (`browser-prompt-api`, `browser-webllm`, etc.) matches the skill identifier used by agents

## Import Organization

**In YAML frontmatter:**
```yaml
tools: ["Read", "Write", "Edit", "Glob", "Bash"]
```
- List in logical order: read-only tools first (Read), then write tools (Write, Edit), then utility tools (Glob, Bash)
- Match against tool names as they appear in the Claude Code platform

**In markdown examples:**
```bash
# Import style is shown in language-appropriate way
npm install @types/dom-chromium-ai  # For TypeScript types
import { LanguageModel } from 'browser-prompt-api'; # Conceptual (not actual code)
```

**In references:**
- Link to SKILL.md using relative paths: `Read this for the complete pattern from section 13`
- Cross-link between related skills: "use browser-webllm" vs "use browser-webnn"

## Quality Standards from Agent Instructions

The codebase enforces these quality standards (seen in generator.md):
- **No stubs**: Implement all features in the spec. Do not leave placeholders, TODOs, or "coming soon" messages
- **No dead code**: Remove unused imports, commented-out code, and abandoned experiments
- **Consistent style**: Use consistent naming, formatting, and patterns throughout
- **Error handling**: The app should not crash on common user actions. Handle loading states, empty states, and error states
- **Responsive layout**: The UI should work at common viewport sizes
- **Accessibility basics**: Semantic HTML, keyboard navigation, sufficient color contrast
- **Fast initial load**: Avoid unnecessary dependencies. Bundle size matters

These standards apply when agents use these instructions to generate applications.

## Design Principles Integration

The codebase includes `frontend-design-principles.md` which agents consult when creating specs. Key conventions:
- Choose distinctive fonts (avoid Inter, Roboto, Arial)
- Commit to bold aesthetic direction (minimalist, maximalist, retro, etc.)
- Avoid AI-slop markers: purple gradients, default Tailwind styles, generic card layouts
- Use intentional spacing (either generous negative space OR controlled density)
- Create atmosphere with details (gradients, textures, patterns, layered transparencies)

---

*Convention analysis: 2026-03-27*
