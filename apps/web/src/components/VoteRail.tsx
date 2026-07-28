type Props = {
  score: number
  voted: boolean
  busy?: boolean
  onVote: () => void
  label?: string
  compact?: boolean
}

export function VoteRail({ score, voted, busy, onVote, label = 'Upvote', compact }: Props) {
  return (
    <div className={`vote-rail ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className={`vote-up ${voted ? 'on' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onVote()
        }}
        disabled={busy}
        aria-pressed={voted}
        aria-label={voted ? 'Remove upvote' : label}
        title={voted ? 'Remove upvote' : label}
      >
        ▲
      </button>
      <span className={`vote-score ${voted ? 'on' : ''}`}>{score}</span>
    </div>
  )
}
