import { useMemo, useState } from 'react'
import type { FeedItem } from '../types/feed'
import { PostRow } from './PostRow'

export type FeedSort = 'hot' | 'top' | 'new'

type Props = {
  items: FeedItem[]
  loading?: boolean
  error?: string | null
  defaultSort?: FeedSort
  onVote: (item: FeedItem) => void
  votingKey?: string | null
  emptyMessage?: string
  showSort?: boolean
}

function sortItems(items: FeedItem[], sort: FeedSort): FeedItem[] {
  const copy = [...items]
  if (sort === 'top') {
    copy.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  } else if (sort === 'new') {
    copy.sort((a, b) => {
      const da = a.sortDate || ''
      const db = b.sortDate || ''
      return db.localeCompare(da) || b.score - a.score
    })
  } else {
    // hot: score first, slight boost for ideas with votes, then date
    copy.sort((a, b) => {
      const ha = a.score * 10 + (a.type === 'idea' ? 2 : 0)
      const hb = b.score * 10 + (b.type === 'idea' ? 2 : 0)
      if (hb !== ha) return hb - ha
      const da = a.sortDate || ''
      const db = b.sortDate || ''
      return db.localeCompare(da)
    })
  }
  return copy
}

export function Feed({
  items,
  loading,
  error,
  defaultSort = 'hot',
  onVote,
  votingKey,
  emptyMessage = 'Nothing here yet.',
  showSort = true,
}: Props) {
  const [sort, setSort] = useState<FeedSort>(defaultSort)
  const sorted = useMemo(() => sortItems(items, sort), [items, sort])

  return (
    <div className="feed">
      {showSort && (
        <div className="feed-sort" role="tablist" aria-label="Sort feed">
          {(['hot', 'top', 'new'] as FeedSort[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={sort === s}
              className={`feed-sort-btn ${sort === s ? 'active' : ''}`}
              onClick={() => setSort(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted feed-status">Loading…</p>}
      {!loading && sorted.length === 0 && <p className="muted feed-status">{emptyMessage}</p>}
      <div className="feed-list">
        {sorted.map((item) => (
          <PostRow
            key={item.key}
            item={item}
            busy={votingKey === item.key}
            onVote={onVote}
          />
        ))}
      </div>
    </div>
  )
}
