/**
 * BriefReader.tsx — Module 9: KIN News Brief
 *
 * Full-screen article reader — slides up as a bottom sheet.
 * Marks the article as read on open (via markAsRead).
 *
 * Features:
 *   - Swipe-friendly bottom sheet with drag handle
 *   - Category colour header strip
 *   - Full paragraphs with comfortable reading typography
 *   - KIN Impact box (amber)
 *   - Tags row
 *   - Source link (external)
 *   - Compliance footer (CG-2: educational only, not financial advice)
 *   - Share stub (navigator.share if available)
 */

import { useEffect } from 'react'
import type { BriefArticle } from './briefData'
import { markAsRead } from './briefData'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

type Props = {
  article: BriefArticle | null
  onClose: () => void
  onRead: () => void
}

export function BriefReader({ article, onClose, onRead }: Props) {
  // Mark as read + lock body scroll on open
  useEffect(() => {
    if (!article) return
    markAsRead(article.id)
    onRead()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [article, onRead])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!article) return null

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article!.title,
          text: article!.summary,
          url: article!.sourceUrl || window.location.href,
        })
      } catch { /* cancelled */ }
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[92vh] flex flex-col"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Category colour strip */}
        <div
          className="h-1.5 mx-5 rounded-full shrink-0 mb-4"
          style={{ backgroundColor: article.categoryColour }}
        />

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {/* Category + date */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: article.categoryColour }}
            >
              {article.categoryEmoji} {article.categoryLabel}
            </span>
            <span className="text-[10px] text-gray-400">{formatDate(article.date)}</span>
            <span className="text-[10px] text-gray-400">· {article.readTime} min read</span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight mb-4">
            {article.title}
          </h2>

          {/* Full content paragraphs */}
          <div className="space-y-4 mb-5">
            {article.fullContent.map((para, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* KIN Impact */}
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 mb-5">
            <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wide mb-1.5">
              💡 What this means for you
            </p>
            <p className="text-sm font-semibold text-amber-900 leading-relaxed">
              {article.kinImpact}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Source + Share row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Source</p>
              {article.sourceUrl ? (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {article.source} ↗
                </a>
              ) : (
                <p className="text-xs font-semibold text-gray-600">{article.source}</p>
              )}
            </div>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600"
              >
                📤 Share
              </button>
            )}
          </div>

          {/* CG-2: Compliance footer */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              This article is for educational purposes only and does not constitute financial,
              legal, or investment advice. Insurance products mentioned are underwritten by
              licensed insurers. Please consult a licensed insurance advisor or financial planner
              before making any insurance decisions. Conditions apply.
            </p>
          </div>
        </div>

        {/* Close button */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 safe-bottom">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
