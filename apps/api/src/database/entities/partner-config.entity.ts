import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'

@Entity('partner_configs')
export class PartnerConfig {
  @PrimaryGeneratedColumn('uuid')
  partnerId: string

  @Column({ unique: true })
  partnerKey: string   // used in ?partner_id= URL param

  @Column()
  name: string

  @Column('jsonb', { nullable: true })
  brandTokens: {
    primaryColor: string
    accentColor: string
    logoUrl: string
    fontFamily: string
    partnerName: string
  }

  @Column('simple-array', { nullable: true })
  embedOrigins: string[]

  @Column('jsonb', { nullable: true })
  ssoConfig: Record<string, unknown>

  @Column({ nullable: true })
  insurerIrdaiRegNo: string

  @Column({ nullable: true })
  insurerFullName: string

  @Column({ nullable: true })
  logoLicenseRef: string

  @Column({ default: true })
  active: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
