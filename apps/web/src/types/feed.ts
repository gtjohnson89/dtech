export type FeedItemType = 'project' | 'idea' | 'problem'

export type FeedItem = {
  key: string
  type: FeedItemType
  id: string
  title: string
  preview: string
  score: number
  userHasVoted: boolean
  href: string
  /** secondary line e.g. status or domain */
  flairExtra?: string
  meta?: string
  /** for sorting "new" */
  sortDate?: string | null
  voteTargetType: 'project' | 'problem' | 'suggestion'
  voteTargetId: string
}
