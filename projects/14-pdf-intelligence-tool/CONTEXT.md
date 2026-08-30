# Context

This mini-project demonstrates PDF Intelligence Tool / Document AI behavior without external dependencies.

## Current State

- Status: ready to run
- Last updated: 2026-08-15
- Current owner/agent: OpenCode

## Goal

Extract useful intelligence from document text that simulates already-extracted PDF content. The CLI reads sample `.txt` files, identifies summaries, entities, and table-like rows, then writes JSON and Markdown reports.

## Architecture

- `samples/`: text files that stand in for extracted PDF text.
- `src/cli.js`: dependency-free analyzer and report writer.
- `src/verify.js`: deterministic output checks.
- `reports/`: generated JSON and Markdown reports.

## Decisions Taken

- Used plain text samples to keep the project dependency-free and runnable offline.
- Kept extraction deterministic with rule-based parsing instead of model calls.
- Treated pipe-delimited lines as table-like rows because many PDF extraction tools preserve rough table separators.
- Included a plug-in note for real PDF extraction, but no PDF parser package is installed.

## How To Run

```bash
npm install
npm run analyze
npm run verify
```

## Verification

- `npm run verify` regenerates reports and checks document count, entity extraction, table extraction, and Markdown sections.

## Boundaries

- Keep this project self-contained under `staging/14-pdf-intelligence-tool`.
- Keep dependencies at zero unless a future task explicitly requires real PDF parsing.
- Preserve ASCII-only files.

## Real PDF Extraction Plug-In Point

In a production version, a PDF extraction step would convert each PDF into text before `src/cli.js` runs. Examples include a local PDF parser, OCR service, or document AI API. The analyzer can stay unchanged if the extracted text lands in `samples/` or another text input folder.
