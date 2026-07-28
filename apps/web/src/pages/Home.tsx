import { useCallback, useEffect, useState } from 'react'
import { api, type Problem, type Project, type Suggestion } from '../api'
import { Feed } from '../components/Feed'
import { Sidebar } from '../components/Sidebar'
import { useFeedVote } from '../hooks/useFeedVote'
import type { FeedItem } from '../types/feed'

function projectToItem(p: Project): FeedItem {
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
    meta: `${p.suggestion_count ?? 0} comments · ${p.community_vote_count} upvotes`,
    sortDate: null,
    voteTargetType: 'project',
    voteTargetId: p.id,
  }
}

function problemToItem(pr: Problem): FeedItem {
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
    meta: `research need ${pr.need ?? '—'} · ${pr.community_vote_count} me-too`,
    sortDate: pr.last_new_signal_at || pr.first_seen || null,
    voteTargetType: 'problem',
    voteTargetId: pr.id,
  }
}

function ideaToItem(s: Suggestion, projectTitle: string): FeedItem {
  return {
    key: `idea:${s.id}`,
    type: 'idea',
    id: s.id,
    title: s.body.length > 100 ? `${s.body.slice(0, 97)}…` : s.body,
    preview: `on ${projectTitle}`,
    score: s.vote_count,
    userHasVoted: s.user_has_voted,
    href: `/p/${s.project_id}`,
    flairExtra: s.tag?.replace(/_/g, ' ') || undefined,
    meta: `${s.author_display_name || 'Caregiver'} · ${new Date(s.created_at).toLocaleDateString()}`,
    sortDate: s.created_at,
    voteTargetType: 'suggestion',
    voteTargetId: s.id,
  }
}

export function Home() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [topProblems, setTopProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projects, problems] = await Promise.all([
        api.projects('votes'),
        api.problems('need'),
      ])
      setTopProblems(problems)

      // Enrich projects with suggestion counts for meta
      const detailed = await Promise.all(
        projects.map(async (p) => {
          try {
            const full = await api.project(p.id)
            const suggestions = await api.suggestions(p.id)
            return { project: { ...p, suggestion_count: full.suggestion_count }, suggestions }
          } catch {
            return { project: p, suggestions: [] as Suggestion[] }
          }
        }),
      )

      const feed: FeedItem[] = []
      for (const { project, suggestions } of detailed) {
        feed.push(projectToItem(project))
        for (const s of suggestions) {
          if (s.vote_count > 0 || suggestions.length <= 3) {
            feed.push(ideaToItem(s, project.title))
          }
        }
      }
      // Top problems that aren't already drowning the feed — take top 8 by need
      for (const pr of problems.slice(0, 8)) {
        feed.push(problemToItem(pr))
      }
      setItems(feed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const { vote, votingKey } = useFeedVote((item, voted, score) => {
    setItems((prev) =>
      prev.map((x) =>
        x.key === item.key ? { ...x, userHasVoted: voted, score } : x,
      ),
    )
  })

  return (
    <div className="layout-2col">
      <div className="feed-col">
        <header className="feed-intro">
          <h1>c/dtech</h1>
          <p className="muted">
            Upvote products worth building. Comment with what would actually help your family.
          </p>
        </header>
        <Feed
          items={items}
          loading={loading}
          error={error}
          onVote={(item) => void vote(item)}
          votingKey={votingKey}
          emptyMessage="No posts yet — seed data may still be loading."
        />
      </div>
      <Sidebar topProblems={topProblems} />
    </div>
  )
}
