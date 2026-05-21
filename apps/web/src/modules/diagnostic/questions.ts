export type QuestionType = 'option' | 'multi_option' | 'income_range' | 'number' | 'city'

export interface Option {
  id: string
  label: string
  emoji: string
  description?: string
}

export interface Question {
  id: string
  step: number            // 1-indexed, 1–7
  type: QuestionType
  text: string
  subtext?: string
  options?: Option[]
  inputPlaceholder?: string
  inputHelper?: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'life_stage',
    step: 1,
    type: 'option',
    text: 'What best describes your family situation?',
    subtext: 'This helps us understand who depends on your income.',
    options: [
      { id: 'single', label: 'Single', emoji: '🙋', description: 'No dependants' },
      { id: 'married_no_kids', label: 'Married, no kids yet', emoji: '💑', description: 'Spouse may depend on you' },
      { id: 'married_with_kids', label: 'Married with kids', emoji: '👨‍👩‍👧', description: 'Family depends on you' },
      { id: 'parent_caregiver', label: 'Supporting parents too', emoji: '👨‍👩‍👦‍👦', description: 'Kids + ageing parents' },
    ],
  },
  {
    id: 'income_band',
    step: 2,
    type: 'income_range',
    text: 'What is your annual household income?',
    subtext: 'A range is fine — we never ask for the exact figure.',
    options: [
      { id: 'lt_5l', label: 'Under ₹5 lakh', emoji: '💰' },
      { id: '5_10l', label: '₹5 – 10 lakh', emoji: '💰' },
      { id: '10_20l', label: '₹10 – 20 lakh', emoji: '💰' },
      { id: '20_40l', label: '₹20 – 40 lakh', emoji: '💰' },
      { id: 'gt_40l', label: 'Above ₹40 lakh', emoji: '💰' },
    ],
  },
  {
    id: 'dependants_count',
    step: 3,
    type: 'option',
    text: 'How many people financially depend on you?',
    subtext: 'Count spouse, children, and parents you support.',
    options: [
      { id: '0', label: 'None', emoji: '0️⃣' },
      { id: '1', label: '1 person', emoji: '1️⃣' },
      { id: '2', label: '2 people', emoji: '2️⃣' },
      { id: '3', label: '3 people', emoji: '3️⃣' },
      { id: '4+', label: '4 or more', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    id: 'monthly_obligations',
    step: 4,
    type: 'option',
    text: 'What are your total monthly EMIs or obligations?',
    subtext: 'Home loan, car loan, personal loan — add them up roughly.',
    options: [
      { id: 'none', label: 'No EMIs', emoji: '✅', description: 'Debt-free' },
      { id: 'lt_15k', label: 'Under ₹15,000/mo', emoji: '📉' },
      { id: '15_40k', label: '₹15,000 – ₹40,000/mo', emoji: '📊' },
      { id: '40_80k', label: '₹40,000 – ₹80,000/mo', emoji: '📈' },
      { id: 'gt_80k', label: 'Above ₹80,000/mo', emoji: '🏠', description: 'Large home loan etc.' },
    ],
  },
  {
    id: 'existing_cover',
    step: 5,
    type: 'multi_option',
    text: 'What insurance do you already have?',
    subtext: 'Select all that apply. If unsure, just skip.',
    options: [
      { id: 'employer_mediclaim', label: 'Employer mediclaim', emoji: '🏥', description: 'Group health from company' },
      { id: 'personal_health', label: 'Personal health policy', emoji: '💊', description: 'Bought separately' },
      { id: 'term_life', label: 'Term life insurance', emoji: '🛡️', description: 'Pure death cover' },
      { id: 'lic_endowment', label: 'LIC / endowment plan', emoji: '📄', description: 'Savings + insurance mix' },
      { id: 'none_cover', label: 'None of the above', emoji: '❌' },
    ],
  },
  {
    id: 'city_tier',
    step: 6,
    type: 'city',
    text: 'Which city do you live in?',
    subtext: 'Used only for peer benchmarks — anonymised by city tier.',
    inputPlaceholder: 'e.g. Mumbai, Pune, Jaipur…',
    inputHelper: 'We convert this to T1 / T2 / T3 — your exact city is not stored.',
  },
  {
    id: 'occupation',
    step: 7,
    type: 'option',
    text: 'What is your occupation type?',
    subtext: 'Affects EPFO/EDLI coverage check and income stability scoring.',
    options: [
      { id: 'salaried_pf', label: 'Salaried — PF deducted', emoji: '🏢', description: 'EDLI cover may apply' },
      { id: 'salaried_no_pf', label: 'Salaried — no PF', emoji: '💼', description: 'Private / startup' },
      { id: 'self_employed', label: 'Self-employed / business', emoji: '🧑‍💼' },
      { id: 'govt', label: 'Government / PSU', emoji: '🏛️', description: 'Pension + group cover' },
    ],
  },
]
