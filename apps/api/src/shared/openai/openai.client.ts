/**
 * OpenAI client singleton.
 *
 * Pattern from KIN Engineering Brief v1.4 §3.1. One process-wide OpenAI
 * instance with built-in retries and a 30s call timeout. The key is read
 * from the environment at first use (lazy) so importing this module never
 * crashes processes that don't actually call OpenAI (e.g. migration runner).
 *
 * Demo mode: when KIN_DEMO_MODE=true, or when no OPENAI_API_KEY is set
 * outside production, a deterministic scripted client is returned instead
 * (see mock-openai.client.ts). Production without a key still throws so a
 * misconfigured deployment fails loudly rather than silently serving the
 * demo script. KIN_DEMO_MODE=false forces the real client everywhere.
 */

import OpenAI from 'openai'
import { createMockOpenAIClient } from './mock-openai.client'

const PLACEHOLDER_KEYS = new Set(['', 'sk-REPLACE_ME', 'sk-...'])

let client: OpenAI | null = null

export function isDemoMode(): boolean {
  const flag = process.env.KIN_DEMO_MODE
  if (flag === 'true') return true
  if (flag === 'false') return false
  const keyMissing = PLACEHOLDER_KEYS.has((process.env.OPENAI_API_KEY ?? '').trim())
  return keyMissing && (process.env.NODE_ENV ?? 'development') !== 'production'
}

export function getOpenAIClient(): OpenAI {
  if (client) return client
  if (isDemoMode()) {
    client = createMockOpenAIClient() as unknown as OpenAI
    return client
  }
  const apiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  if (PLACEHOLDER_KEYS.has(apiKey)) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  client = new OpenAI({
    apiKey,
    maxRetries: 3,
    timeout: 30_000,
  })
  return client
}

/** Test-only reset hook so unit tests can mock a fresh client per spec. */
export function __resetOpenAIClientForTests(): void {
  client = null
}
