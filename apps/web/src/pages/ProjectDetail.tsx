import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Project, type Suggestion } from '../api'
import { CommentThread } from '../components/CommentThread'
import { VoteRail } from '../components/VoteRail'
import { useAuth } from '../auth'

export function ProjectDetail() {
  const { id = '' } = useParams()
  const { requireAuth } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)

  async function load() {
    const [p, s] = await Promise.all([api.project(id), api.suggestions(id)])
    setProject(p)
    setSuggestions(s)
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [id])

  async function onVoteProject() {
    if (!requireAuth(`/p/${id}`)) return
    setBusy(true)
    try {
      const res = await api.vote('project', id)
      setProject((prev) =>
        prev
          ? { ...prev, community_vote_count: res.vote_count, user_has_voted: res.voted }
          : prev,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote failed')
    } finally {
      setBusy(false)
    }
  }

  async function onSuggest(body: string, tag: string | null) {
    if (!requireAuth(`/p/${id}`)) return
    setBusy(true)
    setNote(null)
    try {
      await api.createSuggestion(id, body, tag)
      setNote('Posted — others can upvote your idea.')
      const s = await api.suggestions(id)
      setSuggestions(s)
      setProject((prev) =>
        prev ? { ...prev, suggestion_count: (prev.suggestion_count || 0) + 1 } : prev,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function voteSuggestion(sid: string) {
    if (!requireAuth(`/p/${id}`)) return
    setVotingId(sid)
    try {
      const res = await api.vote('suggestion', sid)
      setSuggestions((list) =>
        list.map((s) =>
          s.id === sid ? { ...s, vote_count: res.vote_count, user_has_voted: res.voted } : s,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed')
    } finally {
      setVotingId(null)
    }
  }

  if (error && !project) return <p className="error page-pad">{error}</p>
  if (!project) return <p className="muted page-pad">Loading…</p>

  return (
    <div className="post-page">
      <Link className="back" to="/projects">
        ← Projects
      </Link>

      <article className="post-hero">
        <VoteRail
          score={project.community_vote_count}
          voted={project.user_has_voted}
          busy={busy}
          onVote={() => void onVoteProject()}
          label="I want this built"
        />
        <div className="post-hero-body">
          <div className="post-flair-row">
            <span className="flair flair-project">project</span>
            <span className="post-sub">{project.status}</span>
          </div>
          <h1>{project.title}</h1>
          {project.homepage_preview && <p className="lede">{project.homepage_preview}</p>}
          <p className="post-meta">
            {project.suggestion_count ?? suggestions.length} comments ·{' '}
            {project.community_vote_count} upvotes
            {project.target_price_usd != null ? ` · target ~$${project.target_price_usd}` : ''}
          </p>
        </div>
      </article>

      {error && <p className="error">{error}</p>}

      <section className="post-content">
        <h2>The problem</h2>
        <p>{project.problem}</p>
      </section>

      <CommentThread
        suggestions={suggestions}
        onVote={(sid) => void voteSuggestion(sid)}
        onSubmit={onSuggest}
        votingId={votingId}
        busy={busy}
        note={note}
      />

      <details className="spec-panel">
        <summary>Product spec &amp; next steps</summary>
        <div className="spec-inner">
          <h3>The idea</h3>
          <p>{project.solution}</p>
          {(project.target_price_usd != null || project.cart_grand_total_usd != null) && (
            <>
              <h3>Rough cost</h3>
              <p>
                {project.target_price_usd != null && <>Target ~${project.target_price_usd}</>}
                {project.cart_grand_total_usd != null && (
                  <> · Prototype cart ~${project.cart_grand_total_usd.toFixed(0)}</>
                )}
              </p>
            </>
          )}
          {project.next_actions && project.next_actions.length > 0 && (
            <>
              <h3>What we need next</h3>
              <ul>
                {project.next_actions.map((a, i) => (
                  <li key={i}>{String(a)}</li>
                ))}
              </ul>
            </>
          )}
          {project.unsolved && project.unsolved.length > 0 && (
            <>
              <h3>Open questions</h3>
              <ul>
                {project.unsolved.map((a, i) => (
                  <li key={i}>{String(a)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </details>

      <p className="disclaimer">
        Co-design feedback only. Not medical advice. Products described here are consumer/care aids
        under exploration, not certified medical devices.
      </p>
    </div>
  )
}
