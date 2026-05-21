/**
 * NomineeService — Module 7: Protection Vault
 *
 * DPDP Act 2023 compliance:
 *   - Only last 4 digits of Aadhaar stored (never full number)
 *   - WhatsApp/phone stored hashed in Phase 2
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Nominee } from '../../database/entities/nominee.entity'

export interface AddNomineeDto {
  name: string
  relationship: string
  mobile?: string
  whatsapp?: string
  email?: string
  aadhaarLast4?: string
  sharePercentage?: number
  accessLevel?: string
}

@Injectable()
export class NomineeService {
  constructor(
    @InjectRepository(Nominee)
    private readonly nomineeRepo: Repository<Nominee>,
  ) {}

  async addNominee(userId: string, dto: AddNomineeDto): Promise<Nominee> {
    // Validate: aadhaarLast4 must be exactly 4 digits if provided
    if (dto.aadhaarLast4 && !/^\d{4}$/.test(dto.aadhaarLast4)) {
      dto.aadhaarLast4 = undefined
    }
    const nominee = this.nomineeRepo.create({ ...dto, userId })
    return this.nomineeRepo.save(nominee)
  }

  async getNominees(userId: string): Promise<Nominee[]> {
    return this.nomineeRepo.find({ where: { userId }, order: { addedAt: 'DESC' } })
  }

  async updateNominee(userId: string, nomineeId: string, dto: Partial<AddNomineeDto>): Promise<Nominee> {
    const nominee = await this.nomineeRepo.findOne({ where: { nomineeId } })
    if (!nominee) throw new NotFoundException('Nominee not found')
    if (nominee.userId !== userId) throw new ForbiddenException('Access denied')
    Object.assign(nominee, dto)
    return this.nomineeRepo.save(nominee)
  }

  async deleteNominee(userId: string, nomineeId: string): Promise<{ deleted: boolean }> {
    const nominee = await this.nomineeRepo.findOne({ where: { nomineeId } })
    if (!nominee) throw new NotFoundException('Nominee not found')
    if (nominee.userId !== userId) throw new ForbiddenException('Access denied')
    await this.nomineeRepo.remove(nominee)
    return { deleted: true }
  }
}
