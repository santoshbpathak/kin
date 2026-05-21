import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { UserProfile } from './user-profile.entity'

@Entity('protection_scores')
export class ProtectionScore {
  @PrimaryGeneratedColumn('uuid')
  scoreId: string

  @Column()
  userId: string

  @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserProfile

  @Column('decimal', { precision: 5, scale: 2 })
  compositeScore: number

  @Column('decimal', { precision: 5, scale: 2 })
  lifeSubScore: number

  @Column('decimal', { precision: 5, scale: 2 })
  healthSubScore: number

  @Column('decimal', { precision: 5, scale: 2 })
  incomeSubScore: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  hiddenCoverageTotal: number

  @Column({ default: 'v1.0.0' })
  ruleVersion: string

  @Column('jsonb', { nullable: true })
  inputsSnapshot: Record<string, unknown>

  @CreateDateColumn()
  calculatedAt: Date
}
