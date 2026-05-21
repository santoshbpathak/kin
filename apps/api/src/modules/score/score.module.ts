import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProtectionScore } from '../../database/entities/protection-score.entity'
import { UserProfile } from '../../database/entities/user-profile.entity'
import { ScoreController } from './score.controller'
import { ProtectionScoreService } from './protection-score.service'
import { PeerBenchmarkService } from './peer-benchmark.service'

@Module({
  imports: [TypeOrmModule.forFeature([ProtectionScore, UserProfile])],
  controllers: [ScoreController],
  providers: [ProtectionScoreService, PeerBenchmarkService],
  exports: [ProtectionScoreService],
})
export class ScoreModule {}
