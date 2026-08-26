import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataPath = join(rootDir, "data", "tiny-flowers.csv");
const reportDir = join(rootDir, "reports");

const featureColumns = ["sepal_length", "sepal_width", "petal_length", "petal_width"];

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function vector(row) {
  return featureColumns.map((column) => Number(row[column]));
}

function majorityClass(trainRows) {
  const counts = new Map();
  for (const row of trainRows) {
    counts.set(row.label, (counts.get(row.label) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function buildCentroids(trainRows) {
  const groups = new Map();

  for (const row of trainRows) {
    const current = groups.get(row.label) ?? { count: 0, sums: featureColumns.map(() => 0) };
    vector(row).forEach((value, index) => {
      current.sums[index] += value;
    });
    current.count += 1;
    groups.set(row.label, current);
  }

  return [...groups.entries()].map(([label, group]) => ({
    label,
    centroid: group.sums.map((sum) => sum / group.count),
  }));
}

function squaredDistance(left, right) {
  return left.reduce((total, value, index) => total + (value - right[index]) ** 2, 0);
}

function predictNearestCentroid(row, centroids) {
  const point = vector(row);
  return centroids
    .map((item) => ({ label: item.label, distance: squaredDistance(point, item.centroid) }))
    .sort((a, b) => a.distance - b.distance || a.label.localeCompare(b.label))[0].label;
}

function evaluate(name, testRows, predict) {
  const predictions = testRows.map((row) => {
    const predicted = predict(row);
    return {
      id: row.id,
      actual: row.label,
      predicted,
      correct: row.label === predicted,
    };
  });
  const labels = [...new Set(testRows.map((row) => row.label))].sort();
  const accuracy = predictions.filter((item) => item.correct).length / predictions.length;

  const perClass = labels.map((label) => {
    const tp = predictions.filter((item) => item.actual === label && item.predicted === label).length;
    const fp = predictions.filter((item) => item.actual !== label && item.predicted === label).length;
    const fn = predictions.filter((item) => item.actual === label && item.predicted !== label).length;
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return { label, precision, recall, f1, support: testRows.filter((row) => row.label === label).length };
  });

  const macroF1 = perClass.reduce((total, item) => total + item.f1, 0) / perClass.length;
  return { name, accuracy, macroF1, perClass, predictions };
}

function round(value) {
  return Number(value.toFixed(3));
}

function markdownReport(dataset, trainRows, testRows, results, recommendation) {
  const metricRows = results
    .map((result) => `| ${result.name} | ${round(result.accuracy)} | ${round(result.macroF1)} |`)
    .join("\n");
  const detailRows = results
    .map((result) => result.perClass
      .map((item) => `| ${result.name} | ${item.label} | ${round(item.precision)} | ${round(item.recall)} | ${round(item.f1)} | ${item.support} |`)
      .join("\n"))
    .join("\n");

  return `# AutoML Baseline Report

## Dataset

- Source: data/tiny-flowers.csv
- Rows: ${dataset.length}
- Features: ${featureColumns.join(", ")}
- Target: label
- Train rows: ${trainRows.length}
- Test rows: ${testRows.length}

## Candidate Baselines

- Majority Class: predicts the most frequent training label.
- Nearest Centroid: computes one numeric centroid per class and predicts the closest centroid by squared Euclidean distance.

## Metrics

| Model | Accuracy | Macro F1 |
| --- | ---: | ---: |
${metricRows}

## Per-Class Metrics

| Model | Class | Precision | Recall | F1 | Support |
| --- | --- | ---: | ---: | ---: | ---: |
${detailRows}

## Recommendation

Use **${recommendation.name}** as the current baseline. It has accuracy ${round(recommendation.accuracy)} and macro F1 ${round(recommendation.macroF1)} on the held-out test rows.

## Notes

- This is a teaching-sized AutoML loop, not a production trainer.
- The deterministic split is included in the CSV so results are reproducible.
- Add more rows before trusting the recommendation for real decisions.
`;
}

function main() {
  const dataset = parseCsv(readFileSync(dataPath, "utf8"));
  const trainRows = dataset.filter((row) => row.split === "train");
  const testRows = dataset.filter((row) => row.split === "test");
  const majority = majorityClass(trainRows);
  const centroids = buildCentroids(trainRows);

  const results = [
    evaluate("Majority Class", testRows, () => majority),
    evaluate("Nearest Centroid", testRows, (row) => predictNearestCentroid(row, centroids)),
  ];
  const recommendation = [...results].sort((a, b) => b.macroF1 - a.macroF1 || b.accuracy - a.accuracy)[0];

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, "automl-report.json"), `${JSON.stringify({
    dataset: { path: "data/tiny-flowers.csv", rows: dataset.length, trainRows: trainRows.length, testRows: testRows.length, features: featureColumns, target: "label" },
    models: results,
    recommendation: { name: recommendation.name, accuracy: recommendation.accuracy, macroF1: recommendation.macroF1 },
  }, null, 2)}\n`);
  writeFileSync(join(reportDir, "automl-report.md"), markdownReport(dataset, trainRows, testRows, results, recommendation));

  console.log("AutoML Baseline Builder");
  for (const result of results) {
    console.log(`${result.name}: accuracy=${round(result.accuracy)} macroF1=${round(result.macroF1)}`);
  }
  console.log(`Recommendation: ${recommendation.name}`);
  console.log("Reports written to reports/automl-report.json and reports/automl-report.md");
}

main();
