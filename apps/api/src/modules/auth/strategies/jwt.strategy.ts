import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth.service'
import type { JwtPayload } from '../../../common/decorators/current-user.decorator'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret') ?? 'dev-secret',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub)
    if (!user) throw new UnauthorizedException('Session expired')
    return payload
  }
}
