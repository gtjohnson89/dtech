import { useState, type FormEvent } from 'react'
import type { Suggestion } from '../api'
import { VoteRail } from './VoteRail'

type Props = {
  suggestions: Suggestion[]
  onVote: (id: string) => void
  onSubmit: (body: string, tag: string | null) => Promise<void>
  votingId?: string | null
  busy?: boolean
  note?: string | null
}

export function CommentThread({
  suggestions,
  onVote,
  onSubmit,
  votingId,
  busy,
  note,
}: Props) {
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<'top' | 'new'>('top')

  const sorted = [...suggestions].sort((a, b) => {
    if (sort === 'new') return b.created_at.localeCompare(a.created_at)
    return b.vote_count - a.vote_count || b.created_at.localeCompare(a.created_at)
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (body.trim().length < 3) return
    await onSubmit(body.trim(), tag || null)
    setBody('')
    setTag('')
  }

  return (
    <section className="thread">
      <form className="composer" onSubmit={(e) => void handleSubmit(e)}>
        <label className="sr-only" htmlFor="comment-body">
          Share an idea
        </label>
        <textarea
          id="comment-body"
          required
          maxLength={500}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What would make this actually work for your family?"
        />
        <div className="composer-row">
          <div className="chip-row" role="group" aria-label="Optional tag">
            {[
              { v: '', l: 'No tag' },
              { v: 'must_have', l: 'Must-have' },
              { v: 'nice_to_have', l: 'Nice-to-have' },
              { v: 'worry', l: 'Worry' },
            ].map((c) => (
              <button
                key={c.v || 'none'}
                type="button"
                className={`chip ${tag === c.v ? 'on' : ''}`}
                onClick={() => setTag(c.v)}
              >
                {c.l}
              </button>
            ))}
          </div>
          <button className="btn primary" type="submit" disabled={busy || body.trim().length < 3}>
            Comment
          </button>
        </div>
        {note && <p className="ok">{note}</p>}
      </form>

      <div className="thread-head">
        <h2>Discussion ({suggestions.length})</h2>
        <div className="feed-sort">
          <button
            type="button"
            className={`feed-sort-btn ${sort === 'top' ? 'active' : ''}`}
            onClick={() => setSort('top')}
          >
            top
          </button>
          <button
            type="button"
            className={`feed-sort-btn ${sort === 'new' ? 'active' : ''}`}
            onClick={() => setSort('new')}
          >
            new
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="muted feed-status">No comments yet — be the first idea.</p>
      ) : (
        <ul className="comment-list">
          {sorted.map((s) => (
            <li key={s.id} className="comment-row">
              <VoteRail
                compact
                score={s.vote_count}
                voted={s.user_has_voted}
                busy={votingId === s.id}
                onVote={() => onVote(s.id)}
                label="Upvote idea"
              />
              <div className="comment-body">
                <p className="comment-text">{s.body}</p>
                <p className="post-meta">
                  {s.author_display_name || 'Caregiver'}
                  {s.tag ? ` · ${s.tag.replace(/_/g, ' ')}` : ''}
                  {' · '}
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
