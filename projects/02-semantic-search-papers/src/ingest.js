import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "./search-core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const datasetPath = join(projectRoot, "data", "sample-papers.json");
const indexPath = join(projectRoot, "data", "index.json");

const rawDataset = await readFile(datasetPath, "utf8");
const papers = JSON.parse(rawDataset);
const index = buildIndex(papers);

await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(`Indexed ${index.documentCount} papers`);
console.log(`Vocabulary terms: ${index.vocabularySize}`);
console.log(`Wrote ${indexPath}`);
