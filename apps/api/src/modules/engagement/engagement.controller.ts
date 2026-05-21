import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional } from 'class-validator'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { StreakService } from './streak.service'
import { QuizService } from './quiz.service'

class RecordActionDto {
  @IsString() actionType: string
}

class SubmitQuizDto {
  @IsNumber() weekNumber: number
  answers: Record<string, string>
}

class GetQuizDto {
  @IsOptional() @IsNumber() weekNumber?: number
}

@ApiTags('engagement')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'engagement', version: '1' })
export class EngagementController {
  constructor(
    private readonly streakService: StreakService,
    private readonly quizService: QuizService,
  ) {}

  // ── Streak ────────────────────────────────────────────────────

  @Get('streak')
  @ApiOperation({ summary: 'Get current streak state for the authenticated user' })
  getStreak(@CurrentUser() user: JwtPayload) {
    return this.streakService.getStreak(user.sub)
  }

  @Post('streak/action')
  @ApiOperation({ summary: 'Record a streak action (e.g. quiz_complete, vault_upload)' })
  async recordAction(@CurrentUser() user: JwtPayload, @Body() dto: RecordActionDto) {
    const streak = await this.streakService.recordAction(user.sub, dto.actionType)
    await this.streakService.recordVisit(user.sub)
    return streak
  }

  // ── Quiz ──────────────────────────────────────────────────────

  @Get('quiz/weekly')
  @ApiOperation({ summary: "Get this week's 3 KIN IQ quiz questions" })
  getWeeklyQuiz() {
    return this.quizService.getWeeklyQuiz()
  }

  @Post('quiz/submit')
  @ApiOperation({ summary: 'Submit quiz answers — returns results with explanations and KIN IQ delta' })
  async submitQuiz(@CurrentUser() user: JwtPayload, @Body() dto: SubmitQuizDto) {
    const result = this.quizService.submitAttempt(user.sub, dto.weekNumber, dto.answers)
    // Record streak action for quiz completion
    await this.streakService.recordAction(user.sub, 'quiz_complete')
    return result
  }

  @Get('quiz/iq-score')
  @ApiOperation({ summary: 'Get cumulative KIN IQ score and history for the authenticated user' })
  getIqScore(@CurrentUser() user: JwtPayload) {
    return this.quizService.getKinIqScore(user.sub)
  }
}
