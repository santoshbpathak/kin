/**
 * @kin/shared-types — Canonical TypeScript interfaces shared between
 * apps/web (React PWA) and apps/api (NestJS backend).
 *
 * Rules:
 *   - No runtime dependencies (types only)
 *   - No circular imports
 *   - All monetary amounts in INR (number, not string)
 *   - All dates as ISO 8601 strings (never Date objects) for JSON safety
 */

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

export type IncomeBand =
  | 'below_3l'
  | '3l_6l'
  | '6l_10l'
  | '10l_20l'
  | '20l_50l'
  | 'above_50l'

export type CityTier = 't1' | 't2' | 't3'

export type LifeStage =
  | 'single'
  | 'married_no_kids'
  | 'married_with_kids'
  | 'parent_caregiver'

export type DocType =
  | 'term_life'
  | 'health'
  | 'vehicle'
  | 'home'
  | 'personal_accident'
  | 'travel'
  | 'critical_illness'
  | 'other'

export type NomineeAccessLevel = 'full' | 'policies_only' | 'emergency_only'

export type TriggerType = 'death_cert' | 'deadman' | 'trusted_contact' | 'emergency'

export type TriggerStatus = 'pending' | 'active' | 'resolved' | 'cancelled'

export type ScoreBand = 'critical' | 'significant' | 'moderate' | 'well' | 'full'

export type RecommendationType =
  | 'buy_term_life'
  | 'increase_health_cover'
  | 'add_super_top_up'
  | 'activate_pmsby'
  | 'activate_pmjjby'
  | 'claim_edli'
  | 'add_critical_illness'
  | 'add_income_protection'
  | 'check_employer_cover'
  | 'update_nominees'

// ─────────────────────────────────────────────────────────────
// Partner
// ─────────────────────────────────────────────────────────────

export interface BrandTokens {
  primaryColor: string
  accentColor?: string
  logoUrl?: string
  fontFamily?: string
}

export interface PartnerSession {
  sessionToken: string
  partnerId: string
  expiresAt: string
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string           // userId (UUID)
  sessionToken?: string
  scope?: 'standard' | 'vault'
  consentedPii?: boolean
  iat?: number
  exp?: number
}

export interface AuthResponse {
  accessToken: string
  userId: string
  scope: 'standard' | 'vault'
  consentedPii: boolean
}

// ─────────────────────────────────────────────────────────────
// Diagnostic
// ─────────────────────────────────────────────────────────────

export interface DiagnosticAnswer {
  questionId: string
  value: string | string[] | number
}

export interface ParsedProfile {
  incomeBand?: IncomeBand
  incomeAnnual?: number       // ₹ derived mid-point of band
  cityTier?: CityTier
  lifeStage?: LifeStage
  dependantsCount?: number
  monthlyObligationsBand?: string
  monthlyObligationsAmount?: number
  occupation?: 'salaried_pf' | 'self_employed' | 'govt' | 'other'
  hasTermLife?: boolean
  hasHealthCover?: boolean
  hasEmployerMediclaim?: boolean
  employerMediclaimAmount?: number
  existingTermCover?: number
  existingHealthCover?: number
  hasIncomeProtection?: boolean
}

// ─────────────────────────────────────────────────────────────
// Score
// ─────────────────────────────────────────────────────────────

export interface ScoreResult {
  scoreId: string
  compositeScore: number
  lifeSubScore: number
  healthSubScore: number
  incomeSubScore: number
  hiddenCoverageTotal: number
  ruleVersion: string
  calculatedAt: string
  band: ScoreBand
  bandLabel: string
  bandColor: string
}

export interface PeerBenchmark {
  cohortAvgScore: number
  userPercentile: number
  cohortLabel: string   // e.g. "Salaried professionals in Bengaluru, ₹10L–₹20L"
}

// ─────────────────────────────────────────────────────────────
// Trust / Recommendations
// ─────────────────────────────────────────────────────────────

export interface Recommendation {
  recommendationId: string
  type: RecommendationType
  priority: number
  title: string
  summary: string
  basisText: string       // "See the Math" content
  irdaiRuleReference: string
  productCategory: string
  isUlip: false           // ULIP_RECOMMENDATIONS = false in MVP1
  actionLabel: string
  actionRoute: string
  estimatedCost?: string
  conditionsApply: true   // always true (CG-1)
}

export interface SeeTheMathContent {
  recommendationId: string
  formula: string
  inputs: Record<string, string | number>
  result: string
  irdaiReference: string
  disclaimer: string
}

// ─────────────────────────────────────────────────────────────
// Discovery
// ─────────────────────────────────────────────────────────────

export interface HiddenCoverage {
  coverageId: string
  name: string
  type: 'active' | 'opt_in'
  amount: number          // ₹
  claimProcess: string
  claimContact: string
  claimDeadline?: string
  governmentCircularRef: string
  conditionsApply: true
}

// ─────────────────────────────────────────────────────────────
// Vault
// ─────────────────────────────────────────────────────────────

export interface VaultDocumentSummary {
  docId: string
  docType: DocType
  insurerName?: string
  policyNumber?: string
  sumAssured?: number
  renewalDate?: string
  uploadedAt: string
  hasFile: boolean
}

export interface VaultSummary {
  totalDocuments: number
  totalCoverAmount: number
  expiringWithin90Days: VaultDocumentSummary[]
  docsByType: Partial<Record<DocType, number>>
}

export interface NomineeSummary {
  nomineeId: string
  name: string
  relationship: string
  sharePercentage?: number
  accessLevel: NomineeAccessLevel
  verified: boolean
}

export interface UnlockTriggerStatus {
  triggerId: string
  triggerType: TriggerType
  status: TriggerStatus
  activatedAt?: string
  resolvedAt?: string
  unlockToken?: string
}

// ─────────────────────────────────────────────────────────────
// Streak & Engagement
// ─────────────────────────────────────────────────────────────

export interface StreakState {
  streakId: string
  currentStreakWeeks: number
  longestStreakWeeks: number
  totalPoints: number
  lastActionAt?: string
  badgesEarned: string[]
}

export interface BadgeDefinition {
  id: string
  label: string
  description: string
  iconUrl?: string
  earned: boolean
}

// ─────────────────────────────────────────────────────────────
// Quiz / KIN IQ
// ─────────────────────────────────────────────────────────────

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  scenario: string
  options: QuizOption[]
  // correctOptionId NOT included in client response (security)
  explanation?: string      // only returned after submission
  learningHook?: string     // only returned after submission
  source?: string
}

export interface QuizAttemptResult {
  score: number
  correctCount: number
  delta: number
  kinIqScore: number
  results: Array<{
    questionId: string
    correct: boolean
    explanation: string
    learningHook: string
  }>
}

export interface KinIqHistory {
  weekNumber: number
  score: number
  delta: number
  completedAt: string
}

// ─────────────────────────────────────────────────────────────
// Lifecycle / Notifications
// ─────────────────────────────────────────────────────────────

export interface NotificationPrefs {
  primaryChannel: 'whatsapp' | 'sms' | 'none'
  smsEnabled: boolean
  whatsappNumber?: string
  checkInFrequency: 'weekly' | 'fortnightly' | 'monthly'
  weeklyBrief: boolean
  streakReminders: boolean
  rescoreReminders: boolean
  stopped: boolean
}

export type LifeEventType =
  | 'new_job'
  | 'salary_change'
  | 'new_baby'
  | 'marriage'
  | 'home_loan'
  | 'parent_dependent'
  | 'vehicle_purchase'
  | 'health_diagnosis'

// ─────────────────────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  requestId: string
  timestamp: string
}

export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
  requestId: string
  timestamp: string
}
