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

import { useState, useEffect, useMemo } from 'react'
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

// ── Next action suggestions (keyed to locked milestones) ─────────
const NEXT_ACTION_MAP: Partial<Record<MilestoneId, { label: string; route: string; emoji: string }>> = {
  m1_first_score:           { label: 'Calculate my score',          route: '/diagnose',  emoji: '🎯' },
  m2_vault_policy:          { label: 'Add a policy to vault',        route: '/vault',     emoji: '📄' },
  m3_vault_nominee:         { label: 'Add a nominee',                route: '/vault',     emoji: '👤' },
  m4_discovery:             { label: 'Discover hidden coverage',     route: '/discover',  emoji: '🔍' },
  m5_recommendation_action: { label: 'Act on a recommendation',      route: '/recommend', emoji: '⚡' },
  m6_pmsby_active:          { label: 'Check PMSBY status',           route: '/discover',  emoji: '🦺' },
  m9_score_improver:        { label: 'Improve my protection score',  route: '/recommend', emoji: '📈' },
  m10_vault_complete:       { label: 'Complete the Protection Vault', route: '/vault',    emoji: '🏰' },
}

// ── Tier breakdown strip ─────────────────────────────────────────
function TierBreakdown({ unlocked }: { unlocked: Set<MilestoneId> }) {
  const tiers = [
    { label: 'Bronze', colour: '#D97706', bg: '#FEF3C7', ids: MILESTONES.filter(m => m.tier === 'bronze').map(m => m.id) },
    { label: 'Silver', colour: '#475569', bg: '#F1F5F9', ids: MILESTONES.filter(m => m.tier === 'silver').map(m => m.id) },
    { label: 'Gold',   colour: '#B45309', bg: '#FFFBEB', ids: MILESTONES.filter(m => m.tier === 'gold').map(m => m.id) },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiers.map(t => {
        const earned = t.ids.filter(id => unlocked.has(id)).length
        return (
          <div key={t.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: t.bg }}>
            <p className="text-lg font-extrabold" style={{ color: t.colour }}>
              {earned}/{t.ids.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: t.colour }}>
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
        <div className="text-3xl animate-pulse">🔥</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-10">
      {/* ── Header ── */}
      <div
        className="px-5 pt-6 pb-5"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 6%, white) 0%, white 100%)',
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
          Engagement
        </p>
        <h1 className="text-xl font-extrabold text-gray-900">Your Progress</h1>
        <p className="text-xs text-gray-500 mt-1">Streaks · Milestones · Points</p>
      </div>

      <div className="px-5 space-y-5">

        {/* ── Streak card ── */}
        <StreakCard streak={streak} />

        {/* ── Points summary ── */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)',
            border: '1.5px solid color-mix(in srgb, var(--color-primary) 20%, white)',
          }}
        >
          <div className="text-3xl">⭐</div>
          <div className="flex-1">
            <p className="text-2xl font-extrabold text-gray-900">{totalPoints}</p>
            <p className="text-xs text-gray-500">KIN protection points earned</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
              {unlockedMilestones.length}/{MILESTONES.length}
            </p>
            <p className="text-[10px] text-gray-400">milestones</p>
          </div>
        </div>

        {/* ── Tier breakdown ── */}
        <TierBreakdown unlocked={unlocked} />

        {/* ── Newly unlocked banner ── */}
        {newlyUnlocked.length > 0 && (
          <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-4 animate-fade-in">
            <p className="text-sm font-bold text-green-800 mb-1">
              🎉 {newlyUnlocked.length} new milestone{newlyUnlocked.length > 1 ? 's' : ''} unlocked!
            </p>
            <p className="text-xs text-green-600">
              {newlyUnlocked.map(id => MILESTONES.find(m => m.id === id)?.title).filter(Boolean).join(' · ')}
            </p>
          </div>
        )}

        {/* ── Unlocked milestones ── */}
        {unlockedMilestones.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              ✅ Earned ({unlockedMilestones.length})
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
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              🔒 Locked ({lockedMilestones.length})
            </p>
            {visibleLocked.map(m => (
              <MilestoneCard key={m.id} milestone={m} unlocked={false} />
            ))}
            {!showAllLocked && hiddenCount > 0 && (
              <MilestoneLockPlaceholder count={hiddenCount} />
            )}
            {!showAllLocked && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllLocked(true)}
                className="w-full py-2.5 text-xs font-semibold text-gray-400 border border-gray-100 rounded-xl"
              >
                Show all locked milestones ↓
              </button>
            )}
          </div>
        )}

        {/* ── All done ── */}
        {lockedMilestones.length === 0 && (
          <div className="rounded-2xl bg-yellow-50 border-2 border-yellow-200 p-5 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-base font-extrabold text-yellow-800">All milestones complete!</p>
            <p className="text-xs text-yellow-600 mt-1 leading-relaxed">
              You have achieved full financial wellness awareness. Share KIN with a friend.
            </p>
          </div>
        )}

        {/* ── Next actions ── */}
        {nextActions.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              💡 Actions to unlock milestones
            </p>
            {nextActions.map(action => (
              <Link
                key={action.milestoneId}
                to={action.route}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm"
              >
                <span className="text-xl">{action.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  +{action.points} pts
                </span>
                <span className="text-gray-300 text-sm">›</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Module 8B: KIN IQ Weekly Quiz ── */}
        <Link to="/quiz" className="block">
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-5 flex items-center gap-4 active:opacity-80 transition-opacity">
            <span className="text-3xl shrink-0">🧠</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-extrabold text-purple-800">KIN IQ Weekly Quiz</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  NEW
                </span>
              </div>
              <p className="text-xs text-purple-600 leading-relaxed">
                3 insurance literacy questions — earn up to +8 KIN IQ points this week.
              </p>
            </div>
            <span className="text-purple-400 text-lg shrink-0">→</span>
          </div>
        </Link>

      </div>
    </div>
  )
}
