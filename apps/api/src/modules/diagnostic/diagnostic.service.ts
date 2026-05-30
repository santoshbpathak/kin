/**
 * DiagnosticService — thin orchestration layer between the controller,
 * the conversational agent, and the profile mapper.
 *
 * The agent owns conversation state; the mapper owns persistence; this
 * service only sequences calls and returns the right DTO shape.
 */

import { Injectable } from '@nestjs/common'

import { IntakeAgentService } from './agent/intake-agent.service'
import { ProfileMapperService } from './mapper/profile-mapper.service'
import type { AgentTurn } from './agent/intake-agent.types'

@Injectable()
export class DiagnosticService {
  constructor(
    private readonly agent: IntakeAgentService,
    private readonly mapper: ProfileMapperService,
  ) {}

  startConversation(sessionToken: string, userId: string): Promise<AgentTurn> {
    return this.agent.startConversation(sessionToken, userId)
  }

  processMessage(sessionToken: string, conversationId: string, message: string): Promise<AgentTurn> {
    return this.agent.processMessage(conversationId, sessionToken, message)
  }

  getStatus(sessionToken: string, conversationId: string) {
    return this.agent.getStatus(conversationId, sessionToken)
  }

  async complete(userId: string, sessionToken: string, conversationId: string) {
    const session = await this.agent.getSession(conversationId, sessionToken)
    const collected = await this.agent.extractStructuredData(session)
    const outcome = await this.mapper.mapAndPersist(userId, collected)

    return {
      userProfileId: outcome.mapped.userProfileId,
      fieldsCollected: outcome.mapped.fieldsCollected,
      estimatedFields: outcome.mapped.estimatedFields,
      unknownFields: outcome.mapped.unknownFields,
      groupBCount: outcome.groupBCount,
      legacyProfile: outcome.legacyProfile,
    }
  }
}
