/**
 * Synthetic demo personas.
 *
 * Every persona here is fictional. Names are deliberately generic, the word
 * "Demo" appears in every label, and the figures are round numbers chosen to
 * make the arithmetic in docs/financial-methodology.md easy to follow. They
 * are used by the deterministic engine tests and documented in
 * docs/demo/personas.md so a developer can reproduce each score by hand.
 *
 * None of this data describes a real person. Do not add real customer data.
 */
import type { ParsedProfile } from '../../modules/diagnostic/nlp-parser.service'

export interface DemoPersona {
  id: string
  label: string
  story: string
  profile: ParsedProfile
  /** Hand-computed expected output of ProtectionScoreService.calculate(). */
  expected: {
    lifeSubScore: number
    healthSubScore: number
    incomeSubScore: number
    compositeScore: number
    band: string
  }
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'demo-early-career-single',
    label: 'Demo persona A — early-career, single, Tier 1 city',
    story:
      'Salaried with PF, ₹7.5L a year, no dependants, ₹15K/month in EMIs, only a ₹3L employer mediclaim and no life or income cover.',
    profile: {
      incomeBand: '5l_10l',
      cityTier: 'T1',
      lifeStage: 'single',
      dependantsCount: 0,
      monthlyObligationsBand: 'lt_15k',
      hasLifeCover: false,
      hasHealthCover: true,
      hasAccidentCover: false,
      termCoverAmount: 0,
      healthCoverAmount: 300_000,
      incomeProtectionAmount: 0,
      annualIncomeLakhs: 7.5,
      occupationCategory: 'salaried_pf',
    },
    // life 0 ; health 210000 / 2250000 = 9.3 ; income 0 ; composite 3.3
    expected: { lifeSubScore: 0, healthSubScore: 9.3, incomeSubScore: 0, compositeScore: 3.3, band: 'Critical Risk' },
  },
  {
    id: 'demo-married-with-kids',
    label: 'Demo persona B — married with kids, mid income, Tier 2 city',
    story:
      'Self-employed, ₹15L a year, three dependants, ₹15–40K/month in EMIs, a ₹50L term policy and ₹10L health cover, no income protection.',
    profile: {
      incomeBand: '10l_20l',
      cityTier: 'T2',
      lifeStage: 'married_with_kids',
      dependantsCount: 3,
      monthlyObligationsBand: '15_40k',
      hasLifeCover: true,
      hasHealthCover: true,
      hasAccidentCover: false,
      termCoverAmount: 5_000_000,
      healthCoverAmount: 1_000_000,
      incomeProtectionAmount: 0,
      annualIncomeLakhs: 15,
      occupationCategory: 'self_employed',
    },
    // life 5M/15M = 33.3 ; health 700000 / 5400000 = 13.0 ; income 0 ; composite 17.9
    expected: { lifeSubScore: 33.3, healthSubScore: 13, incomeSubScore: 0, compositeScore: 17.9, band: 'Critical Risk' },
  },
  {
    id: 'demo-well-protected',
    label: 'Demo persona C — well-protected senior professional, no EMIs',
    story:
      'Government employee, ₹35L a year, two dependants, no EMIs, ₹4Cr term cover and ₹20L health cover.',
    profile: {
      incomeBand: '20l_50l',
      cityTier: 'T1',
      lifeStage: 'married_with_kids',
      dependantsCount: 2,
      monthlyObligationsBand: 'none',
      hasLifeCover: true,
      hasHealthCover: true,
      hasAccidentCover: true,
      termCoverAmount: 40_000_000,
      healthCoverAmount: 2_000_000,
      incomeProtectionAmount: 0,
      annualIncomeLakhs: 35,
      occupationCategory: 'govt',
    },
    // life capped 100 ; health 1.4M / 12.6M = 11.1 ; income: no EMIs -> neutral 50 ; composite 56.4
    expected: { lifeSubScore: 100, healthSubScore: 11.1, incomeSubScore: 50, compositeScore: 56.4, band: 'Moderate Gap' },
  },
]
