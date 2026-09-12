import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateSamples, validateGuardrailResult } from "./guardrails.js";
import { loadSamples, writeReports } from "./cli.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function verify() {
  const samples = await loadSamples();
  const evaluations = evaluateSamples(samples);
  const failures = [];

  for (const { sample, result } of evaluations) {
    if (result.decision !== sample.expectedDecision) {
      failures.push(`${sample.id}: expected ${sample.expectedDecision}, got ${result.decision}`);
    }
    for (const category of sample.expectedCategories ?? []) {
      if (!result.categories.includes(category)) {
        failures.push(`${sample.id}: missing category ${category}`);
      }
    }
    const schema = validateGuardrailResult(result);
    if (!schema.passed) {
      failures.push(`${sample.id}: ${schema.message}`);
    }
  }

  await writeReports(evaluations);
  await assertFile("reports/latest.json", failures);
  await assertFile("reports/latest.md", failures);
  await assertFile("assets/demo.png", failures);

  const reportText = await readFile(join(ROOT, "reports", "latest.json"), "utf8");
  const report = JSON.parse(reportText);
  if (!report.summary?.deterministic) {
    failures.push("reports/latest.json: deterministic summary flag missing");
  }

  if (failures.length > 0) {
    console.error("Verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    return 1;
  }

  console.log(`Verification passed: ${evaluations.length} samples, schema checks, reports, and demo asset.`);
  return 0;
}

async function assertFile(relativePath, failures) {
  try {
    await access(join(ROOT, relativePath));
  } catch {
    failures.push(`${relativePath}: file missing`);
  }
}

verify().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
