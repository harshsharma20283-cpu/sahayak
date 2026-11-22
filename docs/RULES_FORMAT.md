# Rules Format

Each scheme holds a list of rules. A citizen is checked against every rule.

## Rule shape

```json
{ "field": "age", "op": ">=", "value": 60, "label_en": "Age 60 or above", "label_hi": "आयु 60 वर्ष या अधिक" }
```

| Key | Meaning |
|---|---|
| field | Profile field to check |
| op | Operator |
| value | Value to compare against |
| label_en | English label shown to the citizen |
| label_hi | Hindi label shown to the citizen |

## Fields

state, age, gender, marital, annual_family_income, land_bigha, occupation, children_count, disability, district

## Operators

`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not_in`

## Worked example: widow pension

```json
[
  { "field": "state", "op": "==", "value": "Rajasthan", "label_en": "Resident of Rajasthan", "label_hi": "राजस्थान का निवासी" },
  { "field": "gender", "op": "==", "value": "F", "label_en": "Woman applicant", "label_hi": "महिला आवेदक" },
  { "field": "marital", "op": "==", "value": "widow", "label_en": "Widowed", "label_hi": "विधवा" },
  { "field": "annual_family_income", "op": "<=", "value": 60000, "label_en": "Family income up to Rs 60,000 a year", "label_hi": "परिवार की वार्षिक आय 60,000 रुपये तक" }
]
```

A citizen who is a Rajasthan-resident woman, widowed, with family income up to Rs 60,000 passes all four rules and is shown as likely eligible.

## Scheme requirements

- Every scheme needs `official_url`.
- Every scheme needs `last_verified` in `YYYY-MM-DD` format. Admin refuses to save a scheme without both.

## Editing

Rules are data. Changes made through `/admin` apply without a redeploy.
