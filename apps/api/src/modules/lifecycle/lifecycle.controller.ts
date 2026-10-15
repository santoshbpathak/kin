import {
  Controller, Get, Post, Patch, Body, Query, Headers, Req, UseGuards, Logger,
  ForbiddenException, HttpCode, HttpStatus, type RawBodyRequest,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsBoolean, IsMobilePhone } from 'class-validator'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { NotificationPrefsService } from './notification-prefs.service'
import { WhatsAppService } from './whatsapp.service'
import { safeEqual, verifyMetaSignature } from './webhook-signature'

class UpdatePrefsDto {
  @IsOptional() @IsEnum(['whatsapp', 'sms', 'none']) primaryChannel?: 'whatsapp' | 'sms' | 'none'
  @IsOptional() @IsBoolean() smsEnabled?: boolean
  @IsOptional() @IsMobilePhone('en-IN') whatsappNumber?: string
  @IsOptional() @IsEnum(['weekly', 'fortnightly', 'monthly']) checkInFrequency?: 'weekly' | 'fortnightly' | 'monthly'
  @IsOptional() @IsBoolean() weeklyBrief?: boolean
  @IsOptional() @IsBoolean() streakReminders?: boolean
  @IsOptional() @IsBoolean() rescoreReminders?: boolean
}

class WhatsAppWebhookDto {
  @IsOptional() @IsString() object?: string
  @IsOptional() entry?: unknown[]
}

@ApiTags('lifecycle')
@Controller({ path: 'lifecycle', version: '1' })
export class LifecycleController {
  private readonly logger = new Logger(LifecycleController.name)
  private warnedUnsigned = false

  constructor(
    private readonly notifPrefsService: NotificationPrefsService,
    private readonly whatsappService: WhatsAppService,
    private readonly config: ConfigService,
  ) {}

  // ── Notification Preferences ──────────────────────────────────

  @Get('notifications/preferences')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get notification preferences for the authenticated user' })
  getPrefs(@CurrentUser() user: JwtPayload) {
    return this.notifPrefsService.getPrefs(user.sub)
  }

  @Patch('notifications/preferences')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePrefs(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePrefsDto) {
    return this.notifPrefsService.updatePrefs(user.sub, dto)
  }

  @Post('notifications/stop')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'STOP — immediately halt all KIN notifications (IRDAI CG-9 compliant, one tap)' })
  stopAll(@CurrentUser() user: JwtPayload) {
    return this.notifPrefsService.stopAllNotifications(user.sub)
  }

  @Post('notifications/start')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Re-activate notifications after STOP (requires explicit user action)' })
  reactivate(@CurrentUser() user: JwtPayload) {
    return this.notifPrefsService.reactivateNotifications(user.sub)
  }

  // ── WhatsApp Webhook ─────────────────────────────────────────
  // Unauthenticated by design (Meta calls it), but:
  //   GET  — verify-token handshake. Meta sends hub.mode / hub.challenge /
  //          hub.verify_token as QUERY parameters. No default token exists;
  //          an unset WHATSAPP_WEBHOOK_VERIFY_TOKEN disables the handshake.
  //   POST — every payload must carry a valid X-Hub-Signature-256 computed
  //          with WHATSAPP_APP_SECRET. Unsigned payloads are rejected in
  //          production; in other environments they are accepted once a
  //          warning has been logged (sandbox / local testing).

  @Public()
  @Get('whatsapp/webhook')
  @ApiOperation({ summary: 'WhatsApp Business API webhook verification (GET — Meta hub.challenge)' })
  verifyWebhook(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Query('hub.verify_token') verifyToken: string | undefined,
  ) {
    const expected = this.config.get<string>('whatsapp.webhookVerifyToken')
    if (!expected) {
      throw new ForbiddenException('WhatsApp webhook verification is not configured')
    }
    if (mode === 'subscribe' && safeEqual(verifyToken, expected) && typeof challenge === 'string') {
      this.logger.log('WhatsApp webhook verified successfully')
      return challenge   // NestJS returns plain string for GET
    }
    throw new ForbiddenException('WhatsApp webhook verification failed')
  }

  @Public()
  @Post('whatsapp/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp Business API inbound message webhook (POST)' })
  handleInbound(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: WhatsAppWebhookDto,
  ) {
    this.assertSignature(req, signature)

    // Parse inbound messages (STOP, SCORE, HELP, START)
    try {
      const entries = (body.entry as any[]) ?? []
      for (const entry of entries) {
        const changes = entry?.changes ?? []
        for (const change of changes) {
          const messages = change?.value?.messages ?? []
          for (const msg of messages) {
            if (msg.type === 'text') {
              const { command } = this.whatsappService.parseInboundMessage(msg.text?.body ?? '')
              const phone = msg.from as string
              // Log only the last 4 digits of the phone — DPDP boundary
              const masked = typeof phone === 'string' ? `******${phone.slice(-4)}` : 'unknown'
              this.logger.log(`[WhatsApp inbound] From: ${masked}, Command: ${command}`)
              // Phase 2: look up userId by phone, call notifPrefsService.stopAllNotifications(userId)
              // For STOP; for SCORE: fetch and send latest score via sendTemplate
            }
          }
        }
      }
    } catch (e) {
      this.logger.warn('WhatsApp webhook parse error', e)
    }
    return { status: 'ok' }
  }

  private assertSignature(req: RawBodyRequest<Request>, signature: string | undefined): void {
    const secret = this.config.get<string>('whatsapp.appSecret')
    const isProd = this.config.get<string>('nodeEnv') === 'production'
    if (!secret) {
      if (isProd) {
        throw new ForbiddenException('WhatsApp webhook signature verification is not configured')
      }
      if (!this.warnedUnsigned) {
        this.warnedUnsigned = true
        this.logger.warn(
          'WHATSAPP_APP_SECRET is not set — accepting unsigned WhatsApp webhooks (non-production only)',
        )
      }
      return
    }
    // Prefer the raw bytes captured by NestFactory({ rawBody: true }). Some
    // serverless runtimes pre-parse JSON before Nest sees the stream; in that
    // case we fall back to re-serialising the parsed body, which matches only
    // when the sender used compact JSON. Verify this path on your platform.
    const raw: Buffer | string | undefined = req.rawBody ?? (req.body ? JSON.stringify(req.body) : undefined)
    if (!verifyMetaSignature(raw, signature, secret)) {
      throw new ForbiddenException('Invalid WhatsApp webhook signature')
    }
  }
}
