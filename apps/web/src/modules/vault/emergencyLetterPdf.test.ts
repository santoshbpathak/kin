import { describe, expect, it } from 'vitest'
import { buildEmergencyLetter } from './emergencyLetter'
import { renderLetterPdf } from './emergencyLetterPdf'
import type { VaultDocument } from './vaultStore'

// Synthetic fixtures only — no real personal data.
function policy(i: number): VaultDocument {
  return {
    id: `d${i}`, type: 'health', insurer: `Demo Health ${i}`, policyNumber: `POL-${i}`,
    sumAssured: 500_000, annualPremium: 9_000, renewalDate: '2027-03-01', nomineeId: null,
    notes: 'Cashless card in wallet. '.repeat(6), addedAt: '2026-01-01T00:00:00.000Z', fileName: 'h',
  }
}

const generatedOn = new Date('2026-11-13T10:00:00.000Z')

async function render(count: number) {
  const letter = buildEmergencyLetter({
    holderName: 'Ravi Demo', holderPhone: '9000000002',
    documents: Array.from({ length: count }, (_, i) => policy(i + 1)), nominees: [], generatedOn,
  })
  return renderLetterPdf(letter)
}

describe('renderLetterPdf', () => {
  it('produces a valid PDF containing the policy details', async () => {
    const doc = await render(1)
    const bytes = new Uint8Array(doc.output('arraybuffer'))
    const raw = new TextDecoder('latin1').decode(bytes)
    expect(raw.startsWith('%PDF-')).toBe(true)
    expect(raw).toContain('Demo Health 1')
    expect(raw).toContain('Rs. 5 Lakh')
    expect(doc.getNumberOfPages()).toBe(1)
  })

  it('flows long letters onto extra pages', async () => {
    const doc = await render(12)
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
  })
})
