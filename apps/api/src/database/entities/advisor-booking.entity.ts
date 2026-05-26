import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'
import { timestampColumnType } from './column-types'

@Entity('advisor_bookings')
export class AdvisorBooking {
  @PrimaryGeneratedColumn('uuid')
  bookingId: string

  @Index()
  @Column()
  userId: string

  @Index()
  @Column({ type: 'varchar', length: 50 })
  slotId: string

  @Column({ type: timestampColumnType })
  datetime: Date

  @Column({ type: 'varchar', length: 20, default: 'confirmed' })
  status: 'pending' | 'confirmed' | 'cancelled'

  @Column({ type: 'varchar', length: 100 })
  queryType: string

  @Column({ type: 'text', nullable: true })
  notes: string

  @CreateDateColumn({ type: timestampColumnType })
  bookedAt: Date
}
