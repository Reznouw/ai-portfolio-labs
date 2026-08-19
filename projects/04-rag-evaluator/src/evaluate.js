import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const datasetPath = path.join(projectRoot, "data", "paper-qa.json");
const reportDir = path.join(projectRoot, "reports");

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "both",
  "by",
  "can",
  "during",
  "each",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "so",
  "that",
  "the",
  "this",
  "to",
  "use",
  "uses",
  "while",
  "with"
]);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function containsPhrase(text, phrase) {
  return normalize(text).includes(normalize(phrase));
}

function exactScore(expected, generated) {
  return normalize(expected) === normalize(generated) ? 1 : 0;
}

function keywordScore(requiredKeywords, generated) {
  if (requiredKeywords.length === 0) return 1;

  const matched = requiredKeywords.filter((keyword) => containsPhrase(generated, keyword));
  return matched.length / requiredKeywords.length;
}

function groundednessScore(context, generated) {
  const answerTerms = [...new Set(tokenize(generated))];
  if (answerTerms.length === 0) return 0;

  const contextTerms = new Set(tokenize(context));
  const supported = answerTerms.filter((term) => contextTerms.has(term));
  return supported.length / answerTerms.length;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function evaluateItem(item) {
  const exact = exactScore(item.expected_answer, item.generated_answer);
  const keyword = keywordScore(item.required_keywords, item.generated_answer);
  const groundedness = groundednessScore(item.context, item.generated_answer);
  const overall = exact * 0.2 + keyword * 0.4 + groundedness * 0.4;

  return {
    id: item.id,
    paper: item.paper,
    question: item.question,
    scores: {
      exact: round(exact),
      keyword: round(keyword),
      groundedness: round(groundedness),
      overall: round(overall)
    },
    expected_answer: item.expected_answer,
    generated_answer: item.generated_answer
  };
}

function average(results, metric) {
  const total = results.reduce((sum, result) => sum + result.scores[metric], 0);
  return round(total / results.length);
}

function buildMarkdownReport(report) {
  const lines = [
    "# RAG Evaluation Report",
    "",
    `Generated at: ${report.generated_at}`,
    "",
    "## Summary",
    "",
    `- Items: ${report.summary.items}`,
    `- Exact: ${report.summary.exact}`,
    `- Keyword: ${report.summary.keyword}`,
    `- Groundedness: ${report.summary.groundedness}`,
    `- Overall: ${report.summary.overall}`,
    "",
    "## Results",
    ""
  ];

  for (const result of report.results) {
    lines.push(`### ${result.id}: ${result.paper}`);
    lines.push("");
    lines.push(`Question: ${result.question}`);
    lines.push("");
    lines.push(`Expected: ${result.expected_answer}`);
    lines.push("");
    lines.push(`Generated: ${result.generated_answer}`);
    lines.push("");
    lines.push(
      `Scores: exact=${result.scores.exact}, keyword=${result.scores.keyword}, groundedness=${result.scores.groundedness}, overall=${result.scores.overall}`
    );
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const rawDataset = await readFile(datasetPath, "utf8");
  const dataset = JSON.parse(rawDataset);
  const results = dataset.map(evaluateItem);
  const report = {
    project: "RAG Evaluator",
    generated_at: new Date().toISOString(),
    summary: {
      items: results.length,
      exact: average(results, "exact"),
      keyword: average(results, "keyword"),
      groundedness: average(results, "groundedness"),
      overall: average(results, "overall")
    },
    results
  };

  await mkdir(reportDir, { recursive: true });
  await writeFile(path.join(reportDir, "eval-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(reportDir, "eval-report.md"), buildMarkdownReport(report));

  console.log("RAG Evaluator report generated");
  console.log(`Items: ${report.summary.items}`);
  console.log(`Exact: ${report.summary.exact}`);
  console.log(`Keyword: ${report.summary.keyword}`);
  console.log(`Groundedness: ${report.summary.groundedness}`);
  console.log(`Overall: ${report.summary.overall}`);
  console.log("Reports: reports/eval-report.json, reports/eval-report.md");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
