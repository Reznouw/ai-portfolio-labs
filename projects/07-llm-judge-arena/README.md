# LLM Judge Arena

LLM Judge Arena is a local-first mini-project that demonstrates the LLM-as-judge evaluation concept without requiring paid APIs. It compares two candidate answers for each prompt and scores them with a deterministic rubric-based judge.

The local judge scores:

- Correctness: required facts present, forbidden claims absent.
- Helpfulness: concise response, useful terms, directness to the prompt.
- Grounding: lexical support from the provided context.

## Run

```bash
npm install
npm run judge
```

Generated reports:

- `reports/judge-report.json`
- `reports/judge-report.md`

## Verify

```bash
npm run verify
```

The verification command runs the judge, validates that every prompt has two candidates, checks all scores are between 0 and 1, and writes both reports.

## Data

Sample prompts and candidate answers live in `data/arena-samples.json`. Each item includes:

- `prompt`: the task being evaluated.
- `context`: source text used for grounding.
- `rubric.required_facts`: facts the answer should include.
- `rubric.forbidden_claims`: claims that should be penalized.
- `rubric.helpfulness_terms`: simple terms that indicate useful framing.
- `candidates`: two candidate answers to compare.

## Optional OpenAI-Compatible Judge

This project intentionally does not call any external model. If you want to replace or supplement `src/judge.js` with an OpenAI-compatible judge later, use environment variables like these:

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=replace-me
OPENAI_MODEL=gpt-4o-mini
```

For local OpenAI-compatible servers, `OPENAI_BASE_URL` can point to a local endpoint. Keep the deterministic judge as the default mode so the project stays runnable without paid APIs.

## Notes

This is a teaching demo, not a production evaluator. The grounding score is lexical, so it can miss paraphrases and cannot prove factual truth. The value is in showing the evaluation shape: prompts, candidate answers, judge rubric, per-metric scores, evidence, and machine/human-readable reports.
