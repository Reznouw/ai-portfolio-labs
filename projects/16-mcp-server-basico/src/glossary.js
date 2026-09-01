import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "glossary.json");

let cachedTerms;

export async function loadTerms() {
  if (!cachedTerms) {
    cachedTerms = JSON.parse(await readFile(dataPath, "utf8"));
  }

  return cachedTerms;
}

export async function searchTerms(query, limit = 5) {
  const terms = await loadTerms();
  const normalizedQuery = String(query || "").trim().toLowerCase();

  if (!normalizedQuery) {
    return terms.slice(0, limit);
  }

  return terms
    .map((item) => ({ item, score: scoreTerm(item, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.term.localeCompare(b.item.term))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export async function getTerm(idOrTerm) {
  const terms = await loadTerms();
  const normalized = String(idOrTerm || "").trim().toLowerCase();

  return terms.find((item) => item.id === normalized || item.term.toLowerCase() === normalized) || null;
}

function scoreTerm(item, query) {
  const haystack = [item.id, item.term, item.category, item.definition, item.example].join(" ").toLowerCase();
  let score = 0;

  if (item.id.includes(query)) score += 6;
  if (item.term.toLowerCase().includes(query)) score += 5;
  if (item.category.toLowerCase().includes(query)) score += 3;

  for (const token of query.split(/\s+/).filter(Boolean)) {
    if (haystack.includes(token)) score += 1;
  }

  return score;
}
