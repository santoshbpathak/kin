import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { ContentService } from './content.service'
import { StreakService } from '../engagement/streak.service'

@ApiTags('content')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'content', version: '1' })
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly streakService: StreakService,
  ) {}

  @Get('brief/current')
  @ApiOperation({ summary: 'Get this week\'s personalised KIN News Brief' })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated personalisation tags' })
  getCurrentBrief(@Query('tags') tags?: string) {
    const userTags = tags ? tags.split(',').map(t => t.trim()) : []
    return this.contentService.getCurrentBrief(userTags)
  }

  @Get('brief/archive')
  @ApiOperation({ summary: 'Get past 8 weeks of KIN News Briefs' })
  getArchive() {
    return this.contentService.getArchive()
  }

  @Get('brief/:weekNumber')
  @ApiOperation({ summary: 'Get a specific week\'s brief by week number' })
  getBriefByWeek(@Param('weekNumber') weekNumber: string) {
    return this.contentService.getBriefByWeek(parseInt(weekNumber, 10))
  }

  @Post('brief/:briefId/share')
  @ApiOperation({ summary: 'Generate shareable WhatsApp content for a brief (records streak action)' })
  async shareBrief(@CurrentUser() user: JwtPayload, @Param('briefId') briefId: string) {
    const content = this.contentService.generateShareContent(briefId)
    // Record streak action for reading/sharing the brief
    await this.streakService.recordAction(user.sub, 'read_brief')
    return content
  }
}
