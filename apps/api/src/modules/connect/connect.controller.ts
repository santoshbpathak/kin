/**
 * ConnectController — REST surface for the advisory connect layer.
 *
 * Legacy endpoints (advisor booking + product partner bridge) are
 * preserved unchanged from MVP1. New endpoints under /ai/*, /upgrade,
 * /downgrade, and /advisor-availability implement the three-tier
 * advisory architecture (Module B, Brief §2.7).
 *
 * The Guide and Bridge tabs in the frontend remain wired to the legacy
 * endpoints; the new Pilot replacement (AdvisoryConnect React component)
 * uses the /ai/* endpoints.
 */

import {
  Controller, Get, Post, Delete, Body, Param, Query, NotFoundException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import {
  IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { ConnectService } from './connect.service'
import { AiAdvisorService } from './advisory/ai-advisor.service'
import { TierSessionService } from './advisory/tier-session.service'
import type { KinReportSnapshot } from '../../database/entities/advisor-session.entity'

// ── DTOs ───────────────────────────────────────────────────────────

class BookSlotDto {
  @IsString() slotId: string
  @IsString() queryType: string
  @IsOptional() @IsString() notes?: string
}

class InitiatePurchaseDto {
  @IsString() partnerId: string
  @IsOptional() @IsString() recommendationId?: string
}

class KinReportRecommendationDto {
  @IsString() type: string
  @IsString() title: string
  @IsString() basisText: string
}

class KinReportDto implements KinReportSnapshot {
  @IsNumber() compositeScore!: number
  @IsNumber() lifeSubScore!: number
  @IsNumber() healthSubScore!: number
  @IsNumber() incomeSubScore!: number
  @IsString() lifeGapSummary!: string
  @IsString() healthGapSummary!: string
  @IsString() incomeGapSummary!: string
  @IsString() topRecommendation!: string
  @ValidateNested({ each: true })
  @Type(() => KinReportRecommendationDto)
  recommendations!: KinReportRecommendationDto[]
  @IsArray() @IsString({ each: true }) hiddenCoverages!: string[]
  @IsArray() @IsString({ each: true }) estimatedFields!: string[]
  @IsArray() @IsString({ each: true }) unknownFields!: string[]
}

class StartAiSessionDto {
  @ValidateNested()
  @Type(() => KinReportDto)
  kinReport!: KinReportDto
}

class AiMessageDto {
  @IsUUID() advisorSessionId!: string
  @IsString() @Length(1, 4000) message!: string
}

class UpgradeDto {
  @IsUUID() advisorSessionId!: string
  @IsIn([2, 3]) targetTier!: 2 | 3
  @IsBoolean() transcriptConsent!: boolean
}

class DowngradeDto {
  @IsUUID() advisorSessionId!: string
  @IsIn([1, 2]) targetTier!: 1 | 2
}

// ── Controller ─────────────────────────────────────────────────────

@ApiTags('connect')
@ApiBearerAuth()
@Controller({ path: 'connect', version: '1' })
export class ConnectController {
  constructor(
    private readonly connectService: ConnectService,
    private readonly aiAdvisor: AiAdvisorService,
    private readonly tierSession: TierSessionService,
  ) {}

  // ── Tier 1 (KIN AI Advisor) ──────────────────────────────────

  @Post('ai/start')
  @ApiOperation({ summary: 'Start a Tier 1 KIN AI advisor session with KIN report context' })
  async startAi(@CurrentUser() user: JwtPayload, @Body() dto: StartAiSessionDto) {
    return this.aiAdvisor.startSession(
      user.sub,
      user.sessionToken ?? null,
      dto.kinReport,
    )
  }

  @Post('ai/message')
  @ApiOperation({ summary: 'Send a user message to the Tier 1 AI advisor' })
  async aiMessage(@CurrentUser() user: JwtPayload, @Body() dto: AiMessageDto) {
    return this.aiAdvisor.processMessage(dto.advisorSessionId, user.sub, dto.message)
  }

  @Get('ai/transcript/:advisorSessionId')
  @ApiOperation({ summary: 'Return the Tier 1 transcript (consent preview before upgrade)' })
  async aiTranscript(
    @CurrentUser() user: JwtPayload,
    @Param('advisorSessionId') advisorSessionId: string,
  ) {
    if (!advisorSessionId) throw new NotFoundException()
    return { transcript: await this.aiAdvisor.getTranscript(advisorSessionId, user.sub) }
  }

  // ── Tier transitions ─────────────────────────────────────────

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade an AI session to Tier 2 (human chat) or Tier 3 (call)' })
  async upgrade(@CurrentUser() user: JwtPayload, @Body() dto: UpgradeDto) {
    return this.tierSession.upgrade(dto.advisorSessionId, user.sub, dto.targetTier, dto.transcriptConsent)
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Return a session to a lower tier (user-initiated only)' })
  async downgrade(@CurrentUser() user: JwtPayload, @Body() dto: DowngradeDto) {
    return this.tierSession.downgrade(dto.advisorSessionId, user.sub, dto.targetTier)
  }

  @Get('advisor-availability')
  @ApiOperation({ summary: 'Lightweight Tier 2 availability check' })
  async advisorAvailability() {
    return this.tierSession.getAvailability()
  }

  // ── Legacy advisor booking endpoints (unchanged) ─────────────

  @Get('advisor/slots')
  @ApiOperation({ summary: 'Get available advisor time slots (Tier 3 booking)' })
  async getSlots() {
    return this.connectService.getAvailableSlots()
  }

  @Post('advisor/book')
  @ApiOperation({ summary: 'Book an advisor slot (15-min call) — Tier 3' })
  async bookSlot(@CurrentUser() user: JwtPayload, @Body() dto: BookSlotDto) {
    return this.connectService.bookSlot(user.sub, dto.slotId, dto.queryType, dto.notes)
  }

  @Get('advisor/bookings')
  @ApiOperation({ summary: "Get current user's advisor bookings" })
  async getUserBookings(@CurrentUser() user: JwtPayload) {
    return this.connectService.getUserBookings(user.sub)
  }

  @Delete('advisor/bookings/:bookingId')
  @ApiOperation({ summary: 'Cancel an advisor booking' })
  async cancelBooking(@CurrentUser() user: JwtPayload, @Param('bookingId') bookingId: string) {
    return this.connectService.cancelBooking(user.sub, bookingId)
  }

  // ── Legacy product bridge (unchanged) ────────────────────────

  @Get('partners')
  @ApiOperation({ summary: 'List product partners by category' })
  @ApiQuery({ name: 'category', required: false })
  getPartners(@Query('category') category?: string) {
    return this.connectService.getProductPartners(category)
  }

  @Post('purchase/initiate')
  @ApiOperation({ summary: 'Initiate secure purchase redirect to insurer partner' })
  initiatePurchase(@CurrentUser() user: JwtPayload, @Body() dto: InitiatePurchaseDto) {
    return this.connectService.initiatePurchase(user.sub, dto.partnerId, dto.recommendationId)
  }
}
