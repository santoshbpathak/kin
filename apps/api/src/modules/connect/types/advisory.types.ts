/**
 * Type contracts for the three-tier advisory connect layer (Module B).
 * Source: KIN Engineering Brief v1.4 §2.
 */

import type {
  KinReportSnapshot,
  AdvisorBriefBlob,
} from '../../../database/entities/advisor-session.entity'

export type Tier = 1 | 2 | 3

/** Wire shape for POST /connect/ai/start. */
export interface StartAdvisoryDto {
  /**
   * The KIN report snapshot the client wants to inject into the Tier 1
   * agent's context. The client already has score + recommendations +
   * hidden coverages on screen, so passing them through is cheaper than
   * re-querying on the server.
   */
  kinReport: KinReportSnapshot
}

/** Per-turn response surfaced to the client. */
export interface AdvisoryTurn {
  advisorSessionId: string
  message: string
  shouldEscalate: boolean
  escalationPrompt?: string
  escalationReason?: EscalationReason | null
  isAiAssistant: true
}

export type EscalationReason =
  | 'product_recommendation'
  | 'repeated_question'
  | 'user_frustration'
  | 'complex_situation'

export interface EscalationCheck {
  shouldEscalate: boolean
  reason: EscalationReason | null
  escalationMessage: string | null
}

export interface AdvisorBrief extends AdvisorBriefBlob {
  advisorSessionId: string
  generatedAt: string
}

export interface TierUpgradeResult {
  advisorSessionId: string
  currentTier: Tier
  advisorBrief: AdvisorBrief | null
  /** Populated for tier 2 (real-time chat). */
  humanChatSessionId?: string
  /** Populated for tier 3 (booked call). */
  callBookingUrl?: string
  /** Whether the user agreed to share the Tier 1 transcript. */
  transcriptSharedConsent: boolean
}

export interface AdvisorAvailability {
  available: boolean
  nextSlot?: string
  waitlistAvailable: boolean
}
