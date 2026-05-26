/**
 * Standalone TypeORM DataSource for the CLI (migrations).
 *
 * The runtime app constructs its DataSource via TypeOrmModule.forRootAsync in
 * app.module.ts (so it can use NestJS ConfigService). The CLI doesn't have
 * NestJS available, so we duplicate the connection config here using plain
 * env vars loaded by dotenv.
 *
 * Usage:
 *   pnpm migration:run           - apply pending migrations
 *   pnpm migration:revert        - undo the most recent migration
 *   pnpm migration:show          - list which migrations have run
 *
 * All three commands honour DATABASE_URL from .env (or whatever is in the
 * shell environment, which is how Vercel/CI invoke it).
 */
import 'reflect-metadata'
import { config as loadEnv } from 'dotenv'
import { DataSource } from 'typeorm'
import { UserProfile } from './entities/user-profile.entity'
import { ProtectionScore } from './entities/protection-score.entity'
import { RecommendationAudit } from './entities/recommendation-audit.entity'
import { VaultDocument } from './entities/vault-document.entity'
import { Nominee } from './entities/nominee.entity'
import { StreakRecord } from './entities/streak-record.entity'
import { PartnerConfig } from './entities/partner-config.entity'
import { UnlockTrigger } from './entities/unlock-trigger.entity'
import { OtpRequest } from './entities/otp-request.entity'
import { ConsentRecord } from './entities/consent-record.entity'
import { NotificationPrefsEntity } from './entities/notification-prefs.entity'
import { AdvisorBooking } from './entities/advisor-booking.entity'
import { QuizAttempt } from './entities/quiz-attempt.entity'

loadEnv()

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
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
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  // Logging enabled so the CLI shows each step
  logging: ['error', 'warn', 'schema'],
})
