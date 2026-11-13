/**
 * emergencyLetter.ts — Module 7: Protection Vault
 *
 * Pure model of the Emergency Access Letter. One structure feeds two
 * renderers: plain text (letterToText) and PDF (emergencyLetterPdf.ts).
 * No DOM, no storage — safe to unit-test in node.
 */

import type { VaultDocument, VaultNominee } from './vaultStore'
import { DOCUMENT_TYPE_LABELS, RELATIONSHIP_LABELS } from './vaultStore'

export type LetterField = { label: string; value: string }
export type LetterEntry = { heading: string; fields: LetterField[] }

export type EmergencyLetter = {
  title: string
  subtitle: string
  holder: LetterField[]
  notice: string
  policies: LetterEntry[]
  nominees: LetterEntry[]
  claimSteps: string[]
  disclaimer: string[]
}

export type LetterInput = {
  holderName: string
  holderPhone: string
  documents: VaultDocument[]
  nominees: VaultNominee[]
  generatedOn: Date
}

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = MONTHS_LONG.map(m => m.slice(0, 3))

function formatLongDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

/** Formats a YYYY-MM-DD string without going through Date (no timezone shift). */
function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  return `${Number(m[3])} ${MONTHS_SHORT[Number(m[2]) - 1]} ${m[1]}`
}

export function formatSumAssured(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Crore`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} Lakh`
  return `₹${n.toLocaleString('en-IN')}`
}

const CLAIM_STEPS = [
  'Contact the insurer directly using the policy number above.',
  'Request a claim form (death / disability / hospitalisation).',
  'Gather: death certificate, nominee ID proof, policy document, and bank account details of the claimant.',
  'For EPFO EDLI: visit unifiedportal-mem.epfindia.gov.in and file Form 5IF for the EDLI death claim.',
  'For PMSBY / PMJJBY: contact your bank branch with the policy details.',
  'IRDAI Bima Bharosa (complaints): 1800-4254-732 (toll-free).',
]

const DISCLAIMER = [
  'This document is a personal record generated for convenience.',
  'It is NOT a policy document or legal instrument.',
  'Benefits are subject to individual policy terms and conditions.',
  'KIN Financial Wellness is not responsible for claim outcomes.',
  'Conditions apply.',
]

export function buildEmergencyLetter(input: LetterInput): EmergencyLetter {
  const { documents, nominees } = input
  const byId = new Map(nominees.map(n => [n.id, n]))

  const policies: LetterEntry[] = documents.map((doc, i) => {
    const fields: LetterField[] = [
      { label: 'Insurer', value: doc.insurer || 'Not specified' },
      { label: 'Policy no.', value: doc.policyNumber || 'Not specified' },
    ]
    if (doc.sumAssured > 0) fields.push({ label: 'Sum assured', value: formatSumAssured(doc.sumAssured) })
    if (doc.renewalDate) fields.push({ label: 'Renewal date', value: formatIsoDate(doc.renewalDate) })
    const nominee = doc.nomineeId ? byId.get(doc.nomineeId) : undefined
    if (nominee) {
      fields.push({ label: 'Nominee', value: `${nominee.name} (${RELATIONSHIP_LABELS[nominee.relationship]})` })
      if (nominee.phone) fields.push({ label: 'Nominee phone', value: nominee.phone })
    }
    if (doc.notes) fields.push({ label: 'Notes', value: doc.notes })
    return { heading: `Policy ${i + 1}: ${DOCUMENT_TYPE_LABELS[doc.type]}`, fields }
  })

  const nomineeEntries: LetterEntry[] = nominees.map(n => {
    const fields: LetterField[] = []
    if (n.phone) fields.push({ label: 'Phone', value: n.phone })
    if (n.email) fields.push({ label: 'Email', value: n.email })
    if (n.aadhaarLast4) fields.push({ label: 'Aadhaar ending', value: `XXXX-${n.aadhaarLast4}` })
    return { heading: `${n.name} - ${RELATIONSHIP_LABELS[n.relationship]}`, fields }
  })

  return {
    title: 'EMERGENCY INSURANCE ACCESS LETTER',
    subtitle: 'Generated via KIN Financial Wellness',
    holder: [
      { label: 'Policyholder', value: input.holderName.trim() || '[Your Name]' },
      { label: 'Contact', value: input.holderPhone.trim() || '[Your Phone]' },
      { label: 'Generated on', value: formatLongDate(input.generatedOn) },
    ],
    notice: 'IMPORTANT: If you are reading this, the policyholder may be unable to act. Follow the steps below to file claims.',
    policies,
    nominees: nomineeEntries,
    claimSteps: CLAIM_STEPS,
    disclaimer: DISCLAIMER,
  }
}

// ── Plain-text renderer ─────────────────────────────────────────
const RULE_HEAVY = '═'.repeat(59)
const RULE_LIGHT = '─'.repeat(59)

function fieldLines(fields: LetterField[], indent = '  '): string[] {
  const width = Math.max(0, ...fields.map(f => f.label.length))
  return fields.map(f => `${indent}${f.label.padEnd(width)} : ${f.value}`)
}

export function letterToText(letter: EmergencyLetter): string {
  const lines: string[] = [
    RULE_HEAVY,
    letter.title,
    letter.subtitle,
    RULE_HEAVY,
    '',
    ...fieldLines(letter.holder, ''),
    '',
    RULE_LIGHT,
    letter.notice,
    RULE_LIGHT,
    '',
    'INSURANCE POLICIES',
    '',
  ]

  if (letter.policies.length === 0) {
    lines.push('No policies recorded in vault yet.', '')
  }
  for (const p of letter.policies) {
    lines.push(p.heading, ...fieldLines(p.fields), '')
  }

  if (letter.nominees.length > 0) {
    lines.push(RULE_LIGHT, 'NOMINEE CONTACTS', '')
    for (const n of letter.nominees) {
      lines.push(n.heading, ...fieldLines(n.fields), '')
    }
  }

  lines.push(RULE_LIGHT, 'STEPS TO FILE A CLAIM', '')
  letter.claimSteps.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
  lines.push('', RULE_LIGHT, 'DISCLAIMER', '', ...letter.disclaimer, '', RULE_HEAVY)

  return lines.join('\n')
}

// ── PDF text safety ─────────────────────────────────────────────
const PDF_REPLACEMENTS: [RegExp, string][] = [
  [/₹\s?/g, 'Rs. '],
  [/[—–]/g, '-'],
  [/→/g, '->'],
  [/[“”]/g, '"'],
  [/[‘’]/g, "'"],
  [/…/g, '...'],
]

/**
 * jsPDF's built-in fonts only cover Latin-1. Swap the common symbols for
 * readable equivalents and turn anything else into '?', so the PDF never
 * shows garbled glyphs. Callers can use hasUnsupportedChars() to offer
 * the plain-text download instead.
 */
export function toPdfSafe(s: string): string {
  let out = s
  for (const [re, rep] of PDF_REPLACEMENTS) out = out.replace(re, rep)
  let result = ''
  for (const ch of out) result += ch.codePointAt(0)! > 0xff ? '?' : ch
  return result
}

/** True when the letter holds text (e.g. Devanagari names) the PDF cannot draw. */
export function hasUnsupportedChars(letter: EmergencyLetter): boolean {
  let s = letterToText(letter).replace(/[═─]/g, '')
  for (const [re, rep] of PDF_REPLACEMENTS) s = s.replace(re, rep)
  for (const ch of s) if (ch.codePointAt(0)! > 0xff) return true
  return false
}

export function letterFileName(d: Date, ext: 'pdf' | 'txt'): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `KIN_Emergency_Access_Letter_${y}-${m}-${day}.${ext}`
}
