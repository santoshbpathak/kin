import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdvisorBooking } from '../../database/entities/advisor-booking.entity'
import { AdvisorSession } from '../../database/entities/advisor-session.entity'
import { ComplianceGuardService } from '../../shared/compliance/compliance-guard.service'

import { ConnectController } from './connect.controller'
import { ConnectService } from './connect.service'
import { AiAdvisorService } from './advisory/ai-advisor.service'
import { EscalationDetectorService } from './advisory/escalation-detector.service'
import { AdvisorBriefService } from './advisory/advisor-brief.service'
import { TierSessionService } from './advisory/tier-session.service'

@Module({
  imports: [TypeOrmModule.forFeature([AdvisorBooking, AdvisorSession])],
  controllers: [ConnectController],
  providers: [
    ConnectService,
    AiAdvisorService,
    EscalationDetectorService,
    AdvisorBriefService,
    TierSessionService,
    ComplianceGuardService,
  ],
  exports: [ConnectService, AiAdvisorService, TierSessionService],
})
export class ConnectModule {}
