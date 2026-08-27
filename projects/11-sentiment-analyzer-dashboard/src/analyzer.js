import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "sample-reviews.json");

const POSITIVE = new Map([
  ["accurate", 2],
  ["acceptable", 1],
  ["amazing", 3],
  ["brilliant", 3],
  ["clean", 2],
  ["clear", 2],
  ["cozy", 2],
  ["confident", 2],
  ["concise", 2],
  ["easy", 2],
  ["excellent", 3],
  ["fast", 2],
  ["fine", 1],
  ["fresh", 2],
  ["friendly", 2],
  ["good", 2],
  ["great", 3],
  ["happy", 2],
  ["helpful", 2],
  ["loved", 3],
  ["lovely", 3],
  ["motivating", 2],
  ["nice", 1],
  ["smooth", 2],
  ["surprisingly", 1],
  ["useful", 2],
  ["warm", 2],
  ["worth", 2]
]);

const NEGATIVE = new Map([
  ["average", 1],
  ["bad", 2],
  ["broken", 3],
  ["confusing", 2],
  ["crashes", 3],
  ["endless", 2],
  ["failed", 3],
  ["frequent", 2],
  ["frustrating", 3],
  ["late", 2],
  ["long", 1],
  ["poor", 3],
  ["rude", 3],
  ["slow", 2],
  ["terrible", 4],
  ["transfers", 1],
  ["waste", 2]
]);

const NEGATORS = new Set(["not", "never", "no", "hardly", "barely"]);
const TOKEN_PATTERN = /[a-z']+/g;

export function tokenize(text) {
  return text.toLowerCase().match(TOKEN_PATTERN) ?? [];
}

function hasRecentNegator(tokens, index) {
  const start = Math.max(0, index - 3);
  return tokens.slice(start, index).some((token) => NEGATORS.has(token));
}

export function analyzeText(text) {
  const tokens = tokenize(text);
  const evidence = [];
  let rawScore = 0;
  let matchedTerms = 0;

  tokens.forEach((token, index) => {
    const positiveWeight = POSITIVE.get(token) ?? 0;
    const negativeWeight = NEGATIVE.get(token) ?? 0;
    if (!positiveWeight && !negativeWeight) return;

    const baseScore = positiveWeight - negativeWeight;
    const score = hasRecentNegator(tokens, index) ? -baseScore : baseScore;
    rawScore += score;
    matchedTerms += 1;
    evidence.push({ token, score });
  });

  const normalizedScore = matchedTerms === 0 ? 0 : Number((rawScore / matchedTerms).toFixed(2));
  const label = normalizedScore >= 0.75 ? "positive" : normalizedScore <= -0.75 ? "negative" : "neutral";

  return {
    label,
    score: normalizedScore,
    rawScore,
    matchedTerms,
    evidence
  };
}

export function loadSamples(filePath = DATA_PATH) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function analyzeSamples(samples = loadSamples()) {
  return samples.map((sample) => ({
    ...sample,
    sentiment: analyzeText(sample.text)
  }));
}

export function summarize(analyses) {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  const sourceCounts = {};
  let scoreTotal = 0;

  analyses.forEach((item) => {
    counts[item.sentiment.label] += 1;
    sourceCounts[item.source] = (sourceCounts[item.source] ?? 0) + 1;
    scoreTotal += item.sentiment.score;
  });

  const total = analyses.length;
  const averageScore = total === 0 ? 0 : Number((scoreTotal / total).toFixed(2));
  const sortedByIntensity = [...analyses].sort((a, b) => Math.abs(b.sentiment.score) - Math.abs(a.sentiment.score));

  return {
    total,
    averageScore,
    counts,
    sourceCounts,
    positiveRatio: total === 0 ? 0 : Number((counts.positive / total).toFixed(2)),
    negativeRatio: total === 0 ? 0 : Number((counts.negative / total).toFixed(2)),
    topPolarized: sortedByIntensity.slice(0, 4).map((item) => ({
      id: item.id,
      author: item.author,
      topic: item.topic,
      label: item.sentiment.label,
      score: item.sentiment.score
    }))
  };
}

export function buildDashboardData() {
  const analyses = analyzeSamples();
  return {
    generatedAt: new Date(0).toISOString(),
    summary: summarize(analyses),
    items: analyses
  };
}
