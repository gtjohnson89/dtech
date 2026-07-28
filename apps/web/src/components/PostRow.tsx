import { Link } from 'react-router-dom'
import type { FeedItem } from '../types/feed'
import { VoteRail } from './VoteRail'

const FLAIR: Record<FeedItem['type'], string> = {
  project: 'project',
  idea: 'idea',
  problem: 'problem',
}

type Props = {
  item: FeedItem
  busy?: boolean
  onVote: (item: FeedItem) => void
}

export function PostRow({ item, busy, onVote }: Props) {
  return (
    <article className="post-row">
      <VoteRail
        score={item.score}
        voted={item.userHasVoted}
        busy={busy}
        onVote={() => onVote(item)}
        label={
          item.type === 'project'
            ? 'I want this built'
            : item.type === 'problem'
              ? 'This is my problem too'
              : 'Upvote idea'
        }
      />
      <div className="post-body">
        <div className="post-flair-row">
          <span className={`flair flair-${item.type}`}>{FLAIR[item.type]}</span>
          {item.flairExtra && <span className="post-sub">{item.flairExtra}</span>}
        </div>
        <h3 className="post-title">
          <Link to={item.href}>{item.title}</Link>
        </h3>
        {item.preview && <p className="post-preview">{item.preview}</p>}
        {item.meta && <p className="post-meta">{item.meta}</p>}
      </div>
    </article>
  )
}
