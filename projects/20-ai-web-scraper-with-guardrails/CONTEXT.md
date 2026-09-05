# Context

## Project

- Mini-project: 20
- Name: AI Web Scraper With Guardrails
- Runtime: Node.js 20+
- Dependencies: none

## Goal

Provide a safe scraper that can demonstrate guarded data collection without crawling arbitrary websites. The project only reads configured local fixtures or explicitly approved HTTPS domains, validates extracted records, and writes reproducible artifacts under `reports/`.

## Architecture

- `src/index.js`: CLI entry point for the default scrape run.
- `src/scraper.js`: source guardrails, HTML extraction, schema validation, JSON/report writing.
- `src/sources.js`: allowlisted local and remote sources.
- `src/verify.js`: dependency-free verification checks.
- `fixtures/`: local HTML test sources.
- `reports/`: generated JSON and markdown reports.

## Verification

Run `npm run verify` from this directory.

## Notes

- Keep the project dependency-free.
- Do not broaden remote access without adding a targeted verification case.
- Treat malformed records as rejected data, not partial success.
