#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSkill } from "./generator.js";
import { validateSkill } from "./validator.js";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

async function main(argv) {
  const [command, ...args] = argv;

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "generate") {
    await generateCommand(args);
    return;
  }

  if (command === "validate") {
    await validateCommand(args);
    return;
  }

  if (command === "examples") {
    printExamples();
    return;
  }

  if (command === "verify") {
    await verifyCommand();
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function generateCommand(args) {
  const briefPath = getOption(args, "--brief");
  const outPath = getOption(args, "--out") || "SKILL.md";

  if (!briefPath) {
    throw new Error("Missing required option: --brief <path>");
  }

  const brief = await readFile(resolveFromRoot(briefPath), "utf8");
  const skill = await generateSkill(brief);
  const validation = validateSkill(skill);

  if (!validation.ok) {
    throw new Error(`Generated skill is invalid. Missing: ${validation.missing.join(", ")}`);
  }

  const outputFile = resolveFromRoot(outPath);
  await mkdir(dirname(fileURLToPath(outputFile)), { recursive: true });
  await writeFile(outputFile, skill, "utf8");
  console.log(`Generated ${outPath}`);
}

async function validateCommand(args) {
  const filePath = args[0];

  if (!filePath) {
    throw new Error("Missing file path to validate");
  }

  const content = await readFile(resolveFromRoot(filePath), "utf8");
  const result = validateSkill(content);

  if (!result.ok) {
    console.error("Invalid SKILL.md");
    console.error(`Missing sections: ${result.missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log("Valid SKILL.md");
}

async function verifyCommand() {
  await generateCommand(["--brief", "examples/task-brief.txt", "--out", "examples/generated/SKILL.md"]);
  await validateCommand(["examples/generated/SKILL.md"]);
  printExamples();
  console.log("Verification passed");
}

function printHelp() {
  console.log(`Custom Skill Builder

Usage:
  node src/index.js generate --brief <brief.txt> --out <SKILL.md>
  node src/index.js validate <SKILL.md>
  node src/index.js examples
  node src/index.js verify`);
}

function printExamples() {
  console.log(`Examples:
  node src/index.js generate --brief examples/task-brief.txt --out examples/generated/SKILL.md
  node src/index.js validate examples/generated/SKILL.md
  npm run verify`);
}

function getOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function resolveFromRoot(path) {
  return new URL(path.replace(/\\/g, "/"), `file:///${rootDir.replace(/\\/g, "/")}/`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
