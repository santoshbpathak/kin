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

    return { mapped, groupBCount }
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
