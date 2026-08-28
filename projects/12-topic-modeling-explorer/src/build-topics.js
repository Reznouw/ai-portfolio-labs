import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateTopics, loadDocuments } from "./topic-engine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const documents = loadDocuments(join(root, "sample-docs"));
const topics = generateTopics(documents, { clusterCount: 5 });
const outputPath = join(root, "public", "data", "topics.json");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(topics, null, 2)}\n`);

console.log(`Generated ${topics.topicCount} topics from ${topics.documentCount} documents at ${outputPath}`);
