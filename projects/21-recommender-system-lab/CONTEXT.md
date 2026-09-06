# Project Context

## Current State

- Status: implemented
- Last update: 2026-08-15
- Current agent: OpenCode

## Objective

Build mini-project 21 as a self-contained recommender system lab with tiny MovieLens-like data, CLI recommendations, local frontend, README, context notes, and a verification command.

## Architecture

- `data/movies.json`: synthetic movie catalog with genres, mood, year, and runtime.
- `data/ratings.json`: tiny user-item rating matrix.
- `src/recommender.js`: shared recommendation logic used by both CLI and server.
- `src/cli.js`: command-line entry point for recommendations.
- `src/server.js`: dependency-free local server for static assets and JSON APIs.
- `public/`: responsive frontend for profile inspection and recommendation ranking.
- `reports/`: place for verification evidence and future screenshots.

## Decisions Made

- Used Node.js only, with no external runtime dependencies.
- Implemented explainable item-based recommendation rather than opaque ML training.
- Kept the UI static and server-backed so the project is easy to run locally.
- README references `assets/demo.png`; screenshot capture is intentionally left for the later screenshot step.

## How To Run

```bash
npm install
npm run recommend -- --user U1 --limit 5
npm run dev
```

Open `http://localhost:42121`.

## Verification

```bash
npm run verify
```

The verify script checks dataset size, U1 profile construction, recommendation count, watched-item exclusion, score range, and required frontend/docs files.

## Visual Evidence

- Pending: capture `assets/demo.png` from the local frontend.

## Pending

- Capture screenshot after running the frontend.
- Optionally add recommendation metrics and browser-side rating edits.

## Notes For Next Agent

Keep all work scoped under `staging/21-recommender-system-lab`. If adding dependencies, justify them in README and keep the verify command deterministic.

## Change History

- 2026-08-15: created recommender lab with CLI, server, frontend, data, README, and verify command.
