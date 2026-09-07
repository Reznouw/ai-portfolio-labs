import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const reportsDir = path.join(root, "reports");

const riskyCategories = new Set(["crypto", "gambling", "gift_card", "luxury"]);
const amountBins = [0, 25, 50, 100, 250, 500, 1000, Infinity];

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    return {
      ...row,
      amount: Number(row.amount),
      hour: Number(row.hour),
      is_fraud: Number(row.is_fraud),
      timestampMs: Date.parse(row.timestamp)
    };
  });
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function fitBaseline(referenceRows) {
  const legitimate = referenceRows.filter((row) => row.is_fraud === 0);
  const legitimateAmounts = legitimate.map((row) => row.amount);
  const userMedians = new Map();

  for (const userId of new Set(referenceRows.map((row) => row.user_id))) {
    const amounts = referenceRows.filter((row) => row.user_id === userId && row.is_fraud === 0).map((row) => row.amount);
    if (amounts.length > 0) userMedians.set(userId, percentile(amounts, 0.5));
  }

  return {
    amountAverage: average(legitimateAmounts),
    amountP95: percentile(legitimateAmounts, 0.95),
    globalMedian: percentile(legitimateAmounts, 0.5),
    userMedians
  };
}

function scoreRows(rows, baseline) {
  const sortedRows = [...rows].sort((a, b) => a.timestampMs - b.timestampMs);
  const historyByCard = new Map();

  return sortedRows.map((row) => {
    const reasons = [];
    let score = 0;
    const highAmountThreshold = Math.max(900, baseline.amountP95 * 1.4);
    const userMedian = baseline.userMedians.get(row.user_id) ?? baseline.globalMedian;
    const cardHistory = historyByCard.get(row.card_id) ?? [];
    const recentCardTransactions = cardHistory.filter((timestampMs) => row.timestampMs - timestampMs <= 45 * 60 * 1000).length;

    if (row.amount >= highAmountThreshold) {
      score += 35;
      reasons.push("high_amount");
    }
    if (row.merchant_country !== row.user_country) {
      score += 25;
      reasons.push("foreign_merchant");
    }
    if (riskyCategories.has(row.merchant_category)) {
      score += 25;
      reasons.push("risky_category");
    }
    if (row.hour < 6 || row.hour >= 23) {
      score += 15;
      reasons.push("unusual_hour");
    }
    if (recentCardTransactions >= 2) {
      score += 15;
      reasons.push("card_velocity");
    }
    if (recentCardTransactions >= 2 && row.amount >= 500) {
      score += 35;
      reasons.push("high_value_velocity");
    }
    if (row.amount >= userMedian * 3 && row.amount >= 150) {
      score += 10;
      reasons.push("user_amount_spike");
    }

    historyByCard.set(row.card_id, [...cardHistory, row.timestampMs]);

    return {
      ...row,
      score,
      predicted_fraud: score >= 50 ? 1 : 0,
      reasons
    };
  });
}

function computeMetrics(scoredRows) {
  const counts = scoredRows.reduce(
    (acc, row) => {
      if (row.predicted_fraud === 1 && row.is_fraud === 1) acc.tp += 1;
      if (row.predicted_fraud === 1 && row.is_fraud === 0) acc.fp += 1;
      if (row.predicted_fraud === 0 && row.is_fraud === 0) acc.tn += 1;
      if (row.predicted_fraud === 0 && row.is_fraud === 1) acc.fn += 1;
      return acc;
    },
    { tp: 0, fp: 0, tn: 0, fn: 0 }
  );

  const precision = counts.tp + counts.fp === 0 ? 0 : counts.tp / (counts.tp + counts.fp);
  const recall = counts.tp + counts.fn === 0 ? 0 : counts.tp / (counts.tp + counts.fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (counts.tp + counts.tn) / scoredRows.length;
  const falsePositiveRate = counts.fp + counts.tn === 0 ? 0 : counts.fp / (counts.fp + counts.tn);

  return {
    ...counts,
    precision,
    recall,
    f1,
    accuracy,
    falsePositiveRate
  };
}

function rate(rows, predicate) {
  return rows.filter(predicate).length / rows.length;
}

function bucketLabel(index, bins) {
  const start = bins[index];
  const end = bins[index + 1];
  return end === Infinity ? `${start}+` : `${start}-${end}`;
}

function distribution(rows, keyOrFn, possibleKeys = null) {
  const keys = possibleKeys ?? [...new Set(rows.map((row) => (typeof keyOrFn === "function" ? keyOrFn(row) : row[keyOrFn])))].sort();
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const row of rows) {
    const key = typeof keyOrFn === "function" ? keyOrFn(row) : row[keyOrFn];
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, count / rows.length]));
}

function psi(referenceDist, currentDist) {
  const keys = [...new Set([...Object.keys(referenceDist), ...Object.keys(currentDist)])];
  return keys.reduce((sum, key) => {
    const referenceRate = Math.max(referenceDist[key] ?? 0, 0.001);
    const currentRate = Math.max(currentDist[key] ?? 0, 0.001);
    return sum + (currentRate - referenceRate) * Math.log(currentRate / referenceRate);
  }, 0);
}

function severity(value, mediumThreshold, highThreshold) {
  if (value >= highThreshold) return "high";
  if (value >= mediumThreshold) return "medium";
  return "low";
}

function amountBucket(row) {
  for (let index = 0; index < amountBins.length - 1; index += 1) {
    if (row.amount >= amountBins[index] && row.amount < amountBins[index + 1]) return bucketLabel(index, amountBins);
  }
  return "unknown";
}

function computeDrift(referenceRows, currentRows) {
  const amountKeys = amountBins.slice(0, -1).map((_, index) => bucketLabel(index, amountBins));
  const categoryKeys = [...new Set([...referenceRows, ...currentRows].map((row) => row.merchant_category))].sort();
  const amountPsi = psi(distribution(referenceRows, amountBucket, amountKeys), distribution(currentRows, amountBucket, amountKeys));
  const categoryPsi = psi(
    distribution(referenceRows, "merchant_category", categoryKeys),
    distribution(currentRows, "merchant_category", categoryKeys)
  );
  const referenceForeignRate = rate(referenceRows, (row) => row.merchant_country !== row.user_country);
  const currentForeignRate = rate(currentRows, (row) => row.merchant_country !== row.user_country);
  const referenceFraudRate = rate(referenceRows, (row) => row.is_fraud === 1);
  const currentFraudRate = rate(currentRows, (row) => row.is_fraud === 1);
  const foreignRateDelta = Math.abs(currentForeignRate - referenceForeignRate);
  const fraudRateDelta = Math.abs(currentFraudRate - referenceFraudRate);

  const checks = [
    { name: "amount_distribution", value: amountPsi, severity: severity(amountPsi, 0.1, 0.25) },
    { name: "category_mix", value: categoryPsi, severity: severity(categoryPsi, 0.1, 0.25) },
    { name: "foreign_rate_delta", value: foreignRateDelta, severity: severity(foreignRateDelta, 0.08, 0.18) },
    { name: "fraud_rate_proxy_delta", value: fraudRateDelta, severity: severity(fraudRateDelta, 0.08, 0.18) }
  ];

  return {
    checks,
    summary: checks.some((check) => check.severity === "high")
      ? "high"
      : checks.some((check) => check.severity === "medium")
        ? "medium"
        : "low"
  };
}

function round(value) {
  return Number(value.toFixed(4));
}

function markdownReport(report) {
  const metrics = report.metrics;
  const driftRows = report.drift.checks
    .map((check) => `| ${check.name} | ${round(check.value)} | ${check.severity} |`)
    .join("\n");
  const transactionRows = report.scoredTransactions
    .map(
      (row) =>
        `| ${row.transaction_id} | ${row.amount.toFixed(2)} | ${row.score} | ${row.predicted_fraud} | ${row.is_fraud} | ${row.reasons.join(", ") || "none"} |`
    )
    .join("\n");

  return `# Fraud Detection Monitor Report

Generated at: ${report.generatedAt}

## Performance

| Metric | Value |
| --- | ---: |
| Accuracy | ${round(metrics.accuracy)} |
| Precision | ${round(metrics.precision)} |
| Recall | ${round(metrics.recall)} |
| F1 | ${round(metrics.f1)} |
| False positive rate | ${round(metrics.falsePositiveRate)} |
| True positives | ${metrics.tp} |
| False positives | ${metrics.fp} |
| True negatives | ${metrics.tn} |
| False negatives | ${metrics.fn} |

## Drift

Overall drift severity: ${report.drift.summary}

| Check | Value | Severity |
| --- | ---: | --- |
${driftRows}

## Scored Current Transactions

| Transaction | Amount | Score | Predicted fraud | Actual fraud | Reasons |
| --- | ---: | ---: | ---: | ---: | --- |
${transactionRows}

## Notes

This monitor is deterministic and intended for a small demonstration dataset. It is not a production fraud model.
`;
}

export async function runMonitor() {
  const [referenceText, currentText] = await Promise.all([
    readFile(path.join(dataDir, "reference_transactions.csv"), "utf8"),
    readFile(path.join(dataDir, "current_transactions.csv"), "utf8")
  ]);
  const referenceRows = parseCsv(referenceText);
  const currentRows = parseCsv(currentText);
  const baseline = fitBaseline(referenceRows);
  const scoredTransactions = scoreRows(currentRows, baseline);
  const metrics = computeMetrics(scoredTransactions);
  const drift = computeDrift(referenceRows, currentRows);
  const report = {
    generatedAt: new Date().toISOString(),
    baseline: {
      amountAverage: round(baseline.amountAverage),
      amountP95: round(baseline.amountP95),
      globalMedian: round(baseline.globalMedian),
      threshold: 50
    },
    metrics: Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    drift: {
      summary: drift.summary,
      checks: drift.checks.map((check) => ({ ...check, value: round(check.value) }))
    },
    scoredTransactions: scoredTransactions.map((row) => ({
      transaction_id: row.transaction_id,
      timestamp: row.timestamp,
      user_id: row.user_id,
      card_id: row.card_id,
      amount: row.amount,
      merchant_country: row.merchant_country,
      user_country: row.user_country,
      merchant_category: row.merchant_category,
      hour: row.hour,
      is_fraud: row.is_fraud,
      score: row.score,
      predicted_fraud: row.predicted_fraud,
      reasons: row.reasons
    }))
  };

  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(reportsDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "report.md"), markdownReport(report), "utf8");
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitor()
    .then((report) => {
      console.log(`Report written to reports/report.md`);
      console.log(`F1=${report.metrics.f1} drift=${report.drift.summary}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
