import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'

export type IncomeBand = 'lt3l' | '3l_5l' | '5l_10l' | '10l_20l' | '20l_50l' | 'gt50l'
export type CityTier = 'T1' | 'T2' | 'T3'
export type LifeStage = 'single' | 'married_no_kids' | 'married_with_kids' | 'parent_caregiver'

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  userId: string

  @Column({ unique: true })
  sessionToken: string

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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  lastActiveAt: Date
}
