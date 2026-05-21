import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm'

@Entity('nominees')
export class Nominee {
  @PrimaryGeneratedColumn('uuid')
  nomineeId: string

  @Column()
  userId: string

  @Column()
  name: string

  @Column()
  relationship: string

  @Column({ nullable: true })
  mobile: string   // stored hashed in Phase 2

  @Column({ nullable: true })
  whatsapp: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  aadhaarLast4: string   // DPDP: last 4 digits only

  @Column({ type: 'int', default: 100 })
  sharePercentage: number

  @Column({ default: 'policies_only' })
  accessLevel: string

  @Column({ default: false })
  verified: boolean

  @CreateDateColumn()
  addedAt: Date
}
