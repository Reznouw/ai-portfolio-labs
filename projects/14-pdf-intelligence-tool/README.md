# PDF Intelligence Tool

Mini-project 14 for the AI portfolio: a dependency-free Document AI style CLI that analyzes simulated extracted PDF text.

The tool reads text files, extracts a short summary, entities, and table-like rows, then writes JSON and Markdown reports.

## Why Text Files Instead Of PDFs

This project intentionally avoids dependencies. The files in `samples/` represent text that a PDF extraction layer already produced.

In a real system, plug PDF extraction in before this CLI:

```txt
PDF file -> PDF parser or OCR -> extracted .txt -> this analyzer -> reports
```

## Install

No runtime dependencies are required beyond Node.js 20+.

```bash
npm install
```

## Run

```bash
npm run analyze
```

The command reads `samples/*.txt` and writes:

```txt
reports/document-intelligence.json
reports/document-intelligence.md
```

## Verify

```bash
npm run verify
```

Verification regenerates the reports and checks that expected summaries, entities, and table rows are present.

## Extracted Fields

- Summary: first informative sentences from each document.
- Entities: dates, money amounts, percentages, emails, organizations, and document references.
- Table-like rows: pipe-delimited lines with at least three cells.
- Signals: simple document risk or action cues such as overdue, compliance, audit, renewal, and payment.

## Architecture

```txt
samples/                  # simulated extracted PDF text
src/cli.js                # analyzer and report writer
src/verify.js             # deterministic checks
reports/                  # generated JSON and Markdown reports
```

## Ideas To Improve

- Add command-line flags for custom input and output folders.
- Add OCR confidence fields from a real extraction layer.
- Add schema validation for expected table headers.
- Add redaction rules for sensitive document content.
