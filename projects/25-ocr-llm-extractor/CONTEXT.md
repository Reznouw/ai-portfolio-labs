# Context

Mini-project 25 demonstrates an OCR plus LLM extraction workflow without external dependencies.

Real OCR engines are intentionally not bundled. The `fixtures/data` files simulate OCR output from invoices, receipts, and forms so the extraction logic can be developed, verified, and demoed locally without native binaries, cloud APIs, or paid services.

Core goals:

- Parse noisy OCR-like text into structured records.
- Use deterministic rules first for predictable extraction.
- Optionally call an LLM endpoint when environment variables are configured.
- Write machine-readable JSON and human-readable Markdown reports.
- Provide a small browser UI for reviewing fixture extraction results.

The project is self-contained under `staging/25-ocr-llm-extractor` and does not require installing dependencies.
