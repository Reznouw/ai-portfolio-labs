import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const jsonPath = path.join(projectRoot, 'reports', 'research-brief.json');
  const mdPath = path.join(projectRoot, 'reports', 'research-brief.md');
  const report = JSON.parse(await readFile(jsonPath, 'utf8'));
  const markdown = await readFile(mdPath, 'utf8');

  assert(report.topic.includes('cooling hubs'), 'expected default cooling hubs topic');
  assert(report.recommendation.includes('Deploy cooling hubs'), 'recommendation missing deploy guidance');
  assert(report.citations.length === 5, `expected five citations, found ${report.citations.length}`);
  assert(report.citations.some((citation) => citation.id === 'SRC-001'), 'expected SRC-001 citation');
  assert(report.citations.some((citation) => citation.id === 'SRC-003'), 'expected SRC-003 citation');
  assert(report.criticNotes.length >= 3, 'expected at least three critic notes');
  assert(report.agentTrace.map((entry) => entry.agent).join(',') === 'researcher,critic,writer', 'agent trace order mismatch');
  assert(report.debug.selectedEvidence[0].id === 'SRC-001', 'expected SRC-001 as top ranked evidence');
  assert(markdown.includes('## Critic Notes'), 'markdown missing critic notes section');
  assert(markdown.includes('[SRC-001]'), 'markdown missing SRC-001 citation');
  assert(markdown.includes('## Agent Trace'), 'markdown missing agent trace section');

  console.log('Verification passed. Research brief, citations, critic notes, and agent trace are deterministic.');
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
