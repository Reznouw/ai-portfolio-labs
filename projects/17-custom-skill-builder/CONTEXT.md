# Context

## Goal

Build a mini-project for day 17: a Custom Skill Builder for AI agents.

## Scope

This project lives only in `staging/17-custom-skill-builder`. It is self-contained and does not depend on other workspace directories.

## Problem

Agent skills are useful when they are clear, reusable, and bounded. Writing them manually can produce inconsistent structure, missing trigger guidance, or vague output requirements.

## Approach

The CLI accepts a task brief and creates a `SKILL.md` using deterministic local templates. It extracts optional labeled fields, fills missing values with safe defaults, validates required sections, and provides examples.

## Non-Goals

- No paid API calls.
- No network access.
- No LLM generation.
- No global file writes.
- No changes outside this mini-project folder.

## Verification

Run:

```bash
npm run verify
```

The command generates `examples/generated/SKILL.md`, validates it, and exits non-zero if required sections are missing.
