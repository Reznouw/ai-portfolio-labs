# Context

This mini-project demonstrates concept agentic cleaning for tabular data without paid APIs or nondeterministic model calls.

The "agent" is represented as a transparent planning loop:

1. Profile the raw CSV for missingness, duplicates, category drift, and numeric outliers.
2. Build a deterministic cleaning plan from fixed rules.
3. Execute the plan row by row.
4. Emit machine-readable and human-readable reports.

Design constraints:

- ASCII-only files.
- No external dependencies.
- No network or paid API calls.
- Inputs and outputs are fixed relative to this project directory.
- Cleaning decisions must be reproducible from the source code and raw CSV.

The sample dataset intentionally includes missing values, duplicate customers, inconsistent categories, malformed values, and outliers so the report has meaningful actions to summarize.
