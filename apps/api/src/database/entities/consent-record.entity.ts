import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'
import { timestampColumnType } from './column-types'

/**
 * Append-only consent log. Each grant or revoke per data type is a new row.
 * Never updated, never deleted (subject to DPDP right-to-erasure via cascade
 * delete of the parent user_profiles row).
 */
@Entity('consent_records')
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  consentId: string

  @Index()
  @Column()
  userId: string

  @Column({ type: 'varchar', length: 50 })
  dataType: string

  @Column()
  granted: boolean

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipHash: string

  @CreateDateColumn({ type: timestampColumnType })
  createdAt: Date
}
