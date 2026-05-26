import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator'
import { DiscoveryEngineService } from './discovery-engine.service'
import type { DiscoveryAnswers } from './discovery-engine.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

class DiscoveryAnswersDto {
  @IsBoolean() hasSavingsAccount: boolean
  @IsBoolean() isSalariedWithPf: boolean
  @IsBoolean() hasEmployerBenefits: boolean
  @IsBoolean() hasVehicle: boolean
  @IsBoolean() hasHomeLoan: boolean
  @IsBoolean() travelsByRail: boolean
  @IsBoolean() hasCreditCard: boolean
  @IsOptional() @IsBoolean() hasLpgConnection?: boolean
  @IsOptional() @IsBoolean() hasJanDhanAccount?: boolean
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
    const answers: DiscoveryAnswers = {
      isSalaried: dto.isSalariedWithPf || dto.hasEmployerBenefits || dto.incomeBelow21000 === true,
      contributesPf: dto.isSalariedWithPf,
      hasSavingsAccount: dto.hasSavingsAccount,
      ageBelow50: dto.age ? dto.age <= 50 : false,
      incomeBelowEsiLimit: dto.incomeBelow21000 ?? false,
      employerOffersGroupLife: dto.hasEmployerBenefits,
      ownsVehicle: dto.hasVehicle,
      travelsByRail: dto.travelsByRail,
      hasHomeLoan: dto.hasHomeLoan,
      hasLpgConnection: dto.hasLpgConnection ?? false,
      hasJanDhanAccount: dto.hasJanDhanAccount ?? false,
    }
    const result = this.engine.evaluate(answers)
    return { ...result, count: result.coverages.length }
  }
}
