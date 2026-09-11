# Speech To Insight

Dependency-free mini-project that simulates an ASR pipeline using transcript and audio metadata fixtures. It turns speech-like input into a summary, sentiment readout, and action item list, then writes JSON and Markdown reports.

## Pipeline

1. Load transcription fixture from `data/fixtures`.
2. Normalize ASR-style segments into turns and full text.
3. Build an extractive summary from high-signal sentences.
4. Score sentiment with a small local lexicon.
5. Extract action items from deadlines, owners, commitments, and follow-ups.
6. Write `reports/*.json` and `reports/*.md`.

## Commands

```bash
npm run generate
npm run generate:team
npm run verify
npm run start
```

`npm run start` serves the frontend at `http://127.0.0.1:4126`.

## CLI Usage

```bash
node src/cli.js --fixture data/fixtures/customer-call.json --json reports/customer-call.json --markdown reports/customer-call.md
```

Options:

- `--fixture`: input ASR fixture JSON.
- `--json`: output JSON path.
- `--markdown`: output Markdown path.
- `--help`: print usage.

## Frontend

The frontend in `src/frontend` loads the committed `reports/customer-call.json` and renders a polished insight dashboard. It references `assets/demo.png` if present; when the file is missing, it shows an in-page generated demo card instead.

## Real ASR Notes

This project intentionally avoids external APIs. A production version could replace fixtures with output from Whisper, browser `MediaRecorder` plus local ASR, or a private speech service. Keep the normalized fixture shape stable so downstream summary, sentiment, and action item steps remain testable without network calls.

## Verification

`npm run verify` regenerates both fixture reports, validates the core JSON schema, confirms Markdown output exists, and checks frontend assets are present.
