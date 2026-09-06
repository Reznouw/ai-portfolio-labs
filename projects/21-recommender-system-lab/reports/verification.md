# Verification Report

## Commands

```bash
npm run verify
```

## Expected Checks

- Dataset contains 12 movies and 28 ratings.
- User `U1` profile contains 4 watched movies.
- Recommendations return 5 unseen movies.
- Recommendation scores stay within the 0 to 5 rating range.
- Required frontend and documentation files exist.

## Latest Result

- `npm run verify`: passed.
- `npm run recommend -- --user U1 --limit 3`: passed.
- Local server smoke test: `/` returned HTTP 200 and `/api/recommendations?user=U1&limit=2` returned HTTP 200.
