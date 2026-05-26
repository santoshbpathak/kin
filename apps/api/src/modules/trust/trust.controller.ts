import { Controller, Post, Get, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import {
  IsArray,
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import { RecommendationService } from './recommendation.service'
import { ConsentService, ConsentDataType } from './consent.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

/**
 * Each recommendation that the user actually saw, sent to the backend so we
 * can write the immutable audit row (IRDAI CG-8). The basisText/formula/
 * irdaiRuleReference are stored verbatim - what was logged is what was shown.
 */
class RecommendationAuditEntryDto {
  @IsString() id: string
  @IsString() recommendationType: string
  @IsString() basisText: string
  @IsOptional() @IsString() irdaiRuleReference?: string
}

class LogRecommendationsDto {
  @IsString() scoreId: string
  @IsArray() @ValidateNested({ each: true }) @ArrayMaxSize(10)
  @Type(() => RecommendationAuditEntryDto)
  recommendations: RecommendationAuditEntryDto[]
  @IsOptional() @IsObject() profileSnapshot?: Record<string, unknown>
}

class ConsentDto {
  @IsArray() @IsString({ each: true }) dataTypes: ConsentDataType[]
}

@ApiTags('trust')
@ApiBearerAuth()
@Controller({ path: 'trust', version: '1' })
export class TrustController {
  constructor(
    private readonly recService: RecommendationService,
    private readonly consentService: ConsentService,
  ) {}

  @Post('recommendations')
  @ApiOperation({
    summary:
      'Log the recommendations the user just saw to the IRDAI suitability audit ' +
      'trail (recommendation_audits, immutable, 5-year retention). Returns the ' +
      'audit IDs so the frontend can wire each "See the Math" button to its row.',
  })
  async logRecommendations(
    @CurrentUser() user: JwtPayload,
    @Body() dto: LogRecommendationsDto,
  ) {
    const audits = await this.recService.logRecommendationBatch(
      user.sub,
      dto.scoreId,
      dto.recommendations,
      dto.profileSnapshot ?? {},
    )
    return {
      logged: audits.length,
      audits: audits.map(a => ({
        recommendationId: a.recommendationType, // we stored the frontend rec.id here
        auditId: a.auditId,
      })),
    }
  }

  @Get('see-the-math/:auditId')
  @ApiOperation({ summary: 'Get full basis text for a recommendation — mandatory per CG-8' })
  async seeTheMath(
    @CurrentUser() user: JwtPayload,
    @Param('auditId') auditId: string,
  ) {
    const audit = await this.recService.getAudit(user.sub, auditId)
    return {
      auditId: audit.auditId,
      recommendationType: audit.recommendationType,
      basisText: audit.basisText,
      irdaiRuleReference: audit.irdaiRuleReference,
      ruleVersion: audit.ruleVersion,
      createdAt: audit.createdAt,
    }
  }

  @Post('consent/grant')
  @ApiOperation({ summary: 'Grant granular consent — DPDP Act 2023' })
  grantConsent(@CurrentUser() user: JwtPayload, @Body() dto: ConsentDto) {
    return this.consentService.grantConsent(user.sub, dto.dataTypes)
  }

  @Post('consent/revoke')
  @ApiOperation({ summary: 'Revoke consent — right to withdraw, DPDP Act 2023' })
  revokeConsent(@CurrentUser() user: JwtPayload, @Body() dto: ConsentDto) {
    return this.consentService.revokeConsent(user.sub, dto.dataTypes)
  }

  @Get('consent/history')
  @ApiOperation({ summary: 'Get consent history for current user' })
  getConsentHistory(@CurrentUser() user: JwtPayload) {
    return this.consentService.getConsentHistory(user.sub)
  }
}
