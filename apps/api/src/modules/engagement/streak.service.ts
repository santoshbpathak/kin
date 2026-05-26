/**
 * StreakService — Module 8A: Protection Streak & Milestones
 *
 * Weekly actions and points (PRD):
 *   weekly_health_checkin  → 10 pts
 *   read_brief             → 5 pts
 *   vault_upload           → 15 pts
 *   quiz_complete          → 10 pts
 *   update_nominees        → 20 pts
 *   share_scorecard        → 10 pts
 *
 * 6 milestone badges:
 *   consistent_protector   - 4-week streak
 *   growing_protector      - 8-week streak AND latest score ≥ 60 (+100 bonus pts)
 *   family_guardian        - 12-week streak
 *   well_protected         - latest score ≥ 80
 *   vault_keeper           - first vault document uploaded
 *   family_first           - at least 1 nominee AND at least 1 vault document
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { StreakRecord } from '../../database/entities/streak-record.entity'
import { Nominee } from '../../database/entities/nominee.entity'
import { VaultDocument } from '../../database/entities/vault-document.entity'
import { ProtectionScore } from '../../database/entities/protection-score.entity'

const ACTION_POINTS: Record<string, number> = {
  weekly_health_checkin: 10,
  read_brief:            5,
  vault_upload:          15,
  quiz_complete:         10,
  update_nominees:       20,
  share_scorecard:       10,
}

const GROWING_PROTECTOR_BONUS = 100

interface BadgeContext {
  streak: StreakRecord
  latestScore: number
  vaultCount: number
  nomineeCount: number
}

const BADGE_RULES: Array<{
  id: string
  label: string
  check: (ctx: BadgeContext) => boolean
}> = [
  { id: 'consistent_protector', label: '4-Week Streak',     check: c => c.streak.currentStreakWeeks >= 4 },
  { id: 'growing_protector',    label: '8-Week Streak (Score 60+)', check: c => c.streak.currentStreakWeeks >= 8 && c.latestScore >= 60 },
  { id: 'family_guardian',      label: '12-Week Streak',    check: c => c.streak.currentStreakWeeks >= 12 },
  { id: 'well_protected',       label: 'Well Protected (Score 80+)', check: c => c.latestScore >= 80 },
  { id: 'vault_keeper',         label: 'First Vault Doc',   check: c => c.vaultCount >= 1 },
  { id: 'family_first',         label: 'Nominee + Vault Set', check: c => c.nomineeCount >= 1 && c.vaultCount >= 1 },
]

@Injectable()
export class StreakService {
  constructor(
    @InjectRepository(StreakRecord)
    private readonly streakRepo: Repository<StreakRecord>,
    @InjectRepository(Nominee)
    private readonly nomineeRepo: Repository<Nominee>,
    @InjectRepository(VaultDocument)
    private readonly vaultRepo: Repository<VaultDocument>,
    @InjectRepository(ProtectionScore)
    private readonly scoreRepo: Repository<ProtectionScore>,
  ) {}

  async getOrCreate(userId: string): Promise<StreakRecord> {
    let streak = await this.streakRepo.findOne({ where: { userId } })
    if (!streak) {
      streak = this.streakRepo.create({
        userId,
        currentStreakWeeks: 0,
        totalPoints: 0,
        badgesEarned: [],
        visitDates: [],
      })
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

    // Evaluate badges - needs latest score, nominee count, vault count
    const ctx = await this.buildBadgeContext(userId, streak)
    const earned = new Set(streak.badgesEarned)
    for (const rule of BADGE_RULES) {
      if (!earned.has(rule.id) && rule.check(ctx)) {
        earned.add(rule.id)
        if (rule.id === 'growing_protector') {
          streak.totalPoints += GROWING_PROTECTOR_BONUS
        }
      }
    }
    streak.badgesEarned = Array.from(earned)
    return this.streakRepo.save(streak)
  }

  async getStreak(userId: string): Promise<StreakRecord> {
    return this.getOrCreate(userId)
  }

  private async buildBadgeContext(userId: string, streak: StreakRecord): Promise<BadgeContext> {
    const [latestScoreRow, vaultCount, nomineeCount] = await Promise.all([
      this.scoreRepo.findOne({ where: { userId }, order: { calculatedAt: 'DESC' } }),
      this.vaultRepo.count({ where: { userId } }),
      this.nomineeRepo.count({ where: { userId } }),
    ])
    return {
      streak,
      latestScore: Number(latestScoreRow?.compositeScore ?? 0),
      vaultCount,
      nomineeCount,
    }
  }
}
