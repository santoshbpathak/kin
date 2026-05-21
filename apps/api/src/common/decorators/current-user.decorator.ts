import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

export interface JwtPayload {
  sub: string        // user_id (UUID)
  sessionToken: string
  consentedPii: boolean
  scope: 'standard' | 'vault'
  iat: number
  exp: number
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>()
    return request.user
  },
)
