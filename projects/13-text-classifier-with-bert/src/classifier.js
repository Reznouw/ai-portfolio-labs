import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = new URL("..", import.meta.url);
const DATASET_PATH = new URL("../data/dataset.json", import.meta.url);
const VOCAB_PATH = new URL("../data/vocabulary.json", import.meta.url);
const REPORT_DIR = new URL("../report/", import.meta.url);
const MODEL_PATH = new URL("../report/model.json", import.meta.url);
const METRICS_PATH = new URL("../report/metrics.json", import.meta.url);

export async function loadDataset() {
  return JSON.parse(await readFile(DATASET_PATH, "utf8"));
}

export async function loadVocabulary() {
  return JSON.parse(await readFile(VOCAB_PATH, "utf8"));
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function embedText(text, vocabulary) {
  const tokens = tokenize(text);
  const width = vocabulary.dimensions.length;
  const sum = Array.from({ length: width }, () => 0);
  let matched = 0;

  for (const token of tokens) {
    const vector = vocabulary.vectors[token];
    if (!vector) continue;
    matched += 1;
    for (let index = 0; index < width; index += 1) {
      sum[index] += vector[index];
    }
  }

  if (matched === 0) {
    return { vector: sum, tokens, matched };
  }

  return {
    vector: sum.map((value) => value / matched),
    tokens,
    matched
  };
}

export function trainPrototypeModel(dataset, vocabulary) {
  const labels = dataset.labels;
  const width = vocabulary.dimensions.length;
  const prototypes = Object.fromEntries(
    labels.map((label) => [label, Array.from({ length: width }, () => 0)])
  );
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));

  for (const example of dataset.train) {
    const { vector } = embedText(example.text, vocabulary);
    counts[example.label] += 1;
    for (let index = 0; index < width; index += 1) {
      prototypes[example.label][index] += vector[index];
    }
  }

  for (const label of labels) {
    prototypes[label] = prototypes[label].map((value) => value / counts[label]);
  }

  return {
    kind: "frozen-embedding-nearest-prototype",
    labels,
    dimensions: vocabulary.dimensions,
    prototypes,
    trainExamples: dataset.train.length,
    note: "Replace embedText with a BERT [CLS] embedding to turn this simulator into a real BERT-style classifier."
  };
}

export function classifyText(text, model, vocabulary) {
  const embedding = embedText(text, vocabulary);
  const scores = Object.fromEntries(
    model.labels.map((label) => [label, cosineSimilarity(embedding.vector, model.prototypes[label])])
  );
  const ranking = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const [label, score] = ranking[0];

  return {
    label,
    score: round(score),
    scores: Object.fromEntries(ranking.map(([name, value]) => [name, round(value)])),
    matchedTokens: embedding.matched,
    tokens: embedding.tokens
  };
}

export function evaluateModel(dataset, model, vocabulary) {
  const byLabel = Object.fromEntries(
    dataset.labels.map((label) => [label, { correct: 0, total: 0 }])
  );
  const predictions = dataset.test.map((example) => {
    const prediction = classifyText(example.text, model, vocabulary);
    const correct = prediction.label === example.label;
    byLabel[example.label].total += 1;
    if (correct) byLabel[example.label].correct += 1;

    return {
      text: example.text,
      expected: example.label,
      predicted: prediction.label,
      score: prediction.score,
      correct
    };
  });

  const correct = predictions.filter((prediction) => prediction.correct).length;
  const accuracy = correct / predictions.length;

  return {
    accuracy: round(accuracy),
    correct,
    total: predictions.length,
    byLabel: Object.fromEntries(
      Object.entries(byLabel).map(([label, value]) => [
        label,
        { ...value, accuracy: round(value.total === 0 ? 0 : value.correct / value.total) }
      ])
    ),
    predictions
  };
}

export async function saveModel(model) {
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(MODEL_PATH, `${JSON.stringify(model, null, 2)}\n`, "utf8");
  return path.relative(fileURLToPath(PROJECT_ROOT), fileURLToPath(MODEL_PATH));
}

export async function loadModel() {
  return JSON.parse(await readFile(MODEL_PATH, "utf8"));
}

export async function saveMetrics(metrics) {
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(METRICS_PATH, `${JSON.stringify(metrics, null, 2)}\n`, "utf8");
  return path.relative(fileURLToPath(PROJECT_ROOT), fileURLToPath(METRICS_PATH));
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function round(value) {
  return Number(value.toFixed(4));
}
