import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
} from 'typeorm'
import { jsonColumnType } from './column-types'

@Entity('streak_records')
export class StreakRecord {
  @PrimaryGeneratedColumn('uuid')
  streakId: string

  @Column({ unique: true })
  userId: string

  @Column({ default: 0 })
  currentStreakWeeks: number

  @Column({ default: 0 })
  longestStreakWeeks: number

  @Column({ default: 0 })
  totalPoints: number

  @Column({ nullable: true })
  lastActionAt: Date

  @Column({ type: jsonColumnType, nullable: true })
  badgesEarned: string[]

  @Column({ type: jsonColumnType, nullable: true })
  visitDates: string[]   // ISO date strings for last 30 days

  @UpdateDateColumn()
  updatedAt: Date
}
