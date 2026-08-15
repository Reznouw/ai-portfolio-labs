import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { summarizeItem } from "./summarize.js";

const ITEMS_PER_SOURCE = Number(process.env.ITEMS_PER_SOURCE || 8);
const root = process.cwd();

async function main() {
  const sources = await Promise.allSettled([
    fetchHackerNews(),
    fetchArxiv(),
    fetchTechCrunch()
  ]);

  const rawItems = sources.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const uniqueItems = dedupeByUrl(rawItems).slice(0, ITEMS_PER_SOURCE * 3);
  const items = [];

  for (const item of uniqueItems) {
    const ai = await summarizeItem(item);
    items.push({ ...item, ai });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    itemCount: items.length,
    sources: countBy(items, "source"),
    items
  };

  mkdirSync(path.join(root, "data"), { recursive: true });
  writeFileSync(path.join(root, "data", "news.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Saved ${items.length} items to data/news.json`);
}

async function fetchHackerNews() {
  const url = "https://hn.algolia.com/api/v1/search_by_date?query=artificial%20intelligence&tags=story";
  const data = await fetchJson(url);

  return data.hits.slice(0, ITEMS_PER_SOURCE).map((hit) => ({
    source: "Hacker News",
    title: hit.title || hit.story_title,
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    publishedAt: hit.created_at,
    description: `HN story with ${hit.points || 0} points and ${hit.num_comments || 0} comments.`,
    tags: tagText(hit.title || "")
  })).filter((item) => item.title && item.url);
}

async function fetchArxiv() {
  const url = "https://export.arxiv.org/api/query?search_query=all:artificial%20intelligence&sortBy=submittedDate&sortOrder=descending&max_results=8";
  const xml = await fetchText(url);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);

  return entries.slice(0, ITEMS_PER_SOURCE).map((entry) => ({
    source: "arXiv",
    title: cleanXml(readTag(entry, "title")),
    url: readLink(entry) || cleanXml(readTag(entry, "id")),
    publishedAt: cleanXml(readTag(entry, "published")),
    description: cleanXml(readTag(entry, "summary")),
    tags: tagText(`${readTag(entry, "title")} ${readTag(entry, "summary")}`)
  })).filter((item) => item.title && item.url);
}

async function fetchTechCrunch() {
  const xml = await fetchText("https://techcrunch.com/category/artificial-intelligence/feed/");
  const entries = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);

  return entries.slice(0, ITEMS_PER_SOURCE).map((entry) => ({
    source: "TechCrunch",
    title: cleanXml(readTag(entry, "title")),
    url: cleanXml(readTag(entry, "link")),
    publishedAt: cleanXml(readTag(entry, "pubDate")),
    description: cleanXml(readTag(entry, "description")),
    tags: tagText(`${readTag(entry, "title")} ${readTag(entry, "description")}`)
  })).filter((item) => item.title && item.url);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "ai-news-radar/0.1" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "ai-news-radar/0.1" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1] || "";
}

function readLink(xml) {
  const match = xml.match(/<link[^>]+href="([^"]+)"/);
  return match?.[1] || "";
}

function cleanXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tagText(text) {
  const lower = text.toLowerCase();
  const tags = [];
  if (lower.includes("agent")) tags.push("agents");
  if (lower.includes("rag") || lower.includes("retrieval")) tags.push("rag");
  if (lower.includes("model") || lower.includes("llm")) tags.push("llm");
  if (lower.includes("safety") || lower.includes("security")) tags.push("safety");
  if (lower.includes("open source")) tags.push("open-source");
  return tags.length ? tags : ["ai"];
}

function dedupeByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url.replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    counts[item[key]] = (counts[item[key]] || 0) + 1;
    return counts;
  }, {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
