import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const rawPath = path.join(projectRoot, 'data', 'raw', 'customers.csv');
const cleanDir = path.join(projectRoot, 'data', 'clean');
const reportDir = path.join(projectRoot, 'reports');
const cleanPath = path.join(cleanDir, 'customers_clean.csv');
const reportJsonPath = path.join(reportDir, 'cleaning-report.json');
const reportMdPath = path.join(reportDir, 'cleaning-report.md');

const PLAN_MAP = new Map([
  ['starter', 'Basic'],
  ['basic', 'Basic'],
  ['pro', 'Pro'],
  ['professional', 'Pro'],
  ['enterprise', 'Enterprise'],
  ['ent', 'Enterprise'],
  ['free', 'Free']
]);

const STATUS_MAP = new Map([
  ['active', 'active'],
  ['actve', 'active'],
  ['inactive', 'inactive'],
  ['churned', 'churned']
]);

const SOURCE_MAP = new Map([
  ['web', 'web'],
  ['referral', 'referral'],
  ['ads', 'ads'],
  ['partner', 'partner'],
  ['organic', 'organic']
]);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function toCsv(rows, headers) {
  const body = rows.map((row) => headers.map((header) => row[header]).join(','));
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

function titleCase(value) {
  const trimmed = value.trim().toLowerCase();
  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : 'Unknown';
}

function parseOptionalNumber(value) {
  const trimmed = value.trim();
  return trimmed === '' ? NaN : Number(trimmed);
}

function cleanDataset(rows) {
  const validAges = rows
    .map((row) => parseOptionalNumber(row.age))
    .filter((age) => Number.isFinite(age) && age >= 18 && age <= 100);
  const medianAge = Math.round(median(validAges));

  const nonNegativeSpend = rows
    .map((row) => parseOptionalNumber(row.annual_spend))
    .filter((spend) => Number.isFinite(spend) && spend >= 0)
    .sort((a, b) => a - b);
  const q1 = percentile(nonNegativeSpend, 0.25);
  const q3 = percentile(nonNegativeSpend, 0.75);
  const outlierCap = Math.round(q3 + 1.5 * (q3 - q1));

  const seenEmails = new Set();
  const stats = {
    rawRows: rows.length,
    cleanRows: 0,
    duplicateRowsRemoved: 0,
    missingAgesFilled: 0,
    underageAgesFilled: 0,
    missingEmailsMarked: 0,
    malformedEmailsMarked: 0,
    missingSourcesFilled: 0,
    unknownPlans: 0,
    unknownStatuses: 0,
    negativeSpendClamped: 0,
    outliersCapped: 0,
    medianAge,
    outlierCap
  };

  const cleaned = [];

  for (const rawRow of rows) {
    const row = Object.fromEntries(Object.entries(rawRow).map(([key, value]) => [key, value.trim()]));
    const normalizedEmail = row.email.toLowerCase();

    if (normalizedEmail && seenEmails.has(normalizedEmail)) {
      stats.duplicateRowsRemoved += 1;
      continue;
    }
    if (normalizedEmail) seenEmails.add(normalizedEmail);

    let age = parseOptionalNumber(row.age);
    if (!Number.isFinite(age)) {
      age = medianAge;
      stats.missingAgesFilled += 1;
    } else if (age < 18) {
      age = medianAge;
      stats.underageAgesFilled += 1;
    }

    let email = normalizedEmail;
    if (!email) {
      email = `missing-email-${row.customer_id}@invalid.local`;
      stats.missingEmailsMarked += 1;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      email = `malformed-email-${row.customer_id}@invalid.local`;
      stats.malformedEmailsMarked += 1;
    }

    const planKey = row.plan.toLowerCase();
    const plan = PLAN_MAP.get(planKey) ?? 'Unknown';
    if (plan === 'Unknown') stats.unknownPlans += 1;

    const statusKey = row.status.toLowerCase();
    const status = STATUS_MAP.get(statusKey) ?? 'needs_review';
    if (status === 'needs_review') stats.unknownStatuses += 1;

    const sourceKey = row.signup_source.toLowerCase();
    let signupSource = SOURCE_MAP.get(sourceKey);
    if (!signupSource) {
      signupSource = sourceKey ? 'other' : 'unknown';
      stats.missingSourcesFilled += sourceKey ? 0 : 1;
    }

    let annualSpend = parseOptionalNumber(row.annual_spend);
    if (!Number.isFinite(annualSpend)) annualSpend = 0;
    if (annualSpend < 0) {
      annualSpend = 0;
      stats.negativeSpendClamped += 1;
    }
    if (annualSpend > outlierCap) {
      annualSpend = outlierCap;
      stats.outliersCapped += 1;
    }

    cleaned.push({
      customer_id: row.customer_id,
      name: row.name,
      email,
      age: String(age),
      city: titleCase(row.city),
      plan,
      status,
      signup_source: signupSource,
      annual_spend: String(Math.round(annualSpend))
    });
  }

  cleaned.sort((a, b) => Number(a.customer_id) - Number(b.customer_id));
  stats.cleanRows = cleaned.length;

  return { cleaned, stats };
}

function buildReport(stats) {
  const plan = [
    'Trim whitespace in every cell.',
    'Remove duplicate customers by normalized email, keeping the first occurrence.',
    'Fill missing or invalid age values with the median valid age.',
    'Normalize category drift in plan, status, signup source, and city fields.',
    'Replace missing or malformed email addresses with invalid.local placeholders.',
    'Clamp negative spend to zero and cap high spend outliers with the IQR upper fence.'
  ];

  return {
    generatedBy: 'dataset-cleaner-agent',
    input: 'data/raw/customers.csv',
    outputs: ['data/clean/customers_clean.csv', 'reports/cleaning-report.md', 'reports/cleaning-report.json'],
    plan,
    stats
  };
}

function reportToMarkdown(report) {
  const stats = report.stats;
  return `# Cleaning Report

Generated by: ${report.generatedBy}

## Input

- ${report.input}

## Outputs

${report.outputs.map((output) => `- ${output}`).join('\n')}

## Deterministic Cleaning Plan

${report.plan.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Results

- Raw rows: ${stats.rawRows}
- Clean rows: ${stats.cleanRows}
- Duplicate rows removed: ${stats.duplicateRowsRemoved}
- Missing ages filled: ${stats.missingAgesFilled}
- Underage ages replaced: ${stats.underageAgesFilled}
- Missing emails marked: ${stats.missingEmailsMarked}
- Malformed emails marked: ${stats.malformedEmailsMarked}
- Missing sources filled: ${stats.missingSourcesFilled}
- Unknown plans marked: ${stats.unknownPlans}
- Unknown statuses marked for review: ${stats.unknownStatuses}
- Negative spend values clamped: ${stats.negativeSpendClamped}
- Spend outliers capped: ${stats.outliersCapped}
- Median age used: ${stats.medianAge}
- IQR spend outlier cap: ${stats.outlierCap}
`;
}

async function main() {
  const raw = await readFile(rawPath, 'utf8');
  const rows = parseCsv(raw);
  const headers = Object.keys(rows[0]);
  const { cleaned, stats } = cleanDataset(rows);
  const report = buildReport(stats);

  await mkdir(cleanDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });
  await writeFile(cleanPath, toCsv(cleaned, headers), 'utf8');
  await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(reportMdPath, reportToMarkdown(report), 'utf8');

  console.log(`Cleaned ${stats.rawRows} raw rows into ${stats.cleanRows} rows.`);
  console.log(`Wrote ${path.relative(projectRoot, cleanPath)}`);
  console.log(`Wrote ${path.relative(projectRoot, reportMdPath)}`);
  console.log(`Wrote ${path.relative(projectRoot, reportJsonPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
