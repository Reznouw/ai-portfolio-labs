# Mini-Project 23: Time Series Forecasting

Dependency-free forecasting baselines over a tiny energy/weather-like daily dataset.

## What It Does

- Loads `data/energy_weather.csv`.
- Holds out the final 7 days for testing.
- Evaluates three baselines:
  - Moving average
  - Seasonal naive with weekly seasonality
  - Linear trend
- Reports MAE and MAPE.
- Forecasts the next 7 days after the dataset.
- Writes `reports/forecast-report.md`.

## Run

```bash
npm run forecast
```

## Verify

```bash
npm run verify
```

The verify command checks parsing, metric sanity, forecast horizon, and report generation without external dependencies.

## Project Layout

```text
data/energy_weather.csv      Tiny daily demand and weather data
reports/forecast-report.md   Generated forecast report
src/forecast.js              Forecasting, metrics, reporting, and verification
CONTEXT.md                   Design notes and assumptions
package.json                 Local scripts
```
