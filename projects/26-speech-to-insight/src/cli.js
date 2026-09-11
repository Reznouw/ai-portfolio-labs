import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderMarkdown, runPipeline } from "./pipeline.js";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.fixture) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const fixturePath = resolve(args.fixture);
const jsonPath = resolve(args.json || "reports/report.json");
const markdownPath = resolve(args.markdown || "reports/report.md");

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const report = runPipeline(fixture);

await mkdir(dirname(jsonPath), { recursive: true });
await mkdir(dirname(markdownPath), { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(markdownPath, renderMarkdown(report), "utf8");

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${markdownPath}`);

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--help") parsed.help = true;
    if (value === "--fixture") parsed.fixture = values[index + 1];
    if (value === "--json") parsed.json = values[index + 1];
    if (value === "--markdown") parsed.markdown = values[index + 1];
  }
  return parsed;
}

function printHelp() {
  console.log("Speech To Insight CLI");
  console.log("Usage: node src/cli.js --fixture data/fixtures/customer-call.json --json reports/customer-call.json --markdown reports/customer-call.md");
}
