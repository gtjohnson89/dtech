# d-Tech platform direction demos

Three siloed product-direction prototypes for The George Org d-Tech platform.

| Direction | Thesis | Path |
|-----------|--------|------|
| **Care Trials** | Short home trials that turn recurring care problems into proven product variants | [`care-trials/`](./care-trials/) |
| **This Week at Home** | Weekly caregiver ritual: recognize one shared problem, contribute in 60s, see progress | [`this-week-at-home/`](./this-week-at-home/) |
| **Care Build Foundry** | Operator build OS: Grok proposals, variant branches, costed prototype kits | [`care-build-foundry/`](./care-build-foundry/) |

## Mobile presentation

Open the swipe deck (best on a phone):

[`presentation/index.html`](./presentation/index.html)

It includes live-demo links and mobile screenshots of each flow.

## Run locally

From this folder:

```bash
python3 -m http.server 8765
```

Then visit:

- http://127.0.0.1:8765/presentation/
- http://127.0.0.1:8765/care-trials/
- http://127.0.0.1:8765/this-week-at-home/
- http://127.0.0.1:8765/care-build-foundry/

## How these were made

1. GPT strategy agents proposed three distinct bets from the existing Terra problem-centric model and platform MVP.
2. Grok agents built each interactive demo in isolation (vanilla HTML/CSS/JS).
3. Headless Chrome captured mobile (390×844) screenshots into `screenshots/` and `presentation/img/`.
