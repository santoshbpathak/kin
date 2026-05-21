/**
 * AuthService — Module 2
 *
 * Anonymous session → optionally authenticated session.
 * consentedPii: false by default — NEVER flipped without explicit user action.
 *
 * Flows:
 *   1. Anonymous: POST /auth/session → UUID session token, no PII stored
 *   2. WhatsApp OTP: POST /auth/whatsapp/otp → POST /auth/whatsapp/verify
 *   3. Google OAuth: POST /auth/google/callback
 *   4. Session upgrade: when user consents, session linked to identity
 */
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { UserProfile } from '../../database/entities/user-profile.entity'
import type { JwtPayload } from '../../common/decorators/current-user.decorator'

@Injectable()
export class AuthService {
  // In-memory OTP store for MVP1 (Phase 2: Redis)
  private readonly otpStore = new Map<string, { otp: string; expiry: number }>()

  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Anonymous session ─────────────────────────────────────────
  async createAnonymousSession(): Promise<{ sessionToken: string; token: string }> {
    const sessionToken = uuidv4()
    const user = this.userRepo.create({ sessionToken, consentedPii: false })
    await this.userRepo.save(user)
    const token = this.signToken(user.userId, sessionToken, false, 'standard')
    return { sessionToken, token }
  }

  // ── WhatsApp OTP ──────────────────────────────────────────────
  async sendWhatsAppOtp(mobile: string): Promise<{ sent: boolean }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    this.otpStore.set(mobile, { otp, expiry: Date.now() + 5 * 60 * 1000 })
    // Phase 2: send via WhatsApp Business Cloud API
    console.log(`[DEV] OTP for ${mobile}: ${otp}`)
    return { sent: true }
  }

  async verifyWhatsAppOtp(mobile: string, otp: string, sessionToken: string): Promise<{ token: string; upgraded: boolean }> {
    const stored = this.otpStore.get(mobile)
    if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
      throw new UnauthorizedException('Invalid or expired OTP')
    }
    this.otpStore.delete(mobile)

    // Find or create user by mobile
    let user = await this.userRepo.findOne({ where: { whatsappNumber: mobile } })
    if (!user) {
      // Upgrade anonymous session
      const existing = await this.userRepo.findOne({ where: { sessionToken } })
      if (existing) {
        existing.whatsappNumber = mobile
        existing.consentedPii = true
        user = await this.userRepo.save(existing)
      } else {
        user = await this.userRepo.save(
          this.userRepo.create({ sessionToken: uuidv4(), whatsappNumber: mobile, consentedPii: true }),
        )
      }
    }

    const token = this.signToken(user.userId, user.sessionToken, true, 'standard')
    return { token, upgraded: true }
  }

  // ── Vault token (elevated scope) ──────────────────────────────
  async issueVaultToken(userId: string): Promise<{ vaultToken: string }> {
    const vaultToken = this.jwtService.sign(
      { sub: userId, scope: 'vault' },
      {
        secret: this.configService.get<string>('auth.vaultJwtSecret'),
        expiresIn: this.configService.get<string>('auth.vaultJwtExpiry'),
      },
    )
    return { vaultToken }
  }

  // ── Consent upgrade ───────────────────────────────────────────
  async upgradeConsent(userId: string, dataTypes: string[]): Promise<{ upgraded: boolean; consentedTypes: string[] }> {
    await this.userRepo.update(userId, { consentedPii: true })
    return { upgraded: true, consentedTypes: dataTypes }
  }

  // ── Validate user (used by JwtStrategy) ───────────────────────
  async validateUser(userId: string): Promise<UserProfile | null> {
    return this.userRepo.findOne({ where: { userId } })
  }

  private signToken(userId: string, sessionToken: string, consentedPii: boolean, scope: 'standard' | 'vault'): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, sessionToken, consentedPii, scope }
    return this.jwtService.sign(payload)
  }
}
