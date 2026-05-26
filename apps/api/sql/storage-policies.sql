-- KIN Vault — Supabase Storage RLS policies
--
-- IMPORTANT: The bucket itself must be created via the Supabase Dashboard UI
-- (Storage → New bucket) OR via the @supabase/supabase-js admin API with the
-- service role key. Direct INSERT into storage.buckets from the SQL Editor
-- is silently rejected by Supabase's permission model (the SQL Editor returns
-- "Success" but nothing is created).
--
-- To create the bucket via SDK (from apps/api with .env loaded):
--   set -a; source .env; set +a
--   node --input-type=module -e "
--     import { createClient } from '@supabase/supabase-js'
--     const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
--     await supabase.storage.createBucket('kin-vault-documents', {
--       public: false, fileSizeLimit: 5242880,
--       allowedMimeTypes: ['application/pdf','image/jpeg','image/png']
--     })
--   "
--
-- This file applies ONLY the RLS policies on storage.objects, which DOES work
-- via SQL Editor. Run after the bucket is created. Idempotent.

-- ── 1. Enable RLS on storage.objects ──────────────────────────────────────
alter table storage.objects enable row level security;

-- ── 2. Drop any existing same-named policies (idempotent) ─────────────────
drop policy if exists "kin_vault_owner_select" on storage.objects;
drop policy if exists "kin_vault_owner_insert" on storage.objects;
drop policy if exists "kin_vault_owner_update" on storage.objects;
drop policy if exists "kin_vault_owner_delete" on storage.objects;

-- ── 3. Owner-scoped read ──────────────────────────────────────────────────
-- Allow a user to download any object whose key begins with vault/<their uuid>/
create policy "kin_vault_owner_select" on storage.objects
  for select
  using (
    bucket_id = 'kin-vault-documents'
    and (storage.foldername(name))[1] = 'vault'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 4. Owner-scoped insert ────────────────────────────────────────────────
create policy "kin_vault_owner_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'kin-vault-documents'
    and (storage.foldername(name))[1] = 'vault'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 5. Owner-scoped update ────────────────────────────────────────────────
create policy "kin_vault_owner_update" on storage.objects
  for update
  using (
    bucket_id = 'kin-vault-documents'
    and (storage.foldername(name))[1] = 'vault'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 6. Owner-scoped delete ────────────────────────────────────────────────
create policy "kin_vault_owner_delete" on storage.objects
  for delete
  using (
    bucket_id = 'kin-vault-documents'
    and (storage.foldername(name))[1] = 'vault'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── Verify:
--   select id, public, file_size_limit from storage.buckets where id = 'kin-vault-documents';
--   select policyname from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname like 'kin_vault%';
