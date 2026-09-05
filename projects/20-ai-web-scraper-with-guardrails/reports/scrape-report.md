# Scrape Report

Generated: 2026-08-15T22:28:22.686Z
Accepted records: 3
Rejected records: 3
Blocked sources: 2

## Accepted

- Local model guardrails improve scraper reliability (https://example.com/ai/scraper-guardrails)
- Schema checks catch broken extraction early (https://research.example.com/schema-checks)
- Fixture-first scraping keeps demos reproducible (https://example.com/ai/local-fixtures)

## Rejected

- verify-malformed: title must contain at least 5 characters; summary must contain at least 20 characters; url must use HTTPS
- verify-malformed: url domain is not allowlisted: evil.example.net
- verify-malformed: publishedAt must use YYYY-MM-DD format

## Blocked

- verify-traversal: Blocked fixture path outside fixtures directory
- verify-blocked-url: Blocked remote source domain: not-allowed.invalid
