import { Controller, Post, Body, Delete, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsMobilePhone, Length, IsOptional } from 'class-validator'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'

class SendOtpDto {
  @IsMobilePhone('en-IN') phone: string
}
class VerifyOtpDto {
  @IsMobilePhone('en-IN') phone: string
  @IsString() @Length(6, 6) otp: string
  @IsOptional() @IsString() sessionToken?: string
}
class UpgradeConsentDto {
  @IsString({ each: true }) dataTypes: string[]
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('session')
  @ApiOperation({ summary: 'Create anonymous session — zero PII required' })
  createSession() {
    return this.authService.createAnonymousSession()
  }

  @Public()
  @Post('whatsapp/otp')
  @ApiOperation({ summary: 'Send WhatsApp OTP to phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendWhatsAppOtp(dto.phone)
  }

  @Public()
  @Post('whatsapp/verify')
  @ApiOperation({ summary: 'Verify OTP and upgrade to authenticated session' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyWhatsAppOtp(dto.phone, dto.otp, dto.sessionToken)
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Google OAuth — not configured in this build' })
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  googleAuthStub() {
    return {
      configured: false,
      message:
        'Google OAuth is not configured in this build. Set GOOGLE_OAUTH_CLIENT_ID/SECRET ' +
        'and wire Supabase Auth Google provider to enable.',
    }
  }

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'DPDP right-to-erasure - permanently deletes the authenticated user and all ' +
      'cascading records. recommendation_audits rows are retained per IRDAI 5-year ' +
      'rule but PII fields in inputs_snapshot are stripped.',
  })
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteUser(user.sub)
  }

  @Post('vault-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue elevated vault-scoped JWT (1h expiry)' })
  issueVaultToken(@CurrentUser() user: JwtPayload) {
    return this.authService.issueVaultToken(user.sub)
  }

  @Post('consent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade consent — DPDP Act 2023 granular consent record' })
  upgradeConsent(@CurrentUser() user: JwtPayload, @Body() dto: UpgradeConsentDto) {
    return this.authService.upgradeConsent(user.sub, dto.dataTypes)
  }
}
