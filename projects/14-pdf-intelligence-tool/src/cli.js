import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const samplesDir = path.join(projectRoot, 'samples');
const reportsDir = path.join(projectRoot, 'reports');

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35 && !sentence.startsWith('|'));
}

function extractLabel(text, label) {
  const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'));
  return match ? match[1].trim() : '';
}

function extractEntities(text) {
  const dates = unique(text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []);
  const money = unique(text.match(/\$\d+(?:\.\d{2})?/g) ?? []);
  const percentages = unique(text.match(/\b\d+(?:\.\d+)?\s*percent\b/gi) ?? []);
  const emails = unique(text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? []);
  const references = unique(text.match(/\b(?:INV|PO|MEMO)-[A-Z0-9-]+\b/g) ?? []);
  const organizations = unique([
    ...Array.from(text.matchAll(/\b([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*(?:\s(?:LLC|Inc|Co|Labs|Team)))\b/g), (match) => match[1]),
    extractLabel(text, 'Vendor'),
    extractLabel(text, 'Owner')
  ]);

  return { dates, money, percentages, emails, references, organizations };
}

function extractTables(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 3);

  if (rows.length === 0) return [];

  const [headers, ...dataRows] = rows;
  return dataRows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}

function extractSignals(text) {
  const signalWords = ['audit', 'compliance', 'due', 'late', 'payment', 'renewal', 'risk'];
  const lowerText = text.toLowerCase();
  return signalWords.filter((word) => lowerText.includes(word));
}

function analyzeDocument(fileName, text) {
  const sentences = splitSentences(text);
  const title = extractLabel(text, 'Document') || fileName;

  return {
    fileName,
    title,
    reference: extractLabel(text, 'Reference'),
    summary: sentences.slice(0, 2).join(' '),
    entities: extractEntities(text),
    tableRows: extractTables(text),
    signals: extractSignals(text),
    stats: {
      characters: text.length,
      words: text.split(/\s+/).filter(Boolean).length
    }
  };
}

function buildMarkdown(report) {
  const lines = [
    '# Document Intelligence Report',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    `Documents analyzed: ${report.documents.length}`,
    `Table-like rows extracted: ${report.totals.tableRows}`,
    '',
    '## Document Summaries',
    ''
  ];

  for (const document of report.documents) {
    lines.push(`### ${document.title}`);
    lines.push('');
    lines.push(`- File: ${document.fileName}`);
    lines.push(`- Reference: ${document.reference || 'not found'}`);
    lines.push(`- Summary: ${document.summary}`);
    lines.push(`- Signals: ${document.signals.join(', ') || 'none'}`);
    lines.push('');
    lines.push('Entities:');
    lines.push('');
    lines.push(`- Dates: ${document.entities.dates.join(', ') || 'none'}`);
    lines.push(`- Money: ${document.entities.money.join(', ') || 'none'}`);
    lines.push(`- Percentages: ${document.entities.percentages.join(', ') || 'none'}`);
    lines.push(`- Emails: ${document.entities.emails.join(', ') || 'none'}`);
    lines.push(`- Organizations: ${document.entities.organizations.join(', ') || 'none'}`);
    lines.push('');
    lines.push('Table-like rows:');
    lines.push('');

    if (document.tableRows.length === 0) {
      lines.push('- none');
    } else {
      for (const row of document.tableRows) {
        lines.push(`- ${Object.entries(row).map(([key, value]) => `${key}: ${value}`).join('; ')}`);
      }
    }

    lines.push('');
  }

  lines.push('## Real PDF Extraction Note');
  lines.push('');
  lines.push('This demo starts from text files. A production pipeline would add PDF parsing or OCR before this analyzer and pass the extracted text into the same reporting step.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function main() {
  const files = (await readdir(samplesDir)).filter((file) => file.endsWith('.txt')).sort();
  const documents = [];

  for (const file of files) {
    const text = await readFile(path.join(samplesDir, file), 'utf8');
    documents.push(analyzeDocument(file, text));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'simulated extracted PDF text files',
    documents,
    totals: {
      documents: documents.length,
      tableRows: documents.reduce((sum, document) => sum + document.tableRows.length, 0),
      entities: documents.reduce((sum, document) => sum + Object.values(document.entities).reduce((innerSum, values) => innerSum + values.length, 0), 0)
    }
  };

  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(reportsDir, 'document-intelligence.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(reportsDir, 'document-intelligence.md'), buildMarkdown(report));

  console.log(`Analyzed ${report.totals.documents} documents.`);
  console.log(`Extracted ${report.totals.entities} entities and ${report.totals.tableRows} table-like rows.`);
  console.log('Wrote reports/document-intelligence.json and reports/document-intelligence.md.');
}

main().catch((error) => {
  console.error(`Analysis failed: ${error.message}`);
  process.exitCode = 1;
});
