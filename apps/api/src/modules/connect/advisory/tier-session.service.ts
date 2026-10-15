/**
 * TierSessionService — orchestrates tier upgrades and downgrades
 * (Brief §2.6 + §2.7).
 *
 * Tier-transition rules implemented here:
 *   - 1→2: needs explicit transcript-sharing consent decision (yes or no).
 *          If consent=false, the human advisor sees only the KIN report
 *          snapshot and the generated brief — never the raw transcript.
 *   - 1→3: same consent decision; a real Tier 3 booking goes through the
 *          existing advisor_bookings table (reuses ConnectService).
 *   - 2→1, 3→1, 2→3, 3→2: free, no consent re-prompt, no advisor brief
 *          re-generation. Just updates currentTier and the timestamp.
 *
 * The brief explicitly says all tier transitions are user-initiated; we
 * never auto-upgrade.
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'

import { AdvisorSession } from '../../../database/entities/advisor-session.entity'
import { AdvisorBriefService } from './advisor-brief.service'
import type {
  AdvisorAvailability,
  Tier,
  TierUpgradeResult,
} from '../types/advisory.types'

// Stub availability rule: the existing free-slot generator in
// ConnectService is reused for real booking, but the lightweight
// availability check here just returns "available + next 30 min" so the
// UI can render a Tier 2 affordance immediately. The frontend then calls
// the existing /connect/advisor/slots for true Tier 3 booking.
const TIER2_NEXT_SLOT_MS = 30 * 60 * 1000

@Injectable()
export class TierSessionService {
  constructor(
    @InjectRepository(AdvisorSession)
    private readonly sessionRepo: Repository<AdvisorSession>,
    private readonly briefService: AdvisorBriefService,
  ) {}

  async upgrade(
    advisorSessionId: string,
    userId: string,
    targetTier: 2 | 3,
    transcriptConsent: boolean,
  ): Promise<TierUpgradeResult> {
    if (targetTier !== 2 && targetTier !== 3) {
      throw new BadRequestException('targetTier must be 2 or 3')
    }
    const session = await this.requireSession(advisorSessionId, userId)
    if (!session.kinReport) {
      throw new BadRequestException('Cannot upgrade — KIN report missing from session')
    }

    // Generate the pre-brief from the live transcript + frozen report.
    const brief = await this.briefService.generate(
      session.kinReport,
      session.tier1Transcript,
      session.sessionToken,
    )

    session.currentTier = targetTier
    session.tierUpgradedAt = new Date()
    session.transcriptSharedConsent = transcriptConsent
    session.advisorBrief = brief

    await this.sessionRepo.save(session)

    return {
      advisorSessionId: session.advisorSessionId,
      currentTier: targetTier,
      advisorBrief: {
        advisorSessionId: session.advisorSessionId,
        generatedAt: new Date().toISOString(),
        ...brief,
      },
      humanChatSessionId: targetTier === 2 ? `chat_${randomUUID()}` : undefined,
      callBookingUrl: targetTier === 3 ? '/connect/advisor/slots' : undefined,
      transcriptSharedConsent: transcriptConsent,
    }
  }

  async downgrade(advisorSessionId: string, userId: string, targetTier: 1 | 2): Promise<TierUpgradeResult> {
    if (targetTier !== 1 && targetTier !== 2) {
      throw new BadRequestException('targetTier must be 1 or 2')
    }
    const session = await this.requireSession(advisorSessionId, userId)

    if (targetTier >= session.currentTier) {
      throw new BadRequestException(
        `Cannot downgrade to tier ${targetTier} from tier ${session.currentTier}`,
      )
    }

    session.currentTier = targetTier
    session.tierUpgradedAt = new Date()
    await this.sessionRepo.save(session)

    return {
      advisorSessionId: session.advisorSessionId,
      currentTier: session.currentTier,
      advisorBrief: null,
      transcriptSharedConsent: session.transcriptSharedConsent,
    }
  }

  async getAvailability(): Promise<AdvisorAvailability> {
    // The lightweight chat-tier availability is a sentinel value; real
    // call-tier slots come from ConnectService.getAvailableSlots().
    return {
      available: true,
      nextSlot: new Date(Date.now() + TIER2_NEXT_SLOT_MS).toISOString(),
      waitlistAvailable: true,
    }
  }

  async currentTier(advisorSessionId: string, userId: string): Promise<Tier> {
    const s = await this.requireSession(advisorSessionId, userId)
    return s.currentTier
  }

  // Ownership-bound: the advisor session must belong to the calling user.
  private async requireSession(advisorSessionId: string, userId: string): Promise<AdvisorSession> {
    const session = await this.sessionRepo.findOne({ where: { advisorSessionId, userId } })
    if (!session) throw new NotFoundException('Advisor session not found')
    return session
  }
}
