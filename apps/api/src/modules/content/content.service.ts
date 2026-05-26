/**
 * ContentService — Module 9: KIN News Brief
 *
 * Weekly brief: 3 curated news items + policy fact + personalisation.
 * Content entry: manual curation (Phase 2: admin panel + CMS).
 * All content subject to CG-8 compliance workflow before import.
 */
import { Injectable, NotFoundException } from '@nestjs/common'

export interface BriefItem {
  id: string
  headline: string
  plainExplanation: string
  personalisationTags: string[]
  actionText?: string
  actionLink?: string
  conditionsApply: boolean
}

export interface NewsBrief {
  briefId: string
  weekNumber: number
  items: BriefItem[]
  policyFact: string
  publishedAt: string
  active: boolean
}

// Phase 2: NewsBriefEntity in DB — curated via admin panel
const NEWS_BRIEF_STORE: NewsBrief[] = [
  {
    briefId: 'brief-001',
    weekNumber: 14,
    publishedAt: '2026-04-07T04:00:00.000Z',
    active: true,
    policyFact: 'IRDAI mandates all health insurers to settle cashless claims within 1 hour of request. If your insurer delays, file a complaint on Bima Bharosa: 1800-4254-732.',
    items: [
      {
        id: 'item-001-a',
        headline: 'IRDAI raises minimum health sum insured to ₹5L for new policies',
        plainExplanation: 'From April 2026, all new individual health policies must offer at least ₹5 lakh sum insured. If your current policy is below this, consider topping up at renewal — the premium difference is often small.',
        personalisationTags: ['has_health_cover', 'renewal_within_90_days'],
        actionText: 'Check your policy sum insured',
        actionLink: '/vault/documents',
        conditionsApply: true,
      },
      {
        id: 'item-001-b',
        headline: 'PMJJBY premium continues at ₹436/year for ₹2L life cover',
        plainExplanation: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) provides ₹2L life cover (any cause of death) at ₹436/year. Auto-debited every June from your savings account. If you haven't activated it, you can do so via your bank app in 2 minutes.",
        personalisationTags: ['has_savings_account', 'income_band_low', 'income_band_mid'],
        actionText: 'Activate PMJJBY in your bank app',
        conditionsApply: true,
      },
      {
        id: 'item-001-c',
        headline: 'Home loan? Check if your bank bundled a life cover — you may not know about it',
        plainExplanation: 'Most banks bundle a single-premium mortgage protection plan when you take a home loan. Many borrowers don\'t know it exists or how to file a claim. Check your loan documents for "MRTA" or "Home Loan Insurance".',
        personalisationTags: ['has_home_loan', 'emi_above_20k'],
        actionText: 'Add it to your Vault',
        actionLink: '/vault',
        conditionsApply: true,
      },
    ],
  },
  {
    briefId: 'brief-002',
    weekNumber: 15,
    publishedAt: '2026-04-14T04:00:00.000Z',
    active: true,
    policyFact: 'EDLI (EPFO life cover) pays up to ₹7 Lakh to the nominee. There is no separate premium - it is funded by your employer EPF contribution. File claim using Form 5IF.',
    items: [
      {
        id: 'item-002-a',
        headline: 'Claim settlement ratio: why it matters more than premium',
        plainExplanation: 'CSR is the % of death claims an insurer paid out vs received in a year. For term insurance, look for CSR > 97% across the last 3 years. A cheap premium is meaningless if your family cannot claim.',
        personalisationTags: ['evaluating_term_plan'],
        actionText: 'See top 10 insurers by CSR',
        actionLink: '/recommend',
        conditionsApply: true,
      },
      {
        id: 'item-002-b',
        headline: 'Nominee registration on EPFO: 60% of members have not done it',
        plainExplanation: 'No nominee on record means your family must fight legal succession to claim your ₹7L EDLI cover. Takes 5 minutes online on the EPFO Unified Member Portal. Update whenever marital status or dependants change.',
        personalisationTags: ['salaried_pf', 'is_breadwinner'],
        actionText: 'Open EPFO Portal',
        actionLink: 'https://unifiedportal-mem.epfindia.gov.in',
        conditionsApply: false,
      },
      {
        id: 'item-002-c',
        headline: 'Aadhaar masking: never share full 12-digit number',
        plainExplanation: 'Per DPDP Act 2023 and UIDAI guidelines, services that need Aadhaar verification should use VID or last-4 digits only. Decline anyone asking for the full number outside official authentication flows.',
        personalisationTags: ['recently_added_nominee'],
        actionText: 'Read the masking rule',
        actionLink: 'https://uidai.gov.in',
        conditionsApply: false,
      },
    ],
  },
  {
    briefId: 'brief-003',
    weekNumber: 16,
    publishedAt: '2026-04-21T04:00:00.000Z',
    active: true,
    policyFact: 'Section 80D allows ₹25,000/year tax deduction for self/family health premiums plus an additional ₹50,000 if you pay for senior-citizen parents.',
    items: [
      {
        id: 'item-003-a',
        headline: 'Super top-up vs regular top-up: the cumulative-claim difference',
        plainExplanation: 'A super top-up considers aggregate annual claims above the deductible; a regular top-up applies the deductible per individual hospitalisation. For most families, a ₹10-25L super top-up with a ₹5L deductible is the most cost-effective health-cover upgrade.',
        personalisationTags: ['has_employer_mediclaim', 'income_band_mid', 'income_band_high'],
        actionText: 'See super top-up math',
        actionLink: '/recommend',
        conditionsApply: true,
      },
      {
        id: 'item-003-b',
        headline: 'Critical Illness claim survival period: read the fine print',
        plainExplanation: 'Most CI riders require you to survive 30 days after diagnosis for the claim to be valid. Some have 14-day waits. If the policy lists diseases in vague terms, ask the insurer for definitions in writing before purchase.',
        personalisationTags: ['evaluating_ci_rider', 'dependants_count_2_plus'],
        actionText: 'Review CI definitions',
        actionLink: '/recommend',
        conditionsApply: true,
      },
      {
        id: 'item-003-c',
        headline: 'Free-look period: 30 days for online policies',
        plainExplanation: 'You can return any online life policy within 30 days for a near-full refund (minus medical and stamp duty costs). Always re-read your policy on Day 1 - if anything is unclear, return it and re-buy after clarification.',
        personalisationTags: ['recently_purchased_policy'],
        actionText: 'IRDAI free-look rule',
        actionLink: 'https://www.irdai.gov.in',
        conditionsApply: false,
      },
    ],
  },
  {
    briefId: 'brief-004',
    weekNumber: 17,
    publishedAt: '2026-04-28T04:00:00.000Z',
    active: true,
    policyFact: 'IRDAI rule: insurance grievances unanswered for 15 days can be escalated to the Insurance Ombudsman free of cost. 17 ombudsman offices across India.',
    items: [
      {
        id: 'item-004-a',
        headline: 'PMSBY accidental death claim: file within 30 days',
        plainExplanation: 'Nominees must file the PMSBY claim with the bank branch within 30 days of the accidental death event. Required documents: death certificate, FIR (if applicable), claim form B, KYC of nominee. Most banks have ₹2L disbursed within 60 days of valid claim.',
        personalisationTags: ['has_pmsby'],
        actionText: 'Bookmark claim form B',
        actionLink: 'https://www.jansuraksha.gov.in',
        conditionsApply: true,
      },
      {
        id: 'item-004-b',
        headline: 'Motor PA cover: ₹15L is the minimum, not the maximum',
        plainExplanation: 'The mandatory owner-driver PA cover bundled with every motor policy is ₹15L. You can buy a separate motor PA top-up rider to raise it to ₹50L or ₹1Cr for a small annual premium - especially worth it if you drive often or hold liabilities/EMIs.',
        personalisationTags: ['owns_vehicle', 'emi_above_20k'],
        actionText: 'See motor PA top-ups',
        actionLink: '/recommend',
        conditionsApply: true,
      },
      {
        id: 'item-004-c',
        headline: 'Spurious calls offering "unclaimed insurance bonus" - hang up',
        plainExplanation: 'IRDAI or its officials never contact policyholders to sell insurance, announce bonuses, or collect processing fees. Any caller asking you to transfer money first is a fraud. Hang up and report on Bima Bharosa: 1800-4254-732.',
        personalisationTags: ['recent_advisor_booking'],
        actionText: 'Report a fraud call',
        actionLink: 'https://bimabharosa.irdai.gov.in',
        conditionsApply: false,
      },
    ],
  },
]

function getWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil((now.getTime() - start.getTime()) / (7 * 86_400_000))
}

@Injectable()
export class ContentService {
  getCurrentBrief(userTags: string[] = []): NewsBrief | null {
    const week = getWeekNumber()
    // Find active brief for current week, or most recent active brief
    const brief =
      NEWS_BRIEF_STORE.find(b => b.active && b.weekNumber === week) ??
      NEWS_BRIEF_STORE.filter(b => b.active).sort((a, b) => b.weekNumber - a.weekNumber)[0] ??
      null

    if (!brief) return null

    // Personalise: rank items by matching tags, but always return all 3
    const ranked = [...brief.items].sort((a, b) => {
      const scoreA = a.personalisationTags.filter(t => userTags.includes(t)).length
      const scoreB = b.personalisationTags.filter(t => userTags.includes(t)).length
      return scoreB - scoreA
    })

    return { ...brief, items: ranked.slice(0, 3) }
  }

  getArchive(): NewsBrief[] {
    return NEWS_BRIEF_STORE.filter(b => b.active).sort((a, b) => b.weekNumber - a.weekNumber).slice(0, 8)
  }

  getBriefByWeek(weekNumber: number): NewsBrief {
    const brief = NEWS_BRIEF_STORE.find(b => b.weekNumber === weekNumber && b.active)
    if (!brief) throw new NotFoundException(`No brief found for week ${weekNumber}`)
    return brief
  }

  generateShareContent(briefId: string): { text: string; disclaimer: string } {
    const brief = NEWS_BRIEF_STORE.find(b => b.briefId === briefId)
    if (!brief) throw new NotFoundException('Brief not found')
    const topItem = brief.items[0]
    return {
      text: `📰 KIN News Brief — Week ${brief.weekNumber}\n\n${topItem.headline}\n\n${topItem.plainExplanation}\n\nRead more on KIN: kin.app/brief`,
      disclaimer: 'Coverage figures indicative. Conditions apply. Reply STOP to unsubscribe from KIN alerts.',
    }
  }
}
