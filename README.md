# 🤝 Sahayak (सहायक) — Claim What's Yours

> **Sahayak is an independent help tool, not a government portal.** Results are "likely eligible" only; the final decision rests with the concerned department. This demo uses **sample data only**; no Aadhaar, phone numbers or other personal IDs are collected.

Voice-first, plain-language welfare scheme finder for widows and senior citizens in Rajasthan.

[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://sahayak-cw3k8oufx-hrshs-projects-34d0c347.vercel.app)
[![Database](https://img.shields.io/badge/Database-Turso%20libSQL-00e5bf?logo=sqlite)](https://turso.tech)
[![Framework](https://img.shields.io/badge/Framework-Next.js%2014%20App%20Router-black?logo=next.js)](https://nextjs.org)

---

## 📌 Problem

- **Scattered Information:** Information on pensions and welfare schemes is fragmented across multiple government portals and local offices.
- **Cognitive & Language Barriers:** Official rules use complex bureaucratic vocabulary that can be difficult for rural senior citizens to interpret.
- **Risk of Exploitation:** Middlemen often charge fees for application forms and services that are officially free.
- **Household Visibility:** Families often do not realize which other household members may qualify for specific pensions or educational support.

---

## 💡 Solution

Sahayak focuses on ease of access for users like **Kamla Devi (62, widow, Jaipur)**:
1. **Speak or Type:** Natural spoken or written input in Hindi or English.
2. **Profile Extraction:** Automatic parsing of age, family details, land, and income without asking for Aadhaar or sensitive IDs.
3. **Deterministic Rules:** Transparent, explainable evaluation showing why a person qualifies or what single detail is pending.
4. **Middleman Warnings:** Prominent notice reminding citizens that application forms are free.
5. **Family View:** Tabbed multi-member interface to review eligibility across an entire household.
6. **Application Tracker:** Follow application milestones and generate printable checklists.

---

## 🚀 Features

| Feature | Category | Status | Details |
|---|---|---|---|
| 🎙️ **Voice Input** | Core Flow | Built | Web Speech API integration with mic animation |
| 🌐 **Hindi/English Toggle** | Accessibility | Built | Instant bilingual toggle across the entire application |
| 🎯 **Rule Engine** | Verification | Built | Eligibility is decided by editable rules, not by the LLM |
| 👨‍👩‍👧‍👦 **Family Hub** | Multi-Profile | Built | Persistent tabbed view to track schemes for family members |
| 📋 **Application Tracker** | Lifecycle | Built | Track milestones (Submitted, In Review, Approved) & reference IDs |
| 🛡️ **Anti-Middleman Alert** | Guardrail | Built | Notice that government application forms are free of charge |
| 🖨️ **Printable Summary** | Utility | Built | Formatted summary for physical visits to CSC / e-Mitra centres |
| 💎 **Accessible Interface** | UX/Design | Built | Designed for readability with large touch targets (56px) |
| ⚡ **Database Storage** | Infra | Built | Turso cloud database with automatic local SQLite fallback |

---

## 🛠️ Architecture

```
User (Voice/Text)
       │
       ▼
Next.js 14 Speech / Text Interface
       │
       ├─► LLM Parser ──[Timeout / Fallback]──► Local Regex Parser
       │
       ▼
Profile Normalization (Age, Income, Land, Category)
       │
       ▼
Deterministic Rule Engine (engine.ts)
       ├── Likely Eligible
       ├── Need More Info
       └── Not Eligible
       │
       ▼
Turso Cloud Database ◄──► Applications & Family Persistence
```

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Database:** Turso (libSQL Serverless SQLite) for cloud persistence + local SQLite for development
- **Language Processing:** Fast natural language entity extraction with 8-second timeout & local fallback
- **Testing:** Vitest test suite covering engine logic, i18n keys, and encoding

---

## 🔒 Guardrails

- **No Personal Identifiers:** Does not ask for or store Aadhaar numbers, phone numbers, or bank credentials.
- **Non-Deceptive Wording:** Results are strictly presented as "likely eligible"; formal approval remains with the respective government department.
- **Official Sources:** Each scheme links to its official portal (e.g. ssp.rajasthan.gov.in, myscheme.gov.in). Scheme rules and amounts in this demo are sample data and must be confirmed on the official portal before applying.
- **Free Service Reminder:** Reminds applicants that government welfare forms are free of charge.

---

## 💻 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/harshsharma20283-cpu/sahayak.git
cd sahayak/sahayak-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file inside `sahayak-app/`:
```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=your_llm_api_key
LLM_MODEL=openai/gpt-oss-20b

ADMIN_PASSWORD=your_admin_password
SESSION_SECRET=your_session_secret

# Database (optional for local run; falls back to local SQLite)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

### 4. Seed and Run
```bash
npm run seed     # Seeds schemes and rules into database
npm run dev      # Starts local server at http://localhost:3000
```

### 5. Run Tests
```bash
npm test         # Runs full Vitest suite (29 tests)
```

---

## 🌐 Deployment on Vercel

1. Push your repository to GitHub.
2. In Vercel, import the project:
   - **Root Directory:** `sahayak-app`
   - **Framework Preset:** `Next.js`
3. Add environment variables from `.env.local`.
4. Click **Deploy**. The app auto-seeds on first API call if the remote DB is new.
