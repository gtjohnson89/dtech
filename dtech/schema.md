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
- `research/problems/<slug>.json` — canonical durable caregiver problems; this is the primary Research organizing unit
- `research/observations/*.jsonl` — dated evidence paraphrases linked to problems by `problemIds`
- `research/runs/<id>.json` — ingestion/run metadata such as access status, timestamps, and touched problems
- `projects/<slug>.json` — one file per project
- `carts/<slug>.json` — shopping cart / BOM snapshots for a project
- `spikes/<slug>/` — optional Codex feasibility code/notes
- `index.html` + `assets/` — generated static dashboard
- `README.md` — runbook + model routing

## Problem-centric research model
Problems are durable caregiver themes ranked by `scores.need` or `scores.opportunity`. A problem may accumulate observations across many dates and may link to zero or more projects through `rollup.linkedProjectIds`; projects also declare the relationship in `source.problemIds`. Research runs and observation dates explain where the evidence came from, but days/runs are ingestion metadata rather than the primary dashboard UX. `log.jsonl` remains an optional legacy history fallback and is shown separately from the problem list.

### Problem JSON shape
```json
{
  "id": "tv-remote-and-menu-confusion",
  "title": "TV is too complex; need power/volume/one-channel only",
  "status": "active|watching|parked",
  "domain": "entertainment",
  "summary": "...",
  "firstSeen": "YYYY-MM-DD",
  "lastNewSignalAt": "YYYY-MM-DD",
  "evidenceDates": ["YYYY-MM-DD"],
  "rollup": {
    "uniqueSignals": 3,
    "totalSignals": 3,
    "averageSeverity": 4.67,
    "engagementProxy": 28,
    "linkedProjectIds": ["big-button-tv-companion"]
  },
  "scores": {
    "need": 0,
    "opportunity": 0,
    "severity": 0,
    "confidence": "thin|moderate|strong"
  }
}
```

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
    "themes": ["..."],
    "problemIds": ["tv-remote-and-menu-confusion"]
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
