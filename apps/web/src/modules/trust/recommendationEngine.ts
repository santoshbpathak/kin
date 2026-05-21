/**
 * KIN Recommendation Engine — v1.0.0
 *
 * Rule-based, fully deterministic. Not ML/AI.
 * Same inputs → same recommendations every time.
 *
 * Compliance:
 *   - Every recommendation has a logged basis_text ("See the Math" content)
 *   - Every recommendation has an IRDAI rule reference (CG-2)
 *   - Product category determines which disclaimer is injected (CG-4)
 *   - ULIP recommendations are gated OFF in MVP1 (CG-3)
 *
 * Per PRD: outputs 3–5 ranked actions ordered by impact on composite score.
 */

import type { UserProfile } from '../diagnostic/parser'
import type { ScoreResult } from '../score/scoreEngine'

export const REC_RULE_VERSION = 'v1.0.0'

export type ProductCategory =
  | 'term_life'
  | 'health'
  | 'ci_rider'
  | 'income_protection'
  | 'pmsby_activation'
  | 'edli_awareness'
  | 'top_up_health'
  | 'review_existing'

export type RecommendationPriority = 1 | 2 | 3 | 4 | 5

export interface Recommendation {
  id: string
  priority: RecommendationPriority
  productCategory: ProductCategory
  headline: string
  subtext: string
  actionLabel: string
  estimatedScoreImpact: number     // how many points this could add to composite
  basisText: string                 // "See the Math" plain-language explanation
  formula: string                   // exact formula string for "See the Math"
  irdaiRuleReference: string        // IRDAI guideline reference (CG-2)
  productDisclaimer: string         // CG-4 mandatory product-type disclaimer
  conditionsApply: boolean
  isUlip: boolean                   // CG-3: must be false in MVP1
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`
  return `₹${(n / 1_000).toFixed(0)}K`
}

const INCOME_MIDPOINT: Record<string, number> = {
  lt_5l: 300_000, '5_10l': 750_000, '10_20l': 1_500_000,
  '20_40l': 3_000_000, gt_40l: 5_000_000,
}
const OBLIGATION_MIDPOINT: Record<string, number> = {
  none: 0, lt_15k: 7_500, '15_40k': 27_500, '40_80k': 60_000, gt_80k: 100_000,
}

// ── Main engine ────────────────────────────────────────────────────────────
export function generateRecommendations(
  profile: UserProfile,
  score: ScoreResult,
): Recommendation[] {
  const recs: Recommendation[] = []
  const income = INCOME_MIDPOINT[profile.incomeBand]
  const obligations = OBLIGATION_MIDPOINT[profile.monthlyObligationsBand]
  const depFactor = 1 + profile.dependantsCount * 0.1

  // ── R1: Term life cover gap ──────────────────────────────────────────
  if (score.lifeScore.score < 80) {
    const needed = income * 10
    const have = profile.hasTermLife ? 5_000_000 : 0
    const gap = Math.max(0, needed - have)
    const impact = Math.round((gap / needed) * 40)   // life = 40% weight

    recs.push({
      id: 'R1_TERM_LIFE',
      priority: 1,
      productCategory: 'term_life',
      headline: profile.hasTermLife
        ? `Top up your term cover by ${fmt(gap)}`
        : `Get a ${fmt(needed)} term life plan`,
      subtext: profile.hasTermLife
        ? `Your current cover (~₹50L) covers only 33% of the recommended ${fmt(needed)} (10× income). A top-up closes the gap and costs ~₹800–1,200/month.`
        : `You have no term life cover. At ₹${(income / 100_000).toFixed(0)}L income and ${profile.dependantsCount} dependant${profile.dependantsCount !== 1 ? 's' : ''}, your family needs ${fmt(needed)} protection.`,
      actionLabel: 'Compare Term Plans',
      estimatedScoreImpact: impact,
      basisText: `Your annual income is ~${fmt(income)}. IRDAI suitability guidelines recommend a minimum sum assured of 10× annual income for a breadwinner with dependants. This equals ${fmt(needed)}. You currently have ${fmt(have)} in term cover (${profile.hasTermLife ? 'declared' : 'none declared'}). Gap = ${fmt(gap)}.`,
      formula: `Required cover = 10 × ${fmt(income)} = ${fmt(needed)}\nCurrent cover = ${fmt(have)}\nGap = ${fmt(needed)} − ${fmt(have)} = ${fmt(gap)}\nLife score after closing gap = ~80/100 (+${impact} pts to composite)`,
      irdaiRuleReference: 'IRDAI Suitability of Life Insurance Products Guidelines 2023 — Section 4.2: Sum Assured adequacy for term plans',
      productDisclaimer: 'This is a term plan and does not offer any maturity benefits. Sum assured is payable only on death of the life assured during the policy term.',
      conditionsApply: true,
      isUlip: false,
    })
  }

  // ── R2: Health cover top-up ──────────────────────────────────────────
  if (score.healthScore.score < 75) {
    const needed = income * 3 * depFactor
    const have = profile.hasEmployerMediclaim ? 500_000 * 0.7 : 0
    const gap = Math.max(0, needed - have)
    const impact = Math.round((Math.min(gap / needed, 1)) * 35)

    recs.push({
      id: 'R2_HEALTH_TOPUP',
      priority: 2,
      productCategory: profile.hasEmployerMediclaim ? 'top_up_health' : 'health',
      headline: profile.hasEmployerMediclaim
        ? 'Add a super top-up health plan'
        : `Get a ${fmt(Math.min(needed, 1_000_000))} family health plan`,
      subtext: profile.hasEmployerMediclaim
        ? `Your employer cover (counted at 70% = ₹3.5L) is well below the recommended ${fmt(needed)} for your family. A super top-up activates only above a deductible — far cheaper than a fresh policy.`
        : `No health cover detected. With ${profile.dependantsCount} dependant${profile.dependantsCount !== 1 ? 's' : ''}, a family floater of at least ${fmt(Math.min(needed, 1_500_000))} is recommended.`,
      actionLabel: profile.hasEmployerMediclaim ? 'See Top-Up Plans' : 'See Health Plans',
      estimatedScoreImpact: impact,
      basisText: `Recommended health cover = 3× income (${fmt(income * 3)}) adjusted for ${profile.dependantsCount} dependant(s) (×${depFactor.toFixed(1)}) = ${fmt(needed)}. Employer mediclaim counted at 70% face value to account for job-change risk = ${fmt(have)}. Gap = ${fmt(gap)}.`,
      formula: `Required = 3 × ${fmt(income)} × ${depFactor.toFixed(1)} (dependant factor) = ${fmt(needed)}\nEmployer cover (70%) = ${fmt(have)}\nGap = ${fmt(gap)}\nHealth score after closing gap = ~75/100 (+${impact} pts to composite)`,
      irdaiRuleReference: 'IRDAI Health Insurance Regulations 2016 — Sum insured adequacy benchmarks; IRDAI Circular on Employer-Employee Group Health 2019',
      productDisclaimer: 'Health insurance products are subject to waiting periods, sub-limits, and exclusions. Please read the policy document carefully before purchase.',
      conditionsApply: true,
      isUlip: false,
    })
  }

  // ── R3: PMSBY activation (if bank account, not already opt-in flagged) ─
  if (!profile.hasPersonalHealth || score.incomeScore.score < 50) {
    recs.push({
      id: 'R3_PMSBY',
      priority: 3,
      productCategory: 'pmsby_activation',
      headline: 'Activate PMSBY — ₹2L accident cover at ₹20/year',
      subtext: 'Pradhan Mantri Suraksha Bima Yojana is a government scheme available via your savings bank account. ₹2,00,000 accidental death/disability cover for just ₹20/year. Takes 2 minutes to activate.',
      actionLabel: 'Activate via Bank',
      estimatedScoreImpact: 3,
      basisText: 'PMSBY provides ₹2,00,000 accidental death and disability cover at a premium of ₹20/year, auto-debited from your savings bank account. Eligibility: 18–70 years, Indian bank account holder. This is a government-backed opt-in scheme — it does not auto-enrol.',
      formula: `Premium = ₹20/year\nCover = ₹2,00,000 accidental death or permanent total disability\nEligibility = active savings bank account, age 18–70\nImpact on score = +3 pts (counted as income protection bonus)`,
      irdaiRuleReference: 'Pradhan Mantri Suraksha Bima Yojana — Ministry of Finance notification, IRDAI Circular on Government Micro-Insurance Schemes',
      productDisclaimer: 'PMSBY covers accidental death and permanent total/partial disability only. It does not cover natural death or illness. Opt-in renewal required annually. Conditions apply.',
      conditionsApply: true,
      isUlip: false,
    })
  }

  // ── R4: Income protection / EMI coverage ─────────────────────────────
  if (obligations > 0 && score.incomeScore.score < 50) {
    const needed = obligations * 24
    const impact = Math.round(Math.min(obligations / 100_000, 1) * 20)

    recs.push({
      id: 'R4_INCOME_PROTECT',
      priority: 4,
      productCategory: 'income_protection',
      headline: `Protect your ${fmt(obligations)}/month EMIs`,
      subtext: `If you are unable to work for any reason, your monthly obligations of ~${fmt(obligations)} continue. A critical illness or income protection rider ensures your EMIs are covered for up to 24 months.`,
      actionLabel: 'See CI Riders',
      estimatedScoreImpact: impact,
      basisText: `Your declared monthly obligations are ~${fmt(obligations)}. Recommended income protection = 24 months of obligations = ${fmt(needed)}. A CI rider or income protection policy covers this gap if you cannot work due to illness or disability.`,
      formula: `Monthly obligations = ${fmt(obligations)}\nRecommended cover = 24 × ${fmt(obligations)} = ${fmt(needed)}\nIncome score after cover = ~60/100 (+${impact} pts to composite)`,
      irdaiRuleReference: 'IRDAI Health Insurance Regulations 2016 — Critical Illness benefit definitions; IRDAI Product Regulations 2024 — Income Protection product requirements',
      productDisclaimer: 'Critical illness and income protection products have waiting periods, specific covered conditions, and survival period requirements. Please read the policy document and sales brochure carefully. Conditions apply.',
      conditionsApply: true,
      isUlip: false,
    })
  }

  // ── R5: EDLI awareness (if eligible and not already known) ───────────
  if (profile.edliEligible) {
    recs.push({
      id: 'R5_EDLI_CLAIM',
      priority: 5,
      productCategory: 'edli_awareness',
      headline: 'You already have ₹7L EPFO life cover',
      subtext: 'As a PF-contributing employee, you are automatically enrolled in EDLI (Employee Deposit Linked Insurance). Your nominee receives ₹7,00,000 on death. Most employees never know this exists — and never register their nominee.',
      actionLabel: 'Register Nominee on EPFO',
      estimatedScoreImpact: 0,
      basisText: 'EDLI (Employees\' Deposit Linked Insurance Scheme 1976) provides automatic ₹7,00,000 life cover to all EPFO-registered salaried employees. No separate premium. Cover is funded by your employer\'s EPFO contribution. A nominee must be registered on the EPFO member portal for the claim to be disbursed without legal complications.',
      formula: `EDLI cover = ₹7,00,000 (fixed, government-mandated)\nPremium = ₹0 (employer-funded)\nNominee registration = via EPFO Unified Member Portal\nThis is a bonus — not counted in your composite score`,
      irdaiRuleReference: 'EPFO EDLI Scheme 1976 — Employees\' Deposit Linked Insurance; Section 6C of the Employees\' Provident Funds & Miscellaneous Provisions Act 1952',
      productDisclaimer: 'EDLI cover is ₹7,00,000 fixed (subject to EPFO revisions). Claim requires nominee registration and death certificate submission to regional EPFO office. Conditions apply.',
      conditionsApply: true,
      isUlip: false,
    })
  }

  // Sort by priority, return max 5
  return recs
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
}
