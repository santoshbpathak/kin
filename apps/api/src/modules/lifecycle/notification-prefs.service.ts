/**
 * NotificationPrefsService — Module 11: Lifecycle Layer
 *
 * Manages per-user notification preferences.
 * IRDAI/CG-9: STOP must immediately halt all communications.
 * DPDP Act 2023: user can update or revoke notification consent at any time.
 */
import { Injectable } from '@nestjs/common'

export interface NotificationPrefs {
  userId: string
  primaryChannel: 'whatsapp' | 'sms' | 'none'
  smsEnabled: boolean
  whatsappNumber?: string
  checkInFrequency: 'weekly' | 'fortnightly' | 'monthly'
  weeklyBrief: boolean
  streakReminders: boolean
  rescoreReminders: boolean
  stopped: boolean      // STOP command received — all comms halted
  updatedAt: string
}

// Phase 2: NotificationPrefsEntity in DB
const prefsStore = new Map<string, NotificationPrefs>()

const DEFAULT_PREFS = (userId: string): NotificationPrefs => ({
  userId,
  primaryChannel: 'whatsapp',
  smsEnabled: false,
  whatsappNumber: undefined,
  checkInFrequency: 'weekly',
  weeklyBrief: true,
  streakReminders: true,
  rescoreReminders: true,
  stopped: false,
  updatedAt: new Date().toISOString(),
})

@Injectable()
export class NotificationPrefsService {
  getPrefs(userId: string): NotificationPrefs {
    return prefsStore.get(userId) ?? DEFAULT_PREFS(userId)
  }

  updatePrefs(userId: string, updates: Partial<Omit<NotificationPrefs, 'userId' | 'updatedAt'>>): NotificationPrefs {
    const current = this.getPrefs(userId)
    const updated: NotificationPrefs = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    }
    prefsStore.set(userId, updated)
    return updated
  }

  /**
   * IRDAI/CG-9: STOP — immediately halts ALL outbound communications.
   * One-tap. No confirmation required for STOP (only for re-activation).
   */
  stopAllNotifications(userId: string): NotificationPrefs {
    return this.updatePrefs(userId, {
      stopped: true,
      primaryChannel: 'none',
      smsEnabled: false,
      weeklyBrief: false,
      streakReminders: false,
      rescoreReminders: false,
    })
  }

  /**
   * Re-activate notifications (requires explicit user action — START command or UI toggle).
   */
  reactivateNotifications(userId: string): NotificationPrefs {
    return this.updatePrefs(userId, {
      stopped: false,
      primaryChannel: 'whatsapp',
      weeklyBrief: true,
      streakReminders: true,
      rescoreReminders: true,
    })
  }

  isUserStopped(userId: string): boolean {
    return this.getPrefs(userId).stopped
  }

  shouldSendToUser(userId: string, channel: 'whatsapp' | 'sms'): boolean {
    const prefs = this.getPrefs(userId)
    if (prefs.stopped) return false
    if (prefs.primaryChannel === 'none') return false
    if (channel === 'whatsapp' && prefs.primaryChannel !== 'whatsapp') return false
    if (channel === 'sms' && !prefs.smsEnabled) return false
    return true
  }
}
