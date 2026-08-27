import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeSamples, analyzeText, loadSamples, summarize } from "./analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readRelative(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const samples = loadSamples();
const analyses = analyzeSamples(samples);
const summary = summarize(analyses);
const firstPass = analyzeText("The product is not good, but support is helpful.");
const secondPass = analyzeText("The product is not good, but support is helpful.");

assert(samples.length === 12, "Expected 12 sample items");
assert(samples.every((item) => item.id && item.source && item.author && item.topic && item.text), "Every sample needs complete fields");
assert(JSON.stringify(firstPass) === JSON.stringify(secondPass), "Analyzer must be deterministic");
assert(firstPass.label === "neutral", "Negation handling smoke test should be neutral");
assert(summary.total === 12, "Summary total mismatch");
assert(summary.counts.positive === 6, "Expected 6 positive items");
assert(summary.counts.neutral === 2, "Expected 2 neutral items");
assert(summary.counts.negative === 4, "Expected 4 negative items");
assert(summary.averageScore === 0.16, "Expected average score of 0.16");

["public/index.html", "public/styles.css", "public/app.js", "README.md", "CONTEXT.md"].forEach((relativePath) => {
  assert(fs.existsSync(path.join(ROOT, relativePath)), `Missing ${relativePath}`);
});

const readme = readRelative("README.md");
const context = readRelative("CONTEXT.md");
const html = readRelative("public/index.html");

assert(readme.includes("![Demo](assets/demo.png)"), "README must include demo image placeholder");
assert(context.includes("Frontend Direction"), "CONTEXT must record frontend direction");
assert(html.includes("aria-label"), "Frontend should include accessible labels");

console.log("Verification passed: analyzer, summary metrics, assets, and docs are valid.");
