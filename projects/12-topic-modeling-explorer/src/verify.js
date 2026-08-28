import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createTopicServer } from "./server.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "public", "data", "topics.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(data.documentCount === 10, "expected 10 sample documents");
assert(data.topicCount >= 3, "expected at least 3 populated topics");
assert(data.topics.every((topic) => topic.terms.length >= 3), "each topic needs at least 3 terms");
assert(data.topics.reduce((sum, topic) => sum + topic.documents.length, 0) === data.documentCount, "all documents must be assigned");
assert(data.topics.every((topic) => topic.documents.every((document) => document.clusterScore > 0)), "documents need positive cluster scores");

const server = createTopicServer();
await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();

try {
  const [home, topics] = await Promise.all([
    fetch(`http://localhost:${port}/`),
    fetch(`http://localhost:${port}/data/topics.json`)
  ]);
  assert(home.status === 200, "home endpoint should return 200");
  assert(topics.status === 200, "topics endpoint should return 200");
  assert((await home.text()).includes("Topic Modeling Explorer"), "home should contain app title");
  assert((await topics.json()).documentCount === 10, "topics endpoint should return generated data");
} finally {
  server.close();
}

console.log("Verification passed: generated topics, data integrity and local server endpoints are OK.");
