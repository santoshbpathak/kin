import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Migration 004 — Advisory Sessions (Module B, PRD v1.4)
 *
 * Creates the advisor_sessions table that backs the three-tier advisory
 * connect layer:
 *   1. Tier 1 KIN AI assistant — transcript + frozen KIN report snapshot
 *   2. Tier 2 advisor chat       — advisorId + pre-brief
 *   3. Tier 3 advisor call       — same row, currentTier = 3
 *
 * The legacy advisor_bookings table (from migration 001) is preserved.
 * Tier 3 call bookings reuse it via a separate advisor_bookings row;
 * the connection is by userId, not FK, so they remain independent.
 */
export class AdvisorySessions1716903700000 implements MigrationInterface {
  name = 'AdvisorySessions1716903700000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "advisor_sessions" (
        "advisorSessionId"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"                    UUID NOT NULL,
        "sessionToken"              VARCHAR(512),
        "currentTier"               INTEGER NOT NULL DEFAULT 1,
        "tier1Transcript"           JSONB NOT NULL DEFAULT '[]',
        "kinReport"                 JSONB,
        "advisorBrief"              JSONB,
        "advisorId"                 UUID,
        "transcriptSharedConsent"   BOOLEAN NOT NULL DEFAULT FALSE,
        "tierUpgradedAt"            TIMESTAMPTZ,
        "turnCount"                 INTEGER NOT NULL DEFAULT 0,
        "createdAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_advisor_session_user"
        ON "advisor_sessions"("userId")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "advisor_sessions"`)
  }
}
