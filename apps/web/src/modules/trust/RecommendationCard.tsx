import type { Recommendation } from './recommendationEngine'

const CATEGORY_ICON: Record<string, string> = {
  term_life: '🛡️',
  health: '🏥',
  top_up_health: '💊',
  ci_rider: '🩺',
  income_protection: '💼',
  pmsby_activation: '🏛️',
  edli_awareness: '📋',
  review_existing: '🔍',
}

const PRIORITY_LABEL: Record<number, string> = {
  1: '1st priority', 2: '2nd priority', 3: '3rd priority',
  4: '4th priority', 5: '5th priority',
}

interface RecommendationCardProps {
  rec: Recommendation
  onSeeTheMath: (rec: Recommendation) => void
  onAction: (rec: Recommendation) => void
}

export function RecommendationCard({ rec, onSeeTheMath, onAction }: RecommendationCardProps) {
  const icon = CATEGORY_ICON[rec.productCategory] ?? '📄'
  const priorityColour = rec.priority === 1 ? '#EF4444' : rec.priority === 2 ? '#F97316' : '#6B7280'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Priority stripe */}
      <div className="h-1" style={{ backgroundColor: priorityColour }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${priorityColour}15` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white shrink-0"
                style={{ backgroundColor: priorityColour }}
              >
                {PRIORITY_LABEL[rec.priority]}
              </span>
              {rec.estimatedScoreImpact > 0 && (
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
                  +{rec.estimatedScoreImpact} pts to score
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">{rec.headline}</h3>
          </div>
        </div>

        {/* Subtext */}
        <p className="text-xs text-gray-500 leading-relaxed mb-3">{rec.subtext}</p>

        {/* Action row — "See the Math" is MANDATORY (CG-2) */}
        <div className="flex gap-2">
          {/* See the Math — always present, non-negotiable per PRD + CG-2 */}
          <button
            onClick={() => onSeeTheMath(rec)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors shrink-0"
            aria-label={`See the Math for ${rec.headline}`}
          >
            🔍 See the Math
          </button>

          {/* Primary action */}
          {rec.productCategory !== 'edli_awareness' && (
            <button
              onClick={() => onAction(rec)}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {rec.actionLabel} →
            </button>
          )}
          {rec.productCategory === 'edli_awareness' && (
            <a
              href="https://unifiedportal-mem.epfindia.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold text-center"
              style={{ backgroundColor: '#1B4332' }}
            >
              EPFO Portal →
            </a>
          )}
        </div>

        {/* Conditions apply footer — CG-2 */}
        <p className="text-[10px] text-gray-400 mt-2.5 leading-relaxed">
          {rec.conditionsApply && <strong>Conditions apply. </strong>}
          This is indicative only. For details, read the sales brochure before concluding a sale.
        </p>
      </div>
    </div>
  )
}
