import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import type { FeedItem } from '../types/feed'

export function useFeedVote(onUpdate: (item: FeedItem, voted: boolean, score: number) => void) {
  const { requireAuth } = useAuth()
  const [votingKey, setVotingKey] = useState<string | null>(null)

  async function vote(item: FeedItem) {
    if (!requireAuth(item.href)) return
    setVotingKey(item.key)
    try {
      const res = await api.vote(item.voteTargetType, item.voteTargetId)
      onUpdate(item, res.voted, res.vote_count)
    } finally {
      setVotingKey(null)
    }
  }

  return { vote, votingKey }
}
