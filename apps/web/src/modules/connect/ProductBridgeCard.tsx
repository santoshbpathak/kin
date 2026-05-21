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
      <article
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in"
        style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
      >
        {/* Colour strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: product.colour }} />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${product.colour}18` }}
              >
                {product.emoji}
              </div>
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: product.colour }}
                >
                  {product.category}
                  {product.isGovtScheme && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-green-100 text-green-700 normal-case tracking-normal">
                      Govt Scheme
                    </span>
                  )}
                </p>
                <h3 className="text-sm font-extrabold text-gray-900">{product.title}</h3>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3">{product.description}</p>

          {/* Cost badge */}
          {product.estimatedCost && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 border border-gray-100 px-3 py-1.5 mb-3">
              <span className="text-xs font-bold text-gray-700">{product.estimatedCost}</span>
              <span className="text-[9px] text-gray-400 font-medium">· indicative · Conditions apply</span>
            </div>
          )}

          {/* CG-8: KIN is not the insurer */}
          <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
            {product.isGovtScheme
              ? 'This is a government scheme. KIN links you to the official portal — we are not involved in activation or claims.'
              : `KIN is not the insurer. Policies are underwritten by licensed insurers. ${product.providerLabel} is operated independently.`}
          </p>

          {/* CTA */}
          <button
            onClick={handleCTA}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white mb-3 transition-opacity active:opacity-80"
            style={{ backgroundColor: product.colour }}
          >
            {product.ctaLabel}
          </button>

          {/* Expand for terms */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between text-[11px] text-gray-400 font-medium"
          >
            <span>📋 Terms & Disclaimers</span>
            <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2.5 border-t border-gray-50 pt-3">
              {/* Product-specific terms note (CG-4/CG-5) */}
              <p className="text-[10px] text-gray-500 leading-relaxed">{product.termsNote}</p>

              {/* CG-2: Mandatory disclaimer */}
              <p className="text-[10px] text-gray-400 leading-relaxed">
                For more details on risk factors, terms and conditions, please read the sales
                brochure carefully before concluding a sale. This information is indicative of
                terms, conditions, warranties and exceptions contained in the insurance policy.
              </p>

              {/* CG-2: Spurious calls */}
              <p className="text-[10px] text-amber-700 leading-relaxed bg-amber-50 rounded-lg p-2">
                ⚠️ IRDAI or its officials do not involve themselves in activities like selling
                insurance policies, announcing bonuses or investment of premiums. Public receiving
                such calls are requested to lodge a police complaint.
              </p>
            </div>
          )}
        </div>
      </article>

      {/* ── Exit warning modal ── */}
      {showExitWarning && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowExitWarning(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6"
               style={{ animation: 'slideUp 0.25s ease-out' }}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🔗</div>
              <h3 className="text-base font-extrabold text-gray-900 mb-2">
                Leaving KIN temporarily
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                You are about to visit{' '}
                <span className="font-semibold text-gray-700">{product.providerLabel}</span>,
                which is operated independently of KIN. Review their terms and privacy policy
                before purchasing.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-5">
              <p className="text-[10px] text-gray-500 leading-relaxed text-center">
                KIN is not the insurer and does not earn commissions from this referral.
                IRDAI does not endorse any specific insurer. Conditions apply.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: product.colour }}
              >
                Continue ↗
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
      )}
    </>
  )
}
