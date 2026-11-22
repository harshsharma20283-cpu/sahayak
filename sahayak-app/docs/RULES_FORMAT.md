# Rules format

## Rule shape

```json
{
  "field": "gender",
  "op": "==",
  "value": "F",
  "label_en": "Woman applicant",
  "label_hi": "महिला आवेदक",
  "note": "structural rule, threshold to verify at official portal"
}
```

| Key | Required | Meaning |
|---|---|---|
| `field` | yes | Profile field to check |
| `op` | yes | Operator (see below) |
| `value` | yes | Value to compare with |
| `label_en` | yes | English label shown to user |
| `label_hi` | yes | Hindi label shown to user |
| `note` | no | Internal note |

## Fields

`age`, `gender`, `marital`, `state`, `district`, `annual_family_income`, `land_bigha`, `occupation`, `disability`, `children_count`

## Operators

`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not_in`

## Worked example: widow pension

The `widow_pension` scheme has two rules:

1. `gender == "F"` (label: Woman applicant / महिला आवेदक)
2. `marital == "widow"` (label: Widowed / विधवा)

For a profile with `gender: "F"` and `marital: "widow"`, both rules are `met`. If `marital` is unknown, that rule is `unknown` and the app asks a follow-up question.

## Scheme requirements

- `official_url` must be `https` and on an allowed domain.
- To mark a scheme verified, `last_verified` needs a date in `YYYY-MM-DD` form, and at least one source is required.
- Placeholder schemes stay `needs_verification` with `last_verified` `null`.

## Changing rules

Rules can be changed without redeploy. Log in at `/admin` and edit the scheme. The change applies to the next match.
