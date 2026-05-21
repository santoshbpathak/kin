/**
 * lifecycleStore.ts — Module 11: Lifecycle Layer
 *
 * Manages:
 *   1. Notification preferences (WhatsApp / SMS / frequency)
 *   2. Re-score signals (time-based + life event triggers)
 *   3. STOP / unsubscribe state
 *
 * Storage keys:
 *   kin_notification_prefs   → NotificationPrefs
 *   kin_rescore_signal       → RescoreSignal | null
 *   kin_life_events          → LifeEvent[]
 *
 * Phase 2: prefs synced to NestJS → WhatsApp Business Cloud API.
 * MVP1: prefs stored locally; re-score is manual (user-initiated).
 *
 * Compliance:
 *   CG-9: Every notification must offer an unsubscribe option.
 *   DPDP Act 2023: User can revoke consent at any time — one tap.
 */

export type NotificationChannel = 'whatsapp' | 'sms' | 'none'
export type CheckInFrequency = 'weekly' | 'monthly' | 'quarterly'

export type NotificationPrefs = {
  primaryChannel: NotificationChannel
  smsEnabled: boolean
  checkInFrequency: CheckInFrequency
  weeklyBrief: boolean          // Monday news brief
  streakReminders: boolean      // streak at-risk nudge
  rescoreReminders: boolean     // quarterly re-score prompt
  stopped: boolean              // STOP command received
  updatedAt: string
}

export const DEFAULT_PREFS: NotificationPrefs = {
  primaryChannel: 'whatsapp',
  smsEnabled: false,
  checkInFrequency: 'weekly',
  weeklyBrief: true,
  streakReminders: true,
  rescoreReminders: true,
  stopped: false,
  updatedAt: new Date().toISOString(),
}

export type LifeEventType =
  | 'marriage'
  | 'new_child'
  | 'job_change'
  | 'salary_change'
  | 'new_loan'
  | 'parent_added'
  | 'home_purchase'
  | 'other'

export const LIFE_EVENT_LABELS: Record<LifeEventType, string> = {
  marriage:      'Got married',
  new_child:     'New child / adoption',
  job_change:    'Changed job',
  salary_change: 'Salary changed significantly',
  new_loan:      'Took a new loan / EMI',
  parent_added:  'Added an ageing parent as dependant',
  home_purchase: 'Bought a home',
  other:         'Something else changed',
}

export const LIFE_EVENT_EMOJI: Record<LifeEventType, string> = {
  marriage:      '💍',
  new_child:     '👶',
  job_change:    '💼',
  salary_change: '💰',
  new_loan:      '🏦',
  parent_added:  '🧓',
  home_purchase: '🏠',
  other:         '✨',
}

export type LifeEvent = {
  id: string
  type: LifeEventType
  notes: string
  recordedAt: string
  rescoreTriggered: boolean
}

export type RescoreSignal = {
  reason: 'time_elapsed' | 'life_event' | 'manual'
  triggeredAt: string
  lifeEventId?: string
  dismissed: boolean
}

// ── Prefs CRUD ────────────────────────────────────────────────
const PREFS_KEY = 'kin_notification_prefs'

export function getPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS }
  } catch { return { ...DEFAULT_PREFS } }
}

export function savePrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      ...prefs,
      updatedAt: new Date().toISOString(),
    }))
  } catch { /* ignore */ }
}

export function stopAllNotifications(): void {
  const prefs = getPrefs()
  savePrefs({ ...prefs, stopped: true, primaryChannel: 'none', smsEnabled: false })
}

// ── Life events ───────────────────────────────────────────────
const EVENTS_KEY = 'kin_life_events'

export function getLifeEvents(): LifeEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function recordLifeEvent(type: LifeEventType, notes: string): LifeEvent {
  const events = getLifeEvents()
  const event: LifeEvent = {
    id: crypto.randomUUID(),
    type,
    notes,
    recordedAt: new Date().toISOString(),
    rescoreTriggered: true,
  }
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify([...events, event]))
    // Trigger re-score signal
    setRescoreSignal({ reason: 'life_event', lifeEventId: event.id })
  } catch { /* ignore */ }
  return event
}

// ── Re-score signal ───────────────────────────────────────────
const RESCORE_KEY = 'kin_rescore_signal'

export function getRescoreSignal(): RescoreSignal | null {
  try {
    const raw = localStorage.getItem(RESCORE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setRescoreSignal(opts: Pick<RescoreSignal, 'reason' | 'lifeEventId'>): void {
  const signal: RescoreSignal = {
    ...opts,
    triggeredAt: new Date().toISOString(),
    dismissed: false,
  }
  try { localStorage.setItem(RESCORE_KEY, JSON.stringify(signal)) } catch { /* ignore */ }
}

export function dismissRescoreSignal(): void {
  const signal = getRescoreSignal()
  if (!signal) return
  try {
    localStorage.setItem(RESCORE_KEY, JSON.stringify({ ...signal, dismissed: true }))
  } catch { /* ignore */ }
}

// ── Time-based re-score check ─────────────────────────────────
// Triggers if last diagnostic was >90 days ago
export function checkTimeBasedRescore(): boolean {
  const profile = sessionStorage.getItem('kin_diagnostic_profile')
  if (!profile) return false // never diagnosed

  // Check when vault was last updated as a proxy for "last active"
  const signal = getRescoreSignal()
  if (signal && !signal.dismissed) return false // already pending

  // Use kin_streak to check last active date
  try {
    const streakRaw = localStorage.getItem('kin_streak')
    if (!streakRaw) return false
    const streak = JSON.parse(streakRaw)
    const lastActive = new Date(streak.lastVisit)
    const daysSince = (Date.now() - lastActive.getTime()) / 86_400_000
    if (daysSince > 90) {
      setRescoreSignal({ reason: 'time_elapsed' })
      return true
    }
  } catch { /* ignore */ }
  return false
}

// ── WhatsApp number (Phase 2 placeholder) ─────────────────────
const WA_KEY = 'kin_whatsapp_number'

export function getWhatsAppNumber(): string {
  return localStorage.getItem(WA_KEY) ?? ''
}

export function saveWhatsAppNumber(number: string): void {
  try { localStorage.setItem(WA_KEY, number) } catch { /* ignore */ }
}
