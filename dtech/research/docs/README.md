# d-Tech research ops docs

Working notes for how we research the Facebook group and keep the problem-centric Build OS current.

## Read these first
1. `FB-GROUP-SCRAPE-PLAYBOOK.md` — how to scrape without getting stuck
2. `ERRORS-AND-RESOLUTIONS.md` — every scrape failure we hit and the fix
3. `PROBLEM-CENTRIC-MODEL.md` — how research data is organized
4. `DAILY-RUNBOOK.md` — what the daily cron should do

## Source of truth
- Problems: `../problems/*.json`
- Observations: `../observations/*.jsonl`
- Runs: `../runs/*.json`
- Schema: `../../schema.md`
- Dashboard generator: `../../build.js`

## Hard rules
- Browser profile: OpenClaw isolated only (`profile="openclaw"`)
- No purchases, no Amazon login unless George asks
- Paraphrase caregiver pain points; do not store sensitive private detail / dump full personal stories
- Primary unit = durable caregiver **problems**, not calendar days
- If blocked by login/checkpoint, stop and report once
