# The George Org · d-Tech Platform

Public **co-design lab** for practical dementia tech: research lands here, community votes and suggests tweaks, and (soon) Grok proposes product changes you approve.

Also keeps the original static snapshot under `dtech/` for research JSON and the legacy dashboard generator.

## Repo layout

| Path | What |
|------|------|
| `apps/api` | FastAPI + PostgreSQL platform API |
| `apps/web` | React/Vite caregiver-facing UI |
| `dtech/` | Research JSON seed, carts, legacy static dashboard |

## Prerequisites

- Python 3.12+
- Node 20+
- PostgreSQL (local example uses `postgres`/`postgres` on `127.0.0.1:5432`)

Create the database once:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE dtech;"
```

## API setup

```bash
cd apps/api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # if needed
.venv/bin/python -m app.seed
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: http://127.0.0.1:8000/api/health  
- Docs: http://127.0.0.1:8000/docs  
- Admin email(s): set `ADMIN_EMAILS` in `.env` (dev default includes `admin@thegeorgeorg.local`)  
- Magic links in dev: returned in the API response when `DEV_RETURN_MAGIC_LINK=true` (also printed in the API console)

### Bot ingestion

Send `Authorization: Bearer $BOT_SERVICE_TOKEN` (or `X-Bot-Token`):

- `POST /api/bot/observations`
- `PUT /api/bot/problems/{id}`
- `PUT /api/bot/projects/{id}`
- `POST /api/bot/runs`

## Web setup

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5174 — Vite proxies `/api` to the API.
(Port **5174** on purpose so it does not clash with Georgeball on 5173.)

## MVP features

- Browse **projects** and **problems** (seeded from `dtech/`)
- **Magic-link sign-in** (multi-provider identity table ready for Facebook Login)
- **I want this** / **This is my problem too** votes
- **Suggest a tweak** on projects; upvote ideas
- **Admin queue** to hide/spam suggestions
- **Bot API** for research writers

## Coming next (from product plan)

1. **Facebook Login** (Continue with Facebook)
2. Grok **change proposals** you approve
3. Product **branching** into variants

## Legacy static dashboard

Still available:

```bash
node dtech/build.js
python3 -m http.server 8765   # from repo root
```

The platform app is the product going forward; static HTML remains a publishable research snapshot until cutover.
