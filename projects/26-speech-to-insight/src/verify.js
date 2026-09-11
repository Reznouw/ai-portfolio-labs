import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const commands = [
  ["node", ["src/cli.js", "--fixture", "data/fixtures/customer-call.json", "--json", "reports/customer-call.json", "--markdown", "reports/customer-call.md"]],
  ["node", ["src/cli.js", "--fixture", "data/fixtures/team-standup.json", "--json", "reports/team-standup.json", "--markdown", "reports/team-standup.md"]]
];

for (const [command, args] of commands) {
  await run(command, args);
}

for (const reportPath of ["reports/customer-call.json", "reports/team-standup.json"]) {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  assert(report.summary && report.summary.length > 40, `${reportPath} needs a useful summary.`);
  assert(report.sentiment && report.sentiment.label, `${reportPath} needs sentiment.`);
  assert(Array.isArray(report.actionItems), `${reportPath} needs actionItems array.`);
  assert(report.actionItems.length > 0, `${reportPath} should extract at least one action item.`);
  assert(report.quality && typeof report.quality.averageConfidence === "number", `${reportPath} needs quality metrics.`);
}

for (const requiredPath of [
  "reports/customer-call.md",
  "reports/team-standup.md",
  "src/frontend/index.html",
  "src/frontend/styles.css",
  "src/frontend/app.js"
]) {
  await access(requiredPath);
}

console.log("Verification passed: reports regenerated, schema validated, frontend files present.");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
