import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RecommendationAudit } from '../../database/entities/recommendation-audit.entity'
import { ProtectionScore } from '../../database/entities/protection-score.entity'
import { TrustController } from './trust.controller'
import { RecommendationService } from './recommendation.service'
import { ConsentService } from './consent.service'

@Module({
  imports: [TypeOrmModule.forFeature([RecommendationAudit, ProtectionScore])],
  controllers: [TrustController],
  providers: [RecommendationService, ConsentService],
  exports: [RecommendationService, ConsentService],
})
export class TrustModule {}
