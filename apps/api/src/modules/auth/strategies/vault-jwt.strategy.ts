import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { JwtPayload } from '../../../common/decorators/current-user.decorator'

@Injectable()
export class VaultJwtStrategy extends PassportStrategy(Strategy, 'vault-jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.vaultJwtSecret') ?? 'dev-vault-secret',
    })
  }

  validate(payload: JwtPayload) {
    if (payload.scope !== 'vault') {
      throw new UnauthorizedException('Vault scope required — request a vault token via POST /auth/vault-token')
    }
    return payload
  }
}
