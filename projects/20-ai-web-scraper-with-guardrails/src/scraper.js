import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approvedRemoteHosts } from "./sources.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const fixturesDir = path.join(projectRoot, "fixtures");
const reportsDir = path.join(projectRoot, "reports");

export async function scrapeSources(sources) {
  const result = {
    generatedAt: new Date().toISOString(),
    items: [],
    rejected: [],
    blocked: []
  };

  for (const source of sources) {
    try {
      const html = await loadSource(source);
      const records = extractRecords(html, source);

      for (const record of records) {
        const validation = validateRecord(record, source);
        if (validation.ok) {
          result.items.push(record);
        } else {
          result.rejected.push({ sourceId: source.id, record, errors: validation.errors });
        }
      }
    } catch (error) {
      result.blocked.push({ sourceId: source.id, reason: error.message });
    }
  }

  return result;
}

export async function writeOutputs(result) {
  await mkdir(reportsDir, { recursive: true });
  await writeFile(
    path.join(reportsDir, "scraped-items.json"),
    `${JSON.stringify({ generatedAt: result.generatedAt, items: result.items }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(path.join(reportsDir, "scrape-report.md"), renderReport(result), "utf8");
}

export async function loadSource(source) {
  if (source.type === "fixture") {
    return readFixture(source.path);
  }

  if (source.type === "url") {
    return fetchApprovedUrl(source.url);
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

export async function readFixture(relativePath) {
  const target = path.resolve(fixturesDir, relativePath);
  const relative = path.relative(fixturesDir, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Blocked fixture path outside fixtures directory");
  }

  if (path.extname(target) !== ".html") {
    throw new Error("Blocked fixture because only .html files are allowed");
  }

  return readFile(target, "utf8");
}

export async function fetchApprovedUrl(rawUrl) {
  const url = new URL(rawUrl);

  if (url.protocol !== "https:") {
    throw new Error("Blocked remote source because only HTTPS is allowed");
  }

  if (!approvedRemoteHosts.has(url.hostname)) {
    throw new Error(`Blocked remote source domain: ${url.hostname}`);
  }

  const response = await fetch(url, {
    headers: { "user-agent": "guarded-ai-web-scraper/0.1" }
  });

  if (!response.ok) {
    throw new Error(`Remote source returned HTTP ${response.status}`);
  }

  return response.text();
}

export function extractRecords(html, source) {
  const blocks = html.match(/<article\b[^>]*data-record=["']article["'][\s\S]*?<\/article>/gi) ?? [];

  return blocks.map((block, index) => ({
    id: `${source.id}-${index + 1}`,
    sourceId: source.id,
    title: cleanText(readTaggedText(block, "title")),
    url: readLink(block),
    summary: cleanText(readTaggedText(block, "summary")),
    publishedAt: readTime(block)
  }));
}

export function validateRecord(record, source) {
  const errors = [];

  if (!record.title || record.title.length < 5) {
    errors.push("title must contain at least 5 characters");
  }

  if (!record.summary || record.summary.length < 20) {
    errors.push("summary must contain at least 20 characters");
  }

  try {
    const url = new URL(record.url);
    if (url.protocol !== "https:") {
      errors.push("url must use HTTPS");
    }

    const allowedDomains = new Set(source.allowedContentDomains ?? []);
    if (allowedDomains.size > 0 && !allowedDomains.has(url.hostname)) {
      errors.push(`url domain is not allowlisted: ${url.hostname}`);
    }
  } catch {
    errors.push("url must be a valid absolute URL");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.publishedAt)) {
    errors.push("publishedAt must use YYYY-MM-DD format");
  }

  return { ok: errors.length === 0, errors };
}

export function renderReport(result) {
  const lines = [
    "# Scrape Report",
    "",
    `Generated: ${result.generatedAt}`,
    `Accepted records: ${result.items.length}`,
    `Rejected records: ${result.rejected.length}`,
    `Blocked sources: ${result.blocked.length}`,
    "",
    "## Accepted",
    ""
  ];

  if (result.items.length === 0) {
    lines.push("- None");
  } else {
    for (const item of result.items) {
      lines.push(`- ${item.title} (${item.url})`);
    }
  }

  lines.push("", "## Rejected", "");
  if (result.rejected.length === 0) {
    lines.push("- None");
  } else {
    for (const rejected of result.rejected) {
      lines.push(`- ${rejected.sourceId}: ${rejected.errors.join("; ")}`);
    }
  }

  lines.push("", "## Blocked", "");
  if (result.blocked.length === 0) {
    lines.push("- None");
  } else {
    for (const blocked of result.blocked) {
      lines.push(`- ${blocked.sourceId}: ${blocked.reason}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function readTaggedText(block, field) {
  const pattern = new RegExp(`<[^>]+data-field=["']${field}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i");
  return block.match(pattern)?.[1] ?? "";
}

function readLink(block) {
  const match = block.match(/<a\b[^>]*data-field=["']url["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  return decodeHtml(match?.[1] ?? "");
}

function readTime(block) {
  const match = block.match(/<time\b[^>]*data-field=["']publishedAt["'][^>]*datetime=["']([^"']+)["'][^>]*>/i);
  return cleanText(match?.[1] ?? "");
}

function cleanText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
