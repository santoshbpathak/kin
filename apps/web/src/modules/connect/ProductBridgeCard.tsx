/**
 * ProductBridgeCard.tsx — Module 10: Connect Layer
 *
 * Renders a single product bridge card — links to licensed insurer / govt portal.
 * Purchase always opens in a new tab (never inside iframe host app).
 *
 * Compliance:
 *   CG-2: "For more details..." disclaimer + spurious calls note on every card
 *   CG-3: isUlip always false — component refuses to render ULIP cards
 *   CG-4: estimatedCost shown with "indicative / Conditions apply"
 *   CG-5: termsNote shown below CTA (product-specific: term plan no maturity benefit etc.)
 *   CG-8: "KIN is not the insurer" — made explicit on every card
 *   CG-9: External link warning before navigating away
 */

import { useState } from 'react'
import { Button } from '@/components/ui'
import { IconAlert, IconLink, IconDoc } from '@/components/ui/icons'
import type { ProductBridge } from './connectStore'

type Props = {
  product: ProductBridge
  index: number
}

export function ProductBridgeCard({ product, index }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)

  // CG-3: Never render a ULIP card
  if (product.isUlip) return null

  function handleCTA() {
    setShowExitWarning(true)
  }

  function confirmExit() {
    setShowExitWarning(false)
    window.open(product.providerUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div
        className="animate-fade-in overflow-hidden rounded-md border border-hairline bg-surface shadow-card"
        style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
      >
        {/* Colour strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: product.colour }} />

        <div className="p-4">
          {/* Header row */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-2xl"
                style={{ backgroundColor: `${product.colour}18` }}
              >
                {product.emoji}
              </div>
              <div>
                <p className="t-micro mb-0.5" style={{ color: product.colour }}>
                  {product.category}
                  {product.isGovtScheme && (
                    <span className="ml-1.5 rounded-sm bg-mint px-1.5 py-0.5 normal-case tracking-normal text-teal-deep">
                      Govt Scheme
                    </span>
                  )}
                </p>
                <h3 className="t-body font-extrabold text-navy">{product.title}</h3>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="t-body-sm mb-3 leading-relaxed text-slate">{product.description}</p>

          {/* Cost badge */}
          {product.estimatedCost && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-sand-deep px-3 py-1.5">
              <span className="t-body-sm font-bold text-navy">{product.estimatedCost}</span>
              <span className="t-micro font-medium text-muted normal-case tracking-normal">· indicative · Conditions apply</span>
            </div>
          )}

          {/* CG-8: KIN is not the insurer */}
          <p className="t-caption mb-3 leading-relaxed text-muted">
            {product.isGovtScheme
              ? 'This is a government scheme. KIN links you to the official portal - we are not involved in activation or claims.'
              : `KIN is not the insurer. Policies are underwritten by licensed insurers. ${product.providerLabel} is operated independently.`}
          </p>

          {/* CTA */}
          <Button
            size="md"
            fullWidth
            onClick={handleCTA}
            className="mb-3"
            style={{ backgroundColor: product.colour }}
          >
            {product.ctaLabel}
          </Button>

          {/* Expand for terms */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="t-caption flex w-full items-center justify-between font-medium text-muted"
          >
            <span className="flex items-center gap-1.5"><IconDoc size={14} className="shrink-0" /> Terms &amp; Disclaimers</span>
            <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2.5 border-t border-hairline pt-3">
              {/* Product-specific terms note (CG-4/CG-5) */}
              <p className="t-caption leading-relaxed text-slate">{product.termsNote}</p>

              {/* CG-2: Mandatory disclaimer */}
              <p className="t-caption leading-relaxed text-muted">
                For more details on risk factors, terms and conditions, please read the sales
                brochure carefully before concluding a sale. This information is indicative of
                terms, conditions, warranties and exceptions contained in the insurance policy.
              </p>

              {/* CG-2: Spurious calls */}
              <p className="t-caption flex gap-1.5 rounded-sm bg-[rgba(245,166,35,0.12)] p-2 leading-relaxed text-[#7A4F00]">
                <IconAlert size={15} className="mt-px shrink-0 text-amber" />
                <span>
                  IRDAI or its officials do not involve themselves in activities like selling
                  insurance policies, announcing bonuses or investment of premiums. Public receiving
                  such calls are requested to lodge a police complaint.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Exit warning modal ── */}
      {showExitWarning && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={() => setShowExitWarning(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[61] rounded-t-lg bg-surface p-6"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            <div className="mb-5 text-center">
              <div className="mb-3 flex justify-center text-teal-deep">
                <IconLink size={32} />
              </div>
              <h3 className="t-h3 mb-2 text-navy">
                Leaving KIN temporarily
              </h3>
              <p className="t-body-sm leading-relaxed text-slate">
                You are about to visit{' '}
                <span className="font-semibold text-navy">{product.providerLabel}</span>,
                which is operated independently of KIN. Review their terms and privacy policy
                before proceeding.
              </p>
            </div>

            <div className="mb-5 rounded-sm border border-hairline bg-sand-deep p-3">
              <p className="t-caption text-center leading-relaxed text-muted">
                KIN is not the insurer and does not earn commissions from this referral.
                IRDAI does not endorse any specific insurer. Conditions apply.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setShowExitWarning(false)}
              >
                Cancel
              </Button>
              <Button
                size="md"
                className="flex-1"
                onClick={confirmExit}
                style={{ backgroundColor: product.colour }}
              >
                Continue ↗
              </Button>
            </div>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
          `}</style>
        </>
      )}
    </>
  )
}
