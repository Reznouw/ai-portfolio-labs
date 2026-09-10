const CURRENCY_RE = /\b(USD|EUR|PEN|GBP|S\/?|\$)\s*([0-9][0-9,]*(?:\.\d{2})?)/i;

export function extractDocument(ocrText, source = "inline") {
  const lines = normalizeLines(ocrText);
  const text = lines.join("\n");
  const fields = {
    documentType: detectDocumentType(text),
    source,
    ids: extractIds(lines),
    dates: extractDates(lines),
    parties: extractParties(lines),
    contacts: extractContacts(text),
    amounts: extractAmounts(lines),
    lineItems: extractLineItems(lines),
    formFields: extractFormFields(lines)
  };

  fields.confidence = scoreConfidence(fields);
  return {
    fields,
    metadata: {
      extractor: "rules-v1",
      lineCount: lines.length,
      warnings: buildWarnings(fields)
    }
  };
}

export function normalizeLines(ocrText) {
  return ocrText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

function detectDocumentType(text) {
  const upper = text.toUpperCase();
  if (upper.includes("INVOICE") || upper.includes("TOTAL DUE")) return "invoice";
  if (upper.includes("INTAKE FORM") || upper.includes("CONSENT:")) return "form";
  if (upper.includes("RECEIPT") || upper.includes("CASHIER:")) return "receipt";
  return "generic";
}

function extractIds(lines) {
  const ids = {};
  const patterns = [
    ["invoiceNumber", /invoice\s*(?:no|number|#)\s*[:#-]?\s*([A-Z0-9-]+)/i],
    ["formId", /form\s*id\s*[:#-]?\s*([A-Z0-9-]+)/i],
    ["receiptNumber", /receipt\s*#?\s*[:#-]?\s*([A-Z0-9-]+)/i]
  ];

  for (const line of lines) {
    for (const [key, pattern] of patterns) {
      const match = line.match(pattern);
      if (match) ids[key] = match[1];
    }
  }
  return ids;
}

function extractDates(lines) {
  const dates = {};
  const labeledPatterns = [
    ["invoiceDate", /invoice\s*date\s*[:#-]?\s*(.+)$/i],
    ["dueDate", /due\s*date\s*[:#-]?\s*(.+)$/i],
    ["dateOfBirth", /date\s*of\s*birth\s*[:#-]?\s*(.+)$/i],
    ["documentDate", /^date\s*[:#-]?\s*(.+)$/i]
  ];

  for (const line of lines) {
    for (const [key, pattern] of labeledPatterns) {
      const match = line.match(pattern);
      if (match) dates[key] = cleanValue(match[1]);
    }
  }
  return dates;
}

function extractParties(lines) {
  const parties = {};
  const firstTextLine = lines.find((line) => !/^(invoice|receipt|patient intake form)$/i.test(line));
  if (firstTextLine) parties.issuer = firstTextLine;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const patient = line.match(/patient\s*name\s*[:#-]?\s*(.+)$/i);
    const customer = line.match(/customer\s*[:#-]?\s*(.+)$/i);
    const clinic = line.match(/clinic\s*[:#-]?\s*(.+)$/i);
    const billTo = line.match(/^bill\s*to\s*:?$/i);
    if (patient) parties.patient = cleanValue(patient[1]);
    if (customer) parties.customer = cleanValue(customer[1]);
    if (clinic) parties.issuer = cleanValue(clinic[1]);
    if (billTo && lines[i + 1]) parties.billTo = lines[i + 1];
  }
  return parties;
}

function extractContacts(text) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = text.match(/(?:phone|tel|mobile)\s*[:#-]?\s*((?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){7,14}\d)/i);
  const address = text.match(/address\s*[:#-]?\s*(.+)$/im);
  return compactObject({
    email: email?.[0],
    phone: phone?.[1],
    address: address ? cleanValue(address[1]) : undefined
  });
}

function extractAmounts(lines) {
  const amounts = {};
  const labels = [
    ["subtotal", /subtotal\s*[: ]\s*(.+)$/i],
    ["tax", /(?:sales\s*)?tax\s*[: ]\s*(.+)$/i],
    ["total", /(?:total\s*due|total)\s*[: ]\s*(.+)$/i]
  ];

  for (const line of lines) {
    for (const [key, pattern] of labels) {
      const match = line.match(pattern);
      if (match) amounts[key] = parseMoney(match[1]);
    }
  }
  return amounts;
}

function extractLineItems(lines) {
  const items = [];
  const itemPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(?:x\s+)?([0-9]+(?:\.\d{2})?)\s+([0-9]+(?:\.\d{2})?)$/i;

  for (const line of lines) {
    if (/subtotal|tax|total|date|phone|email|address/i.test(line)) continue;
    const match = line.match(itemPattern);
    if (match) {
      items.push({
        description: cleanValue(match[1]),
        quantity: Number(match[2]),
        unitPrice: Number(match[3]),
        amount: Number(match[4])
      });
    }
  }
  return items;
}

function extractFormFields(lines) {
  const fields = {};
  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z ]{2,30})\s*:\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase().replace(/\s+(.)/g, (_, char) => char.toUpperCase());
    fields[key] = cleanValue(match[2]);
  }
  return fields;
}

function parseMoney(value) {
  const match = value.match(CURRENCY_RE);
  if (match) {
    return {
      currency: normalizeCurrency(match[1]),
      value: Number(match[2].replace(/,/g, ""))
    };
  }
  const number = value.match(/[0-9][0-9,]*(?:\.\d{2})?/);
  return number ? { currency: null, value: Number(number[0].replace(/,/g, "")) } : null;
}

function normalizeCurrency(currency) {
  if (currency === "$") return "USD";
  if (/^s\/?$/i.test(currency)) return "PEN";
  return currency.toUpperCase();
}

function scoreConfidence(fields) {
  const checks = [
    Boolean(Object.keys(fields.ids).length),
    Boolean(Object.keys(fields.dates).length),
    Boolean(Object.keys(fields.parties).length),
    Boolean(fields.amounts.total || fields.contacts.email || fields.contacts.phone),
    fields.lineItems.length > 0 || Object.keys(fields.formFields).length > 0
  ];
  return Number((checks.filter(Boolean).length / checks.length).toFixed(2));
}

function buildWarnings(fields) {
  const warnings = [];
  if (!Object.keys(fields.ids).length) warnings.push("No document identifier found.");
  if (!Object.keys(fields.dates).length) warnings.push("No date found.");
  if (!fields.amounts.total && fields.documentType !== "form") warnings.push("No total amount found.");
  return warnings;
}

function cleanValue(value) {
  return value.trim().replace(/[.;,]$/, "");
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== ""));
}
