import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator'
import { DiscoveryEngineService } from './discovery-engine.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

class DiscoveryAnswersDto {
  @IsBoolean() hasSavingsAccount: boolean
  @IsBoolean() isSalariedWithPf: boolean
  @IsBoolean() hasEmployerBenefits: boolean
  @IsBoolean() hasVehicle: boolean
  @IsBoolean() hasHomeLoan: boolean
  @IsBoolean() travelsByRail: boolean
  @IsBoolean() hasCreditCard: boolean
  @IsOptional() @IsInt() @Min(18) @Max(70) age?: number
  @IsOptional() @IsBoolean() incomeBelow21000?: boolean
}

@ApiTags('discovery')
@ApiBearerAuth()
@Controller({ path: 'discovery', version: '1' })
export class DiscoveryController {
  constructor(private readonly engine: DiscoveryEngineService) {}

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate 8 answers and return discovered hidden coverages' })
  evaluate(@CurrentUser() _user: JwtPayload, @Body() dto: DiscoveryAnswersDto) {
    const coverages = this.engine.evaluate(dto)
    const total = this.engine.totalBonusCover(coverages)
    return { coverages, totalBonusCover: total, count: coverages.length, ruleVersion: 'v1.0.0' }
  }
}
