/**
 * DisclaimerBanner — CG-2 compliance.
 * Renders the correct mandatory disclaimer set based on screen context.
 * Font size enforced at minimum text-[11px] (≈11px, ~ Times New Roman 11pt equivalent).
 */

export type DisclaimerContext =
  | 'recommendation'   // product recommendation cards
  | 'purchase'         // connect/purchase screens — adds spurious calls warning
  | 'coverage-display' // hidden coverage amounts
  | 'general'          // generic screens

interface DisclaimerBannerProps {
  context: DisclaimerContext
  /** If a tax benefit is mentioned on this screen */
  hasTaxMention?: boolean
}

export function DisclaimerBanner({ context, hasTaxMention = false }: DisclaimerBannerProps) {
  return (
    <div className="space-y-1.5">
      {/* Always present on recommendation/purchase screens */}
      {(context === 'recommendation' || context === 'purchase') && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          For more details on risk factors, terms and conditions, please read the sales brochure
          carefully before concluding a sale.
        </p>
      )}

      {/* Always present when any insurance amount or product is shown */}
      <p className="text-[11px] text-gray-400 leading-relaxed">
        This information is indicative of the terms, conditions, warranties and exceptions
        contained in the insurance policy. <strong>Conditions apply.</strong>
      </p>

      {/* Tax benefit mention */}
      {hasTaxMention && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Tax benefits are as per prevailing laws and subject to change from time to time.
        </p>
      )}

      {/* Spurious calls warning — required on all purchase-intent screens */}
      {context === 'purchase' && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-2.5 mt-1">
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <strong>Beware of spurious calls and fictitious/fraudulent offers:</strong> IRDAI or
            its officials do not involve in activities like selling insurance policies, announcing
            bonus or investment of premiums. Public receiving such calls are requested to lodge a
            police complaint.
          </p>
        </div>
      )}
    </div>
  )
}
