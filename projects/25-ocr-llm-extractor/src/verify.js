#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { extractDocument } from "./extractor.js";
import { formatJson, formatMarkdown } from "./formatters.js";

const fixtures = [
  {
    file: "invoice-001.txt",
    expect: (fields) => fields.documentType === "invoice" && fields.ids.invoiceNumber === "INV-2026-0142" && fields.amounts.total?.value === 1327.5
  },
  {
    file: "form-intake-001.txt",
    expect: (fields) => fields.documentType === "form" && fields.parties.patient === "Maria Torres" && fields.contacts.email === "maria.torres@example.com"
  },
  {
    file: "receipt-001.txt",
    expect: (fields) => fields.documentType === "receipt" && fields.ids.receiptNumber === "R-44912" && fields.amounts.total?.value === 31.1
  }
];

await mkdir("reports", { recursive: true });

const failures = [];
for (const fixture of fixtures) {
  const fixturePath = join("fixtures", "data", fixture.file);
  const text = await readFile(fixturePath, "utf8");
  const result = extractDocument(text, fixturePath);
  const baseName = fixture.file.replace(/\.txt$/, "");
  await writeFile(join("reports", `${baseName}.json`), formatJson(result), "utf8");
  await writeFile(join("reports", `${baseName}.md`), formatMarkdown(result), "utf8");

  if (!fixture.expect(result.fields)) {
    failures.push(`${fixture.file} did not match expected extraction fields.`);
  }
}

if (failures.length) {
  process.stderr.write(`Verification failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(`Verification passed for ${fixtures.length} fixtures. Reports written to reports/.\n`);
