/**
 * RecommendationAudit — IMMUTABLE once written.
 * No UPDATE or DELETE ever permitted on this table.
 * 5-year retention per IRDAI suitability requirements.
 */
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeUpdate, BeforeRemove,
} from 'typeorm'

export type RecommendationType =
  | 'term_life'
  | 'health_topup'
  | 'personal_accident'
  | 'pmsby'
  | 'pmjjby'
  | 'edli_claim'
  | 'critical_illness'
  | 'income_protection'

@Entity('recommendation_audits')
export class RecommendationAudit {
  @PrimaryGeneratedColumn('uuid')
  auditId: string

  @Column()
  scoreId: string

  @Column()
  userId: string

  @Column()
  recommendationType: RecommendationType

  @Column({ nullable: true })
  crn: string   // Content Reference Number (CG-8)

  @Column('text')
  basisText: string

  @Column('jsonb')
  inputsSnapshot: Record<string, unknown>   // PII hashed

  @Column({ nullable: true })
  irdaiRuleReference: string

  @Column({ default: 'v1.0.0' })
  ruleVersion: string

  @CreateDateColumn()
  createdAt: Date

  // ── Immutability guards ───────────────────────────────────────
  @BeforeUpdate()
  preventUpdate() {
    throw new Error('RecommendationAudit records are immutable — updates forbidden')
  }

  @BeforeRemove()
  preventDelete() {
    throw new Error('RecommendationAudit records are immutable — deletions forbidden')
  }
}
