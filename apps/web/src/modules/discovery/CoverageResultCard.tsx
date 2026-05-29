/**
 * CoverageResultCard.tsx — Module 6
 *
 * Displays a single discovered coverage item.
 *
 * Status colours:
 *   active         → positive (mint/teal-deep)
 *   likely_active  → positive (mint/teal-deep, with "Verify" nudge)
 *   check_required → moderate (amber)
 *   not_activated  → moderate (amber, actionable gap)
 *   not_applicable → muted (greyed out)
 *
 * Compliance (CG-4, CG-2):
 *   - All amounts shown with "Conditions apply"
 *   - complianceNote rendered in 10px text at card bottom
 *   - No premium-rate promises or return guarantees
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DiscoveredCoverage, CoverageStatus } from './discoveryEngine'
import { Button, StateChip } from '@/components/ui'
import { IconCheckCircle, IconSearch, IconAlert, IconGift } from '@/components/ui/icons'

// ── Status config ───────────────────────────────────────────────
const STATUS_CONFIG: Record<
  CoverageStatus,
  { label: string; tone: 'positive' | 'moderate' | 'critical'; accentBg: string; borderClass: string; icon: ReactNode }
> = {
  active: {
    label: 'Active',
    tone: 'positive',
    accentBg: 'bg-mint',
    borderClass: 'border-teal/30',
    icon: <IconCheckCircle size={14} className="text-teal-deep" />,
  },
  likely_active: {
    label: 'Likely Active',
    tone: 'positive',
    accentBg: 'bg-mint',
    borderClass: 'border-teal/30',
    icon: <span className="inline-block w-2 h-2 rounded-full bg-teal-deep shrink-0" />,
  },
  check_required: {
    label: 'Check Required',
    tone: 'moderate',
    accentBg: 'bg-[rgba(245,166,35,0.08)]',
    borderClass: 'border-amber/30',
    icon: <IconSearch size={14} className="text-amber" />,
  },
  not_activated: {
    label: 'Not Activated',
    tone: 'moderate',
    accentBg: 'bg-[rgba(245,166,35,0.08)]',
    borderClass: 'border-amber/30',
    icon: <IconAlert size={14} className="text-amber" />,
  },
  not_applicable: {
    label: 'Not Applicable',
    tone: 'moderate',
    accentBg: 'bg-sand-deep',
    borderClass: 'border-hairline',
    icon: '—',
  },
}

function formatCover(amount: number): string {
  if (amount === 0) return 'Variable'
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(0)} Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(0)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatPremium(amount: number): string {
  if (amount === 0) return 'Free / Included'
  return `₹${amount.toLocaleString('en-IN')}/year`
}

type Props = {
  coverage: DiscoveredCoverage
  index: number
  onAction: (coverage: DiscoveredCoverage) => void
}

export function CoverageResultCard({ coverage, index, onAction }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[coverage.status]

  const animDelay = `${index * 80}ms`

  return (
    <div
      className={`rounded-md border overflow-hidden shadow-card animate-fade-in ${cfg.accentBg} ${cfg.borderClass}`}
      style={{
        animationDelay: animDelay,
        animationFillMode: 'both',
      }}
    >
      {/* ── Card header ── */}
      <button
        className="w-full text-left px-4 pt-4 pb-3 flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label={`${coverage.name} — ${cfg.label}`}
      >
        {/* Emoji icon */}
        <div className="w-10 h-10 rounded-sm bg-surface border border-hairline flex items-center justify-center text-xl shrink-0 mt-0.5">
          {coverage.emoji}
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            {/* Status chip */}
            <StateChip tone={cfg.tone}>
              {cfg.icon} {cfg.label}
            </StateChip>

            {/* Bonus tag */}
            {coverage.isBonus && coverage.status !== 'not_applicable' && (
              <span className="t-micro px-2 py-0.5 rounded-pill bg-surface border border-hairline text-muted flex items-center gap-1">
                <IconGift size={12} className="text-muted shrink-0" /> Bonus
              </span>
            )}
          </div>

          <p className="t-body-sm font-bold text-navy leading-tight truncate">
            {coverage.shortName}
          </p>
          <p className="t-caption text-muted leading-snug mt-0.5">
            {coverage.name}
          </p>
        </div>

        {/* Chevron */}
        <div
          className="text-muted text-xs shrink-0 mt-1 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </div>
      </button>

      {/* ── Cover + premium quick stats ── */}
      <div className={`mx-4 mb-3 rounded-sm overflow-hidden border ${cfg.borderClass}`}>
        <div className={`grid grid-cols-2 divide-x ${cfg.borderClass}`}>
          <div className="px-3 py-2 text-center">
            <p className="t-micro text-muted">Cover</p>
            <p className="t-body-sm font-extrabold text-navy nums">
              {formatCover(coverage.coverAmount)}
            </p>
          </div>
          <div className="px-3 py-2 text-center">
            <p className="t-micro text-muted">Annual cost</p>
            <p className="t-body-sm font-extrabold text-navy nums">
              {formatPremium(coverage.annualPremium)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Description */}
          <p className="t-body-sm text-slate leading-relaxed">
            {coverage.description}
          </p>

          {/* Why you have it */}
          <div className={`rounded-sm bg-surface border ${cfg.borderClass} p-3`}>
            <p className="t-micro text-muted mb-1">
              Why you qualify
            </p>
            <p className="t-caption text-slate leading-relaxed">{coverage.whyYouHaveIt}</p>
          </div>

          {/* How to verify */}
          <div className={`rounded-sm bg-surface border ${cfg.borderClass} p-3 space-y-1.5`}>
            <p className="t-micro text-muted mb-1">
              How to verify
            </p>
            {coverage.howToVerify.map((step, i) => (
              <div key={i} className="flex gap-2">
                <span className="t-micro w-4 h-4 rounded-pill bg-navy text-sand flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="t-caption text-slate leading-snug">{step}</p>
              </div>
            ))}
          </div>

          {/* Action button */}
          <Button
            size="md"
            fullWidth
            onClick={() => onAction(coverage)}
          >
            {coverage.actionLabel}
            {coverage.actionIsExternal && <span className="text-xs opacity-80">↗</span>}
          </Button>

          {/* Compliance note — CG-4 mandatory */}
          <p className="t-micro text-muted leading-relaxed">
            {coverage.complianceNote}
          </p>
        </div>
      )}

      {/* ── Collapsed compliance nudge ── */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="t-caption text-muted">
            Tap to see details and how to verify. Conditions apply.
          </p>
        </div>
      )}
    </div>
  )
}
