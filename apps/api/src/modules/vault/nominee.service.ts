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

/** The only nominees columns a client may set or change. */
export const UPDATABLE_NOMINEE_FIELDS = [
  'name', 'relationship', 'mobile', 'whatsapp', 'email', 'aadhaarLast4', 'sharePercentage', 'accessLevel',
] as const

export function pickUpdatableNomineeFields(dto: Partial<AddNomineeDto>): Partial<AddNomineeDto> {
  const out: Record<string, unknown> = {}
  for (const key of UPDATABLE_NOMINEE_FIELDS) {
    const value = (dto as Record<string, unknown>)[key]
    if (value !== undefined) out[key] = value
  }
  return out as Partial<AddNomineeDto>
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
    const nominee = this.nomineeRepo.create({ ...pickUpdatableNomineeFields(dto), name: dto.name, relationship: dto.relationship, userId })
    return this.nomineeRepo.save(nominee)
  }

  async getNominees(userId: string): Promise<Nominee[]> {
    return this.nomineeRepo.find({ where: { userId }, order: { addedAt: 'DESC' } })
  }

  async updateNominee(userId: string, nomineeId: string, dto: Partial<AddNomineeDto>): Promise<Nominee> {
    const nominee = await this.nomineeRepo.findOne({ where: { nomineeId } })
    if (!nominee) throw new NotFoundException('Nominee not found')
    if (nominee.userId !== userId) throw new ForbiddenException('Access denied')
    const patch = pickUpdatableNomineeFields(dto)
    if (patch.aadhaarLast4 && !/^\d{4}$/.test(patch.aadhaarLast4)) {
      patch.aadhaarLast4 = undefined
    }
    // Whitelisted copy only — userId / nomineeId are never client-assignable.
    Object.assign(nominee, patch)
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
