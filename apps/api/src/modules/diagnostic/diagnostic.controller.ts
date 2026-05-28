/**
 * DiagnosticController — REST surface for the conversational diagnostic
 * intake (Module A, Brief v1.4 §1.8).
 *
 * Endpoints (all under /api/v1/diagnostic):
 *
 *   POST /start            Open a new conversation. Returns the first
 *                          agent message and quick-select chips.
 *   POST /message          Send a user turn. Returns the next agent
 *                          message, completion flag, and progress %.
 *   GET  /status/:id       Read-only progress snapshot.
 *   POST /complete         Trigger final extraction + mapping. Returns
 *                          the userProfileId plus estimated/unknown
 *                          field lists for the Score-screen disclosure.
 *
 * All endpoints require the standard session JWT (provided by the global
 * JwtAuthGuard). No PII is accepted or returned by any of these routes.
 */

import {
  Body, Controller, Get, NotFoundException, Param, Post,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsString, IsUUID, Length } from 'class-validator'

import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { DiagnosticService } from './diagnostic.service'

class StartConversationDto {}

class MessageDto {
  @IsUUID()
  conversationId: string

  @IsString()
  @Length(1, 2000)
  message: string
}

class CompleteDto {
  @IsUUID()
  conversationId: string
}

@ApiTags('diagnostic')
@ApiBearerAuth()
@Controller({ path: 'diagnostic', version: '1' })
export class DiagnosticController {
  constructor(private readonly diagnostic: DiagnosticService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new conversational diagnostic session' })
  async start(@CurrentUser() user: JwtPayload, @Body() _dto: StartConversationDto) {
    return this.diagnostic.startConversation(user.sessionToken, user.sub)
  }

  @Post('message')
  @ApiOperation({ summary: 'Send a user message to the in-flight conversation' })
  async message(@Body() dto: MessageDto) {
    return this.diagnostic.processMessage(dto.conversationId, dto.message)
  }

  @Get('status/:conversationId')
  @ApiOperation({ summary: 'Read current progress and completion status' })
  async status(@Param('conversationId') conversationId: string) {
    if (!conversationId) throw new NotFoundException()
    return this.diagnostic.getStatus(conversationId)
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Extract the final structured profile and persist to user_profiles',
  })
  async complete(@CurrentUser() user: JwtPayload, @Body() dto: CompleteDto) {
    return this.diagnostic.complete(user.sub, dto.conversationId)
  }
}
