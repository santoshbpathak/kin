/**
 * Rule-based NLP parser — maps raw diagnostic answers to a structured UserProfile.
 * Fully deterministic (no ML). Same inputs always produce the same output.
 * All rules are auditable — each maps to a PRD data model field.
 */

export type IncomeBand = 'lt_5l' | '5_10l' | '10_20l' | '20_40l' | 'gt_40l'
export type LifeStage = 'single' | 'married_no_kids' | 'married_with_kids' | 'parent_caregiver'
export type CityTier = 'T1' | 'T2' | 'T3'
export type OccupationCategory = 'salaried_pf' | 'salaried_no_pf' | 'self_employed' | 'govt'
export type MonthlyObligationBand = 'none' | 'lt_15k' | '15_40k' | '40_80k' | 'gt_80k'

export interface DiagnosticAnswers {
  life_stage?: string
  income_band?: string
  dependants_count?: string
  monthly_obligations?: string
  existing_cover?: string[]
  city_tier?: string    // raw city name from user
  occupation?: string
}

export interface UserProfile {
  lifeStage: LifeStage
  incomeBand: IncomeBand
  dependantsCount: number
  monthlyObligationsBand: MonthlyObligationBand
  hasEmployerMediclaim: boolean
  hasPersonalHealth: boolean
  hasTermLife: boolean
  hasEndowment: boolean
  cityTier: CityTier
  occupation: OccupationCategory
  /** Derived: eligible for EDLI */
  edliEligible: boolean

  // ── Optional exact figures from conversational diagnostic (PRD v1.4) ──
  // When present, the score engine uses these instead of TYPICAL_* defaults.
  // The legacy 7-question DiagnosticFlow leaves these undefined so older
  // sessions still score the same way they did before v1.4.
  actualAnnualIncome?: number          // ₹ per year
  actualMonthlyObligations?: number    // ₹ per month
  actualPersonalLifeCover?: number     // ₹ term/personal life sum assured
  actualEmployerGroupTerm?: number     // ₹ employer group term sum assured
  actualPersonalHealthCover?: number   // ₹ retail health policy sum insured
  actualEmployerMediclaim?: number     // ₹ employer mediclaim sum insured
  actualCiCover?: number               // ₹ critical illness
  actualIncomeProtectionCover?: number // ₹ income protection / disability
}

// ── City tier mapping (T1: metros, T2: large cities, T3: rest) ───────────────
const T1_CITIES = new Set([
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad',
  'ahmedabad', 'chennai', 'kolkata', 'pune', 'surat',
])
const T2_CITIES = new Set([
  'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane',
  'bhopal', 'visakhapatnam', 'vizag', 'patna', 'vadodara', 'baroda',
  'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut',
  'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'amritsar', 'ranchi',
  'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur',
  'madurai', 'raipur', 'kota', 'chandigarh', 'guwahati', 'solapur',
  'hubli', 'dharwad', 'mysuru', 'mysore', 'tiruchirappalli', 'trichy',
  'bareilly', 'moradabad', 'noida', 'gurugram', 'gurgaon',
])

function parseCityTier(rawCity: string): CityTier {
  const normalised = rawCity.trim().toLowerCase()
  if (T1_CITIES.has(normalised)) return 'T1'
  if (T2_CITIES.has(normalised)) return 'T2'
  return 'T3'
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseAnswers(answers: DiagnosticAnswers): UserProfile {
  const lifeStage = (answers.life_stage ?? 'single') as LifeStage
  const incomeBand = (answers.income_band ?? 'lt_5l') as IncomeBand
  const dependantsCount = parseDependants(answers.dependants_count ?? '0')
  const monthlyObligationsBand = (answers.monthly_obligations ?? 'none') as MonthlyObligationBand
  const cover = answers.existing_cover ?? []
  const hasEmployerMediclaim = cover.includes('employer_mediclaim')
  const hasPersonalHealth = cover.includes('personal_health')
  const hasTermLife = cover.includes('term_life')
  const hasEndowment = cover.includes('lic_endowment')
  const cityTier = parseCityTier(answers.city_tier ?? '')
  const occupation = (answers.occupation ?? 'salaried_no_pf') as OccupationCategory
  const edliEligible = occupation === 'salaried_pf'

  return {
    lifeStage,
    incomeBand,
    dependantsCount,
    monthlyObligationsBand,
    hasEmployerMediclaim,
    hasPersonalHealth,
    hasTermLife,
    hasEndowment,
    cityTier,
    occupation,
    edliEligible,
  }
}

function parseDependants(raw: string): number {
  if (raw === '4+') return 4
  const n = parseInt(raw, 10)
  return isNaN(n) ? 0 : n
}
