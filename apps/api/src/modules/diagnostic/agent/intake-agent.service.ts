/**
 * IntakeAgentService — GPT-4o multi-turn conversation handler for KIN's
 * conversational diagnostic intake (Module A).
 *
 * Source: KIN Engineering Brief v1.4 §1.4.
 *
 * Responsibilities:
 *   1. Open a new conversation row in intake_conversation_sessions and
 *      return the agent's first message.
 *   2. On every user turn: append, call GPT-4o with the full history,
 *      parse the structured JSON reply, merge newly-collected fields,
 *      decide whether the conversation is complete, and persist.
 *   3. Run every assistant message through the ComplianceGuardService
 *      before returning it (Brief §3.2 — mandatory).
 *   4. Trim conversation history to fit inside the configured token
 *      budget so long sessions never overflow context (Brief §5).
 *
 * What this service does NOT do:
 *   - Map the final collectedFields onto the UserProfile schema; that is
 *     ProfileMapperService.
 *   - Calculate the Protection Score; that stays in score-engine.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { LessThan, Repository } from 'typeorm'

import {
  IntakeConversationSession,
  StoredAgentMessage,
} from '../../../database/entities/intake-conversation-session.entity'
import { getOpenAIClient } from '../../../shared/openai/openai.client'
import { ComplianceGuardService } from '../../../shared/compliance/compliance-guard.service'
import {
  INTAKE_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
} from './intake-agent.prompts'
import {
  AgentTurn,
  CollectedFields,
  GROUP_A_FIELDS,
  GROUP_B_FIELDS,
  RawAgentResponse,
} from './intake-agent.types'

const FALLBACK_OPENING = {
  message:
    "Hi! I'm KIN's wellness assistant. I'll ask a few quick questions to build your Protection Score. " +
    "Let's start simple: which life stage best describes you right now?",
  quickSelectOptions: [
    'Single',
    'Married, no kids',
    'Married with kids',
    "I'm a caregiver for parents",
    "I'll type it",
  ],
}

const FALLBACK_TURN_MESSAGE =
  "I had trouble processing that — can you try again? If it keeps happening, tap 'Skip this question'."

// Generous upper bound: keeps the LLM context comfortably under 3k tokens
// for ~15 turns (Brief §5). Once exceeded, oldest non-system messages
// are dropped first.
const MAX_HISTORY_TURNS = 30

@Injectable()
export class IntakeAgentService {
  private readonly logger = new Logger(IntakeAgentService.name)

  constructor(
    @InjectRepository(IntakeConversationSession)
    private readonly sessionRepo: Repository<IntakeConversationSession>,
    private readonly complianceGuard: ComplianceGuardService,
    private readonly config: ConfigService,
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────

  async startConversation(
    sessionToken: string,
    userId: string | null,
  ): Promise<AgentTurn> {
    await this.sweepExpired()

    const ttlSeconds =
      this.config.get<number>('openai.conversationTtlSeconds') ?? 1800
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    const opening = await this.generateOpening()

    const safeMessage = await this.complianceGuard.validateAndSanitise(
      opening.message,
      'diagnostic',
      sessionToken,
    )

    const history: StoredAgentMessage[] = [
      { role: 'system', content: INTAKE_SYSTEM_PROMPT, ts: new Date().toISOString() },
      { role: 'assistant', content: safeMessage.message, ts: new Date().toISOString() },
    ]

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        sessionToken,
        userId,
        history,
        collectedFields: {},
        turnCount: 0,
        isComplete: false,
        expiresAt,
      }),
    )

    return {
      conversationId: session.conversationId,
      message: safeMessage.message,
      quickSelectOptions: opening.quickSelectOptions,
      isComplete: false,
      progressPercent: 0,
      collectedFieldCount: 0,
    }
  }

  async processMessage(
    conversationId: string,
    userMessage: string,
  ): Promise<AgentTurn> {
    const session = await this.sessionRepo.findOne({ where: { conversationId } })
    if (!session) throw new NotFoundException('Conversation not found or expired')
    if (session.isComplete) {
      // Idempotent: re-emit the last assistant message
      const last = [...session.history].reverse().find(m => m.role === 'assistant')
      return {
        conversationId: session.conversationId,
        message: last?.content ?? '',
        quickSelectOptions: [],
        isComplete: true,
        progressPercent: 100,
        collectedFieldCount: Object.keys(session.collectedFields).length,
      }
    }

    session.history.push({
      role: 'user',
      content: userMessage,
      ts: new Date().toISOString(),
    })

    const raw = await this.callAgent(session.history)
    const cleaned = await this.complianceGuard.validateAndSanitise(
      raw.message,
      'diagnostic',
      session.sessionToken,
    )

    session.history.push({
      role: 'assistant',
      content: cleaned.message,
      ts: new Date().toISOString(),
    })

    session.turnCount += 1

    const collectedDelta = raw.collectedFields ?? {}
    session.collectedFields = mergeCollected(session.collectedFields, collectedDelta)

    const isCompleteFlag =
      raw.isComplete === true ||
      isConversationComplete(session.collectedFields as CollectedFields)

    if (isCompleteFlag) {
      session.isComplete = true
    }

    session.history = trimHistory(session.history)

    await this.sessionRepo.save(session)

    return {
      conversationId: session.conversationId,
      message: cleaned.message,
      quickSelectOptions: raw.quickSelectOptions ?? [],
      isComplete: session.isComplete,
      progressPercent: groupAProgress(session.collectedFields as CollectedFields),
      collectedFieldCount: Object.keys(session.collectedFields).length,
    }
  }

  async getStatus(conversationId: string) {
    const session = await this.sessionRepo.findOne({ where: { conversationId } })
    if (!session) throw new NotFoundException('Conversation not found or expired')
    return {
      conversationId,
      collectedFieldCount: Object.keys(session.collectedFields).length,
      progressPercent: groupAProgress(session.collectedFields as CollectedFields),
      isComplete: session.isComplete,
      turnCount: session.turnCount,
    }
  }

  /** Used by ProfileMapperService and the /complete endpoint. */
  async getSession(conversationId: string): Promise<IntakeConversationSession> {
    const session = await this.sessionRepo.findOne({ where: { conversationId } })
    if (!session) throw new NotFoundException('Conversation not found or expired')
    return session
  }

  /**
   * Run the final extraction pass over a completed conversation to obtain
   * a fully-typed CollectedFields blob. Used by ProfileMapperService.
   */
  async extractStructuredData(
    session: IntakeConversationSession,
  ): Promise<CollectedFields> {
    const transcript = session.history
      .filter(m => m.role !== 'system')
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')

    try {
      const client = getOpenAIClient()
      const model = this.config.get<string>('openai.modelPrimary') ?? 'gpt-4o'
      const maxTokens =
        this.config.get<number>('openai.maxTokensExtraction') ?? 3000

      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: transcript },
        ],
      })
      const raw = res.choices[0]?.message?.content ?? '{}'
      const parsed = (safeJson<Record<string, unknown>>(raw) ?? {}) as Record<string, unknown>
      // Always trust the live collectedFields the agent already extracted,
      // overlayed with the extraction-pass output.
      return mergeCollected(session.collectedFields, parsed) as CollectedFields
    } catch (err) {
      this.logger.error(
        `extractStructuredData failed: ${(err as Error).message}. Falling back to collectedFields.`,
      )
      return session.collectedFields as CollectedFields
    }
  }

  // ── Internals ───────────────────────────────────────────────────────

  /**
   * First-turn opening. We ask GPT-4o once so the tone is consistent and
   * the model picks a natural opening question; if the call fails (no
   * API key, timeout) we return a deterministic fallback so the user is
   * never blocked at the door.
   */
  private async generateOpening(): Promise<{ message: string; quickSelectOptions: string[] }> {
    try {
      const client = getOpenAIClient()
      const model = this.config.get<string>('openai.modelPrimary') ?? 'gpt-4o'
      const maxTokens =
        this.config.get<number>('openai.maxTokensDiagnostic') ?? 2000

      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: INTAKE_SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              '__BEGIN__ Greet the user warmly in one sentence and ask the first question.',
          },
        ],
      })
      const raw = res.choices[0]?.message?.content ?? ''
      const parsed = safeJson<RawAgentResponse>(raw)
      if (parsed?.message) {
        return {
          message: parsed.message,
          quickSelectOptions: parsed.quickSelectOptions ?? FALLBACK_OPENING.quickSelectOptions,
        }
      }
    } catch (err) {
      this.logger.warn(
        `generateOpening fell back to default: ${(err as Error).message}`,
      )
    }
    return FALLBACK_OPENING
  }

  /**
   * Per-turn call. Wraps OpenAI in try/catch (Brief Compliance §0.4).
   * On failure we surface a graceful fallback message and let the user
   * retry; we never crash the user flow.
   */
  private async callAgent(history: StoredAgentMessage[]): Promise<RawAgentResponse> {
    try {
      const client = getOpenAIClient()
      const model = this.config.get<string>('openai.modelPrimary') ?? 'gpt-4o'
      const maxTokens =
        this.config.get<number>('openai.maxTokensDiagnostic') ?? 2000

      const messages = history.map(m => ({ role: m.role, content: m.content }))

      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages,
      })
      const raw = res.choices[0]?.message?.content ?? ''
      const parsed = safeJson<RawAgentResponse>(raw)
      if (!parsed?.message) {
        this.logger.warn('Agent reply missing "message" key; using fallback.')
        return { message: FALLBACK_TURN_MESSAGE, quickSelectOptions: [] }
      }
      return parsed
    } catch (err) {
      this.logger.error(`callAgent failed: ${(err as Error).message}`)
      return { message: FALLBACK_TURN_MESSAGE, quickSelectOptions: [] }
    }
  }

  /** Lazy maintenance: drop expired conversation rows on each /start. */
  private async sweepExpired(): Promise<void> {
    try {
      await this.sessionRepo.delete({ expiresAt: LessThan(new Date()) })
    } catch (err) {
      // Sweep is best-effort; never let it fail the user flow.
      this.logger.warn(`Expired conversation sweep failed: ${(err as Error).message}`)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Pure helpers (exported for tests)
// ─────────────────────────────────────────────────────────────────────

export function isConversationComplete(collected: CollectedFields): boolean {
  const groupADone = GROUP_A_FIELDS.every(f => collected[f] !== undefined)
  const groupBHit = GROUP_B_FIELDS.filter(f => collected[f] !== undefined).length
  // Hard rule per Brief §1.4: personal_life_cover_amount must be explicitly
  // answered (number, 0, or "skipped") before the Life sub-score can run
  // without a warning.
  const lifeCoverAnswered = collected.personal_life_cover_amount !== undefined
  return groupADone && groupBHit >= 3 && lifeCoverAnswered
}

export function groupAProgress(collected: CollectedFields): number {
  const done = GROUP_A_FIELDS.filter(f => collected[f] !== undefined).length
  return Math.round((done / GROUP_A_FIELDS.length) * 100)
}

function mergeCollected(
  existing: Record<string, unknown>,
  delta: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...existing }
  for (const [k, v] of Object.entries(delta)) {
    if (k === '__confidence' && typeof v === 'object' && v !== null) {
      out.__confidence = { ...(out.__confidence as object ?? {}), ...(v as object) }
      continue
    }
    if (v !== undefined && v !== null) out[k] = v
  }
  return out
}

function trimHistory(history: StoredAgentMessage[]): StoredAgentMessage[] {
  if (history.length <= MAX_HISTORY_TURNS) return history
  // Always keep the leading system prompt; drop oldest non-system turns.
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
