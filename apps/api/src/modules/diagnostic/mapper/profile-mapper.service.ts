/**
 * ProfileMapperService — converts the conversational agent's
 * CollectedFields blob into a row written to user_profiles.
 *
 * Source: KIN Engineering Brief v1.4 §1.6.
 *
 * Key responsibilities:
 *   1. Translate the agent's UI-facing income band ("<5L" | "5-10L" | ...)
 *      into the internal IncomeBand enum the score engine expects.
 *   2. Apply the brief's estimation rules:
 *        - employer_group_term unknown + annual income known
 *          -> 3 x annual income, confidence "estimated"
 *        - employer_mediclaim unknown
 *          -> 500000, confidence "estimated"
 *   3. Populate BOTH the new v1.4 columns and the legacy band columns
 *      so the unchanged score engine + recommendation engine keep
 *      working without modification.
 *   4. Track which fields ended up "confirmed" vs "estimated" vs
 *      "unknown" so the Score screen can render ⓘ disclosure icons.
 *
 * This service does NOT trigger score calculation. The controller does
 * that as a separate step.
 */

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import {
  IncomeBand,
  UserProfile,
} from '../../../database/entities/user-profile.entity'
import {
  AnnualIncomeBand,
  CollectedFields,
  GROUP_B_FIELDS,
  GroupBField,
} from '../agent/intake-agent.types'
import { getCityTier } from '../city-tier.constants'
import type {
  FieldConfidence,
  LegacyClientProfile,
  MappedProfile,
  MapperOutcome,
} from './confidence.types'

@Injectable()
export class ProfileMapperService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
  ) {}

  async mapAndPersist(
    userId: string,
    collected: CollectedFields,
  ): Promise<MapperOutcome> {
    const confidenceMap: Partial<Record<string, FieldConfidence>> = {
      ...(collected.__confidence ?? {}),
    }

    // ── Income ──────────────────────────────────────────────────────
    const incomeExact = numericOrNull(collected.annual_income_exact)
    const uiBand = stringOrNull(collected.annual_income_band) as AnnualIncomeBand | null
    const internalIncomeBand = mapIncomeBand(incomeExact, uiBand)

    if (incomeExact != null && confidenceMap.annual_income_exact == null) {
      confidenceMap.annual_income_exact = 'confirmed'
    }
    if (internalIncomeBand && confidenceMap.annual_income_band == null) {
      confidenceMap.annual_income_band = 'confirmed'
    }

    // ── City tier ──────────────────────────────────────────────────
    const rawCity = stringOrNull(collected.city)
    const cityTier = rawCity ? getCityTier(rawCity) : null

    // ── Dependants ─────────────────────────────────────────────────
    const dependantsDetail = Array.isArray(collected.dependants)
      ? collected.dependants
      : null
    const dependantsCount =
      typeof collected.dependants_count === 'number'
        ? collected.dependants_count
        : dependantsDetail
          ? dependantsDetail.reduce((acc, d) => acc + (d.count ?? 0), 0)
          : null

    // ── Life stage ─────────────────────────────────────────────────
    const lifeStage =
      collected.life_stage && collected.life_stage !== 'skipped'
        ? collected.life_stage
        : null

    // ── Obligations ────────────────────────────────────────────────
    const monthlyObligationsBand = stringOrNull(collected.monthly_obligations_band)

    // ── Existing cover (Group B) ───────────────────────────────────
    let personalLifeCover = numericOrNull(collected.personal_life_cover_amount)
    let employerGroupTerm = numericOrNull(collected.employer_group_term_amount)
    let personalHealthCover = numericOrNull(collected.personal_health_cover_amount)
    const personalHealthIsFloater =
      typeof collected.personal_health_is_floater === 'boolean'
        ? collected.personal_health_is_floater
        : null
    let employerMediclaim = numericOrNull(collected.employer_mediclaim_amount)
    const ciCover = numericOrNull(collected.ci_cover_amount)
    const incomeProtectionCover = numericOrNull(collected.income_protection_cover_amount)

    // Brief §1.6 estimation rule: employer_group_term unknown + income known
    // -> 3 x income, flag estimated.
    if (
      employerGroupTerm == null &&
      (confidenceMap.employer_group_term_amount ?? 'unknown') === 'unknown' &&
      incomeExact != null
    ) {
      employerGroupTerm = incomeExact * 3
      confidenceMap.employer_group_term_amount = 'estimated'
    }

    // Brief §1.6 estimation rule: employer_mediclaim unknown -> ₹5L, flag estimated.
    if (
      employerMediclaim == null &&
      (confidenceMap.employer_mediclaim_amount ?? 'unknown') === 'unknown'
    ) {
      employerMediclaim = 500_000
      confidenceMap.employer_mediclaim_amount = 'estimated'
    }

    // Promote silent successes — any field with a real value but no
    // confidence record gets 'confirmed' so the UI can render correctly.
    for (const f of GROUP_B_FIELDS) {
      const val = collected[f]
      if (val !== undefined && val !== null && val !== 'skipped' && !confidenceMap[f]) {
        confidenceMap[f] = 'confirmed'
      }
      if ((val === undefined || val === 'skipped') && !confidenceMap[f]) {
        confidenceMap[f] = 'unknown'
      }
    }

    const groupBCount = GROUP_B_FIELDS.filter(
      f => collected[f] !== undefined && collected[f] !== 'skipped',
    ).length

    // ── Persist ────────────────────────────────────────────────────
    await this.userRepo.update(userId, {
      // Legacy / score-engine-facing columns
      incomeBand: (internalIncomeBand ?? undefined) as IncomeBand | undefined,
      cityTier: cityTier ?? undefined,
      lifeStage: lifeStage ?? undefined,
      dependantsCount: dependantsCount ?? undefined,
      monthlyObligationsBand: monthlyObligationsBand ?? undefined,

      // New v1.4 columns
      annualIncomeExact: incomeExact,
      dependantsDetail: dependantsDetail ?? null,
      personalLifeCover: personalLifeCover,
      employerGroupTerm: employerGroupTerm,
      personalHealthCover: personalHealthCover,
      personalHealthIsFloater: personalHealthIsFloater,
      employerMediclaim: employerMediclaim,
      ciCover: ciCover,
      incomeProtectionCover: incomeProtectionCover,
      confidenceMap,
      conversationCompletedAt: new Date(),
      groupBFieldsCollected: groupBCount,
    })

    const allFields = Object.keys(confidenceMap)
    const estimatedFields = allFields.filter(f => confidenceMap[f] === 'estimated')
    const unknownFields = allFields.filter(f => confidenceMap[f] === 'unknown')

    const mapped: MappedProfile = {
      userProfileId: userId,
      fieldsCollected: allFields.filter(f => confidenceMap[f] !== 'unknown'),
      estimatedFields,
      unknownFields,
      confidenceMap,
    }

    const legacyProfile = synthesiseLegacyProfile({
      lifeStage,
      internalIncomeBand,
      dependantsCount,
      monthlyObligationsBand,
      cityTier,
      occupation: stringOrNull(collected.occupation_category),
      personalLifeCover,
      employerGroupTerm,
      personalHealthCover,
      employerMediclaim,
    })

    return { mapped, groupBCount, legacyProfile }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Legacy client-profile synthesis
// ─────────────────────────────────────────────────────────────────────

interface LegacySynthesisInput {
  lifeStage: string | null
  internalIncomeBand: IncomeBand | null
  dependantsCount: number | null
  monthlyObligationsBand: string | null
  cityTier: 'T1' | 'T2' | 'T3' | null
  occupation: string | null
  personalLifeCover: number | null
  employerGroupTerm: number | null
  personalHealthCover: number | null
  employerMediclaim: number | null
}

/**
 * Map the canonical conversational profile back to the legacy UserProfile
 * shape consumed by the client-side score engine and the six downstream
 * pages that read sessionStorage['kin_diagnostic_profile'].
 *
 * Defaults are deliberately conservative: missing values resolve to the
 * lowest-score-impact band so the score is never inflated by absence.
 */
function synthesiseLegacyProfile(input: LegacySynthesisInput): LegacyClientProfile {
  return {
    lifeStage: (input.lifeStage as LegacyClientProfile['lifeStage'] | null) ?? 'single',
    incomeBand: mapInternalToLegacyIncomeBand(input.internalIncomeBand),
    dependantsCount: input.dependantsCount ?? 0,
    monthlyObligationsBand: mapToLegacyObligationsBand(input.monthlyObligationsBand),
    hasEmployerMediclaim: (input.employerMediclaim ?? 0) > 0,
    hasPersonalHealth: (input.personalHealthCover ?? 0) > 0,
    hasTermLife: (input.personalLifeCover ?? 0) > 0 || (input.employerGroupTerm ?? 0) > 0,
    hasEndowment: false, // not collected by the conversational flow
    cityTier: input.cityTier ?? 'T3',
    occupation: mapToLegacyOccupation(input.occupation),
    edliEligible: false, // PF status not collected; legacy parser only set this for salaried_pf
  }
}

function mapInternalToLegacyIncomeBand(b: IncomeBand | null): LegacyClientProfile['incomeBand'] {
  switch (b) {
    case 'lt3l':
    case '3l_5l':  return 'lt_5l'
    case '5l_10l': return '5_10l'
    case '10l_20l':return '10_20l'
    case '20l_50l':return '20_40l'
    case 'gt50l':  return 'gt_40l'
    default:       return 'lt_5l'
  }
}

function mapToLegacyObligationsBand(b: string | null): LegacyClientProfile['monthlyObligationsBand'] {
  // Conversational agent's bands are "<10K" | "10K-30K" | "30K-50K" | "50K+";
  // legacy bands are "none" | "lt_15k" | "15_40k" | "40_80k" | "gt_80k".
  switch (b) {
    case '<10K':    return 'lt_15k'
    case '10K-30K': return '15_40k'
    case '30K-50K': return '40_80k'
    case '50K+':    return 'gt_80k'
    default:        return 'none'
  }
}

function mapToLegacyOccupation(o: string | null): LegacyClientProfile['occupation'] {
  switch (o) {
    case 'salaried':       return 'salaried_no_pf' // PF status not asked; conservative default
    case 'self_employed':  return 'self_employed'
    case 'business_owner': return 'self_employed'
    default:               return 'salaried_no_pf'
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers (exported for tests)
// ─────────────────────────────────────────────────────────────────────

/**
 * Map a UI-facing income band (and/or exact figure) to the internal
 * IncomeBand enum the score engine uses. The score engine bands are:
 *   lt3l, 3l_5l, 5l_10l, 10l_20l, 20l_50l, gt50l
 * The agent's UI bands are:
 *   <5L, 5-10L, 10-20L, 20-40L, 40L+
 */
export function mapIncomeBand(
  exact: number | null,
  uiBand: AnnualIncomeBand | null,
): IncomeBand | null {
  if (exact != null) {
    const lakhs = exact / 100_000
    if (lakhs < 3) return 'lt3l'
    if (lakhs < 5) return '3l_5l'
    if (lakhs < 10) return '5l_10l'
    if (lakhs < 20) return '10l_20l'
    if (lakhs < 50) return '20l_50l'
    return 'gt50l'
  }
  switch (uiBand) {
    case '<5L':    return '3l_5l'    // best mid-bucket fit for "below 5L"
    case '5-10L':  return '5l_10l'
    case '10-20L': return '10l_20l'
    case '20-40L': return '20l_50l'
    case '40L+':   return 'gt50l'
    default:       return null
  }
}

function numericOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

function stringOrNull(v: unknown): string | null {
  if (typeof v === 'string' && v.length > 0 && v !== 'skipped') return v
  return null
}

// Used by tests to assert the GroupBField enum.
export type ExportedGroupBField = GroupBField
