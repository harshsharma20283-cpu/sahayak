# 🏛️ Sahayak (सहायक) — Claim What's Yours

> **Voice-first civic technology platform empowering rural citizens, senior citizens, and women to discover, understand, and track government welfare schemes in their own language.**

[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://sahayak-cw3k8oufx-hrshs-projects-34d0c347.vercel.app)
[![Database](https://img.shields.io/badge/Database-Turso%20libSQL-00e5bf?logo=sqlite)](https://turso.tech)
[![Framework](https://img.shields.io/badge/Framework-Next.js%2014%20App%20Router-black?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 The Problem

- **Scattered Information:** Welfare schemes are distributed across multiple state and central portals with inconsistent rules.
- **Cognitive & Language Barrier:** Official guidelines use dense legal and administrative vocabulary, inaccessible to rural elderly citizens.
- **Rampant Middlemen (दलाल):** Unscrupulous agents charge ₹200–₹500 for government applications that are 100% free to apply.
- **Incomplete Household Coverage:** Families often know about one scheme (e.g., PM-Kisan) but miss out on pension or Palanhar schemes for other family members.

---

## 💡 The Solution

**Sahayak** is designed for users like **Kamla Devi (62, widow, Jaipur)**:
1. **Speak or Type:** Talk naturally in Hindi or English (no paperwork or typing needed).
2. **Instant Profile Extraction:** Automatic extraction of age, marital status, land ownership, and household income without requiring Aadhaar or PII.
3. **Deterministic Match Engine:** Transparent evaluation explaining *exactly why* a person is likely eligible and what specific detail is missing.
4. **Fraud & Middleman Alerts:** Clear, prominent warnings that government forms are free.
5. **Family Hub:** Add household members and track eligibility for the whole family in one place.
6. **Application Tracker & Parchi:** Follow application milestones and generate printable confirmation summaries.

---

## 🚀 Key Features

| Feature | Category | Status | Details |
|---|---|---|---|
| 🎙️ **Voice-First Input** | Core Flow | ✅ **Live** | Web Speech API integration with real-time waveform & mic animation |
| 🌐 **Bilingual (Hindi / English)** | Accessibility | ✅ **Live** | Complete instant i18n language toggle without page reload |
| 🎯 **Rule-Based Engine** | Verification | ✅ **Live** | Zero hallucination: exact rule matching with plain-language reasons |
| 👨‍👩‍👧‍👦 **Family Hub** | Multi-Profile | ✅ **Live** | Persistent tabbed view to track schemes for children, spouses & parents |
| 📋 **Application Tracker** | Lifecycle | ✅ **Live** | Status updates (Submitted, Under Review, Approved) & reference numbers |
| 🛡️ **Anti-Middleman Alert** | Guardrail | ✅ **Live** | Amber warning banner & fraud report mechanism |
| 🖨️ **Printable Parchi** | Utility | ✅ **Live** | Formatted checklist for physical CSC / e-Mitra visits (`@media print`) |
| 💎 **Liquid Glass UI** | UX/Design | ✅ **Live** | Frosted glass cards, WCAG AA 4.5:1 contrast, and large touch targets (56px) |
| ⚡ **Cloud Database** | Infra | ✅ **Live** | Turso (libSQL serverless SQLite) with automatic local fallback |

---

## 🛠️ Architecture & Tech Stack

```
User (Voice/Text)
       │
       ▼
Next.js 14 Web Speech / Text
       │
       ├─► LLM Parser (Groq / OpenAI API) ──[Timeout / Fallback]──► Local Regex Parser
       │
       ▼
Profile Normalization (Age, Income, Land, Category)
       │
       ▼
Deterministic Rule Engine (engine.ts)
       ├── Likely Eligible (All conditions met)
       ├── Need More Info (1-2 questions pending)
       └── Not Eligible (Rule failing reasons)
       │
       ▼
Turso Cloud Database (libSQL) ◄──► Applications & Family Persistence
```

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Design System:** Custom Liquid-Glass UI with dynamic backdrop blur and CSS design tokens
- **Database:** Turso (libSQL Serverless SQLite) for cloud persistence + local SQLite for offline dev
- **LLM / NLP:** Fast natural language entity extraction with 8-second timeout & local deterministic fallback
- **Testing:** Vitest (Engine unit tests, i18n coverage tests, encoding safeguards)

---

## 🔒 Guardrails & Ethics

- **Zero PII Exposure:** Never asks for Aadhaar number, phone number, bank credentials, or biometric data.
- **Non-Deceptive Status:** Results are explicitly marked **"संभावित / Likely eligible"** — final approval always rests with the concerned department.
- **Verified Sources:** Every scheme card links directly to the official government portal (`ssp.rajasthan.gov.in`, `myscheme.gov.in`).
- **Free of Cost Guarantee:** Emphasizes that application forms are free, reducing vulnerability to middlemen scams.

---

## 💻 Local Setup & Development

### 1. Clone the repository
```bash
git clone https://github.com/harshsharma20283-cpu/sahayak.git
cd sahayak
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file inside `sahayak-app/`:
```env
# LLM Provider Configuration
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=your_llm_api_key
LLM_MODEL=openai/gpt-oss-20b

# Security & Admin
ADMIN_PASSWORD=your_admin_password
SESSION_SECRET=your_session_secret

# Database (Optional for local: falls back to local SQLite if omitted)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

### 4. Seed and Run
```bash
npm run seed     # Idempotent DB seed (schemes & rules)
npm run dev      # Starts local dev server at http://localhost:3000
```

### 5. Run Test Suite
```bash
npm test         # Runs full Vitest suite (29 tests)
```

---

## 🌐 Deployment on Vercel

1. Push your repository to GitHub.
2. Import project on [Vercel](https://vercel.com):
   - **Root Directory:** `sahayak-app`
   - **Framework Preset:** `Next.js`
3. Add the environment variables from your `.env.local`.
4. Click **Deploy**. The app auto-seeds on first API call if the remote DB is new.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
