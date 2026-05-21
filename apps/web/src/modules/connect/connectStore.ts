/**
 * connectStore.ts — Module 10: Connect Layer
 *
 * Stores advisor booking requests in localStorage for MVP1.
 * Phase 2: syncs to CRM (Salesforce / HubSpot) via NestJS API.
 *
 * Storage keys:
 *   kin_advisor_bookings   → AdvisorBooking[]
 *
 * Compliance:
 *   - Spurious call warning shown on all purchase/connect screens (CG-2)
 *   - ULIP products are feature-flagged OFF — not offered here (CG-3)
 *   - All product amounts shown with "Conditions apply" (CG-4)
 *   - Term plan disclaimer injected on term life cards (CG-5)
 *   - No IRDAI endorsement of any insurer (CG-8)
 */

// ── Booking types ──────────────────────────────────────────────
export type QueryType =
  | 'term_life'
  | 'health_topup'
  | 'personal_accident'
  | 'general_review'
  | 'claim_help'
  | 'other'

export const QUERY_TYPE_LABELS: Record<QueryType, string> = {
  term_life:        'Term Life Insurance',
  health_topup:     'Health / Top-up Plan',
  personal_accident:'Personal Accident Cover',
  general_review:   'Full Protection Review',
  claim_help:       'Help with a Claim',
  other:            'Other',
}

export const QUERY_TYPE_EMOJI: Record<QueryType, string> = {
  term_life:        '🛡️',
  health_topup:     '🏥',
  personal_accident:'🦺',
  general_review:   '🔍',
  claim_help:       '📋',
  other:            '💬',
}

export type TimeSlot = {
  id: string
  label: string       // "Today 4–5 PM"
  available: boolean
}

export type AdvisorBooking = {
  id: string
  name: string
  phone: string
  queryType: QueryType
  preferredSlot: string    // TimeSlot.label
  notes: string
  status: 'pending' | 'confirmed' | 'done'
  bookedAt: string         // ISO timestamp
}

// ── Generate dynamic time slots (next 2 days) ──────────────────
export function getAvailableSlots(): TimeSlot[] {
  const slots: TimeSlot[] = []
  const now = new Date()
  const hour = now.getHours()

  // Today slots (if before 5 PM)
  const todayLabel = 'Today'
  const tomorrowLabel = 'Tomorrow'

  const timeWindows = [
    { start: 10, end: 11, label: '10–11 AM' },
    { start: 11, end: 12, label: '11 AM–12 PM' },
    { start: 14, end: 15, label: '2–3 PM' },
    { start: 15, end: 16, label: '3–4 PM' },
    { start: 16, end: 17, label: '4–5 PM' },
    { start: 17, end: 18, label: '5–6 PM' },
  ]

  // Today: show slots that haven't passed yet (+ 1hr buffer)
  timeWindows.forEach(w => {
    if (w.start > hour + 1) {
      slots.push({
        id: `today_${w.start}`,
        label: `${todayLabel} ${w.label}`,
        available: true,
      })
    }
  })

  // Tomorrow: all slots available
  timeWindows.forEach(w => {
    slots.push({
      id: `tomorrow_${w.start}`,
      label: `${tomorrowLabel} ${w.label}`,
      available: true,
    })
  })

  // Day after: morning slots
  const dayAfter = new Date(now)
  dayAfter.setDate(dayAfter.getDate() + 2)
  const dayAfterLabel = dayAfter.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  timeWindows.slice(0, 3).forEach(w => {
    slots.push({
      id: `dayafter_${w.start}`,
      label: `${dayAfterLabel} ${w.label}`,
      available: true,
    })
  })

  return slots
}

// ── CRUD ────────────────────────────────────────────────────────
const BOOKINGS_KEY = 'kin_advisor_bookings'

export function getBookings(): AdvisorBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveBooking(
  booking: Omit<AdvisorBooking, 'id' | 'bookedAt' | 'status'>,
): AdvisorBooking {
  const bookings = getBookings()
  const newBooking: AdvisorBooking = {
    ...booking,
    id: crypto.randomUUID(),
    status: 'pending',
    bookedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify([...bookings, newBooking]))
  } catch { /* ignore */ }
  return newBooking
}

// ── Product bridge definitions ─────────────────────────────────
// ULIP is explicitly excluded (CG-3)

export type ProductBridge = {
  id: string
  category: string
  title: string
  description: string
  providerLabel: string     // "Compare on Policybazaar" or "Official Portal"
  providerUrl: string
  isGovtScheme: boolean
  isUlip: false             // CG-3: always false — ULIP excluded
  termsNote: string         // CG-4/CG-5 product-specific disclaimer
  emoji: string
  colour: string
  ctaLabel: string
  estimatedCost?: string    // indicative only, "Conditions apply"
}

export const PRODUCT_BRIDGES: ProductBridge[] = [
  {
    id: 'pb_term_life',
    category: 'Life Insurance',
    title: 'Term Life Plan',
    description:
      'Pure protection — high cover at low premium. Recommended for anyone with dependants and income. No maturity benefit; cover pays out on death within policy term.',
    providerLabel: 'Compare Plans',
    providerUrl: 'https://www.policybazaar.com/life-insurance/term-insurance/',
    isGovtScheme: false,
    isUlip: false,
    termsNote:
      'This is a term plan and does not offer any maturity benefits. Sum assured is payable on death only during the policy term. Conditions apply. Products are offered by licensed life insurers. Please read the policy document carefully.',
    emoji: '🛡️',
    colour: '#7C3AED',
    ctaLabel: 'Compare Term Plans →',
    estimatedCost: '₹500–₹2,000/month (indicative)',
  },
  {
    id: 'pb_health_topup',
    category: 'Health Insurance',
    title: 'Super Top-up Health Plan',
    description:
      'Activates after your base cover limit is exhausted. Far cheaper than a standalone plan. Ideal to extend employer mediclaim to ₹50L+ total cover.',
    providerLabel: 'Compare Plans',
    providerUrl: 'https://www.policybazaar.com/health-insurance/super-top-up-insurance/',
    isGovtScheme: false,
    isUlip: false,
    termsNote:
      'Super top-up plans activate above the deductible limit. Coverage, waiting periods, and sub-limits vary by insurer. Conditions apply. Please read the policy brochure carefully before purchase.',
    emoji: '🏥',
    colour: '#DC2626',
    ctaLabel: 'Compare Health Plans →',
    estimatedCost: '₹3,000–₹8,000/year (indicative)',
  },
  {
    id: 'pb_pmsby',
    category: 'Govt Scheme',
    title: 'PMSBY — Accident Cover',
    description:
      '₹2 Lakh accidental death & disability cover for just ₹20/year. Linked to your savings bank account. Activate via net banking in under 2 minutes.',
    providerLabel: 'Jan Suraksha Portal',
    providerUrl: 'https://www.jansuraksha.gov.in/Forms-PMSBY.aspx',
    isGovtScheme: true,
    isUlip: false,
    termsNote:
      'Government scheme under PMSBY. ₹2L cover subject to scheme terms and claim conditions. Age 18–70. Premium of ₹20/year auto-debited from linked savings account. Conditions apply.',
    emoji: '🦺',
    colour: '#059669',
    ctaLabel: 'Activate via Bank →',
    estimatedCost: '₹20/year',
  },
  {
    id: 'pb_pmjjby',
    category: 'Govt Scheme',
    title: 'PMJJBY — Life Cover',
    description:
      '₹2 Lakh life cover for ₹436/year. No medical test required. Renewable annually. Available to savings account holders aged 18–50.',
    providerLabel: 'Jan Suraksha Portal',
    providerUrl: 'https://www.jansuraksha.gov.in/Forms-PMJJBY.aspx',
    isGovtScheme: true,
    isUlip: false,
    termsNote:
      'Government scheme under PMJJBY. ₹2L life cover subject to scheme terms. Age 18–50. Premium ₹436/year. Conditions apply.',
    emoji: '🛡️',
    colour: '#059669',
    ctaLabel: 'Activate via Bank →',
    estimatedCost: '₹436/year',
  },
  {
    id: 'pb_personal_accident',
    category: 'Personal Accident',
    title: 'Standalone PA Policy',
    description:
      'Covers accidental death, permanent disability, and hospitalisation. Extremely cost-effective — ₹10L cover available for under ₹500/year for young adults.',
    providerLabel: 'Compare Plans',
    providerUrl: 'https://www.coverfox.com/personal-accident-insurance/',
    isGovtScheme: false,
    isUlip: false,
    termsNote:
      'PA coverage, premium, and exclusions vary by insurer and age. Conditions apply. Please read the policy wording carefully.',
    emoji: '🩺',
    colour: '#D97706',
    ctaLabel: 'Compare PA Plans →',
    estimatedCost: '₹300–₹800/year (indicative)',
  },
]
