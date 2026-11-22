# Test Personas

Source: `seed/personas.json`. All five are fictional. They run in `tests/eligibility.test.ts` via `npm test`.

| ID | Label | Profile in plain words | Expected outcome in plain words |
|---|---|---|---|
| P1 | Kamla | 62, widow, woman, farmer with 2 bigha, Jaipur, family income Rs 40,000, no children | Likely eligible for old age pension, widow pension, old age farmer pension, state health insurance, maternity nutrition support and central NSAP pension. Not eligible for disability pension or Palanhar. |
| P2 | Ram | 70, married man, labourer, no land, Jaipur, family income Rs 30,000 | Likely eligible for old age pension, state health insurance and central NSAP pension. Not eligible for the others. |
| P3 | Sunita | 35, widow, woman, 2 children, Jaipur, income and occupation not given | Widow pension needs more info. Palanhar and maternity nutrition support are likely eligible. Old age pensions and disability pension are not eligible. State health insurance needs more info. |
| P4 | Mohan | 58, married man, farmer with 1.5 bigha, Jaipur, income not given | Health insurance and state health insurance need more info. All pensions and other schemes are not eligible. |
| P5 | Edge case | Widow, woman, age not given, Jaipur, family income Rs 30,000 | Widow pension, state health insurance and maternity nutrition support are likely eligible. Old age pensions need more info. Palanhar and disability pension are not eligible. |
