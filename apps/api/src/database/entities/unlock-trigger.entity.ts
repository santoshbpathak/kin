import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'

export type TriggerType = 'death_cert' | 'deadman' | 'trusted_contact' | 'emergency'

@Entity('unlock_triggers')
export class UnlockTrigger {
  @PrimaryGeneratedColumn('uuid')
  triggerId: string

  @Column()
  userId: string

  @Column()
  triggerType: TriggerType

  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'resolved'

  @Column({ nullable: true })
  activatedAt: Date

  @Column({ nullable: true })
  resolvedAt: Date

  @Column({ nullable: true })
  unlockToken: string   // used for nominee view URL

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
