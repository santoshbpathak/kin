import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { jsonColumnType, timestampColumnType } from './column-types'

export type IncomeBand = 'lt3l' | '3l_5l' | '5l_10l' | '10l_20l' | '20l_50l' | 'gt50l'
export type CityTier = 'T1' | 'T2' | 'T3'
export type LifeStage = 'single' | 'married_no_kids' | 'married_with_kids' | 'parent_caregiver'

/**
 * Field-level confidence values produced by the conversational diagnostic
 * agent. Stored inside the `confidenceMap` JSONB column.
 *
 * - confirmed: user stated this explicitly
 * - estimated: derived (e.g., employer cover defaulted to 3x CTC) with user agreement
 * - unknown:   user skipped or never answered
 */
export type FieldConfidence = 'confirmed' | 'estimated' | 'unknown'

export interface DependantDetail {
  type: 'spouse' | 'child' | 'parent' | 'other'
  count: number
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  userId: string

  @Column({ unique: true })
  sessionToken: string

  // ── Legacy columns (kept so score / recommendation engines keep working) ─
  @Column({ nullable: true })
  incomeBand: IncomeBand

  @Column({ nullable: true })
  cityTier: CityTier

  @Column({ nullable: true })
  dependantsCount: number

  @Column({ nullable: true })
  lifeStage: LifeStage

  @Column({ nullable: true })
  monthlyObligationsBand: string

  @Column({ default: false })
  consentedPii: boolean

  @Column({ nullable: true })
  whatsappNumber: string

  @Column({ nullable: true })
  googleId: string

  // ── New columns added by Module A (v1.4 conversational diagnostic) ──────
  // Brief §1.6. All values in INR. Nullable until the conversation collects
  // them. The conversation agent + profile-mapper populate these alongside
  // the legacy band columns so unchanged downstream modules keep working.

  @Column({ type: 'bigint', nullable: true })
  annualIncomeExact: number | null

  @Column({ type: jsonColumnType, nullable: true })
  dependantsDetail: DependantDetail[] | null

  @Column({ type: 'bigint', nullable: true })
  personalLifeCover: number | null

  @Column({ type: 'bigint', nullable: true })
  employerGroupTerm: number | null

  @Column({ type: 'bigint', nullable: true })
  personalHealthCover: number | null

  @Column({ type: 'boolean', nullable: true })
  personalHealthIsFloater: boolean | null

  @Column({ type: 'bigint', nullable: true })
  employerMediclaim: number | null

  @Column({ type: 'bigint', nullable: true })
  ciCover: number | null

  @Column({ type: 'bigint', nullable: true })
  incomeProtectionCover: number | null

  @Column({ type: jsonColumnType, nullable: true })
  confidenceMap: Partial<Record<string, FieldConfidence>> | null

  @Column({ type: timestampColumnType, nullable: true })
  conversationCompletedAt: Date | null

  @Column({ type: 'int', default: 0 })
  groupBFieldsCollected: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  lastActiveAt: Date
}
