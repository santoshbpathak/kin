import { useEffect, useRef } from 'react'
import type { Recommendation } from './recommendationEngine'

interface SeeTheMathDrawerProps {
  recommendation: Recommendation | null
  onClose: () => void
}

export function SeeTheMathDrawer({ recommendation, onClose }: SeeTheMathDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  useEffect(() => {
    if (recommendation) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [recommendation])

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!recommendation) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="See the Math"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden animate-fade-in"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔍</span>
                <h2 className="text-base font-bold text-gray-900">See the Math</h2>
              </div>
              <p className="text-xs text-gray-500">{recommendation.headline}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl ml-3 touch-target flex items-center justify-center -mr-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Basis text — plain English */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Why this recommendation
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {recommendation.basisText}
            </p>
          </div>

          {/* Formula — monospace, exact numbers */}
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Exact calculation
            </p>
            <pre className="text-xs text-green-400 leading-relaxed whitespace-pre-wrap font-mono">
              {recommendation.formula}
            </pre>
          </div>

          {/* IRDAI reference — CG-2 */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 mb-4">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">
              📋 IRDAI Guideline Reference
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              {recommendation.irdaiRuleReference}
            </p>
          </div>

          {/* Product-specific disclaimer — CG-4 */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 mb-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Important disclaimer
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {recommendation.productDisclaimer}
            </p>
            {recommendation.conditionsApply && (
              <p className="text-[11px] text-gray-400 mt-1 font-semibold">Conditions Apply.</p>
            )}
          </div>

          {/* General compliance disclaimer — CG-2 */}
          <p className="text-[11px] text-gray-400 leading-relaxed">
            For more details on risk factors, terms and conditions, please read the sales brochure
            carefully before concluding a sale. This information is indicative only.
          </p>

          <button
            onClick={onClose}
            className="mt-5 w-full py-3.5 rounded-2xl text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
