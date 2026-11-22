# Sahayak - Claim What's Yours (PS5)

Voice-first Hindi assistant that tells Rajasthan's widows and senior citizens which schemes they are likely eligible for, and why.

## Problem

- Scheme information is scattered across portals and offices.
- Sources give conflicting amounts and rules.
- Eligibility language is hard to read.
- Middlemen charge for forms that are free to apply for.

## Target user

Kamla Devi, 62, widow, village near Jaipur. She speaks Hindi, has little time to visit offices, and cannot read long English pages.

## Solution

Speak or type -> profile -> rule-based eligibility with reasons -> documents -> apply steps -> official link + last verified date -> track the application.

## Features

| Feature | Priority | Status |
|---|---|---|
| Core flow (M1-M11) | MUST | Built |
| Application tracker | SHOULD (S1) | Built |
| Mock reminders | SHOULD (S2) | Built |
| Middleman alert and report | SHOULD (S3) | Built |
| Voice output | SHOULD (S4) | Built |
| Impact dashboard | SHOULD (S5) | Built |
| Family view | NICE | Roadmap |
| Source-conflict flag | NICE | Roadmap |
| Language toggle | NICE | Roadmap |
| Printable summary | NICE | Roadmap |

Architecture details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Tech stack

- Next.js 14 (App Router) with TypeScript and Tailwind CSS
- Vitest for tests
- Claude API, used for language only
- Web Speech API for voice in and out
- JSON file store for schemes and applications

## Deploying to Vercel with Turso (libSQL)

Sahayak uses Turso (libSQL) for persistent cloud database storage on Vercel, with automatic fallback to local SQLite when running locally (`npm run dev`).

### 1. Create a Turso Database
1. Install Turso CLI or sign up at [turso.tech](https://turso.tech):
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   # Or on Windows using PowerShell:
   irm https://get.tur.so/install.ps1 | iex
   ```
2. Log in and create a database:
   ```bash
   turso auth login
   turso db create sahayak-db
   ```

### 2. Get Database URL and Auth Token
1. Get the database URL:
   ```bash
   turso db show sahayak-db --url
   # Example: libsql://sahayak-db-yourusername.turso.io
   ```
2. Create an authentication token:
   ```bash
   turso db tokens create sahayak-db
   ```

### 3. Set Environment Variables on Vercel
In your Vercel Project Settings -> **Environment Variables**, add:
- `TURSO_DATABASE_URL`: Your Turso database URL (`libsql://...`)
- `TURSO_AUTH_TOKEN`: Your Turso auth token
- `LLM_API_KEY`: Anthropic API key (optional, fallback parser works without it)
- `ADMIN_PASSPHRASE`: Passphrase for `/admin` management

### 4. Seed the Database
Run the idempotent seed script pointing to your Turso database:
```bash
TURSO_DATABASE_URL="libsql://sahayak-db-yourusername.turso.io" TURSO_AUTH_TOKEN="your-token" npm run seed
```
This initializes the database schema and loads `seed/schemes.json` into Turso. It is safe to run multiple times.

### 5. Deploy to Vercel
- **Via Vercel Git Integration**: Push your repository to GitHub/GitLab; Vercel will automatically build and deploy.
- **Via Vercel CLI**:
  ```bash
  npm i -g vercel
  vercel
  vercel --prod
  ```

## Run locally

1. `git clone <repo-url>`
2. Copy `.env.example` to `.env.local` and fill `ANTHROPIC_API_KEY` (optional; a keyword fallback works without it).
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000

## Environment variables

- `ANTHROPIC_API_KEY` - Claude API key (optional)
- `ADMIN_EMAIL` - admin login email
- `ADMIN_PASSWORD` - admin login password

Admin panel: `/admin`

## Tests

```
npm test
```

## Demo link

TBD

## Sample profiles

The 5 personas in `seed/personas.json`:

- P1 Kamla - 62, widow, farmer, Jaipur
- P2 Ram - 70, married, labour
- P3 Sunita - 35, widow, 2 children, income not given
- P4 Mohan - 58, married, farmer with 1.5 bigha, income not given
- P5 Edge - widow, age not given

Details: [docs/TEST_PERSONAS.md](docs/TEST_PERSONAS.md)

## Guardrails

- Never says a person is guaranteed a scheme; results are "likely eligible".
- No Aadhaar or ID number is asked for.
- Only public information, with official links.
- All demo data is sample data and is marked as such.
- Every scheme needs an official source and a verified date.
- Applying is free; the app warns about middlemen.
- LLM output is validated; the keyword fallback takes over on failure.
- Minimal storage: no name, phone or address.

Details: [docs/GUARDRAILS.md](docs/GUARDRAILS.md)

## Limitations

- Scheme amounts and rules are PLACEHOLDERS marked VERIFY. Verify at ssp.rajasthan.gov.in, myscheme.gov.in and e-Mitra before the demo.
- Voice depends on the browser (Chrome or Android recommended).
- The JSON file store is not for production.

## Next steps

- Verify every scheme against its official source and enter real amounts.
- Add the family view, source-conflict flag, language toggle and printable summary.
- Replace the JSON file store with a proper database.
- Pilot with NGOs and e-Mitra centres in one district.

## Team

TBD

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Schemes](docs/SCHEMES.md)
- [Rules format](docs/RULES_FORMAT.md)
- [Guardrails](docs/GUARDRAILS.md)
- [Assumptions](docs/ASSUMPTIONS.md)
- [Test personas](docs/TEST_PERSONAS.md)
- [Pitch and demo script](docs/PITCH.md)
- [Business model](docs/BUSINESS_MODEL.md)
