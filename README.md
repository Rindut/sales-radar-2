# Sales Radar 2.0

Daily Lead Intelligence & Outreach Assistant for Bawana Sales Team.

---

## What It Does

1. **Discovery** — Fetches companies from Apollo.io matching your ICP
2. **Scoring** — Ranks companies using the PRIORITY framework (Pain, Relevance, Industry, Opportunity, Reach, ICP fit, Timing)
3. **Contact** — Resolves the right contact person per company via Apollo People Search
4. **Outreach** — Generates personalized draft messages via OpenAI GPT-4o (LinkedIn / Email / WhatsApp)

Output: **5 prioritized leads per day**, with reasoning, contact, and ready-to-send draft.

---

## Setup

### 1. Clone & Configure

```bash
git clone <repo>
cd sales-radar-2
cp .env.example backend/.env
```

Edit `backend/.env`:
```
APOLLO_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at: http://localhost:8000
Docs at: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: http://localhost:3000

---

## Usage

1. Open http://localhost:3000
2. Go to **ICP Settings** — verify industries, size, roles match Bawana's target
3. Click **Refresh Leads** — fetches fresh from Apollo and scores them
4. Click any lead card → see full reasoning, PRIORITY breakdown, contact person
5. Choose channel (LinkedIn / Email / WhatsApp) → click **Generate Draft**
6. Copy the message → paste manually into LinkedIn / Gmail / WhatsApp

---

## API Keys

### Apollo.io
- Sign up at https://www.apollo.io
- Settings → Integrations → API → Create API Key
- Free tier: 50 credits/month (enough for daily use)
- Paid tier recommended for production

### OpenAI
- Sign up at https://platform.openai.com
- API Keys → Create new secret key
- Model used: `gpt-4o`

---

## PRIORITY Scoring Framework

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Pain | 20% | Likelihood the company needs learning solutions |
| Relevance | 20% | How relevant Bawana's offering is |
| Industry | 20% | Priority fit (banking = highest) |
| Opportunity | 15% | Deal size potential based on employee count |
| Reach | 10% | Contactability (website + LinkedIn presence) |
| ICP Fit | 10% | How closely they match configured ICP |
| Timing | 5% | Current signals of need |

Score 0–100. Threshold: 75+ = High, 55–74 = Medium, <55 = Low.

---

## Project Structure

```
sales-radar-2/
├── CLAUDE.md               ← Instructions for Claude Code
├── README.md               ← This file
├── .env.example
├── backend/
│   ├── main.py             ← FastAPI app entry point
│   ├── config.py           ← Env vars + defaults
│   ├── db.py               ← SQLite setup
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py      ← All Pydantic models
│   ├── routers/
│   │   ├── leads.py        ← /leads endpoints
│   │   ├── outreach.py     ← /outreach endpoints
│   │   └── settings.py     ← /settings endpoints
│   └── services/
│       ├── apollo.py       ← Apollo API integration
│       ├── icp_filter.py   ← ICP matching logic
│       ├── scoring.py      ← PRIORITY engine
│       └── ai_outreach.py  ← OpenAI draft generation
└── frontend/
    ├── pages/
    │   ├── index.tsx        ← Dashboard (Top 5)
    │   ├── leads/[id].tsx   ← Lead detail + outreach
    │   └── settings.tsx     ← ICP configuration
    └── lib/
        └── api.ts           ← Typed API client
```

---

## Customization

**Change ICP defaults** → edit `backend/config.py` → `DEFAULT_ICP`

**Change Bawana context for AI** → edit `backend/config.py` → `BAWANA_CONTEXT`

**Adjust scoring weights** → edit `backend/services/scoring.py` → `WEIGHTS`

**Add new data source** → add a new service in `backend/services/`, call it from `routers/leads.py`
