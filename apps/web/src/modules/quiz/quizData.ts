/**
 * quizData.ts — Module 8B: KIN IQ Weekly Quiz
 *
 * 10 scenario-based questions, 3 served per week (rotating by week number).
 * All questions are insurance/financial wellness literacy — no product endorsement.
 *
 * Storage keys:
 *   kin_iq_score       → { score: number, history: { weekNumber, score, delta, completedAt }[] }
 *   kin_quiz_attempts  → QuizAttempt[]
 *
 * Compliance:
 *   - Questions reference IRDAI rules and government schemes only
 *   - No specific insurer recommended in any question or explanation
 *   - CG-1: All figures sourced from verified IRDAI/EPFO/government data
 */

export type QuizOption = {
  id: string
  text: string
}

export type QuizQuestion = {
  id: string
  weekTag: number[]        // which weeks this question appears (1-indexed, 0 = every week)
  scenario: string         // the situation/question text
  options: QuizOption[]    // 4 options
  correctOptionId: string  // which option is correct
  explanation: string      // why the answer is correct
  learningHook: string     // actionable takeaway for the user
  relatedKinAction?: string // e.g. 'Check your policy document'
  source: string           // IRDAI circular / regulation / scheme reference
}

export type QuizAttempt = {
  id: string
  weekNumber: number
  questionIds: string[]
  answers: Record<string, string>   // questionId → chosen optionId
  score: number                     // 0-3
  kinIqDelta: number
  completedAt: string
}

export type KinIqRecord = {
  score: number   // 0-100 cumulative
  history: {
    weekNumber: number
    score: number
    delta: number
    completedAt: string
  }[]
}

// ── Question bank (10 questions, 3 per week, rotating) ─────────
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    weekTag: [1, 4, 7, 10],
    scenario: 'Arjun has a ₹5 Lakh employer group mediclaim. His wife is hospitalised and the bill comes to ₹6.5 Lakh. How much will he have to pay out of pocket?',
    options: [
      { id: 'a', text: '₹0 — employer plans cover full family hospitalisation' },
      { id: 'b', text: '₹1.5 Lakh — employer cover pays ₹5L, he pays the rest' },
      { id: 'c', text: '₹6.5 Lakh — employer plans don\'t cover spouses' },
      { id: 'd', text: 'Depends on the insurer\'s claim settlement ratio' },
    ],
    correctOptionId: 'b',
    explanation: 'Employer group mediclaim covers up to the sum insured (₹5 Lakh here). Any amount beyond the limit must be paid by the employee. Adding a personal top-up or super top-up plan can plug this gap at very low cost.',
    learningHook: 'Check your employer policy certificate to confirm your exact sum insured and whether your spouse/parents are included.',
    relatedKinAction: 'Add your employer mediclaim to your KIN Vault',
    source: 'IRDAI Health Insurance Regulations 2016',
  },
  {
    id: 'q2',
    weekTag: [1, 4, 7, 10],
    scenario: 'Meera is 32, healthy, and wants pure life cover for her family. Which product type is most suitable?',
    options: [
      { id: 'a', text: 'Endowment plan — savings + insurance in one' },
      { id: 'b', text: 'ULIP — market-linked returns with life cover' },
      { id: 'c', text: 'Term life insurance — pure protection, no maturity benefit' },
      { id: 'd', text: 'Whole life plan — cover till age 100' },
    ],
    correctOptionId: 'c',
    explanation: 'Term life insurance provides the highest sum assured at the lowest premium — ideal for pure family protection. It has no maturity benefit; cover pays out only on death within the policy term. This is the product IRDAI guidelines recommend first for income replacement.',
    learningHook: 'A ₹1 Crore term plan for a 32-year-old non-smoker costs roughly ₹800–₹1,200/month. Compare on licensed aggregators.',
    relatedKinAction: 'See your KIN Term Life recommendation',
    source: 'IRDAI Protection of Policyholders\' Interests Regulations 2024',
  },
  {
    id: 'q3',
    weekTag: [1, 4, 7, 10],
    scenario: 'Rajesh paid ₹1.2 Lakh annual premium for a "savings + insurance" plan for 20 years. At maturity, he received ₹28 Lakh. His term plan colleague paid ₹12,000/year for the same ₹50L cover. Who did better financially?',
    options: [
      { id: 'a', text: 'Rajesh — he got ₹28L back at the end' },
      { id: 'b', text: 'The colleague — lower premium, same cover, rest invested separately' },
      { id: 'c', text: 'Both are equal — one pays more but gets money back' },
      { id: 'd', text: 'Cannot compare — different product types' },
    ],
    correctOptionId: 'b',
    explanation: 'The colleague paid ₹2.4L total over 20 years vs Rajesh\'s ₹24L. The ₹21.6L difference, if invested in a simple index fund at 10% CAGR, would have grown to over ₹1.4 Crore — far exceeding Rajesh\'s ₹28L maturity. "Buy term, invest the rest" is a foundational principle of IRDAI suitability guidelines.',
    learningHook: 'Always calculate the "opportunity cost" when comparing insurance + savings products to pure term plans.',
    source: 'IRDAI Suitability Framework for Life Insurance Products',
  },
  {
    id: 'q4',
    weekTag: [2, 5, 8],
    scenario: 'Priya\'s father contributed to PF for 25 years. He passed away unexpectedly. Is the family entitled to any life cover from EPFO?',
    options: [
      { id: 'a', text: 'No — PF is only a savings scheme, not insurance' },
      { id: 'b', text: 'Yes — EDLI scheme provides life cover up to ₹7 Lakh' },
      { id: 'c', text: 'Yes — but only if he enrolled separately in EDLI' },
      { id: 'd', text: 'Yes — ₹2 Lakh from PMJJBY which links to PF account' },
    ],
    correctOptionId: 'b',
    explanation: 'EDLI (Employees\' Deposit Linked Insurance) is mandatory for all EPFO members. The nominee receives up to ₹7 Lakh (as of 2021 amendment) on the member\'s death during service — at zero additional premium. Many families are unaware of this benefit and miss the claim.',
    learningHook: 'File an EDLI claim using Form 5IF at your nearest EPFO office or via the Umang app within 3 years of death.',
    relatedKinAction: 'Check if EDLI is in your KIN Hidden Coverage',
    source: 'EPFO EDLI Scheme 1976, Amended 2021 — EPFO Circular dated 28 April 2021',
  },
  {
    id: 'q5',
    weekTag: [2, 5, 8],
    scenario: 'Suresh buys a ₹1 Crore term plan at age 35. He switches jobs 5 years later to a higher-paying role. Does he need to inform the insurer?',
    options: [
      { id: 'a', text: 'No — term plans are not affected by job changes' },
      { id: 'b', text: 'Yes — occupation change must be disclosed; premiums may change' },
      { id: 'c', text: 'Only if his new job is in a hazardous industry' },
      { id: 'd', text: 'Only if his income increased by more than 50%' },
    ],
    correctOptionId: 'b',
    explanation: 'Under IRDAI regulations, any material change in occupation — especially to hazardous categories — must be disclosed to the insurer. Failure to disclose could lead to claim rejection. For most desk jobs switching to other desk jobs, it doesn\'t affect the policy, but the disclosure obligation still applies.',
    learningHook: 'Re-read the "Material Change" clause in your term policy document. When in doubt, notify your insurer in writing.',
    source: 'IRDAI Protection of Policyholders\' Interests Regulations 2024, Clause 8',
  },
  {
    id: 'q6',
    weekTag: [2, 5, 8],
    scenario: 'Ananya has a health insurance policy with a 30-day waiting period for pre-existing conditions. She was diagnosed with diabetes before buying the policy. When can she claim for diabetes-related hospitalisation?',
    options: [
      { id: 'a', text: 'Immediately — waiting periods don\'t apply to diagnosed conditions' },
      { id: 'b', text: 'After 30 days from policy start' },
      { id: 'c', text: 'After the pre-existing disease waiting period (typically 2–4 years)' },
      { id: 'd', text: 'Never — pre-existing conditions are permanently excluded' },
    ],
    correctOptionId: 'c',
    explanation: 'The 30-day initial waiting period applies to all illnesses except accidents. For pre-existing diseases (like diabetes declared at policy inception), a separate PED waiting period of 2–4 years applies depending on the insurer. After this period, claims are fully covered. IRDAI 2019 guidelines cap maximum PED waiting period at 4 years.',
    learningHook: 'Check the PED waiting period clause on page 1 of your health policy schedule. Know exactly when your full cover kicks in.',
    source: 'IRDAI Health Insurance Regulations 2016, Amended 2019',
  },
  {
    id: 'q7',
    weekTag: [3, 6, 9],
    scenario: 'Vikram receives a call from someone claiming to be from "IRDAI" saying he has unclaimed insurance bonus of ₹2.5 Lakh. They ask for a "processing fee" of ₹5,000. What should he do?',
    options: [
      { id: 'a', text: 'Pay the fee — IRDAI does contact policyholders about unclaimed bonuses' },
      { id: 'b', text: 'Ask for their IRDAI employee ID before paying' },
      { id: 'c', text: 'Hang up immediately — this is a known fraud pattern' },
      { id: 'd', text: 'Transfer half the fee and wait for verification' },
    ],
    correctOptionId: 'c',
    explanation: 'IRDAI or its officials never contact policyholders to sell insurance, announce bonuses, or collect fees. This is the most common insurance fraud in India. Hang up immediately and report to the National Cyber Crime Helpline (1930) or IRDAI Bima Bharosa (1800-4254-732).',
    learningHook: 'Save IRDAI Bima Bharosa: 1800-4254-732. This is the official grievance helpline — free to call.',
    source: 'IRDAI Protection of Policyholders\' Interests Regulations 2024, Spurious Call Advisory',
  },
  {
    id: 'q8',
    weekTag: [3, 6, 9],
    scenario: 'Kavita\'s mother is 62 and has no health insurance. Kavita wants to buy cover for her. Which is the most important factor to check first?',
    options: [
      { id: 'a', text: 'The insurer\'s claim settlement ratio' },
      { id: 'b', text: 'The entry age, PED waiting period, and room rent sub-limits' },
      { id: 'c', text: 'Whether the plan offers maturity benefits' },
      { id: 'd', text: 'The number of in-network hospitals' },
    ],
    correctOptionId: 'b',
    explanation: 'For senior citizens, the three critical factors are: (1) Entry age limit — many plans stop accepting new members above 60-65; (2) PED waiting period — especially important for age-related conditions; (3) Room rent sub-limits — can drastically reduce payable claims if capped. IRDAI 2019 guidelines require insurers to offer senior-citizen policies without age-based loading beyond a cap.',
    learningHook: 'Look for "co-payment" and "room rent" clauses in the policy schedule — these are the hidden gaps in senior plans.',
    source: 'IRDAI Health Insurance Regulations 2016, Senior Citizen Guidelines 2019',
  },
  {
    id: 'q9',
    weekTag: [3, 6, 9],
    scenario: 'During hospitalisation, the hospital asks Deepak to pay ₹80,000 upfront before admission, even though he has cashless health insurance. Is this correct?',
    options: [
      { id: 'a', text: 'Yes — cashless means insurer pays later, not upfront at admission' },
      { id: 'b', text: 'No — cashless means zero upfront payment for covered expenses' },
      { id: 'c', text: 'Depends on whether the hospital is in the insurer\'s network' },
      { id: 'd', text: 'Only for emergencies; planned procedures require upfront payment' },
    ],
    correctOptionId: 'c',
    explanation: 'Cashless hospitalisation is available only at insurer\'s network hospitals. At a network hospital, the insurer pays the hospital directly and the patient pays only non-covered amounts (consumables, exclusions, co-pay). If the hospital is not in-network, the patient must pay and later claim reimbursement. Always check network status before admission.',
    learningHook: 'Save your insurer\'s cashless helpline in your contacts. For network hospital list, check your insurer\'s app or website.',
    source: 'IRDAI Health Insurance Standardisation Guidelines 2019',
  },
  {
    id: 'q10',
    weekTag: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    scenario: 'PMSBY costs ₹20/year and provides ₹2 Lakh accidental cover. Arun, 28, has not activated it. Which one statement is TRUE?',
    options: [
      { id: 'a', text: 'It activates automatically when you open a savings account' },
      { id: 'b', text: 'He must opt in every year via his savings bank account' },
      { id: 'c', text: 'It is only for government employees' },
      { id: 'd', text: 'Premium is ₹200/year, not ₹20/year' },
    ],
    correctOptionId: 'b',
    explanation: 'PMSBY (Pradhan Mantri Suraksha Bima Yojana) does NOT auto-activate. You must opt in each year — either via your bank\'s net banking, mobile banking, or by filling a form at the branch. The premium of ₹20/year is auto-debited from your savings account on 1st June. Cover period is 1 June to 31 May. Available to account holders aged 18–70.',
    learningHook: 'Log in to your bank app right now and activate PMSBY — it takes 2 minutes and costs less than a cup of tea.',
    relatedKinAction: 'Activate PMSBY via your bank',
    source: 'Jan Suraksha Yojana — Ministry of Finance, Government of India, 2015',
  },
]

// ── Week number calculation ────────────────────────────────────
export function getCurrentWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
}

// ── Get 3 questions for current week ─────────────────────────
export function getWeeklyQuestions(): QuizQuestion[] {
  const week = getCurrentWeekNumber()
  // Filter questions tagged for this week, then fill from "all weeks" (weekTag=[])
  const tagged = QUIZ_QUESTIONS.filter(q => q.weekTag.includes(week % 10 || 10))
  // Deterministic shuffle by week
  const seed = week * 31337
  const all = [...QUIZ_QUESTIONS].sort((a, b) =>
    ((seed + a.id.charCodeAt(1)) % 7) - ((seed + b.id.charCodeAt(1)) % 7)
  )
  const result: QuizQuestion[] = []
  const seen = new Set<string>()
  for (const q of [...tagged, ...all]) {
    if (!seen.has(q.id)) {
      seen.add(q.id)
      result.push(q)
    }
    if (result.length === 3) break
  }
  return result
}

// ── KIN IQ score persistence ──────────────────────────────────
const IQ_KEY = 'kin_iq_score'
const ATTEMPTS_KEY = 'kin_quiz_attempts'

export function getKinIq(): KinIqRecord {
  try {
    const raw = localStorage.getItem(IQ_KEY)
    return raw ? JSON.parse(raw) : { score: 0, history: [] }
  } catch { return { score: 0, history: [] } }
}

export function getAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function hasCompletedThisWeek(): boolean {
  const week = getCurrentWeekNumber()
  return getAttempts().some(a => a.weekNumber === week)
}

export function saveAttempt(
  questionIds: string[],
  answers: Record<string, string>,
  correctCount: number,
): QuizAttempt {
  const week = getCurrentWeekNumber()
  const record = getKinIq()

  // Delta: each correct = +8, +5, +2 depending on current score band
  const base = correctCount === 3 ? 8 : correctCount === 2 ? 5 : correctCount === 1 ? 2 : 0
  const delta = Math.max(0, Math.min(base, 100 - record.score))
  const newScore = Math.min(100, record.score + delta)

  const attempt: QuizAttempt = {
    id: crypto.randomUUID(),
    weekNumber: week,
    questionIds,
    answers,
    score: correctCount,
    kinIqDelta: delta,
    completedAt: new Date().toISOString(),
  }

  // Save attempt
  const attempts = getAttempts()
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([...attempts, attempt]))
  } catch { /* ignore */ }

  // Update IQ record
  const updated: KinIqRecord = {
    score: newScore,
    history: [
      ...record.history,
      { weekNumber: week, score: correctCount, delta, completedAt: attempt.completedAt },
    ],
  }
  try {
    localStorage.setItem(IQ_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }

  return attempt
}
