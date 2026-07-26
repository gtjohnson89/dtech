# Build Ideas OS — Data Model

This folder is George’s operating system for dementia-tech opportunity discovery → feasibility → BOM/cost → software plan → build.

## Core loop
1. Daily Facebook group watch (posts + comments)
2. Extract pain points and score ideas
3. Promote strong ideas into **projects**
4. Research market need, competition, distribution
5. Build shopping carts / BOM with vendor links + costs
6. Draft high-level software plans
7. Optional Codex feasibility spikes for software-heavy ideas
8. Dashboard shows everything: pipeline, active projects, carts, solved/unsolved

## Files
- `log.jsonl` — daily scan snapshots (append-only)
- `projects/<slug>.json` — one file per project
- `carts/<slug>.json` — shopping cart / BOM snapshots for a project
- `spikes/<slug>/` — optional Codex feasibility code/notes
- `site/` — generated static dashboard
- `README.md` — runbook + model routing

## Project JSON shape
```json
{
  "id": "big-button-tv-companion",
  "title": "Big-button TV companion",
  "status": "research|planning|prototyping|software-spike|ready-to-build|paused|shipped|killed",
  "priority": 1,
  "created": "YYYY-MM-DD",
  "updated": "YYYY-MM-DD",
  "source": {
    "group": "https://www.facebook.com/groups/397162319426193",
    "firstSeen": "YYYY-MM-DD",
    "themes": ["..."]
  },
  "problem": "...",
  "solution": "...",
  "whyWidespread": "...",
  "targetUser": "...",
  "fitForGeorge": "...",
  "feasibility": {
    "overall": 1-10,
    "hardware": 1-10,
    "software": 1-10,
    "regulatory": 1-10,
    "notes": "..."
  },
  "market": {
    "needSignal": "high|medium|low",
    "competition": ["..."],
    "willingnessToPay": "...",
    "distribution": ["direct-to-caregiver", "etsy", "amazon", "clinic-partner"],
    "profitHypothesis": "..."
  },
  "costs": {
    "prototypeBomUsd": 0,
    "unitBomUsd": 0,
    "targetPriceUsd": 0,
    "grossMarginPct": 0,
    "currency": "USD",
    "asOf": "YYYY-MM-DD",
    "confidence": "estimate|browser-priced|cart-ready"
  },
  "bomCartId": "big-button-tv-companion",
  "softwarePlan": {
    "summary": "...",
    "stack": ["..."],
    "modules": ["..."],
    "mvpScope": ["..."],
    "nonGoals": ["..."],
    "risks": ["..."]
  },
  "solved": ["..."],
  "unsolved": ["..."],
  "nextActions": ["..."],
  "artifacts": {
    "spikeDir": null,
    "docs": [],
    "links": []
  },
  "scores": {
    "impact": 1-10,
    "feasibility": 1-10,
    "profit": 1-10,
    "fit": 1-10,
    "total": 1-10
  },
  "notes": "..."
}
```

## Cart JSON shape
```json
{
  "id": "big-button-tv-companion",
  "projectId": "big-button-tv-companion",
  "title": "Prototype cart",
  "updated": "YYYY-MM-DD",
  "currency": "USD",
  "pricingMode": "browser-research|estimate|manual",
  "vendorsPreferred": ["amazon", "adafruit", "digikey", "other"],
  "items": [
    {
      "name": "...",
      "qty": 1,
      "unitUsd": 0,
      "totalUsd": 0,
      "vendor": "amazon|adafruit|other",
      "url": "https://...",
      "sku": null,
      "notes": "price checked YYYY-MM-DD; may drift",
      "required": true
    }
  ],
  "subtotalUsd": 0,
  "shippingEstimateUsd": 0,
  "taxEstimateUsd": 0,
  "grandTotalUsd": 0,
  "missingItems": [],
  "notes": "..."
}
```

## Status meanings
- `research` — validating need/competition/cost
- `planning` — architecture + BOM nearly ready
- `software-spike` — Codex writing feasibility code
- `prototyping` — physical/software build in progress
- `ready-to-build` — cart + plan good enough to order parts
- `paused` / `shipped` / `killed`

## Model routing (Codex)
- **luna**: dashboard/HTML/CSS/JS generator, simple refactors, formatting
- **terra high**: real software implementation, architecture, spikes
- **sol high**: extra-hard coding OR unusually complex market/research synthesis
- OpenClaw/Grok: daily browse, synthesis, orchestration, project updates
