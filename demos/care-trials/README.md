# Care Trials — interactive demo

**The George Org · d-Tech** product-direction demo: turn recurring dementia-care problems into short, low-risk home trials that caregivers try, evaluate, and collectively improve into proven product variants.

## Thesis

Caregivers already improvise around phone distress, TV confusion, missed voices, falls worry, and harder evenings. Care Trials packages those moments as **7-day recipes** — setup, effort, safety, and what success looks like — then folds check-ins into shared learning and a workbench decision: **refine**, **branch**, or **stop**.

## Open locally (offline-friendly)

Relative paths only. Serve this folder with any static server:

```bash
cd /workspace/demos/care-trials
python3 -m http.server 8765
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Or open `index.html` directly in a browser (hash navigation still works). Google Fonts need network on first load; layout remains usable if fonts fall back.

## Screens (`data-screen`)

| `data-screen` | View |
|---|---|
| `care-moments-home` | Brand hero + care-moment choices |
| `problem-portrait` | Problem framing & paraphrased evidence |
| `trial-plan` | 7-day trusted-caller recipe |
| `quick-checkin` | Helped / No difference / Made things harder |
| `what-families-learned` | Outcome patterns + two variants |
| `georges-workbench` | Evidence → refine / branch / stop |

Navigate with in-app buttons or hashes: `#home`, `#portrait`, `#trial`, `#checkin`, `#learned`, `#workbench`.

## Stack

Vanilla HTML, CSS, and JS. No build step, no backend, no React.
