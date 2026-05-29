/**
 * KIN Protection Score Engine — v1.0.0
 *
 * Fully deterministic. Same inputs → same output every time.
 * Rule version is stored on every score record for IRDAI audit trail.
 *
 * Scoring formula (per PRD):
 *   Life  (40%) = (current_term_cover / (10 × annual_income)) × 100, capped at 100
 *   Health(35%) = (mediclaim + CI_cover) / (3 × annual_income, age/dep adjusted) × 100
 *   Income(25%) = (income_protection_cover) / (monthly_obligations × 24) × 100
 *   Composite   = Life×0.40 + Health×0.35 + Income×0.25
 *
 * Score inflation guards (per PRD):
 *   - Employer mediclaim counted at 70% face value (job-change risk)
 *   - ULIP/endowment: only pure risk component (treated as 0 in MVP1)
 *   - Hidden coverages (EDLI, IRCTC, etc.) tracked separately — NOT in composite
 */

import type { UserProfile, IncomeBand, MonthlyObligationBand } from '../diagnostic/parser'

export const RULE_VERSION = 'v1.0.0'

export type ScoreBand = 'critical' | 'significant' | 'moderate' | 'well' | 'full'

export interface SubScore {
  label: string
  score: number          // 0–100
  currentCover: number   // ₹
  recommendedCover: number // ₹
  gap: number            // ₹ (recommended - current), 0 if gap closed
  description: string
}

export interface ScoreResult {
  compositeScore: number   // 0–100
  band: ScoreBand
  bandLabel: string
  bandColour: string
  lifeScore: SubScore
  healthScore: SubScore
  incomeScore: SubScore
  hiddenCoverageTotal: number  // ₹ bonus — not in composite
  edliEligible: boolean
  ruleVersion: string
  calculatedAt: string
}

// ── Income band → annual income midpoint (₹) ──────────────────────────────
const INCOME_MIDPOINT: Record<IncomeBand, number> = {
  lt_5l:   300_000,
  '5_10l':  750_000,
  '10_20l': 1_500_000,
  '20_40l': 3_000_000,
  gt_40l:   5_000_000,
}

// ── Monthly obligation band → monthly value (₹) ──────────────────────────
const OBLIGATION_MIDPOINT: Record<MonthlyObligationBand, number> = {
  none:    0,
  lt_15k:  7_500,
  '15_40k': 27_500,
  '40_80k': 60_000,
  gt_80k:  100_000,
}

// ── Typical cover assumptions for MVP1 (no exact figures entered) ──────────
// Users declare what they have — we assign conservative industry-typical amounts
const TYPICAL_TERM_COVER       = 5_000_000   // ₹50L — conservative for declared term policy
const TYPICAL_EMPLOYER_HEALTH  = 500_000     // ₹5L group mediclaim face value
const EMPLOYER_HEALTH_FACTOR   = 0.70        // PRD: count at 70% due to job-change risk
const TYPICAL_PERSONAL_HEALTH  = 1_000_000   // ₹10L personal mediclaim

// ── Score band lookup ─────────────────────────────────────────────────────
function getBand(score: number): { band: ScoreBand; label: string; colour: string } {
  if (score <= 30) return { band: 'critical',    label: 'Critical Risk',    colour: '#EF4444' }
  if (score <= 55) return { band: 'significant', label: 'Significant Gap',  colour: '#F97316' }
  if (score <= 75) return { band: 'moderate',    label: 'Moderate Gap',     colour: '#EAB308' }
  if (score <= 90) return { band: 'well',        label: 'Well Protected',   colour: '#22C55E' }
  return              { band: 'full',        label: 'Fully Protected',  colour: '#14B8A6' }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function fmt(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

// ── Main calculation ──────────────────────────────────────────────────────
export function calculateScore(profile: UserProfile): ScoreResult {
  // Prefer exact figures from the conversational flow; fall back to band
  // midpoints for legacy 7-question sessions.
  const annualIncome      = profile.actualAnnualIncome ?? INCOME_MIDPOINT[profile.incomeBand]
  const monthlyObligation = profile.actualMonthlyObligations ?? OBLIGATION_MIDPOINT[profile.monthlyObligationsBand]

  // ── Life sub-score ───────────────────────────────────────────────────
  const recommendedLifeCover = annualIncome * 10
  // Personal term life + employer group term both count toward life cover.
  // When exact figures are not available, fall back to the typical assumption.
  const personalLifeCover = profile.actualPersonalLifeCover
    ?? (profile.hasTermLife && profile.actualEmployerGroupTerm == null
        ? TYPICAL_TERM_COVER
        : 0)
  const employerGroupTermCover = profile.actualEmployerGroupTerm ?? 0
  const currentTermCover = personalLifeCover + employerGroupTermCover
  const lifeRaw = recommendedLifeCover > 0
    ? (currentTermCover / recommendedLifeCover) * 100
    : 100
  const lifeScore = clamp(lifeRaw)

  // ── Health sub-score ─────────────────────────────────────────────────
  const dependantFactor = 1 + (profile.dependantsCount * 0.1)  // more dependants → higher need
  const recommendedHealthCover = annualIncome * 3 * dependantFactor
  const employerHealthFace = profile.actualEmployerMediclaim
    ?? (profile.hasEmployerMediclaim ? TYPICAL_EMPLOYER_HEALTH : 0)
  const employerHealth = employerHealthFace * EMPLOYER_HEALTH_FACTOR
  const personalHealth = profile.actualPersonalHealthCover
    ?? (profile.hasPersonalHealth ? TYPICAL_PERSONAL_HEALTH : 0)
  const currentHealthCover = employerHealth + personalHealth
  const healthRaw = recommendedHealthCover > 0
    ? (currentHealthCover / recommendedHealthCover) * 100
    : 100
  const healthScore = clamp(healthRaw)

  // ── Income protection sub-score ──────────────────────────────────────
  // Recommended: cover obligations for 24 months
  const recommendedIncomeCover = monthlyObligation * 24
  const currentIncomeCover = profile.actualIncomeProtectionCover ?? 0
  const incomeRaw = recommendedIncomeCover === 0
    ? 100   // no obligations = no gap
    : (currentIncomeCover / recommendedIncomeCover) * 100
  const incomeScore = clamp(incomeRaw)

  // ── Composite ────────────────────────────────────────────────────────
  const composite = clamp(
    lifeScore * 0.40 + healthScore * 0.35 + incomeScore * 0.25
  )
  const compositeScore = Math.round(composite)

  // ── Hidden coverage total (bonus — not in composite) ─────────────────
  let hiddenCoverageTotal = 0
  if (profile.edliEligible) hiddenCoverageTotal += 700_000   // EDLI ₹7L
  // Additional hidden coverages surfaced in Module 6 (Discovery Engine)

  const { band, label, colour } = getBand(compositeScore)

  return {
    compositeScore,
    band,
    bandLabel: label,
    bandColour: colour,
    lifeScore: {
      label: 'Life Protection',
      score: Math.round(lifeScore),
      currentCover: currentTermCover,
      recommendedCover: recommendedLifeCover,
      gap: Math.max(0, recommendedLifeCover - currentTermCover),
      description: profile.hasTermLife
        ? `You have a term policy (~${fmt(currentTermCover)}). Recommended cover is ${fmt(recommendedLifeCover)} (10× income).`
        : `No term life cover detected. Recommended minimum is ${fmt(recommendedLifeCover)} (10× your income).`,
    },
    healthScore: {
      label: 'Health Protection',
      score: Math.round(healthScore),
      currentCover: currentHealthCover,
      recommendedCover: recommendedHealthCover,
      gap: Math.max(0, recommendedHealthCover - currentHealthCover),
      description: profile.hasEmployerMediclaim
        ? `Employer mediclaim counted at 70% face value (${fmt(employerHealth)}) to reflect job-change risk. Recommended: ${fmt(recommendedHealthCover)}.`
        : `No health cover detected. Recommended minimum is ${fmt(recommendedHealthCover)} for your family size.`,
    },
    incomeScore: {
      label: 'Income Protection',
      score: Math.round(incomeScore),
      currentCover: currentIncomeCover,
      recommendedCover: recommendedIncomeCover,
      gap: Math.max(0, recommendedIncomeCover - currentIncomeCover),
      description: recommendedIncomeCover === 0
        ? 'No active EMIs — income protection gap is minimal.'
        : `Your obligations are ~${fmt(monthlyObligation)}/month. Recommended cover: ${fmt(recommendedIncomeCover)} (24 months of obligations).`,
    },
    hiddenCoverageTotal,
    edliEligible: profile.edliEligible,
    ruleVersion: RULE_VERSION,
    calculatedAt: new Date().toISOString(),
  }
}
