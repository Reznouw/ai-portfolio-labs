# Multi-Model Comparator

Mini-project 08: a local-first CLI for sending the same task to multiple model providers, normalizing their responses, estimating latency and cost, and writing a comparison report.

The project runs without paid APIs by default through deterministic mock providers. Optional real-provider adapters are included for OpenAI, OpenRouter, and Gemini-style APIs when matching environment variables are present.

## Concept

Multi-model orchestration is useful when one task benefits from comparing model behavior instead of trusting a single response. This CLI demonstrates a small orchestration loop:

1. Load one task from JSON.
2. Dispatch it to several providers.
3. Normalize output into a common shape.
4. Track latency and estimate cost.
5. Write a Markdown comparison report.

## Requirements

- Node.js 20+
- No npm dependencies
- Optional API keys only if you want real providers

## Quick Start

```bash
npm install
npm run compare
```

The default command writes `reports/example-report.md` using only mock providers.

## CLI Usage

```bash
node src/cli.js --task config/example-task.json --providers mock-fast,mock-careful,mock-creative --out reports/example-report.md
```

Useful options:

- `--task <path>`: JSON task file to run.
- `--providers <ids>`: comma-separated provider IDs.
- `--out <path>`: Markdown report path.
- `--json <path>`: optional normalized JSON result path.
- `--timeout-ms <number>`: per-provider timeout, default `45000`.

## Providers

Local mock providers:

- `mock-fast`: short answer, low latency, low estimated cost.
- `mock-careful`: structured answer with assumptions and risks.
- `mock-creative`: divergent answer with alternative framing.

Optional real providers:

- `openai`: requires `OPENAI_API_KEY`; optional `OPENAI_MODEL`, default `gpt-4o-mini`.
- `openrouter`: requires `OPENROUTER_API_KEY`; optional `OPENROUTER_MODEL`, default `openai/gpt-4o-mini`.
- `gemini`: requires `GEMINI_API_KEY`; optional `GEMINI_MODEL`, default `gemini-1.5-flash`.

Real providers are skipped with a clear status if their API key is missing. Cost estimates are approximate and configured in `src/providers.js`.

## Environment Variables

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4o-mini

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
```

## Task Format

See `config/example-task.json`.

```json
{
  "title": "Launch checklist",
  "prompt": "Create a concise checklist for launching a local-first AI tool.",
  "criteria": ["practical", "risk-aware", "short"],
  "maxOutputWords": 180
}
```

## Verification

```bash
npm run verify
```

Expected result: the CLI completes with mock providers and writes `reports/verify-report.md`.

## Files

- `src/cli.js`: argument parsing, orchestration, report writing.
- `src/providers.js`: mock and optional real provider adapters.
- `src/normalizer.js`: shared output normalization and cost estimation.
- `config/example-task.json`: sample task.
- `reports/`: generated reports.
- `CONTEXT.md`: project context for future agents.
