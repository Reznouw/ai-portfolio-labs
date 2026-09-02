# Research Brief Summarizer

## Description

Convert long research notes into concise structured briefings for AI agents.

## When To Use

Use when the user provides notes, links, or pasted research and wants a reusable agent workflow for summarization.

## Inputs

- research notes
- source URLs
- target audience
- desired depth

## Workflow

1. Read the task brief and identify the user goal.
2. Confirm the available inputs and constraints.
3. Execute the workflow in small, reviewable steps.
4. Produce the requested output format.
5. Check the result against the constraints before returning it.

## Output Format

- executive summary
- key evidence
- open questions
- next actions

## Constraints

- do not invent facts
- preserve source attribution
- keep recommendations separate from evidence

## Examples

Input brief:

```text
Name: Research Brief Summarizer
Task: Convert long research notes into concise structured briefings for AI agents.
```

CLI command:

```bash
node src/index.js generate --brief examples/task-brief.txt --out examples/generated/SKILL.md
```
