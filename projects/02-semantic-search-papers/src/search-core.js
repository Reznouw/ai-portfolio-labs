const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
  "we"
]);

export function paperToText(paper) {
  return [
    paper.title,
    paper.abstract,
    ...(paper.authors || []),
    ...(paper.categories || []),
    String(paper.year || "")
  ].join(" ");
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function termFrequency(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  const total = tokens.length || 1;
  const tf = new Map();
  for (const [term, count] of counts) {
    tf.set(term, count / total);
  }
  return tf;
}

export function buildIndex(papers) {
  const documents = papers.map((paper) => ({
    paper,
    tokens: tokenize(paperToText(paper))
  }));

  const documentFrequency = new Map();
  for (const document of documents) {
    for (const term of new Set(document.tokens)) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const idf = {};
  const documentCount = documents.length;
  for (const [term, count] of documentFrequency) {
    idf[term] = Math.log((documentCount + 1) / (count + 1)) + 1;
  }

  const docs = documents.map((document) => ({
    paper: document.paper,
    vector: embedTokens(document.tokens, idf)
  }));

  return {
    createdAt: new Date().toISOString(),
    embedding: "local-tfidf-cosine",
    documentCount,
    vocabularySize: Object.keys(idf).length,
    idf,
    docs
  };
}

export function embedQuery(query, idf) {
  return embedTokens(tokenize(query), idf);
}

export function embedTokens(tokens, idf) {
  const tf = termFrequency(tokens);
  const vector = {};

  for (const [term, frequency] of tf) {
    if (Object.hasOwn(idf, term)) {
      vector[term] = frequency * idf[term];
    }
  }

  return normalize(vector);
}

export function cosineSimilarity(left, right) {
  let score = 0;
  const [small, large] = Object.keys(left).length < Object.keys(right).length
    ? [left, right]
    : [right, left];

  for (const term of Object.keys(small)) {
    score += small[term] * (large[term] || 0);
  }
  return score;
}

export function searchIndex(index, query, topK = 5) {
  const queryVector = embedQuery(query, index.idf);
  return index.docs
    .map((doc) => ({
      score: cosineSimilarity(queryVector, doc.vector),
      paper: doc.paper
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function normalize(vector) {
  const magnitude = Math.sqrt(
    Object.values(vector).reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitude === 0) {
    return {};
  }

  const normalized = {};
  for (const [term, value] of Object.entries(vector)) {
    normalized[term] = Number((value / magnitude).toFixed(6));
  }
  return normalized;
}
