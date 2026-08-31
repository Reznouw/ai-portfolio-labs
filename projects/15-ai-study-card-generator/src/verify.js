import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const json = JSON.parse(await readFile("reports/cards/cards.json", "utf8"));
const markdown = await readFile("reports/cards/cards.md", "utf8");

assert(json.meta.mode === "offline-deterministic", "deck mode should be offline deterministic");
assert(Array.isArray(json.cards) && json.cards.length >= 6, "expected at least 6 cards");
assert(json.cards.every((card) => card.id && card.front && card.back && card.evidence), "cards must be complete");
assert(markdown.includes("# AI Study Cards"), "markdown report should include title");
assert(markdown.includes("CARD-01"), "markdown report should include first card");
await stat("public/index.html");
await stat("public/styles.css");
await stat("public/app.js");

const server = spawn(process.execPath, ["src/server.js"], {
  env: { ...process.env, PORT: "4183" },
  stdio: "ignore"
});

try {
  await wait(400);
  const response = await fetch("http://localhost:4183");
  const body = await response.text();
  assert(response.status === 200, "server should return HTTP 200");
  assert(body.includes("AI Study Card Generator"), "server should return frontend HTML");
} finally {
  server.kill();
}

console.log("Verification passed");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
