/**
 * OpenAI client singleton.
 *
 * Pattern from KIN Engineering Brief v1.4 §3.1. One process-wide OpenAI
 * instance with built-in retries and a 30s call timeout. The key is read
 * from the environment at first use (lazy) so importing this module never
 * crashes processes that don't actually call OpenAI (e.g. migration runner).
 */

import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (client) return client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'sk-REPLACE_ME') {
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
