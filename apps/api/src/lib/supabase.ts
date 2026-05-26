/**
 * Supabase client singleton (service-role, server-only).
 *
 * The service role key bypasses Row-Level Security; it MUST stay on the server
 * and never be bundled into the web client. Vercel project settings should
 * scope SUPABASE_SERVICE_ROLE_KEY to Production env only.
 *
 * If SUPABASE_URL is not configured (e.g. local dev with sql.js), this module
 * exports a null client. Callers must guard with `if (!supabase)` and either
 * skip the call or throw a clear error explaining the missing config.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) return null

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

export const SUPABASE_VAULT_BUCKET = 'kin-vault-documents'
