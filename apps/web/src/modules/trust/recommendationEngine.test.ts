import { describe, it, expect } from 'vitest'
import { generateRecommendations, REC_RULE_VERSION } from './recommendationEngine'
import { calculateScore } from '../score/scoreEngine'
import type { UserProfile } from '../diagnostic/parser'

const PROFILE: UserProfile = {
  lifeStage: 'married_with_kids',
  incomeBand: '10_20l',
  dependantsCount: 2,
  monthlyObligationsBand: '15_40k',
  hasEmployerMediclaim: true,
  hasPersonalHealth: false,
  hasTermLife: false,
  hasEndowment: false,
  cityTier: 'T1',
  occupation: 'salaried_pf',
  edliEligible: true,
}

describe('generateRecommendations', () => {
  it('is deterministic and returns at most five ranked recommendations', () => {
    const score = calculateScore(PROFILE)
    const a = generateRecommendations(PROFILE, score)
    const b = generateRecommendations(PROFILE, score)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
    expect(a.length).toBeLessThanOrEqual(5)
    const priorities = a.map(r => r.priority)
    expect([...priorities].sort((x, y) => x - y)).toEqual(priorities)
  })

  it('every recommendation is explainable and compliant (See the Math, no ULIP, disclaimer)', () => {
    const recs = generateRecommendations(PROFILE, calculateScore(PROFILE))
    for (const r of recs) {
      expect(r.basisText.length).toBeGreaterThan(20)
      expect(r.formula.length).toBeGreaterThan(5)
      expect(r.irdaiRuleReference.length).toBeGreaterThan(5)
      expect(r.productDisclaimer.length).toBeGreaterThan(10)
      expect(r.isUlip).toBe(false)
      expect(r.basisText).not.toMatch(/NaN|undefined/)
      expect(r.formula).not.toMatch(/NaN|undefined/)
      expect(Number.isFinite(r.estimatedScoreImpact)).toBe(true)
    }
    expect(REC_RULE_VERSION).toBe('v1.0.0')
  })

  it('a large life gap produces a term-life recommendation; a fully covered user does not', () => {
    const gap = generateRecommendations(PROFILE, calculateScore(PROFILE))
    expect(gap.some(r => r.productCategory === 'term_life')).toBe(true)

    const covered: UserProfile = { ...PROFILE, hasTermLife: true, actualPersonalLifeCover: 50_000_000 }
    const none = generateRecommendations(covered, calculateScore(covered))
    expect(none.some(r => r.productCategory === 'term_life')).toBe(false)
  })

  it('never produces NaN figures even for a profile with no income band match', () => {
    const odd = { ...PROFILE, incomeBand: 'nope' as never }
    const recs = generateRecommendations(odd, calculateScore(odd))
    for (const r of recs) expect(JSON.stringify(r)).not.toMatch(/NaN/)
  })
})
