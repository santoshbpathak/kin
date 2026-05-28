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

export interface MapperOutcome {
  mapped: MappedProfile
  /** Number of Group B fields the conversation actually collected. */
  groupBCount: number
}
