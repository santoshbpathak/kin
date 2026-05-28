/**
 * One-off smoke check: confirms the configured OPENAI_API_KEY can
 * reach OpenAI and that the two models we depend on (primary +
 * escalation) respond. The key itself is never printed.
 *
 * Run with: pnpm --filter api exec ts-node scripts/check-openai.ts
 */

import 'dotenv/config'
import OpenAI from 'openai'

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'sk-REPLACE_ME') {
    console.error('FAIL: OPENAI_API_KEY is not set (or still the placeholder).')
    process.exit(1)
  }

  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 20_000 })

  const primary = process.env.OPENAI_MODEL_PRIMARY ?? 'gpt-4o'
  const escalation = process.env.OPENAI_MODEL_ESCALATION ?? 'gpt-4o-mini'

  console.log(`Checking OpenAI access...`)
  console.log(`  primary model:    ${primary}`)
  console.log(`  escalation model: ${escalation}`)
  console.log('')

  const probe = async (model: string) => {
    const t0 = Date.now()
    const res = await client.chat.completions.create({
      model,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
    })
    const ms = Date.now() - t0
    const reply = res.choices[0]?.message?.content?.trim() ?? ''
    return { ms, reply, usage: res.usage }
  }

  try {
    const p = await probe(primary)
    console.log(`PASS  ${primary} — ${p.ms}ms reply="${p.reply}" tokens_in=${p.usage?.prompt_tokens} tokens_out=${p.usage?.completion_tokens}`)
  } catch (err) {
    console.error(`FAIL  ${primary}: ${(err as Error).message}`)
    process.exit(2)
  }

  try {
    const e = await probe(escalation)
    console.log(`PASS  ${escalation} — ${e.ms}ms reply="${e.reply}" tokens_in=${e.usage?.prompt_tokens} tokens_out=${e.usage?.completion_tokens}`)
  } catch (err) {
    console.error(`FAIL  ${escalation}: ${(err as Error).message}`)
    process.exit(3)
  }

  console.log('\nAll checks passed. The OPENAI_API_KEY is live and both models respond.')
}

main().catch(err => {
  console.error('Unexpected error:', (err as Error).message)
  process.exit(99)
})
