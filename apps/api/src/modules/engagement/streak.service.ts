/**
 * StreakService — Module 8A: Protection Streak & Milestones
 *
 * Weekly actions and points:
 *   weekly_health_checkin  → 10 pts
 *   read_brief             → 5 pts
 *   vault_upload           → 15 pts
 *   quiz_complete          → 10 pts
 *   update_nominees        → 20 pts
 *   share_scorecard        → 10 pts
 *
 * Badges auto-evaluated on every recordAction call.
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { StreakRecord } from '../../database/entities/streak-record.entity'

const ACTION_POINTS: Record<string, number> = {
  weekly_health_checkin: 10,
  read_brief:            5,
  vault_upload:          15,
  quiz_complete:         10,
  update_nominees:       20,
  share_scorecard:       10,
}

const BADGE_RULES = [
  { id: 'consistent_protector', label: '4-Week Streak',     check: (s: StreakRecord) => s.currentStreakWeeks >= 4 },
  { id: 'growing_protector',    label: '8-Week Streak',     check: (s: StreakRecord) => s.currentStreakWeeks >= 8 },
  { id: 'family_guardian',      label: '12-Week Streak',    check: (s: StreakRecord) => s.currentStreakWeeks >= 12 },
  { id: 'vault_keeper',         label: 'First Vault Doc',   check: (s: StreakRecord) => s.totalPoints >= 15 },
]

@Injectable()
export class StreakService {
  constructor(
    @InjectRepository(StreakRecord)
    private readonly streakRepo: Repository<StreakRecord>,
  ) {}

  async getOrCreate(userId: string): Promise<StreakRecord> {
    let streak = await this.streakRepo.findOne({ where: { userId } })
    if (!streak) {
      streak = this.streakRepo.create({ userId, currentStreakWeeks: 0, totalPoints: 0, badgesEarned: [], visitDates: [] })
      streak = await this.streakRepo.save(streak)
    }
    return streak
  }

  async recordVisit(userId: string): Promise<StreakRecord> {
    const streak = await this.getOrCreate(userId)
    const today = new Date().toISOString().slice(0, 10)
    const visits = streak.visitDates ?? []
    if (!visits.includes(today)) {
      streak.visitDates = [...visits, today].slice(-30)
    }
    // Streak weeks: count distinct weeks with at least one visit
    const weekSet = new Set(streak.visitDates.map(d => {
      const dt = new Date(d)
      const weekStart = new Date(dt)
      weekStart.setDate(dt.getDate() - dt.getDay())
      return weekStart.toISOString().slice(0, 10)
    }))
    streak.currentStreakWeeks = weekSet.size
    streak.longestStreakWeeks = Math.max(streak.longestStreakWeeks, streak.currentStreakWeeks)
    return this.streakRepo.save(streak)
  }

  async recordAction(userId: string, actionType: string): Promise<StreakRecord> {
    const streak = await this.getOrCreate(userId)
    const points = ACTION_POINTS[actionType] ?? 5
    streak.totalPoints += points
    streak.lastActionAt = new Date()

    // Evaluate badges
    const earned = new Set(streak.badgesEarned)
    for (const rule of BADGE_RULES) {
      if (!earned.has(rule.id) && rule.check(streak)) {
        earned.add(rule.id)
      }
    }
    streak.badgesEarned = Array.from(earned)
    return this.streakRepo.save(streak)
  }

  async getStreak(userId: string): Promise<StreakRecord> {
    return this.getOrCreate(userId)
  }
}
