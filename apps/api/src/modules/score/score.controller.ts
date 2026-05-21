import { Controller, Post, Get, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ProtectionScoreService } from './protection-score.service'
import { PeerBenchmarkService } from './peer-benchmark.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import type { ParsedProfile } from '../diagnostic/nlp-parser.service'

@ApiTags('score')
@ApiBearerAuth()
@Controller({ path: 'score', version: '1' })
export class ScoreController {
  constructor(
    private readonly scoreService: ProtectionScoreService,
    private readonly benchmarkService: PeerBenchmarkService,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate protection score from parsed profile' })
  async calculate(
    @CurrentUser() user: JwtPayload,
    @Body() profile: ParsedProfile,
  ) {
    const result = this.scoreService.calculate(profile)
    const saved = await this.scoreService.save(user.sub, result, profile)
    const benchmark = await this.benchmarkService.getCohortAverage(
      profile.incomeBand,
      profile.cityTier,
    )
    return { ...result, scoreId: saved.scoreId, benchmark }
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get most recent protection score for session' })
  async getLatest(@CurrentUser() user: JwtPayload) {
    return this.scoreService.getLatest(user.sub)
  }
}
