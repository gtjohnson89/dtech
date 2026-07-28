import { useCallback, useEffect, useState } from 'react'
import { api, type Problem } from '../api'
import { Feed } from '../components/Feed'
import { Sidebar } from '../components/Sidebar'
import { useFeedVote } from '../hooks/useFeedVote'
import type { FeedItem } from '../types/feed'

function toItem(pr: Problem): FeedItem {
  return {
    key: `problem:${pr.id}`,
    type: 'problem',
    id: pr.id,
    title: pr.title,
    preview: pr.summary,
    score: pr.community_vote_count,
    userHasVoted: pr.user_has_voted,
    href: `/problem/${pr.id}`,
    flairExtra: pr.domain || undefined,
    meta: `need ${pr.need ?? '—'} · opportunity ${pr.opportunity ?? '—'}`,
    sortDate: pr.last_new_signal_at || null,
    voteTargetType: 'problem',
    voteTargetId: pr.id,
  }
}

export function Problems() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const problems = await api.problems('need')
      setItems(problems.map(toItem))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const { vote, votingKey } = useFeedVote((item, voted, score) => {
    setItems((prev) =>
      prev.map((x) => (x.key === item.key ? { ...x, userHasVoted: voted, score } : x)),
    )
  })

  return (
    <div className="layout-2col">
      <div className="feed-col">
        <header className="feed-intro">
          <h1>Problems</h1>
          <p className="muted">Caregiver pains from research — mark “me too” with an upvote.</p>
        </header>
        <Feed
          items={items}
          loading={loading}
          error={error}
          defaultSort="hot"
          onVote={(item) => void vote(item)}
          votingKey={votingKey}
        />
      </div>
      <Sidebar />
    </div>
  )
}
