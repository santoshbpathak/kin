import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UserProfile } from '../../database/entities/user-profile.entity'
import { IntakeConversationSession } from '../../database/entities/intake-conversation-session.entity'
import { ComplianceGuardService } from '../../shared/compliance/compliance-guard.service'

import { DiagnosticController } from './diagnostic.controller'
import { DiagnosticService } from './diagnostic.service'
import { IntakeAgentService } from './agent/intake-agent.service'
import { ProfileMapperService } from './mapper/profile-mapper.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile, IntakeConversationSession])],
  controllers: [DiagnosticController],
  providers: [
    DiagnosticService,
    IntakeAgentService,
    ProfileMapperService,
    ComplianceGuardService,
  ],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
