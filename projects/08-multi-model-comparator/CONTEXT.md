# Context

## Status

- State: initial mini-project implementation
- Updated: 2026-08-15
- Scope boundary: only `staging/08-multi-model-comparator`

## Goal

Build a runnable Multi-Model Comparator that demonstrates multi-model orchestration without requiring paid APIs. The CLI sends one task to multiple providers, normalizes responses, records latency and estimated cost, and writes a comparison report.

## Architecture

- `src/cli.js`: CLI entry point and orchestration loop.
- `src/providers.js`: provider registry with local mocks and optional real API adapters.
- `src/normalizer.js`: shared response normalization, token approximation, and cost estimate helpers.
- `config/example-task.json`: sample task input.
- `reports/`: generated Markdown reports.

## Decisions

- Use plain Node.js 20 with no dependencies to keep the project portable.
- Mock providers are deterministic enough for verification but vary style and latency.
- Real providers are optional and skipped when env vars are missing instead of failing the whole run.
- Cost is an estimate based on approximate token counts, not billing-grade accounting.
- Reports are Markdown for easy portfolio review and git diffs.

## How To Run

```bash
npm install
npm run compare
npm run verify
```

## Verification

- Verification command: `npm run verify`
- Expected artifact: `reports/verify-report.md`
- Expected behavior: all mock providers return normalized results and the command exits with code 0.

## Future Ideas

- Add pairwise scoring rubrics.
- Add CSV export.
- Add provider concurrency limits.
- Add semantic diffing between model outputs.
