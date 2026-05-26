import { Controller, Get, Post, Patch, Body, Headers, UseGuards, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator'
import { AuthGuard } from '@nestjs/passport'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { NotificationPrefsService } from './notification-prefs.service'
import { WhatsAppService } from './whatsapp.service'

class UpdatePrefsDto {
  @IsOptional() @IsEnum(['whatsapp', 'sms', 'none']) primaryChannel?: 'whatsapp' | 'sms' | 'none'
  @IsOptional() @IsBoolean() smsEnabled?: boolean
  @IsOptional() @IsString() whatsappNumber?: string
  @IsOptional() @IsEnum(['weekly', 'fortnightly', 'monthly']) checkInFrequency?: 'weekly' | 'fortnightly' | 'monthly'
  @IsOptional() @IsBoolean() weeklyBrief?: boolean
  @IsOptional() @IsBoolean() streakReminders?: boolean
  @IsOptional() @IsBoolean() rescoreReminders?: boolean
}

class WhatsAppWebhookDto {
  @IsOptional() object?: string
  @IsOptional() entry?: unknown[]
}

@ApiTags('lifecycle')
@Controller({ path: 'lifecycle', version: '1' })
export class LifecycleController {
  private readonly logger = new Logger(LifecycleController.name)

  constructor(
    private readonly notifPrefsService: NotificationPrefsService,
    private readonly whatsappService: WhatsAppService,
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

  // ── WhatsApp Webhook (no auth — verified by Meta challenge) ───

  @Public()
  @Get('whatsapp/webhook')
  @ApiOperation({ summary: 'WhatsApp Business API webhook verification (GET — Meta hub.challenge)' })
  verifyWebhook(
    @Headers('hub.mode') mode: string,
    @Headers('hub.challenge') challenge: string,
    @Headers('hub.verify_token') verifyToken: string,
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN ?? 'kin_webhook_verify_2026'
    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('WhatsApp webhook verified successfully')
      return challenge   // NestJS returns plain string for GET
    }
    return { status: 'forbidden' }
  }

  @Public()
  @Post('whatsapp/webhook')
  @ApiOperation({ summary: 'WhatsApp Business API inbound message webhook (POST)' })
  handleInbound(@Body() body: WhatsAppWebhookDto) {
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
}
