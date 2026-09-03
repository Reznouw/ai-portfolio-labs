# Agent Loop Sandbox

Deterministic offline sandbox for demonstrating a controlled autonomous agent loop. It plans, executes a toy transformation task, evaluates the result, and repeats until success, max iterations, or budget exhaustion.

## Features

- Safe local-only execution with no dependencies and no external APIs.
- Deterministic plan, execute, evaluate loop.
- Hard `maxIterations` and `budget` controls per task.
- Allowlisted toy actions: trim, lowercase, dedupe, sort, and reverse.
- JSON and Markdown trace reports for auditability.
- Sample tasks showing both successful convergence and budget stop.

## Quick Start

```bash
npm install
npm run run
```

Generated reports:

- `reports/trace.json`
- `reports/trace.md`

## Verify

```bash
npm run verify
```

The verify command regenerates the trace reports and checks deterministic behavior, stop reasons, report shape, and Markdown sections.

## CLI

```bash
node src/cli.js --tasks samples/tasks.json --json reports/trace.json --markdown reports/trace.md
```

Optional flags:

- `--tasks`: local task JSON file.
- `--json`: trace JSON output path.
- `--markdown`: trace Markdown output path.
- `--max-tasks`: limit how many tasks are executed from the sample file.

## How The Loop Works

For each task, the sandbox starts with the provided input list and an empty action history.

1. Plan: choose the next missing required action from the task contract.
2. Execute: apply only that allowlisted action to the current output.
3. Evaluate: compare current output with the expected output and record remaining gaps.
4. Repeat: stop only on success, max iterations, or budget exhaustion.

This is intentionally a toy loop. The point is to show control surfaces and traceability, not intelligence.

## Project Structure

```txt
CONTEXT.md           Project context and safety contract
README.md           Usage and behavior notes
package.json        Node scripts
reports/            Generated JSON and Markdown traces
samples/tasks.json  Local deterministic task definitions
src/agent-loop.js   Loop engine and report rendering
src/cli.js          CLI entry point
src/verify.js       Deterministic verification checks
```

## Safety Notes

- No network, filesystem mutation outside requested report writes, or shell execution inside the loop.
- No prompt execution, code generation, or dynamic evaluation.
- Unknown actions are rejected before execution.
- Budgets are integer costs attached to local actions.
