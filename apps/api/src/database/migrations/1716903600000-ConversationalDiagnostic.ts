import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Migration 003 — Conversational Diagnostic (Module A, PRD v1.4)
 *
 * Adds:
 *   1. New columns on user_profiles that the conversational intake agent
 *      populates (exact income, structured dependants, per-coverage amounts,
 *      field-level confidence map, conversation completion timestamp).
 *      All columns are nullable so existing rows are unaffected.
 *
 *   2. New table intake_conversation_sessions that holds the GPT-4o chat
 *      history and incrementally-extracted fields for each in-flight intake.
 *      Rows expire after CONVERSATION_TTL_SECONDS (default 30 minutes); a
 *      DB-side cleanup is left to the application (the service runs a
 *      "DELETE WHERE expiresAt < NOW()" sweep on each /start call).
 *
 * The columns added to user_profiles are additive only. The pre-existing
 * band columns (incomeBand, cityTier, monthlyObligationsBand) keep being
 * written by the profile-mapper so the unchanged score engine and trust
 * recommendation engine continue to work without modification.
 */
export class ConversationalDiagnostic1716903600000 implements MigrationInterface {
  name = 'ConversationalDiagnostic1716903600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Extend user_profiles ─────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
        ADD COLUMN IF NOT EXISTS "annualIncomeExact"        BIGINT,
        ADD COLUMN IF NOT EXISTS "dependantsDetail"         JSONB,
        ADD COLUMN IF NOT EXISTS "personalLifeCover"        BIGINT,
        ADD COLUMN IF NOT EXISTS "employerGroupTerm"        BIGINT,
        ADD COLUMN IF NOT EXISTS "personalHealthCover"      BIGINT,
        ADD COLUMN IF NOT EXISTS "personalHealthIsFloater"  BOOLEAN,
        ADD COLUMN IF NOT EXISTS "employerMediclaim"        BIGINT,
        ADD COLUMN IF NOT EXISTS "ciCover"                  BIGINT,
        ADD COLUMN IF NOT EXISTS "incomeProtectionCover"    BIGINT,
        ADD COLUMN IF NOT EXISTS "confidenceMap"            JSONB,
        ADD COLUMN IF NOT EXISTS "conversationCompletedAt"  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "groupBFieldsCollected"    INTEGER NOT NULL DEFAULT 0
    `)

    // ── 2. intake_conversation_sessions ─────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "intake_conversation_sessions" (
        "conversationId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionToken"     VARCHAR(512) NOT NULL,
        "userId"           UUID,
        "history"          JSONB NOT NULL DEFAULT '[]',
        "collectedFields"  JSONB NOT NULL DEFAULT '{}',
        "turnCount"        INTEGER NOT NULL DEFAULT 0,
        "isComplete"       BOOLEAN NOT NULL DEFAULT FALSE,
        "expiresAt"        TIMESTAMPTZ NOT NULL,
        "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_intake_conv_session_token"
        ON "intake_conversation_sessions"("sessionToken")
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_intake_conv_expires_at"
        ON "intake_conversation_sessions"("expiresAt")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "intake_conversation_sessions"`)

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
        DROP COLUMN IF EXISTS "annualIncomeExact",
        DROP COLUMN IF EXISTS "dependantsDetail",
        DROP COLUMN IF EXISTS "personalLifeCover",
        DROP COLUMN IF EXISTS "employerGroupTerm",
        DROP COLUMN IF EXISTS "personalHealthCover",
        DROP COLUMN IF EXISTS "personalHealthIsFloater",
        DROP COLUMN IF EXISTS "employerMediclaim",
        DROP COLUMN IF EXISTS "ciCover",
        DROP COLUMN IF EXISTS "incomeProtectionCover",
        DROP COLUMN IF EXISTS "confidenceMap",
        DROP COLUMN IF EXISTS "conversationCompletedAt",
        DROP COLUMN IF EXISTS "groupBFieldsCollected"
    `)
  }
}
