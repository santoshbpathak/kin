import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Migration 002 — Row Level Security policies
 *
 * The NestJS API connects with the Supabase SERVICE ROLE key and therefore
 * bypasses RLS for normal operations. These policies are defence-in-depth for
 * the day we issue a Supabase anon key to a client component (e.g. a vault
 * preview page that reads documents directly via the Supabase JS SDK).
 *
 * Strategy: every user-owned table gets RLS enabled. The default policy denies
 * everything; named policies grant access when the JWT-derived user id matches
 * the row's userId column. The convention used here is:
 *
 *   USING ("userId" = auth.uid())
 *
 * which Supabase Auth-issued JWTs satisfy because they include the user uuid
 * in the `sub` claim and Supabase auto-populates auth.uid() from it.
 *
 * For tables that do not have a userId column (recommendation_audits's user
 * link is via scoreId/userId on the same row), we add the policy directly
 * against userId.
 *
 * IMPORTANT: this migration is idempotent for the policy creation - it drops
 * any existing same-named policy first.
 */
export class RlsPolicies1700000000001 implements MigrationInterface {
  name = 'RlsPolicies1700000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'user_profiles',
      'protection_scores',
      'recommendation_audits',
      'vault_documents',
      'nominees',
      'streak_records',
      'unlock_triggers',
      'consent_records',
      'notification_prefs',
      'advisor_bookings',
      'quiz_attempts',
    ]

    for (const table of tables) {
      // Enable RLS - everyone is denied unless an explicit policy matches.
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)

      // For user_profiles, the row's PK *is* the userId.
      const userIdCol = table === 'user_profiles' ? '"userId"' : '"userId"'

      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_owner_select" ON "${table}"`)
      await queryRunner.query(`
        CREATE POLICY "${table}_owner_select" ON "${table}"
        FOR SELECT
        USING (${userIdCol} = auth.uid())
      `)

      // Inserts: caller's uid must equal the row's userId
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_owner_insert" ON "${table}"`)
      await queryRunner.query(`
        CREATE POLICY "${table}_owner_insert" ON "${table}"
        FOR INSERT
        WITH CHECK (${userIdCol} = auth.uid())
      `)

      // Updates: only update rows that the caller owns
      // (recommendation_audits is immutable - its trigger will still throw, this
      //  policy just prevents read-by-other paths from issuing UPDATEs)
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_owner_update" ON "${table}"`)
      await queryRunner.query(`
        CREATE POLICY "${table}_owner_update" ON "${table}"
        FOR UPDATE
        USING (${userIdCol} = auth.uid())
        WITH CHECK (${userIdCol} = auth.uid())
      `)

      // Deletes: same as update (and recommendation_audits trigger blocks anyway)
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_owner_delete" ON "${table}"`)
      await queryRunner.query(`
        CREATE POLICY "${table}_owner_delete" ON "${table}"
        FOR DELETE
        USING (${userIdCol} = auth.uid())
      `)
    }

    // otp_requests: no user uid at write time (the user is being created), so
    // we deny ALL access via the anon key. Only the service role can read/write.
    await queryRunner.query(`ALTER TABLE "otp_requests" ENABLE ROW LEVEL SECURITY`)
    // (No policies = deny-all under RLS for non-service-role roles.)

    // partner_configs: brand tokens are public-readable (the partner landing
    // page calls /partner/brand/:key without auth). Writes are service-role only.
    await queryRunner.query(`ALTER TABLE "partner_configs" ENABLE ROW LEVEL SECURITY`)
    await queryRunner.query(`DROP POLICY IF EXISTS "partner_configs_public_select" ON "partner_configs"`)
    await queryRunner.query(`
      CREATE POLICY "partner_configs_public_select" ON "partner_configs"
      FOR SELECT
      USING (active = TRUE)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'user_profiles',
      'protection_scores',
      'recommendation_audits',
      'vault_documents',
      'nominees',
      'streak_records',
      'unlock_triggers',
      'consent_records',
      'notification_prefs',
      'advisor_bookings',
      'quiz_attempts',
      'partner_configs',
      'otp_requests',
    ]
    for (const table of tables) {
      // Drop all policies we created (best-effort)
      const suffixes = ['owner_select', 'owner_insert', 'owner_update', 'owner_delete', 'public_select']
      for (const suffix of suffixes) {
        await queryRunner.query(`DROP POLICY IF EXISTS "${table}_${suffix}" ON "${table}"`)
      }
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`)
    }
  }
}
