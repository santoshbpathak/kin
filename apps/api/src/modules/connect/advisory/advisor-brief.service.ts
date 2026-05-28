/**
 * AdvisorBriefService — generates the 3-line human-advisor pre-brief
 * when a user upgrades from Tier 1 to Tier 2 or 3 (Brief §2.5).
 *
 * The brief is plain English (≤20 words per line), no jargon, no
 * product names. Compliance guard is applied before persistence even
 * though the prompt explicitly forbids brand names.
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { getOpenAIClient } from '../../../shared/openai/openai.client'
import { ComplianceGuardService } from '../../../shared/compliance/compliance-guard.service'
import { ADVISOR_BRIEF_PROMPT } from './ai-advisor.prompts'
import type {
  AdvisorSessionMessage,
  AdvisorBriefBlob,
  KinReportSnapshot,
} from '../../../database/entities/advisor-session.entity'

const FALLBACK_BRIEF: AdvisorBriefBlob = {
  line1: 'User reviewed their Protection Score and biggest coverage gap.',
  line2: 'Asked clarifying questions about their score breakdown.',
  line3: 'Start by reviewing their top recommendation and confirming priorities.',
}

@Injectable()
export class AdvisorBriefService {
  private readonly logger = new Logger(AdvisorBriefService.name)

  constructor(
    private readonly complianceGuard: ComplianceGuardService,
    private readonly config: ConfigService,
  ) {}

  async generate(
    report: KinReportSnapshot,
    transcript: AdvisorSessionMessage[],
    sessionToken?: string | null,
  ): Promise<AdvisorBriefBlob> {
    const raw = await this.callLLM(report, transcript)
    const brief = raw ?? FALLBACK_BRIEF

    const sanitised = await Promise.all([
      this.complianceGuard.validateAndSanitise(brief.line1, 'advisor', sessionToken ?? undefined),
      this.complianceGuard.validateAndSanitise(brief.line2, 'advisor', sessionToken ?? undefined),
      this.complianceGuard.validateAndSanitise(brief.line3, 'advisor', sessionToken ?? undefined),
    ])

    return {
      line1: sanitised[0].message,
      line2: sanitised[1].message,
      line3: sanitised[2].message,
    }
  }

  private async callLLM(
    report: KinReportSnapshot,
    transcript: AdvisorSessionMessage[],
  ): Promise<AdvisorBriefBlob | null> {
    try {
      const client = getOpenAIClient()
      const model = this.config.get<string>('openai.modelPrimary') ?? 'gpt-4o'

      const transcriptText = transcript
        .filter(m => m.role !== 'system')
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n')

      const reportText = JSON.stringify({
        compositeScore: report.compositeScore,
        sub: {
          life: report.lifeSubScore,
          health: report.healthSubScore,
          income: report.incomeSubScore,
        },
        topRecommendation: report.topRecommendation,
        estimatedFields: report.estimatedFields,
        unknownFields: report.unknownFields,
      })

      const res = await client.chat.completions.create({
        model,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ADVISOR_BRIEF_PROMPT },
          {
            role: 'user',
            content: `KIN report:\n${reportText}\n\nTranscript:\n${transcriptText}`,
          },
        ],
      })

      const raw = res.choices[0]?.message?.content ?? '{}'
      const parsed = safeJson<AdvisorBriefBlob>(raw)
      if (!parsed?.line1 || !parsed.line2 || !parsed.line3) return null
      return parsed
    } catch (err) {
      this.logger.warn(`Advisor brief generation failed: ${(err as Error).message}`)
      return null
    }
  }
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
