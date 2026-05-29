/**
 * ContentPage.tsx — Module 9: KIN News Brief
 *
 * Route: /brief
 *
 * Layout:
 *   1. Header — "KIN News Brief" + week label + unread count
 *   2. Category filter chips (horizontal scroll)
 *   3. Article feed — BriefCard list
 *   4. BriefReader drawer (bottom sheet) when article is open
 *   5. Empty state (bookmarks filter with no bookmarks)
 *
 * Read state and bookmarks persisted in localStorage.
 * Phase 2: replaced by API-fetched articles with Workbox background sync.
 */

import { useState, useMemo, useCallback } from 'react'
import { BriefCard } from './BriefCard'
import { BriefReader } from './BriefReader'
import {
  BRIEF_ARTICLES,
  CATEGORIES,
  getReadArticles,
  getBookmarkedArticles,
  type BriefArticle,
  type BriefCategory,
} from './briefData'
import { Button, Card, ChoiceChip } from '@/components/ui'
import { IconBookmark, IconBell } from '@/components/ui/icons'

function WeekLabel(): JSX.Element {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <span className="t-caption text-muted">
      {fmt(weekStart)} – {fmt(weekEnd)}
    </span>
  )
}

export function ContentPage() {
  const [activeCategory, setActiveCategory] = useState<BriefCategory | 'all'>('all')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [openArticle, setOpenArticle] = useState<BriefArticle | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(getReadArticles)
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(getBookmarkedArticles)

  // Refresh read/bookmark state
  const refreshRead = useCallback(() => setReadIds(getReadArticles()), [])
  const refreshBookmarks = useCallback(() => setBookmarkIds(getBookmarkedArticles()), [])

  // Filtered + sorted articles (new first)
  const articles = useMemo(() => {
    let list = [...BRIEF_ARTICLES]
    if (activeCategory !== 'all') {
      list = list.filter(a => a.category === activeCategory)
    }
    if (showBookmarksOnly) {
      list = list.filter(a => bookmarkIds.has(a.id))
    }
    // Sort: unread + new first, then by date desc
    list.sort((a, b) => {
      const aScore = (!readIds.has(a.id) ? 2 : 0) + (a.isNew ? 1 : 0)
      const bScore = (!readIds.has(b.id) ? 2 : 0) + (b.isNew ? 1 : 0)
      if (aScore !== bScore) return bScore - aScore
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    return list
  }, [activeCategory, showBookmarksOnly, bookmarkIds, readIds])

  const unreadCount = BRIEF_ARTICLES.filter(a => !readIds.has(a.id)).length
  const newCount = BRIEF_ARTICLES.filter(a => a.isNew).length

  return (
    <>
      <div className="flex flex-col pb-10">
        {/* ── Header ── */}
        <div className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-surface border-b border-hairline">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="t-micro text-muted">KIN News Brief</p>
              <h1 className="t-h2 text-navy">Financial Wellness</h1>
            </div>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="rounded-pill px-3 py-1 t-caption font-bold bg-teal text-navy mt-1">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <WeekLabel />
            {newCount > 0 && (
              <span className="t-micro px-2 py-0.5 rounded-pill bg-mint text-teal-deep">
                {newCount} new this week
              </span>
            )}
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <ChoiceChip
              key={cat.id}
              selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id as BriefCategory | 'all')}
              className="shrink-0"
            >
              {cat.emoji} {cat.label}
            </ChoiceChip>
          ))}
        </div>

        {/* ── Bookmark toggle ── */}
        <div className="px-5 pb-2 flex items-center justify-between">
          <p className="t-caption text-muted">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowBookmarksOnly(b => !b)}
            className={showBookmarksOnly ? 'text-teal-deep' : 'text-muted'}
          >
            <IconBookmark size={16} className="text-current shrink-0" /> {showBookmarksOnly ? 'All articles' : `Saved (${bookmarkIds.size})`}
          </Button>
        </div>

        {/* ── Article feed ── */}
        <div className="px-5 space-y-3">
          {articles.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <IconBookmark size={48} className="text-muted mx-auto" />
              <p className="t-body font-semibold text-slate">No bookmarked articles yet</p>
              <p className="t-body-sm text-muted">Tap the <span className="inline-block w-3 h-3 rounded-sm bg-muted align-middle" /> icon on any article to save it.</p>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowBookmarksOnly(false)}
              >
                Show all articles
              </Button>
            </div>
          ) : (
            articles.map((article, i) => (
              <BriefCard
                key={article.id}
                article={article}
                isRead={readIds.has(article.id)}
                isBookmarked={bookmarkIds.has(article.id)}
                index={i}
                onOpen={a => setOpenArticle(a)}
                onBookmarkChange={refreshBookmarks}
              />
            ))
          )}
        </div>

        {/* ── CG-2 footer ── */}
        <div className="px-5 mt-5">
          <Card className="p-3">
            <p className="t-caption text-muted leading-relaxed text-center">
              KIN News Brief is for educational purposes only. Articles do not constitute
              financial advice. Insurance products are underwritten by licensed insurers.
              IRDAI does not endorse any specific insurer. Conditions apply.
            </p>
          </Card>
        </div>

        {/* ── Phase 2 teaser ── */}
        <div className="px-5 mt-4">
          <div className="rounded-md border border-dashed border-hairline-strong p-4 flex items-center gap-3">
            <IconBell size={24} className="text-navy shrink-0" />
            <div>
              <p className="t-body-sm font-bold text-navy">WhatsApp briefs - coming soon</p>
              <p className="t-caption text-muted leading-snug mt-0.5">
                Get the top 3 financial wellness stories delivered to WhatsApp every Monday morning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Article reader drawer ── */}
      <BriefReader
        article={openArticle}
        onClose={() => setOpenArticle(null)}
        onRead={refreshRead}
      />
    </>
  )
}
