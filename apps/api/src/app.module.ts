/**
 * app.module.ts — KIN API Root Module
 *
 * Imports:
 *   - ConfigModule    — typed env config, validated at startup
 *   - TypeOrmModule   — PostgreSQL via TypeORM
 *   - ThrottlerModule — rate limiting (100 req/min standard, 10/min vault)
 *   - All feature modules (one per architectural layer)
 */

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import type { LoggerOptions } from 'typeorm'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'

import configuration from './config/configuration'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'

// Entities
import { UserProfile } from './database/entities/user-profile.entity'
import { ProtectionScore } from './database/entities/protection-score.entity'
import { RecommendationAudit } from './database/entities/recommendation-audit.entity'
import { VaultDocument } from './database/entities/vault-document.entity'
import { Nominee } from './database/entities/nominee.entity'
import { StreakRecord } from './database/entities/streak-record.entity'
import { PartnerConfig } from './database/entities/partner-config.entity'
import { UnlockTrigger } from './database/entities/unlock-trigger.entity'
import { OtpRequest } from './database/entities/otp-request.entity'
import { ConsentRecord } from './database/entities/consent-record.entity'
import { NotificationPrefsEntity } from './database/entities/notification-prefs.entity'
import { AdvisorBooking } from './database/entities/advisor-booking.entity'
import { QuizAttempt } from './database/entities/quiz-attempt.entity'
import { IntakeConversationSession } from './database/entities/intake-conversation-session.entity'
import { AdvisorSession } from './database/entities/advisor-session.entity'

// Feature modules
import { PartnerModule } from './modules/partner/partner.module'
import { AuthModule } from './modules/auth/auth.module'
import { DiagnosticModule } from './modules/diagnostic/diagnostic.module'
import { ScoreModule } from './modules/score/score.module'
import { TrustModule } from './modules/trust/trust.module'
import { DiscoveryModule } from './modules/discovery/discovery.module'
import { VaultModule } from './modules/vault/vault.module'
import { EngagementModule } from './modules/engagement/engagement.module'
import { ContentModule } from './modules/content/content.module'
import { ConnectModule } from './modules/connect/connect.module'
import { LifecycleModule } from './modules/lifecycle/lifecycle.module'
import { HealthModule } from './modules/health/health.module'

const ALL_ENTITIES = [
  UserProfile,
  ProtectionScore,
  RecommendationAudit,
  VaultDocument,
  Nominee,
  StreakRecord,
  PartnerConfig,
  UnlockTrigger,
  OtpRequest,
  ConsentRecord,
  NotificationPrefsEntity,
  AdvisorBooking,
  QuizAttempt,
  IntakeConversationSession,
  AdvisorSession,
]

// Development default: no query echo (bound parameters contain phone numbers).
const QUIET_DEV_LOGGING: LoggerOptions = ['error', 'warn', 'migration']

function createTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const nodeEnv = config.get<string>('nodeEnv')
  const driver = config.get<string>('database.driver')
  const common = {
    entities: ALL_ENTITIES,
    // Query logging prints bound parameters (phone numbers, tokens) to stdout,
    // so it is opt-in even in development: DATABASE_LOG_QUERIES=true.
    logging: nodeEnv === 'development'
      ? (config.get<boolean>('database.logQueries') ? true : QUIET_DEV_LOGGING)
      : false,
  }

  if (driver === 'sqljs') {
    return {
      ...common,
      type: 'sqljs',
      location: config.get<string>('database.sqljsLocation') ?? 'kin-local.sqlite',
      autoSave: true,
      synchronize: true,
    }
  }

  return {
    ...common,
    type: 'postgres',
    url: config.get<string>('database.url'),
    host: config.get<string>('database.host'),
    port: config.get<number>('database.port'),
    database: config.get<string>('database.name'),
    username: config.get<string>('database.user'),
    password: config.get<string>('database.pass'),
    ssl: config.get<boolean>('database.ssl')
      ? {
          rejectUnauthorized: config.get<boolean>('database.sslRejectUnauthorized') ?? false,
          ca: config.get<string | undefined>('database.sslCa'),
        }
      : false,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
    // NEVER synchronize against Postgres. Migrations are the source of truth.
    // Synchronize-on against a migrated schema runs destructive ALTER TABLEs to
    // align column types with entity metadata; that wiped column defaults and
    // length constraints during the first Supabase boot until we caught it.
    synchronize: false,
  }
}

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Database ─────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),

    // ── Rate limiting ─────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('rateLimit.ttl') ?? 60,
            limit: config.get<number>('rateLimit.max') ?? 100,
          },
        ],
      }),
    }),

    // ── Feature modules ───────────────────────────────────────────
    PartnerModule,
    AuthModule,
    DiagnosticModule,
    ScoreModule,
    TrustModule,
    DiscoveryModule,
    VaultModule,
    EngagementModule,
    ContentModule,
    ConnectModule,
    LifecycleModule,
    HealthModule,
  ],
  providers: [
    // Global JWT auth guard - all routes require JWT unless @Public() decorator is present
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global rate limit guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
