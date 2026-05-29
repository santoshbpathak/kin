import { Button, Card, StateChip } from '@/components/ui'
import { IconShield, IconHealth, IconBuilding, IconDoc, IconSearch, IconCard } from '@/components/ui/icons'
import type { Recommendation } from './recommendationEngine'
import type { ComponentType } from 'react'

const CATEGORY_ICON: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  term_life: IconShield,
  health: IconHealth,
  top_up_health: IconHealth,
  ci_rider: IconHealth,
  income_protection: IconCard,
  pmsby_activation: IconBuilding,
  edli_awareness: IconDoc,
  review_existing: IconSearch,
}

const PRIORITY_LABEL: Record<number, string> = {
  1: '1st priority', 2: '2nd priority', 3: '3rd priority',
  4: '4th priority', 5: '5th priority',
}

// Priority 1 = critical, 2 = moderate, 3+ = mild (no special tone)
function priorityTone(priority: number): 'critical' | 'moderate' | 'positive' {
  if (priority === 1) return 'critical'
  if (priority === 2) return 'moderate'
  return 'positive'
}

// Top stripe colour class per priority
const STRIPE_CLASS: Record<number, string> = {
  1: 'bg-coral',
  2: 'bg-amber',
}

interface RecommendationCardProps {
  rec: Recommendation
  onSeeTheMath: (rec: Recommendation) => void
  onAction: (rec: Recommendation) => void
}

export function RecommendationCard({ rec, onSeeTheMath, onAction }: RecommendationCardProps) {
  const IconComponent = CATEGORY_ICON[rec.productCategory] ?? IconDoc
  const stripeClass = STRIPE_CLASS[rec.priority] ?? 'bg-sand-deep'

  return (
    <Card className="overflow-hidden p-0">
      {/* Priority stripe */}
      <div className={`h-1 ${stripeClass}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-sand-deep">
            <IconComponent size={22} className="text-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StateChip tone={priorityTone(rec.priority)}>
                {PRIORITY_LABEL[rec.priority]}
              </StateChip>
              {rec.estimatedScoreImpact > 0 && (
                <StateChip tone="positive">
                  +{rec.estimatedScoreImpact} pts
                </StateChip>
              )}
            </div>
            <h3 className="t-body font-bold text-navy leading-snug">{rec.headline}</h3>
          </div>
        </div>

        {/* Subtext */}
        <p className="t-body-sm text-muted leading-relaxed mb-3">{rec.subtext}</p>

        {/* Action row — "See the Math" is MANDATORY (CG-2) */}
        <div className="flex gap-2">
          {/* See the Math — always present, non-negotiable per PRD + CG-2 */}
          <Button
            variant="secondary"
            size="md"
            onClick={() => onSeeTheMath(rec)}
            aria-label={`See the Math for ${rec.headline}`}
            className="shrink-0 text-slate border-hairline"
          >
            <IconSearch size={16} className="text-navy mr-1.5 shrink-0" /> See the Math
          </Button>

          {/* Primary action */}
          {rec.productCategory !== 'edli_awareness' && (
            <Button
              size="md"
              className="flex-1"
              onClick={() => onAction(rec)}
            >
              {rec.actionLabel} →
            </Button>
          )}
          {rec.productCategory === 'edli_awareness' && (
            <a
              href="https://unifiedportal-mem.epfindia.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center h-[44px] px-[18px] rounded-sm text-[14px] font-bold bg-teal text-navy transition-transform duration-fast active:scale-[0.985]"
            >
              EPFO Portal →
            </a>
          )}
        </div>

        {/* Conditions apply footer — CG-2 */}
        <p className="t-micro text-muted mt-2.5 leading-relaxed normal-case tracking-normal">
          {rec.conditionsApply && <strong>Conditions apply. </strong>}
          This is indicative only. For details, read the sales brochure before concluding a sale.
        </p>
      </div>
    </Card>
  )
}
