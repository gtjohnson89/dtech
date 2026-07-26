# dtech — Dementia Tech Build OS

Public dashboard for The George Org dementia-tech build pipeline.

Intended host path: `thegeorgeorg.org/dtech`

## What’s here
- `index.html` + `assets/` — generated static dashboard
- `projects/` — active project records
- `carts/` — BOM / shopping-cart cost sheets
- `log.jsonl` — daily opportunity scans
- `build.js` — zero-dependency static generator
- `schema.md` — data model

## Rebuild
```bash
node build.js
```

## Local preview
```bash
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

## Notes
- No npm dependencies
- Works on GitHub Pages / Cloudflare Pages / Netlify / any static host
- Research loop lives in OpenClaw; this repo is the publishable snapshot
