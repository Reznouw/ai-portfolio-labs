#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateCardsFromFile, renderMarkdown } from "./generator.js";

const args = parseArgs(process.argv.slice(2));
const input = resolve(args.input || "sample/educational-text.txt");
const jsonPath = resolve(args.json || "reports/cards/cards.json");
const markdownPath = resolve(args.markdown || "reports/cards/cards.md");
const limit = args.limit ? Number(args.limit) : undefined;

const deck = await generateCardsFromFile(input, { limit });

await mkdir(dirname(jsonPath), { recursive: true });
await mkdir(dirname(markdownPath), { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(deck, null, 2)}\n`, "utf8");
await writeFile(markdownPath, renderMarkdown(deck), "utf8");

console.log(`Generated ${deck.cards.length} cards`);
console.log(`JSON: ${jsonPath}`);
console.log(`Markdown: ${markdownPath}`);

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = values[index + 1] && !values[index + 1].startsWith("--") ? values[index + 1] : "true";
    parsed[key] = value;
    if (value !== "true") index += 1;
  }
  return parsed;
}
