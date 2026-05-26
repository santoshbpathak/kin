/**
 * ConsentService — Module 5 (DPDP Act 2023)
 *
 * Granular consent lifecycle, append-only.
 * Each grant or revoke per data type is persisted as a new consent_records row.
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfile } from '../../database/entities/user-profile.entity'
import { ConsentRecord } from '../../database/entities/consent-record.entity'

export type ConsentDataType = 'diagnostic_data' | 'location' | 'contact' | 'vault_documents'

export interface ConsentRecordView {
  consentId: string
  userId: string
  dataType: ConsentDataType
  granted: boolean
  timestamp: string
}

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
    @InjectRepository(ConsentRecord)
    private readonly consentRepo: Repository<ConsentRecord>,
  ) {}

  async grantConsent(userId: string, dataTypes: ConsentDataType[]): Promise<ConsentRecordView[]> {
    const rows = dataTypes.map(dt =>
      this.consentRepo.create({ userId, dataType: dt, granted: true }),
    )
    const saved = await this.consentRepo.save(rows)
    if (dataTypes.includes('contact')) {
      await this.userRepo.update(userId, { consentedPii: true })
    }
    return saved.map(toView)
  }

  async revokeConsent(userId: string, dataTypes: ConsentDataType[]): Promise<ConsentRecordView[]> {
    const rows = dataTypes.map(dt =>
      this.consentRepo.create({ userId, dataType: dt, granted: false }),
    )
    const saved = await this.consentRepo.save(rows)
    if (dataTypes.includes('contact')) {
      await this.userRepo.update(userId, { consentedPii: false })
    }
    return saved.map(toView)
  }

  async getConsentHistory(userId: string): Promise<ConsentRecordView[]> {
    const rows = await this.consentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    })
    return rows.map(toView)
  }
}

function toView(r: ConsentRecord): ConsentRecordView {
  return {
    consentId: r.consentId,
    userId: r.userId,
    dataType: r.dataType as ConsentDataType,
    granted: r.granted,
    timestamp: r.createdAt.toISOString(),
  }
}
