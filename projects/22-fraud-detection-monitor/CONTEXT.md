# Context

## Goal

Build a self-contained Fraud Detection Monitor mini-project under `staging/22-fraud-detection-monitor` only.

## Constraints

- No external dependencies.
- ASCII-only files.
- Deterministic baseline model and rules.
- Include data, source code, reports, README, package metadata, and a verify command.
- Keep the project runnable locally with Node.js 20 or newer.

## Implementation Summary

The project uses two CSV files:

- `data/reference_transactions.csv` for baseline statistics and drift reference.
- `data/current_transactions.csv` for scored monitoring results.

`src/monitor.js` performs all model, metric, and drift logic. It writes both JSON and Markdown reports. `src/verify.js` runs the monitor and validates that expected output exists. `src/server.js` serves the generated report and local dashboard with only Node built-ins.

## Intended Use

This is a portfolio-style monitoring artifact. It demonstrates the mechanics of fraud scoring and monitoring without claiming production model quality.

## Key Design Decisions

- Rules are transparent rather than learned, making the output deterministic and explainable.
- Thresholds are based on reference-set statistics where possible.
- Drift checks are deliberately simple so they can be audited from the code.
- Reports are regenerated from source data instead of checked in as stale output only.
