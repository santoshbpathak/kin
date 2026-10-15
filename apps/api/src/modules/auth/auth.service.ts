/**
 * AuthService — Module 2
 *
 * Anonymous session → optionally authenticated session.
 * consentedPii: false by default — NEVER flipped without explicit user action.
 *
 * Flows:
 *   1. Anonymous: POST /auth/session → UUID session token, no PII stored
 *   2. WhatsApp OTP: POST /auth/whatsapp/otp → POST /auth/whatsapp/verify
 *   3. Session upgrade: when user consents, session linked to identity
 *   4. DPDP right-to-erasure: DELETE /auth/me cascades user data
 *
 * OTPs are stored hashed in the otp_requests table - serverless-safe and
 * resistant to DB-leak credential reuse.
 */
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { randomUUID } from 'crypto'
import { randomBytes, createHash } from 'crypto'
import { UserProfile } from '../../database/entities/user-profile.entity'
import { OtpRequest } from '../../database/entities/otp-request.entity'
import type { JwtPayload } from '../../common/decorators/current-user.decorator'

const OTP_TTL_MS = 5 * 60 * 1000

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
    @InjectRepository(OtpRequest)
    private readonly otpRepo: Repository<OtpRequest>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Anonymous session ─────────────────────────────────────────
  async createAnonymousSession(): Promise<{ sessionToken: string; token: string }> {
    const sessionToken = randomUUID()
    const user = this.userRepo.create({ sessionToken, consentedPii: false })
    await this.userRepo.save(user)
    const token = this.signToken(user.userId, sessionToken, false, 'standard')
    return { sessionToken, token }
  }

  // ── WhatsApp OTP ──────────────────────────────────────────────
  async sendWhatsAppOtp(phone: string): Promise<{ sent: boolean }> {
    const otpBytes = randomBytes(3)
    const otpInt = ((otpBytes[0] << 16) | (otpBytes[1] << 8) | otpBytes[2]) % 1_000_000
    const otp = otpInt.toString().padStart(6, '0')
    const otpHash = hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_TTL_MS)

    // Upsert - one pending OTP per phone at a time
    const existing = await this.otpRepo.findOne({ where: { phone } })
    if (existing) {
      existing.otpHash = otpHash
      existing.expiresAt = expiresAt
      await this.otpRepo.save(existing)
    } else {
      await this.otpRepo.save(this.otpRepo.create({ phone, otpHash, expiresAt }))
    }

    // Non-production only: print the OTP (with the phone masked to its last 4
    // digits) so the flow can be exercised locally without a WhatsApp account.
    // Production never logs OTPs; NODE_ENV=production is asserted at startup.
    if (process.env.NODE_ENV !== 'production') {
      const tail = phone.slice(-4)
      // eslint-disable-next-line no-console
      console.log(`[DEV] OTP issued for ******${tail}: ${otp}`)
    }
    // Phase 2: send via WhatsApp Business Cloud API (currently sandbox-only)
    return { sent: true }
  }

  async verifyWhatsAppOtp(
    phone: string,
    otp: string,
    sessionToken?: string,
  ): Promise<{ sessionToken: string; token: string; upgraded: boolean }> {
    const stored = await this.otpRepo.findOne({ where: { phone } })
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired OTP')
    }
    const matches = stored.otpHash === hashOtp(otp)
    const expired = stored.expiresAt.getTime() < Date.now()
    // Single-use OTP: consume the code on ANY verify attempt — success OR
    // failure. A 6-digit code is only ~1M combinations, so without this a brute
    // force could take over an account (phone == identity). Invalidating on the
    // first wrong guess means an attacker must request a fresh code each time,
    // which is rate-limited, re-randomised, and visible to the real user.
    await this.otpRepo.remove(stored)
    if (!matches || expired) {
      throw new UnauthorizedException('Invalid or expired OTP')
    }

    // Find or create user by phone
    let user = await this.userRepo.findOne({ where: { whatsappNumber: phone } })
    if (!user) {
      // Upgrade anonymous session if one exists
      const existing = sessionToken
        ? await this.userRepo.findOne({ where: { sessionToken } })
        : null
      if (existing) {
        existing.whatsappNumber = phone
        existing.consentedPii = true
        user = await this.userRepo.save(existing)
      } else {
        user = await this.userRepo.save(
          this.userRepo.create({ sessionToken: randomUUID(), whatsappNumber: phone, consentedPii: true }),
        )
      }
    }

    const token = this.signToken(user.userId, user.sessionToken, true, 'standard')
    return { sessionToken: user.sessionToken, token, upgraded: true }
  }

  /**
   * Sweep expired OTP rows. Idempotent. Safe to call on every request or via cron.
   * Returns the number of rows removed (for observability).
   */
  async sweepExpiredOtps(): Promise<number> {
    const res = await this.otpRepo.delete({ expiresAt: LessThan(new Date()) })
    return res.affected ?? 0
  }

  // ── Vault token (elevated scope) ──────────────────────────────
  async issueVaultToken(userId: string): Promise<{ vaultToken: string }> {
    // Step-up gate: the vault holds the most sensitive data (nominee Aadhaar,
    // policy documents), so an anonymous session must NOT be able to mint an
    // elevated vault token. Require a verified identity (WhatsApp-verified phone).
    //
    // NOTE (vault go-live): strengthen this to a FRESH OTP re-authentication so
    // that a standard token stolen from Web Storage cannot be silently escalated
    // to vault scope. The current check gates by identity, not by recency.
    const user = await this.userRepo.findOne({ where: { userId } })
    if (!user || !user.whatsappNumber) {
      throw new ForbiddenException('Vault access requires a verified phone number')
    }
    const vaultToken = this.jwtService.sign(
      { sub: userId, scope: 'vault' },
      {
        secret: this.configService.get<string>('auth.vaultJwtSecret'),
        expiresIn: this.configService.get<string>('auth.vaultJwtExpiry'),
      },
    )
    return { vaultToken }
  }

  // ── Consent upgrade (legacy) ──────────────────────────────────
  async upgradeConsent(userId: string, dataTypes: string[]): Promise<{ upgraded: boolean; consentedTypes: string[] }> {
    await this.userRepo.update(userId, { consentedPii: true })
    return { upgraded: true, consentedTypes: dataTypes }
  }

  // ── Validate user (used by JwtStrategy) ───────────────────────
  async validateUser(userId: string): Promise<UserProfile | null> {
    return this.userRepo.findOne({ where: { userId } })
  }

  /**
   * DPDP Art. 12 right-to-erasure. Cascades to all child tables via FK ON DELETE CASCADE.
   * recommendation_audits rows are intentionally retained (IRDAI 5-year suitability
   * requirement). PII inside their inputs_snapshot is already scrubbed at write time
   * by recommendation.service.scrubPii.
   */
  async deleteUser(userId: string): Promise<{ deleted: boolean; auditRowsRetained: number }> {
    const user = await this.userRepo.findOne({ where: { userId } })
    if (!user) {
      return { deleted: false, auditRowsRetained: 0 }
    }

    const auditRowsRetained = await this.userRepo.manager
      .query(`SELECT COUNT(*) as count FROM "recommendation_audits" WHERE "userId" = $1`, [userId])
      .then((rows: Array<{ count: string | number }>) => Number(rows[0]?.count ?? 0))
      .catch(() => 0)

    await this.userRepo.remove(user)
    return { deleted: true, auditRowsRetained }
  }

  private signToken(
    userId: string,
    sessionToken: string,
    consentedPii: boolean,
    scope: 'standard' | 'vault',
  ): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, sessionToken, consentedPii, scope }
    return this.jwtService.sign(payload)
  }
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}
