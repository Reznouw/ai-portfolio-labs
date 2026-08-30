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
  const reportJson = JSON.parse(await readFile(path.join(projectRoot, 'reports', 'document-intelligence.json'), 'utf8'));
  const reportMd = await readFile(path.join(projectRoot, 'reports', 'document-intelligence.md'), 'utf8');

  assert(reportJson.totals.documents === 2, 'expected two sample documents');
  assert(reportJson.totals.tableRows === 6, `expected six table-like rows, found ${reportJson.totals.tableRows}`);
  assert(reportJson.documents.some((document) => document.reference === 'INV-2026-0142'), 'invoice reference missing');
  assert(reportJson.documents.some((document) => document.reference === 'MEMO-88-A'), 'memo reference missing');
  assert(reportJson.documents.some((document) => document.entities.money.includes('$1567.08')), 'invoice total missing');
  assert(reportJson.documents.some((document) => document.entities.emails.includes('compliance@artesanal.example')), 'compliance email missing');
  assert(reportJson.documents.every((document) => document.summary.length > 20), 'expected non-empty summaries');
  assert(reportMd.includes('## Document Summaries'), 'markdown report missing summaries section');
  assert(reportMd.includes('## Real PDF Extraction Note'), 'markdown report missing PDF extraction note');

  console.log('Verification passed. Reports are present and deterministic checks succeeded.');
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
