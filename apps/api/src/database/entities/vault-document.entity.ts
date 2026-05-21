import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'

export type DocumentType =
  | 'term_life'
  | 'health'
  | 'vehicle'
  | 'home'
  | 'personal_accident'
  | 'travel'
  | 'critical_illness'
  | 'other'

export type NomineeAccessLevel = 'full' | 'policies_only' | 'emergency_only'

@Entity('vault_documents')
export class VaultDocument {
  @PrimaryGeneratedColumn('uuid')
  docId: string

  @Column()
  userId: string

  @Column()
  docType: DocumentType

  @Column({ nullable: true })
  insurerName: string

  @Column({ nullable: true })
  policyNumber: string

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  sumAssured: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  annualPremium: number

  @Column({ nullable: true })
  renewalDate: Date

  @Column({ nullable: true })
  s3Key: string    // encrypted, never exposed directly via API

  @Column({ nullable: true })
  fileName: string

  @Column({ nullable: true })
  nomineeId: string

  @Column({ default: 'policies_only' })
  nomineeAccessLevel: NomineeAccessLevel

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  uploadedAt: Date

  @UpdateDateColumn()
  lastVerifiedAt: Date
}
