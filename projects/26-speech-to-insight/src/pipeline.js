const POSITIVE_WORDS = new Set([
  "clearer",
  "excited",
  "help",
  "important",
  "positive",
  "promising",
  "ready",
  "revised",
  "simplify",
  "support"
]);

const NEGATIVE_WORDS = new Set([
  "blocker",
  "confusing",
  "delays",
  "failed",
  "slow",
  "surprise",
  "worried"
]);

const ACTION_PATTERNS = [
  /\b(i|we|team|please)\s+(will|can|should|need|needs|must)\b/i,
  /\b(before|by|after|next|today|tomorrow|friday|tuesday|wednesday|thursday|noon)\b/i,
  /\b(send|schedule|review|prepare|document|propose|add|simplify|flag|confirm)\b/i
];

export function runPipeline(fixture) {
  validateFixture(fixture);

  const turns = fixture.segments.map((segment, index) => ({
    index: index + 1,
    speaker: segment.speaker,
    start: segment.start,
    end: segment.end,
    confidence: segment.confidence,
    text: normalizeWhitespace(segment.text)
  }));

  const transcript = turns.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n");
  const sentences = turns.map((turn) => ({
    ...turn,
    score: scoreSentence(turn.text)
  }));

  return {
    id: fixture.id,
    title: fixture.title,
    recordedAt: fixture.recordedAt,
    generatedAt: new Date().toISOString(),
    audio: fixture.audio,
    transcript,
    summary: buildSummary(sentences),
    sentiment: analyzeSentiment(transcript),
    actionItems: extractActionItems(turns),
    quality: buildQuality(fixture.audio, turns),
    speakers: buildSpeakerStats(turns)
  };
}

export function renderMarkdown(report) {
  const actions = report.actionItems.length
    ? report.actionItems.map((item) => `- [${item.priority}] ${item.owner}: ${item.task} (${item.due})`).join("\n")
    : "- No clear action items detected.";

  const speakers = report.speakers
    .map((speaker) => `- ${speaker.name}: ${speaker.turns} turns, ${speaker.talkTimeSeconds.toFixed(1)} seconds`)
    .join("\n");

  return `# ${report.title}\n\n` +
    `Generated: ${report.generatedAt}\n\n` +
    `## Summary\n\n${report.summary}\n\n` +
    `## Sentiment\n\n` +
    `Overall: ${report.sentiment.label}\n\n` +
    `Score: ${report.sentiment.score}\n\n` +
    `Positive hits: ${report.sentiment.positiveHits.join(", ") || "none"}\n\n` +
    `Negative hits: ${report.sentiment.negativeHits.join(", ") || "none"}\n\n` +
    `## Action Items\n\n${actions}\n\n` +
    `## Quality\n\n` +
    `- Average confidence: ${report.quality.averageConfidence}\n` +
    `- Low confidence turns: ${report.quality.lowConfidenceTurns}\n` +
    `- Duration: ${report.quality.durationMinutes} minutes\n\n` +
    `## Speaker Stats\n\n${speakers}\n`;
}

function validateFixture(fixture) {
  if (!fixture || typeof fixture !== "object") {
    throw new Error("Fixture must be an object.");
  }
  if (!fixture.id || !fixture.title || !Array.isArray(fixture.segments)) {
    throw new Error("Fixture requires id, title, and segments.");
  }
  if (!fixture.audio || typeof fixture.audio.averageConfidence !== "number") {
    throw new Error("Fixture requires audio metadata with averageConfidence.");
  }
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function scoreSentence(text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) score += 1;
  }
  if (ACTION_PATTERNS.some((pattern) => pattern.test(text))) score += 2;
  if (lower.includes("but") || lower.includes("although")) score += 1;
  return score;
}

function buildSummary(sentences) {
  const top = [...sentences]
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map((turn) => turn.text);

  return top.join(" ");
}

function analyzeSentiment(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  const positiveHits = words.filter((word) => POSITIVE_WORDS.has(word));
  const negativeHits = words.filter((word) => NEGATIVE_WORDS.has(word));
  const score = positiveHits.length - negativeHits.length;
  const label = score > 1 ? "positive" : score < -1 ? "negative" : "mixed";

  return {
    label,
    score,
    positiveHits: unique(positiveHits),
    negativeHits: unique(negativeHits)
  };
}

function extractActionItems(turns) {
  return turns
    .filter((turn) => ACTION_PATTERNS.some((pattern) => pattern.test(turn.text)))
    .map((turn, index) => ({
      id: `A${String(index + 1).padStart(2, "0")}`,
      owner: inferOwner(turn),
      task: cleanTask(turn.text),
      due: inferDue(turn.text),
      priority: inferPriority(turn.text),
      sourceSpeaker: turn.speaker,
      sourceTurn: turn.index
    }));
}

function inferOwner(turn) {
  if (/^i\s+/i.test(turn.text)) return turn.speaker;
  if (/\bteam\b/i.test(turn.text)) return "Team";
  if (/\bwe\b/i.test(turn.text)) return "Shared";
  if (/\bplease\b/i.test(turn.text)) return "Assignee TBD";
  return turn.speaker;
}

function cleanTask(text) {
  return text.replace(/\s+/g, " ").replace(/[.?!]$/, "").trim();
}

function inferDue(text) {
  const match = text.match(/\b(before end of day|by tomorrow afternoon|by Wednesday morning|by noon tomorrow|before Friday|next Tuesday|today|tomorrow|Friday|Tuesday|Wednesday|Thursday)\b/i);
  return match ? match[0] : "No explicit due date";
}

function inferPriority(text) {
  return /\b(blocker|delays|failed|important|need|must|worried)\b/i.test(text) ? "high" : "normal";
}

function buildQuality(audio, turns) {
  const lowConfidenceTurns = turns.filter((turn) => turn.confidence < 0.86).length;
  return {
    averageConfidence: Number(audio.averageConfidence.toFixed(2)),
    lowConfidenceTurns,
    durationMinutes: Number((audio.durationSeconds / 60).toFixed(1)),
    note: lowConfidenceTurns > 0 ? "Review low-confidence turns before sharing externally." : "ASR confidence is acceptable for draft insights."
  };
}

function buildSpeakerStats(turns) {
  const stats = new Map();
  for (const turn of turns) {
    const current = stats.get(turn.speaker) || { name: turn.speaker, turns: 0, talkTimeSeconds: 0 };
    current.turns += 1;
    current.talkTimeSeconds += turn.end - turn.start;
    stats.set(turn.speaker, current);
  }
  return [...stats.values()];
}

function unique(values) {
  return [...new Set(values)];
}
