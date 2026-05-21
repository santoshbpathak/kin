import { Controller, Post, Get, Param, Body, Version } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { Public } from '../../common/decorators/public.decorator'
import { PartnerService } from './partner.service'

class CreateSessionDto {
  @IsString() partnerKey: string
  @IsString() userToken: string   // partner's own anonymous user token
}

@ApiTags('partner')
@Controller({ path: 'partner', version: '1' })
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Public()
  @Post('session')
  @ApiOperation({ summary: 'Exchange partner user token for KIN session token' })
  @ApiResponse({ status: 201, description: 'Session created — no PII in response' })
  async createSession(@Body() dto: CreateSessionDto) {
    return this.partnerService.createSession(dto.partnerKey, dto.userToken)
  }

  @Public()
  @Get('brand/:partnerKey')
  @ApiOperation({ summary: 'Get brand tokens for CSS variable injection' })
  async getBrand(@Param('partnerKey') partnerKey: string) {
    return this.partnerService.getBrandTokens(partnerKey)
  }
}
