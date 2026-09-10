#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { extractDocument } from "./extractor.js";
import { formatJson, formatMarkdown } from "./formatters.js";
import { refineWithLlm } from "./llm.js";

const args = parseArgs(process.argv.slice(2));

if (!args.input) {
  fail("Missing --input <path>.");
}

const inputPath = resolve(args.input);
const ocrText = await readFile(inputPath, "utf8");
let result = extractDocument(ocrText, args.input);

if (args.useLlm) {
  const refined = await refineWithLlm({ ocrText, extracted: result });
  result = refined.result;
  result.metadata.llm = refined.metadata;
}

const output = formatResult(result, args.format || "json");

if (args.out) {
  const outPath = resolve(args.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, output, "utf8");
} else {
  process.stdout.write(output);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--use-llm") {
      parsed.useLlm = true;
    } else if (arg.startsWith("--")) {
      parsed[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return parsed;
}

function formatResult(result, format) {
  if (format === "json") return formatJson(result);
  if (["md", "markdown"].includes(format)) return formatMarkdown(result);
  fail(`Unsupported format: ${format}`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
