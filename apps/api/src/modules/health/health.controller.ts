import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { isDemoMode } from '../../shared/openai/openai.client'

/**
 * Unauthenticated liveness endpoint. Deliberately minimal: it never reports
 * configuration values, dependency versions or database state. `demoMode`
 * lets the web client show the demo ribbon so synthetic data is never
 * mistaken for a real deployment.
 */
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness check — public, no configuration disclosed' })
  check() {
    return {
      status: 'ok',
      demoMode: isDemoMode(),
      timestamp: new Date().toISOString(),
    }
  }
}
