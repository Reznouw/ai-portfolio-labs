# Context

## Goal

Build mini-project 18: Agent Loop Sandbox. It demonstrates a controlled autonomous loop that plans, executes a toy task, evaluates the result, and repeats with strict maximum iterations and budget controls.

## Boundaries

- All files live under `staging/18-agent-loop-sandbox`.
- No external APIs, network calls, model calls, or dependencies.
- The loop is deterministic and safe: tasks come from local JSON, actions are allowlisted transforms, and execution stops on success, max iterations, or budget exhaustion.
- ASCII-only content.

## Architecture

- `samples/tasks.json`: bundled toy tasks.
- `src/agent-loop.js`: deterministic planner, executor, evaluator, and report renderers.
- `src/cli.js`: command-line entry point that writes JSON and Markdown traces.
- `src/verify.js`: verification checks for generated reports, deterministic behavior, and stop conditions.
- `reports/trace.json` and `reports/trace.md`: generated sample traces.

## Loop Contract

Each iteration records:

- plan: selected action and reason.
- execute: output after applying the action and budget spent.
- evaluate: pass/fail status and remaining gaps.

The loop never invents arbitrary code. It can only apply the local transform actions declared in source.

## Verification

Run:

```bash
npm run verify
```

The command regenerates reports and validates successful completion, budget stop behavior, Markdown trace content, and JSON structure.
