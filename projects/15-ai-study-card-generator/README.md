# AI Study Card Generator

Offline deterministic flashcard generator for sample educational text. It extracts core concepts, definitions, supporting facts, and review prompts into structured JSON and Markdown study cards.

## Demo

![Demo](assets/demo.png)

Screenshot capture is planned after the local preview is running.

## Features

- Deterministic offline card generation from `sample/educational-text.txt`.
- Structured cards with concept, front, back, difficulty, tags, evidence, and review prompts.
- CLI outputs both `reports/cards/cards.json` and `reports/cards/cards.md`.
- Polished browser UI for browsing, filtering, flipping, and marking cards.
- Optional LLM environment variables documented, but not required.

## Quick Start

```bash
npm install
npm run generate
npm run dev
```

Open `http://localhost:4173`.

## Verify

```bash
npm run verify
```

The verify command regenerates cards, validates the JSON report, checks the Markdown report, confirms the frontend assets exist, and exercises the HTTP preview server.

## CLI

```bash
node src/cli.js --input sample/educational-text.txt --json reports/cards/cards.json --markdown reports/cards/cards.md
```

Optional flags:

- `--input`: source educational text file.
- `--json`: JSON output path.
- `--markdown`: Markdown output path.
- `--limit`: maximum number of cards.

## Optional LLM Configuration

The generator is intentionally offline and deterministic. If you want to adapt it later to call an LLM, use environment variables like these while keeping the offline fallback:

```bash
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Current implementation does not send data to any API.

## Project Structure

```txt
assets/demo.png              README screenshot target, captured later
public/                      Static frontend
reports/cards/               Generated JSON and Markdown cards
sample/educational-text.txt  Source text
src/                         CLI, generator, server, verification
```
