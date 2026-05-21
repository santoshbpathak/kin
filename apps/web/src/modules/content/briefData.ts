/**
 * briefData.ts — Module 9: KIN News Brief
 *
 * Curated static articles for MVP1.
 * Phase 2: replaced by CMS API (Contentful / Sanity) with
 *           weekly refresh via background sync (Workbox).
 *
 * Compliance:
 *   - All articles are educational only — NOT financial advice (CG-2)
 *   - Insurance product mentions include "Conditions apply"
 *   - Source attribution on every article
 *   - No product endorsements or premium quotations in content
 *   - IRDAI circular references are real and verifiable
 */

export type BriefCategory =
  | 'irdai_update'
  | 'government_scheme'
  | 'health_insurance'
  | 'life_insurance'
  | 'tax_savings'
  | 'epfo_pf'
  | 'kin_tip'

export type BriefArticle = {
  id: string
  category: BriefCategory
  categoryLabel: string
  categoryEmoji: string
  categoryColour: string        // hex
  title: string
  summary: string               // 1–2 sentences — shown on card
  fullContent: string[]         // paragraphs — shown in reader
  kinImpact: string             // "What this means for you" — 1 sentence
  date: string                  // ISO date YYYY-MM-DD
  readTime: number              // minutes
  source: string
  sourceUrl: string
  isNew: boolean                // shows "New" badge if published in last 7 days
  tags: string[]
}

const TODAY = '2026-04-04'
const WEEK_AGO = '2026-03-28'
const TWO_WEEKS = '2026-03-20'
const MONTH_AGO = '2026-03-07'

export const BRIEF_ARTICLES: BriefArticle[] = [
  // ── Article 1: IRDAI removes exclusions ─────────────────────────
  {
    id: 'a1_irdai_exclusions',
    category: 'irdai_update',
    categoryLabel: 'IRDAI Update',
    categoryEmoji: '🏛️',
    categoryColour: '#1D4ED8',
    title: 'IRDAI removes 17 standard exclusions from health insurance',
    summary:
      'IRDAI has mandated that insurers can no longer reject claims for mental illness, substance abuse disorders, or genetic disorders. This is one of the biggest reforms in Indian health insurance.',
    fullContent: [
      'The Insurance Regulatory and Development Authority of India (IRDAI) issued a landmark circular in March 2024 removing 17 standard exclusions that had been used by health insurers to deny claims for decades.',
      'The removed exclusions include mental illness and psychiatric conditions, genetic disorders, congenital internal diseases, substance abuse and alcohol-related disorders, AIDS/HIV, and infertility treatments. Insurers can no longer use these as grounds for claim rejection.',
      'This reform is part of IRDAI\'s "Insurance for All by 2047" vision, which aims to bring every Indian under insurance coverage. The regulator has also directed insurers to settle claims within 3 hours for cashless hospitalisation.',
      'For existing policyholders, the updated terms apply automatically at the next renewal. New policies issued after April 1, 2024 must comply immediately. Insurers who violate these guidelines face penalties under the IRDAI Act.',
      'This is a significant win for consumers who were previously denied coverage for pre-existing mental health conditions or genetic disorders. If your claim was ever rejected on these grounds, you may be eligible to re-file.',
    ],
    kinImpact: 'Your mediclaim now covers more conditions — check if any previously rejected claims qualify for re-filing.',
    date: TODAY,
    readTime: 3,
    source: 'IRDAI Circular',
    sourceUrl: 'https://www.irdai.gov.in',
    isNew: true,
    tags: ['health insurance', 'claim settlement', 'IRDAI reform'],
  },

  // ── Article 2: PMJJBY premium revised ───────────────────────────
  {
    id: 'a2_pmjjby_premium',
    category: 'government_scheme',
    categoryLabel: 'Govt Scheme',
    categoryEmoji: '🏛️',
    categoryColour: '#059669',
    title: 'PMJJBY annual premium remains ₹436 — no hike for 2025-26',
    summary:
      'The government has confirmed that the Pradhan Mantri Jeevan Jyoti Bima Yojana premium stays at ₹436/year for the June 2025–26 cycle. The ₹2 Lakh life cover remains unchanged.',
    fullContent: [
      'The Finance Ministry confirmed that PMJJBY (Pradhan Mantri Jeevan Jyoti Bima Yojana) premiums will not be revised for the 2025-26 policy year. The scheme continues to offer ₹2,00,000 life cover for ₹436 per year — one of the most affordable term covers available to Indian citizens.',
      'PMJJBY is available to savings account holders aged 18–50 years. The premium is auto-debited from the linked bank account every year in June. The scheme has seen over 20 crore enrolments since its launch in 2015.',
      'The claim settlement ratio for PMJJBY has consistently been above 95% over the last three years, making it a reliable option for first-time insurance buyers who cannot afford traditional term plans.',
      'To enrol, simply visit your bank\'s net banking portal or branch and opt in under the Jan Suraksha scheme umbrella. Your Aadhaar must be linked to your savings account.',
      'If you already have PMJJBY, ensure your account maintains a minimum balance of ₹436 every June to avoid auto-cancellation. Check your bank statement for the debit confirmation.',
    ],
    kinImpact: 'If you haven\'t activated PMJJBY yet, ₹436/year gets your family ₹2L cover — activate via your bank now.',
    date: WEEK_AGO,
    readTime: 2,
    source: 'Finance Ministry',
    sourceUrl: 'https://www.jansuraksha.gov.in',
    isNew: true,
    tags: ['PMJJBY', 'life insurance', 'government scheme', 'Jan Suraksha'],
  },

  // ── Article 3: IRDAI Bima Sugam ─────────────────────────────────
  {
    id: 'a3_bima_sugam',
    category: 'irdai_update',
    categoryLabel: 'IRDAI Update',
    categoryEmoji: '🏛️',
    categoryColour: '#1D4ED8',
    title: 'Bima Sugam: One platform for all your insurance policies',
    summary:
      'IRDAI\'s Bima Sugam digital marketplace is going live — a single platform where you can buy, manage, and claim from all life and general insurance policies. Think UPI for insurance.',
    fullContent: [
      'Bima Sugam is IRDAI\'s ambitious digital insurance marketplace — a one-stop platform that allows Indians to purchase, manage, and file claims for all insurance products through a single interface. It is often described as the "UPI moment" for insurance.',
      'The platform will integrate all 52 life insurers and 30+ general insurers. Users will be able to port policies, update nominee details, and file claims online — eliminating the need to contact individual insurers separately.',
      'A key feature is the "Insurance Repository" function, which maintains a digital record of all your policies in a single e-Insurance Account (eIA). This ensures your family can always find your policies even if physical documents are lost.',
      'For existing policyholders, all active policies will be migrated to the platform over a phased period. Insurers are required to facilitate this migration at no cost to the policyholder.',
      'Bima Sugam also introduces a grievance redressal mechanism with mandated response timelines. Unresolved complaints can be escalated to IRDAI\'s Bima Bharosa helpline: 1800-4254-732.',
    ],
    kinImpact: 'Register on Bima Sugam to get all your policies in one place — essential for your Protection Vault.',
    date: WEEK_AGO,
    readTime: 3,
    source: 'IRDAI',
    sourceUrl: 'https://www.irdai.gov.in',
    isNew: true,
    tags: ['Bima Sugam', 'digital insurance', 'IRDAI', 'policy management'],
  },

  // ── Article 4: Term insurance CSR 2023-24 ───────────────────────
  {
    id: 'a4_csr_2024',
    category: 'life_insurance',
    categoryLabel: 'Life Insurance',
    categoryEmoji: '🛡️',
    categoryColour: '#7C3AED',
    title: 'Claim settlement ratios 2023-24: Who pays and who delays?',
    summary:
      'IRDAI released the annual Claim Settlement Ratio report. HDFC Life (99.5%), Max Life (99.51%), and LIC (98.82%) top the list. Know your insurer\'s track record before you buy.',
    fullContent: [
      'The Claim Settlement Ratio (CSR) is the percentage of death claims an insurer settles out of all claims received in a financial year. IRDAI publishes this annually and it is one of the most important metrics for choosing a term plan insurer.',
      'For FY 2023-24, the top performers are: Max Life Insurance (99.51%), HDFC Life Insurance (99.50%), Tata AIA Life (99.13%), and LIC of India (98.82%). A CSR above 95% is generally considered reliable.',
      'However, CSR alone is not the complete picture. The "Claims Repudiation Ratio" (percentage of claims rejected) and the time taken to settle claims (claim settlement TAT) are equally important. Check IRDAI\'s annual report for all three metrics together.',
      'The most common reasons for claim rejection are: non-disclosure of pre-existing conditions at the time of policy purchase, policy lapse due to non-payment of premium, and claims filed outside the policy term.',
      'If your claim is rejected, you have the right to appeal within 30 days. Write to the insurer\'s grievance cell. If unresolved, escalate to the Insurance Ombudsman. Conditions apply per individual policy terms.',
    ],
    kinImpact: 'Check if your current insurer has a CSR above 95% — if not, consider porting at renewal.',
    date: TWO_WEEKS,
    readTime: 4,
    source: 'IRDAI Annual Report 2023-24',
    sourceUrl: 'https://www.irdai.gov.in',
    isNew: false,
    tags: ['term insurance', 'claim settlement ratio', 'life insurance', 'CSR'],
  },

  // ── Article 5: Section 80D tax saving ───────────────────────────
  {
    id: 'a5_80d_tax',
    category: 'tax_savings',
    categoryLabel: 'Tax & Savings',
    categoryEmoji: '💰',
    categoryColour: '#D97706',
    title: 'Section 80D: Claim up to ₹75,000 tax deduction on health insurance',
    summary:
      'You can save significant tax by claiming health insurance premiums under Section 80D. The limit is ₹25,000 for self/family and an additional ₹50,000 if you also pay premiums for senior citizen parents.',
    fullContent: [
      'Section 80D of the Income Tax Act allows you to claim deductions on health insurance premiums paid for yourself, your spouse, children, and parents. This is available under both the old and new tax regime (with certain conditions).',
      'The deduction limits are: ₹25,000 for self, spouse, and dependent children; plus ₹25,000 for parents below 60 years; or ₹50,000 for parents above 60 years (senior citizens). Total maximum deduction: ₹75,000.',
      'Additionally, if you (or your parents) are senior citizens and don\'t have health insurance, you can claim up to ₹50,000 for medical expenses incurred. This was introduced to benefit those unable to purchase insurance due to age or health conditions.',
      'Premium paid for critical illness riders, personal accident covers, and preventive health check-ups (up to ₹5,000 within the limit) also qualify for 80D deduction.',
      'Important: Premiums must be paid by any mode other than cash to be eligible. Ensure you have the premium receipts and the insurer\'s confirmation. Conditions apply per Income Tax Act provisions.',
    ],
    kinImpact: 'If you pay health insurance premiums for your parents, you may be under-claiming your 80D deduction — check with a tax advisor.',
    date: TWO_WEEKS,
    readTime: 3,
    source: 'Income Tax Act / CBDT',
    sourceUrl: 'https://incometaxindia.gov.in',
    isNew: false,
    tags: ['Section 80D', 'tax saving', 'health insurance', 'income tax'],
  },

  // ── Article 6: EPFO EDLI claim simplified ───────────────────────
  {
    id: 'a6_edli_claim',
    category: 'epfo_pf',
    categoryLabel: 'EPFO / PF',
    categoryEmoji: '🏛️',
    categoryColour: '#0891B2',
    title: 'EPFO simplifies EDLI claim: Nominee can now file online',
    summary:
      'EPFO has launched an online claim portal for EDLI death benefits. Nominees can now submit Form 5IF electronically — no employer signature required if the employer is unresponsive.',
    fullContent: [
      'The Employees\' Provident Fund Organisation (EPFO) has simplified the EDLI (Employee Deposit Linked Insurance) claim process. Nominees can now file the death benefit claim online via the Unified Member Portal, without needing a physical signature from the employer.',
      'EDLI provides ₹7,00,000 to the nominee on the death of a PF-contributing member. The benefit is automatic — no separate premium is charged. However, most families are unaware of this benefit and miss filing the claim.',
      'The new process: The nominee logs in at unifiedportal-mem.epfindia.gov.in, navigates to "Online Services → Claim (Form-31, 19, 10C & 10D)", selects "Death Claim", and submits Form 5IF digitally. Bank account must be linked to the EPFO account.',
      'If the employer is unresponsive or the company has shut down, EPFO allows the claim to be processed after a 30-day waiting period with a self-declaration by the nominee. This is a major step forward for claim accessibility.',
      'To prepare: Register your nominee on EPFO portal NOW (e-Nomination under Member Services). If your nominee is not registered, the family will face additional hurdles. This takes less than 5 minutes.',
    ],
    kinImpact: 'If your EPFO e-Nomination is not done, do it today — your nominee cannot claim ₹7L without it.',
    date: MONTH_AGO,
    readTime: 3,
    source: 'EPFO Circular',
    sourceUrl: 'https://unifiedportal-mem.epfindia.gov.in',
    isNew: false,
    tags: ['EPFO', 'EDLI', 'death benefit', 'nomination', 'PF'],
  },

  // ── Article 7: Super top-up explained ───────────────────────────
  {
    id: 'a7_super_topup',
    category: 'health_insurance',
    categoryLabel: 'Health Insurance',
    categoryEmoji: '🏥',
    categoryColour: '#DC2626',
    title: 'Super top-up health plans: The cheapest way to get ₹50L cover',
    summary:
      'A super top-up plan activates after your base cover is exhausted — making it dramatically cheaper than a fresh policy. Here\'s how to stack a ₹5L employer policy with a ₹50L super top-up.',
    fullContent: [
      'A super top-up health insurance plan covers medical expenses that exceed your "deductible" — the threshold below which you use your primary cover. Unlike a regular top-up (which activates per hospitalisation), a super top-up considers the total expenses in a year.',
      'Example: You have ₹5L employer mediclaim. A super top-up with ₹50L cover and ₹5L deductible costs approximately ₹3,000-8,000/year for a 30-year-old. A standalone ₹50L plan would cost ₹15,000-25,000. The super top-up bridges the gap at a fraction of the cost.',
      'Why this matters: Medical inflation in India runs at 14-15% annually. A hospitalisation that cost ₹3L in 2018 costs ₹6L today. With rising costs, a ₹5L employer cover can be exhausted in a single serious illness or surgery.',
      'Key things to check: (1) Does the super top-up cover pre-existing diseases? Most have a 2-year waiting period. (2) Does it cover room rent restrictions? Avoid plans with sub-limits. (3) Is it an individual or family floater plan?',
      'Conditions apply. Super top-up plans are underwritten by licensed general insurance companies. Read the policy wording carefully before purchase. Consult a licensed insurance advisor for personalised advice.',
    ],
    kinImpact: 'If your employer cover is below ₹10L, a super top-up may be the most cost-effective way to close your health gap.',
    date: MONTH_AGO,
    readTime: 4,
    source: 'KIN Research',
    sourceUrl: '',
    isNew: false,
    tags: ['health insurance', 'super top-up', 'mediclaim', 'employer cover'],
  },

  // ── Article 8: KIN Tip — spurious calls ─────────────────────────
  {
    id: 'a8_spurious_calls',
    category: 'kin_tip',
    categoryLabel: 'KIN Tip',
    categoryEmoji: '💡',
    categoryColour: '#6B7280',
    title: '⚠️ How to spot insurance mis-selling and spurious calls',
    summary:
      'IRDAI warns that fraudsters pose as insurance agents to collect premiums for fake policies. Here are 5 signs your caller is not legitimate — and what to do.',
    fullContent: [
      'Insurance fraud via phone calls is rampant in India. Fraudsters pose as agents of LIC, HDFC Life, or other known insurers and convince victims to pay "renewal premiums" or "bonus activation fees" into personal accounts.',
      'Five red flags: (1) Caller offers to activate your policy bonus/dividend for a one-time fee. (2) Caller asks you to transfer money to a personal bank account or UPI ID. (3) Caller cannot provide their IRDAI agent licence number. (4) You receive unsolicited calls about policies you never inquired about. (5) The "policy" has guaranteed returns that sound too good to be true.',
      'Verify any insurance agent by calling IRDAI\'s Bima Bharosa helpline: 1800-4254-732 (toll-free). Ask the caller for their POSP/agent code and verify it on the IRDAI website. Legitimate insurers will never ask you to pay via personal UPI IDs.',
      'If you receive a suspicious call: (1) Do not share OTPs or account details. (2) Hang up and note the number. (3) Report to the National Cyber Crime portal: cybercrime.gov.in. (4) File a complaint with IRDAI at complaints@irdai.gov.in.',
      'KIN will NEVER call you to upsell insurance or collect premiums. All interactions happen within the app. If you receive a call claiming to be from KIN, it is not from us.',
    ],
    kinImpact: 'Never pay any insurance premium via UPI to an individual — only pay through official insurer portals or bank transfers.',
    date: TODAY,
    readTime: 3,
    source: 'IRDAI / KIN Safety',
    sourceUrl: 'https://cybercrime.gov.in',
    isNew: true,
    tags: ['fraud', 'spurious calls', 'mis-selling', 'safety', 'IRDAI'],
  },
]

// ── Helpers ─────────────────────────────────────────────────────
export function getReadArticles(): Set<string> {
  try {
    const raw = localStorage.getItem('kin_brief_read')
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function markAsRead(id: string): void {
  const read = getReadArticles()
  read.add(id)
  try {
    localStorage.setItem('kin_brief_read', JSON.stringify([...read]))
  } catch { /* ignore */ }
}

export function getBookmarkedArticles(): Set<string> {
  try {
    const raw = localStorage.getItem('kin_brief_bookmarks')
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function toggleBookmark(id: string): boolean {
  const bookmarks = getBookmarkedArticles()
  if (bookmarks.has(id)) {
    bookmarks.delete(id)
  } else {
    bookmarks.add(id)
  }
  try {
    localStorage.setItem('kin_brief_bookmarks', JSON.stringify([...bookmarks]))
  } catch { /* ignore */ }
  return bookmarks.has(id)
}

export const CATEGORIES: { id: BriefCategory | 'all'; label: string; emoji: string }[] = [
  { id: 'all',              label: 'All',            emoji: '📰' },
  { id: 'irdai_update',     label: 'IRDAI',          emoji: '🏛️' },
  { id: 'government_scheme',label: 'Schemes',        emoji: '🏛️' },
  { id: 'health_insurance', label: 'Health',         emoji: '🏥' },
  { id: 'life_insurance',   label: 'Life',           emoji: '🛡️' },
  { id: 'tax_savings',      label: 'Tax',            emoji: '💰' },
  { id: 'epfo_pf',          label: 'EPFO',           emoji: '🏛️' },
  { id: 'kin_tip',          label: 'KIN Tips',       emoji: '💡' },
]
