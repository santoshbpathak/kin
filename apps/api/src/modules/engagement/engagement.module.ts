import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StreakRecord } from '../../database/entities/streak-record.entity'
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity'
import { Nominee } from '../../database/entities/nominee.entity'
import { VaultDocument } from '../../database/entities/vault-document.entity'
import { ProtectionScore } from '../../database/entities/protection-score.entity'
import { EngagementController } from './engagement.controller'
import { StreakService } from './streak.service'
import { QuizService } from './quiz.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([StreakRecord, QuizAttempt, Nominee, VaultDocument, ProtectionScore]),
  ],
  controllers: [EngagementController],
  providers: [StreakService, QuizService],
  exports: [StreakService],
})
export class EngagementModule {}
