/**
 * discoveryQuestions.ts — Module 6: Hidden Coverage Discovery Engine
 *
 * 8 questions that surface coverage the user almost certainly has
 * but doesn't know about. Each question maps to one or more
 * DiscoveredCoverage results in discoveryEngine.ts.
 *
 * Question types mirror DiagnosticFlow for UX consistency:
 *   option       — single-select cards
 *   multi_option — multi-select checkboxes
 *
 * IDs must remain stable — they are stored to sessionStorage.
 */

export type DiscoveryOption = {
  value: string
  label: string
  emoji: string
  sublabel?: string
}

export type DiscoveryQuestion = {
  id: string            // stable identifier
  step: number          // 1–8
  text: string
  subtext?: string
  type: 'option' | 'multi_option'
  options: DiscoveryOption[]
  hint?: string         // optional info nudge shown below options
}

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  // ── Q1: Savings account → gateway to PMSBY / PMJJBY ──────────────
  {
    id: 'has_savings_account',
    step: 1,
    text: 'Do you have a savings bank account in India?',
    subtext: 'Government micro-insurance schemes are linked to bank accounts.',
    type: 'option',
    options: [
      { value: 'yes',  label: 'Yes',  emoji: '🏦' },
      { value: 'no',   label: 'No',   emoji: '❌' },
    ],
  },

  // ── Q2: PMSBY / PMJJBY opt-in status ────────────────────────────
  {
    id: 'govt_schemes_opted',
    step: 2,
    text: 'Have you opted in to any of these at your bank?',
    subtext: 'Banks offer these at account opening or via net banking. Most people skip them.',
    type: 'multi_option',
    options: [
      {
        value: 'pmsby',
        label: 'PMSBY',
        emoji: '🦺',
        sublabel: '₹2L accident cover · ₹20/year',
      },
      {
        value: 'pmjjby',
        label: 'PMJJBY',
        emoji: '🛡️',
        sublabel: '₹2L life cover · ₹436/year',
      },
      {
        value: 'unsure',
        label: 'Not sure',
        emoji: '🤔',
        sublabel: "I'll check my bank statement",
      },
      {
        value: 'neither',
        label: 'Neither',
        emoji: '❌',
        sublabel: 'I have not opted in to either',
      },
    ],
    hint: 'Tip: Search your bank statement for "PMSBY" or "PMJJBY" debit of ₹20 or ₹436.',
  },

  // ── Q3: Employer group term life (beyond mediclaim) ──────────────
  {
    id: 'employer_group_term',
    step: 3,
    text: 'Does your employer provide group term life insurance?',
    subtext: 'Many companies provide 2–5× salary as life cover — separate from mediclaim.',
    type: 'option',
    options: [
      { value: 'yes',   label: 'Yes, I know',    emoji: '✅', sublabel: 'I have the policy details' },
      { value: 'unsure', label: 'Not sure',       emoji: '🤔', sublabel: 'Check with HR' },
      { value: 'no',    label: 'No / Self-employed', emoji: '❌' },
    ],
  },

  // ── Q4: ESI (Employee State Insurance) ──────────────────────────
  {
    id: 'esi_registered',
    step: 4,
    text: 'Are you registered under ESI (Employee State Insurance)?',
    subtext: 'ESI provides hospitalisation cover for employees earning ≤ ₹21,000/month in eligible establishments.',
    type: 'option',
    options: [
      { value: 'yes',    label: 'Yes',     emoji: '✅', sublabel: 'I see ESI deduction in my payslip' },
      { value: 'no',     label: 'No',      emoji: '❌', sublabel: 'Not applicable / earning above limit' },
      { value: 'unsure', label: 'Not sure', emoji: '🤔' },
    ],
  },

  // ── Q5: Home loan → MRTA / bancassurance ────────────────────────
  {
    id: 'has_home_loan',
    step: 5,
    text: 'Do you have an active home loan?',
    subtext: 'Many banks include a Mortgage Reducing Term Assurance (MRTA) to cover the outstanding loan on death.',
    type: 'option',
    options: [
      { value: 'yes_with_cover',    label: 'Yes, with loan cover',  emoji: '🏠', sublabel: 'Bank told me about insurance' },
      { value: 'yes_without_cover', label: 'Yes, no loan cover',    emoji: '🏗️', sublabel: 'I only have the loan' },
      { value: 'no',                label: 'No home loan',          emoji: '❌' },
    ],
  },

  // ── Q6: Vehicle → mandatory PA cover in motor policy ────────────
  {
    id: 'has_vehicle',
    step: 6,
    text: 'Do you own a car or two-wheeler?',
    subtext: 'Motor insurance in India mandatorily includes ₹15 Lakh Personal Accident (PA) cover for the owner-driver.',
    type: 'option',
    options: [
      { value: 'car',        label: 'Car',           emoji: '🚗' },
      { value: 'two_wheeler', label: 'Two-wheeler',  emoji: '🏍️' },
      { value: 'both',       label: 'Both',          emoji: '🚗🏍️' },
      { value: 'none',       label: 'No vehicle',    emoji: '❌' },
    ],
  },

  // ── Q7: Credit / premium debit card → travel PA cover ───────────
  {
    id: 'has_credit_card',
    step: 7,
    text: 'Do you hold a credit card or premium debit card?',
    subtext: 'Visa Signature, Mastercard World/Platinum, and some RuPay cards include complimentary travel accident insurance.',
    type: 'option',
    options: [
      { value: 'premium', label: 'Yes — premium card',    emoji: '💳', sublabel: 'Visa Platinum / MC World / Amex' },
      { value: 'basic',   label: 'Yes — basic card',      emoji: '💳', sublabel: 'Classic / basic tier' },
      { value: 'no',      label: 'No credit card',        emoji: '❌' },
    ],
  },

  // ── Q8: Standalone PA policy awareness ──────────────────────────
  {
    id: 'has_standalone_pa',
    step: 8,
    text: 'Do you have a standalone Personal Accident (PA) policy?',
    subtext: 'A dedicated PA policy covers accidental death, disability, and hospitalisation — often for ₹100–300/year.',
    type: 'option',
    options: [
      { value: 'yes',    label: 'Yes',      emoji: '✅', sublabel: 'I have one already' },
      { value: 'no',     label: 'No',       emoji: '❌', sublabel: 'I don\'t have one' },
      { value: 'unsure', label: 'Not sure', emoji: '🤔' },
    ],
  },
]
