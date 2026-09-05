# AI Web Scraper With Guardrails

Safe, dependency-free Node.js scraper that reads only allowlisted local HTML fixtures or approved HTTPS URLs. It extracts structured records, validates the expected schema, blocks disallowed domains, and writes both JSON output and a human-readable report.

## Guardrails

- Local reads are limited to files inside `fixtures/`.
- Remote reads must use `https://` and an approved hostname from `src/sources.js`.
- Extracted record links must also belong to each source's allowed content domains.
- Records must match the expected schema: `title`, `url`, `summary`, and `publishedAt`.
- Schema errors and blocked inputs are reported instead of silently accepted.
- No external packages are used.

## Run

```bash
npm run scrape
```

Outputs:

- `reports/scraped-items.json`
- `reports/scrape-report.md`

## Verify

```bash
npm run verify
```

The verification command checks local fixture scraping, schema validation, directory traversal blocking, and disallowed URL blocking.

## Source Format

HTML records are expected to use `data-record="article"` containers with these fields:

```html
<article data-record="article">
  <h2 data-field="title">Example title</h2>
  <a data-field="url" href="https://example.com/story">Read</a>
  <p data-field="summary">Short summary.</p>
  <time data-field="publishedAt" datetime="2026-08-15">Aug 15, 2026</time>
</article>
```
