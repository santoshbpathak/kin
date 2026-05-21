/**
 * ConsentService — Module 5 (DPDP Act 2023)
 *
 * Granular consent lifecycle:
 *   - One toggle per data type (not blanket accept)
 *   - Revocation API
 *   - Immutable consent log (append-only)
 *
 * Phase 2: stored in DB with full audit trail.
 * MVP1: in-memory map, persisted to UserProfile.consentedPii.
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfile } from '../../database/entities/user-profile.entity'

export type ConsentDataType = 'diagnostic_data' | 'location' | 'contact' | 'vault_documents'

export interface ConsentRecord {
  userId: string
  dataType: ConsentDataType
  granted: boolean
  timestamp: string
  ipHash?: string   // hashed, not stored raw — DPDP Art. 9
}

@Injectable()
export class ConsentService {
  private readonly consentLog: ConsentRecord[] = []  // Phase 2: replace with DB table

  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
  ) {}

  async grantConsent(userId: string, dataTypes: ConsentDataType[]): Promise<ConsentRecord[]> {
    const records: ConsentRecord[] = dataTypes.map(dt => ({
      userId,
      dataType: dt,
      granted: true,
      timestamp: new Date().toISOString(),
    }))
    this.consentLog.push(...records)

    // Update consentedPii flag if contact is consented
    if (dataTypes.includes('contact')) {
      await this.userRepo.update(userId, { consentedPii: true })
    }
    return records
  }

  async revokeConsent(userId: string, dataTypes: ConsentDataType[]): Promise<ConsentRecord[]> {
    const records: ConsentRecord[] = dataTypes.map(dt => ({
      userId,
      dataType: dt,
      granted: false,
      timestamp: new Date().toISOString(),
    }))
    this.consentLog.push(...records)

    if (dataTypes.includes('contact')) {
      await this.userRepo.update(userId, { consentedPii: false })
    }
    return records
  }

  getConsentHistory(userId: string): ConsentRecord[] {
    return this.consentLog.filter(r => r.userId === userId)
  }
}
