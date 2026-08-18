import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { searchIndex } from "./search-core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const indexPath = join(projectRoot, "data", "index.json");

const args = process.argv.slice(2);
const topFlagIndex = args.indexOf("--top");
const topK = topFlagIndex >= 0 ? Number(args[topFlagIndex + 1]) : 5;
const queryParts = topFlagIndex >= 0 ? args.slice(0, topFlagIndex) : args;
const query = queryParts.join(" ").trim();

if (!query) {
  console.error("Usage: npm run search -- \"your research query\" [--top 3]");
  process.exit(1);
}

const index = JSON.parse(await readFile(indexPath, "utf8"));
const results = searchIndex(index, query, Number.isFinite(topK) ? topK : 5);

console.log(`Query: ${query}`);
console.log(`Embedding: ${index.embedding}`);
console.log("");

if (results.length === 0) {
  console.log("No matching papers found. Try terms closer to the sample dataset.");
  process.exit(0);
}

for (const [position, result] of results.entries()) {
  const paper = result.paper;
  console.log(`${position + 1}. ${paper.title}`);
  console.log(`   Score: ${result.score.toFixed(3)} | ${paper.year} | ${paper.categories.join(", ")}`);
  console.log(`   Authors: ${paper.authors.join(", ")}`);
  console.log(`   ${paper.abstract}`);
  console.log("");
}
