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

import type { Milestone } from './streakStore'
import { Card } from '@/components/ui'
import { IconLock, IconBulb, IconCheck } from '@/components/ui/icons'

// Tier-specific token classes (border accent only — backgrounds use design tokens)
const TIER_CONFIG = {
  bronze: { borderClass: 'border-amber-300', iconBg: 'bg-amber-200', titleClass: 'text-navy', badgeClass: 'bg-amber-500 text-sand' },
  silver: { borderClass: 'border-hairline-strong', iconBg: 'bg-sand-deep', titleClass: 'text-navy', badgeClass: 'bg-slate-500 text-sand' },
  gold:   { borderClass: 'border-amber-300', iconBg: 'bg-amber-200', titleClass: 'text-navy', badgeClass: 'bg-amber-600 text-sand' },
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
      <Card className={`flex items-start gap-3 relative overflow-hidden animate-fade-in border-2 ${cfg.borderClass}`}>
        {/* Gold shimmer for gold tier */}
        {milestone.tier === 'gold' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/40 to-transparent pointer-events-none" />
        )}

        {/* Emoji */}
        <div className={`w-12 h-12 rounded-md flex items-center justify-center text-2xl shrink-0 ${cfg.iconBg}`}>
          {milestone.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className={`t-body-sm font-extrabold ${cfg.titleClass}`}>
              {milestone.title}
            </p>
            {isNew && (
              <span className="t-micro px-2 py-0.5 rounded-pill bg-mint text-teal-deep animate-bounce">
                NEW!
              </span>
            )}
            {/* Tier pill */}
            <span className={`t-micro px-2 py-0.5 rounded-pill ${cfg.badgeClass}`}>
              {milestone.tier}
            </span>
          </div>
          <p className="t-body-sm text-slate leading-snug mb-2">{milestone.description}</p>
          <div className="flex items-center gap-2">
            <span className="t-caption font-bold text-teal-deep flex items-center gap-1"><IconCheck size={14} className="text-teal-deep" /> Earned!</span>
            <span className={`t-caption font-bold px-2 py-0.5 rounded-pill ${cfg.badgeClass}`}>
              +{milestone.points} pts
            </span>
          </div>
        </div>
      </Card>
    )
  }

  // Locked state
  return (
    <Card className="flex items-start gap-3 border border-hairline bg-sand-deep/60">
      {/* Greyed emoji with lock overlay */}
      <div className="w-12 h-12 rounded-md bg-sand-deep flex items-center justify-center text-2xl shrink-0 relative">
        <span className="grayscale opacity-30">{milestone.emoji}</span>
        <span className="absolute bottom-0 right-0"><IconLock size={12} className="text-muted" /></span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="t-body-sm font-bold text-muted mb-0.5">{milestone.title}</p>
        <p className="t-caption text-muted leading-snug mb-2 line-clamp-2">
          {milestone.description}
        </p>
        {/* Unlock hint */}
        <div className="flex items-center gap-1.5">
          <span className="t-caption text-muted flex items-center gap-1"><IconBulb size={14} className="text-muted" /> {milestone.unlockHint}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="t-caption text-muted flex items-center gap-1"><IconLock size={14} className="text-muted" /> Locked</span>
          <span className="t-caption text-muted px-2 py-0.5 rounded-pill border border-hairline">
            +{milestone.points} pts
          </span>
        </div>
      </div>
    </Card>
  )
}

// ── Compact locked placeholder (for overflow list) ───────────────
export function MilestoneLockPlaceholder({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div className="rounded-md border-2 border-dashed border-hairline bg-sand-deep p-4 text-center">
      <div className="flex justify-center mb-1"><IconLock size={28} className="text-muted" /></div>
      <p className="t-body-sm font-semibold text-muted">
        {count} more milestone{count > 1 ? 's' : ''} to unlock
      </p>
      <p className="t-caption text-muted mt-0.5">Keep taking actions to earn them</p>
    </div>
  )
}
