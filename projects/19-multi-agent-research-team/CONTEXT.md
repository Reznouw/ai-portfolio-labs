# Context

This mini-project demonstrates a Multi-Agent Research Team using deterministic offline logic.

## Current State

- Status: ready to run
- Last updated: 2026-08-15
- Current owner/agent: OpenCode

## Goal

Simulate researcher, critic, and writer agents over a small local web/evidence corpus. The CLI produces a research brief with citations and critic notes without calling external APIs.

## Architecture

- `data/corpus.json`: local evidence corpus with source ids, titles, URLs, dates, types, stances, and passages.
- `src/agents.js`: deterministic researcher, critic, and writer functions.
- `src/cli.js`: command-line entry point and report writer.
- `src/verify.js`: deterministic checks for report structure and expected citations.
- `reports/`: generated Markdown and JSON briefs.

## Decisions Taken

- Used a local JSON corpus to simulate retrieved web evidence while remaining offline.
- Used lexical scoring rather than embeddings or LLM calls to keep behavior deterministic.
- Kept agent outputs explicit through an `agentTrace` section in the JSON report.
- Included both supporting and cautionary evidence so the critic can produce useful notes.

## How To Run

```bash
npm run brief
npm run verify
```

## Boundaries

- Keep this project self-contained under `staging/19-multi-agent-research-team`.
- Keep dependencies at zero unless a future task explicitly requires a local package.
- Preserve ASCII-only files.
