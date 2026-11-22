# Guardrails

| Guardrail | Implementation |
|---|---|
| Likely eligible wording only | Results use labels such as "likely eligible". Footer: "अंतिम निर्णय संबंधित सरकारी विभाग का होगा" (final decision is with the concerned government department). |
| No sensitive identity fields | No Aadhaar, ID, phone or address fields in the Profile type. Admin rejects such keys in scheme data. |
| Public information only | Scheme data comes from public official sources. No citizen data is sent to government systems. |
| Editable rules | Rules can be changed at `/admin` without redeploy. |
| Sample data banner | Impact dashboard is labelled SAMPLE. Scheme data is marked needs_verification. |
| Official source and verification required on save | Admin requires an https official URL, and a verified status needs a `YYYY-MM-DD` date and at least one source. |
| No fee | Every scheme shows "Free" and a free alert: the application is free, do not pay anyone. |
| LLM output validated, with fallback | LLM output is checked; if invalid, the local parser or template is used. |
| Rate limits | Rate limits on `/api/profile/extract` and `/api/explain`. |
| Minimal storage | Anonymous reports strip runs of 10 or more digits before saving. |
