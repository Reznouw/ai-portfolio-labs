import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runResearchTeam } from './agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_TOPIC = 'Should the city deploy neighborhood cooling hubs during heat waves?';

async function main() {
  const topic = process.argv.slice(2).join(' ').trim() || DEFAULT_TOPIC;
  const corpusPath = path.join(projectRoot, 'data', 'corpus.json');
  const reportsDir = path.join(projectRoot, 'reports');
  const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
  const result = runResearchTeam(topic, corpus);

  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(reportsDir, 'research-brief.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await writeFile(path.join(reportsDir, 'research-brief.md'), `${result.markdown}\n`, 'utf8');

  console.log(`Research brief written for: ${topic}`);
  console.log(`Citations: ${result.citations.map((citation) => citation.id).join(', ')}`);
  console.log(`Critic notes: ${result.criticNotes.length}`);
}

main().catch((error) => {
  console.error(`Research team failed: ${error.message}`);
  process.exitCode = 1;
});
