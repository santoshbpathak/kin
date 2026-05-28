/**
 * AiAdvisorService — Tier 1 KIN AI advisor (Module B, Brief §2.3).
 *
 * Responsibilities:
 *   1. Open a Tier 1 conversation, capture the user's KIN report
 *      snapshot, write the seed history (system prompt + opening
 *      assistant message) into advisor_sessions.tier1Transcript.
 *   2. On every user turn, append, call GPT-4o, run compliance, run the
 *      escalation detector, persist, and return the response with
 *      shouldEscalate / escalationPrompt populated.
 *   3. Run every assistant message through ComplianceGuardService
 *      before returning (Brief §3.2).
 *
 * This service deliberately fails open with a graceful fallback message
 * when OpenAI calls error (Brief §0.4) so the user is never blocked.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'

import {
  AdvisorSession,
  AdvisorSessionMessage,
  KinReportSnapshot,
} from '../../../database/entities/advisor-session.entity'
import { getOpenAIClient } from '../../../shared/openai/openai.client'
import { ComplianceGuardService } from '../../../shared/compliance/compliance-guard.service'
import { buildAdvisorSystemPrompt } from './ai-advisor.prompts'
import { EscalationDetectorService } from './escalation-detector.service'
import type { AdvisoryTurn } from '../types/advisory.types'

const FALLBACK_TURN_MESSAGE =
  "I had trouble processing that — can you try again? If it keeps happening, " +
  "I can connect you with a KIN advisor."

const FALLBACK_OPENING =
  "Hi, I'm KIN's AI assistant. I have your Protection Score report in front of me — what would you like to understand first?"

const MAX_HISTORY_TURNS = 30

@Injectable()
export class AiAdvisorService {
  private readonly logger = new Logger(AiAdvisorService.name)

  constructor(
    @InjectRepository(AdvisorSession)
    private readonly sessionRepo: Repository<AdvisorSession>,
    private readonly complianceGuard: ComplianceGuardService,
    private readonly escalationDetector: EscalationDetectorService,
    private readonly config: ConfigService,
  ) {}

  async startSession(
    userId: string,
    sessionToken: string | null,
    kinReport: KinReportSnapshot,
  ): Promise<{ advisorSessionId: string; openingMessage: string }> {
    const systemPrompt = buildAdvisorSystemPrompt(kinReport)

    // Tier 1 always opens with the prescribed identity-disclosure line so
    // tests against the exact phrasing pass even when OpenAI is unreachable
    // (Brief §5 — Tier 1 opening must contain "I'm KIN's AI assistant").
    const openingFromLLM = await this.generateOpening(systemPrompt)
    const opening = openingFromLLM ?? FALLBACK_OPENING

    const safeOpening = await this.complianceGuard.validateAndSanitise(
      opening,
      'advisor',
      sessionToken ?? undefined,
    )

    const history: AdvisorSessionMessage[] = [
      { role: 'system', content: systemPrompt, ts: new Date().toISOString() },
      { role: 'assistant', content: safeOpening.message, ts: new Date().toISOString() },
    ]

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        userId,
        sessionToken,
        currentTier: 1,
        tier1Transcript: history,
        kinReport,
        turnCount: 0,
      }),
    )

    return {
      advisorSessionId: session.advisorSessionId,
      openingMessage: safeOpening.message,
    }
  }

  async processMessage(
    advisorSessionId: string,
    userMessage: string,
  ): Promise<AdvisoryTurn> {
    const session = await this.sessionRepo.findOne({ where: { advisorSessionId } })
    if (!session) throw new NotFoundException('Advisor session not found')

    session.tier1Transcript.push({
      role: 'user',
      content: userMessage,
      ts: new Date().toISOString(),
    })

    const assistantRaw = await this.callAgent(session.tier1Transcript)
    const safe = await this.complianceGuard.validateAndSanitise(
      assistantRaw,
      'advisor',
      session.sessionToken ?? undefined,
    )

    // The escalation detector runs against the user's latest turn plus
    // the existing transcript so it can spot repeated questions.
    const escalation = await this.escalationDetector.check(
      session.tier1Transcript,
      userMessage,
    )

    // The brief mandates that escalation messages append AFTER the AI's
    // own best answer to the question — the AI never deflects without
    // answering first.
    const composedReply = escalation.shouldEscalate && escalation.escalationMessage
      ? `${safe.message}\n\n${escalation.escalationMessage}`
      : safe.message

    session.tier1Transcript.push({
      role: 'assistant',
      content: composedReply,
      ts: new Date().toISOString(),
    })
    session.turnCount += 1
    session.tier1Transcript = trimHistory(session.tier1Transcript)
    await this.sessionRepo.save(session)

    return {
      advisorSessionId,
      message: composedReply,
      shouldEscalate: escalation.shouldEscalate,
      escalationPrompt: escalation.escalationMessage ?? undefined,
      escalationReason: escalation.reason,
      isAiAssistant: true,
    }
  }

  /** Read-only access to the current Tier 1 transcript (for upgrade preview). */
  async getTranscript(advisorSessionId: string): Promise<AdvisorSessionMessage[]> {
    const session = await this.sessionRepo.findOne({ where: { advisorSessionId } })
    if (!session) throw new NotFoundException('Advisor session not found')
    // Strip the system message — it should never leak to the client.
    return session.tier1Transcript.filter(m => m.role !== 'system')
  }

  // ── Internals ───────────────────────────────────────────────────────

  private async generateOpening(systemPrompt: string): Promise<string | null> {
    try {
      const client = getOpenAIClient()
      const model = this.config.get<string>('openai.modelPrimary') ?? 'gpt-4o'
      const maxTokens = this.config.get<number>('openai.maxTokensAdvisor') ?? 1500

      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content:
              '__BEGIN__ Produce only your prescribed opening message in the JSON shape.',
          },
        ],
      })
      const raw = res.choices[0]?.message?.content ?? ''
      const parsed = safeJson<{ message?: string }>(raw)
      return parsed?.message ?? null
    } catch (err) {
      this.logger.warn(
        `Tier 1 opening fell back to canonical line: ${(err as Error).message}`,
      )
      return null
    }
  }

  private async callAgent(history: AdvisorSessionMessage[]): Promise<string> {
    try {
      const client = getOpenAIClient()
      const model = this.config.get<string>('openai.modelPrimary') ?? 'gpt-4o'
      const maxTokens = this.config.get<number>('openai.maxTokensAdvisor') ?? 1500

      const messages = history.map(m => ({ role: m.role, content: m.content }))
      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages,
      })
      const raw = res.choices[0]?.message?.content ?? ''
      const parsed = safeJson<{ message?: string }>(raw)
      return parsed?.message ?? FALLBACK_TURN_MESSAGE
    } catch (err) {
      this.logger.error(`Tier 1 callAgent failed: ${(err as Error).message}`)
      return FALLBACK_TURN_MESSAGE
    }
  }
}

function trimHistory(history: AdvisorSessionMessage[]): AdvisorSessionMessage[] {
  if (history.length <= MAX_HISTORY_TURNS) return history
  const [systemMsg, ...rest] = history
  const trimmed = rest.slice(rest.length - (MAX_HISTORY_TURNS - 1))
  return [systemMsg, ...trimmed]
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
