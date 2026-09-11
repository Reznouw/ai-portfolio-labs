# Context

## Goal

Build a compact, dependency-free Speech To Insight demo that proves the pipeline shape without calling an external ASR or LLM API.

## Constraints

- Work only inside `staging/26-speech-to-insight`.
- ASCII-only source and docs.
- No runtime dependencies.
- No external network calls.
- Use fixtures that simulate ASR output and audio metadata.
- CLI must write JSON and Markdown.
- Include a verification command.

## Design Decisions

- Fixtures model common ASR fields: audio metadata, speaker-labeled segments, timestamps, confidence, and transcript text.
- Summary is extractive and deterministic to keep verification stable.
- Sentiment uses a tiny domain lexicon with positive and negative term counts.
- Action extraction is heuristic-based and looks for owners, dates, modal verbs, follow-up language, and questions.
- Frontend reads generated reports directly and degrades gracefully if `assets/demo.png` is not available.

## Future Extensions

- Add a local ASR adapter that writes the same fixture schema.
- Add topic clustering and speaker talk-time charts.
- Add confidence warnings for low-quality audio or uncertain transcript segments.
- Add export packaging for stakeholder-ready meeting notes.
