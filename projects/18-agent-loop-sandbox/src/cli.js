import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, runTasks } from './agent-loop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const options = parseArgs(process.argv.slice(2));

async function main() {
  const taskPath = path.resolve(projectRoot, options.tasks ?? 'samples/tasks.json');
  const jsonPath = path.resolve(projectRoot, options.json ?? 'reports/trace.json');
  const markdownPath = path.resolve(projectRoot, options.markdown ?? 'reports/trace.md');
  const source = JSON.parse(await readFile(taskPath, 'utf8'));
  const tasks = Number.isInteger(options.maxTasks) ? source.tasks.slice(0, options.maxTasks) : source.tasks;
  const report = runTasks(tasks);

  await mkdir(path.dirname(jsonPath), { recursive: true });
  await mkdir(path.dirname(markdownPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(markdownPath, renderMarkdown(report), 'utf8');

  console.log(`Agent loop trace written to ${path.relative(projectRoot, jsonPath)} and ${path.relative(projectRoot, markdownPath)}.`);
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = key === 'max-tasks' ? Number.parseInt(value, 10) : value;
    index += 1;
  }
  return {
    tasks: parsed.tasks,
    json: parsed.json,
    markdown: parsed.markdown,
    maxTasks: parsed['max-tasks']
  };
}

main().catch((error) => {
  console.error(`Agent loop failed: ${error.message}`);
  process.exitCode = 1;
});
