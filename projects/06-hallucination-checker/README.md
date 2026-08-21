# Hallucination Checker

Mini-project 06 for the AI portfolio: a tiny command-line factual verification demo.

It checks a claim against a local evidence corpus, then can optionally fetch a Wikipedia REST summary when the internet is available. It does not require paid APIs or API keys.

## What You Will Learn

- How to separate a claim from evidence before judging it.
- How a tiny corpus can produce cited `supported`, `refuted`, or `uncertain` verdicts.
- How retrieval failures should lead to `uncertain`, not invented certainty.
- How optional web evidence can supplement a local fallback without breaking offline use.

## Install

No dependencies are required beyond Node.js 20+.

```bash
npm install
```

## Run

Check one claim offline:

```bash
npm start -- --claim "The Eiffel Tower is in Paris" --no-wiki
```

Check one claim with optional Wikipedia summary fetch:

```bash
npm start -- --claim "Marie Curie won Nobel Prizes in physics and chemistry"
```

Run sample claims:

```bash
npm run demo
```

Run verification:

```bash
npm test
```

## Output

The CLI prints:

- `claim`: the input claim.
- `verdict`: `supported`, `refuted`, or `uncertain`.
- `confidence`: a small heuristic score from 0 to 1.
- `evidence`: cited snippets with source labels.
- `notes`: caveats about local-only or Wikipedia fallback behavior.

Example:

```txt
Verdict: supported (0.94)
Evidence:
[local:eiffel-tower] The Eiffel Tower is a wrought-iron tower on the Champ de Mars in Paris, France.
```

## Architecture

```txt
data/evidence.json      # tiny local evidence corpus with citation snippets
samples/claims.json     # sample claims and expected offline verdicts
src/checker.js          # local matcher, optional Wikipedia fetch, verdict logic
src/cli.js              # command-line interface and verification mode
```

## Limits

This is a teaching demo, not a production fact-checker. The local matcher is lexical and rule-based. Wikipedia summaries are treated as retrieved evidence, not as a perfect source of truth. If evidence is weak or conflicting, the tool returns `uncertain`.

## Ideas To Improve

- Add sentence-level entailment with a local open model.
- Add more evidence documents and source metadata.
- Add claim decomposition for multi-part claims.
- Add tests for ambiguous claims and conflicting evidence.
