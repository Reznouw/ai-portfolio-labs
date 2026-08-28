import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const STOPWORDS = new Set([
  "about", "after", "again", "against", "also", "among", "around", "because", "before", "being", "between", "could", "during", "every", "from", "have", "into", "more", "most", "over", "said", "says", "some", "such", "than", "that", "their", "there", "these", "they", "this", "through", "under", "using", "very", "were", "when", "while", "with", "would", "will", "need", "new", "has", "had", "are", "and", "the", "for", "but", "not", "can", "was", "its", "it", "as", "to", "of", "in", "on", "by", "or", "an", "a"
]);

function parseDocument(markdown, fileName) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  let body = markdown.trim();

  if (match) {
    body = match[2].trim();
    for (const line of match[1].split("\n")) {
      const separator = line.indexOf(":");
      if (separator !== -1) {
        meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      }
    }
  }

  return {
    id: fileName.replace(/\.md$/, ""),
    title: meta.title || fileName.replace(/\.md$/, ""),
    source: meta.source || "Local sample",
    category: meta.category || "uncategorized",
    text: body
  };
}

export function loadDocuments(directory) {
  return readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => parseDocument(readFileSync(join(directory, file), "utf8"), file));
}

function tokenize(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^-+|-+$/g, ""))
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  const bigrams = [];
  for (let index = 0; index < words.length - 1; index += 1) {
    if (!STOPWORDS.has(words[index]) && !STOPWORDS.has(words[index + 1])) {
      bigrams.push(`${words[index]}_${words[index + 1]}`);
    }
  }

  return [...words, ...bigrams];
}

function termCounts(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    const valueA = a[key] || 0;
    const valueB = b[key] || 0;
    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function addVector(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
}

function divideVector(target, divisor) {
  if (divisor === 0) return target;
  for (const key of Object.keys(target)) {
    target[key] /= divisor;
  }
  return target;
}

function topTermsFromVector(vector, limit) {
  return Object.entries(vector)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term, score]) => ({ term: term.replace(/_/g, " "), score: Number(score.toFixed(4)) }));
}

function buildTfidf(documents) {
  const docTokens = documents.map((document) => tokenize(`${document.title} ${document.text}`));
  const counts = docTokens.map(termCounts);
  const documentFrequency = new Map();

  for (const docCounts of counts) {
    for (const term of docCounts.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const vectors = counts.map((docCounts, index) => {
    const vector = {};
    const tokenTotal = docTokens[index].length || 1;
    for (const [term, count] of docCounts.entries()) {
      const tf = count / tokenTotal;
      const idf = Math.log((documents.length + 1) / ((documentFrequency.get(term) || 0) + 1)) + 1;
      vector[term] = tf * idf;
    }
    return vector;
  });

  return { vectors, docTokens };
}

function kMeans(vectors, clusterCount, iterations = 18) {
  const centroids = Array.from({ length: clusterCount }, (_, index) => ({ ...vectors[Math.floor((index * vectors.length) / clusterCount)] }));
  let assignments = new Array(vectors.length).fill(0);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    assignments = vectors.map((vector) => {
      let bestCluster = 0;
      let bestScore = -1;
      centroids.forEach((centroid, clusterIndex) => {
        const score = cosineSimilarity(vector, centroid);
        if (score > bestScore) {
          bestScore = score;
          bestCluster = clusterIndex;
        }
      });
      return bestCluster;
    });

    for (let clusterIndex = 0; clusterIndex < clusterCount; clusterIndex += 1) {
      const members = vectors.filter((_, vectorIndex) => assignments[vectorIndex] === clusterIndex);
      if (members.length === 0) continue;
      const nextCentroid = {};
      members.forEach((vector) => addVector(nextCentroid, vector));
      centroids[clusterIndex] = divideVector(nextCentroid, members.length);
    }
  }

  return { assignments, centroids };
}

export function generateTopics(documents, options = {}) {
  const clusterCount = options.clusterCount || Math.min(5, Math.max(2, Math.round(Math.sqrt(documents.length))));
  const { vectors, docTokens } = buildTfidf(documents);
  const { assignments, centroids } = kMeans(vectors, clusterCount);

  const topics = Array.from({ length: clusterCount }, (_, clusterIndex) => {
    const documentIndexes = assignments
      .map((assignment, index) => (assignment === clusterIndex ? index : -1))
      .filter((index) => index !== -1);
    const terms = topTermsFromVector(centroids[clusterIndex] || {}, 8);
    const label = terms.slice(0, 3).map((term) => term.term).join(" / ") || `Topic ${clusterIndex + 1}`;

    return {
      id: `topic-${clusterIndex + 1}`,
      label,
      terms,
      documents: documentIndexes.map((index) => ({
        ...documents[index],
        clusterScore: Number(cosineSimilarity(vectors[index], centroids[clusterIndex] || {}).toFixed(4)),
        topTerms: topTermsFromVector(vectors[index], 5).map((item) => item.term),
        tokenCount: docTokens[index].filter((token) => !token.includes("_")).length
      }))
    };
  }).filter((topic) => topic.documents.length > 0);

  return {
    generatedAt: "deterministic-offline-build",
    method: "Local TF-IDF with deterministic k-means",
    documentCount: documents.length,
    topicCount: topics.length,
    topics
  };
}
