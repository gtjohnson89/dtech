# This Week at Home

**The George Org · d-Tech** product direction demo.

## Thesis

A weekly ritual where caregivers recognise one shared household problem, contribute lived experience in under a minute, and see a practical solution visibly progress toward home testing.

## How to open

From this folder (or any parent), serve statically — no build step:

```bash
cd /workspace/demos/this-week-at-home
python3 -m http.server 8765
```

Then open [http://localhost:8765](http://localhost:8765).

Or open `index.html` directly in a browser (Google Fonts need network; all app logic is local).

## Screens

| `data-screen` | Purpose |
|---|---|
| `home` | Weekly Home — brand hero, featured night-wandering problem, progress trail, CTA |
| `problem` | Problem Room — paraphrase, common moments, needs & constraints |
| `checkin` | 60-Second Check-In — structured me-too + optional note |
| `decision` | Design Decision — doorway sensor vs wearable; selection updates UI |
| `journey` | Build Journey — sketches / updates / testing timeline |
| `household` | My Household — followed problems & secondary household issues |

Navigate via in-app buttons or hash routes: `#home`, `#problem`, `#checkin`, `#decision`, `#journey`, `#household`.

## Files

- `index.html` — markup for all views
- `styles.css` — design system & layout
- `app.js` — SPA navigation and interactions
