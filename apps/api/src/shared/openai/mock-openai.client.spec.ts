import { createMockOpenAIClient, parseAmount, scriptedIntakeTurn, DEMO_COMPLETE_MESSAGE, DEMO_INTAKE_STEPS } from './mock-openai.client'
import { INTAKE_SYSTEM_PROMPT, EXTRACTION_SYSTEM_PROMPT } from '../../modules/diagnostic/agent/intake-agent.prompts'
import { ESCALATION_DETECTION_PROMPT, ADVISOR_BRIEF_PROMPT } from '../../modules/connect/advisory/ai-advisor.prompts'
import { isDemoMode, getOpenAIClient, __resetOpenAIClientForTests } from './openai.client'
import { isConversationComplete } from '../../modules/diagnostic/agent/intake-agent.service'
import type { CollectedFields } from '../../modules/diagnostic/agent/intake-agent.types'

type Msg = { role: string; content: string }

/** Drive the scripted agent exactly the way IntakeAgentService does. */
async function runDiagnostic(answers: string[]) {
  const client = createMockOpenAIClient()
  const history: Msg[] = [{ role: 'system', content: INTAKE_SYSTEM_PROMPT }]
  let collected: Record<string, unknown> = {}
  let turns = 0
  let reply = JSON.parse((await client.chat.completions.create({ messages: history })).choices[0].message.content)
  history.push({ role: 'assistant', content: reply.message })
  for (const answer of answers) {
    history.push({ role: 'user', content: answer })
    const res = await client.chat.completions.create({ messages: history })
    reply = JSON.parse(res.choices[0].message.content)
    history.push({ role: 'assistant', content: reply.message })
    // merge exactly like IntakeAgentService.mergeCollected (confidence map is deep-merged)
    const { __confidence, ...rest } = reply.collectedFields as Record<string, unknown>
    collected = { ...collected, ...rest, __confidence: { ...(collected.__confidence as object ?? {}), ...(__confidence as object ?? {}) } }
    turns += 1
    if (reply.isComplete) break
  }
  return { reply, collected, turns }
}

const HAPPY_PATH = [
  'Married with kids', '3', '₹10–20L', 'Salaried', 'Pune', '₹10K–30K',
  '50 lakh', 'None', '10 lakh', '5L', 'Skip', 'none',
]

describe('scripted intake (demo mode)', () => {
  it('completes the diagnostic in one pass and collects every hard-rule field', async () => {
    const { reply, collected, turns } = await runDiagnostic(HAPPY_PATH)
    expect(reply.isComplete).toBe(true)
    expect(reply.message).toBe(DEMO_COMPLETE_MESSAGE)
    expect(turns).toBe(DEMO_INTAKE_STEPS.length)
    expect(collected).toMatchObject({
      life_stage: 'married_with_kids',
      dependants_count: 3,
      annual_income_band: '10-20L',
      occupation_category: 'salaried',
      city: 'Pune',
      city_tier: 'T1',
      monthly_obligations_band: '10K-30K',
      personal_life_cover_amount: 5_000_000,
      employer_group_term_amount: 0,
      personal_health_cover_amount: 1_000_000,
      employer_mediclaim_amount: 500_000,
      ci_cover_amount: 'skipped',
      income_protection_cover_amount: 0,
    })
    expect(isConversationComplete(collected as CollectedFields)).toBe(true)
    expect((collected.__confidence as Record<string, string>).ci_cover_amount).toBe('unknown')
    expect((collected.__confidence as Record<string, string>).city).toBe('confirmed')
  })

  it('re-asks the same question when an answer cannot be parsed', async () => {
    const { reply, turns } = await runDiagnostic(['???'])
    expect(turns).toBe(1)
    expect(reply.isComplete).toBe(false)
    expect(reply.message).toMatch(/^Sorry, I didn't catch that/)
    expect(reply.quickSelectOptions).toEqual(DEMO_INTAKE_STEPS[0].options)
  })

  it('is a pure function of the message list', () => {
    const msgs = [{ role: 'system', content: INTAKE_SYSTEM_PROMPT }, { role: 'user', content: 'Single' }]
    expect(scriptedIntakeTurn(msgs)).toEqual(scriptedIntakeTurn(msgs))
  })
})

describe('parseAmount', () => {
  it.each([
    ['1 crore', 10_000_000],
    ['1.5 Cr', 15_000_000],
    ['25 lakh', 2_500_000],
    ['₹50L', 5_000_000],
    ['5,00,000', 500_000],
    ['50k', 50_000],
    ['75', 7_500_000],
    ['None', 0],
    ['no', 0],
    ['Skip', 'skipped'],
    ['not sure', 'skipped'],
    ['hello', null],
  ])('parseAmount(%p) -> %p', (input, expected) => {
    expect(parseAmount(input)).toBe(expected)
  })
})

describe('router for the other prompts', () => {
  const client = createMockOpenAIClient()
  const content = async (system: string, user: string) =>
    (await client.chat.completions.create({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })).choices[0].message.content

  it('extraction returns an empty object (live collectedFields are authoritative)', async () => {
    expect(JSON.parse(await content(EXTRACTION_SYSTEM_PROMPT, 'USER: hi'))).toEqual({})
  })
  it('escalation never escalates', async () => {
    expect(JSON.parse(await content(ESCALATION_DETECTION_PROMPT, 'x'))).toEqual({ shouldEscalate: false, reason: null, escalationMessage: null })
  })
  it('advisor brief returns three lines', async () => {
    const b = JSON.parse(await content(ADVISOR_BRIEF_PROMPT, 'x'))
    expect(Object.keys(b).sort()).toEqual(['line1', 'line2', 'line3'])
  })
  it('advisor replies never name an insurer or quote a premium', async () => {
    const sys = "You are KIN's AI wellness assistant ... Hi, I'm KIN's AI assistant ... Protection Score: 42/100"
    for (const q of ['__BEGIN__', 'why is my score low?', 'tell me about life cover', 'health?', 'my EMI', 'random'])
      {
        const m = JSON.parse(await content(sys, q)).message as string
        expect(m.length).toBeGreaterThan(20)
        expect(m).not.toMatch(/hdfc|lic\b|icici|premium of/i)
      }
  })
})

describe('isDemoMode / getOpenAIClient', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
    __resetOpenAIClientForTests()
  })

  it('is on when KIN_DEMO_MODE=true regardless of key', () => {
    process.env.KIN_DEMO_MODE = 'true'
    process.env.OPENAI_API_KEY = 'sk-real-looking'
    expect(isDemoMode()).toBe(true)
  })
  it('is off when KIN_DEMO_MODE=false even without a key', () => {
    process.env.KIN_DEMO_MODE = 'false'
    delete process.env.OPENAI_API_KEY
    expect(isDemoMode()).toBe(false)
    expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is not set')
  })
  it('defaults to demo outside production when the key is missing or a placeholder', () => {
    delete process.env.KIN_DEMO_MODE
    process.env.NODE_ENV = 'development'
    process.env.OPENAI_API_KEY = 'sk-REPLACE_ME'
    expect(isDemoMode()).toBe(true)
    expect(typeof getOpenAIClient().chat.completions.create).toBe('function')
  })
  it('never silently falls back to demo in production', () => {
    delete process.env.KIN_DEMO_MODE
    process.env.NODE_ENV = 'production'
    delete process.env.OPENAI_API_KEY
    expect(isDemoMode()).toBe(false)
    expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is not set')
  })
})
