/**
 * Deterministic tests for the client-side Protection Score engine (the one
 * the UI actually uses). Formulas are documented in
 * docs/financial-methodology.md; these tests lock current behaviour and the
 * input guards, they do not assert actuarial correctness.
 */
import { describe, it, expect } from 'vitest'
import { calculateScore, sanitiseProfile, safeAmount, RULE_VERSION, type ScoreResult } from './scoreEngine'
import type { UserProfile } from '../diagnostic/parser'

// Synthetic personas — fictional, round numbers. See docs/demo/personas.md.
const PERSONA_W1: UserProfile = {
  lifeStage: 'single',
  incomeBand: 'lt_5l',
  dependantsCount: 0,
  monthlyObligationsBand: 'none',
  hasEmployerMediclaim: false,
  hasPersonalHealth: false,
  hasTermLife: false,
  hasEndowment: false,
  cityTier: 'T3',
  occupation: 'salaried_no_pf',
  edliEligible: false,
}

const PERSONA_W2: UserProfile = {
  lifeStage: 'married_with_kids',
  incomeBand: '10_20l',
  dependantsCount: 2,
  monthlyObligationsBand: '15_40k',
  hasEmployerMediclaim: true,
  hasPersonalHealth: true,
  hasTermLife: true,
  hasEndowment: false,
  cityTier: 'T1',
  occupation: 'salaried_pf',
  edliEligible: true,
}

function expectWellFormed(r: ScoreResult) {
  for (const v of [r.compositeScore, r.lifeScore.score, r.healthScore.score, r.incomeScore.score]) {
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(100)
  }
  for (const s of [r.lifeScore, r.healthScore, r.incomeScore]) {
    expect(Number.isFinite(s.currentCover)).toBe(true)
    expect(Number.isFinite(s.recommendedCover)).toBe(true)
    expect(s.gap).toBeGreaterThanOrEqual(0)
    expect(s.description).not.toMatch(/NaN|undefined/)
  }
  expect(r.ruleVersion).toBe(RULE_VERSION)
}

const strip = ({ calculatedAt: _t, ...rest }: ScoreResult) => rest

describe('calculateScore — personas (hand-computed)', () => {
  it('W1: no income to speak of, no cover, no EMIs → 25 (income axis is neutral-100)', () => {
    const r = calculateScore(PERSONA_W1)
    expectWellFormed(r)
    expect(r.lifeScore.score).toBe(0)
    expect(r.lifeScore.recommendedCover).toBe(3_000_000)
    expect(r.healthScore.score).toBe(0)
    expect(r.healthScore.recommendedCover).toBe(900_000)
    expect(r.incomeScore.score).toBe(100)
    expect(r.incomeScore.recommendedCover).toBe(0)
    expect(r.compositeScore).toBe(25)
    expect(r.band).toBe('critical')
    expect(r.hiddenCoverageTotal).toBe(0)
  })

  it('W2: declared covers fall back to the typical amounts (₹50L term, ₹5L×0.7 employer, ₹10L personal)', () => {
    const r = calculateScore(PERSONA_W2)
    expectWellFormed(r)
    expect(r.lifeScore.currentCover).toBe(5_000_000)
    expect(r.lifeScore.recommendedCover).toBe(15_000_000)
    expect(r.lifeScore.score).toBe(33)
    expect(r.healthScore.currentCover).toBe(350_000 + 1_000_000)
    expect(r.healthScore.recommendedCover).toBe(1_500_000 * 3 * 1.2)
    expect(r.healthScore.score).toBe(25)
    expect(r.incomeScore.recommendedCover).toBe(27_500 * 24)
    expect(r.incomeScore.score).toBe(0)
    expect(r.compositeScore).toBe(22)
    expect(r.band).toBe('critical')
    expect(r.hiddenCoverageTotal).toBe(700_000) // EDLI
    expect(r.edliEligible).toBe(true)
  })

  it('W2 with exact figures uses them instead of the typical fallbacks', () => {
    const r = calculateScore({
      ...PERSONA_W2,
      actualAnnualIncome: 2_000_000,
      actualPersonalLifeCover: 10_000_000,
      actualEmployerGroupTerm: 6_000_000,
      actualEmployerMediclaim: 400_000,
      actualPersonalHealthCover: 500_000,
      actualMonthlyObligations: 50_000,
      actualIncomeProtectionCover: 600_000,
    })
    expectWellFormed(r)
    expect(r.lifeScore.currentCover).toBe(16_000_000)
    expect(r.lifeScore.recommendedCover).toBe(20_000_000)
    expect(r.lifeScore.score).toBe(80)
    expect(r.healthScore.currentCover).toBe(400_000 * 0.7 + 500_000)
    expect(r.incomeScore.recommendedCover).toBe(1_200_000)
    expect(r.incomeScore.score).toBe(50)
  })
})

describe('calculateScore — boundary conditions', () => {
  it('is deterministic apart from the timestamp', () => {
    expect(strip(calculateScore(PERSONA_W2))).toEqual(strip(calculateScore({ ...PERSONA_W2 })))
  })

  it('zero exact income gives life and health 100 (documented: "nothing to protect" semantics)', () => {
    const r = calculateScore({ ...PERSONA_W2, actualAnnualIncome: 0 })
    expectWellFormed(r)
    expect(r.lifeScore.score).toBe(100)
    expect(r.healthScore.score).toBe(100)
    expect(r.lifeScore.recommendedCover).toBe(0)
  })

  it('zero cover with obligations scores 0 on life, health and income', () => {
    const r = calculateScore({
      ...PERSONA_W2,
      hasTermLife: false, hasEmployerMediclaim: false, hasPersonalHealth: false,
      actualPersonalLifeCover: 0, actualEmployerGroupTerm: 0, actualEmployerMediclaim: 0,
      actualPersonalHealthCover: 0, actualIncomeProtectionCover: 0,
    })
    expectWellFormed(r)
    expect([r.lifeScore.score, r.healthScore.score, r.incomeScore.score]).toEqual([0, 0, 0])
    expect(r.compositeScore).toBe(0)
  })

  it('very high cover is capped at 100 everywhere', () => {
    const r = calculateScore({
      ...PERSONA_W2,
      actualPersonalLifeCover: 1e10, actualPersonalHealthCover: 1e10, actualIncomeProtectionCover: 1e10,
    })
    expectWellFormed(r)
    expect(r.compositeScore).toBe(100)
    expect(r.band).toBe('full')
    expect([r.lifeScore.gap, r.healthScore.gap, r.incomeScore.gap]).toEqual([0, 0, 0])
  })

  it('negative or NaN exact figures are treated as not answered (fallbacks apply), never NaN', () => {
    const bad = calculateScore({
      ...PERSONA_W2,
      actualAnnualIncome: -1,
      actualPersonalLifeCover: Number.NaN,
      actualEmployerMediclaim: -500,
      actualIncomeProtectionCover: Number.NEGATIVE_INFINITY,
      dependantsCount: -4,
    })
    expectWellFormed(bad)
    const asMissing = calculateScore({ ...PERSONA_W2, dependantsCount: 0 })
    expect(strip(bad)).toEqual(strip(asMissing))
  })

  it('an unknown band never yields NaN (treated as ₹0)', () => {
    const r = calculateScore({ ...PERSONA_W2, incomeBand: 'nope' as never, monthlyObligationsBand: 'nope' as never })
    expectWellFormed(r)
    expect(r.lifeScore.recommendedCover).toBe(0)
    expect(r.incomeScore.recommendedCover).toBe(0)
    expect(r.incomeScore.score).toBe(100)
  })

  it('no dependants → health factor 1.0; many dependants scale linearly (10 → ×2.0, uncapped)', () => {
    expect(calculateScore({ ...PERSONA_W2, dependantsCount: 0 }).healthScore.recommendedCover).toBe(4_500_000)
    expect(calculateScore({ ...PERSONA_W2, dependantsCount: 10 }).healthScore.recommendedCover).toBe(9_000_000)
    expect(calculateScore({ ...PERSONA_W2, dependantsCount: 2.9 }).healthScore.recommendedCover).toBe(4_500_000 * 1.2)
  })

  it('unusually high liabilities stay finite and drive the income score to 0', () => {
    const r = calculateScore({ ...PERSONA_W2, actualMonthlyObligations: 5_000_000, actualIncomeProtectionCover: 0 })
    expectWellFormed(r)
    expect(r.incomeScore.recommendedCover).toBe(120_000_000)
    expect(r.incomeScore.score).toBe(0)
  })

  it('rounds sub-scores and composite to integers', () => {
    const r = calculateScore(PERSONA_W2)
    for (const v of [r.compositeScore, r.lifeScore.score, r.healthScore.score, r.incomeScore.score]) {
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('band thresholds: ≤30 critical, ≤55 significant, ≤75 moderate, ≤90 well, else full', () => {
    // income axis is 100 when there are no obligations → composite = 25 + 0.4·life + 0.35·health
    const withLife = (cover: number) =>
      calculateScore({ ...PERSONA_W1, hasTermLife: true, actualAnnualIncome: 1_000_000, actualPersonalLifeCover: cover })
    expect(withLife(0).compositeScore).toBe(25)
    expect(withLife(0).band).toBe('critical')
    expect(withLife(2_500_000).compositeScore).toBe(35)
    expect(withLife(2_500_000).band).toBe('significant')
    expect(withLife(10_000_000).compositeScore).toBe(65)
    expect(withLife(10_000_000).band).toBe('moderate')
  })
})

describe('input guards', () => {
  it.each([[5, 5], [0, 0], [-1, 0], [Number.NaN, 0], ['5', 0], [undefined, 0]])('safeAmount(%p) -> %p', (i, o) => {
    expect(safeAmount(i)).toBe(o)
  })
  it('sanitiseProfile leaves valid inputs untouched and nulls invalid exact figures', () => {
    const p = sanitiseProfile({ ...PERSONA_W2, actualAnnualIncome: 1_200_000, actualCiCover: -3 })
    expect(p.actualAnnualIncome).toBe(1_200_000)
    expect(p.actualCiCover).toBeUndefined()
    expect(p.dependantsCount).toBe(2)
  })
})
