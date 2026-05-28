import { ConfigService } from '@nestjs/config'
import { EscalationDetectorService } from './escalation-detector.service'
import type { AdvisorSessionMessage } from '../../../database/entities/advisor-session.entity'

/**
 * These tests cover the regex-based fast path. The LLM fallback path is
 * not exercised here — the service catches getOpenAIClient errors when
 * no key is set and returns "no escalation", which is the safe default.
 */

const stubConfig = new ConfigService({})

function ts(): string {
  return new Date().toISOString()
}

describe('EscalationDetectorService.check (regex fast path)', () => {
  const detector = new EscalationDetectorService(stubConfig)

  it('fires on "which company should I buy from" (Brief §5)', async () => {
    const r = await detector.check([], 'Which company should I buy from?')
    expect(r.shouldEscalate).toBe(true)
    expect(r.reason).toBe('product_recommendation')
    expect(r.escalationMessage).toMatch(/connect you to one right now/i)
  })

  it('fires on a generic product-recommendation ask', async () => {
    const r = await detector.check([], 'What policy is best for me?')
    expect(r.shouldEscalate).toBe(true)
    expect(r.reason).toBe('product_recommendation')
  })

  it('fires when the user expresses frustration', async () => {
    const r = await detector.check([], 'This is useless.')
    expect(r.shouldEscalate).toBe(true)
    expect(r.reason).toBe('user_frustration')
  })

  it('fires on complex-situation keywords (NRI tax)', async () => {
    const r = await detector.check([], 'I am an NRI with rental income — how do taxes work?')
    expect(r.shouldEscalate).toBe(true)
    expect(r.reason).toBe('complex_situation')
  })

  it('fires when the user repeats the exact same question', async () => {
    const history: AdvisorSessionMessage[] = [
      { role: 'user', content: 'How is my life score calculated?', ts: ts() },
      { role: 'assistant', content: 'It uses 10x your income vs your existing term cover.', ts: ts() },
    ]
    const r = await detector.check(history, 'How is my life score calculated?')
    expect(r.shouldEscalate).toBe(true)
    expect(r.reason).toBe('repeated_question')
  })

  it('does not fire on a benign question (LLM fallback returns "no" without a key)', async () => {
    const r = await detector.check([], 'What does my Protection Score mean?')
    expect(r.shouldEscalate).toBe(false)
    expect(r.reason).toBeNull()
    expect(r.escalationMessage).toBeNull()
  })
})
