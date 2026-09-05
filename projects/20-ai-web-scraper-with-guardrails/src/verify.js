import assert from "node:assert/strict";
import { scrapeSources, writeOutputs } from "./scraper.js";

const validSource = {
  id: "verify-valid",
  type: "fixture",
  path: "ai-news.html",
  allowedContentDomains: ["example.com", "research.example.com"]
};

const malformedSource = {
  id: "verify-malformed",
  type: "fixture",
  path: "malformed.html",
  allowedContentDomains: ["example.com"]
};

const traversalSource = {
  id: "verify-traversal",
  type: "fixture",
  path: "../README.md",
  allowedContentDomains: ["example.com"]
};

const blockedUrlSource = {
  id: "verify-blocked-url",
  type: "url",
  url: "https://not-allowed.invalid/page",
  allowedContentDomains: ["not-allowed.invalid"]
};

const result = await scrapeSources([
  validSource,
  malformedSource,
  traversalSource,
  blockedUrlSource
]);

assert.equal(result.items.length, 3, "valid fixture should produce three accepted records");
assert.equal(result.rejected.length, 3, "malformed fixture should produce three rejected records");
assert.equal(result.blocked.length, 2, "unsafe fixture path and unapproved URL should be blocked");
assert.ok(
  result.blocked.some((blocked) => blocked.sourceId === "verify-traversal"),
  "directory traversal attempt should be blocked"
);
assert.ok(
  result.blocked.some((blocked) => blocked.sourceId === "verify-blocked-url"),
  "unapproved remote domain should be blocked"
);

await writeOutputs(result);

console.log("Verification passed: fixture scrape, schema rejection, traversal block, and domain block all worked.");
