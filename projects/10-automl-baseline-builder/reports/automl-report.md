# AutoML Baseline Report

## Dataset

- Source: data/tiny-flowers.csv
- Rows: 18
- Features: sepal_length, sepal_width, petal_length, petal_width
- Target: label
- Train rows: 12
- Test rows: 6

## Candidate Baselines

- Majority Class: predicts the most frequent training label.
- Nearest Centroid: computes one numeric centroid per class and predicts the closest centroid by squared Euclidean distance.

## Metrics

| Model | Accuracy | Macro F1 |
| --- | ---: | ---: |
| Majority Class | 0.333 | 0.167 |
| Nearest Centroid | 1 | 1 |

## Per-Class Metrics

| Model | Class | Precision | Recall | F1 | Support |
| --- | --- | ---: | ---: | ---: | ---: |
| Majority Class | setosa | 0.333 | 1 | 0.5 | 2 |
| Majority Class | versicolor | 0 | 0 | 0 | 2 |
| Majority Class | virginica | 0 | 0 | 0 | 2 |
| Nearest Centroid | setosa | 1 | 1 | 1 | 2 |
| Nearest Centroid | versicolor | 1 | 1 | 1 | 2 |
| Nearest Centroid | virginica | 1 | 1 | 1 | 2 |

## Recommendation

Use **Nearest Centroid** as the current baseline. It has accuracy 1 and macro F1 1 on the held-out test rows.

## Notes

- This is a teaching-sized AutoML loop, not a production trainer.
- The deterministic split is included in the CSV so results are reproducible.
- Add more rows before trusting the recommendation for real decisions.
