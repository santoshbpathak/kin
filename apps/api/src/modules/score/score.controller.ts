import { Controller, Post, Get, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  Min,
  Max,
} from 'class-validator'
import { ProtectionScoreService } from './protection-score.service'
import { PeerBenchmarkService } from './peer-benchmark.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import type { ParsedProfile } from '../diagnostic/nlp-parser.service'
import type { IncomeBand, CityTier, LifeStage } from '../../database/entities/user-profile.entity'

const INCOME_BANDS = ['lt3l', '3l_5l', '5l_10l', '10l_20l', '20l_50l', 'gt50l'] as const
const CITY_TIERS = ['T1', 'T2', 'T3'] as const
const LIFE_STAGES = ['single', 'married_no_kids', 'married_with_kids', 'parent_caregiver'] as const
const OCCUPATIONS = ['salaried_pf', 'self_employed', 'govt', 'other'] as const
const MAX_RUPEES = 1e12

/**
 * Validated ParsedProfile for the server-side engine. Previously typed as an
 * interface, which Nest cannot validate, so arbitrary JSON reached the engine
 * and the inputs_snapshot column.
 */
class CalculateScoreDto implements ParsedProfile {
  @IsIn(INCOME_BANDS) incomeBand: IncomeBand
  @IsIn(CITY_TIERS) cityTier: CityTier
  @IsIn(LIFE_STAGES) lifeStage: LifeStage
  @IsInt() @Min(0) @Max(20) dependantsCount: number
  @IsString() @MaxLength(32) monthlyObligationsBand: string
  @IsBoolean() hasLifeCover: boolean
  @IsBoolean() hasHealthCover: boolean
  @IsBoolean() hasAccidentCover: boolean
  @IsNumber() @Min(0) @Max(MAX_RUPEES) termCoverAmount: number
  @IsNumber() @Min(0) @Max(MAX_RUPEES) healthCoverAmount: number
  @IsNumber() @Min(0) @Max(MAX_RUPEES) incomeProtectionAmount: number
  @IsNumber() @Min(0) @Max(1e6) annualIncomeLakhs: number
  @IsIn(OCCUPATIONS) occupationCategory: 'salaried_pf' | 'self_employed' | 'govt' | 'other'
}

/**
 * Save-score DTO accepted from the frontend. The frontend already runs its
 * own deterministic engine; this endpoint just persists the result so the
 * audit trail (protection_scores + recommendation_audits) is correct.
 */
class SaveScoreDto {
  @IsNumber() @Min(0) @Max(100) compositeScore: number
  @IsNumber() @Min(0) @Max(100) lifeSubScore: number
  @IsNumber() @Min(0) @Max(100) healthSubScore: number
  @IsNumber() @Min(0) @Max(100) incomeSubScore: number
  @IsOptional() @IsNumber() @Min(0) hiddenCoverageTotal?: number
  @IsString() ruleVersion: string
  @IsOptional() @IsObject() inputsSnapshot?: Record<string, unknown>
}

@ApiTags('score')
@ApiBearerAuth()
@Controller({ path: 'score', version: '1' })
export class ScoreController {
  constructor(
    private readonly scoreService: ProtectionScoreService,
    private readonly benchmarkService: PeerBenchmarkService,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate protection score from parsed profile (server-side engine)' })
  async calculate(
    @CurrentUser() user: JwtPayload,
    @Body() profile: CalculateScoreDto,
  ) {
    const result = this.scoreService.calculate(profile)
    const saved = await this.scoreService.save(user.sub, result, profile)
    const benchmark = await this.benchmarkService.getCohortAverage(
      profile.incomeBand,
      profile.cityTier,
    )
    return { ...result, scoreId: saved.scoreId, benchmark }
  }

  @Post('save')
  @ApiOperation({
    summary:
      'Persist a pre-computed score (from the frontend deterministic engine). ' +
      'Returns the scoreId, which is the FK used by /v1/trust/recommendations ' +
      'to create the IRDAI audit rows.',
  })
  async save(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SaveScoreDto,
  ) {
    const saved = await this.scoreService.saveFromClient(user.sub, {
      compositeScore: dto.compositeScore,
      lifeSubScore: dto.lifeSubScore,
      healthSubScore: dto.healthSubScore,
      incomeSubScore: dto.incomeSubScore,
      hiddenCoverageTotal: dto.hiddenCoverageTotal ?? 0,
      ruleVersion: dto.ruleVersion,
      inputsSnapshot: dto.inputsSnapshot ?? {},
    })
    return { scoreId: saved.scoreId, calculatedAt: saved.calculatedAt }
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get most recent protection score for current user' })
  async getLatest(@CurrentUser() user: JwtPayload) {
    return this.scoreService.getLatest(user.sub)
  }
}
