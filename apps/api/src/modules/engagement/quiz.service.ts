/**
 * QuizService — Module 8B: KIN IQ Weekly Quiz
 *
 * 3 scenario-based questions per week, drawn deterministically from a bank
 * of 20+ questions. All grounded in IRDAI/EPFO/government scheme references.
 *
 * Quiz attempts and the cumulative KIN IQ score are persisted to the
 * quiz_attempts table - serverless-safe and survives DB-backed user deletion
 * via FK CASCADE.
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity'

export interface QuizOption { id: string; text: string }
export interface QuizQuestion {
  id: string
  scenario: string
  options: QuizOption[]
  correctOptionId: string
  explanation: string
  learningHook: string
  source: string
}

export interface KinIqHistory {
  weekNumber: number
  score: number
  delta: number
  completedAt: string
}

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    scenario: 'Arjun has ₹5L employer mediclaim. Hospital bill: ₹6.5L. How much does he pay?',
    options: [
      { id: 'a', text: '₹0 — employer plans cover everything' },
      { id: 'b', text: '₹1.5L — employer covers ₹5L, he pays the rest' },
      { id: 'c', text: '₹6.5L — employer plans do not cover spouses' },
      { id: 'd', text: 'Depends on claim settlement ratio' },
    ],
    correctOptionId: 'b',
    explanation: 'Employer group mediclaim covers up to the sum insured (₹5L). Any amount beyond must be paid by the employee. A super top-up plan can plug this gap at low cost.',
    learningHook: 'Check your employer policy certificate for your exact sum insured and family members covered.',
    source: 'IRDAI Health Insurance Regulations 2016',
  },
  {
    id: 'q2',
    scenario: 'Meera, 32, wants pure life cover for her family. Best product?',
    options: [
      { id: 'a', text: 'Endowment plan — savings + insurance' },
      { id: 'b', text: 'ULIP — market-linked returns with life cover' },
      { id: 'c', text: 'Term life insurance — pure protection, no maturity benefit' },
      { id: 'd', text: 'Whole life plan — cover till age 100' },
    ],
    correctOptionId: 'c',
    explanation: 'Term life provides the highest cover at the lowest premium - ideal for income replacement. No maturity benefit; cover pays on death within the policy term.',
    learningHook: 'A ₹1Cr term plan for a 32-year-old non-smoker costs roughly ₹800 to ₹1,200/month.',
    source: "IRDAI Protection of Policyholders' Interests Regulations 2024",
  },
  {
    id: 'q3',
    scenario: 'How much life cover does the rule-of-thumb suggest for a primary earner with ₹15L annual income?',
    options: [
      { id: 'a', text: '₹15 Lakh (1× income)' },
      { id: 'b', text: '₹50 Lakh (covers next 5 years)' },
      { id: 'c', text: '₹1.5 Crore (10× annual income)' },
      { id: 'd', text: '₹5 Crore (20× annual income)' },
    ],
    correctOptionId: 'c',
    explanation: 'IRDAI suitability guidelines reference 10x annual income as the working benchmark for income-replacement term cover for a breadwinner with dependants. Adjust upward if dependants are very young or you have significant liabilities.',
    learningHook: 'For ₹15L income, target ₹1.5Cr term cover. Premium for a 30-year-old is typically ₹12-18k/year.',
    source: 'IRDAI Suitability of Life Insurance Products Guidelines 2023, Section 4.2',
  },
  {
    id: 'q4',
    scenario: "Priya's father contributed to PF for 25 years and passed away. Is there a life cover from EPFO?",
    options: [
      { id: 'a', text: 'No — PF is only a savings scheme' },
      { id: 'b', text: 'Yes — EDLI provides up to ₹7 Lakh' },
      { id: 'c', text: 'Yes — but only if he enrolled separately' },
      { id: 'd', text: 'Yes — ₹2L from PMJJBY linked to PF' },
    ],
    correctOptionId: 'b',
    explanation: 'EDLI (Employees Deposit Linked Insurance) is mandatory for all EPFO members at zero additional premium. Maximum cover ₹7L per the 2021 amendment.',
    learningHook: 'File EDLI claim using Form 5IF at the nearest EPFO office or via Umang app within 3 years of death.',
    source: 'EPFO EDLI Scheme 1976, Amended April 2021',
  },
  {
    id: 'q5',
    scenario: 'After a term policy claim is admitted, within how many days must the insurer settle the payout per IRDAI rules?',
    options: [
      { id: 'a', text: '7 days' },
      { id: 'b', text: '30 days' },
      { id: 'c', text: '60 days' },
      { id: 'd', text: '90 days' },
    ],
    correctOptionId: 'b',
    explanation: 'IRDAI Protection of Policyholders Interests Regulations 2024 require life claim settlement within 30 days of receiving all required documents. Delay attracts interest at bank rate + 2%.',
    learningHook: 'If your insurer delays beyond 30 days, raise a complaint on Bima Bharosa: 1800-4254-732.',
    source: 'IRDAI Protection of Policyholders Interests Regulations 2024, Regulation 14',
  },
  {
    id: 'q6',
    scenario: 'How long is the free-look period for a newly purchased life insurance policy?',
    options: [
      { id: 'a', text: '7 days' },
      { id: 'b', text: '15 days for offline; 30 days for online' },
      { id: 'c', text: '60 days for both online and offline' },
      { id: 'd', text: 'No free-look period exists' },
    ],
    correctOptionId: 'b',
    explanation: 'IRDAI mandates a free-look period during which you can return the policy for a refund of premium (minus medical and stamp duty costs). 15 days for traditional offline purchase, 30 days for online and distance-marketing purchases.',
    learningHook: 'Always check Day 1 terms on a new policy. Cancellation in free-look = near-full refund.',
    source: 'IRDAI Policyholder Protection Regulations 2017, Regulation 6',
  },
  {
    id: 'q7',
    scenario: 'Someone claims to be from "IRDAI" and offers ₹2.5L unclaimed bonus — asks for ₹5,000 processing fee. What should Vikram do?',
    options: [
      { id: 'a', text: 'Pay — IRDAI does contact policyholders about bonuses' },
      { id: 'b', text: 'Ask for IRDAI employee ID before paying' },
      { id: 'c', text: 'Hang up immediately — this is a known fraud' },
      { id: 'd', text: 'Transfer half and wait for verification' },
    ],
    correctOptionId: 'c',
    explanation: 'IRDAI officials never contact policyholders to sell insurance, announce bonuses, or collect fees. Hang up and report to IRDAI Bima Bharosa: 1800-4254-732.',
    learningHook: 'Save IRDAI Bima Bharosa: 1800-4254-732 — the official free grievance helpline.',
    source: "IRDAI Protection of Policyholders' Interests Regulations 2024, Spurious Call Advisory",
  },
  {
    id: 'q8',
    scenario: 'Which of these CANNOT be a valid reason for an insurer to reject a death claim on a term plan?',
    options: [
      { id: 'a', text: 'Material misrepresentation about smoking habits at policy purchase' },
      { id: 'b', text: 'Death during the contestability period (first 3 years) from undisclosed pre-existing condition' },
      { id: 'c', text: 'Death by natural causes 5 years after policy purchase' },
      { id: 'd', text: 'Death by suicide within 12 months of purchase' },
    ],
    correctOptionId: 'c',
    explanation: 'After the 3-year contestability period, an insurer cannot deny a claim on grounds of misstatement except for fraud. Natural-cause death after 5 years must be paid out.',
    learningHook: 'Always declare smoking, drinking, pre-existing conditions truthfully. Cheap premiums are not worth a rejected claim.',
    source: 'Section 45, Insurance Act 1938 (amended 2015)',
  },
  {
    id: 'q9',
    scenario: 'PMSBY costs ₹20/year and gives ₹2L accidental cover. Which statement is TRUE?',
    options: [
      { id: 'a', text: 'It activates automatically when you open a savings account' },
      { id: 'b', text: 'You must opt in every year via your savings bank account' },
      { id: 'c', text: 'It is only for government employees' },
      { id: 'd', text: 'Premium is ₹200/year, not ₹20/year' },
    ],
    correctOptionId: 'b',
    explanation: 'PMSBY does NOT auto-activate. Opt in each year via net banking or branch form. Premium ₹20/year auto-debited on 1st June. Cover period: 1 June to 31 May.',
    learningHook: 'Log in to your bank app right now and activate PMSBY — it takes 2 minutes.',
    source: 'Jan Suraksha Yojana - Ministry of Finance, GoI, 2015',
  },
  {
    id: 'q10',
    scenario: 'PMJJBY: which combination is correct?',
    options: [
      { id: 'a', text: '₹2L cover, ₹20/year, age 18-50' },
      { id: 'b', text: '₹2L cover, ₹436/year, age 18-50' },
      { id: 'c', text: '₹5L cover, ₹436/year, age 18-70' },
      { id: 'd', text: '₹2L cover, ₹436/year, age 18-70' },
    ],
    correctOptionId: 'b',
    explanation: 'Pradhan Mantri Jeevan Jyoti Bima Yojana: ₹2L life cover (any cause) at ₹436/year premium, eligibility 18-50 years (cover continues to 55 if enrolled before 50).',
    learningHook: 'PMJJBY + PMSBY together cost ₹456/year for ₹4L combined life + accident cover. Activate via your bank.',
    source: 'Jan Suraksha Yojana - Ministry of Finance, GoI, 2015',
  },
  {
    id: 'q11',
    scenario: 'Mandatory PA cover for the owner-driver under every motor insurance policy in India is for what amount?',
    options: [
      { id: 'a', text: '₹1 Lakh' },
      { id: 'b', text: '₹5 Lakh' },
      { id: 'c', text: '₹15 Lakh' },
      { id: 'd', text: '₹25 Lakh' },
    ],
    correctOptionId: 'c',
    explanation: 'Since the IRDAI 2018 circular, every motor insurance policy must include ₹15L Personal Accident cover for the owner-driver. The cover is for the named owner only.',
    learningHook: 'Check your motor policy schedule for "Owner-Driver PA Cover" and confirm the nominee on record.',
    source: 'IRDAI Motor Insurance Circular - Compulsory PA Cover, 2018',
  },
  {
    id: 'q12',
    scenario: 'How does a super top-up health plan differ from a regular top-up?',
    options: [
      { id: 'a', text: 'Super top-up has no claim limit' },
      { id: 'b', text: 'Super top-up considers cumulative annual claims above the deductible; regular top-up looks per-claim' },
      { id: 'c', text: 'They are identical' },
      { id: 'd', text: 'Super top-up only covers critical illness' },
    ],
    correctOptionId: 'b',
    explanation: 'A super top-up considers the AGGREGATE of claims in a policy year above the deductible. A regular top-up applies the deductible per individual hospitalisation. Super top-up is therefore more useful in practice.',
    learningHook: 'For most families, a ₹10-25L super top-up with a ₹5L deductible costs less than a fresh ₹10L base plan.',
    source: 'IRDAI Health Insurance Regulations 2016, Section 4',
  },
  {
    id: 'q13',
    scenario: 'How long is the maximum pre-existing-disease waiting period that IRDAI permits in a new health insurance policy?',
    options: [
      { id: 'a', text: '1 year' },
      { id: 'b', text: '2 years' },
      { id: 'c', text: '3 years' },
      { id: 'd', text: '4 years' },
    ],
    correctOptionId: 'c',
    explanation: 'IRDAI Health Insurance Regulations cap the pre-existing-disease waiting period at 36 months (3 years). Many insurers offer 24-month waits and a few have moved to 12 months.',
    learningHook: 'When comparing health plans, prefer shorter PED waiting periods - especially if anyone in the family has diabetes, hypertension, or thyroid conditions.',
    source: 'IRDAI Health Insurance Regulations 2016, Regulation 8',
  },
  {
    id: 'q14',
    scenario: 'Within how long must an insurer settle a cashless claim authorisation request per IRDAI 2024 rule?',
    options: [
      { id: 'a', text: '1 hour from request' },
      { id: 'b', text: '4 hours from request' },
      { id: 'c', text: '24 hours from request' },
      { id: 'd', text: '72 hours from request' },
    ],
    correctOptionId: 'a',
    explanation: 'IRDAI Master Circular on Health Insurance (May 2024) mandates cashless authorisation within 1 hour of receiving the request and final discharge approval within 3 hours.',
    learningHook: "If your hospital says authorisation is delayed beyond an hour, ask them to escalate to the insurer's TPA helpline.",
    source: 'IRDAI Master Circular on Health Insurance, May 2024',
  },
  {
    id: 'q15',
    scenario: 'When you change jobs, what happens to your employer-provided group term life insurance?',
    options: [
      { id: 'a', text: 'It continues automatically for 1 year' },
      { id: 'b', text: 'It transfers to your new employer' },
      { id: 'c', text: 'It ends immediately on your last working day' },
      { id: 'd', text: 'You can convert it to an individual policy at the same premium' },
    ],
    correctOptionId: 'c',
    explanation: 'Group term life is tied to your employment. Cover ceases on your last working day. You may have a short conversion option in some plans but usually at standard individual rates.',
    learningHook: 'Always hold an INDIVIDUAL term plan in addition to employer cover. Premium locked in at a younger age is cheaper.',
    source: 'IRDAI Group Insurance Guidelines 2016',
  },
  {
    id: 'q16',
    scenario: 'EDLI claim: which form does the nominee submit to the EPFO?',
    options: [
      { id: 'a', text: 'Form 19' },
      { id: 'b', text: 'Form 10C' },
      { id: 'c', text: 'Form 5IF' },
      { id: 'd', text: 'Form 31' },
    ],
    correctOptionId: 'c',
    explanation: 'Form 5IF is the dedicated claim form for EDLI life-insurance benefit. It is submitted along with death certificate and member service record.',
    learningHook: 'Bookmark the EPFO Umang app - you can file Form 5IF digitally instead of visiting an EPFO office.',
    source: 'EPFO EDLI Scheme 1976',
  },
  {
    id: 'q17',
    scenario: "ESIC eligibility: what is the salary ceiling for an employee to be covered under ESI?",
    options: [
      { id: 'a', text: '₹15,000/month gross' },
      { id: 'b', text: '₹21,000/month gross (₹25,000 for differently-abled)' },
      { id: 'c', text: '₹30,000/month gross' },
      { id: 'd', text: 'No upper limit' },
    ],
    correctOptionId: 'b',
    explanation: 'ESI applies to employees earning up to ₹21,000/month gross (₹25,000 for differently-abled employees) in establishments with 10+ employees. Both employee (0.75%) and employer (3.25%) contribute.',
    learningHook: 'If you are below the ceiling and your employer is not deducting ESI, ask HR. Coverage includes hospitalisation, maternity, and disability benefits.',
    source: 'ESI Act 1948',
  },
  {
    id: 'q18',
    scenario: 'Which of these is NOT typically covered by a Critical Illness rider on a life insurance policy?',
    options: [
      { id: 'a', text: 'Cancer of specified severity' },
      { id: 'b', text: 'Open chest CABG (heart surgery)' },
      { id: 'c', text: 'Mild flu requiring 2 days bed rest' },
      { id: 'd', text: 'Major organ transplant' },
    ],
    correctOptionId: 'c',
    explanation: 'CI riders cover a defined list of severe conditions (typically 8 to 35 illnesses depending on insurer). Common ones: cancer, stroke, kidney failure, major organ transplant, paralysis, multiple sclerosis. Minor illnesses are excluded.',
    learningHook: 'Read the CI policy wording carefully - claims hinge on the precise definition of each illness and a survival period (typically 30 days).',
    source: 'IRDAI Health Insurance Regulations 2016, Section 5',
  },
  {
    id: 'q19',
    scenario: 'What does "nominee" vs "assignee" mean on a life insurance policy?',
    options: [
      { id: 'a', text: 'They are the same thing' },
      { id: 'b', text: 'Nominee just receives the death benefit; an assignee owns the policy and its rights' },
      { id: 'c', text: 'Assignee can only be a bank for loan collateral' },
      { id: 'd', text: 'Nominee is for term plans; assignee is for endowment plans' },
    ],
    correctOptionId: 'b',
    explanation: 'A nominee under Section 39 of the Insurance Act is a trustee of the death proceeds for the legal heirs. An assignee actually owns the policy and all its rights once assignment is made (e.g. a bank for a loan).',
    learningHook: 'Use "beneficial nominee" (spouse, child, parent) to ensure proceeds go to them directly without succession claims from other heirs.',
    source: 'Section 39, Insurance Act 1938 (amended 2015)',
  },
  {
    id: 'q20',
    scenario: 'Within how long after the policy due date is a life insurance grace period typically allowed?',
    options: [
      { id: 'a', text: '7 days' },
      { id: 'b', text: '15 days for monthly mode; 30 days for quarterly/half-yearly/annual' },
      { id: 'c', text: '60 days regardless of mode' },
      { id: 'd', text: 'There is no grace period' },
    ],
    correctOptionId: 'b',
    explanation: 'IRDAI standard grace period: 15 days for monthly premium mode, 30 days for any other mode. Cover continues during the grace period. After that, the policy lapses and must be revived.',
    learningHook: 'Set a calendar reminder 7 days before your premium due date. A lapsed policy means new medicals and possibly higher premium on revival.',
    source: 'IRDAI Policyholder Protection Regulations 2017',
  },
]

function getWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil((now.getTime() - start.getTime()) / (7 * 86_400_000))
}

function getQuestionsForWeek(week: number): QuizQuestion[] {
  // Deterministic shuffle - same week always produces the same 3 questions
  const seed = week * 31337
  const sorted = [...QUESTION_BANK].sort((a, b) => {
    const aHash = (seed + a.id.charCodeAt(0) + a.id.charCodeAt(a.id.length - 1)) % 1000
    const bHash = (seed + b.id.charCodeAt(0) + b.id.charCodeAt(b.id.length - 1)) % 1000
    return aHash - bHash
  })
  return sorted.slice(0, 3)
}

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
  ) {}

  getWeeklyQuiz(weekNumber?: number): { questions: QuizQuestion[]; weekNumber: number; bankSize: number } {
    const week = weekNumber ?? getWeekNumber()
    return { questions: getQuestionsForWeek(week), weekNumber: week, bankSize: QUESTION_BANK.length }
  }

  async submitAttempt(
    userId: string,
    weekNumber: number,
    answers: Record<string, string>,
  ): Promise<{
    score: number
    correctCount: number
    delta: number
    kinIqScore: number
    results: Array<{ questionId: string; correct: boolean; explanation: string; learningHook: string }>
  }> {
    const { questions } = this.getWeeklyQuiz(weekNumber)
    let correctCount = 0
    const results = questions.map(q => {
      const correct = answers[q.id] === q.correctOptionId
      if (correct) correctCount++
      return { questionId: q.id, correct, explanation: q.explanation, learningHook: q.learningHook }
    })

    const delta = correctCount === 3 ? 8 : correctCount === 2 ? 5 : correctCount === 1 ? 2 : 0

    // Upsert per (user, week). If already attempted, this throws on the unique
    // constraint - we treat the duplicate as idempotent and return the previous result.
    const existing = await this.attemptRepo.findOne({ where: { userId, weekNumber } })
    if (existing) {
      const kinIqScore = await this.computeKinIqScore(userId)
      return {
        score: existing.correctCount,
        correctCount: existing.correctCount,
        delta: existing.delta,
        kinIqScore,
        results,
      }
    }

    await this.attemptRepo.save(this.attemptRepo.create({ userId, weekNumber, correctCount, delta }))
    const kinIqScore = await this.computeKinIqScore(userId)
    return { score: correctCount, correctCount, delta, kinIqScore, results }
  }

  async getKinIqScore(userId: string): Promise<{ score: number; history: KinIqHistory[] }> {
    const attempts = await this.attemptRepo.find({
      where: { userId },
      order: { weekNumber: 'ASC' },
    })
    const score = Math.min(100, attempts.reduce((sum, a) => sum + a.delta, 0))
    const history: KinIqHistory[] = attempts.map(a => ({
      weekNumber: a.weekNumber,
      score: a.correctCount,
      delta: a.delta,
      completedAt: a.completedAt.toISOString(),
    }))
    return { score, history }
  }

  private async computeKinIqScore(userId: string): Promise<number> {
    const { score } = await this.getKinIqScore(userId)
    return score
  }
}
