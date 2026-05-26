/**
 * NotificationPrefsService — Module 11: Lifecycle Layer
 *
 * Per-user notification preferences, persisted to notification_prefs table.
 * IRDAI CG-9: STOP must immediately halt all communications. STOP has no
 * confirmation step; re-activation requires explicit user action.
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NotificationPrefsEntity } from '../../database/entities/notification-prefs.entity'

export interface NotificationPrefs {
  userId: string
  primaryChannel: 'whatsapp' | 'sms' | 'none'
  smsEnabled: boolean
  whatsappNumber?: string
  checkInFrequency: 'weekly' | 'fortnightly' | 'monthly'
  weeklyBrief: boolean
  streakReminders: boolean
  rescoreReminders: boolean
  stopped: boolean
  updatedAt: string
}

const DEFAULTS = (userId: string): Partial<NotificationPrefsEntity> => ({
  userId,
  primaryChannel: 'whatsapp',
  smsEnabled: false,
  checkInFrequency: 'weekly',
  weeklyBrief: true,
  streakReminders: true,
  rescoreReminders: true,
  stopped: false,
})

@Injectable()
export class NotificationPrefsService {
  constructor(
    @InjectRepository(NotificationPrefsEntity)
    private readonly repo: Repository<NotificationPrefsEntity>,
  ) {}

  async getPrefs(userId: string): Promise<NotificationPrefs> {
    const existing = await this.repo.findOne({ where: { userId } })
    if (existing) return toView(existing)
    const created = await this.repo.save(this.repo.create(DEFAULTS(userId)))
    return toView(created)
  }

  async updatePrefs(
    userId: string,
    updates: Partial<Omit<NotificationPrefs, 'userId' | 'updatedAt'>>,
  ): Promise<NotificationPrefs> {
    const existing = (await this.repo.findOne({ where: { userId } }))
      ?? this.repo.create(DEFAULTS(userId))
    Object.assign(existing, updates)
    const saved = await this.repo.save(existing)
    return toView(saved)
  }

  /** IRDAI/CG-9 STOP — immediate halt of all outbound communications. */
  async stopAllNotifications(userId: string): Promise<NotificationPrefs> {
    return this.updatePrefs(userId, {
      stopped: true,
      primaryChannel: 'none',
      smsEnabled: false,
      weeklyBrief: false,
      streakReminders: false,
      rescoreReminders: false,
    })
  }

  async reactivateNotifications(userId: string): Promise<NotificationPrefs> {
    return this.updatePrefs(userId, {
      stopped: false,
      primaryChannel: 'whatsapp',
      weeklyBrief: true,
      streakReminders: true,
      rescoreReminders: true,
    })
  }

  async isUserStopped(userId: string): Promise<boolean> {
    return (await this.getPrefs(userId)).stopped
  }

  async shouldSendToUser(userId: string, channel: 'whatsapp' | 'sms'): Promise<boolean> {
    const prefs = await this.getPrefs(userId)
    if (prefs.stopped) return false
    if (prefs.primaryChannel === 'none') return false
    if (channel === 'whatsapp' && prefs.primaryChannel !== 'whatsapp') return false
    if (channel === 'sms' && !prefs.smsEnabled) return false
    return true
  }
}

function toView(e: NotificationPrefsEntity): NotificationPrefs {
  return {
    userId: e.userId,
    primaryChannel: e.primaryChannel,
    smsEnabled: e.smsEnabled,
    whatsappNumber: e.whatsappNumber ?? undefined,
    checkInFrequency: e.checkInFrequency,
    weeklyBrief: e.weeklyBrief,
    streakReminders: e.streakReminders,
    rescoreReminders: e.rescoreReminders,
    stopped: e.stopped,
    updatedAt: e.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}
