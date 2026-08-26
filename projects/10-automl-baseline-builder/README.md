# AutoML Baseline Builder

Mini-project 10 for the AI portfolio: a small dependency-free AutoML-style baseline runner for a tiny tabular classification dataset.

The project trains and evaluates simple classic ML baselines, then writes a recommendation report.

## What You Will Learn

- How to represent a tiny tabular classification dataset in CSV.
- How a majority-class baseline sets a minimum bar.
- How a nearest-centroid classifier can provide a lightweight numeric-feature baseline.
- How accuracy and macro F1 can disagree on class-balanced evaluation.
- How to generate a repeatable model recommendation report.

## Install

No runtime dependencies are required beyond Node.js 20+.

```bash
npm install
```

## Run

```bash
npm run eval
```

The command reads `data/tiny-flowers.csv` and writes:

```txt
reports/automl-report.json
reports/automl-report.md
```

It also prints a compact metrics summary to the terminal.

## Baselines

- `Majority Class`: predicts the most common training label.
- `Nearest Centroid`: averages feature vectors per class, then predicts the closest centroid.

## Metrics

- `accuracy`: fraction of correct predictions on the test split.
- `precision`: per-class true positives divided by predicted positives.
- `recall`: per-class true positives divided by actual positives.
- `f1`: harmonic mean of precision and recall.
- `macroF1`: unweighted mean of per-class F1 scores.

## Dataset Shape

The bundled CSV is iris-like and intentionally tiny:

```txt
id,sepal_length,sepal_width,petal_length,petal_width,label,split
```

Rows marked `train` are used to build baselines. Rows marked `test` are held out for evaluation.

## Architecture

```txt
data/tiny-flowers.csv  # tiny tabular dataset
src/automl.js          # CSV parsing, training, evaluation, report writing
reports/               # generated after npm run eval
```

## Ideas To Improve

- Add stratified split generation for larger CSV files.
- Add min-max feature scaling before centroid distance.
- Add k-nearest-neighbors while keeping the implementation small.
- Add CLI flags for a custom CSV path and target column.
