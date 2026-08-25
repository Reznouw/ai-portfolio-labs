# Dataset Cleaner Agent

Mini-project 09: a deterministic, no-API "agentic" cleaner for tabular customer data.

The CLI reads `data/raw/customers.csv`, applies an explicit cleaning plan, and writes:

- `data/clean/customers_clean.csv`
- `reports/cleaning-report.md`
- `reports/cleaning-report.json`

## What It Cleans

- Missing values: fills missing `age` with the median valid age and missing categorical fields with deterministic defaults.
- Duplicates: removes duplicate customers by normalized email, keeping the first record.
- Inconsistent categories: normalizes `plan`, `status`, `signup_source`, and city casing.
- Outliers: caps extreme `annual_spend` values using the IQR upper fence.
- Invalid values: clamps negative spend to `0` and marks malformed email addresses.

## Run

```bash
npm run clean
```

## Verify

```bash
npm run verify
```

The verification command regenerates the cleaned dataset and report, then checks expected row counts, no duplicate emails, normalized categories, and report output existence.

## Project Structure

```text
data/raw/customers.csv
data/clean/customers_clean.csv
reports/cleaning-report.md
reports/cleaning-report.json
src/clean.js
src/verify.js
```
