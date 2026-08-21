import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "were",
  "with",
  "world"
]);

export async function loadJson(relativePath) {
  const raw = await readFile(join(projectRoot, relativePath), "utf8");
  return JSON.parse(raw);
}

export function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function includesPhrase(normalizedClaim, phrase) {
  return normalizedClaim.includes(normalizeText(phrase));
}

function overlapScore(a, b) {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let matches = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) matches += 1;
  }
  return matches / Math.max(aTokens.size, bTokens.size);
}

function guessWikipediaTitle(claim) {
  const normalized = normalizeText(claim);
  const match = normalized.match(/^(.+?)\s+(is|was|has|have|won|created|invented)\b/);
  if (match?.[1]) {
    return match[1]
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return normalized.split(" ").slice(0, 3).join(" ");
}

function collectLocalCandidates(claim, corpus) {
  const normalizedClaim = normalizeText(claim);
  const candidates = [];

  for (const item of corpus) {
    const topicMatched = item.topics.some((topic) => includesPhrase(normalizedClaim, topic));
    const topicOverlap = Math.max(...item.topics.map((topic) => overlapScore(claim, topic)));

    for (const rule of item.rules) {
      const requiredMatches = rule.requires.filter((phrase) => includesPhrase(normalizedClaim, phrase)).length;
      const allRequiredMatched = requiredMatches === rule.requires.length;
      const lexicalScore = overlapScore(claim, rule.snippet);

      if (allRequiredMatched || (topicMatched && lexicalScore >= 0.35)) {
        candidates.push({
          verdict: allRequiredMatched ? rule.verdict : "uncertain",
          confidence: allRequiredMatched ? Math.min(0.98, 0.72 + requiredMatches * 0.08) : Math.min(0.68, lexicalScore),
          source: `local:${item.id}`,
          title: item.title,
          snippet: rule.snippet,
          exact: allRequiredMatched
        });
      }
    }

    if (!topicMatched && topicOverlap >= 0.5) {
      candidates.push({
        verdict: "uncertain",
        confidence: 0.35,
        source: `local:${item.id}`,
        title: item.title,
        snippet: item.rules[0].snippet,
        exact: false
      });
    }
  }

  return candidates.sort((a, b) => Number(b.exact) - Number(a.exact) || b.confidence - a.confidence);
}

async function fetchWikipediaEvidence(claim) {
  const title = guessWikipediaTitle(claim);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "user-agent": "hallucination-checker-demo/0.1"
      },
      signal: AbortSignal.timeout(3500)
    });

    if (!response.ok) {
      return { note: `Wikipedia summary unavailable for ${title} (${response.status}).` };
    }

    const body = await response.json();
    if (!body.extract) {
      return { note: `Wikipedia summary unavailable for ${title}.` };
    }

    const score = overlapScore(claim, body.extract);
    return {
      candidate: {
        verdict: score >= 0.55 ? "supported" : "uncertain",
        confidence: score >= 0.55 ? Math.min(0.78, score) : Math.min(0.45, score),
        source: `wikipedia:${body.title || title}`,
        title: body.title || title,
        snippet: body.extract.split(". ").slice(0, 2).join(". "),
        exact: false
      },
      note: `Fetched Wikipedia summary for ${body.title || title}.`
    };
  } catch (error) {
    return { note: `Wikipedia lookup skipped or failed: ${error.message}.` };
  }
}

function chooseVerdict(candidates) {
  const exactCandidates = candidates.filter((candidate) => candidate.exact && candidate.verdict !== "uncertain");
  const pool = exactCandidates.length > 0 ? exactCandidates : candidates;
  const top = pool[0];

  if (!top) {
    return {
      verdict: "uncertain",
      confidence: 0.2,
      evidence: [],
      notes: ["No relevant evidence found in the local corpus."]
    };
  }

  const topVerdicts = new Set(pool.filter((candidate) => candidate.confidence >= top.confidence - 0.05).map((candidate) => candidate.verdict));
  const verdict = topVerdicts.size > 1 ? "uncertain" : top.verdict;
  const confidence = verdict === "uncertain" ? Math.min(0.5, top.confidence) : top.confidence;

  return {
    verdict,
    confidence: Number(confidence.toFixed(2)),
    evidence: pool.slice(0, 3).map(({ source, title, snippet }) => ({ source, title, snippet })),
    notes: verdict === "uncertain" && topVerdicts.size > 1 ? ["Relevant evidence was conflicting or too close to call."] : []
  };
}

export async function checkClaim(claim, options = {}) {
  if (!claim || !claim.trim()) {
    throw new Error("A non-empty claim is required.");
  }

  const corpus = await loadJson("data/evidence.json");
  const candidates = collectLocalCandidates(claim, corpus);
  const notes = [];

  if (options.useWikipedia !== false) {
    const wikipedia = await fetchWikipediaEvidence(claim);
    if (wikipedia.candidate) candidates.push(wikipedia.candidate);
    if (wikipedia.note) notes.push(wikipedia.note);
  } else {
    notes.push("Wikipedia lookup disabled; using local evidence only.");
  }

  const result = chooseVerdict(candidates);
  return {
    claim,
    verdict: result.verdict,
    confidence: result.confidence,
    evidence: result.evidence,
    notes: [...result.notes, ...notes]
  };
}
