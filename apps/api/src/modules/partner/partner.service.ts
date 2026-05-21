/**
 * PartnerService — Module 1
 *
 * Manages partner sessions and brand token retrieval.
 * Partner layer is a hard boundary — no PII crosses it.
 * Session tokens are UUIDs with no decodable user identity.
 */
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { PartnerConfig } from '../../database/entities/partner-config.entity'

export interface BrandTokens {
  primaryColor: string
  accentColor: string
  logoUrl: string
  fontFamily: string
  partnerName: string
}

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(PartnerConfig)
    private readonly partnerRepo: Repository<PartnerConfig>,
  ) {}

  async createSession(partnerKey: string, _userToken: string): Promise<{ sessionToken: string; partnerId: string }> {
    const partner = await this.partnerRepo.findOne({ where: { partnerKey, active: true } })
    if (!partner) throw new UnauthorizedException('Unknown or inactive partner')
    // Session token is a UUID — no decodable user identity (partner layer boundary)
    return { sessionToken: uuidv4(), partnerId: partner.partnerId }
  }

  async getBrandTokens(partnerKey: string): Promise<BrandTokens> {
    const partner = await this.partnerRepo.findOne({ where: { partnerKey, active: true } })
    if (!partner) throw new NotFoundException('Partner not found')
    return partner.brandTokens ?? {
      primaryColor: '#2D5016',
      accentColor: '#4A7C59',
      logoUrl: '',
      fontFamily: 'Inter',
      partnerName: 'KIN',
    }
  }

  async findByKey(partnerKey: string): Promise<PartnerConfig | null> {
    return this.partnerRepo.findOne({ where: { partnerKey, active: true } })
  }
}
