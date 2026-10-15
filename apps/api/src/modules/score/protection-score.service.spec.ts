/**
 * Deterministic tests for the server-side Protection Score engine.
 *
 * These lock the CURRENT formulas (documented in docs/financial-methodology.md)
 * and the input-guard behaviour. They do not assert that the formulas are
 * actuarially correct — questionable assumptions are listed in that document
 * for human review.
 */
import { ProtectionScoreService, RULE_VERSION, safeAmount } from './protection-score.service'
import { DEMO_PERSONAS } from '../../shared/demo/personas'
import type { ParsedProfile } from '../diagnostic/nlp-parser.service'

const engine = new ProtectionScoreService({} as never)

const BASE: ParsedProfile = {
  incomeBand: '10l_20l',
  cityTier: 'T1',
  lifeStage: 'married_with_kids',
  dependantsCount: 2,
  monthlyObligationsBand: '15_40k',
  hasLifeCover: true,
  hasHealthCover: true,
  hasAccidentCover: false,
  termCoverAmount: 5_000_000,
  healthCoverAmount: 1_000_000,
  incomeProtectionAmount: 100_000,
  annualIncomeLakhs: 15,
  occupationCategory: 'salaried_pf',
}

function expectWellFormed(result: ReturnType<typeof engine.calculate>) {
  for (const v of [result.compositeScore, result.lifeSubScore, result.healthSubScore, result.incomeSubScore]) {
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(100)
  }
  for (const g of Object.values(result.gaps)) {
    expect(Number.isFinite(g)).toBe(true)
    expect(g).toBeGreaterThanOrEqual(0)
  }
  expect(result.ruleVersion).toBe(RULE_VERSION)
  expect(typeof result.band).toBe('string')
}

describe('ProtectionScoreService.calculate — demo personas (hand-computed)', () => {
  for (const persona of DEMO_PERSONAS) {
    it(persona.label, () => {
      const r = engine.calculate(persona.profile)
      expectWellFormed(r)
      expect(r.lifeSubScore).toBeCloseTo(persona.expected.lifeSubScore, 1)
      expect(r.healthSubScore).toBeCloseTo(persona.expected.healthSubScore, 1)
      expect(r.incomeSubScore).toBeCloseTo(persona.expected.incomeSubScore, 1)
      expect(r.compositeScore).toBeCloseTo(persona.expected.compositeScore, 1)
      expect(r.band).toBe(persona.expected.band)
    })
  }
})

describe('ProtectionScoreService.calculate — boundary conditions', () => {
  it('is deterministic: identical inputs produce identical outputs', () => {
    expect(engine.calculate(BASE)).toEqual(engine.calculate({ ...BASE }))
  })

  it('zero income scores life and health as 0 (no recommended cover to compare against)', () => {
    const r = engine.calculate({ ...BASE, annualIncomeLakhs: 0 })
    expectWellFormed(r)
    expect(r.lifeSubScore).toBe(0)
    expect(r.healthSubScore).toBe(0)
    expect(r.gaps.life).toBe(0)
    expect(r.gaps.health).toBe(0)
  })

  it('zero cover everywhere scores 0 on every axis when obligations exist', () => {
    const r = engine.calculate({ ...BASE, termCoverAmount: 0, healthCoverAmount: 0, incomeProtectionAmount: 0 })
    expectWellFormed(r)
    expect(r.lifeSubScore).toBe(0)
    expect(r.healthSubScore).toBe(0)
    expect(r.incomeSubScore).toBe(0)
    expect(r.compositeScore).toBe(0)
    expect(r.band).toBe('Critical Risk')
    expect(r.gaps.life).toBe(15 * 100_000 * 10)
  })

  it('very high existing cover is capped at 100 per axis and 100 composite', () => {
    const r = engine.calculate({
      ...BASE,
      termCoverAmount: 1_000_000_000,
      healthCoverAmount: 1_000_000_000,
      incomeProtectionAmount: 1_000_000_000,
    })
    expectWellFormed(r)
    expect(r.lifeSubScore).toBe(100)
    expect(r.healthSubScore).toBe(100)
    expect(r.incomeSubScore).toBe(100)
    expect(r.compositeScore).toBe(100)
    expect(r.band).toBe('Fully Protected')
    expect(r.gaps).toEqual({ life: 0, health: 0, income: 0 })
  })

  it('negative inputs are treated as 0 and never produce NaN or negative scores', () => {
    const r = engine.calculate({
      ...BASE,
      annualIncomeLakhs: -15,
      termCoverAmount: -5_000_000,
      healthCoverAmount: -1,
      incomeProtectionAmount: -100,
      dependantsCount: -3,
    })
    expectWellFormed(r)
    expect(r).toEqual(
      engine.calculate({ ...BASE, annualIncomeLakhs: 0, termCoverAmount: 0, healthCoverAmount: 0, incomeProtectionAmount: 0, dependantsCount: 0 }),
    )
  })

  it('NaN, undefined and non-numeric inputs are treated as missing (0)', () => {
    const broken = {
      ...BASE,
      annualIncomeLakhs: Number.NaN,
      termCoverAmount: undefined,
      healthCoverAmount: 'ten lakh',
      incomeProtectionAmount: null,
      monthlyObligationsBand: undefined,
    } as unknown as ParsedProfile
    const r = engine.calculate(broken)
    expectWellFormed(r)
    expect(r.lifeSubScore).toBe(0)
    expect(r.healthSubScore).toBe(0)
    // a missing obligation band reads as "no EMIs" → neutral 50 on the income axis
    expect(r.incomeSubScore).toBe(50)
    expect(r.compositeScore).toBe(12.5)
  })

  it('no dependants uses the 1.0 health factor; any dependants uses 1.2', () => {
    const none = engine.calculate({ ...BASE, dependantsCount: 0 })
    const one = engine.calculate({ ...BASE, dependantsCount: 1 })
    const many = engine.calculate({ ...BASE, dependantsCount: 9 })
    // recommended health = income × 3 × factor ; gap = recommended − 0.7 × cover
    expect(none.gaps.health).toBe(15 * 100_000 * 3 * 1.0 - 700_000)
    expect(one.gaps.health).toBe(15 * 100_000 * 3 * 1.2 - 700_000)
    expect(many.gaps.health).toBe(one.gaps.health)
  })

  it('no monthly obligations gives the neutral income sub-score of 50', () => {
    const r = engine.calculate({ ...BASE, monthlyObligationsBand: 'none', incomeProtectionAmount: 0 })
    expect(r.incomeSubScore).toBe(50)
    expect(r.gaps.income).toBe(0)
  })

  it('obligation bands are read as "first number × 1000 per month" (documented quirk)', () => {
    const lt15 = engine.calculate({ ...BASE, monthlyObligationsBand: 'lt_15k', incomeProtectionAmount: 0 })
    const b1540 = engine.calculate({ ...BASE, monthlyObligationsBand: '15_40k', incomeProtectionAmount: 0 })
    expect(lt15.gaps.income).toBe(15_000 * 24)
    expect(b1540.gaps.income).toBe(15_000 * 24)
  })

  it('unusually high liabilities stay finite and simply drive the income score to 0', () => {
    const r = engine.calculate({ ...BASE, monthlyObligationsBand: '900000_plus', incomeProtectionAmount: 0 })
    expectWellFormed(r)
    expect(r.incomeSubScore).toBe(0)
    expect(r.gaps.income).toBe(900_000 * 1000 * 24)
  })

  it('extreme but valid values (₹1 trillion cover, ₹1 crore income) stay in range', () => {
    const r = engine.calculate({ ...BASE, annualIncomeLakhs: 100, termCoverAmount: 1e12, healthCoverAmount: 1e12 })
    expectWellFormed(r)
    expect(r.lifeSubScore).toBe(100)
  })

  it('rounds every sub-score and the composite to one decimal place', () => {
    const r = engine.calculate(BASE)
    for (const v of [r.compositeScore, r.lifeSubScore, r.healthSubScore, r.incomeSubScore]) {
      expect(Math.round(v * 10) / 10).toBe(v)
    }
  })

  it('band thresholds are inclusive upper bounds (30 / 55 / 75 / 90)', () => {
    // Composite = life × 0.4 when health and income are 0 → tune life via term cover.
    const at = (lifeScore: number) =>
      engine.calculate({
        ...BASE,
        annualIncomeLakhs: 10,
        termCoverAmount: lifeScore * 100_000, // 10L income → recommended 1Cr → 1L of cover = 1 point
        healthCoverAmount: 0,
        incomeProtectionAmount: 0,
        monthlyObligationsBand: '15_40k',
      })
    expect(at(75).compositeScore).toBe(30)
    expect(at(75).band).toBe('Critical Risk')
    expect(at(77.5).compositeScore).toBe(31)
    expect(at(77.5).band).toBe('Significant Gap')
  })
})

describe('safeAmount', () => {
  it.each([
    [5, 5],
    [0, 0],
    [-1, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    ['5', 0],
    [undefined, 0],
    [null, 0],
  ])('safeAmount(%p) -> %p', (input, expected) => {
    expect(safeAmount(input)).toBe(expected)
  })
})
