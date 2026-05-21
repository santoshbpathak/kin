/**
 * discoveryEngine.ts — Module 6: Hidden Coverage Discovery Engine
 *
 * Pure deterministic function: (answers + profile) → DiscoveredCoverage[]
 *
 * Coverage statuses:
 *   active         — user confirmed it's active
 *   likely_active  — eligible + likely active (e.g. EDLI for salaried_pf)
 *   not_activated  — eligible but NOT opted in / confirmed inactive
 *   check_required — can't determine from answers; user must verify
 *   not_applicable — doesn't apply to this user's profile
 *
 * Compliance:
 *   - All amounts shown with "Conditions apply" in complianceNote (CG-4)
 *   - Government scheme URLs are official .gov.in links only
 *   - No product recommendations in this module — discovery only
 *   - Source attribution on every coverage item
 */

import type { UserProfile } from '../diagnostic/parser'

export type CoverageStatus =
  | 'active'
  | 'likely_active'
  | 'not_activated'
  | 'check_required'
  | 'not_applicable'

export type CoverageSource =
  | 'government'   // PMSBY, PMJJBY, EDLI, ESI
  | 'employer'     // Group term, mediclaim
  | 'vehicle'      // Motor PA
  | 'bank_card'    // Credit/debit card travel insurance
  | 'loan'         // MRTA on home loan

export type DiscoveredCoverage = {
  id: string
  name: string
  shortName: string
  status: CoverageStatus
  coverAmount: number        // in rupees (0 = unknown/variable)
  annualPremium: number      // in rupees (0 = free / included)
  description: string        // plain English explanation
  whyYouHaveIt: string       // eligibility basis
  howToVerify: string[]      // step-by-step verification
  actionLabel: string
  actionUrl: string          // external URL or internal /route
  actionIsExternal: boolean
  source: CoverageSource
  isBonus: boolean           // true = not in KIN score, pure bonus
  complianceNote: string     // mandatory per CG-4
  emoji: string
}

export type DiscoveryAnswers = {
  has_savings_account?: string
  govt_schemes_opted?: string[]
  employer_group_term?: string
  esi_registered?: string
  has_home_loan?: string
  has_vehicle?: string
  has_credit_card?: string
  has_standalone_pa?: string
}

// ── Engine version for audit trail ────────────────────────────────
export const DISCOVERY_RULE_VERSION = 'v1.0.0'

// ── Main engine function ───────────────────────────────────────────
export function discoverCoverages(
  answers: DiscoveryAnswers,
  profile: UserProfile,
): DiscoveredCoverage[] {
  const results: DiscoveredCoverage[] = []

  // ── 1. EDLI (always check if PF eligible) ─────────────────────
  if (profile.edliEligible) {
    results.push({
      id: 'edli',
      name: 'EPFO EDLI Life Cover',
      shortName: 'EDLI',
      status: 'likely_active',
      coverAmount: 700_000,
      annualPremium: 0,
      description:
        'As a PF-contributing employee, you are automatically enrolled in EDLI (Employee Deposit Linked Insurance). Your nominee receives ₹7,00,000 on death — no premium deducted from your salary.',
      whyYouHaveIt:
        'Automatic for all employees contributing to EPFO under the EDLI Scheme 1976.',
      howToVerify: [
        'Log in to EPFO Unified Member Portal (unifiedportal-mem.epfindia.gov.in)',
        'Go to e-Nomination → confirm nominee is registered',
        'Your cover is always ₹7L (as of EPFO circular 2021)',
      ],
      actionLabel: 'Register Nominee →',
      actionUrl: 'https://unifiedportal-mem.epfindia.gov.in',
      actionIsExternal: true,
      source: 'government',
      isBonus: true,
      complianceNote: 'As per EPFO EDLI Scheme 1976. Benefit subject to scheme conditions and nominee registration. Conditions apply.',
      emoji: '🏛️',
    })
  }

  // ── 2. PMSBY ──────────────────────────────────────────────────
  if (answers.has_savings_account === 'yes') {
    const schemesOpted = answers.govt_schemes_opted ?? []
    const pmsbyStatus: CoverageStatus = schemesOpted.includes('pmsby')
      ? 'active'
      : schemesOpted.includes('neither')
      ? 'not_activated'
      : 'check_required'

    results.push({
      id: 'pmsby',
      name: 'Pradhan Mantri Suraksha Bima Yojana',
      shortName: 'PMSBY',
      status: pmsbyStatus,
      coverAmount: 200_000,
      annualPremium: 20,
      description:
        'Government accidental death and disability scheme. ₹2,00,000 cover for just ₹20/year auto-debited from your savings account. One of the best-value covers available.',
      whyYouHaveIt:
        'Available to all savings account holders aged 18–70 years.',
      howToVerify: [
        'Check your bank statement for "PMSBY" debit of ₹20 (usually in June)',
        "Log in to your bank's net banking → Insurance → PMSBY",
        "Call your bank's toll-free number and ask about PMSBY status",
      ],
      actionLabel: pmsbyStatus === 'active' ? 'Verify Status →' : 'Activate via Bank →',
      actionUrl: 'https://www.jansuraksha.gov.in/Forms-PMSBY.aspx',
      actionIsExternal: true,
      source: 'government',
      isBonus: pmsbyStatus !== 'active',
      complianceNote: 'Government scheme. ₹2L cover subject to PMSBY scheme terms and conditions. Premium and benefits as per scheme guidelines. Conditions apply.',
      emoji: '🦺',
    })
  }

  // ── 3. PMJJBY ────────────────────────────────────────────────
  if (answers.has_savings_account === 'yes') {
    const schemesOpted = answers.govt_schemes_opted ?? []
    const pmjjbyStatus: CoverageStatus = schemesOpted.includes('pmjjby')
      ? 'active'
      : schemesOpted.includes('neither')
      ? 'not_activated'
      : 'check_required'

    results.push({
      id: 'pmjjby',
      name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
      shortName: 'PMJJBY',
      status: pmjjbyStatus,
      coverAmount: 200_000,
      annualPremium: 436,
      description:
        'Government life insurance scheme. ₹2,00,000 life cover for ₹436/year — no medical tests, automatic renewal. Available to anyone aged 18–50 with a savings account.',
      whyYouHaveIt:
        'Available to all savings account holders aged 18–50 years.',
      howToVerify: [
        'Check bank statement for "PMJJBY" debit of ₹436 (usually in June)',
        "Log in to your bank's net banking → Insurance → PMJJBY",
        'Visit your bank branch with Aadhaar and savings account details',
      ],
      actionLabel: pmjjbyStatus === 'active' ? 'Verify Status →' : 'Activate via Bank →',
      actionUrl: 'https://www.jansuraksha.gov.in/Forms-PMJJBY.aspx',
      actionIsExternal: true,
      source: 'government',
      isBonus: pmjjbyStatus !== 'active',
      complianceNote: 'Government scheme. ₹2L life cover subject to PMJJBY scheme terms, age eligibility, and claim conditions. Conditions apply.',
      emoji: '🛡️',
    })
  }

  // ── 4. ESI ────────────────────────────────────────────────────
  if (answers.esi_registered === 'yes' || answers.esi_registered === 'unsure') {
    const esiStatus: CoverageStatus = answers.esi_registered === 'yes'
      ? 'active'
      : 'check_required'

    results.push({
      id: 'esi',
      name: 'Employee State Insurance',
      shortName: 'ESI',
      status: esiStatus,
      coverAmount: 0, // ESI covers medical expenses — not a fixed sum
      annualPremium: 0, // deducted from salary as %
      description:
        'ESI provides comprehensive health coverage — hospitalisation, medicines, maternity, and disability benefits — for you and your family. No cap on hospitalisation costs at ESI empanelled hospitals.',
      whyYouHaveIt:
        'Mandatory for employees earning ≤ ₹21,000/month in factories and establishments with 10+ employees.',
      howToVerify: [
        'Check your payslip for "ESI" deduction (1.75% of gross salary)',
        'Log in to ESIC portal (esic.in) with your ESI number',
        'Generate your ESI e-Pehchaan card for family coverage',
      ],
      actionLabel: 'ESIC Portal →',
      actionUrl: 'https://www.esic.in',
      actionIsExternal: true,
      source: 'government',
      isBonus: false,
      complianceNote: 'ESI benefits are subject to ESIC Act 1948. Coverage at ESIC-empanelled hospitals only. Conditions apply.',
      emoji: '🏥',
    })
  }

  // ── 5. Employer Group Term Life ───────────────────────────────
  if (answers.employer_group_term === 'yes' || answers.employer_group_term === 'unsure') {
    const gtStatus: CoverageStatus = answers.employer_group_term === 'yes'
      ? 'active'
      : 'check_required'

    // Estimate: typically 2–5× annual salary
    const incomeMap: Record<string, number> = {
      'under_3l': 300_000,
      '3_6l': 450_000,
      '6_10l': 800_000,
      '10_20l': 1_500_000,
      'above_20l': 2_500_000,
    }
    const annualIncome = incomeMap[profile.incomeBand] ?? 1_000_000
    const estimatedCover = annualIncome * 3 // conservative 3× estimate

    results.push({
      id: 'employer_group_term',
      name: 'Employer Group Term Life',
      shortName: 'Group Term',
      status: gtStatus,
      coverAmount: gtStatus === 'active' ? estimatedCover : 0,
      annualPremium: 0,
      description:
        'Your employer may provide group term life insurance — typically 2–5× your annual salary — fully paid by the company. This ends when you leave the job.',
      whyYouHaveIt:
        'Many corporates include group term life as a standard employee benefit.',
      howToVerify: [
        'Contact your HR or Benefits team and ask for "Group Term Life" details',
        'Check your offer letter or employee handbook for insurance benefits',
        'Look for a policy certificate in your onboarding documents',
      ],
      actionLabel: 'Check with HR →',
      actionUrl: '/connect',
      actionIsExternal: false,
      source: 'employer',
      isBonus: true,
      complianceNote: 'Employer group term cover ends on employment cessation. Coverage amount subject to employer policy terms. Conditions apply.',
      emoji: '🏢',
    })
  }

  // ── 6. Motor PA Cover ─────────────────────────────────────────
  if (answers.has_vehicle && answers.has_vehicle !== 'none') {
    results.push({
      id: 'motor_pa',
      name: 'Motor Insurance PA Cover',
      shortName: 'Motor PA',
      status: 'likely_active',
      coverAmount: 1_500_000,
      annualPremium: 0, // included in motor premium
      description:
        'IRDAI mandates a ₹15 Lakh Personal Accident cover for the owner-driver in all motor insurance policies. If your vehicle has valid insurance, you already have this PA cover.',
      whyYouHaveIt:
        'Mandatory as per IRDAI Motor Vehicle Act. Every motor policy must include ₹15L PA for owner-driver.',
      howToVerify: [
        'Locate your motor insurance policy document',
        'Look for "Owner-Driver PA Cover" — should show ₹15,00,000',
        'Ensure your motor policy is not expired (check renewal date)',
      ],
      actionLabel: 'Check Policy →',
      actionUrl: 'https://vahan.parivahan.gov.in/vahanservice/',
      actionIsExternal: true,
      source: 'vehicle',
      isBonus: true,
      complianceNote: 'PA cover is for the named owner-driver only. Subject to motor insurance policy terms. Conditions apply.',
      emoji: '🚗',
    })
  }

  // ── 7. Credit/Debit Card Travel Insurance ─────────────────────
  if (answers.has_credit_card === 'premium') {
    results.push({
      id: 'card_travel_pa',
      name: 'Credit Card Travel Accident Insurance',
      shortName: 'Card Insurance',
      status: 'check_required',
      coverAmount: 0, // varies widely by card issuer
      annualPremium: 0, // included in card fee
      description:
        'Premium credit/debit cards (Visa Signature/Infinite, Mastercard World/Titanium, Amex) include complimentary travel accident insurance — often ₹50L–₹1.5Cr for air travel.',
      whyYouHaveIt:
        'Included as a benefit with eligible premium credit or debit cards.',
      howToVerify: [
        'Call the number on the back of your card and ask for "travel insurance benefits"',
        'Log in to your card portal and look under "Benefits" or "Insurance"',
        "Check your card's welcome kit or features page on the bank's website",
      ],
      actionLabel: 'Check Card Benefits →',
      actionUrl: 'https://www.npci.org.in/what-we-do/rupay/rupay-insurance',
      actionIsExternal: true,
      source: 'bank_card',
      isBonus: true,
      complianceNote: 'Card insurance benefits vary by card type and issuer. Activation and usage conditions apply. Check your card issuer for exact coverage. Conditions apply.',
      emoji: '💳',
    })
  }

  // ── 8. MRTA (Home Loan Cover) ─────────────────────────────────
  if (answers.has_home_loan === 'yes_with_cover') {
    results.push({
      id: 'mrta',
      name: 'Home Loan Protection (MRTA)',
      shortName: 'Loan Cover',
      status: 'active',
      coverAmount: 0, // reducing — equals outstanding loan amount
      annualPremium: 0, // usually single premium upfront
      description:
        'Mortgage Reducing Term Assurance (MRTA) covers your outstanding home loan on death or total disability. Your family inherits the home — not the debt.',
      whyYouHaveIt:
        'Many banks bundle an MRTA policy when issuing home loans.',
      howToVerify: [
        'Check your loan sanction letter for "insurance" or "MRTA" mention',
        'Contact your home loan bank and ask if MRTA is linked to your account',
        'Look for a single premium deduction of 1–2% of loan amount in your statements',
      ],
      actionLabel: 'Contact Bank →',
      actionUrl: '/connect',
      actionIsExternal: false,
      source: 'loan',
      isBonus: true,
      complianceNote: 'MRTA coverage reduces as loan is repaid. Subject to policy terms of the specific MRTA plan purchased. Conditions apply.',
      emoji: '🏠',
    })
  } else if (answers.has_home_loan === 'yes_without_cover') {
    results.push({
      id: 'mrta_gap',
      name: 'Home Loan Protection (Gap Identified)',
      shortName: 'Loan Cover Gap',
      status: 'not_activated',
      coverAmount: 0,
      annualPremium: 0,
      description:
        'You have a home loan but no mortgage protection. If something happens to you, your family inherits the loan repayment obligation. A term plan or MRTA can cover this.',
      whyYouHaveIt:
        'Applicable — you have a home loan with no insurance cover identified.',
      howToVerify: [
        'Confirm with your bank if any MRTA was bundled at loan origination',
        'If none exists, speak to an advisor about a term plan to cover the outstanding amount',
      ],
      actionLabel: 'Get Protected →',
      actionUrl: '/recommend',
      actionIsExternal: false,
      source: 'loan',
      isBonus: false,
      complianceNote: 'This is a gap alert, not financial advice. Please consult a licensed insurance advisor before purchasing any product. Conditions apply.',
      emoji: '⚠️',
    })
  }

  // ── 9. Standalone PA awareness ────────────────────────────────
  if (answers.has_standalone_pa === 'yes') {
    results.push({
      id: 'standalone_pa',
      name: 'Standalone Personal Accident Policy',
      shortName: 'PA Policy',
      status: 'active',
      coverAmount: 0,
      annualPremium: 0,
      description:
        'Great — you have a dedicated PA policy. Ensure it covers accidental death, permanent total disability (PTD), temporary total disability (TTD), and hospitalisation.',
      whyYouHaveIt: 'You declared an active standalone PA policy.',
      howToVerify: [
        'Confirm your PA policy is up-to-date and renewed',
        'Check if it covers PTD and TTD in addition to accidental death',
        'Ensure your nominee details are correct in the policy',
      ],
      actionLabel: 'Review Policy →',
      actionUrl: '/vault',
      actionIsExternal: false,
      source: 'government',
      isBonus: false,
      complianceNote: 'PA policy coverage subject to individual policy terms. Conditions apply.',
      emoji: '🩺',
    })
  }

  // Sort: active first, then likely_active, then check_required, then not_activated, then not_applicable
  const statusOrder: Record<CoverageStatus, number> = {
    active: 0,
    likely_active: 1,
    check_required: 2,
    not_activated: 3,
    not_applicable: 4,
  }

  results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return results
}

// ── Total bonus coverage sum (all active + likely_active, bonus items) ──
export function totalBonusCover(coverages: DiscoveredCoverage[]): number {
  return coverages
    .filter(c => c.isBonus && (c.status === 'active' || c.status === 'likely_active') && c.coverAmount > 0)
    .reduce((sum, c) => sum + c.coverAmount, 0)
}
