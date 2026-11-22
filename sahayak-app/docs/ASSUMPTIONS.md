# Assumptions

## Impact formula

```
estimated yearly benefit = sum over started applications of (monthly cash benefit x 12)
```

- Only `cash_monthly` benefits with a verified number count.
- `cover_insurance` (health cover) is excluded.
- Null amounts count as 0 and are counted separately, so the total is not inflated.
- `profiles_screened` is 0, because there is no profile table. It is not a real count.

## Data

- All numbers on the impact dashboard are **SAMPLE**.
- Scheme amounts are not stored yet (`benefit_monthly_estimate` is `null` for all 8 schemes), so the formula currently returns no real money figure.
- Scheme status is `needs_verification` for all schemes.

## Limitations

- No income limits in rules.
- No profile table; no count of people screened.
- No real application data from government systems.
- Figures are for demo and pitch only, not for policy.
