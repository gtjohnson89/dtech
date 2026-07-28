# Care Build Foundry

Interactive demo of **Care Build Foundry** — The George Org · d-Tech operator workbench.

## Product thesis

Operator-controlled build OS: ranked caregiver problems → AI (Grok) proposes product changes → George branches variants → costed, testable prototype kits. Caregivers are signal; George’s workbench is the primary surface. Hero mission in this demo: **TV Companion**.

## How to open

From this folder, serve statically (offline-friendly once fonts are cached):

```bash
cd /workspace/demos/care-build-foundry
python3 -m http.server 8765
```

Then open `http://localhost:8765/` (or open `index.html` directly in a browser).

## Screens (`data-screen`)

| `data-screen`       | Role |
|---------------------|------|
| `build-control`     | Hero workbench — one active build (TV Companion), readiness, cost, blockers; CTA **Review next change** |
| `problem-brief`     | Ranked need, caregiver paraphrases, constraints, linked projects |
| `variant-tree`      | Voice-first / One-button remote / Automatic schedule — selectable branches |
| `proposal-review`   | Grok-labeled proposal; Approve / Revise / Reject updates UI state |
| `build-kit`         | BOM, substitutions, assembly steps; total recalculates |
| `field-trial`       | Protocol, observations, failures; promote variant to baseline |

Secondary portfolio teasers (queue only): Auto-Answer Calls, Church Radio, Scam-Safe Launcher, Night Wandering Light.

## Files

- `index.html` — structure and screens
- `styles.css` — workshop / flight-deck styling (CSS variables)
- `app.js` — navigation, variant/BOM/proposal state
- `README.md` — this file
