# Context

## Requirement

Build mini-project 11 under `staging/11-sentiment-analyzer-dashboard` only: a small, offline Sentiment Analyzer Dashboard with deterministic lexicon-based NLP over sample reviews and tweets, summary metrics, a polished local frontend served by Node, and no external dependencies.

## Frontend Direction

- Visual direction: editorial analytics workspace with a dark ink background, warm card surfaces, compact metric tiles, and sentiment color accents.
- Visual density: medium-high, showing meaningful metrics above the fold without feeling like a generic admin dashboard.
- Main components: hero summary, metric cards, sentiment distribution bars, filter controls, top polarized samples, and analyzed item cards with term evidence.
- Responsive decisions: desktop uses a two-column analytics layout; tablets collapse supporting panels; phones use single-column cards with horizontally safe controls and large tap targets.

## Implementation Notes

- Analyzer is deterministic and dependency-free in `src/analyzer.js`.
- Server is a small Node HTTP server in `src/server.js` serving static files plus `/api/sentiment`.
- Sample data lives in `data/sample-reviews.json` and includes both reviews and tweets.
- Frontend fetches local API data and performs only client-side filtering/rendering.

## Verification

- `npm run verify` validates analyzer determinism, expected summary metrics, static assets, and data shape.
- Screenshot captured from `http://localhost:4111` and saved to `assets/demo.png`.

## Remaining Polish

- Add more sample reviews if a larger distribution is needed.
