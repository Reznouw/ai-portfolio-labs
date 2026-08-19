# RAG Evaluator

Mini-project 04 for the AI portfolio: a small executable evaluator for generated answers on a tiny paper QA dataset.

It does not call a paid API. The included dataset already contains expected answers, retrieved paper context, and sample generated answers.

## What You Will Learn

- How to structure a tiny answer evaluation dataset.
- How exact match can be too strict for natural language answers.
- How keyword coverage gives a simple task-specific score.
- How groundedness can be approximated by checking whether answer terms are supported by retrieved context.
- How to produce a repeatable evaluation report from local data.

## Install

No dependencies are required beyond Node.js 20+.

```bash
npm install
```

## Run

```bash
npm run eval
```

The command reads `data/paper-qa.json` and writes:

```txt
reports/eval-report.json
reports/eval-report.md
```

It also prints a short score summary to the terminal.

## Metrics

- `exact`: 1 when normalized generated and expected answers match exactly, else 0.
- `keyword`: fraction of required keywords found in the generated answer.
- `groundedness`: fraction of meaningful generated answer terms that also appear in the retrieved paper context.
- `overall`: weighted score: 20% exact, 40% keyword, 40% groundedness.

## Dataset Shape

Each item contains:

```json
{
  "id": "qa-001",
  "paper": "Paper title",
  "question": "Question asked by the user",
  "context": "Retrieved context from the paper",
  "expected_answer": "Reference answer",
  "generated_answer": "Answer being evaluated",
  "required_keywords": ["important", "terms"]
}
```

## Architecture

```txt
data/paper-qa.json    # sample paper QA eval dataset
src/evaluate.js       # metric computation and report generation
reports/              # generated reports after npm run eval
```

## Ideas To Improve

- Add multiple generated answer files to compare model versions.
- Add citation span checks for stronger groundedness.
- Add pass/fail thresholds for CI.
- Add a small web UI for inspecting failed answers.
