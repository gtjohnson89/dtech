# Facebook group scrape playbook (d-Tech)

Group: [Technology and aids for dementia](https://www.facebook.com/groups/397162319426193)  
Browser: OpenClaw isolated profile only (`profile="openclaw"`)

## Goal
Collect caregiver pain points and product/workaround signals, then map them into durable **problem** records. Days are just observation timestamps.

## Canonical URLs
- Discussion feed: `https://www.facebook.com/groups/397162319426193`
- Chronological: `https://www.facebook.com/groups/397162319426193?sorting_setting=CHRONOLOGICAL`

Prefer chronological for backfill. Prefer default/new for daily “what’s hot now.”

## Golden path (do this)
1. `browser status` + `tabs`
2. Reuse labeled tab `fb-dtech` if present; else open chronological URL with that label
3. Snapshot/evaluate and confirm:
   - logged in
   - group feed visible
   - **no** `[role=dialog]`
   - URL is group feed, not `/permalink/`
4. Expand truncated text only:
   - click controls whose visible text is exactly `See more`
5. Scroll the feed in page-height steps
6. Harvest `[role=article]` innerText blocks
7. If a dialog/permalink appears at any moment: recover immediately (below)
8. Paraphrase into observations linked to problem IDs
9. Update problem rollups/scores + write a run file
10. Rebuild dashboard: `node dtech/build.js`

## Never do these during scrape
- Leave the browser parked on a post modal/permalink
- Click post body / timestamp / “Open post”
- Click `View more comments`, `View more answers`, or most `View N replies` controls
  - these frequently open the full-post overlay and derail the feed crawl
- Use `profile="user"` / chrome profile
- Purchase anything or log into Amazon unless George explicitly asks

## Safe vs unsafe comment access
### Safe
- Comments already rendered inline under the post in the feed
- `See more` on truncated inline text

### Unsafe / modal-prone
- Full comment expansion controls that navigate into a dedicated post surface
- Any click that changes URL to `/permalink/...`

If deeper comments are truly needed later, open one post intentionally, extract, then **close and return to feed** before touching anything else. Do not chain many post modals.

## Recovery checklist (memorize)
If URL contains `/permalink/` or a dialog is open:
1. Press `Escape`
2. Click Close if still open
3. Navigate back to chronological group URL
4. Confirm `hasDialog=false` and feed articles are present
5. Log the incident in `ERRORS-AND-RESOLUTIONS.md`
6. Continue

## Extraction quality bar
A useful observation includes:
- paraphrased problem (not a raw dump of private story detail)
- rough date/age
- severity 1-5
- engagement proxy (reactions + comments if visible)
- one or more `problemIds`
- `contentHash` for dedupe

## Output files after a run
- append `research/observations/YYYY-MM.jsonl`
- update touched `research/problems/*.json`
- write `research/runs/<date>-...json`
- rebuild site

## Why this exists
The first backfill under-captured because post modals interrupted scrolling and the browser was left dirty. Feed-only scraping with aggressive modal recovery is the reliable method.
