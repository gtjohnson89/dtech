import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Problem } from '../api'
import { PostRow } from '../components/PostRow'
import { VoteRail } from '../components/VoteRail'
import { useAuth } from '../auth'
import { useFeedVote } from '../hooks/useFeedVote'
import type { FeedItem } from '../types/feed'

export function ProblemDetail() {
  const { id = '' } = useParams()
  const { requireAuth } = useAuth()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [linked, setLinked] = useState<FeedItem[]>([])

  useEffect(() => {
    api
      .problem(id)
      .then((pr) => {
        setProblem(pr)
        setLinked(
          (pr.linked_projects || []).map((p) => ({
            key: `project:${p.id}`,
            type: 'project' as const,
            id: p.id,
            title: p.title,
            preview: p.homepage_preview || p.problem || '',
            score: p.community_vote_count,
            userHasVoted: p.user_has_voted,
            href: `/p/${p.id}`,
            flairExtra: p.status,
            meta: `${p.community_vote_count} upvotes`,
            voteTargetType: 'project' as const,
            voteTargetId: p.id,
          })),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [id])

  const { vote: voteLinked, votingKey } = useFeedVote((item, voted, score) => {
    setLinked((prev) =>
      prev.map((x) => (x.key === item.key ? { ...x, userHasVoted: voted, score } : x)),
    )
  })

  async function onVote() {
    if (!requireAuth(`/problem/${id}`)) return
    setBusy(true)
    try {
      const res = await api.vote('problem', id)
      setProblem((prev) =>
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

  if (error && !problem) return <p className="error page-pad">{error}</p>
  if (!problem) return <p className="muted page-pad">Loading…</p>

  return (
    <div className="post-page">
      <Link className="back" to="/problems">
        ← Problems
      </Link>

      <article className="post-hero">
        <VoteRail
          score={problem.community_vote_count}
          voted={problem.user_has_voted}
          busy={busy}
          onVote={() => void onVote()}
          label="This is my problem too"
        />
        <div className="post-hero-body">
          <div className="post-flair-row">
            <span className="flair flair-problem">problem</span>
            <span className="post-sub">
              {problem.domain || 'care'} · {problem.status}
            </span>
          </div>
          <h1>{problem.title}</h1>
          <p className="lede">{problem.summary}</p>
          <p className="post-meta">
            research need {problem.need ?? '—'} · opportunity {problem.opportunity ?? '—'} ·{' '}
            {problem.community_vote_count} me-too
          </p>
        </div>
      </article>

      <section className="post-content">
        <h2>Linked projects</h2>
        {linked.length > 0 ? (
          <div className="feed-list">
            {linked.map((item) => (
              <PostRow
                key={item.key}
                item={item}
                busy={votingKey === item.key}
                onVote={(it) => void voteLinked(it)}
              />
            ))}
          </div>
        ) : (
          <p className="muted">No project linked yet — strong candidate for a future build.</p>
        )}
      </section>

      <section className="post-content">
        <h2>Recent caregiver signals</h2>
        <p className="muted">Paraphrased from research — not full personal stories.</p>
        <ul className="obs-list">
          {(problem.observations || []).map((o) => (
            <li key={o.id}>
              <span className="meta">
                {o.observed_at ? new Date(o.observed_at).toLocaleDateString() : '—'}
              </span>
              <p>{o.paraphrase}</p>
            </li>
          ))}
          {(problem.observations || []).length === 0 && (
            <li className="muted">No observations loaded yet.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
