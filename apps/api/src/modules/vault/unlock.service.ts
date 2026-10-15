/**
 * UnlockService — Module 7: Protection Vault
 *
 * Manages 4 unlock trigger types:
 *   1. death_cert   — nominee uploads death certificate → manual review → unlock in 24h
 *   2. deadman      — cron: last_active_at > 18 months + 3 WhatsApp pings → auto-trigger
 *   3. trusted_contact — pre-designated trusted person initiates
 *   4. emergency    — user self-activates → limited preview (policy numbers + insurer contacts only)
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { UnlockTrigger, TriggerType } from '../../database/entities/unlock-trigger.entity'

@Injectable()
export class UnlockService {
  constructor(
    @InjectRepository(UnlockTrigger)
    private readonly triggerRepo: Repository<UnlockTrigger>,
  ) {}

  async initiateUnlock(userId: string, triggerType: TriggerType): Promise<UnlockTrigger> {
    const trigger = this.triggerRepo.create({
      userId,
      triggerType,
      status: 'pending',
      activatedAt: new Date(),
      unlockToken: randomUUID(),
    })
    return this.triggerRepo.save(trigger)
  }

  async getUnlockStatus(userId: string): Promise<UnlockTrigger[]> {
    return this.triggerRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })
  }

  async resolveUnlock(triggerId: string): Promise<UnlockTrigger> {
    const trigger = await this.triggerRepo.findOne({ where: { triggerId } })
    if (!trigger) throw new NotFoundException('Unlock trigger not found')
    trigger.status = 'resolved'
    trigger.resolvedAt = new Date()
    return this.triggerRepo.save(trigger)
  }

  async getNomineeView(unlockToken: string): Promise<{ token: string; message: string }> {
    const trigger = await this.triggerRepo.findOne({ where: { unlockToken } })
    if (!trigger || trigger.status === 'pending') {
      return { token: unlockToken, message: 'Unlock not yet active. Contact KIN support.' }
    }
    return { token: unlockToken, message: 'Vault access granted. Nominee view available.' }
  }
}
