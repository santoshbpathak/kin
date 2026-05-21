import { Controller, Post, Get, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'
import { RecommendationService } from './recommendation.service'
import { ConsentService, ConsentDataType } from './consent.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import type { ScoreResult } from '../score/protection-score.service'
import type { ParsedProfile } from '../diagnostic/nlp-parser.service'

class GenerateRecommendationsDto {
  score: ScoreResult
  profile: ParsedProfile
  scoreId: string
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
  @ApiOperation({ summary: 'Generate ranked recommendations — IRDAI compliant, rule-based' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateRecommendationsDto) {
    const recs = this.recService.generate(dto.score, dto.profile)
    await this.recService.logAudit(user.sub, dto.scoreId, recs, dto.profile)
    return { recommendations: recs, count: recs.length }
  }

  @Get('see-the-math/:recId')
  @ApiOperation({ summary: 'Get full basis text for a recommendation — mandatory per CG-8' })
  async seeTheMath(@Param('recId') recId: string) {
    // Phase 2: fetch from DB by recId
    return { recId, message: 'Recommendation audit records available via database query in Phase 2' }
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
