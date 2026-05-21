import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StreakRecord } from '../../database/entities/streak-record.entity'
import { EngagementController } from './engagement.controller'
import { StreakService } from './streak.service'
import { QuizService } from './quiz.service'

@Module({
  imports: [TypeOrmModule.forFeature([StreakRecord])],
  controllers: [EngagementController],
  providers: [StreakService, QuizService],
  exports: [StreakService],
})
export class EngagementModule {}
