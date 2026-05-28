/**
 * Assembles a KinReportPayload for injection into the Tier 1 AI advisor.
 *
 * Reads the user's deterministic profile (set by the diagnostic chat) and
 * the score/recommendation engines that already exist on the client. Falls
 * back to a neutral skeleton when the profile is missing so the chat can
 * still boot — the agent will openly acknowledge limited context in that
 * case.
 */

import { calculateScore } from '@/modules/score/scoreEngine'
import { generateRecommendations } from '@/modules/trust/recommendationEngine'
import type { UserProfile } from '@/modules/diagnostic/parser'

export interface KinReportPayload {
  compositeScore: number
  lifeSubScore: number
  healthSubScore: number
  incomeSubScore: number
  lifeGapSummary: string
  healthGapSummary: string
  incomeGapSummary: string
  topRecommendation: string
  recommendations: Array<{ type: string; title: string; basisText: string }>
  hiddenCoverages: string[]
  estimatedFields: string[]
  unknownFields: string[]
}

const FALLBACK: KinReportPayload = {
  compositeScore: 0,
  lifeSubScore: 0,
  healthSubScore: 0,
  incomeSubScore: 0,
  lifeGapSummary: 'Not yet calculated',
  healthGapSummary: 'Not yet calculated',
  incomeGapSummary: 'Not yet calculated',
  topRecommendation: 'Complete the diagnostic to see personalised guidance.',
  recommendations: [],
  hiddenCoverages: [],
  estimatedFields: [],
  unknownFields: [],
}

interface DiagnosticConfidence {
  estimatedFields?: string[]
  unknownFields?: string[]
}

export function assembleKinReport(): KinReportPayload {
  try {
    const rawProfile = sessionStorage.getItem('kin_diagnostic_profile')
    if (!rawProfile) return FALLBACK
    const profile: UserProfile = JSON.parse(rawProfile)
    const score = calculateScore(profile)
    const recs = generateRecommendations(profile, score)
    const confidence = readConfidence()

    return {
      compositeScore: score.compositeScore,
      lifeSubScore: score.lifeScore.score,
      healthSubScore: score.healthScore.score,
      incomeSubScore: score.incomeScore.score,
      lifeGapSummary: score.lifeScore.description,
      healthGapSummary: score.healthScore.description,
      incomeGapSummary: score.incomeScore.description,
      topRecommendation: recs[0]?.headline ?? 'Review your gap map and pick a starting point.',
      recommendations: recs.slice(0, 5).map(r => ({
        type: r.productCategory,
        title: r.headline,
        basisText: r.basisText,
      })),
      hiddenCoverages: profile.edliEligible ? ['EDLI'] : [],
      estimatedFields: confidence.estimatedFields ?? [],
      unknownFields: confidence.unknownFields ?? [],
    }
  } catch {
    return FALLBACK
  }
}

function readConfidence(): DiagnosticConfidence {
  try {
    const raw = sessionStorage.getItem('kin_diagnostic_confidence')
    if (!raw) return {}
    return JSON.parse(raw) as DiagnosticConfidence
  } catch {
    return {}
  }
}
