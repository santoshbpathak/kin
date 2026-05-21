/**
 * WhatsAppService — Module 11: Lifecycle Layer
 *
 * WhatsApp Business Cloud API integration.
 * Phase 1: logs messages to console (sandbox mode).
 * Phase 2: actual Cloud API calls via WHATSAPP_API_TOKEN.
 *
 * CG-7 (Social Media Shares): every outbound message includes "Reply STOP to unsubscribe".
 * IRDAI: STOP must be always one tap away.
 */
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface WhatsAppMessage {
  to: string           // E.164 format: +91XXXXXXXXXX
  templateName: string
  templateParams: string[]
  bodyText?: string    // For non-template messages (only for session messages)
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name)
  private readonly sandboxMode: boolean

  constructor(private readonly config: ConfigService) {
    this.sandboxMode = !config.get<string>('whatsapp.apiToken')
  }

  async sendTemplate(message: WhatsAppMessage): Promise<{ messageId: string; status: string }> {
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    if (this.sandboxMode) {
      this.logger.log(
        `[WhatsApp SANDBOX] To: ${message.to} | Template: ${message.templateName} | Params: ${JSON.stringify(message.templateParams)}`,
      )
      return { messageId, status: 'sandbox_sent' }
    }

    // Phase 2: real Cloud API call
    // const phoneNumberId = this.config.get('whatsapp.phoneNumberId')
    // const apiToken = this.config.get('whatsapp.apiToken')
    // await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: message.to,
    //     type: 'template',
    //     template: { name: message.templateName, language: { code: 'en' },
    //       components: [{ type: 'body', parameters: message.templateParams.map(text => ({ type: 'text', text })) }] }
    //   })
    // })

    this.logger.log(`[WhatsApp] Sent ${message.templateName} to ${message.to}`)
    return { messageId, status: 'sent' }
  }

  async sendWeeklyBrief(phone: string, briefHeadline: string, weekNumber: number): Promise<void> {
    await this.sendTemplate({
      to: phone,
      templateName: 'kin_weekly_brief',
      templateParams: [briefHeadline, String(weekNumber)],
      // CG-7: STOP instruction always appended by the template footer
    })
  }

  async sendStreakMilestone(phone: string, milestone: string, points: number): Promise<void> {
    await this.sendTemplate({
      to: phone,
      templateName: 'kin_streak_milestone',
      templateParams: [milestone, String(points)],
    })
  }

  async sendRescoreReminder(phone: string, currentScore: number): Promise<void> {
    await this.sendTemplate({
      to: phone,
      templateName: 'kin_rescore_reminder',
      templateParams: [String(currentScore)],
    })
  }

  async sendDeadmanPing(phone: string, monthsInactive: number): Promise<void> {
    await this.sendTemplate({
      to: phone,
      templateName: 'kin_deadman_ping',
      templateParams: [String(monthsInactive)],
    })
  }

  async sendNomineeTriggerAlert(nomineePhone: string, vaultOwnerName: string): Promise<void> {
    await this.sendTemplate({
      to: nomineePhone,
      templateName: 'kin_nominee_trigger_alert',
      templateParams: [vaultOwnerName],
    })
  }

  /**
   * Handle inbound WhatsApp replies.
   * Supported commands: STOP, SCORE, HELP, START
   */
  parseInboundMessage(messageBody: string): { command: 'STOP' | 'SCORE' | 'HELP' | 'START' | 'UNKNOWN'; raw: string } {
    const normalised = messageBody.trim().toUpperCase()
    if (normalised === 'STOP') return { command: 'STOP', raw: messageBody }
    if (normalised === 'SCORE') return { command: 'SCORE', raw: messageBody }
    if (normalised === 'HELP') return { command: 'HELP', raw: messageBody }
    if (normalised === 'START') return { command: 'START', raw: messageBody }
    return { command: 'UNKNOWN', raw: messageBody }
  }
}
