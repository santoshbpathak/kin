/**
 * Confidence model for the mapped profile.
 * Imported by both the mapper service and the REST DTOs.
 */

import type { FieldConfidence } from '../../../database/entities/user-profile.entity'

export type { FieldConfidence }

export interface MappedProfile {
  userProfileId: string
  fieldsCollected: string[]
  estimatedFields: string[]
  unknownFields: string[]
  /** Snapshot of the confidence map persisted to user_profiles.confidenceMap */
  confidenceMap: Partial<Record<string, FieldConfidence>>
}

/**
 * Legacy client-side UserProfile shape.
 *
 * Wire-compatible with apps/web/src/modules/diagnostic/parser.ts UserProfile.
 * Downstream pages (/score, /recommend, /discover, lifecycle, streak, connect)
 * read sessionStorage['kin_diagnostic_profile'] expecting this exact shape and
 * compute scores/recommendations client-side. The conversational diagnostic
 * agent stores the canonical profile in user_profiles server-side, so the
 * mapper synthesises this legacy shape from the same data and the frontend
 * writes it back into sessionStorage to keep the existing pages working.
 *
 * Keep enum string literals identical to parser.ts. Do not rename or extend
 * without updating the frontend parser first.
 */
export interface LegacyClientProfile {
  lifeStage: 'single' | 'married_no_kids' | 'married_with_kids' | 'parent_caregiver'
  incomeBand: 'lt_5l' | '5_10l' | '10_20l' | '20_40l' | 'gt_40l'
  dependantsCount: number
  monthlyObligationsBand: 'none' | 'lt_15k' | '15_40k' | '40_80k' | 'gt_80k'
  hasEmployerMediclaim: boolean
  hasPersonalHealth: boolean
  hasTermLife: boolean
  hasEndowment: boolean
  cityTier: 'T1' | 'T2' | 'T3'
  occupation: 'salaried_pf' | 'salaried_no_pf' | 'self_employed' | 'govt'
  edliEligible: boolean

  // Exact figures from the conversational flow. The client-side score
  // engine prefers these over its TYPICAL_* defaults when present.
  actualAnnualIncome?: number
  actualMonthlyObligations?: number
  actualPersonalLifeCover?: number
  actualEmployerGroupTerm?: number
  actualPersonalHealthCover?: number
  actualEmployerMediclaim?: number
  actualCiCover?: number
  actualIncomeProtectionCover?: number
}

export interface MapperOutcome {
  mapped: MappedProfile
  /** Number of Group B fields the conversation actually collected. */
  groupBCount: number
  /** Legacy client-side UserProfile shape for sessionStorage compatibility. */
  legacyProfile: LegacyClientProfile
}
