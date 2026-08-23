import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const datasetPath = path.join(projectRoot, "data", "arena-samples.json");
const reportDir = path.join(projectRoot, "reports");
const jsonReportPath = path.join(reportDir, "judge-report.json");
const markdownReportPath = path.join(reportDir, "judge-report.md");

const STOP_WORDS = new Set([
  "a",
  "after",
  "all",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "by",
  "can",
  "for",
  "from",
  "has",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "one",
  "or",
  "that",
  "the",
  "their",
  "they",
  "this",
  "to",
  "use",
  "uses",
  "when",
  "with"
]);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9@.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function sentenceCount(text) {
  const matches = text.trim().match(/[^.!?]+[.!?]+/g);
  return matches ? matches.length : text.trim() ? 1 : 0;
}

function containsPhrase(text, phrase) {
  return normalize(text).includes(normalize(phrase));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function scoreCorrectness(answer, rubric) {
  const matchedFacts = rubric.required_facts.filter((fact) => containsPhrase(answer, fact));
  const forbiddenHits = rubric.forbidden_claims.filter((claim) => containsPhrase(answer, claim));
  const factScore = rubric.required_facts.length === 0 ? 1 : matchedFacts.length / rubric.required_facts.length;
  const penalty = forbiddenHits.length * 0.25;

  return {
    score: round(Math.max(0, factScore - penalty)),
    matched_facts: matchedFacts,
    missing_facts: rubric.required_facts.filter((fact) => !matchedFacts.includes(fact)),
    forbidden_claims: forbiddenHits
  };
}

function scoreHelpfulness(answer, prompt, rubric) {
  const helpfulTerms = rubric.helpfulness_terms.filter((term) => containsPhrase(answer, term));
  const termScore = rubric.helpfulness_terms.length === 0 ? 1 : helpfulTerms.length / rubric.helpfulness_terms.length;
  const sentences = sentenceCount(answer);
  const concise = sentences > 0 && sentences <= rubric.max_sentences ? 1 : 0.65;
  const direct = tokenize(prompt).some((token) => normalize(answer).includes(token)) ? 1 : 0.75;

  return {
    score: round(termScore * 0.5 + concise * 0.3 + direct * 0.2),
    helpful_terms: helpfulTerms,
    sentence_count: sentences,
    max_sentences: rubric.max_sentences
  };
}

function scoreGrounding(answer, context) {
  const answerTerms = [...new Set(tokenize(answer))];
  const contextTerms = new Set(tokenize(context));
  const supportedTerms = answerTerms.filter((term) => contextTerms.has(term));
  const unsupportedTerms = answerTerms.filter((term) => !contextTerms.has(term));
  const score = answerTerms.length === 0 ? 0 : supportedTerms.length / answerTerms.length;

  return {
    score: round(score),
    supported_terms: supportedTerms,
    unsupported_terms: unsupportedTerms.slice(0, 12)
  };
}

function judgeCandidate(item, candidate) {
  const correctness = scoreCorrectness(candidate.answer, item.rubric);
  const helpfulness = scoreHelpfulness(candidate.answer, item.prompt, item.rubric);
  const grounding = scoreGrounding(candidate.answer, item.context);
  const overall = correctness.score * 0.45 + helpfulness.score * 0.25 + grounding.score * 0.3;

  return {
    id: candidate.id,
    model: candidate.model,
    answer: candidate.answer,
    scores: {
      correctness: correctness.score,
      helpfulness: helpfulness.score,
      grounding: grounding.score,
      overall: round(overall)
    },
    evidence: {
      correctness,
      helpfulness,
      grounding
    }
  };
}

function judgeItem(item) {
  const candidates = item.candidates.map((candidate) => judgeCandidate(item, candidate));
  const winner = [...candidates].sort((left, right) => right.scores.overall - left.scores.overall)[0];

  return {
    id: item.id,
    title: item.title,
    prompt: item.prompt,
    context: item.context,
    winner: {
      id: winner.id,
      model: winner.model,
      overall: winner.scores.overall
    },
    candidates
  };
}

function average(results, metric) {
  const candidates = results.flatMap((result) => result.candidates);
  const total = candidates.reduce((sum, candidate) => sum + candidate.scores[metric], 0);
  return round(total / candidates.length);
}

function buildMarkdownReport(report) {
  const lines = [
    "# LLM Judge Arena Report",
    "",
    `Generated at: ${report.generated_at}`,
    "",
    "## Summary",
    "",
    `- Prompts: ${report.summary.prompts}`,
    `- Candidates: ${report.summary.candidates}`,
    `- Average correctness: ${report.summary.average_correctness}`,
    `- Average helpfulness: ${report.summary.average_helpfulness}`,
    `- Average grounding: ${report.summary.average_grounding}`,
    `- Average overall: ${report.summary.average_overall}`,
    "",
    "## Prompt Results",
    ""
  ];

  for (const result of report.results) {
    lines.push(`### ${result.id}: ${result.title}`);
    lines.push("");
    lines.push(`Prompt: ${result.prompt}`);
    lines.push("");
    lines.push(`Winner: ${result.winner.model} (${result.winner.id}) with overall ${result.winner.overall}`);
    lines.push("");

    for (const candidate of result.candidates) {
      lines.push(`#### ${candidate.model} (${candidate.id})`);
      lines.push("");
      lines.push(candidate.answer);
      lines.push("");
      lines.push(
        `Scores: correctness=${candidate.scores.correctness}, helpfulness=${candidate.scores.helpfulness}, grounding=${candidate.scores.grounding}, overall=${candidate.scores.overall}`
      );
      lines.push("");
      lines.push(`Matched facts: ${candidate.evidence.correctness.matched_facts.join(", ") || "none"}`);
      lines.push("");
      lines.push(`Missing facts: ${candidate.evidence.correctness.missing_facts.join(", ") || "none"}`);
      lines.push("");
      lines.push(`Forbidden claims: ${candidate.evidence.correctness.forbidden_claims.join(", ") || "none"}`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function assertValidReport(report) {
  if (report.summary.prompts < 3) {
    throw new Error("Expected at least 3 sample prompts.");
  }

  for (const result of report.results) {
    if (result.candidates.length !== 2) {
      throw new Error(`Expected exactly 2 candidates for ${result.id}.`);
    }

    for (const candidate of result.candidates) {
      for (const metric of ["correctness", "helpfulness", "grounding", "overall"]) {
        const value = candidate.scores[metric];
        if (typeof value !== "number" || value < 0 || value > 1) {
          throw new Error(`Invalid ${metric} score for ${result.id}/${candidate.id}.`);
        }
      }
    }
  }
}

async function main() {
  const checkMode = process.argv.includes("--check");
  const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
  const results = dataset.map(judgeItem);
  const report = {
    project: "LLM Judge Arena",
    mode: "deterministic-local-rubric",
    generated_at: new Date().toISOString(),
    optional_openai_compatible: {
      enabled: false,
      note: "This demo does not call paid APIs. See README.md for optional env vars if you replace the local judge."
    },
    summary: {
      prompts: results.length,
      candidates: results.reduce((sum, result) => sum + result.candidates.length, 0),
      average_correctness: average(results, "correctness"),
      average_helpfulness: average(results, "helpfulness"),
      average_grounding: average(results, "grounding"),
      average_overall: average(results, "overall")
    },
    results
  };

  assertValidReport(report);

  await mkdir(reportDir, { recursive: true });
  await writeFile(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownReportPath, buildMarkdownReport(report));

  console.log("LLM Judge Arena report generated");
  console.log(`Mode: ${report.mode}`);
  console.log(`Prompts: ${report.summary.prompts}`);
  console.log(`Candidates: ${report.summary.candidates}`);
  console.log(`Average overall: ${report.summary.average_overall}`);
  console.log("Reports: reports/judge-report.json, reports/judge-report.md");

  if (checkMode) {
    console.log("Verification: OK");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
