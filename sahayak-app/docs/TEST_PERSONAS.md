# Test personas

Source: `seed/personas.json`. These are covered in `tests/engine.test.ts`.

| ID | Label | Input (summary) | Profile key facts | Expected outcome |
|---|---|---|---|---|
| P1 | Kamla | 62, widow, 2 bigha land, near Jaipur | age 62, F, widow, farmer, 2 bigha | Widow pension: likely eligible. Old age: likely eligible. Small farmer: likely eligible. |
| P2 | Ram | 70, male, labourer, income 30000 | age 70, M, married, labour, 0 bigha | Widow pension: not eligible. Old age: likely eligible. Small farmer: not eligible. |
| P3 | Sunita | 35, widow, 2 children | age 35, F, widow, 2 children, income and land unknown | Widow pension: need more info. Old age: not eligible. Small farmer: not eligible. |
| P4 | Mohan | 58, male, married, 1.5 bigha, farmer | age 58, M, married, farmer, 1.5 bigha, income unknown | All three: not eligible. |
| P5 | Edge | "मैं गाँव में रहता हूँ" (only a village line) | no fields known | All three: need more info. |

Plain meaning:
- **Need more info** means the app asks a follow-up question instead of deciding.
- **Not eligible** means a rule is clearly `not_met`.
- **Likely eligible** means all checked rules are `met`. It is not an approval.
