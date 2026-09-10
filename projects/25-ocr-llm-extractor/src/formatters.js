export function formatJson(result) {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function formatMarkdown(result) {
  const { fields, metadata } = result;
  const lines = [
    `# Extraction Report: ${fields.source}`,
    "",
    `- Document type: ${fields.documentType}`,
    `- Confidence: ${fields.confidence}`,
    `- Extractor: ${metadata.extractor}`,
    "",
    "## Key Fields",
    "",
    ...renderObject(fields.ids, "Identifiers"),
    ...renderObject(fields.dates, "Dates"),
    ...renderObject(fields.parties, "Parties"),
    ...renderObject(fields.contacts, "Contacts"),
    ...renderAmounts(fields.amounts),
    ...renderLineItems(fields.lineItems),
    ...renderObject(fields.formFields, "Form Fields"),
    ...renderWarnings(metadata.warnings)
  ];

  return `${lines.join("\n")}\n`;
}

function renderObject(object, title) {
  const entries = Object.entries(object || {});
  if (!entries.length) return [];
  return [`### ${title}`, "", ...entries.map(([key, value]) => `- ${label(key)}: ${value}`), ""];
}

function renderAmounts(amounts) {
  const entries = Object.entries(amounts || {}).filter(([, amount]) => amount);
  if (!entries.length) return [];
  return [
    "### Amounts",
    "",
    ...entries.map(([key, amount]) => `- ${label(key)}: ${amount.currency || ""} ${amount.value}`.replace(/:  /, ": ")),
    ""
  ];
}

function renderLineItems(items) {
  if (!items?.length) return [];
  return [
    "### Line Items",
    "",
    "| Description | Qty | Unit | Amount |",
    "| --- | ---: | ---: | ---: |",
    ...items.map((item) => `| ${item.description} | ${item.quantity} | ${item.unitPrice} | ${item.amount} |`),
    ""
  ];
}

function renderWarnings(warnings) {
  if (!warnings?.length) return [];
  return ["## Warnings", "", ...warnings.map((warning) => `- ${warning}`), ""];
}

function label(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
