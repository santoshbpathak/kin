/**
 * BriefCard.tsx — Module 9: KIN News Brief
 *
 * Displays a single article in the feed:
 *   - Category pill + emoji
 *   - Title (2 lines max)
 *   - Summary (3 lines max)
 *   - KIN Impact strip (yellow)
 *   - Read time + date + bookmark toggle
 *   - "Read" indicator when article has been opened
 *
 * Tapping opens the BriefReader drawer.
 */

import { useState } from 'react'
import type { BriefArticle } from './briefData'
import { toggleBookmark } from './briefData'

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
    <article
      onClick={() => onOpen(article)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:bg-gray-50 transition-colors animate-fade-in"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
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
            className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: article.categoryColour }}
          >
            {article.categoryEmoji} {article.categoryLabel}
          </span>
          {article.isNew && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              NEW
            </span>
          )}
          {isRead && (
            <span className="text-[9px] font-medium text-gray-300">✓ Read</span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-extrabold text-gray-900 leading-snug mb-1.5 line-clamp-2"
          style={{ opacity: isRead ? 0.65 : 1 }}
        >
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
          {article.summary}
        </p>

        {/* KIN Impact strip */}
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mb-3">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">
            💡 What this means for you
          </p>
          <p className="text-[11px] text-amber-800 leading-snug">{article.kinImpact}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>⏱ {article.readTime} min read</span>
            <span>·</span>
            <span>{timeAgo(article.date)}</span>
            <span>·</span>
            <span className="truncate max-w-[80px]">{article.source}</span>
          </div>
          <button
            onClick={handleBookmark}
            className="text-lg leading-none transition-transform active:scale-125"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            {bookmarked ? '🔖' : '🔲'}
          </button>
        </div>
      </div>
    </article>
  )
}
