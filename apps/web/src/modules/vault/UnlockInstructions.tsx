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
import { Button, Card, Input, PrivacyLine } from '@/components/ui'
import { IconLock, IconAlert, IconCheck, IconCheckCircle, IconChat } from '@/components/ui/icons'

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
      <div>
        <p className="t-micro text-muted mb-1">Emergency Access</p>
        <h1 className="t-h2 text-navy leading-tight flex items-center gap-2"><IconLock size={24} className="text-navy shrink-0" /> Emergency Access Letter</h1>
        <p className="t-body-sm text-muted mt-1">
          A plain-English guide for your family - exactly what to do, who to call,
          and which policies to claim if something happens to you.
        </p>
      </div>

      {/* No data warning */}
      {!hasData && (
        <Card className="border-amber/40 bg-sand-deep">
          <p className="t-body-sm text-amber leading-relaxed flex items-start gap-2">
            <IconAlert size={16} className="text-amber shrink-0 mt-0.5" />
            Add at least one policy and one nominee before generating your letter -
            otherwise it will be mostly empty.
          </p>
        </Card>
      )}

      {/* Personalise */}
      <div className="space-y-3">
        <p className="t-micro text-muted">Personalise</p>
        <Input
          label="Your full name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Santosh Pathak"
          autoCapitalize="words"
        />
        <Input
          label="Your contact number"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
        />
      </div>

      {/* What's included */}
      <Card className="space-y-2">
        <p className="t-micro text-muted mb-2">What the letter includes</p>
        {[
          `${documents.length} insurance polic${documents.length === 1 ? 'y' : 'ies'} with claim instructions`,
          `${nominees.length} nominee contact${nominees.length === 1 ? '' : 's'}`,
          'Step-by-step claim filing guide',
          'EPFO EDLI claim process (Form 5IF)',
          'IRDAI Bima Bharosa helpline number',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <IconCheck size={16} className="text-teal-deep shrink-0" />
            <span className="t-body-sm text-slate">{item}</span>
          </div>
        ))}
      </Card>

      {/* Download */}
      <Button fullWidth onClick={handleDownload}>
        ↓ Download Emergency Letter
      </Button>

      {downloaded && (
        <Card className="border-teal/30 bg-mint text-center">
          <p className="t-body font-bold text-teal-deep flex items-center justify-center gap-1.5"><IconCheckCircle size={18} className="text-teal-deep shrink-0" /> Downloaded!</p>
          <p className="t-body-sm text-teal-deep mt-0.5">
            Share this file with a trusted family member or store it in Google Drive / iCloud.
          </p>
        </Card>
      )}

      {/* WhatsApp teaser */}
      <div className="rounded-md border border-dashed border-teal/30 bg-mint p-4 flex items-start gap-3">
        <IconChat size={24} className="text-teal-deep shrink-0" />
        <div>
          <p className="t-body font-bold text-teal-deep">Coming soon: WhatsApp delivery</p>
          <p className="t-body-sm text-teal-deep mt-0.5 leading-relaxed">
            KIN will send this letter directly to your nominee's WhatsApp - encrypted,
            and only triggered on your explicit request.
          </p>
        </div>
      </div>

      <PrivacyLine />
    </div>
  )
}
