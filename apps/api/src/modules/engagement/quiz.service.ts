/**
 * QuizService — Module 8B: KIN IQ Weekly Quiz
 *
 * 3 scenario-based questions per week, rotating from a 10-question bank.
 * All questions reference IRDAI regulations and government schemes — no product endorsement.
 * Phase 2: store attempts and KIN IQ in DB (KinIqScore entity).
 */
import { Injectable } from '@nestjs/common'

interface QuizOption { id: string; text: string }
interface QuizQuestion {
  id: string
  scenario: string
  options: QuizOption[]
  correctOptionId: string
  explanation: string
  learningHook: string
  source: string
}

interface KinIqHistory { weekNumber: number; score: number; delta: number; completedAt: string }

// In-memory store (Phase 2: DB)
const kinIqStore = new Map<string, { score: number; history: KinIqHistory[] }>()
const attemptStore = new Map<string, Set<number>>()  // userId → completed weeks

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'q1', scenario: 'Arjun has ₹5L employer mediclaim. Hospital bill: ₹6.5L. How much does he pay?',
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
    id: 'q2', scenario: 'Meera, 32, wants pure life cover for her family. Best product?',
    options: [
      { id: 'a', text: 'Endowment plan — savings + insurance' },
      { id: 'b', text: 'ULIP — market-linked returns with life cover' },
      { id: 'c', text: 'Term life insurance — pure protection, no maturity benefit' },
      { id: 'd', text: 'Whole life plan — cover till age 100' },
    ],
    correctOptionId: 'c',
    explanation: 'Term life provides the highest cover at the lowest premium — ideal for income replacement. No maturity benefit; cover pays on death within the policy term.',
    learningHook: 'A ₹1Cr term plan for a 32-year-old non-smoker costs roughly ₹800–₹1,200/month.',
    source: "IRDAI Protection of Policyholders' Interests Regulations 2024",
  },
  {
    id: 'q4', scenario: "Priya's father contributed to PF for 25 years and passed away. Is there a life cover from EPFO?",
    options: [
      { id: 'a', text: 'No — PF is only a savings scheme' },
      { id: 'b', text: 'Yes — EDLI provides up to ₹7 Lakh' },
      { id: 'c', text: 'Yes — but only if he enrolled separately' },
      { id: 'd', text: 'Yes — ₹2L from PMJJBY linked to PF' },
    ],
    correctOptionId: 'b',
    explanation: 'EDLI (Employees Deposit Linked Insurance) is mandatory for all EPFO members at zero additional premium. Maximum cover ₹7L as per 2021 amendment.',
    learningHook: 'File EDLI claim using Form 5IF at nearest EPFO office or via the Umang app within 3 years of death.',
    source: 'EPFO EDLI Scheme 1976, Amended April 2021',
  },
  {
    id: 'q7', scenario: 'Someone claims to be from "IRDAI" and offers ₹2.5L unclaimed bonus — asks for ₹5,000 processing fee. What should Vikram do?',
    options: [
      { id: 'a', text: 'Pay — IRDAI does contact policyholders about bonuses' },
      { id: 'b', text: 'Ask for IRDAI employee ID before paying' },
      { id: 'c', text: 'Hang up immediately — this is a known fraud' },
      { id: 'd', text: 'Transfer half and wait for verification' },
    ],
    correctOptionId: 'c',
    explanation: 'IRDAI or its officials never contact policyholders to sell insurance, announce bonuses, or collect fees. Hang up and report to IRDAI Bima Bharosa: 1800-4254-732.',
    learningHook: 'Save IRDAI Bima Bharosa: 1800-4254-732 — the official free grievance helpline.',
    source: "IRDAI Protection of Policyholders' Interests Regulations 2024, Spurious Call Advisory",
  },
  {
    id: 'q10', scenario: 'PMSBY costs ₹20/year and gives ₹2L accidental cover. Which statement is TRUE?',
    options: [
      { id: 'a', text: 'It activates automatically when you open a savings account' },
      { id: 'b', text: 'You must opt in every year via your savings bank account' },
      { id: 'c', text: 'It is only for government employees' },
      { id: 'd', text: 'Premium is ₹200/year, not ₹20/year' },
    ],
    correctOptionId: 'b',
    explanation: 'PMSBY does NOT auto-activate. Opt in each year via net banking or branch form. Premium ₹20/year auto-debited on 1st June. Cover: 1 June to 31 May.',
    learningHook: 'Log in to your bank app right now and activate PMSBY — it takes 2 minutes.',
    source: 'Jan Suraksha Yojana — Ministry of Finance, GoI, 2015',
  },
]

function getWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil((now.getTime() - start.getTime()) / (7 * 86_400_000))
}

function getQuestionsForWeek(week: number): QuizQuestion[] {
  const seed = week * 31337
  const sorted = [...QUESTION_BANK].sort((a, b) =>
    ((seed + a.id.charCodeAt(1)) % 7) - ((seed + b.id.charCodeAt(1)) % 7)
  )
  return sorted.slice(0, 3)
}

@Injectable()
export class QuizService {
  getWeeklyQuiz(weekNumber?: number): { questions: QuizQuestion[]; weekNumber: number } {
    const week = weekNumber ?? getWeekNumber()
    return { questions: getQuestionsForWeek(week), weekNumber: week }
  }

  submitAttempt(userId: string, weekNumber: number, answers: Record<string, string>): {
    score: number
    correctCount: number
    delta: number
    kinIqScore: number
    results: Array<{ questionId: string; correct: boolean; explanation: string; learningHook: string }>
  } {
    const { questions } = this.getWeeklyQuiz(weekNumber)
    let correctCount = 0
    const results = questions.map(q => {
      const correct = answers[q.id] === q.correctOptionId
      if (correct) correctCount++
      return { questionId: q.id, correct, explanation: q.explanation, learningHook: q.learningHook }
    })

    const delta = correctCount === 3 ? 8 : correctCount === 2 ? 5 : correctCount === 1 ? 2 : 0
    const record = kinIqStore.get(userId) ?? { score: 0, history: [] }
    const newScore = Math.min(100, record.score + delta)
    kinIqStore.set(userId, {
      score: newScore,
      history: [...record.history, { weekNumber, score: correctCount, delta, completedAt: new Date().toISOString() }],
    })
    const weeks = attemptStore.get(userId) ?? new Set()
    weeks.add(weekNumber)
    attemptStore.set(userId, weeks)

    return { score: correctCount, correctCount, delta, kinIqScore: newScore, results }
  }

  getKinIqScore(userId: string): { score: number; history: KinIqHistory[] } {
    return kinIqStore.get(userId) ?? { score: 0, history: [] }
  }
}
