# Daily d-Tech research runbook

Cron: `dementia-tech-build-os-daily` @ 08:00 America/Chicago  
Job id: `8b3e14d4-c78b-4d54-9254-8bf14c0ca0b2`  
Repo: `/home/george/Projects/dtech`

## Before scraping
1. Read `FB-GROUP-SCRAPE-PLAYBOOK.md`
2. Skim newest entries in `ERRORS-AND-RESOLUTIONS.md`
3. Start/reuse OpenClaw browser tab `fb-dtech`

## Scrape (last 24–36h, or deeper if backfilling)
1. Open group feed (chronological if backfill)
2. Confirm logged in + no modal
3. Expand only `See more`
4. Scroll and harvest article text
5. Recover immediately on modal/permalink
6. If access blocked: message George once with exact blocker and stop

## Write data
1. Map signals onto existing problems first
2. Create a new problem only for a clearly distinct recurring pain
3. Append observations with contentHash dedupe
4. Update problem rollups/scores/dates
5. Write/update today’s run JSON
6. Link/create projects only when strong + good fit
7. Cost/cart updates only if a project meaningfully moved
8. Rebuild: `node dtech/build.js`

## Alert policy
Message George only if:
- access failed, or
- a strong problem/project moved meaningfully

Otherwise finish silently after log + rebuild.

## Docs maintenance
If anything fails or a new workaround is discovered:
- append `ERRORS-AND-RESOLUTIONS.md`
- update playbook if the golden path changed
