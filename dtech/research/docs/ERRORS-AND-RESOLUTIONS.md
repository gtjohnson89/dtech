# Errors and resolutions — d-Tech FB research

Append-only learning log. Every scrape/automation failure should land here with the fix so future runs get sharper.

## How to add an entry
```md
### YYYY-MM-DD — short title
- **Symptom:**
- **Impact:**
- **Root cause:**
- **Resolution:**
- **Prevention rule:**
- **Verified by:**
```

---

### 2026-07-26 — Post modal left open mid-research
- **Symptom:** Browser parked on single-post overlay/permalink (`/permalink/...`) with Close button visible. Feed crawl stopped.
- **Impact:** Backfill under-captured (~12 observations instead of a couple dozen+). George could see the dirty browser state.
- **Root cause:** Clicking into posts / “view more comments-answers” opened overlays. Research continued into dashboard work without recovering the browser first.
- **Resolution:**
  1. `Escape` on affected tabs
  2. Close stray tabs
  3. Navigate to chronological group feed
  4. Confirm no dialog + articles visible
  5. Resume feed-only scrape
- **Prevention rule:** Never leave a research turn with a modal/permalink open. Recover before any non-scrape work.
- **Verified by:** browser tabs/snapshot after recovery; feed-only pass produced 85 unique blocks with `hasDialog=false`.

### 2026-07-26 — “View more comments/answers” opens full post surface
- **Symptom:** evaluate click loop on labels like `View more answers` changed URL to permalink and set `hasDialog=true`.
- **Impact:** Context destroyed / crawl derailed; easy to think comments require modal mode.
- **Root cause:** Facebook treats deep comment expansion as post-open navigation, not inline expand.
- **Resolution:** Only auto-click exact `See more` text. Harvest comments already inline. If deep thread needed, open one post deliberately, extract, close, return to feed.
- **Prevention rule:** Treat `View more comments`, `View more answers`, and most `View N replies` as unsafe during bulk scrape.
- **Verified by:** feed-only evaluate pass with `expandClicks` on See more only stayed on chronological URL.

### 2026-07-26 — Chronological sort / navigation destroyed execution context
- **Symptom:** `page.evaluate` failed with `Execution context was destroyed, most likely because of a navigation`.
- **Impact:** One extraction call aborted.
- **Root cause:** Navigation to chronological URL or permalink replacement tore down the JS world mid-evaluate.
- **Resolution:** Navigate first, wait for settle, then evaluate. If evaluate fails with context destroyed, re-snapshot/re-evaluate once on current target; do not loop blindly.
- **Prevention rule:** No long evaluate that both navigates and scrapes in one fragile chain without recovery branches.
- **Verified by:** later navigate → evaluate sequence succeeded.

### 2026-07-26 — Screenshot vision unavailable on current model
- **Symptom:** image/screenshot analysis failed: model does not support images (`xai/grok-4.5`).
- **Impact:** Could not rely on screenshot vision for feed QA.
- **Root cause:** Active chat model lacks vision.
- **Resolution:** Prefer accessibility snapshot + DOM evaluate text harvest. Use screenshots only as human-facing proof attachments, not as the primary parse path.
- **Prevention rule:** Do not block research on vision. Text/ARIA first.
- **Verified by:** snapshot/evaluate path produced usable post text.

### 2026-07-26 — Wrong local skill path for browser-automation
- **Symptom:** `ENOENT` reading `~/.openclaw/workspace/skills/browser-automation/SKILL.md`.
- **Impact:** Minor delay finding the real skill instructions.
- **Root cause:** Skill lives under OpenClaw package extensions, not workspace skills.
- **Resolution:** Use  
  `~/.npm-global/lib/node_modules/openclaw/dist/extensions/browser/skills/browser-automation/SKILL.md`
- **Prevention rule:** Trust available_skills location fields; don’t invent workspace copies.
- **Verified by:** successful read of package skill path.

### 2026-07-26 — Partial backfill treated as complete too early
- **Symptom:** Problem model shipped from thin evidence; most problems had 1 signal.
- **Impact:** Directionally useful but not a true 14-day deep pass.
- **Root cause:** Switched to implementation after first interrupted scrape instead of finishing extraction.
- **Resolution:** Resume feed-only deep pass; add observations/problems; document honesty about coverage.
- **Prevention rule:** For backfill requests, finish capture depth before declaring research complete. Implementation can proceed in parallel only if scrape state stays clean and a second pass is scheduled immediately.
- **Verified by:** second pass raised observations 12 → 27 and problems 10 → 22.

---

## Standing recovery snippet (mental model)
```
if dialog or /permalink/:
  Escape
  click Close if needed
  open chronological group URL
  assert feed articles > 0 and no dialog
  log error+resolution
  continue
```
