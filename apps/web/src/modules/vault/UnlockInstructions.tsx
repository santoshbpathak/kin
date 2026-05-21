/**
 * UnlockInstructions.tsx — Module 7: Protection Vault
 *
 * Generates a downloadable "Emergency Access Letter" — a plain-text
 * document that tells the nominee exactly what to do in case of
 * the policyholder's death or incapacitation.
 *
 * This is one of KIN's highest-value features:
 *   "Your family shouldn't have to figure this out in their worst moment."
 *
 * Output: .txt file via Blob URL (no backend required in MVP).
 * Phase 2: WhatsApp delivery + encrypted PDF.
 */

import { useState } from 'react'
import type { VaultDocument, VaultNominee } from './vaultStore'
import { DOCUMENT_TYPE_LABELS } from './vaultStore'

type Props = {
  documents: VaultDocument[]
  nominees: VaultNominee[]
  holderName: string
}

export function UnlockInstructions({ documents, nominees, holderName }: Props) {
  const [name, setName] = useState(holderName)
  const [phone, setPhone] = useState('')
  const [downloaded, setDownloaded] = useState(false)

  const hasData = documents.length > 0 || nominees.length > 0

  function getNomineeById(id: string | null): VaultNominee | undefined {
    if (!id) return undefined
    return nominees.find(n => n.id === id)
  }

  function generateLetter(): string {
    const now = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    const lines: string[] = [
      '═══════════════════════════════════════════════════════════',
      '              EMERGENCY INSURANCE ACCESS LETTER',
      '             Generated via KIN Financial Wellness',
      '═══════════════════════════════════════════════════════════',
      '',
      `Policyholder : ${name || '[Your Name]'}`,
      `Contact      : ${phone || '[Your Phone]'}`,
      `Generated on : ${now}`,
      '',
      '───────────────────────────────────────────────────────────',
      'IMPORTANT: If you are reading this, the policyholder may be',
      'unable to act. Follow the steps below to file claims.',
      '───────────────────────────────────────────────────────────',
      '',
    ]

    if (documents.length > 0) {
      lines.push('INSURANCE POLICIES', '')
      documents.forEach((doc, i) => {
        const nominee = getNomineeById(doc.nomineeId)
        lines.push(`Policy ${i + 1}: ${DOCUMENT_TYPE_LABELS[doc.type]}`)
        lines.push(`  Insurer      : ${doc.insurer || 'Not specified'}`)
        lines.push(`  Policy No.   : ${doc.policyNumber || 'Not specified'}`)
        if (doc.sumAssured > 0) {
          const cr = doc.sumAssured / 10_000_000
          const lakh = doc.sumAssured / 100_000
          lines.push(`  Sum Assured  : ₹${cr >= 1 ? cr.toFixed(2) + ' Crore' : lakh.toFixed(0) + ' Lakh'}`)
        }
        if (doc.renewalDate) lines.push(`  Renewal Date : ${doc.renewalDate}`)
        if (nominee) {
          lines.push(`  Nominee      : ${nominee.name} (${nominee.relationship})`)
          if (nominee.phone) lines.push(`  Nom. Phone   : ${nominee.phone}`)
        }
        if (doc.notes) lines.push(`  Notes        : ${doc.notes}`)
        lines.push('')
      })
    } else {
      lines.push('No policies recorded in vault yet.', '')
    }

    if (nominees.length > 0) {
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('NOMINEE CONTACTS', '')
      nominees.forEach(n => {
        lines.push(`${n.name} — ${n.relationship}`)
        if (n.phone) lines.push(`  📞 ${n.phone}`)
        if (n.email) lines.push(`  ✉️  ${n.email}`)
        if (n.aadhaarLast4) lines.push(`  🪪 Aadhaar ending: XXXX-${n.aadhaarLast4}`)
        lines.push('')
      })
    }

    lines.push('───────────────────────────────────────────────────────────')
    lines.push('STEPS TO FILE A CLAIM', '')
    lines.push('1. Contact the insurer directly using the policy number above.')
    lines.push('2. Request a claim form (death/disability/hospitalisation).')
    lines.push('3. Gather: death certificate, nominee ID proof, policy document,')
    lines.push('   bank account details of the claimant.')
    lines.push('4. For EPFO EDLI: visit unifiedportal-mem.epfindia.gov.in')
    lines.push('   → File Form 5IF for EDLI death claim.')
    lines.push('5. For PMSBY/PMJJBY: contact your bank branch with policy details.')
    lines.push('6. IRDAI Bima Bharosa (complaints): 1800-4254-732 (toll-free)')
    lines.push('')
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('DISCLAIMER')
    lines.push('')
    lines.push('This document is a personal record generated for convenience.')
    lines.push('It is NOT a policy document or legal instrument.')
    lines.push('Benefits are subject to individual policy terms and conditions.')
    lines.push('KIN Financial Wellness is not responsible for claim outcomes.')
    lines.push('Conditions apply.')
    lines.push('')
    lines.push('═══════════════════════════════════════════════════════════')

    return lines.join('\n')
  }

  function handleDownload() {
    const text = generateLetter()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `KIN_Emergency_Access_Letter_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  return (
    <div className="px-5 pt-5 pb-10 space-y-5">
      {/* Hero */}
      <div className="rounded-2xl border-2 p-5 text-center"
        style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, white)' }}
      >
        <div className="text-4xl mb-3">🔐</div>
        <h2 className="text-base font-extrabold text-gray-900 mb-2">
          Emergency Access Letter
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          A plain-English guide for your family — exactly what to do, who to call,
          and which policies to claim if something happens to you.
        </p>
      </div>

      {/* No data warning */}
      {!hasData && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs text-amber-700 leading-relaxed">
            ⚠️ Add at least one policy and one nominee before generating your letter —
            otherwise it will be mostly empty.
          </p>
        </div>
      )}

      {/* Personalise */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Personalise</p>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Your full name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Santosh Pathak"
            className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
            style={{ borderColor: name ? 'var(--color-primary)' : '#E5E7EB' }}
            autoCapitalize="words"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Your contact number</label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
            style={{ borderColor: phone ? 'var(--color-primary)' : '#E5E7EB' }}
          />
        </div>
      </div>

      {/* What's included */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
          What the letter includes
        </p>
        {[
          `${documents.length} insurance polic${documents.length === 1 ? 'y' : 'ies'} with claim instructions`,
          `${nominees.length} nominee contact${nominees.length === 1 ? '' : 's'}`,
          'Step-by-step claim filing guide',
          'EPFO EDLI claim process (Form 5IF)',
          'IRDAI Bima Bharosa helpline number',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-green-500 font-bold shrink-0">✓</span>
            {item}
          </div>
        ))}
      </div>

      {/* Download */}
      <button
        onClick={handleDownload}
        className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        ↓ Download Emergency Letter
      </button>

      {downloaded && (
        <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center animate-fade-in">
          <p className="text-sm font-bold text-green-700">✅ Downloaded!</p>
          <p className="text-[11px] text-green-600 mt-0.5">
            Share this file with a trusted family member or store it in Google Drive / iCloud.
          </p>
        </div>
      )}

      {/* WhatsApp teaser */}
      <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">💬</span>
        <div>
          <p className="text-xs font-bold text-green-800">Coming soon: WhatsApp delivery</p>
          <p className="text-[11px] text-green-600 mt-0.5 leading-relaxed">
            KIN will send this letter directly to your nominee's WhatsApp — encrypted,
            and only triggered on your explicit request.
          </p>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed text-center">
        This letter is a personal convenience document. It is not a policy document
        or legal instrument. Benefits are subject to individual policy terms. Conditions apply.
      </p>
    </div>
  )
}
