import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm'
import { timestampColumnType } from './column-types'

@Entity('notification_prefs')
export class NotificationPrefsEntity {
  @PrimaryColumn('uuid')
  userId: string

  @Column({ type: 'varchar', length: 20, default: 'whatsapp' })
  primaryChannel: 'whatsapp' | 'sms' | 'none'

  @Column({ default: false })
  smsEnabled: boolean

  @Column({ type: 'varchar', length: 15, nullable: true })
  whatsappNumber: string

  @Column({ type: 'varchar', length: 20, default: 'weekly' })
  checkInFrequency: 'weekly' | 'fortnightly' | 'monthly'

  @Column({ default: true })
  weeklyBrief: boolean

  @Column({ default: true })
  streakReminders: boolean

  @Column({ default: true })
  rescoreReminders: boolean

  @Column({ default: false })
  stopped: boolean

  @UpdateDateColumn({ type: timestampColumnType })
  updatedAt: Date
}
