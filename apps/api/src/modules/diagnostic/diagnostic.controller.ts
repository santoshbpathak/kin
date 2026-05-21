import { Controller, Post, Body, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { DiagnosticService } from './diagnostic.service'

class DiagnosticAnswersDto {
  @IsString() lifeStage: string
  @IsString() annualIncome: string
  @IsString() dependants: string
  @IsString() monthlyObligations: string
  @IsString() existingInsurance: string
  @IsString() city: string
  @IsString() occupation: string
}

@ApiTags('diagnostic')
@ApiBearerAuth()
@Controller({ path: 'diagnostic', version: '1' })
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  @Post('complete')
  @ApiOperation({ summary: 'Submit all 7 diagnostic answers and parse profile' })
  async complete(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DiagnosticAnswersDto,
  ) {
    const parsed = this.diagnosticService.parseAnswers(dto)
    await this.diagnosticService.saveProfile(user.sub, parsed)
    return { parsed, userId: user.sub }
  }
}
