import { describe, expect, it } from 'vitest'
import {
  buildEmergencyLetter,
  formatSumAssured,
  hasUnsupportedChars,
  letterFileName,
  letterToText,
  toPdfSafe,
} from './emergencyLetter'
import type { VaultDocument, VaultNominee } from './vaultStore'

// Synthetic fixtures only (see docs/demo/personas.md) — no real personal data.
const nominee: VaultNominee = {
  id: 'n1',
  name: 'Asha Demo',
  relationship: 'spouse',
  phone: '9000000001',
  email: 'asha@example.test',
  aadhaarLast4: '0001',
  addedAt: '2026-01-01T00:00:00.000Z',
}

const policy: VaultDocument = {
  id: 'd1',
  type: 'term_life',
  insurer: 'Demo Life',
  policyNumber: 'POL-0001',
  sumAssured: 15_000_000,
  annualPremium: 12_000,
  renewalDate: '2029-11-25',
  nomineeId: 'n1',
  notes: 'Papers in the blue folder',
  addedAt: '2026-01-01T00:00:00.000Z',
  fileName: 'term',
}

const generatedOn = new Date('2026-11-13T10:00:00.000Z')

describe('formatSumAssured', () => {
  it('uses crore at or above one crore', () => {
    expect(formatSumAssured(15_000_000)).toBe('₹1.50 Crore')
  })
  it('uses lakh below one crore', () => {
    expect(formatSumAssured(400_000)).toBe('₹4 Lakh')
  })
  it('uses plain rupees below one lakh', () => {
    expect(formatSumAssured(50_000)).toBe('₹50,000')
  })
})

describe('buildEmergencyLetter', () => {
  it('carries holder, policies, nominees and claim steps', () => {
    const letter = buildEmergencyLetter({
      holderName: 'Ravi Demo',
      holderPhone: '9000000002',
      documents: [policy],
      nominees: [nominee],
      generatedOn,
    })

    expect(letter.holder).toEqual([
      { label: 'Policyholder', value: 'Ravi Demo' },
      { label: 'Contact', value: '9000000002' },
      { label: 'Generated on', value: '13 November 2026' },
    ])
    expect(letter.policies).toHaveLength(1)
    expect(letter.policies[0].heading).toBe('Policy 1: Term Life Insurance')
    expect(letter.policies[0].fields).toContainEqual({ label: 'Sum assured', value: '₹1.50 Crore' })
    expect(letter.policies[0].fields).toContainEqual({ label: 'Nominee', value: 'Asha Demo (Spouse)' })
    expect(letter.policies[0].fields).toContainEqual({ label: 'Renewal date', value: '25 Nov 2029' })
    expect(letter.nominees[0].heading).toBe('Asha Demo - Spouse')
    expect(letter.nominees[0].fields).toContainEqual({ label: 'Aadhaar ending', value: 'XXXX-0001' })
    expect(letter.claimSteps.length).toBeGreaterThanOrEqual(5)
  })

  it('uses placeholders when the holder fields are blank', () => {
    const letter = buildEmergencyLetter({
      holderName: '  ',
      holderPhone: '',
      documents: [],
      nominees: [],
      generatedOn,
    })
    expect(letter.holder[0].value).toBe('[Your Name]')
    expect(letter.holder[1].value).toBe('[Your Phone]')
    expect(letter.policies).toEqual([])
  })

  it('omits empty optional fields', () => {
    const bare: VaultDocument = { ...policy, sumAssured: 0, renewalDate: '', nomineeId: null, notes: '' }
    const letter = buildEmergencyLetter({
      holderName: 'Ravi Demo', holderPhone: '', documents: [bare], nominees: [], generatedOn,
    })
    const labels = letter.policies[0].fields.map(f => f.label)
    expect(labels).toEqual(['Insurer', 'Policy no.'])
  })
})

describe('letterToText', () => {
  it('renders every section in reading order', () => {
    const text = letterToText(buildEmergencyLetter({
      holderName: 'Ravi Demo', holderPhone: '9000000002',
      documents: [policy], nominees: [nominee], generatedOn,
    }))
    const order = ['EMERGENCY INSURANCE ACCESS LETTER', 'Ravi Demo', 'INSURANCE POLICIES',
      'POL-0001', 'NOMINEE CONTACTS', 'STEPS TO FILE A CLAIM', 'DISCLAIMER']
    const positions = order.map(s => text.indexOf(s))
    positions.forEach(p => expect(p).toBeGreaterThanOrEqual(0))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('says so when there are no policies', () => {
    const text = letterToText(buildEmergencyLetter({
      holderName: '', holderPhone: '', documents: [], nominees: [], generatedOn,
    }))
    expect(text).toContain('No policies recorded in vault yet.')
  })
})

describe('toPdfSafe', () => {
  it('replaces glyphs the built-in PDF fonts cannot draw', () => {
    expect(toPdfSafe('₹1.50 Crore')).toBe('Rs. 1.50 Crore')
    expect(toPdfSafe('Asha — Spouse → claim')).toBe('Asha - Spouse -> claim')
    expect(toPdfSafe('“quoted” ‘text’…')).toBe('"quoted" \'text\'...')
  })
  it('keeps Latin-1 text unchanged', () => {
    expect(toPdfSafe('Café policy #12')).toBe('Café policy #12')
  })
  it('replaces any remaining unsupported character with ?', () => {
    expect(toPdfSafe('आशा')).toBe('???')
  })
})

describe('hasUnsupportedChars', () => {
  const base = { holderPhone: '', documents: [policy], nominees: [nominee], generatedOn }
  it('is false for Latin text with rupee signs and dashes', () => {
    expect(hasUnsupportedChars(buildEmergencyLetter({ ...base, holderName: 'Ravi Demo' }))).toBe(false)
  })
  it('is true when a name is in Devanagari', () => {
    expect(hasUnsupportedChars(buildEmergencyLetter({ ...base, holderName: 'रवि' }))).toBe(true)
  })
})

describe('letterFileName', () => {
  it('dates the file and uses the requested extension', () => {
    expect(letterFileName(generatedOn, 'pdf')).toBe('KIN_Emergency_Access_Letter_2026-11-13.pdf')
    expect(letterFileName(generatedOn, 'txt')).toBe('KIN_Emergency_Access_Letter_2026-11-13.txt')
  })
})
