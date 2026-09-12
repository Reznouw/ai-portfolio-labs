# Context

## Project

- Mini-project: 27
- Name: Guardrails Playground
- Runtime: Node.js 20+
- Dependencies: none
- Scope: `staging/27-guardrails-playground` only

## Goal

Demonstrate deterministic guardrail validation for adversarial prompts without paid APIs. The project validates prompt format, length, safety, schema integrity, banned content, and refusal boundaries, then explains the decision path in CLI and browser UI.

## Architecture

- `src/guardrails.js`: policy definitions, prompt checks, schema validation, and report formatting helpers.
- `src/cli.js`: evaluates sample prompts or a custom prompt and can write report files.
- `src/verify.js`: deterministic verification for expected sample decisions, schema shape, and report generation.
- `src/server.js`: dependency-free local server for `public/` and `/api/evaluate` plus `/api/samples`.
- `public/`: frontend playground.
- `samples/`: adversarial prompt corpus.
- `reports/`: generated outputs.

## Decisions

- Use a rule-based engine instead of an LLM so behavior is deterministic, free, and testable.
- Keep all sample content non-operational while still representing common adversarial classes.
- Treat refusal boundaries as explicit policy outcomes rather than vague risk scores.
- Keep the output schema stable so downstream automation can consume reports.

## Commands

```bash
npm run demo
npm run report
npm run serve
npm run verify
```

## Verification

Run `npm run verify` from this directory. It checks all bundled samples against expected decisions and writes reproducible reports.

## Notes For Future Agents

- Do not add model-provider calls or paid APIs.
- Keep examples safe and educational.
- If policies change, update `samples/adversarial-prompts.json` expected decisions and run verification.
