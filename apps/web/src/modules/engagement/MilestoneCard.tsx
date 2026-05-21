/**
 * MilestoneCard.tsx — Module 8A
 *
 * Displays a single milestone — locked or unlocked.
 *
 * Unlocked: full colour, emoji prominent, points badge, "Earned!" label
 * Locked:   grayscale, blur on emoji, "? ? ?" hint visible, lock icon
 *
 * Tiers:
 *   bronze → warm amber
 *   silver → cool gray-blue
 *   gold   → rich amber/gold gradient
 */

import type { Milestone, MilestoneId } from './streakStore'

const TIER_CONFIG = {
  bronze: { bg: '#FEF3C7', border: '#FCD34D', colour: '#92400E', badge: '#D97706' },
  silver: { bg: '#F1F5F9', border: '#CBD5E1', colour: '#334155', badge: '#475569' },
  gold:   { bg: '#FFFBEB', border: '#FCD34D', colour: '#78350F', badge: '#B45309' },
}

type Props = {
  milestone: Milestone
  unlocked: boolean
  isNew?: boolean       // shows "New!" badge for just-unlocked
}

export function MilestoneCard({ milestone, unlocked, isNew }: Props) {
  const cfg = TIER_CONFIG[milestone.tier]

  if (unlocked) {
    return (
      <div
        className="rounded-2xl border-2 p-4 flex items-start gap-3 relative overflow-hidden animate-fade-in"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        {/* Gold shimmer for gold tier */}
        {milestone.tier === 'gold' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent pointer-events-none" />
        )}

        {/* Emoji */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: cfg.border }}
        >
          {milestone.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-extrabold" style={{ color: cfg.colour }}>
              {milestone.title}
            </p>
            {isNew && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white animate-bounce">
                NEW!
              </span>
            )}
            {/* Tier pill */}
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide text-white"
              style={{ backgroundColor: cfg.badge }}
            >
              {milestone.tier}
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-snug mb-2">{milestone.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-green-600">✓ Earned!</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.badge, color: '#fff' }}
            >
              +{milestone.points} pts
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Locked state
  return (
    <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 flex items-start gap-3">
      {/* Greyed emoji with lock overlay */}
      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-2xl shrink-0 relative">
        <span className="grayscale opacity-30">{milestone.emoji}</span>
        <span className="absolute bottom-0 right-0 text-xs">🔒</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-400 mb-0.5">{milestone.title}</p>
        <p className="text-xs text-gray-300 leading-snug mb-2 line-clamp-2">
          {milestone.description}
        </p>
        {/* Unlock hint */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">💡 {milestone.unlockHint}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-gray-300">🔒 Locked</span>
          <span className="text-[10px] text-gray-300 px-2 py-0.5 rounded-full border border-gray-200">
            +{milestone.points} pts
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Compact locked placeholder (for overflow list) ───────────────
export function MilestoneLockPlaceholder({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center">
      <p className="text-2xl mb-1">🔒</p>
      <p className="text-sm font-semibold text-gray-400">
        {count} more milestone{count > 1 ? 's' : ''} to unlock
      </p>
      <p className="text-xs text-gray-300 mt-0.5">Keep taking actions to earn them</p>
    </div>
  )
}
