# Fraud Detection Monitor

Mini-project 22: a deterministic fraud detection monitor built with a tiny public-like transaction dataset and no external dependencies.

## What It Does

- Loads reference and current transaction CSV files from `data/`.
- Fits simple baseline statistics from reference transactions.
- Applies deterministic fraud rules to current transactions.
- Computes precision, recall, F1, accuracy, false positive rate, and confusion matrix.
- Computes simple drift signals for amount distribution, category mix, foreign transaction rate, and fraud-rate proxy.
- Writes machine-readable and Markdown reports to `reports/`.
- Serves a local static dashboard from `src/`.

## Verify

Run from this directory:

```bash
npm run verify
```

The verify command regenerates reports and checks that required files, metrics, and drift outputs exist.

## Generate Report

```bash
npm run report
```

Outputs:

- `reports/report.json`
- `reports/report.md`

## Local Dashboard

```bash
npm start
```

Then open:

```text
http://localhost:4222
```

## Data Notes

The dataset is intentionally small and synthetic, shaped like common public transaction fraud datasets:

- transaction timestamp
- card and user identifiers
- amount
- user and merchant country
- merchant category
- hour of day
- fraud label

It is not suitable for real fraud decisions. It is a compact monitoring demo.

## Baseline Rules

Each current transaction receives a score. A score of `50` or higher predicts fraud.

Signals include:

- high amount versus reference legitimate p95
- foreign merchant country
- risky merchant category
- unusual transaction hour
- short-window card velocity
- amount spike versus user baseline

## Drift Monitor

The monitor compares reference and current data using:

- amount Population Stability Index style buckets
- merchant category PSI style buckets
- foreign transaction rate delta
- fraud-rate proxy delta

Severity levels are deterministic: `low`, `medium`, or `high`.
