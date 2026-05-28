/**
 * IntakeConversationSession — per-session state for the GPT-4o
 * conversational diagnostic agent.
 *
 * NOTE: The KIN Engineering Brief v1.4 §1.4 says conversation history
 * should NOT be stored in PostgreSQL ("Do not store conversation history
 * in PostgreSQL"). We are persisting it here as a deliberate deviation
 * agreed with product, because the deployment target (Vercel serverless)
 * has no shared in-memory store and no Redis is provisioned. Cold starts
 * would otherwise drop the conversation mid-flow.
 *
 * Rows are short-lived: TTL = CONVERSATION_TTL_SECONDS (default 30 min).
 * A periodic cleanup query in DiagnosticService deletes expired rows.
 */

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm'
import { jsonColumnType, timestampColumnType } from './column-types'

export interface StoredAgentMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Wall-clock timestamp (ISO) when this turn was appended. */
  ts: string
}

@Entity('intake_conversation_sessions')
export class IntakeConversationSession {
  @PrimaryGeneratedColumn('uuid')
  conversationId: string

  @Index('idx_intake_conv_session_token')
  @Column({ length: 512 })
  sessionToken: string

  @Column({ type: 'uuid', nullable: true })
  userId: string | null

  /**
   * Full role/content chat history. Bounded by trimming in
   * IntakeAgentService (target: <3000 tokens of context per brief §5).
   */
  @Column({ type: jsonColumnType, default: () => "'[]'" })
  history: StoredAgentMessage[]

  /** Latest extracted fields. Live snapshot, overwritten each turn. */
  @Column({ type: jsonColumnType, default: () => "'{}'" })
  collectedFields: Record<string, unknown>

  @Column({ type: 'int', default: 0 })
  turnCount: number

  @Column({ type: 'boolean', default: false })
  isComplete: boolean

  @Index('idx_intake_conv_expires_at')
  @Column({ type: timestampColumnType })
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
