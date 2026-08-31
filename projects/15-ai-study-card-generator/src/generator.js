import { readFile } from "node:fs/promises";

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "because",
  "both",
  "but",
  "can",
  "does",
  "for",
  "from",
  "has",
  "into",
  "its",
  "one",
  "other",
  "some",
  "that",
  "the",
  "their",
  "these",
  "this",
  "through",
  "too",
  "use",
  "uses",
  "while",
  "with"
]);

export async function generateCardsFromFile(inputPath, options = {}) {
  const text = await readFile(inputPath, "utf8");
  return generateCards(text, options);
}

export function generateCards(text, options = {}) {
  const limit = Number(options.limit || 12);
  const sections = parseSections(text);
  const cards = sections.slice(0, limit).map((section, index) => buildCard(section, index));

  return {
    meta: {
      title: "AI Study Card Generator",
      mode: "offline-deterministic",
      generatedAt: "deterministic-run",
      sourceSections: sections.length,
      cardCount: cards.length
    },
    cards
  };
}

export function renderMarkdown(deck) {
  const lines = [
    "# AI Study Cards",
    "",
    `Mode: ${deck.meta.mode}`,
    `Cards: ${deck.meta.cardCount}`,
    ""
  ];

  for (const card of deck.cards) {
    lines.push(`## ${card.id}. ${card.concept}`);
    lines.push("");
    lines.push(`- Difficulty: ${card.difficulty}`);
    lines.push(`- Tags: ${card.tags.join(", ")}`);
    lines.push(`- Front: ${card.front}`);
    lines.push(`- Back: ${card.back}`);
    lines.push(`- Evidence: ${card.evidence}`);
    lines.push(`- Review Prompt: ${card.reviewPrompt}`);
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function parseSections(text) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const sections = [];
  for (let index = 0; index < blocks.length; index += 2) {
    const title = blocks[index];
    const body = blocks[index + 1] || "";
    if (title && body) {
      sections.push({ title, body });
    }
  }

  return sections;
}

function buildCard(section, index) {
  const sentences = splitSentences(section.body);
  const definition = sentences[0] || section.body;
  const support = sentences[1] || definition;
  const tags = extractTags(`${section.title} ${section.body}`);
  const difficulty = getDifficulty(section.body, index);

  return {
    id: `CARD-${String(index + 1).padStart(2, "0")}`,
    concept: section.title,
    front: `Explain ${section.title.toLowerCase()} in your own words.`,
    back: cleanSentence(definition),
    difficulty,
    tags,
    evidence: cleanSentence(support),
    reviewPrompt: `Connect ${section.title.toLowerCase()} to ${tags.slice(0, 2).join(" and ")}.`
  };
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter(Boolean);
}

function cleanSentence(sentence) {
  return sentence.replace(/\s+/g, " ").trim();
}

function extractTags(text) {
  const counts = new Map();
  const words = text.toLowerCase().match(/[a-z][a-z-]{3,}/g) || [];

  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([word]) => word);
}

function getDifficulty(body, index) {
  const terms = (body.match(/[A-Z][A-Za-z]{2,}|ATP|NADPH|RuBisCO|RuBP/g) || []).length;
  if (terms >= 5 || index >= 4) return "hard";
  if (terms >= 3 || body.length > 260) return "medium";
  return "easy";
}
