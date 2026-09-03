import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTasks } from './agent-loop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const reportJson = JSON.parse(await readFile(path.join(projectRoot, 'reports', 'trace.json'), 'utf8'));
  const reportMd = await readFile(path.join(projectRoot, 'reports', 'trace.md'), 'utf8');
  const sample = JSON.parse(await readFile(path.join(projectRoot, 'samples', 'tasks.json'), 'utf8'));
  const rerun = runTasks(sample.tasks);

  assert(JSON.stringify(reportJson) === JSON.stringify(rerun), 'report is not deterministic');
  assert(reportJson.taskCount === 3, 'expected three sample tasks');
  assert(reportJson.tasks[0].stopReason === 'success', 'inventory-cleanup should converge');
  assert(reportJson.tasks[0].iterations.length === 4, 'inventory-cleanup should need four iterations');
  assert(reportJson.tasks[1].passed === true, 'shipping-priority should pass');
  assert(reportJson.tasks[2].stopReason === 'budget_exhausted', 'underfunded-cleanup should stop on budget');
  assert(reportJson.tasks.every((task) => task.iterations.length <= task.controls.maxIterations), 'max iterations exceeded');
  assert(reportJson.tasks.every((task) => task.spent <= task.controls.budget), 'budget exceeded');
  assert(reportJson.tasks.every((task) => task.iterations.every((iteration) => iteration.plan && iteration.execute && iteration.evaluate)), 'missing trace phases');
  assert(reportMd.includes('# Agent Loop Trace'), 'Markdown report missing title');
  assert(reportMd.includes('## Controls'), 'Markdown report missing controls');
  assert(reportMd.includes('budget_exhausted'), 'Markdown report missing budget stop');

  console.log('Verification passed. Agent loop reports are deterministic and guardrails held.');
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
