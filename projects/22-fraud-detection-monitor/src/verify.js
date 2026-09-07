import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMonitor } from "./monitor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function exists(relativePath) {
  await access(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verify() {
  const requiredFiles = [
    "README.md",
    "CONTEXT.md",
    "package.json",
    "data/reference_transactions.csv",
    "data/current_transactions.csv",
    "src/monitor.js",
    "src/verify.js",
    "src/server.js",
    "src/index.html",
    "src/styles.css",
    "src/app.js"
  ];

  await Promise.all(requiredFiles.map(exists));
  const report = await runMonitor();
  await exists("reports/report.json");
  await exists("reports/report.md");

  assert(report.scoredTransactions.length === 16, "expected 16 current transactions");
  assert(report.metrics.precision >= 0.8, "precision below expected demo threshold");
  assert(report.metrics.recall >= 0.8, "recall below expected demo threshold");
  assert(report.metrics.f1 >= 0.8, "f1 below expected demo threshold");
  assert(report.drift.checks.length === 4, "expected four drift checks");
  assert(["low", "medium", "high"].includes(report.drift.summary), "invalid drift severity");

  const markdown = await readFile(path.join(root, "reports/report.md"), "utf8");
  assert(markdown.includes("Fraud Detection Monitor Report"), "markdown report missing title");
  assert(markdown.includes("Scored Current Transactions"), "markdown report missing scored table");

  console.log("Verification passed");
  console.log(`precision=${report.metrics.precision} recall=${report.metrics.recall} f1=${report.metrics.f1} drift=${report.drift.summary}`);
}

verify().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exit(1);
});
