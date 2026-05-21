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

function WeekLabel(): JSX.Element {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <span className="text-xs text-gray-400">
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
        <div
          className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-white border-b border-gray-50"
          style={{
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 5%, white) 0%, white 100%)',
          }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                KIN News Brief
              </p>
              <h1 className="text-xl font-extrabold text-gray-900">Financial Wellness</h1>
            </div>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <div
                className="rounded-full px-2.5 py-1 text-xs font-bold text-white mt-1"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {unreadCount} unread
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <WeekLabel />
            {newCount > 0 && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {newCount} new this week
              </span>
            )}
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as BriefCategory | 'all')}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
              style={{
                borderColor: activeCategory === cat.id ? 'var(--color-primary)' : '#E5E7EB',
                backgroundColor: activeCategory === cat.id
                  ? 'color-mix(in srgb, var(--color-primary) 10%, white)'
                  : '#F9FAFB',
                color: activeCategory === cat.id ? 'var(--color-primary)' : '#6B7280',
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* ── Bookmark toggle ── */}
        <div className="px-5 pb-2 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setShowBookmarksOnly(b => !b)}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: showBookmarksOnly ? 'var(--color-primary)' : '#9CA3AF' }}
          >
            🔖 {showBookmarksOnly ? 'All articles' : `Saved (${bookmarkIds.size})`}
          </button>
        </div>

        {/* ── Article feed ── */}
        <div className="px-5 space-y-3">
          {articles.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-5xl">🔖</div>
              <p className="text-sm font-semibold text-gray-500">No bookmarked articles yet</p>
              <p className="text-xs text-gray-400">Tap the 🔲 icon on any article to save it.</p>
              <button
                onClick={() => setShowBookmarksOnly(false)}
                className="text-sm font-semibold underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Show all articles
              </button>
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
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-[10px] text-gray-400 leading-relaxed text-center">
              KIN News Brief is for educational purposes only. Articles do not constitute
              financial advice. Insurance products are underwritten by licensed insurers.
              IRDAI does not endorse any specific insurer. Conditions apply.
            </p>
          </div>
        </div>

        {/* ── Phase 2 teaser ── */}
        <div className="px-5 mt-4">
          <div className="rounded-2xl border border-dashed border-gray-200 p-4 flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-xs font-bold text-gray-600">WhatsApp briefs — coming soon</p>
              <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
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
