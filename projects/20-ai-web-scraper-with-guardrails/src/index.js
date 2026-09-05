import { defaultSources } from "./sources.js";
import { scrapeSources, writeOutputs } from "./scraper.js";

const result = await scrapeSources(defaultSources);
await writeOutputs(result);

const accepted = result.items.length;
const rejected = result.rejected.length;
const blocked = result.blocked.length;

console.log(`Scrape complete: ${accepted} accepted, ${rejected} rejected, ${blocked} blocked.`);
console.log("Wrote reports/scraped-items.json and reports/scrape-report.md");

if (blocked > 0 || rejected > 0) {
  process.exitCode = 1;
}
