# Custom Skill Builder

Custom Skill Builder is a small local CLI that turns a task brief into a reusable `SKILL.md` for AI agents. It uses deterministic templates only: no paid API, no network calls, and no model dependency.

## What It Does

- Generates a complete `SKILL.md` from a plain text task brief.
- Validates required skill sections before accepting output.
- Prints example commands and includes a runnable example brief.
- Runs a verification command that generates and validates a sample skill.

## Requirements

- Node.js 20 or newer.

## Quick Start

```bash
npm install
npm run verify
```

No dependencies are installed because this project only uses Node.js built-ins.

## CLI Usage

Generate a skill:

```bash
node src/index.js generate --brief examples/task-brief.txt --out examples/generated/SKILL.md
```

Validate a skill:

```bash
node src/index.js validate examples/generated/SKILL.md
```

Show examples:

```bash
node src/index.js examples
```

Run full verification:

```bash
npm run verify
```

## Brief Format

The input can be plain text. The generator looks for simple labels when present:

```text
Name: Research Brief Summarizer
Task: Convert long research notes into structured summaries for agents.
Trigger: Use when the user asks to summarize research notes or prepare a briefing.
Inputs: notes, source links, audience
Outputs: summary, open questions, next actions
Constraints: cite sources, avoid unsupported claims
```

Missing labels are filled with deterministic defaults derived from the brief text.

## Generated Sections

Every generated skill must include:

- `# <Skill Name>`
- `## Description`
- `## When To Use`
- `## Inputs`
- `## Workflow`
- `## Output Format`
- `## Constraints`
- `## Examples`

The validator checks these headings and reports missing sections.

## Project Structure

```text
staging/17-custom-skill-builder/
  README.md
  CONTEXT.md
  package.json
  src/
    generator.js
    index.js
    validator.js
  templates/
    skill.template.md
  examples/
    task-brief.txt
    generated/
      SKILL.md
```

## Design Notes

- Deterministic output keeps generated skills reviewable and reproducible.
- Validation is intentionally strict about headings so skills remain portable.
- The CLI avoids external packages to keep the mini-project easy to inspect.
