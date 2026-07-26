# The George Org

Static site for The George Org and its practical tools and experiments.

## Site structure

- `/` — clean org homepage (`index.html` and homepage-only `assets/`)
- `/dtech/` — Dementia Tech Build OS dashboard
- `dtech/projects/` — active project records
- `dtech/carts/` — BOM / shopping-cart cost sheets
- `dtech/log.jsonl` — daily opportunity scans
- `dtech/build.js` — zero-dependency dashboard generator
- `dtech/schema.md` — dashboard data model

## Rebuild the dashboard

Run this from the repository root:

```bash
node dtech/build.js
```

The generator reads the data in `dtech/` and writes only `dtech/index.html`. Dashboard assets remain at `dtech/assets/` and use paths relative to `/dtech/`.

## Local preview

```bash
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

## Hosting notes

- Render’s static site publish directory stays `.` (the repository root).
- The root homepage is served at `thegeorgeorg.org/`.
- The dashboard is served at `thegeorgeorg.org/dtech/`.
- Keep `.nojekyll` at the repository root for static hosting compatibility.
- No npm dependencies
- Works on GitHub Pages / Cloudflare Pages / Netlify / any static host
- Research loop lives in OpenClaw; this repo is the publishable snapshot
