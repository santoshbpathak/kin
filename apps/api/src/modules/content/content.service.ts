/**
 * ContentService — Module 9: KIN News Brief
 *
 * Weekly brief: 3 curated news items + policy fact + personalisation.
 * Content entry: manual curation (Phase 2: admin panel + CMS).
 * All content subject to CG-8 compliance workflow before import.
 */
import { Injectable, NotFoundException } from '@nestjs/common'

interface BriefItem {
  id: string
  headline: string
  plainExplanation: string
  personalisationTags: string[]
  actionText?: string
  actionLink?: string
  conditionsApply: boolean
}

interface NewsBrief {
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
        headline: 'New PMJJBY premium: ₹436/year from June 2026 (was ₹436 — unchanged)',
        plainExplanation: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) continues at ₹436/year for ₹2L life cover. Auto-debited every June. If you haven't activated it, you can do so via your bank app in 2 minutes.',
        personalisationTags: ['has_savings_account', 'income_band_low', 'income_band_mid'],
        actionText: 'Activate PMJJBY in your bank app',
        conditionsApply: true,
      },
      {
        id: 'item-001-c',
        headline: 'Home loan? Check if your bank bundled a life cover — you may not know about it',
        plainExplanation: 'Most banks bundle a single-premium mortgage protection plan when you take a home loan. Many borrowers don't know it exists or how to file a claim. Check your loan documents for "MRTA" or "Home Loan Insurance".',
        personalisationTags: ['has_home_loan', 'emi_above_20k'],
        actionText: 'Add it to your Vault',
        actionLink: '/vault',
        conditionsApply: true,
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
