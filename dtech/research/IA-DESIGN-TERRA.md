Use the **caregiver problem** as the one primary organizing unit.

A day is an ingestion event, not a research object. A week is only a useful time filter. Projects are responses to problems, not the research structure. This makes repeated signals accumulate where they belong: “can’t reliably answer family calls” keeps gaining evidence whether it appears today, next month, or in a backfill.

## 1. Primary unit: problem

A problem is a stable, plain-language caregiver need with a durable ID, for example:

- `answering-family-calls`
- `tv-remote-and-menu-confusion`
- `scam-safe-phone-access`
- `toileting-splash-and-cleanup`

Each post/comment-derived signal links to one or two problems. Each project links back to one or more problems.

Do not make daily scans or weeks the primary UI. They are provenance and history.

## 2. Secondary views

Keep these as generated views, not separate data silos:

- **Priority needs** — ranked caregiver problems; default Research view.
- **Rising this week** — problems with new signals in the last 7 days.
- **New / needs review** — uncategorized or emerging signals for George’s quick triage.
- **Problem detail** — evidence timeline, paraphrased examples, linked projects, score explanation.
- **Research history** — daily runs, failures, and source coverage; operational/audit view.
- **Project coverage** — problems with projects, and high-priority problems with no project yet.

Weeks are a filter (`7d`, `30d`, `90d`), not folders or canonical records.

## 3. Proposed files

```text
dtech/
  research/
    problems/
      answering-family-calls.json
      tv-remote-and-menu-confusion.json
    observations/
      2026-07.jsonl
    runs/
      2026-07-26.json
    triage.json
    aliases.json
  projects/
    auto-answer-caregiver-call.json
  log.jsonl                    # legacy during migration; then archive/read-only
  build.js
```

Responsibilities:

- `problems/*.json`: curated durable problem records plus generated rollups.
- `observations/YYYY-MM.jsonl`: immutable, one line per unique source signal.
- `runs/YYYY-MM-DD.json`: one cron run’s operational record.
- `triage.json`: signals the classifier could not confidently attach to an existing problem.
- `aliases.json`: controlled mapping for alternate labels and merged IDs.
- `projects/*.json`: unchanged overall, but replace loose `source.themes` with `source.problemIds`.

The source of truth is observations plus curated problem/project metadata. Scores and counts are reproducible derived fields, even if cached in each problem file for static-site simplicity.

## 4. Scoring model

Use two scores. A single score mixes “real pain” with “easy for George to build,” which causes harmful-but-hard needs to disappear.

```text
Need score (0–100)
  45% recurrence: distinct source signals in the last 90 days
  30% severity: caregiver impact, rated 1–5
  25% recency: recent signals decay over about 30 days

Opportunity score (0–100)
  75% need score
  15% buildability: George can plausibly make/test an MVP, 1–5
  10% strategic fit: distribution, skills, cost, and safety fit, 1–5
```

Use a capped logarithmic recurrence calculation, so 20 near-duplicate comments do not swamp every other need:

```text
recurrence = 45 × min(1, log2(1 + uniqueSignals90d) / log2(13))
recency    = 25 × min(1, sum(exp(-ageInDays / 30)) / 3)
severity   = 30 × (averageSeverity / 5)
```

Rules that matter:

- Count unique post/comment source IDs, not scans and not raw word mentions.
- A rescan of the same Facebook item adds zero evidence.
- Let one source link to at most two problems.
- Display `reports`, `last new signal`, and score confidence alongside the score.
- Mark confidence `thin` below three distinct signals; do not pretend a one-day cluster is prevalence.
- Show high-severity problems even when buildability is low.

## 5. Daily cron behavior

The cron should be idempotent:

1. Create a run ID, such as `fb-tech-aids-2026-07-26`.
2. Fetch candidate posts/comments.
3. Derive a stable source ID from Facebook post/comment ID; use a normalized content hash only as fallback.
4. Build an in-memory index of existing observation IDs.
5. For each candidate:
   - existing ID/hash: skip it and record it as a duplicate in the run;
   - new ID/hash: append exactly one observation;
   - classify against the existing problem registry and aliases.
6. Attach only high-confidence existing problem IDs automatically.
7. Send uncertain classifications to `triage.json`; do not let the crawler freely create near-duplicate canonical problems.
8. Recompute affected problem rollups and scores, then run `node dtech/build.js`.

The run file should record fetched/new/duplicate/unclassified counts and any access failure. That makes a failed Facebook scan visible without fabricating “no new research.”

## 6. Dashboard Research IA

Replace “Latest scan + archived scans” as the main Research experience with **Caregiver needs**.

Default mobile layout:

1. **Top needs** — 5–10 compact problem cards, sorted by opportunity score.
   - Title
   - one-sentence caregiver need
   - `12 reports · last new signal 2d ago`
   - Need score and optionally “rising”
   - linked project count / “No build yet”

2. **Filter chips** — `All`, `Rising`, `High impact`, `New this week`, `Unsolved`.

3. **Expanded problem card** — why it matters, score breakdown, recent paraphrased evidence, linked project links, and a small timeline.

4. **Research history** — collapsed lower section with daily scan runs and access status.

Keep Projects as its own portal. Add bidirectional links:

```text
Problem → linked projects
Project → source problems and evidence count
```

For a family-facing surface, avoid raw Facebook author data and long post dumps. Use short paraphrases such as “Caregiver reports that smart-TV menus repeatedly prevent independent use.”

## 7. Migration from `log.jsonl`

1. Preserve the existing `dtech/log.jsonl` unchanged as legacy evidence.
2. Create canonical problem records from the current themes/ideas.
3. Create one low-confidence `legacy-summary` observation for the existing July 26 snapshot. Do not convert five idea rows into five “mentions” of the same problem.
4. Patch existing project files with `source.problemIds`.
5. Backfill the prior 14 days into observations using stable post/comment IDs whenever available.
6. Build a one-time review list for unmatched historical signals; merge those into canonical problems.
7. Update `build.js` to read `research/problems` and observations first; retain old-log rendering only as a temporary Research History fallback.
8. After one week of parallel validation, make `log.jsonl` read-only/archive-only.

The key migration principle: backfill real source items as real observations; treat the existing synthesized daily log as context, not statistical evidence.

## 8. Minimal viable examples

`dtech/research/problems/answering-family-calls.json`

```json
{
  "id": "answering-family-calls",
  "title": "Cannot reliably answer family calls",
  "status": "active",
  "domain": "communication",
  "summary": "A person with dementia cannot consistently answer or manage speakerphone calls from trusted family.",
  "firstSeen": "2026-07-26",
  "lastNewSignalAt": "2026-07-26",
  "aliases": ["auto-answer caregiver call", "speakerphone reach-out"],
  "rollup": {
    "uniqueSignals90d": 1,
    "totalSignals": 1,
    "averageSeverity": 4,
    "linkedProjectIds": ["auto-answer-caregiver-call"]
  },
  "scores": {
    "need": 47,
    "opportunity": 61,
    "buildability": 4,
    "strategicFit": 4,
    "confidence": "thin",
    "calculatedAt": "2026-07-26"
  }
}
```

`dtech/research/observations/2026-07.jsonl`

```json
{"id":"fb:comment:123456","runId":"fb-tech-aids-2026-07-26","observedAt":"2026-07-26T09:15:00-05:00","publishedAt":"2026-07-25T18:40:00-05:00","source":{"group":"https://www.facebook.com/groups/397162319426193","type":"comment","url":"https://www.facebook.com/..."},"problemIds":["answering-family-calls"],"severity":4,"summary":"Caregiver says their relative cannot swipe to answer and family needs dependable speakerphone access.","contentHash":"sha256:..."}
```

`dtech/research/runs/2026-07-26.json`

```json
{
  "id": "fb-tech-aids-2026-07-26",
  "startedAt": "2026-07-26T09:00:00-05:00",
  "completedAt": "2026-07-26T09:18:00-05:00",
  "source": "Technology and aids for dementia",
  "accessOk": true,
  "fetched": 42,
  "newObservations": 6,
  "duplicatesSkipped": 34,
  "sentToTriage": 2,
  "affectedProblemIds": [
    "answering-family-calls",
    "tv-remote-and-menu-confusion"
  ]
}
```

Project patch:

```json
{
  "source": {
    "group": "https://www.facebook.com/groups/397162319426193",
    "firstSeen": "2026-07-26",
    "problemIds": ["answering-family-calls"]
  }
}
```

## 9. Explicit non-goals

- No date-first research archive as the primary product model.
- No database, search service, vector store, or backend.
- No unsupervised “AI clustering” that silently creates or merges canonical problems.
- No automatic project creation from every signal.
- No claim that Facebook-group frequency represents population prevalence.
- No retention of names, profiles, or unnecessary raw caregiver text.
- No attempt to solve every problem before choosing a build; research should surface decisions, not become an encyclopedia.

This is a small static research OS: durable needs at the center, append-only evidence beneath them, and projects explicitly connected to the needs they address.
