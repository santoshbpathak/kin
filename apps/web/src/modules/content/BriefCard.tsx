/**
 * BriefCard.tsx — Module 9: KIN News Brief
 *
 * Displays a single article in the feed:
 *   - Category pill + emoji
 *   - Title (2 lines max)
 *   - Summary (3 lines max)
 *   - KIN Impact strip
 *   - Read time + date + bookmark toggle
 *   - "Read" indicator when article has been opened
 *
 * Tapping opens the BriefReader drawer.
 */

import { useState } from 'react'
import type { BriefArticle } from './briefData'
import { toggleBookmark } from './briefData'
import { Button, Card } from '@/components/ui'
import { IconBulb, IconClock, IconCheck, IconBookmark } from '@/components/ui/icons'

function timeAgo(dateISO: string): string {
  const d = new Date(dateISO)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

type Props = {
  article: BriefArticle
  isRead: boolean
  isBookmarked: boolean
  index: number
  onOpen: (article: BriefArticle) => void
  onBookmarkChange: () => void
}

export function BriefCard({
  article, isRead, isBookmarked, index, onOpen, onBookmarkChange,
}: Props) {
  const [bookmarked, setBookmarked] = useState(isBookmarked)

  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation()
    const next = toggleBookmark(article.id)
    setBookmarked(next)
    onBookmarkChange()
  }

  return (
    <Card
      onClick={() => onOpen(article)}
      className="overflow-hidden cursor-pointer active:bg-sand-deep transition-colors animate-fade-in p-0"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      // Card renders a div; article semantics preserved via role below
      role="article"
    >
      {/* Category stripe */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: article.categoryColour }}
      />

      <div className="p-4">
        {/* Category + badges row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span
            className="t-micro px-2.5 py-1 rounded-pill text-white"
            style={{ backgroundColor: article.categoryColour }}
          >
            {article.categoryEmoji} {article.categoryLabel}
          </span>
          {article.isNew && (
            <span className="t-micro px-2 py-0.5 rounded-pill bg-mint text-teal-deep">
              NEW
            </span>
          )}
          {isRead && (
            <span className="t-micro text-muted flex items-center gap-1"><IconCheck size={12} className="text-muted" /> Read</span>
          )}
        </div>

        {/* Title */}
        <h3
          className="t-body font-extrabold text-navy leading-snug mb-1.5 line-clamp-2"
          style={{ opacity: isRead ? 0.65 : 1 }}
        >
          {article.title}
        </h3>

        {/* Summary */}
        <p className="t-body-sm text-muted leading-relaxed line-clamp-3 mb-3">
          {article.summary}
        </p>

        {/* KIN Impact strip */}
        <div className="rounded-sm border border-hairline bg-sand-deep px-3 py-2 mb-3">
          <p className="t-micro text-amber mb-0.5 flex items-center gap-1">
            <IconBulb size={14} className="text-amber shrink-0" /> What this means for you
          </p>
          <p className="t-body-sm text-slate leading-snug">{article.kinImpact}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 t-caption text-muted">
            <span className="flex items-center gap-1"><IconClock size={13} className="text-muted shrink-0" /> {article.readTime} min read</span>
            <span>·</span>
            <span>{timeAgo(article.date)}</span>
            <span>·</span>
            <span className="truncate max-w-[80px]">{article.source}</span>
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={handleBookmark}
            className="text-lg leading-none px-2 h-auto min-h-[44px]"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            <IconBookmark size={20} className={bookmarked ? 'text-teal-deep' : 'text-muted'} />
          </Button>
        </div>
      </div>
    </Card>
  )
}
