import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Migration 001 — KIN Initial Schema
 *
 * Creates all core tables for MVP1:
 *   partner_config, user_profile, protection_score, recommendation_audit,
 *   vault_document, nominee, streak_record, unlock_trigger
 *
 * Security notes:
 *   - All UUIDs use gen_random_uuid() (pgcrypto)
 *   - recommendation_audit: NO DELETE/UPDATE policy enforced at DB level via trigger
 *   - vault_document.s3_key: never returned in bulk list queries (enforced in application layer)
 *   - Row-level security (RLS): enabled on vault_document, nominee (enforced in Phase 2 multi-tenant setup)
 *
 * IRDAI compliance:
 *   - recommendation_audit rows are immutable (trigger raises exception on UPDATE/DELETE)
 *   - 5-year retention: managed by S3 lifecycle rules on exported audit snapshots
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enable pgcrypto for UUID generation ──────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

    // ── partner_config ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "partner_config" (
        "partner_id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"              VARCHAR(255) NOT NULL,
        "brand_tokens"      JSONB NOT NULL DEFAULT '{}',
        "embed_origins"     TEXT[] NOT NULL DEFAULT '{}',
        "sso_config"        JSONB,
        "insurer_irdai_reg_no" VARCHAR(20),
        "insurer_full_name" VARCHAR(255),
        "logo_license_ref"  VARCHAR(255),
        "active"            BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // ── user_profile ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "income_band_enum" AS ENUM (
        'below_3l', '3l_6l', '6l_10l', '10l_20l', '20l_50l', 'above_50l'
      )
    `)
    await queryRunner.query(`
      CREATE TYPE "city_tier_enum" AS ENUM ('t1', 't2', 't3')
    `)
    await queryRunner.query(`
      CREATE TYPE "life_stage_enum" AS ENUM (
        'single', 'married_no_kids', 'married_with_kids', 'parent_caregiver'
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "user_profile" (
        "user_id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_token"          VARCHAR(512) UNIQUE,
        "income_band"            "income_band_enum",
        "city_tier"              "city_tier_enum",
        "dependants_count"       SMALLINT DEFAULT 0,
        "life_stage"             "life_stage_enum",
        "monthly_obligations_band" VARCHAR(50),
        "consented_pii"          BOOLEAN NOT NULL DEFAULT FALSE,
        "partner_id"             UUID REFERENCES "partner_config"("partner_id"),
        "created_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "last_active_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_user_profile_session_token" ON "user_profile"("session_token")`)
    await queryRunner.query(`CREATE INDEX "idx_user_profile_last_active_at" ON "user_profile"("last_active_at")`)

    // ── protection_score ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "protection_score" (
        "score_id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"               UUID NOT NULL REFERENCES "user_profile"("user_id") ON DELETE CASCADE,
        "composite_score"       NUMERIC(5,2) NOT NULL DEFAULT 0,
        "life_sub_score"        NUMERIC(5,2) NOT NULL DEFAULT 0,
        "health_sub_score"      NUMERIC(5,2) NOT NULL DEFAULT 0,
        "income_sub_score"      NUMERIC(5,2) NOT NULL DEFAULT 0,
        "hidden_coverage_total" NUMERIC(15,2) NOT NULL DEFAULT 0,
        "rule_version"          VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
        "calculated_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_protection_score_user_id" ON "protection_score"("user_id")`)
    await queryRunner.query(`CREATE INDEX "idx_protection_score_calculated_at" ON "protection_score"("calculated_at")`)

    // ── recommendation_audit (IMMUTABLE — IRDAI 5-year retention) ─
    await queryRunner.query(`
      CREATE TABLE "recommendation_audit" (
        "audit_id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "score_id"              UUID NOT NULL REFERENCES "protection_score"("score_id"),
        "recommendation_type"   VARCHAR(100) NOT NULL,
        "basis_text"            TEXT NOT NULL,
        "inputs_snapshot"       JSONB NOT NULL DEFAULT '{}',
        "irdai_rule_reference"  VARCHAR(255),
        "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_recommendation_audit_score_id" ON "recommendation_audit"("score_id")`)

    // DB-level immutability: prevent any UPDATE or DELETE on recommendation_audit
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_recommendation_audit_immutable()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'recommendation_audit is immutable — IRDAI 5-year retention policy. Record: %', OLD.audit_id;
      END;
      $$ LANGUAGE plpgsql
    `)
    await queryRunner.query(`
      CREATE TRIGGER tg_recommendation_audit_no_update
        BEFORE UPDATE ON "recommendation_audit"
        FOR EACH ROW EXECUTE FUNCTION fn_recommendation_audit_immutable()
    `)
    await queryRunner.query(`
      CREATE TRIGGER tg_recommendation_audit_no_delete
        BEFORE DELETE ON "recommendation_audit"
        FOR EACH ROW EXECUTE FUNCTION fn_recommendation_audit_immutable()
    `)

    // ── vault_document ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "doc_type_enum" AS ENUM (
        'term_life', 'health', 'vehicle', 'home', 'personal_accident',
        'travel', 'critical_illness', 'other'
      )
    `)
    await queryRunner.query(`
      CREATE TYPE "nominee_access_level_enum" AS ENUM ('full', 'policies_only', 'emergency_only')
    `)

    await queryRunner.query(`
      CREATE TABLE "vault_document" (
        "doc_id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"               UUID NOT NULL REFERENCES "user_profile"("user_id") ON DELETE CASCADE,
        "doc_type"              "doc_type_enum" NOT NULL,
        "insurer_name"          VARCHAR(255),
        "policy_number"         VARCHAR(100),
        "sum_assured"           NUMERIC(15,2),
        "annual_premium"        NUMERIC(10,2),
        "renewal_date"          DATE,
        "s3_key"                VARCHAR(512),    -- encrypted at rest; never returned in list
        "s3_upload_confirmed"   BOOLEAN DEFAULT FALSE,
        "nominee_id"            UUID,
        "nominee_access_level"  "nominee_access_level_enum" DEFAULT 'policies_only',
        "notes"                 TEXT,
        "file_name"             VARCHAR(255),
        "uploaded_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "last_verified_at"      TIMESTAMPTZ
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_vault_document_user_id" ON "vault_document"("user_id")`)

    // ── nominee ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "nominee" (
        "nominee_id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"           UUID NOT NULL REFERENCES "user_profile"("user_id") ON DELETE CASCADE,
        "name"              VARCHAR(255) NOT NULL,
        "relationship"      VARCHAR(100) NOT NULL,
        "mobile"            VARCHAR(15),
        "whatsapp"          VARCHAR(15),
        "email"             VARCHAR(255),
        "aadhaar_last4"     CHAR(4),             -- DPDP: only last 4 digits
        "share_percentage"  NUMERIC(5,2),
        "access_level"      "nominee_access_level_enum" NOT NULL DEFAULT 'policies_only',
        "verified"          BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_nominee_user_id" ON "nominee"("user_id")`)

    // ── streak_record ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "streak_record" (
        "streak_id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"               UUID NOT NULL UNIQUE REFERENCES "user_profile"("user_id") ON DELETE CASCADE,
        "current_streak_weeks"  SMALLINT NOT NULL DEFAULT 0,
        "longest_streak_weeks"  SMALLINT NOT NULL DEFAULT 0,
        "total_points"          INTEGER NOT NULL DEFAULT 0,
        "last_action_at"        TIMESTAMPTZ,
        "badges_earned"         JSONB NOT NULL DEFAULT '[]',
        "visit_dates"           TEXT[] NOT NULL DEFAULT '{}',
        "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_streak_record_user_id" ON "streak_record"("user_id")`)

    // ── unlock_trigger ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "trigger_type_enum" AS ENUM ('death_cert', 'deadman', 'trusted_contact', 'emergency')
    `)
    await queryRunner.query(`
      CREATE TYPE "trigger_status_enum" AS ENUM ('pending', 'active', 'resolved', 'cancelled')
    `)

    await queryRunner.query(`
      CREATE TABLE "unlock_trigger" (
        "trigger_id"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"       UUID NOT NULL REFERENCES "user_profile"("user_id") ON DELETE CASCADE,
        "trigger_type"  "trigger_type_enum" NOT NULL,
        "status"        "trigger_status_enum" NOT NULL DEFAULT 'pending',
        "unlock_token"  UUID UNIQUE DEFAULT gen_random_uuid(),
        "activated_at"  TIMESTAMPTZ,
        "resolved_at"   TIMESTAMPTZ,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_unlock_trigger_user_id" ON "unlock_trigger"("user_id")`)
    await queryRunner.query(`CREATE INDEX "idx_unlock_trigger_token" ON "unlock_trigger"("unlock_token")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "unlock_trigger" CASCADE`)
    await queryRunner.query(`DROP TYPE IF EXISTS "trigger_status_enum"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "trigger_type_enum"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "streak_record" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "nominee" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "vault_document" CASCADE`)
    await queryRunner.query(`DROP TYPE IF EXISTS "nominee_access_level_enum"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "doc_type_enum"`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS tg_recommendation_audit_no_delete ON "recommendation_audit"`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS tg_recommendation_audit_no_update ON "recommendation_audit"`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_recommendation_audit_immutable`)
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendation_audit" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "protection_score" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profile" CASCADE`)
    await queryRunner.query(`DROP TYPE IF EXISTS "life_stage_enum"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "city_tier_enum"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "income_band_enum"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_config" CASCADE`)
  }
}
