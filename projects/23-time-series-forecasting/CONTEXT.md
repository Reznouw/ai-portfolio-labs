# Context

This mini-project demonstrates baseline forecasting without third-party packages. The dataset is intentionally tiny so the implementation stays readable and easy to verify.

## Dataset

Each row represents one day with:

- `date`: ISO date.
- `temperature_c`: daily average outdoor temperature.
- `humidity_pct`: daily average humidity.
- `demand_kwh`: target energy demand.

The target series has a small upward trend, weekly seasonality, and weather-like variation.

## Baselines

- Moving average uses the latest 7 observed target values.
- Seasonal naive repeats the value from 7 days earlier.
- Linear trend fits a least-squares line to the training target series and extrapolates by time index.

## Evaluation

The final 7 rows are held out as a test period. The report includes MAE and MAPE for each baseline, then selects the lowest-MAE model for the next 7-day forecast.

## Constraints

- No runtime dependencies.
- ASCII-only project files.
- All work is scoped to this directory.
