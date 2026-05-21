/**
 * CoverageResultCard.tsx — Module 6
 *
 * Displays a single discovered coverage item.
 *
 * Status colours:
 *   active         → green
 *   likely_active  → teal (with "Verify" nudge)
 *   check_required → amber (user needs to verify)
 *   not_activated  → orange (actionable gap)
 *   not_applicable → gray (greyed out)
 *
 * Compliance (CG-4, CG-2):
 *   - All amounts shown with "Conditions apply"
 *   - complianceNote rendered in 10px text at card bottom
 *   - No premium-rate promises or return guarantees
 */

import { useState } from 'react'
import type { DiscoveredCoverage, CoverageStatus } from './discoveryEngine'

// ── Status config ───────────────────────────────────────────────
const STATUS_CONFIG: Record<
  CoverageStatus,
  { label: string; colour: string; bg: string; border: string; icon: string }
> = {
  active: {
    label: 'Active',
    colour: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: '✅',
  },
  likely_active: {
    label: 'Likely Active',
    colour: '#0D9488',
    bg: '#F0FDFA',
    border: '#99F6E4',
    icon: '🟢',
  },
  check_required: {
    label: 'Check Required',
    colour: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: '🔍',
  },
  not_activated: {
    label: 'Not Activated',
    colour: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    icon: '⚠️',
  },
  not_applicable: {
    label: 'Not Applicable',
    colour: '#6B7280',
    bg: '#F9FAFB',
    border: '#E5E7EB',
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
      className="rounded-2xl border overflow-hidden shadow-sm animate-fade-in"
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
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
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5"
          style={{ backgroundColor: `${cfg.colour}18` }}
        >
          {coverage.emoji}
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            {/* Status pill */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.colour, color: '#fff' }}
            >
              {cfg.icon} {cfg.label}
            </span>

            {/* Bonus tag */}
            {coverage.isBonus && coverage.status !== 'not_applicable' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                🎁 Bonus
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-gray-900 leading-tight truncate">
            {coverage.shortName}
          </p>
          <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
            {coverage.name}
          </p>
        </div>

        {/* Chevron */}
        <div
          className="text-gray-400 text-xs shrink-0 mt-1 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </div>
      </button>

      {/* ── Cover + premium quick stats ── */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden border"
        style={{ borderColor: cfg.border }}
      >
        <div className="grid grid-cols-2 divide-x" style={{ borderColor: cfg.border }}>
          <div className="px-3 py-2 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Cover</p>
            <p className="text-sm font-extrabold text-gray-800">
              {formatCover(coverage.coverAmount)}
            </p>
          </div>
          <div className="px-3 py-2 text-center" style={{ borderColor: cfg.border }}>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Premium</p>
            <p className="text-sm font-extrabold text-gray-800">
              {formatPremium(coverage.annualPremium)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Description */}
          <p className="text-[13px] text-gray-700 leading-relaxed">
            {coverage.description}
          </p>

          {/* Why you have it */}
          <div className="rounded-xl bg-white border p-3" style={{ borderColor: cfg.border }}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
              Why you qualify
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{coverage.whyYouHaveIt}</p>
          </div>

          {/* How to verify */}
          <div className="rounded-xl bg-white border p-3 space-y-1.5" style={{ borderColor: cfg.border }}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
              How to verify
            </p>
            {coverage.howToVerify.map((step, i) => (
              <div key={i} className="flex gap-2">
                <span
                  className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: cfg.colour, color: '#fff' }}
                >
                  {i + 1}
                </span>
                <p className="text-[12px] text-gray-600 leading-snug">{step}</p>
              </div>
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={() => onAction(coverage)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5"
            style={{ backgroundColor: cfg.colour }}
          >
            {coverage.actionLabel}
            {coverage.actionIsExternal && <span className="text-xs opacity-80">↗</span>}
          </button>

          {/* Compliance note — CG-4 mandatory */}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {coverage.complianceNote}
          </p>
        </div>
      )}

      {/* ── Collapsed compliance nudge ── */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-gray-400">
            Tap to see details & how to verify. Conditions apply.
          </p>
        </div>
      )}
    </div>
  )
}
