import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm'
import { timestampColumnType } from './column-types'

/**
 * Persisted OTP store — required for serverless safety. Each cold-start of a
 * Vercel function gets a fresh process, so an in-memory Map cannot survive.
 *
 * OTPs are stored hashed (sha256) so a DB leak does not expose live codes.
 * Rows are short-lived (5 min TTL); auth.service.sweepExpiredOtps clears them.
 */
@Entity('otp_requests')
export class OtpRequest {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  phone: string

  @Column({ type: 'varchar', length: 255 })
  otpHash: string

  @Column({ type: timestampColumnType })
  expiresAt: Date

  @CreateDateColumn({ type: timestampColumnType })
  createdAt: Date
}
