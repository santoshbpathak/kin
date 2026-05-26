/**
 * ProtectionScoreService — Module 4
 *
 * Deterministic rule-based score engine (NO ML/AI).
 * Same inputs always produce same outputs — required for IRDAI audit trail.
 *
 * Formula:
 *   Life Score (40%)    = (term_cover) / (10 × annual_income) × 100, capped at 100
 *   Health Score (35%)  = (mediclaim + CI) / (3 × annual_income × age_factor) × 100
 *   Income Score (25%)  = (income_protection) / (monthly_obligations × 24) × 100
 *   Composite           = (Life × 0.40) + (Health × 0.35) + (Income × 0.25)
 *
 * Score inflation guards:
 *   - Employer mediclaim counted at 70% face value
 *   - ULIP/endowment: only pure risk component counted
 *   - Hidden coverages tracked separately — NOT added to composite
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProtectionScore } from '../../database/entities/protection-score.entity'
import type { ParsedProfile } from '../diagnostic/nlp-parser.service'

export const RULE_VERSION = 'v1.0.0'

export interface ScoreResult {
  compositeScore: number
  lifeSubScore: number
  healthSubScore: number
  incomeSubScore: number
  hiddenCoverageTotal: number
  ruleVersion: string
  band: string
  bandColour: string
  gaps: { life: number; health: number; income: number }
}

function scoreBand(score: number): { label: string; colour: string } {
  if (score <= 30) return { label: 'Critical Risk',      colour: '#EF4444' }
  if (score <= 55) return { label: 'Significant Gap',    colour: '#F59E0B' }
  if (score <= 75) return { label: 'Moderate Gap',       colour: '#EAB308' }
  if (score <= 90) return { label: 'Well Protected',     colour: '#22C55E' }
  return               { label: 'Fully Protected',       colour: '#14B8A6' }
}

@Injectable()
export class ProtectionScoreService {
  constructor(
    @InjectRepository(ProtectionScore)
    private readonly scoreRepo: Repository<ProtectionScore>,
  ) {}

  calculate(profile: ParsedProfile, hiddenCoverageTotal = 0): ScoreResult {
    const annualIncome = profile.annualIncomeLakhs * 100000

    // ── Life Score ───────────────────────────────────────────────
    const recommendedTermCover = annualIncome * 10
    const rawLife = recommendedTermCover > 0
      ? Math.min(100, (profile.termCoverAmount / recommendedTermCover) * 100)
      : 0

    // ── Health Score ─────────────────────────────────────────────
    const ageFactor = profile.dependantsCount > 0 ? 1.2 : 1.0
    const recommendedHealth = annualIncome * 3 * ageFactor
    // Employer mediclaim at 70% (inflation guard)
    const effectiveHealth = profile.healthCoverAmount * 0.70
    const rawHealth = recommendedHealth > 0
      ? Math.min(100, (effectiveHealth / recommendedHealth) * 100)
      : 0

    // ── Income Score ─────────────────────────────────────────────
    const monthlyObligations = this.parseObligationBand(profile.monthlyObligationsBand)
    const recommendedIncome = monthlyObligations * 24
    const rawIncome = recommendedIncome > 0
      ? Math.min(100, (profile.incomeProtectionAmount / recommendedIncome) * 100)
      : (monthlyObligations === 0 ? 50 : 0) // no EMI = neutral

    // ── Composite ────────────────────────────────────────────────
    const lifeSubScore   = Math.round(rawLife * 10) / 10
    const healthSubScore = Math.round(rawHealth * 10) / 10
    const incomeSubScore = Math.round(rawIncome * 10) / 10
    const composite = Math.round(
      ((lifeSubScore * 0.40) + (healthSubScore * 0.35) + (incomeSubScore * 0.25)) * 10
    ) / 10

    const { label, colour } = scoreBand(composite)

    return {
      compositeScore: composite,
      lifeSubScore,
      healthSubScore,
      incomeSubScore,
      hiddenCoverageTotal,
      ruleVersion: RULE_VERSION,
      band: label,
      bandColour: colour,
      gaps: {
        life:   Math.max(0, recommendedTermCover - profile.termCoverAmount),
        health: Math.max(0, recommendedHealth - effectiveHealth),
        income: Math.max(0, recommendedIncome - profile.incomeProtectionAmount),
      },
    }
  }

  async save(userId: string, result: ScoreResult, inputs: ParsedProfile): Promise<ProtectionScore> {
    const score = this.scoreRepo.create({
      userId,
      compositeScore: result.compositeScore,
      lifeSubScore: result.lifeSubScore,
      healthSubScore: result.healthSubScore,
      incomeSubScore: result.incomeSubScore,
      hiddenCoverageTotal: result.hiddenCoverageTotal,
      ruleVersion: result.ruleVersion,
      inputsSnapshot: inputs as unknown as Record<string, unknown>,
    })
    return this.scoreRepo.save(score)
  }

  async getLatest(userId: string): Promise<ProtectionScore | null> {
    return this.scoreRepo.findOne({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    })
  }

  /**
   * Persist a score computed client-side (frontend deterministic engine).
   * Used by /v1/score/save - returns the scoreId for the recommendation
   * audit FK. Inputs snapshot is stored verbatim; PII scrubbing happens
   * on the trust side.
   */
  async saveFromClient(
    userId: string,
    score: {
      compositeScore: number
      lifeSubScore: number
      healthSubScore: number
      incomeSubScore: number
      hiddenCoverageTotal: number
      ruleVersion: string
      inputsSnapshot: Record<string, unknown>
    },
  ): Promise<ProtectionScore> {
    const row = this.scoreRepo.create({
      userId,
      compositeScore: score.compositeScore,
      lifeSubScore: score.lifeSubScore,
      healthSubScore: score.healthSubScore,
      incomeSubScore: score.incomeSubScore,
      hiddenCoverageTotal: score.hiddenCoverageTotal,
      ruleVersion: score.ruleVersion,
      inputsSnapshot: score.inputsSnapshot,
    })
    return this.scoreRepo.save(row)
  }

  private parseObligationBand(band: string): number {
    const match = band?.match(/(\d+)/)?.[1]
    if (!match) return 0
    return parseInt(match, 10) * 1000
  }
}
