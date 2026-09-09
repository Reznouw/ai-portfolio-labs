# Context

## Goal

Build a mini computer vision classifier without a heavy model or PNG dependency. The project should classify simple ASCII or JSON image grids and include a polished frontend for inspecting samples and predictions.

## Scope

Only files under `staging/24-computer-vision-classifier` are part of this mini-project.

## Approach

The classifier uses feature engineering instead of training:

- Parse images as small binary matrices.
- Extract stable visual features from the matrix.
- Compare features against class prototypes.
- Return sorted predictions with confidence scores.

## Data Format

Samples can use either ASCII rows or direct JSON matrices.

ASCII pixels treat `#`, `1`, `X`, `x`, `@`, and `*` as active pixels. Other characters are inactive.

```json
{
  "id": "shirt-classic",
  "label": "shirt",
  "title": "Classic Shirt",
  "grid": [
    "..##..##..",
    ".########.",
    "..######.."
  ]
}
```

## Verification

Run `npm run verify` from this directory. The script validates file presence, dataset integrity, bundled sample predictions, and matrix input support.
