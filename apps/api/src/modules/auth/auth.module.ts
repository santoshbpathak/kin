import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UserProfile } from '../../database/entities/user-profile.entity'
import { OtpRequest } from '../../database/entities/otp-request.entity'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { VaultJwtStrategy } from './strategies/vault-jwt.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile, OtpRequest]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: config.get<string>('auth.jwtExpiry') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, VaultJwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
