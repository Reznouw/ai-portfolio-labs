# Context

## Goal

Build mini-project 15: an AI Study Card Generator focused on concept structured generation. It must work offline with deterministic output from sample educational text, document optional LLM environment variables, provide CLI reports, and include a polished frontend for browsing cards.

## Frontend Direction

- Visual direction: warm academic desk interface with parchment cards, ink-like typography contrast, and a left-side study rail that feels more like a focused study session than a generic dashboard.
- Visual density: medium density, with large readable card faces and compact metadata chips.
- Main components: summary hero, progress rail, searchable card browser, flip card panel, evidence and prompt sections, and report links.
- Responsive decisions: desktop uses a two-column study layout; tablet and mobile collapse to a single column with sticky controls avoided to keep reading comfortable.

## Architecture

- `src/generator.js`: deterministic text parser and flashcard builder.
- `src/cli.js`: command-line report generator for JSON and Markdown.
- `src/server.js`: zero-dependency static preview server on port 4173.
- `src/verify.js`: verification script for generated reports and local server response.
- `public/`: browser UI that loads `reports/cards/cards.json`.
- `sample/educational-text.txt`: bundled educational source text.
- `reports/cards/`: generated JSON and Markdown study card reports.

## Offline Behavior

The generator does not call an external API. It uses deterministic section parsing, keyword extraction, and template-based question generation. Optional LLM environment variables are documented in `README.md` for future extension only.

## Verification

- `npm run verify`: OK on 2026-08-15. It generated 6 cards, validated JSON and Markdown reports, checked frontend assets, and confirmed the preview server returned HTTP 200 on port 4183.

## Screenshot

- `assets/demo.png`: screenshot captured from `http://localhost:4183`.

## Implementation Notes

- ASCII-only content.
- No dependencies.
- All files are contained under `staging/15-ai-study-card-generator`.
