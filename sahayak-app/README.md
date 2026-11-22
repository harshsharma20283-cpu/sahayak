# Sahayak - सहायक (Claim What's Yours, PS5)

**Voice-first Hindi assistant that tells Rajasthan's widows and senior citizens which schemes they are likely eligible for, and why.**

> सहायक एक स्वतंत्र सहायता उपकरण है। यह कोई सरकारी पोर्टल नहीं है। सभी योजना डेटा अभी `needs_verification` स्थिति में है।

## Problem

Rajasthan mein bahut si pension aur sahayta yojnayein hain, lekin gaon ke log unki sharten nahi jaante. Kai log middleman ko paise dete hain, jabki in yojnaon ke aavedan free hain. Sahi jaankari ke bina log apna haq chhod dete hain.

## Target user

**Kamla Devi, 62, widow, village near Jaipur.** Wo Hindi mein bolna chahti hain, padh-likh kam sakti hain, aur unke paas smartphone ya computer ke liye koi madad nahi hai. Sahayak unhe bina English ke, bolkar ya type karke, batata hai ki kaun si yojna unke liye sambhav hai aur kyun.

## Positioning

- Sahayak ek **independent help tool** hai, government portal nahi.
- Ye sirf sambhavit patrata (likely eligibility) batata hai. Final faisla sambandhit sarkari vibhag ka hota hai.
- Koi fee nahi. Citizen se paisa nahi liya jaata.

## Features

| Feature | Status |
|---|---|
| Plain-language input with Web Speech and typed text | Built |
| 5 sample profiles | Built |
| Profile confirm and follow-up questions | Built |
| Rule engine with `met` / `not_met` / `unknown` | Built |
| Results cards (likely eligible wording) | Built |
| Scheme detail page with rules, checklist, apply steps, official link | Built |
| Read-aloud of results | Built |
| Middleman alert ("yojna ka aavedan free hai") | Built |
| Admin login and rule editing at `/admin` | Built |
| Application tracker | Built |
| Reminders from real applications | Built |
| e-Mitra slip | Built |
| Impact dashboard (labelled SAMPLE) | Built |
| Family view (engine per member) | Built |
| SMS simulator (simulated only, no real SMS) | Built |
| Live LLM verification of extraction and explanation | Not done |
| Real SMS / WhatsApp sending | Not done |
| Browser-tested voice on phones | Not done |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Other docs: [SCHEMES](docs/SCHEMES.md), [RULES_FORMAT](docs/RULES_FORMAT.md), [GUARDRAILS](docs/GUARDRAILS.md), [ASSUMPTIONS](docs/ASSUMPTIONS.md), [TEST_PERSONAS](docs/TEST_PERSONAS.md), [BUSINESS_MODEL](docs/BUSINESS_MODEL.md), [PITCH](docs/PITCH.md).

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Vitest for tests
- `node:sqlite` for local storage
- Optional LLM via `LLM_API_KEY`, with a local fallback parser and template explanation when no LLM is set or its output fails validation

## Run locally

1. `git clone <repo-url>`
2. `cp .env.example .env.local` and fill `ADMIN_PASSWORD` and `SESSION_SECRET`. `LLM_API_KEY` is optional.
3. `npm install`
4. `npm run seed`
5. `npm run dev` and open http://localhost:3000

`node:sqlite` ke liye Node 22.5 ya usse naya version chahiye.

## Environment variables

| Variable | Purpose |
|---|---|
| `LLM_API_KEY` | Optional. Key for the LLM used in extraction and explanation. Without it, the local fallback is used. |
| `LLM_MODEL` | Optional. LLM model name. |
| `DATABASE_URL` | Location of the local SQLite database. See `.env.example`. |
| `ADMIN_PASSWORD` | Password for the `/admin` login. Required. |
| `SESSION_SECRET` | Secret used to sign the admin session cookie. Required. |

## Tests

```
npm test
```

Tests cover the rule engine and the sample personas (see [docs/TEST_PERSONAS.md](docs/TEST_PERSONAS.md)).

## Guardrails (short)

- Output says "likely eligible", never "approved".
- No Aadhaar, ID, phone or address fields are collected.
- Admin rejects profile-like keys in scheme data.
- Scheme data must have an official https source and a verification date before it is marked verified.
- LLM output is validated; on failure the local template is used.
- Rate limits on extract and explain endpoints.
- Anonymous reports strip long digit runs (10+ digits).

Full table: [docs/GUARDRAILS.md](docs/GUARDRAILS.md).

## Limitations

- All scheme data is a **placeholder**: `needs_verification`, dates are `null`, rules are placeholder thresholds to be checked on the official portal.
- Income limits are not stored yet, so income is not used in the rules.
- Amounts are not stored; the app says "verify on official portal".
- `node:sqlite` needs Node 22.5 or newer.
- Voice depends on the browser and device. Only desktop-style testing is claimed; phone browsers are not tested.
- No citizen login. Data is kept in a local SQLite database.
- Impact numbers are SAMPLE numbers.

## Team

TBD
