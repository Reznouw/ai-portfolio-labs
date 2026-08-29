# Text Classifier With BERT

Mini-project 13: a tiny, CPU-only text classifier that simulates the shape of a BERT classifier without downloading a transformer model.

It uses:

- A frozen embedding vocabulary in `data/vocabulary.json`.
- Mean pooling over token embeddings as a stand-in for BERT's `[CLS]` embedding.
- A nearest-prototype classifier trained from a tiny AG-News-like dataset.
- A CLI to train, evaluate, verify, and classify new text.

## Why This Is A BERT-Style Simulator

A real BERT classifier usually does this:

```txt
text -> tokenizer -> BERT encoder -> [CLS] vector -> linear classification head -> label
```

This mini-project keeps the same conceptual pipeline but replaces the expensive BERT encoder with fixed toy embeddings:

```txt
text -> simple tokenizer -> frozen token vectors -> mean pooled vector -> nearest class prototype -> label
```

To plug in real BERT later, replace `embedText` in `src/classifier.js` with a call to a local or hosted transformer encoder and keep the classifier interface the same.

## Install

No dependencies are required.

```bash
npm install
```

## Train

```bash
npm run train
```

This writes `report/model.json`.

## Evaluate

```bash
npm run eval
```

This writes `report/metrics.json`.

## Classify New Text

```bash
npm run classify -- "central bank stocks rally after inflation data"
```

Output includes the predicted label, confidence-like score, and per-class scores.

## Verify

```bash
npm run verify
```

Runs train, eval, and a smoke classification. It fails if accuracy drops below `0.75`.

## Labels

- `world`
- `sports`
- `business`
- `technology`

## Project Layout

```txt
data/dataset.json       # tiny AG-News-like train/test examples
data/vocabulary.json    # frozen toy embedding vocabulary
src/classifier.js       # tokenizer, embedding, training, evaluation
src/cli.js              # CLI commands
report/README.md        # report notes; generated model/metrics live here
```

## Limitations

- This is not a neural network and does not fine-tune BERT.
- Embeddings are hand-authored toy vectors, not learned contextual vectors.
- The dataset is intentionally small, so metrics are educational rather than meaningful.
