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

  processMessage(conversationId: string, message: string): Promise<AgentTurn> {
    return this.agent.processMessage(conversationId, message)
  }

  getStatus(conversationId: string) {
    return this.agent.getStatus(conversationId)
  }

  async complete(userId: string, conversationId: string) {
    const session = await this.agent.getSession(conversationId)
    const collected = await this.agent.extractStructuredData(session)
    const outcome = await this.mapper.mapAndPersist(userId, collected)

    return {
      userProfileId: outcome.mapped.userProfileId,
      fieldsCollected: outcome.mapped.fieldsCollected,
      estimatedFields: outcome.mapped.estimatedFields,
      unknownFields: outcome.mapped.unknownFields,
      groupBCount: outcome.groupBCount,
    }
  }
}
