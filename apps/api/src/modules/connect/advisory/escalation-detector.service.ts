/**
 * EscalationDetectorService — second-pass check after every Tier 1 user
 * message (Brief §2.4).
 *
 * Uses gpt-4o-mini (cheaper, faster) to classify whether the latest user
 * turn should trigger an offer to upgrade to a human advisor. Combined
 * with a deterministic regex pre-check for the canonical "which company
 * should I buy from" phrasing the brief tests for explicitly (§5).
 *
 * Always fails open: if the LLM call fails, no escalation is triggered.
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { getOpenAIClient } from '../../../shared/openai/openai.client'
import { ESCALATION_DETECTION_PROMPT } from './ai-advisor.prompts'
import type { AdvisorSessionMessage } from '../../../database/entities/advisor-session.entity'
import type { EscalationCheck } from '../types/advisory.types'

const CANONICAL_ESCALATION_MESSAGE =
  'This is something where a KIN advisor can give you a more personalised answer. ' +
  'Want me to connect you to one right now?'

// Brief §5 test: this phrasing must always fire escalation.
const PRODUCT_RECOMMENDATION_REGEX =
  /\b(which|what|recommend)\b.*\b(company|insurer|policy|plan|brand)\b/i

const FRUSTRATION_REGEX =
  /\b(useless|not helpful|unhelpful|i give up|i'm done|waste of time|frustrated|terrible)\b/i

const COMPLEX_REGEX =
  /\b(nri|non[- ]resident|keyman|joint life|pension plan|annuity|hni|business insurance)\b/i

@Injectable()
export class EscalationDetectorService {
  private readonly logger = new Logger(EscalationDetectorService.name)

  constructor(private readonly config: ConfigService) {}

  async check(
    history: AdvisorSessionMessage[],
    latestUserMessage: string,
  ): Promise<EscalationCheck> {
    // ── Fast deterministic pre-checks (no LLM cost) ─────────────────
    if (PRODUCT_RECOMMENDATION_REGEX.test(latestUserMessage)) {
      return {
        shouldEscalate: true,
        reason: 'product_recommendation',
        escalationMessage: CANONICAL_ESCALATION_MESSAGE,
      }
    }
    if (FRUSTRATION_REGEX.test(latestUserMessage)) {
      return {
        shouldEscalate: true,
        reason: 'user_frustration',
        escalationMessage: CANONICAL_ESCALATION_MESSAGE,
      }
    }
    if (COMPLEX_REGEX.test(latestUserMessage)) {
      return {
        shouldEscalate: true,
        reason: 'complex_situation',
        escalationMessage: CANONICAL_ESCALATION_MESSAGE,
      }
    }
    if (isRepeatedQuestion(history, latestUserMessage)) {
      return {
        shouldEscalate: true,
        reason: 'repeated_question',
        escalationMessage: CANONICAL_ESCALATION_MESSAGE,
      }
    }

    // ── LLM second pass for the long tail ──────────────────────────
    try {
      const client = getOpenAIClient()
      const model =
        this.config.get<string>('openai.modelEscalation') ?? 'gpt-4o-mini'

      const transcript = history
        .filter(m => m.role !== 'system')
        .slice(-8)
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n')

      const res = await client.chat.completions.create({
        model,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ESCALATION_DETECTION_PROMPT },
          {
            role: 'user',
            content:
              `Conversation so far:\n${transcript}\n\n` +
              `Latest user message:\n${latestUserMessage}`,
          },
        ],
      })
      const raw = res.choices[0]?.message?.content ?? '{}'
      const parsed = safeJson<EscalationCheck>(raw)
      if (!parsed || typeof parsed.shouldEscalate !== 'boolean') {
        return { shouldEscalate: false, reason: null, escalationMessage: null }
      }
      // Enforce the canonical phrasing even if the model improvises.
      if (parsed.shouldEscalate) {
        parsed.escalationMessage = CANONICAL_ESCALATION_MESSAGE
      }
      return parsed
    } catch (err) {
      this.logger.warn(`Escalation detector LLM call failed: ${(err as Error).message}`)
      return { shouldEscalate: false, reason: null, escalationMessage: null }
    }
  }
}

function isRepeatedQuestion(
  history: AdvisorSessionMessage[],
  latest: string,
): boolean {
  const userTurns = history.filter(m => m.role === 'user')
  if (userTurns.length < 1) return false
  const normalised = latest.trim().toLowerCase().replace(/\s+/g, ' ')
  if (normalised.length < 8) return false
  const priorMatches = userTurns.filter(t => {
    const prev = t.content.trim().toLowerCase().replace(/\s+/g, ' ')
    return prev === normalised
  }).length
  return priorMatches >= 1
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
