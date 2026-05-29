import { useEffect, useRef } from 'react'
import type { Recommendation } from './recommendationEngine'
import { Button } from '@/components/ui'
import { IconSearch, IconDoc, IconClose } from '@/components/ui/icons'

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
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="See the Math"
    >
      <div
        className="w-full max-w-lg bg-surface rounded-t-lg overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-hairline rounded-pill" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IconSearch size={20} className="text-navy shrink-0" />
                <h2 className="t-h3 text-navy">See the Math</h2>
              </div>
              <p className="t-body-sm text-muted">{recommendation.headline}</p>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-slate transition-colors -mr-1 ml-3"
              aria-label="Close"
            >
              <IconClose size={18} className="text-muted" />
            </button>
          </div>

          {/* Basis text - plain English */}
          <div className="rounded-md border border-hairline bg-sand-deep p-4 mb-4">
            <p className="t-micro text-muted mb-2">Why this recommendation</p>
            <p className="t-body-sm text-slate leading-relaxed">
              {recommendation.basisText}
            </p>
          </div>

          {/* Formula - monospace, exact numbers */}
          <div className="rounded-md bg-navy p-4 mb-4">
            <p className="t-micro text-muted mb-2">Exact calculation</p>
            <pre className="text-xs text-teal leading-relaxed whitespace-pre-wrap font-mono">
              {recommendation.formula}
            </pre>
          </div>

          {/* IRDAI reference - CG-2 */}
          <div className="rounded-md border border-hairline bg-mint p-3 mb-4">
            <p className="t-micro text-teal-deep mb-1 flex items-center gap-1"><IconDoc size={14} className="text-teal-deep shrink-0" /> IRDAI Guideline Reference</p>
            <p className="t-body-sm text-teal-deep leading-relaxed">
              {recommendation.irdaiRuleReference}
            </p>
          </div>

          {/* Product-specific disclaimer - CG-4 */}
          <div className="rounded-md border border-hairline bg-sand-deep p-3 mb-4">
            <p className="t-micro text-muted mb-1">Important disclaimer</p>
            <p className="text-[11px] text-muted leading-relaxed">
              {recommendation.productDisclaimer}
            </p>
            {recommendation.conditionsApply && (
              <p className="text-[11px] text-muted mt-1 font-semibold">Conditions Apply.</p>
            )}
          </div>

          {/* General compliance disclaimer - CG-2 */}
          <p className="text-[11px] text-muted leading-relaxed">
            For more details on risk factors, terms and conditions, please read the sales brochure
            carefully before concluding a sale. This information is indicative only.
          </p>

          <Button fullWidth onClick={onClose} className="mt-5">
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
