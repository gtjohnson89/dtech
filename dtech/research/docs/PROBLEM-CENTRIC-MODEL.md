# Problem-centric research model

## Decision
Organize research by **durable caregiver problems**, not by day.

Days still matter as:
- observation timestamps
- research-run metadata
- recency inputs to scoring

They are not the primary object on the dashboard.

## Why
Caregivers repeat the same pains across many days:
- TV too complex
- can’t answer calls
- scam-exposed phones
- wandering/exit risk
- wearable compliance failures

Day logs hide recurrence. Problem records accumulate evidence and make ranking obvious.

## Objects
### Problem (`research/problems/<id>.json`)
Canonical theme.
- status: `active | watching | parked`
- domain
- summary
- firstSeen / lastNewSignalAt / evidenceDates
- rollup counts + engagement proxy
- scores: need, opportunity, severity, confidence, buildability, strategicFit
- linked project IDs

### Observation (`research/observations/YYYY-MM.jsonl`)
One paraphrased signal.
- problemIds[]
- severity
- engagement
- contentHash
- runId
- published/observed timestamps

### Run (`research/runs/*.json`)
Ingestion event.
- accessOk
- method
- newObservations
- problemsTouched
- errors/resolutions notes

### Project (`projects/*.json`)
Build candidate linked back via `source.problemIds`.

## Scoring (current practical formula)
Used in backfill scripts; refine later if needed:
- need ≈ signals + severity + engagement + recency
- opportunity ≈ need + buildability + strategicFit
- confidence: thin (≤1), moderate (≤3), strong (>3)

## Promotion rule
Strong unmet problems with good fit may become projects.
Existing projects should remain linked rather than duplicated as “ideas.”

## Dashboard expectations
Research portal:
- ranked problem cards
- collapsed by default
- sort need/opportunity
- show linked projects + recent paraphrases
- bury legacy day logs
