import { useCallback, useEffect, useState } from 'react'
import { api, type Project } from '../api'
import { Feed } from '../components/Feed'
import { Sidebar } from '../components/Sidebar'
import { useFeedVote } from '../hooks/useFeedVote'
import type { FeedItem } from '../types/feed'

function toItem(p: Project): FeedItem {
  return {
    key: `project:${p.id}`,
    type: 'project',
    id: p.id,
    title: p.title,
    preview: p.homepage_preview || p.problem || '',
    score: p.community_vote_count,
    userHasVoted: p.user_has_voted,
    href: `/p/${p.id}`,
    flairExtra: p.status,
    meta:
      p.target_price_usd != null
        ? `target ~$${p.target_price_usd} · ${p.community_vote_count} upvotes`
        : `${p.community_vote_count} upvotes`,
    sortDate: null,
    voteTargetType: 'project',
    voteTargetId: p.id,
  }
}

export function Projects() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const projects = await api.projects('priority')
      setItems(projects.map(toItem))
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
          <h1>Projects</h1>
          <p className="muted">Product proposals — upvote what you want built.</p>
        </header>
        <Feed
          items={items}
          loading={loading}
          error={error}
          defaultSort="top"
          onVote={(item) => void vote(item)}
          votingKey={votingKey}
        />
      </div>
      <Sidebar />
    </div>
  )
}
