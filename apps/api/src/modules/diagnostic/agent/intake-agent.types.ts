/**
 * Type contracts for the conversational diagnostic agent (Module A).
 * Source: KIN Engineering Brief v1.4 §1.3 + §1.4.
 *
 * Field-key names are the canonical wire keys used in both:
 *   - the GPT-4o structured output schema (response_format json_object)
 *   - the on-disk collectedFields blob inside IntakeConversationSession
 *
 * Do not rename without updating the prompts and the profile mapper.
 */

import type { DependantDetail, FieldConfidence } from '../../../database/entities/user-profile.entity'

/** UI-facing income band labels used by the conversational agent. */
export type AnnualIncomeBand = '<5L' | '5-10L' | '10-20L' | '20-40L' | '40L+'

export type OccupationCategory =
  | 'salaried'
  | 'self_employed'
  | 'business_owner'
  | 'other'

export type AgentLifeStage =
  | 'single'
  | 'married_no_kids'
  | 'married_with_kids'
  | 'parent_caregiver'

/** Single OpenAI chat-completion message stored in conversation history. */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** What the agent returns to the frontend after each user turn. */
export interface AgentTurn {
  conversationId: string
  message: string
  quickSelectOptions: string[]
  isComplete: boolean
  /** Live progress bar input (0–100). */
  progressPercent: number
  collectedFieldCount: number
  /** Filled only when isComplete=true. */
  estimatedFields?: string[]
  unknownFields?: string[]
}

/** Structured GPT-4o JSON response shape — both per-turn and final. */
export interface RawAgentResponse {
  message: string
  quickSelectOptions?: string[]
  isComplete?: boolean
  collectedFields?: Record<string, unknown>
}

/**
 * Canonical field schema. Keys here must match the prompt and the
 * profile mapper. All values may be undefined while still being collected;
 * "skipped" is a sentinel string the agent may use for fields the user
 * declined.
 */
export interface CollectedFields {
  // ── Group A ─────────────────────────────────────────────────────────
  annual_income_exact?: number | 'skipped' | null
  annual_income_band?: AnnualIncomeBand | 'skipped'
  dependants?: DependantDetail[] | 'skipped'
  dependants_count?: number | 'skipped'
  life_stage?: AgentLifeStage | 'skipped'
  city?: string | 'skipped'
  city_tier?: 'T1' | 'T2' | 'T3' | 'skipped'
  monthly_obligations_exact?: number | 'skipped' | null
  monthly_obligations_band?: string | 'skipped'
  occupation_category?: OccupationCategory | 'skipped'

  // ── Group B (existing cover) ───────────────────────────────────────
  personal_life_cover_amount?: number | 'skipped' | null
  personal_life_cover_source?: string | null
  employer_group_term_amount?: number | 'skipped' | null
  personal_health_cover_amount?: number | 'skipped' | null
  personal_health_is_floater?: boolean | null
  employer_mediclaim_amount?: number | 'skipped' | null
  ci_cover_amount?: number | 'skipped' | null
  income_protection_cover_amount?: number | 'skipped' | null

  // ── Group C (opportunistic) ────────────────────────────────────────
  recent_life_events?: string[]
  upcoming_obligations?: string | null

  // ── Per-field confidence (parallel keys with _conf suffix) ─────────
  // Stored as { [field_key]: 'confirmed' | 'estimated' | 'unknown' }
  __confidence?: Partial<Record<string, FieldConfidence>>
}

export const GROUP_A_FIELDS = [
  'annual_income_band',
  'dependants_count',
  'life_stage',
  'city',
  'city_tier',
  'monthly_obligations_band',
  'occupation_category',
] as const

export const GROUP_B_FIELDS = [
  'personal_life_cover_amount',
  'employer_group_term_amount',
  'personal_health_cover_amount',
  'employer_mediclaim_amount',
  'ci_cover_amount',
  'income_protection_cover_amount',
] as const

export type GroupAField = (typeof GROUP_A_FIELDS)[number]
export type GroupBField = (typeof GROUP_B_FIELDS)[number]
