# Guardrails

| Guardrail | Implementation |
|---|---|
| Likely eligible is never guaranteed | Fixed result labels only; footer reads "Final decision is by the government department." |
| No Aadhaar or ID collection | No ID fields in the app; "Jan Aadhaar card required" appears only as a document name |
| Public information only | Official portal sources only (ssp.rajasthan.gov.in, myscheme.gov.in); no scraping |
| Rules are editable data | Rules live in data/schemes.json and are edited via /admin |
| Sample data only | Demo banner on every page; 5 fictional personas |
| Official source and verified date are mandatory | validateScheme refuses to save a scheme without official_url and last_verified |
| Never charged | Free alert on every scheme; Report button for anyone asked to pay |
| LLM output is validated | Schema check, retry once, then keyword fallback |
| Minimal storage | No name, phone or address stored; reports are anonymous |
