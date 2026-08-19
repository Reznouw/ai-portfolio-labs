const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "does",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with"
]);

export function retrievePapers(query, papers, limit = 3) {
  const queryTerms = tokenize(query);

  return papers
    .map((paper) => {
      const text = paperText(paper);
      const tokens = tokenize(text);
      const tokenSet = new Set(tokens);
      const overlap = queryTerms.filter((term) => tokenSet.has(term));
      const topicHits = paper.topics.filter((topic) => query.toLowerCase().includes(topic.toLowerCase()));
      const score = overlap.length + topicHits.length * 1.5;

      return {
        paper,
        score,
        matches: [...new Set([...overlap, ...topicHits])]
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || b.paper.year - a.paper.year)
    .slice(0, limit);
}

export function buildContext(retrieved) {
  return retrieved
    .map(({ paper, matches }, index) => {
      const sourceId = index + 1;
      const cleanedAbstract = stripMarkdown(paper.abstract).replace(/\s+/g, " ").trim();
      return `[${sourceId}] ${paper.title} (${paper.year})\nAuthors: ${paper.authors.join(", ")}\nMatches: ${matches.join(", ") || "semantic topic"}\nAbstract: ${cleanedAbstract}`;
    })
    .join("\n\n");
}

export function localAnswer(query, retrieved) {
  if (retrieved.length === 0) {
    return {
      mode: "local",
      answer: "I did not find enough matching context in the sample paper set. Try asking about RAG, retrieval, agents, evaluation, hallucinations, or faithfulness."
    };
  }

  const citations = retrieved.map((_, index) => `[${index + 1}]`).join(" ");
  const topTitles = retrieved.map(({ paper }) => paper.title).join("; ");
  const keyPoints = retrieved.map(({ paper }) => firstUsefulSentence(paper.abstract));

  return {
    mode: "local",
    answer: `Based on the retrieved papers, ${query.toLowerCase()} is addressed through source-grounded context. ${keyPoints.join(" ")} Together, these papers suggest that answer quality depends on retrieving relevant evidence, assembling it clearly, and checking whether claims are faithful to that evidence. Sources: ${citations}. Retrieved papers: ${topTitles}.`
  };
}

export async function llmAnswer(query, context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Answer using only the provided paper context. Cite sources as [1], [2], etc. If context is insufficient, say so."
        },
        {
          role: "user",
          content: `Question: ${query}\n\nContext:\n${context}\n\nGive a concise answer with citations.`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.replace(/^-+|-+$/g, ""))
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function paperText(paper) {
  return `${paper.title} ${paper.year} ${paper.authors.join(" ")} ${paper.topics.join(" ")} ${paper.abstract}`;
}

function stripMarkdown(value) {
  return value.replace(/^#+\s*/gm, "").replace(/[*_`]/g, "");
}

function firstUsefulSentence(value) {
  const text = stripMarkdown(value).replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length > 30);
  return sentences[1] || sentences[0] || text;
}
