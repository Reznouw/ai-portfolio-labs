#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { getProvider, listProviderIds } from "./providers.js";
import { normalizeResult, rankResults } from "./normalizer.js";

function parseArgs(argv) {
  const args = {
    task: "config/example-task.json",
    providers: "mock-fast,mock-careful,mock-creative",
    out: "reports/comparison-report.md",
    json: null,
    timeoutMs: 45000
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--task") args.task = argv[++i];
    else if (arg === "--providers") args.providers = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--json") args.json = argv[++i];
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }

  return args;
}

function helpText() {
  return `Multi-Model Comparator

Usage:
  node src/cli.js --task config/example-task.json --providers mock-fast,mock-careful --out reports/report.md

Options:
  --task <path>        JSON task file
  --providers <ids>    Comma-separated provider IDs
  --out <path>         Markdown report output path
  --json <path>        Optional JSON output path
  --timeout-ms <n>     Per-provider timeout in milliseconds
  --help              Show this help

Available providers:
  ${listProviderIds().join(", ")}
`;
}

async function loadTask(taskPath) {
  const raw = await readFile(taskPath, "utf8");
  const task = JSON.parse(raw);

  if (!task.prompt || typeof task.prompt !== "string") {
    throw new Error("Task file must include a string prompt");
  }

  return task;
}

async function runProvider(provider, task, options) {
  const started = performance.now();
  try {
    const raw = await provider.run(task, options);
    return normalizeResult({
      provider,
      task,
      raw,
      latencyMs: Math.round(performance.now() - started)
    });
  } catch (error) {
    return normalizeResult({
      provider,
      task,
      raw: null,
      latencyMs: Math.round(performance.now() - started),
      error
    });
  }
}

function formatUsd(value) {
  return `$${Number(value).toFixed(6)}`;
}

function makeReport({ task, results }) {
  const ranked = rankResults(results);
  const generatedAt = new Date().toISOString();
  const lines = [];

  lines.push(`# Multi-Model Comparison Report`);
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Task: ${task.title || "Untitled"}`);
  lines.push("");
  lines.push("## Prompt");
  lines.push("");
  lines.push(task.prompt);
  lines.push("");

  if (Array.isArray(task.criteria) && task.criteria.length > 0) {
    lines.push("## Criteria");
    lines.push("");
    for (const item of task.criteria) lines.push(`- ${item}`);
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push("| Rank | Provider | Model | Status | Latency | Tokens | Est. cost |");
  lines.push("| --- | --- | --- | --- | ---: | ---: | ---: |");
  ranked.forEach((result, index) => {
    lines.push(
      `| ${index + 1} | ${result.providerName} | ${result.model} | ${result.status} | ${result.latencyMs} ms | ${result.cost.totalTokens} | ${formatUsd(result.cost.estimatedUsd)} |`
    );
  });
  lines.push("");

  lines.push("## Outputs");
  lines.push("");
  for (const result of results) {
    lines.push(`### ${result.providerName} (${result.model})`);
    lines.push("");
    lines.push(`Status: ${result.status}`);
    lines.push(`Latency: ${result.latencyMs} ms`);
    lines.push(`Estimated cost: ${formatUsd(result.cost.estimatedUsd)}`);
    lines.push("");

    if (result.error) {
      lines.push(`Error: ${result.error}`);
      lines.push("");
    }

    if (result.notes.length > 0) {
      lines.push("Notes:");
      for (const note of result.notes) lines.push(`- ${note}`);
      lines.push("");
    }

    lines.push(result.outputText || "No output text.");
    lines.push("");
  }

  lines.push("## Interpretation");
  lines.push("");
  lines.push("Rank is a simple operational sort: successful providers first, then lower estimated cost, then lower latency. It is not a quality judgment. Use the full outputs to decide which model best fits the task.");
  lines.push("");

  return lines.join("\n");
}

async function writeOutput(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(helpText());
    return;
  }

  const task = await loadTask(args.task);
  const providerIds = args.providers.split(",").map((id) => id.trim()).filter(Boolean);
  if (providerIds.length === 0) throw new Error("At least one provider is required");

  const selectedProviders = providerIds.map((id) => {
    const provider = getProvider(id);
    if (!provider) throw new Error(`Unknown provider: ${id}. Available: ${listProviderIds().join(", ")}`);
    return provider;
  });

  const results = await Promise.all(
    selectedProviders.map((provider) => runProvider(provider, task, { timeoutMs: args.timeoutMs }))
  );

  const report = makeReport({ task, results });
  await writeOutput(args.out, report);

  if (args.json) {
    await writeOutput(args.json, JSON.stringify({ task, results }, null, 2));
  }

  console.log(`Wrote ${args.out}`);
  for (const result of results) {
    console.log(`${result.providerId}: ${result.status}, ${result.latencyMs} ms, ${formatUsd(result.cost.estimatedUsd)}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
