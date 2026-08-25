import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const cleanCsv = await readFile(path.join(projectRoot, 'data', 'clean', 'customers_clean.csv'), 'utf8');
  const reportJson = JSON.parse(await readFile(path.join(projectRoot, 'reports', 'cleaning-report.json'), 'utf8'));
  const reportMd = await readFile(path.join(projectRoot, 'reports', 'cleaning-report.md'), 'utf8');
  const rows = parseCsv(cleanCsv);

  assert(rows.length === 9, `expected 9 cleaned rows, found ${rows.length}`);
  assert(reportJson.stats.rawRows === 10, 'expected report rawRows to be 10');
  assert(reportJson.stats.duplicateRowsRemoved === 1, 'expected one duplicate removal');
  assert(reportJson.stats.missingAgesFilled === 1, 'expected one missing age fill');
  assert(reportJson.stats.underageAgesFilled === 1, 'expected one underage replacement');
  assert(reportJson.stats.outliersCapped === 2, 'expected two capped outliers');
  assert(reportMd.includes('## Deterministic Cleaning Plan'), 'markdown report missing plan section');

  const emails = rows.map((row) => row.email);
  assert(new Set(emails).size === emails.length, 'expected unique emails after cleaning');
  assert(rows.every((row) => ['Basic', 'Pro', 'Enterprise', 'Free', 'Unknown'].includes(row.plan)), 'found unnormalized plan');
  assert(rows.every((row) => ['active', 'inactive', 'churned', 'needs_review'].includes(row.status)), 'found unnormalized status');
  assert(rows.every((row) => Number(row.age) >= 18), 'found underage or invalid age');
  assert(rows.every((row) => Number(row.annual_spend) >= 0), 'found negative annual spend');

  console.log('Verification passed. Outputs are present and deterministic checks succeeded.');
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
