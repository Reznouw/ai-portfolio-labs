# Context

## Current State

- Status: ready for local verification
- Last updated: 2026-08-15
- Scope: staging mini-project only

## Goal

Build a tiny runnable text classifier that explains the BERT classifier pipeline without requiring GPU, model downloads, or large dependencies.

## Architecture

- `src/classifier.js`: core classifier logic.
- `src/cli.js`: command line interface for train, eval, classify, and verify.
- `data/dataset.json`: tiny AG-News-like labeled examples.
- `data/vocabulary.json`: frozen token embedding table.
- `report/`: generated model and metrics outputs.

## Design Decisions

- No dependencies, so it runs anywhere Node.js 20 runs.
- Frozen toy embeddings simulate the output space of a text encoder.
- Nearest class prototypes avoid GPU training while still showing a train/eval loop.
- A real BERT encoder would replace `embedText` and feed the same classifier interface.

## Verification

Run from this directory:

```bash
npm run verify
```

Expected behavior:

- Builds `report/model.json` from training data.
- Builds `report/metrics.json` from test data.
- Classifies a smoke-test business headline.
- Fails if test accuracy is below `0.75`.

## Notes For Future Agents

Keep this project tiny. Do not add TensorFlow, PyTorch, Transformers.js, or a downloaded BERT unless the requirement changes. If a real model is added, preserve the existing CLI contract.
