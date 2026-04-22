# Sales Radar 2.0 — Claude Code Instructions

## What is this?
Sales Radar 2.0 is an internal tool for Bawana's sales team.
It automatically discovers, scores, and prepares outreach for B2B leads daily.

## Core Flow
1. Apollo API → fetch companies matching ICP
2. ICP Filter → remove irrelevant companies
3. PRIORITY Engine → score and rank companies
4. Contact Resolver → get contact person from Apollo
5. OpenAI → generate outreach draft per lead

## Stack
- Backend: Python 3.11+ with FastAPI
- Frontend: Next.js 14 with TypeScript
- Database: SQLite (file: ./backend/sales_radar.db)
- APIs: Apollo.io, OpenAI GPT-4

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # runs on port 3000
```

## Environment Variables (see .env.example)
- APOLLO_API_KEY — from Apollo.io account
- OPENAI_API_KEY — from OpenAI platform
- DATABASE_URL — default: ./sales_radar.db

## Key Design Decisions
- ICP is configurable via /settings page (not hardcoded)
- Scoring uses PRIORITY framework: Pain, Relevance, Industry, Opportunity, Reach, ICP fit, Timing, YOY signal
- Dashboard always shows exactly Top 5 leads
- Outreach draft is generated on-demand, not pre-generated
- All leads stored in SQLite for daily history

## Do NOT
- Auto-send any messages (all outreach is manual)
- Store API keys in code
- Scrape LinkedIn (use Apollo contact data only)
