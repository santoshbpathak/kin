import { Controller, Post, Body, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsMobilePhone, Length } from 'class-validator'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'

class SendOtpDto {
  @IsMobilePhone('en-IN') mobile: string
}
class VerifyOtpDto {
  @IsMobilePhone('en-IN') mobile: string
  @IsString() @Length(6, 6) otp: string
  @IsString() sessionToken: string
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
  @ApiOperation({ summary: 'Send WhatsApp OTP to mobile number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendWhatsAppOtp(dto.mobile)
  }

  @Public()
  @Post('whatsapp/verify')
  @ApiOperation({ summary: 'Verify OTP and upgrade to authenticated session' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyWhatsAppOtp(dto.mobile, dto.otp, dto.sessionToken)
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
