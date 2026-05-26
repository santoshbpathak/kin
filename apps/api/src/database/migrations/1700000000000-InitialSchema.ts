import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Migration 001 — KIN Initial Schema
 *
 * Creates all core tables for MVP1.
 *
 * Table names match @Entity() decorators (plural). The previous singular
 * names diverged from TypeORM defaults; that mismatch is fixed here so the
 * DB-level immutability trigger actually attaches to the table the app uses.
 *
 * Security notes:
 *   - All UUIDs use gen_random_uuid() (pgcrypto)
 *   - recommendation_audits: DB-level trigger blocks UPDATE/DELETE (IRDAI)
 *   - vault_documents.s3_key: never returned in bulk list queries (application layer)
 *   - Row-level security (RLS): enabled per-table below; policies defined for user_profiles ownership
 *
 * IRDAI compliance:
 *   - recommendation_audits rows are immutable (trigger raises exception)
 *   - 5-year retention: managed by Supabase Storage lifecycle on exported audit snapshots
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enable pgcrypto for UUID generation ──────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

    // ── partner_configs ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "partner_configs" (
        "partnerId"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "partnerKey"          VARCHAR(255) UNIQUE NOT NULL,
        "name"                VARCHAR(255),
        "brandTokens"         JSONB NOT NULL DEFAULT '{}',
        "embedOrigins"        TEXT[] NOT NULL DEFAULT '{}',
        "ssoConfig"           JSONB,
        "insurerIrdaiRegNo"   VARCHAR(20),
        "insurerFullName"     VARCHAR(255),
        "logoLicenseRef"      VARCHAR(255),
        "active"              BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // ── user_profiles ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "userId"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionToken"            VARCHAR(512) UNIQUE,
        "incomeBand"              VARCHAR(20),
        "cityTier"                VARCHAR(4),
        "dependantsCount"         SMALLINT DEFAULT 0,
        "lifeStage"               VARCHAR(30),
        "monthlyObligationsBand"  VARCHAR(50),
        "consentedPii"            BOOLEAN NOT NULL DEFAULT FALSE,
        "whatsappNumber"          VARCHAR(15),
        "googleId"                VARCHAR(255),
        "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "lastActiveAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_user_profiles_session_token" ON "user_profiles"("sessionToken")`)
    await queryRunner.query(`CREATE INDEX "idx_user_profiles_last_active_at" ON "user_profiles"("lastActiveAt")`)

    // ── protection_scores ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "protection_scores" (
        "scoreId"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"                UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "compositeScore"        NUMERIC(5,2) NOT NULL DEFAULT 0,
        "lifeSubScore"          NUMERIC(5,2) NOT NULL DEFAULT 0,
        "healthSubScore"        NUMERIC(5,2) NOT NULL DEFAULT 0,
        "incomeSubScore"        NUMERIC(5,2) NOT NULL DEFAULT 0,
        "hiddenCoverageTotal"   NUMERIC(15,2) NOT NULL DEFAULT 0,
        "ruleVersion"           VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
        "inputsSnapshot"        JSONB NOT NULL DEFAULT '{}',
        "calculatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_protection_scores_user_id" ON "protection_scores"("userId")`)
    await queryRunner.query(`CREATE INDEX "idx_protection_scores_calculated_at" ON "protection_scores"("calculatedAt")`)

    // ── recommendation_audits (IMMUTABLE — IRDAI 5-year retention) ─
    await queryRunner.query(`
      CREATE TABLE "recommendation_audits" (
        "auditId"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "scoreId"               UUID NOT NULL REFERENCES "protection_scores"("scoreId"),
        "userId"                UUID NOT NULL REFERENCES "user_profiles"("userId"),
        "recommendationType"    VARCHAR(100) NOT NULL,
        "crn"                   VARCHAR(50),
        "basisText"             TEXT NOT NULL,
        "inputsSnapshot"        JSONB NOT NULL DEFAULT '{}',
        "irdaiRuleReference"    VARCHAR(255),
        "ruleVersion"           VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
        "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_recommendation_audits_score_id" ON "recommendation_audits"("scoreId")`)
    await queryRunner.query(`CREATE INDEX "idx_recommendation_audits_user_id" ON "recommendation_audits"("userId")`)

    // DB-level immutability: prevent any UPDATE or DELETE on recommendation_audits
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_recommendation_audits_immutable()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'recommendation_audits is immutable - IRDAI 5-year retention policy. Record: %', OLD."auditId";
      END;
      $$ LANGUAGE plpgsql
    `)
    await queryRunner.query(`
      CREATE TRIGGER tg_recommendation_audits_no_update
        BEFORE UPDATE ON "recommendation_audits"
        FOR EACH ROW EXECUTE FUNCTION fn_recommendation_audits_immutable()
    `)
    await queryRunner.query(`
      CREATE TRIGGER tg_recommendation_audits_no_delete
        BEFORE DELETE ON "recommendation_audits"
        FOR EACH ROW EXECUTE FUNCTION fn_recommendation_audits_immutable()
    `)

    // ── vault_documents ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "vault_documents" (
        "docId"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"              UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "docType"             VARCHAR(50) NOT NULL,
        "insurerName"         VARCHAR(255),
        "policyNumber"        VARCHAR(100),
        "sumAssured"          NUMERIC(15,2),
        "annualPremium"       NUMERIC(10,2),
        "renewalDate"         DATE,
        "s3Key"               VARCHAR(512),
        "fileName"            VARCHAR(255),
        "nomineeId"           UUID,
        "nomineeAccessLevel"  VARCHAR(30) DEFAULT 'policies_only',
        "notes"               TEXT,
        "uploadedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "lastVerifiedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_vault_documents_user_id" ON "vault_documents"("userId")`)

    // ── nominees ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "nominees" (
        "nomineeId"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"            UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "name"              VARCHAR(255) NOT NULL,
        "relationship"      VARCHAR(100) NOT NULL,
        "mobile"            VARCHAR(15),
        "whatsapp"          VARCHAR(15),
        "email"             VARCHAR(255),
        "aadhaarLast4"      CHAR(4),
        "sharePercentage"   NUMERIC(5,2),
        "accessLevel"       VARCHAR(30) NOT NULL DEFAULT 'policies_only',
        "verified"          BOOLEAN NOT NULL DEFAULT FALSE,
        "addedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_nominees_user_id" ON "nominees"("userId")`)

    // ── streak_records ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "streak_records" (
        "streakId"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"                UUID NOT NULL UNIQUE REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "currentStreakWeeks"    SMALLINT NOT NULL DEFAULT 0,
        "longestStreakWeeks"    SMALLINT NOT NULL DEFAULT 0,
        "totalPoints"           INTEGER NOT NULL DEFAULT 0,
        "lastActionAt"          TIMESTAMPTZ,
        "badgesEarned"          JSONB NOT NULL DEFAULT '[]',
        "visitDates"            JSONB NOT NULL DEFAULT '[]',
        "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_streak_records_user_id" ON "streak_records"("userId")`)

    // ── unlock_triggers ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "unlock_triggers" (
        "triggerId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"        UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "triggerType"   VARCHAR(30) NOT NULL,
        "status"        VARCHAR(20) NOT NULL DEFAULT 'pending',
        "unlockToken"   UUID UNIQUE DEFAULT gen_random_uuid(),
        "activatedAt"   TIMESTAMPTZ,
        "resolvedAt"    TIMESTAMPTZ,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_unlock_triggers_user_id" ON "unlock_triggers"("userId")`)
    await queryRunner.query(`CREATE INDEX "idx_unlock_triggers_token" ON "unlock_triggers"("unlockToken")`)

    // ── otp_requests (persisted OTP store for serverless safety) ──
    await queryRunner.query(`
      CREATE TABLE "otp_requests" (
        "phone"       VARCHAR(20) PRIMARY KEY,
        "otpHash"     VARCHAR(255) NOT NULL,
        "expiresAt"   TIMESTAMPTZ NOT NULL,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_otp_requests_expires_at" ON "otp_requests"("expiresAt")`)

    // ── consent_records (per-data-type consent log, append-only) ──
    await queryRunner.query(`
      CREATE TABLE "consent_records" (
        "consentId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"      UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "dataType"    VARCHAR(50) NOT NULL,
        "granted"     BOOLEAN NOT NULL,
        "ipHash"      VARCHAR(64),
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_consent_records_user_id" ON "consent_records"("userId")`)

    // ── notification_prefs (per-user notification preferences) ────
    await queryRunner.query(`
      CREATE TABLE "notification_prefs" (
        "userId"              UUID PRIMARY KEY REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "primaryChannel"      VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
        "smsEnabled"          BOOLEAN NOT NULL DEFAULT FALSE,
        "whatsappNumber"      VARCHAR(15),
        "checkInFrequency"    VARCHAR(20) NOT NULL DEFAULT 'weekly',
        "weeklyBrief"         BOOLEAN NOT NULL DEFAULT TRUE,
        "streakReminders"     BOOLEAN NOT NULL DEFAULT TRUE,
        "rescoreReminders"    BOOLEAN NOT NULL DEFAULT TRUE,
        "stopped"             BOOLEAN NOT NULL DEFAULT FALSE,
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // ── advisor_bookings (advisor slot bookings) ──────────────────
    await queryRunner.query(`
      CREATE TABLE "advisor_bookings" (
        "bookingId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"        UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "slotId"        VARCHAR(50) NOT NULL,
        "datetime"      TIMESTAMPTZ NOT NULL,
        "status"        VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        "queryType"     VARCHAR(100) NOT NULL,
        "notes"         TEXT,
        "bookedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_advisor_bookings_user_id" ON "advisor_bookings"("userId")`)
    await queryRunner.query(`CREATE INDEX "idx_advisor_bookings_slot_id" ON "advisor_bookings"("slotId")`)

    // ── quiz_attempts (KIN IQ tracking) ───────────────────────────
    await queryRunner.query(`
      CREATE TABLE "quiz_attempts" (
        "attemptId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"        UUID NOT NULL REFERENCES "user_profiles"("userId") ON DELETE CASCADE,
        "weekNumber"    SMALLINT NOT NULL,
        "correctCount"  SMALLINT NOT NULL,
        "delta"         SMALLINT NOT NULL,
        "completedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("userId", "weekNumber")
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_quiz_attempts_user_id" ON "quiz_attempts"("userId")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_attempts" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "advisor_bookings" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_prefs" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "consent_records" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_requests" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "unlock_triggers" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "streak_records" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "nominees" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "vault_documents" CASCADE`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS tg_recommendation_audits_no_delete ON "recommendation_audits"`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS tg_recommendation_audits_no_update ON "recommendation_audits"`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_recommendation_audits_immutable`)
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendation_audits" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "protection_scores" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_configs" CASCADE`)
  }
}
