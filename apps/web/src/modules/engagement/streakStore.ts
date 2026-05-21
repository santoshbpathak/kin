/**
 * streakStore.ts — Module 8A: Protection Streak & Milestones
 *
 * Tracks:
 *   - Daily engagement streak (consecutive days the user opens KIN)
 *   - Milestone unlocks across all modules (M1–M10)
 *   - Historical score snapshots (for "Score Improver" milestone)
 *
 * Storage keys:
 *   kin_streak           → StreakRecord
 *   kin_milestones       → Record<MilestoneId, boolean>
 *   kin_score_history    → number[]  (composite scores, newest first)
 *
 * Rules:
 *   - Same-day revisit: streak unchanged
 *   - Next consecutive day: streak + 1
 *   - Gap ≥ 1 day missed: streak resets to 1
 *   - Milestones are one-way — once unlocked they stay unlocked
 */

// ── Streak types ───────────────────────────────────────────────
export type StreakRecord = {
  currentStreak: number      // consecutive days
  longestStreak: number
  lastVisitDate: string      // ISO date YYYY-MM-DD
  totalDaysActive: number
  visitDates: string[]       // ISO dates, newest first, max 90 kept
}

// ── Milestone definitions ──────────────────────────────────────
export type MilestoneId =
  | 'm1_first_score'
  | 'm2_vault_policy'
  | 'm3_vault_nominee'
  | 'm4_discovery'
  | 'm5_recommendation_action'
  | 'm6_pmsby_active'
  | 'm7_streak_3'
  | 'm8_streak_7'
  | 'm9_score_improver'
  | 'm10_vault_complete'

export type Milestone = {
  id: MilestoneId
  emoji: string
  title: string
  description: string
  unlockHint: string         // what action unlocks this
  points: number             // KIN points (display only)
  tier: 'bronze' | 'silver' | 'gold'
}

export const MILESTONES: Milestone[] = [
  {
    id: 'm1_first_score',
    emoji: '🎯',
    title: 'First Score',
    description: 'You calculated your KIN Protection Score for the first time.',
    unlockHint: 'Complete the 2-minute check-in',
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'm2_vault_policy',
    emoji: '📄',
    title: 'Vault Builder',
    description: 'You added your first insurance policy to the Protection Vault.',
    unlockHint: 'Add a policy to the Vault',
    points: 75,
    tier: 'bronze',
  },
  {
    id: 'm3_vault_nominee',
    emoji: '👤',
    title: 'Nominee Secure',
    description: 'You added a nominee — your family is now identifiable.',
    unlockHint: 'Add a nominee to the Vault',
    points: 75,
    tier: 'bronze',
  },
  {
    id: 'm4_discovery',
    emoji: '🔍',
    title: 'Hidden Hunter',
    description: 'You completed the Hidden Coverage Discovery scan.',
    unlockHint: 'Complete the Discovery flow',
    points: 100,
    tier: 'silver',
  },
  {
    id: 'm5_recommendation_action',
    emoji: '⚡',
    title: 'Action Taker',
    description: 'You clicked "Take Action" on a KIN recommendation.',
    unlockHint: 'Tap a recommendation CTA',
    points: 100,
    tier: 'silver',
  },
  {
    id: 'm6_pmsby_active',
    emoji: '🦺',
    title: 'PMSBY Warrior',
    description: 'PMSBY accident cover confirmed active — ₹2L for ₹20/year!',
    unlockHint: 'Confirm PMSBY active in Discovery',
    points: 150,
    tier: 'silver',
  },
  {
    id: 'm7_streak_3',
    emoji: '🔥',
    title: '3-Day Streak',
    description: 'You opened KIN 3 days in a row. Consistency builds protection.',
    unlockHint: 'Open KIN 3 consecutive days',
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'm8_streak_7',
    emoji: '🏆',
    title: 'Weekly Warrior',
    description: 'A full week of financial awareness. You\'re building great habits.',
    unlockHint: 'Open KIN 7 consecutive days',
    points: 200,
    tier: 'gold',
  },
  {
    id: 'm9_score_improver',
    emoji: '📈',
    title: 'Score Climber',
    description: 'Your protection score improved by 10+ points.',
    unlockHint: 'Increase your score by 10 points',
    points: 150,
    tier: 'silver',
  },
  {
    id: 'm10_vault_complete',
    emoji: '🏰',
    title: 'Vault Complete',
    description: 'Policy stored, nominee added, emergency letter downloaded. Your family is ready.',
    unlockHint: 'Complete all 3 Vault sections',
    points: 300,
    tier: 'gold',
  },
]

// ── Storage keys ────────────────────────────────────────────────
const STREAK_KEY = 'kin_streak'
const MILESTONES_KEY = 'kin_milestones'
const SCORE_HISTORY_KEY = 'kin_score_history'

// ── Helpers ─────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime()
  const msB = new Date(b).getTime()
  return Math.round(Math.abs(msA - msB) / 86_400_000)
}

// ── Streak CRUD ──────────────────────────────────────────────────
export function getStreak(): StreakRecord {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) return JSON.parse(raw) as StreakRecord
  } catch { /* ignore */ }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastVisitDate: '',
    totalDaysActive: 0,
    visitDates: [],
  }
}

/**
 * Call once per app session (e.g. in App.tsx useEffect).
 * Updates the streak based on today vs last visit date.
 */
export function recordVisit(): StreakRecord {
  const today = todayISO()
  const prev = getStreak()

  // Same day — no change
  if (prev.lastVisitDate === today) return prev

  let newStreak: number
  if (!prev.lastVisitDate) {
    newStreak = 1
  } else {
    const gap = daysBetween(prev.lastVisitDate, today)
    newStreak = gap === 1 ? prev.currentStreak + 1 : 1
  }

  const visitDates = [today, ...prev.visitDates].slice(0, 90)

  const updated: StreakRecord = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, prev.longestStreak),
    lastVisitDate: today,
    totalDaysActive: prev.totalDaysActive + 1,
    visitDates,
  }

  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }

  return updated
}

// ── Milestone store ──────────────────────────────────────────────
export function getUnlockedMilestones(): Set<MilestoneId> {
  try {
    const raw = localStorage.getItem(MILESTONES_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, boolean>
      return new Set(Object.keys(obj).filter(k => obj[k]) as MilestoneId[])
    }
  } catch { /* ignore */ }
  return new Set()
}

export function unlockMilestone(id: MilestoneId): void {
  const unlocked = getUnlockedMilestones()
  if (unlocked.has(id)) return // already unlocked — idempotent
  unlocked.add(id)
  const obj: Record<string, boolean> = {}
  unlocked.forEach(k => { obj[k] = true })
  try {
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(obj))
  } catch { /* ignore */ }
}

// ── Score history ────────────────────────────────────────────────
export function getScoreHistory(): number[] {
  try {
    const raw = localStorage.getItem(SCORE_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function recordScore(score: number): void {
  const history = getScoreHistory()
  const updated = [score, ...history].slice(0, 20) // keep last 20
  try {
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

// ── Auto-detect & unlock milestones from cross-module signals ────
export function syncMilestones(streak: StreakRecord): MilestoneId[] {
  const newlyUnlocked: MilestoneId[] = []
  const already = getUnlockedMilestones()

  function tryUnlock(id: MilestoneId, condition: boolean) {
    if (condition && !already.has(id)) {
      unlockMilestone(id)
      newlyUnlocked.push(id)
    }
  }

  // M1: score calculated
  const hasProfile = Boolean(
    (() => { try { return sessionStorage.getItem('kin_diagnostic_profile') } catch { return null } })()
  )
  tryUnlock('m1_first_score', hasProfile)

  // M2: vault has at least one policy
  const vaultDocs = (() => {
    try {
      const raw = localStorage.getItem('kin_vault_documents')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })()
  tryUnlock('m2_vault_policy', vaultDocs.length > 0)

  // M3: vault has at least one nominee
  const vaultNominees = (() => {
    try {
      const raw = localStorage.getItem('kin_vault_nominees')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })()
  tryUnlock('m3_vault_nominee', vaultNominees.length > 0)

  // M4: discovery completed
  const discoveryDone = Boolean(
    (() => { try { return sessionStorage.getItem('kin_discovery_results') } catch { return null } })()
  )
  tryUnlock('m4_discovery', discoveryDone)

  // M5: recommendation action (flagged by flag set in RecommendationsPage)
  const recAction = Boolean(
    (() => { try { return localStorage.getItem('kin_rec_action_taken') } catch { return null } })()
  )
  tryUnlock('m5_recommendation_action', recAction)

  // M6: PMSBY active in discovery results
  const pmsbyActive = (() => {
    try {
      const raw = sessionStorage.getItem('kin_discovery_results')
      if (!raw) return false
      const results = JSON.parse(raw) as Array<{ id: string; status: string }>
      return results.some(r => r.id === 'pmsby' && r.status === 'active')
    } catch { return false }
  })()
  tryUnlock('m6_pmsby_active', pmsbyActive)

  // M7: 3-day streak
  tryUnlock('m7_streak_3', streak.currentStreak >= 3)

  // M8: 7-day streak
  tryUnlock('m8_streak_7', streak.currentStreak >= 7)

  // M9: score improved by 10+
  const history = getScoreHistory()
  const scoreImproved = history.length >= 2 && (history[0] - Math.min(...history.slice(1))) >= 10
  tryUnlock('m9_score_improver', scoreImproved)

  // M10: vault complete (policy + nominee + letter downloaded)
  const letterDownloaded = Boolean(
    (() => { try { return localStorage.getItem('kin_letter_downloaded') } catch { return null } })()
  )
  tryUnlock('m10_vault_complete', vaultDocs.length > 0 && vaultNominees.length > 0 && letterDownloaded)

  return newlyUnlocked
}

// ── Total points earned ──────────────────────────────────────────
export function getTotalPoints(unlocked: Set<MilestoneId>): number {
  return MILESTONES
    .filter(m => unlocked.has(m.id))
    .reduce((sum, m) => sum + m.points, 0)
}
