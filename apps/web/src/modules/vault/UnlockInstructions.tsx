/**
 * UnlockInstructions.tsx — Module 7: Protection Vault
 *
 * Generates a downloadable "Emergency Access Letter" — a PDF (plain
 * text as a fallback) that tells the nominee exactly what to do in case
 * of the policyholder's death or incapacitation.
 *
 * This is one of KIN's highest-value features:
 *   "Your family shouldn't have to figure this out in their worst moment."
 *
 * Output: PDF via jsPDF (lazy-loaded), .txt fallback; both via Blob URL,
 * no backend. Content lives in emergencyLetter.ts (pure, tested).
 * Phase 2: WhatsApp delivery + encrypted PDF.
 */

import { useState } from 'react'
import type { VaultDocument, VaultNominee } from './vaultStore'
import {
  buildEmergencyLetter,
  hasUnsupportedChars,
  letterFileName,
  letterToText,
} from './emergencyLetter'
import { renderLetterPdf } from './emergencyLetterPdf'
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

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function currentLetter() {
    return buildEmergencyLetter({
      holderName: name,
      holderPhone: phone,
      documents,
      nominees,
      generatedOn: new Date(),
    })
  }

  const needsTextVersion = hasUnsupportedChars(currentLetter())

  function saveBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleDownloadPdf() {
    setBusy(true)
    setError(null)
    try {
      const letter = currentLetter()
      const pdf = await renderLetterPdf(letter)
      saveBlob(pdf.output('blob'), letterFileName(new Date(), 'pdf'))
      setDownloaded(true)
    } catch {
      setError('Could not create the PDF. Try the plain-text version below.')
    } finally {
      setBusy(false)
    }
  }

  function handleDownloadText() {
    const text = letterToText(currentLetter())
    saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), letterFileName(new Date(), 'txt'))
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
          placeholder="e.g. Priya Sharma"
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
      <Button fullWidth onClick={handleDownloadPdf} disabled={busy}>
        {busy ? 'Preparing PDF…' : '↓ Download Emergency Letter (PDF)'}
      </Button>

      {needsTextVersion && (
        <p className="t-body-sm text-amber leading-relaxed flex items-start gap-1.5">
          <IconAlert size={16} className="text-amber shrink-0 mt-0.5" />
          <span>Some names use characters the PDF cannot show yet (they appear as “?”). Use the plain-text version for those.</span>
        </p>
      )}

      {error && <p className="t-body-sm text-coral">{error}</p>}

      <button
        type="button"
        onClick={handleDownloadText}
        className="t-body-sm text-teal-deep underline min-h-[44px] w-full"
      >
        Download as plain text instead
      </button>

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
