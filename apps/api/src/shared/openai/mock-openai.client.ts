/**
 * mock-openai.client.ts — scripted stand-in for the OpenAI client.
 *
 * Used in demo mode (KIN_DEMO_MODE=true, or no OPENAI_API_KEY outside
 * production). Fully deterministic, offline and free: no network calls, no
 * paid API, no real model. It implements only the slice of the OpenAI SDK
 * surface the KIN services read (`chat.completions.create` returning
 * `choices[0].message.content`) and dispatches on the system prompt so each
 * caller gets a well-formed JSON reply in the shape it expects:
 *
 *   - INTAKE_SYSTEM_PROMPT      -> a fixed 12-question diagnostic script
 *   - EXTRACTION_SYSTEM_PROMPT  -> {} (the live collectedFields already hold
 *                                  everything the script collected)
 *   - advisor system prompt     -> short canned explanations of the report
 *   - ESCALATION prompt         -> never escalates
 *   - ADVISOR_BRIEF prompt      -> three fixed lines
 *
 * The script is intentionally simple. It exists so a new developer can run
 * the full diagnostic -> score -> recommendations -> advisor journey with
 * nothing but `pnpm dev:local`. It is NOT a substitute for the real agent.
 */

import { INTAKE_SYSTEM_PROMPT, EXTRACTION_SYSTEM_PROMPT } from '../../modules/diagnostic/agent/intake-agent.prompts'
import { ESCALATION_DETECTION_PROMPT, ADVISOR_BRIEF_PROMPT } from '../../modules/connect/advisory/ai-advisor.prompts'
import { getCityTier } from '../../modules/diagnostic/city-tier.constants'

export interface MockChatMessage {
  role: string
  content: unknown
}

export interface MockCreateParams {
  messages: MockChatMessage[]
  model?: string
  [key: string]: unknown
}

export interface MockCompletion {
  id: string
  model: string
  choices: Array<{ index: number; message: { role: 'assistant'; content: string } }>
}

export const DEMO_COMPLETE_MESSAGE =
  'Great — I have everything I need to calculate your Protection Score. Give me a moment...'

const REASK_PREFIX = "Sorry, I didn't catch that. "

// ── Amount parsing ──────────────────────────────────────────────────────

/**
 * Parse a rupee amount from free text. Returns:
 *   number      -> parsed rupees (0 for "none"/"no"/"nil")
 *   'skipped'   -> user declined
 *   null        -> unparseable (the script re-asks)
 *
 * Rules: "1 crore"/"1cr" = 1e7, "25 lakh"/"25L"/"25 lac" = 1e5 each,
 * "50k" = 1e3 each. A bare number >= 10,000 is taken as rupees; a bare
 * number below that is taken as lakhs (people say "50" meaning ₹50 lakh).
 */
export function parseAmount(text: string): number | 'skipped' | null {
  const t = text.trim().toLowerCase().replace(/[,₹]/g, '')
  if (!t) return null
  if (/^(skip|skipped|not sure|unsure|don'?t know|i'?ll type it)$/.test(t) || t.startsWith('skip')) return 'skipped'
  if (/^(none|no|nil|nothing|zero|0|i don'?t have (any|one)|don'?t have)$/.test(t) || t.startsWith('none') || t.startsWith('no ')) return 0
  const m = t.match(/(\d+(?:\.\d+)?)\s*(crore|crores|cr|lakhs|lakh|lacs|lac|l|k|thousand)?/)
  if (!m) return null
  const n = parseFloat(m[1])
  if (!Number.isFinite(n) || n < 0) return null
  const unit = m[2]
  if (unit === 'crore' || unit === 'crores' || unit === 'cr') return Math.round(n * 1e7)
  if (unit === 'lakh' || unit === 'lakhs' || unit === 'lac' || unit === 'lacs' || unit === 'l') return Math.round(n * 1e5)
  if (unit === 'k' || unit === 'thousand') return Math.round(n * 1e3)
  return n >= 10_000 ? Math.round(n) : Math.round(n * 1e5)
}

function incomeBandFor(rupees: number): '<5L' | '5-10L' | '10-20L' | '20-40L' | '40L+' {
  if (rupees < 500_000) return '<5L'
  if (rupees < 1_000_000) return '5-10L'
  if (rupees < 2_000_000) return '10-20L'
  if (rupees < 4_000_000) return '20-40L'
  return '40L+'
}

// ── Scripted intake steps ───────────────────────────────────────────────

type Collected = Record<string, unknown>
type Parser = (answer: string, soFar: Collected) => Collected | null

interface ScriptStep {
  prompt: string
  options: string[]
  parse: Parser
}

const AMOUNT_OPTIONS = ['None', '₹5 lakh', '₹25 lakh', '₹50 lakh', '₹1 crore', 'Skip']

function confidence(fields: Collected): Collected {
  const conf: Record<string, 'confirmed' | 'unknown'> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (k === '__confidence') continue
    conf[k] = v === 'skipped' ? 'unknown' : 'confirmed'
  }
  return { ...fields, __confidence: conf }
}

function amountStep(key: string, prompt: string): ScriptStep {
  return {
    prompt,
    options: AMOUNT_OPTIONS,
    parse: answer => {
      const v = parseAmount(answer)
      if (v === null) return null
      return confidence({ [key]: v })
    },
  }
}

export const DEMO_INTAKE_STEPS: ScriptStep[] = [
  {
    prompt: "Hi! I'm KIN's wellness assistant running in demo mode. I'll ask a few quick questions to build your Protection Score. Which life stage best describes you right now?",
    options: ['Single', 'Married, no kids', 'Married with kids', "I'm a caregiver for parents"],
    parse: answer => {
      const a = answer.toLowerCase()
      let stage: string | null = null
      if (a.includes('caregiver') || a.includes('parent')) stage = 'parent_caregiver'
      else if (a.includes('married') && (a.includes('kid') || a.includes('child')) && !a.includes('no kid')) stage = 'married_with_kids'
      else if (a.includes('married')) stage = 'married_no_kids'
      else if (a.includes('single') || a.includes('unmarried')) stage = 'single'
      if (!stage) return null
      return confidence({ life_stage: stage })
    },
  },
  {
    prompt: 'How many people depend on your income — spouse, children, parents?',
    options: ['0', '1', '2', '3', '4+'],
    parse: (answer, soFar) => {
      const m = answer.match(/\d+/)
      const none = /^(none|no one|nobody|zero)/i.test(answer.trim())
      if (!m && !none) return null
      const count = none ? 0 : Math.min(10, parseInt(m![0], 10))
      const dependants: Array<{ type: string; count: number }> = []
      const married = soFar.life_stage === 'married_no_kids' || soFar.life_stage === 'married_with_kids'
      let remaining = count
      if (married && remaining > 0) { dependants.push({ type: 'spouse', count: 1 }); remaining -= 1 }
      if (remaining > 0) dependants.push({ type: soFar.life_stage === 'parent_caregiver' ? 'parent' : 'child', count: remaining })
      return confidence({ dependants_count: count, dependants })
    },
  },
  {
    prompt: "What's your approximate annual income? A range is fine, or share an exact figure if you prefer.",
    options: ['Under ₹5L', '₹5–10L', '₹10–20L', '₹20–40L', '₹40L+', "I'll type it"],
    parse: answer => {
      const a = answer.toLowerCase().replace(/\s+/g, '')
      if (a.includes('under') || a.includes('<5') || a.includes('below5')) return confidence({ annual_income_band: '<5L' })
      if (a.includes('5–10') || a.includes('5-10')) return confidence({ annual_income_band: '5-10L' })
      if (a.includes('10–20') || a.includes('10-20')) return confidence({ annual_income_band: '10-20L' })
      if (a.includes('20–40') || a.includes('20-40')) return confidence({ annual_income_band: '20-40L' })
      if (a.includes('40l+') || a.includes('40+') || a.includes('above40')) return confidence({ annual_income_band: '40L+' })
      const v = parseAmount(answer)
      if (v === null || v === 'skipped') return null
      return confidence({ annual_income_exact: v, annual_income_band: incomeBandFor(v) })
    },
  },
  {
    prompt: 'How do you earn — salaried, self-employed, business owner, or something else?',
    options: ['Salaried', 'Self-employed', 'Business owner', 'Other'],
    parse: answer => {
      const a = answer.toLowerCase()
      let cat: string | null = null
      if (a.includes('salar') || a.includes('job') || a.includes('employ') && !a.includes('self')) cat = 'salaried'
      else if (a.includes('self') || a.includes('freelanc') || a.includes('consult')) cat = 'self_employed'
      else if (a.includes('business') || a.includes('owner') || a.includes('shop')) cat = 'business_owner'
      else if (a.includes('other') || a.includes('retire') || a.includes('student') || a.includes('home')) cat = 'other'
      if (!cat) return null
      return confidence({ occupation_category: cat })
    },
  },
  {
    prompt: 'Which city do you live in? I only use this for peer benchmarks, never your address.',
    options: ['Mumbai', 'Bengaluru', 'Pune', 'Jaipur', "I'll type it"],
    parse: answer => {
      const city = answer.trim()
      if (!city || city.length > 60 || /^i'?ll type it$/i.test(city)) return null
      return confidence({ city, city_tier: getCityTier(city) })
    },
  },
  {
    prompt: 'Roughly how much goes out every month in EMIs and fixed commitments?',
    options: ['None', 'Under ₹10K', '₹10K–30K', '₹30K–50K', '₹50K+'],
    parse: answer => {
      const a = answer.toLowerCase().replace(/\s+/g, '')
      if (a.startsWith('none') || a === 'no' || a === '0' || a.includes('nothing')) return confidence({ monthly_obligations_band: '<10K', monthly_obligations_exact: 0 })
      if (a.includes('under') || a.includes('<10')) return confidence({ monthly_obligations_band: '<10K' })
      if (a.includes('10k–30k') || a.includes('10k-30k') || a.includes('10-30')) return confidence({ monthly_obligations_band: '10K-30K' })
      if (a.includes('30k–50k') || a.includes('30k-50k') || a.includes('30-50')) return confidence({ monthly_obligations_band: '30K-50K' })
      if (a.includes('50k+') || a.includes('50+') || a.includes('above50')) return confidence({ monthly_obligations_band: '50K+' })
      const v = parseAmount(answer)
      if (v === null) return null
      if (v === 'skipped') return confidence({ monthly_obligations_band: 'skipped' })
      const band = v < 10_000 ? '<10K' : v < 30_000 ? '10K-30K' : v < 50_000 ? '30K-50K' : '50K+'
      return confidence({ monthly_obligations_band: band, monthly_obligations_exact: v })
    },
  },
  amountStep('personal_life_cover_amount', 'Now your existing cover. Do you have a personal term life policy? If so, what is the sum assured?'),
  amountStep('employer_group_term_amount', 'Does your employer provide group term life cover? What amount, if you know it?'),
  amountStep('personal_health_cover_amount', 'Do you have a personal health insurance policy? What is the sum insured?'),
  amountStep('employer_mediclaim_amount', 'Does your employer provide a mediclaim or group health cover? What amount?'),
  amountStep('ci_cover_amount', 'Any critical illness cover, standalone or as a rider?'),
  amountStep('income_protection_cover_amount', 'Last one: any income protection or disability cover that would pay your EMIs if you could not work?'),
]

interface IntakeReply {
  message: string
  quickSelectOptions: string[]
  collectedFields: Collected
  isComplete: boolean
}

/**
 * Replay every user turn through the script to find the current step, then
 * answer the latest turn. Pure function of the message list.
 */
export function scriptedIntakeTurn(messages: MockChatMessage[]): IntakeReply {
  const userTurns = messages
    .filter(m => m.role === 'user')
    .map(m => String(m.content ?? ''))
    .filter(t => !t.startsWith('__BEGIN__'))

  let step = 0
  const soFar: Collected = {}
  let lastDelta: Collected | null = null
  let lastParseFailed = false

  for (const turn of userTurns) {
    if (step >= DEMO_INTAKE_STEPS.length) break
    const delta = DEMO_INTAKE_STEPS[step].parse(turn, soFar)
    if (delta) {
      lastDelta = delta
      lastParseFailed = false
      for (const [k, v] of Object.entries(delta)) {
        if (k === '__confidence') soFar.__confidence = { ...(soFar.__confidence as object ?? {}), ...(v as object) }
        else soFar[k] = v
      }
      step += 1
    } else {
      lastDelta = null
      lastParseFailed = true
    }
  }

  if (step >= DEMO_INTAKE_STEPS.length) {
    return {
      message: DEMO_COMPLETE_MESSAGE,
      quickSelectOptions: [],
      collectedFields: lastDelta ?? {},
      isComplete: true,
    }
  }

  const next = DEMO_INTAKE_STEPS[step]
  return {
    message: (lastParseFailed ? REASK_PREFIX : '') + next.prompt,
    quickSelectOptions: next.options,
    collectedFields: lastDelta ?? {},
    isComplete: false,
  }
}

// ── Advisor replies ─────────────────────────────────────────────────────

function scriptedAdvisorReply(messages: MockChatMessage[]): string {
  const system = String(messages.find(m => m.role === 'system')?.content ?? '')
  const lastUser = String([...messages].reverse().find(m => m.role === 'user')?.content ?? '')
  if (lastUser.startsWith('__BEGIN__')) {
    return "Hi, I'm KIN's AI assistant. I have your Protection Score report in front of me — what would you like to understand first? (Demo mode: my answers are scripted.)"
  }
  const score = system.match(/Protection Score: (\d+(?:\.\d+)?)\/100/)?.[1]
  const q = lastUser.toLowerCase()
  if (q.includes('life') || q.includes('term')) {
    return 'Life protection compares the cover your family would receive with ten times your annual income, which is the rule of thumb KIN uses for income replacement. Closing that gap is usually the single biggest improvement. (Demo mode: scripted answer.)'
  }
  if (q.includes('health') || q.includes('medic') || q.includes('hospital')) {
    return 'Health protection compares your usable health cover with three times your annual income, scaled up for dependants. Employer mediclaim counts at seventy percent because it ends when the job does. (Demo mode: scripted answer.)'
  }
  if (q.includes('income') || q.includes('emi') || q.includes('loan')) {
    return 'Income protection checks whether twenty-four months of your EMIs and fixed commitments would be covered if you could not work. If you have no obligations, this part of the score is treated as covered. (Demo mode: scripted answer.)'
  }
  if (q.includes('score') || q.includes('why') || q.includes('how')) {
    return `Your Protection Score${score ? ` of ${score}` : ''} is a weighted blend: life protection forty percent, health thirty-five percent, income protection twenty-five percent. Tap "See the Math" on any recommendation for the exact figures behind it. (Demo mode: scripted answer.)`
  }
  return 'I can explain any part of your report: the life, health or income sub-scores, the gaps behind them, or what each recommendation is based on. Which would you like? (Demo mode: scripted answer.)'
}

// ── Router ──────────────────────────────────────────────────────────────

export function scriptedCompletion(messages: MockChatMessage[]): string {
  const system = String(messages.find(m => m.role === 'system')?.content ?? '')
  if (system === INTAKE_SYSTEM_PROMPT) return JSON.stringify(scriptedIntakeTurn(messages))
  if (system === EXTRACTION_SYSTEM_PROMPT) return JSON.stringify({})
  if (system === ESCALATION_DETECTION_PROMPT) {
    return JSON.stringify({ shouldEscalate: false, reason: null, escalationMessage: null })
  }
  if (system === ADVISOR_BRIEF_PROMPT) {
    return JSON.stringify({
      line1: 'Demo user reviewed their Protection Score and largest coverage gap.',
      line2: 'Asked how the life, health and income sub-scores are calculated.',
      line3: 'Start by confirming the top recommendation and the figures behind it.',
    })
  }
  if (system.includes("KIN's AI assistant")) return JSON.stringify({ message: scriptedAdvisorReply(messages) })
  return JSON.stringify({ message: 'Demo mode: no scripted response is defined for this prompt.' })
}

let counter = 0

export function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: async (params: MockCreateParams): Promise<MockCompletion> => ({
          id: `demo-${++counter}`,
          model: String(params.model ?? 'demo'),
          choices: [{ index: 0, message: { role: 'assistant', content: scriptedCompletion(params.messages ?? []) } }],
        }),
      },
    },
  }
}
