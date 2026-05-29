/**
 * EngagementPage.tsx — Module 8A: Protection Streak & Milestones
 *
 * Route: /engage
 *
 * Layout:
 *   1. Header — "Your Progress"
 *   2. StreakCard — current streak + 7-day calendar
 *   3. Points summary strip
 *   4. Tier breakdown (bronze/silver/gold counts)
 *   5. Milestones — unlocked first, then locked (with hints)
 *   6. Next actions CTA cards — personalised to what's still locked
 *   7. Module 8B teaser — KIN IQ Quiz (coming soon)
 *
 * On mount:
 *   - recordVisit() → update streak
 *   - syncMilestones() → auto-unlock any newly earned milestones
 *   - Show "New!" badge on just-unlocked milestones
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { StreakCard } from './StreakCard'
import { MilestoneCard, MilestoneLockPlaceholder } from './MilestoneCard'
import {
  recordVisit,
  syncMilestones,
  getUnlockedMilestones,
  getTotalPoints,
  MILESTONES,
  type MilestoneId,
  type StreakRecord,
} from './streakStore'
import { Button, Card, NavHeader } from '@/components/ui'
import {
  IconScore, IconDoc, IconUser, IconSearch, IconSparkle,
  IconShield, IconChart, IconBuilding, IconStar, IconTrophy,
  IconStreak, IconBulb,
} from '@/components/ui/icons'

// ── Next action suggestions (keyed to locked milestones) ─────────
const NEXT_ACTION_MAP: Partial<Record<MilestoneId, { label: string; route: string; icon: React.ReactElement }>> = {
  m1_first_score:           { label: 'Calculate my score',          route: '/diagnose',  icon: <IconScore size={20} className="text-navy shrink-0" /> },
  m2_vault_policy:          { label: 'Add a policy to vault',        route: '/vault',     icon: <IconDoc size={20} className="text-navy shrink-0" /> },
  m3_vault_nominee:         { label: 'Add a nominee',                route: '/vault',     icon: <IconUser size={20} className="text-navy shrink-0" /> },
  m4_discovery:             { label: 'Discover hidden coverage',     route: '/discover',  icon: <IconSearch size={20} className="text-navy shrink-0" /> },
  m5_recommendation_action: { label: 'Act on a recommendation',      route: '/recommend', icon: <IconSparkle size={20} className="text-navy shrink-0" /> },
  m6_pmsby_active:          { label: 'Check PMSBY status',           route: '/discover',  icon: <IconShield size={20} className="text-navy shrink-0" /> },
  m9_score_improver:        { label: 'Improve my protection score',  route: '/recommend', icon: <IconChart size={20} className="text-navy shrink-0" /> },
  m10_vault_complete:       { label: 'Complete the Protection Vault', route: '/vault',    icon: <IconBuilding size={20} className="text-navy shrink-0" /> },
}

// ── Tier breakdown strip ─────────────────────────────────────────
function TierBreakdown({ unlocked }: { unlocked: Set<MilestoneId> }) {
  const tiers = [
    { label: 'Bronze', countClass: 'text-amber',      bgClass: 'bg-sand-deep',          ids: MILESTONES.filter(m => m.tier === 'bronze').map(m => m.id) },
    { label: 'Silver', countClass: 'text-slate',      bgClass: 'bg-sand-deep',          ids: MILESTONES.filter(m => m.tier === 'silver').map(m => m.id) },
    { label: 'Gold',   countClass: 'text-amber',      bgClass: 'bg-sand-deep',          ids: MILESTONES.filter(m => m.tier === 'gold').map(m => m.id) },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiers.map(t => {
        const earned = t.ids.filter(id => unlocked.has(id)).length
        return (
          <div key={t.label} className={`rounded-md p-3 text-center ${t.bgClass} border border-hairline`}>
            <p className={`t-numeric-inline font-extrabold nums ${t.countClass}`}>
              {earned}/{t.ids.length}
            </p>
            <p className={`t-micro mt-0.5 ${t.countClass}`}>
              {t.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export function EngagementPage() {
  const [streak, setStreak] = useState<StreakRecord | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<MilestoneId[]>([])
  const [unlocked, setUnlocked] = useState<Set<MilestoneId>>(new Set())
  const [showAllLocked, setShowAllLocked] = useState(false)

  useEffect(() => {
    const updatedStreak = recordVisit()
    const fresh = syncMilestones(updatedStreak)
    const unlockedSet = getUnlockedMilestones()
    setStreak(updatedStreak)
    setNewlyUnlocked(fresh)
    setUnlocked(unlockedSet)
  }, [])

  const totalPoints = useMemo(() => getTotalPoints(unlocked), [unlocked])

  const unlockedMilestones = MILESTONES.filter(m => unlocked.has(m.id))
  const lockedMilestones   = MILESTONES.filter(m => !unlocked.has(m.id))

  const nextActions = lockedMilestones
    .filter(m => NEXT_ACTION_MAP[m.id])
    .slice(0, 3)
    .map(m => ({ ...NEXT_ACTION_MAP[m.id]!, milestoneId: m.id, points: m.points }))

  const visibleLocked = showAllLocked ? lockedMilestones : lockedMilestones.slice(0, 3)
  const hiddenCount = lockedMilestones.length - 3

  if (!streak) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <IconStreak size={32} className="text-amber animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-10">
      {/* ── Header ── */}
      <NavHeader title="Your Progress" />

      <div className="px-5 pt-5 space-y-5">

        {/* ── Streak card ── */}
        <StreakCard streak={streak} />

        {/* ── Points summary ── */}
        <Card className="flex items-center gap-4 py-4">
          <IconStar size={28} className="text-amber shrink-0" />
          <div className="flex-1">
            <p className="t-numeric-inline font-extrabold text-navy nums">{totalPoints}</p>
            <p className="t-body-sm text-muted">KIN protection points earned</p>
          </div>
          <div className="text-right">
            <p className="t-body-sm font-bold text-teal-deep nums">
              {unlockedMilestones.length}/{MILESTONES.length}
            </p>
            <p className="t-micro text-muted">milestones</p>
          </div>
        </Card>

        {/* ── Tier breakdown ── */}
        <TierBreakdown unlocked={unlocked} />

        {/* ── Newly unlocked banner ── */}
        {newlyUnlocked.length > 0 && (
          <div className="rounded-md border border-teal/30 bg-mint p-4 animate-fade-in">
            <p className="t-body-sm font-bold text-teal-deep mb-1 flex items-center gap-1.5">
              <IconSparkle size={16} className="text-teal-deep shrink-0" />
              {newlyUnlocked.length} new milestone{newlyUnlocked.length > 1 ? 's' : ''} unlocked!
            </p>
            <p className="t-body-sm text-slate">
              {newlyUnlocked.map(id => MILESTONES.find(m => m.id === id)?.title).filter(Boolean).join(' · ')}
            </p>
          </div>
        )}

        {/* ── Unlocked milestones ── */}
        {unlockedMilestones.length > 0 && (
          <div className="space-y-3">
            <p className="t-micro text-muted">
              Earned ({unlockedMilestones.length})
            </p>
            {unlockedMilestones.map(m => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                unlocked={true}
                isNew={newlyUnlocked.includes(m.id)}
              />
            ))}
          </div>
        )}

        {/* ── Locked milestones ── */}
        {lockedMilestones.length > 0 && (
          <div className="space-y-3">
            <p className="t-micro text-muted">
              Locked ({lockedMilestones.length})
            </p>
            {visibleLocked.map(m => (
              <MilestoneCard key={m.id} milestone={m} unlocked={false} />
            ))}
            {!showAllLocked && hiddenCount > 0 && (
              <MilestoneLockPlaceholder count={hiddenCount} />
            )}
            {!showAllLocked && hiddenCount > 0 && (
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setShowAllLocked(true)}
                className="border border-hairline"
              >
                Show all locked milestones
              </Button>
            )}
          </div>
        )}

        {/* ── All done ── */}
        {lockedMilestones.length === 0 && (
          <Card className="bg-mint border-teal/30 p-5 text-center">
            <IconTrophy size={40} className="text-amber mx-auto mb-3" />
            <p className="t-body font-extrabold text-teal-deep">All milestones complete!</p>
            <p className="t-body-sm text-slate mt-1 leading-relaxed">
              You have achieved full financial wellness awareness. Share KIN with a friend.
            </p>
          </Card>
        )}

        {/* ── Next actions ── */}
        {nextActions.length > 0 && (
          <div className="space-y-2.5">
            <p className="t-micro text-muted">
              Actions to unlock milestones
            </p>
            {nextActions.map(action => (
              <Link
                key={action.milestoneId}
                to={action.route}
                className="flex items-center gap-3 bg-surface rounded-md border border-hairline px-4 py-3.5 shadow-card active:opacity-80 transition-opacity"
              >
                {action.icon}
                <div className="flex-1">
                  <p className="t-body-sm font-semibold text-navy">{action.label}</p>
                </div>
                <span className="t-micro font-bold px-2 py-0.5 rounded-pill bg-teal text-navy shrink-0 nums">
                  +{action.points} pts
                </span>
                <span className="text-muted t-body-sm">›</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Module 8B: KIN IQ Weekly Quiz ── */}
        <Link to="/quiz" className="block">
          <Card className="flex items-center gap-4 active:opacity-80 transition-opacity">
            <IconBulb size={28} className="text-navy shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="t-body-sm font-extrabold text-navy">KIN IQ Weekly Quiz</p>
                <span className="t-micro px-2 py-0.5 rounded-pill bg-teal text-navy">
                  NEW
                </span>
              </div>
              <p className="t-body-sm text-slate leading-relaxed">
                3 insurance literacy questions — earn up to +8 KIN IQ points this week.
              </p>
            </div>
            <span className="text-muted t-body shrink-0">→</span>
          </Card>
        </Link>

      </div>
    </div>
  )
}
