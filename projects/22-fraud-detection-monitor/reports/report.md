# Fraud Detection Monitor Report

Generated at: 2026-08-15T23:05:39.775Z

## Performance

| Metric | Value |
| --- | ---: |
| Accuracy | 1 |
| Precision | 1 |
| Recall | 1 |
| F1 | 1 |
| False positive rate | 0 |
| True positives | 6 |
| False positives | 0 |
| True negatives | 10 |
| False negatives | 0 |

## Drift

Overall drift severity: high

| Check | Value | Severity |
| --- | ---: | --- |
| amount_distribution | 0.3713 | high |
| category_mix | 0.5587 | high |
| foreign_rate_delta | 0.0208 | low |
| fraud_rate_proxy_delta | 0.0972 | medium |

## Scored Current Transactions

| Transaction | Amount | Score | Predicted fraud | Actual fraud | Reasons |
| --- | ---: | ---: | ---: | ---: | --- |
| n001 | 14.25 | 0 | 0 | 0 | none |
| n002 | 62.10 | 0 | 0 | 0 | none |
| n003 | 188.90 | 10 | 0 | 0 | user_amount_spike |
| n004 | 27.40 | 0 | 0 | 0 | none |
| n005 | 156.00 | 0 | 0 | 0 | none |
| n006 | 520.00 | 0 | 0 | 0 | none |
| n007 | 535.00 | 0 | 0 | 0 | none |
| n008 | 560.00 | 50 | 1 | 1 | card_velocity, high_value_velocity |
| n009 | 39.50 | 0 | 0 | 0 | none |
| n010 | 1180.00 | 110 | 1 | 1 | high_amount, foreign_merchant, risky_category, unusual_hour, user_amount_spike |
| n011 | 950.00 | 110 | 1 | 1 | high_amount, foreign_merchant, risky_category, unusual_hour, user_amount_spike |
| n012 | 280.00 | 50 | 1 | 1 | risky_category, unusual_hour, user_amount_spike |
| n013 | 760.00 | 50 | 1 | 1 | foreign_merchant, unusual_hour, user_amount_spike |
| n014 | 85.00 | 15 | 0 | 0 | unusual_hour |
| n015 | 34.70 | 0 | 0 | 0 | none |
| n016 | 1410.00 | 70 | 1 | 1 | high_amount, risky_category, user_amount_spike |

## Notes

This monitor is deterministic and intended for a small demonstration dataset. It is not a production fraud model.
