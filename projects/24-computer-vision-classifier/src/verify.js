import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { classify } from "./classifier.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const requiredFiles = [
  "README.md",
  "CONTEXT.md",
  "package.json",
  "public/index.html",
  "src/app.js",
  "src/classifier.js",
  "src/server.js",
  "src/styles.css",
  "data/samples.json",
  "reports/verification.md"
];

async function main() {
  for (const file of requiredFiles) {
    await access(join(root, file));
  }

  const samples = JSON.parse(await readFile(join(root, "data/samples.json"), "utf8"));
  assert(samples.length >= 10, "Expected at least 10 bundled samples.");

  const failures = [];
  for (const sample of samples) {
    assert(sample.id && sample.label && sample.title, `Sample ${sample.id ?? "unknown"} is missing metadata.`);
    assert(sample.grid || sample.matrix, `Sample ${sample.id} needs grid or matrix data.`);

    const result = classify(sample);
    if (result.label !== sample.label) {
      failures.push(`${sample.id}: expected ${sample.label}, got ${result.label}`);
    }
  }

  const matrixResult = classify({
    matrix: [
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
    ]
  });
  assert(matrixResult.label === "shirt", `Expected matrix support to classify as shirt, got ${matrixResult.label}.`);

  if (failures.length > 0) {
    throw new Error(`Classifier mismatches:\n${failures.join("\n")}`);
  }

  console.log(`Verified ${samples.length} samples with 100% bundled accuracy.`);
  console.log("Verified required files and JSON matrix input support.");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
