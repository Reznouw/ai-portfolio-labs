# Multi-Agent Research Team

Offline mini-project that simulates a small research team with three deterministic agents:

- `researcher`: searches a local evidence corpus and selects the strongest cited notes.
- `critic`: checks evidence balance, citation coverage, risks, and missing context.
- `writer`: turns the findings into a concise research brief with citations and critic notes.

No network access, paid API, or model dependency is required. The project uses simple rule-based scoring over local JSON evidence.

## Run

```bash
npm run brief
```

Optional custom topic:

```bash
node src/cli.js "Should a city deploy neighborhood cooling hubs during heat waves?"
```

## Verify

```bash
npm run verify
```

The verify command regenerates reports and checks that the output includes a claim, citations, critic notes, agent trace, and deterministic evidence selections.

## Output

- `reports/research-brief.md`: human-readable brief.
- `reports/research-brief.json`: structured output with selected evidence, critic notes, and agent trace.

## Data

- `data/corpus.json`: small local web/evidence corpus with source metadata and short passages.

## Design Notes

This is a simulation of a multi-agent workflow, not an autonomous LLM system. Each agent is a named deterministic function so the same input corpus and topic always produce the same result.
