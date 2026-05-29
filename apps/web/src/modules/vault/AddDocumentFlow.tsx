/**
 * AddDocumentFlow.tsx — Module 7: Protection Vault
 *
 * Multi-step wizard to add an insurance document to the vault.
 *
 * Steps:
 *   1. Document type selection
 *   2. Insurer + policy number
 *   3. Sum assured + annual premium
 *   4. Renewal date + nominee linkage
 *   5. Notes + confirm
 *
 * No actual file stored in MVP1 — only structured metadata.
 * File upload (PDF → encrypted S3) will come in Phase 2 with backend.
 *
 * DPDP: Minimum fields only. Policy number stored as typed (user's choice).
 */

import { useState } from 'react'
import type { DocumentType, VaultNominee } from './vaultStore'
import { DOCUMENT_TYPE_LABELS, addDocument } from './vaultStore'
import { Button, Card } from '@/components/ui'
import {
  IconShield, IconHealth, IconCard, IconHome, IconBuilding, IconDoc, IconVault,
} from '@/components/ui/icons'
import type { ComponentType } from 'react'

/** Maps each document type to a brand icon component */
const DOCUMENT_TYPE_ICON: Record<DocumentType, ComponentType<{ size?: number; className?: string }>> = {
  term_life:         IconShield,
  health:            IconHealth,
  personal_accident: IconShield,
  vehicle:           IconCard,
  home_loan:         IconHome,
  epfo_edli:         IconBuilding,
  group_term:        IconBuilding,
  other:             IconDoc,
}

const DOC_TYPES: DocumentType[] = [
  'term_life', 'health', 'personal_accident', 'vehicle',
  'home_loan', 'epfo_edli', 'group_term', 'other',
]

type FormData = {
  type: DocumentType | ''
  insurer: string
  policyNumber: string
  sumAssured: string
  annualPremium: string
  renewalDate: string
  nomineeId: string
  notes: string
  fileName: string
}

type Props = {
  nominees: VaultNominee[]
  onComplete: () => void
  onCancel: () => void
}

/** Shared field wrapper with label */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="t-micro mb-1.5 block text-muted">
      {children}
    </label>
  )
}

/** Shared text input styled to brand tokens */
function FieldInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  className?: string
}) {
  const active = Boolean(value)
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={[
        'h-[56px] w-full rounded-sm border-2 bg-surface px-4 text-sm text-navy outline-none transition-colors duration-fast placeholder:text-muted focus:border-teal',
        active ? 'border-teal' : 'border-hairline',
        className ?? '',
      ].join(' ')}
    />
  )
}

export function AddDocumentFlow({ nominees, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({
    type: '', insurer: '', policyNumber: '', sumAssured: '',
    annualPremium: '', renewalDate: '', nomineeId: '', notes: '', fileName: '',
  })

  const totalSteps = 5
  const progress = ((step - 1) / (totalSteps - 1)) * 100

  function patch(fields: Partial<FormData>) {
    setForm(f => ({ ...f, ...fields }))
  }

  function handleSave() {
    addDocument({
      type: form.type as DocumentType,
      insurer: form.insurer.trim(),
      policyNumber: form.policyNumber.trim(),
      sumAssured: parseInt(form.sumAssured.replace(/,/g, ''), 10) || 0,
      annualPremium: parseInt(form.annualPremium.replace(/,/g, ''), 10) || 0,
      renewalDate: form.renewalDate,
      nomineeId: form.nomineeId || null,
      notes: form.notes.trim(),
      fileName: form.fileName.trim() || `${form.type}_policy`,
    })
    onComplete()
  }

  return (
    <div className="flex flex-col">
      {/* Progress bar */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="t-micro text-muted">Step {step} of {totalSteps}</p>
          <button
            onClick={onCancel}
            className="t-body-sm text-muted min-h-[44px] min-w-[44px] flex items-center justify-end"
          >
            Cancel
          </button>
        </div>
        <div className="h-1.5 bg-sand-deep rounded-pill overflow-hidden">
          <div
            className="h-full rounded-pill bg-teal transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-5 space-y-4 flex-1">

        {/* ── Step 1: Type ── */}
        {step === 1 && (
          <>
            <h2 className="t-h3 text-navy">What type of policy?</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {DOC_TYPES.map(t => {
                const selected = form.type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { patch({ type: t }); setStep(2) }}
                    className={[
                      'flex flex-col items-center gap-1.5 px-3 py-4 rounded-md border-2 transition-colors duration-fast min-h-[44px]',
                      selected
                        ? 'border-teal bg-mint'
                        : 'border-hairline bg-surface',
                    ].join(' ')}
                  >
                    {(() => { const Icon = DOCUMENT_TYPE_ICON[t]; return <Icon size={28} className="text-navy" /> })()}
                    <span className="t-caption text-center text-navy leading-tight">
                      {DOCUMENT_TYPE_LABELS[t]}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── Step 2: Insurer + policy number ── */}
        {step === 2 && (
          <>
            <h2 className="t-h3 text-navy flex items-center gap-2">
              {(() => { const Icon = DOCUMENT_TYPE_ICON[form.type as DocumentType]; return <Icon size={22} className="text-navy shrink-0" /> })()}
              {DOCUMENT_TYPE_LABELS[form.type as DocumentType]}
            </h2>
            <p className="t-body-sm text-muted">Insurer name and policy number — from your policy document.</p>

            <div className="space-y-4">
              <div>
                <FieldLabel>Insurer / Company name *</FieldLabel>
                <FieldInput
                  value={form.insurer}
                  onChange={e => patch({ insurer: e.target.value })}
                  placeholder="e.g. HDFC Life, LIC, Niva Bupa"
                />
              </div>
              <div>
                <FieldLabel>Policy number</FieldLabel>
                <FieldInput
                  value={form.policyNumber}
                  onChange={e => patch({ policyNumber: e.target.value })}
                  placeholder="e.g. 123456789"
                  className="font-mono"
                />
              </div>
              <div>
                <FieldLabel>Document / file name (for your reference)</FieldLabel>
                <FieldInput
                  value={form.fileName}
                  onChange={e => patch({ fileName: e.target.value })}
                  placeholder="e.g. HDFC Term Plan 2024"
                />
              </div>
            </div>

            <Card className="p-3">
              <p className="t-caption text-slate leading-relaxed">
                <IconVault size={16} className="text-slate inline-block align-text-bottom mr-1" /><strong>MVP Note:</strong> KIN stores policy metadata only — not the PDF file.
                Document upload (encrypted) will be available in the next release.
              </p>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                ← Back
              </Button>
              <Button
                size="md"
                className="flex-1"
                onClick={() => setStep(3)}
                disabled={!form.insurer.trim()}
              >
                Next →
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: Cover amounts + premium ── */}
        {step === 3 && (
          <>
            <h2 className="t-h3 text-navy">Coverage amounts</h2>
            <p className="t-body-sm text-muted">From your policy schedule page. Leave blank if unsure.</p>

            <div className="space-y-4">
              <div>
                <FieldLabel>Cover amount (₹)</FieldLabel>
                <FieldInput
                  type="number"
                  inputMode="numeric"
                  value={form.sumAssured}
                  onChange={e => patch({ sumAssured: e.target.value })}
                  placeholder="e.g. 10000000 for ₹1 Cr"
                />
                {form.sumAssured && parseInt(form.sumAssured) >= 100_000 && (
                  <p className="t-caption text-teal-deep mt-1 font-semibold nums">
                    = ₹{(parseInt(form.sumAssured) / 100_000).toFixed(0)} Lakh
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Annual Premium (₹)</FieldLabel>
                <FieldInput
                  type="number"
                  inputMode="numeric"
                  value={form.annualPremium}
                  onChange={e => patch({ annualPremium: e.target.value })}
                  placeholder="e.g. 12000"
                />
              </div>
            </div>

            <p className="t-caption text-muted leading-relaxed">
              Conditions apply. Amounts are for your reference only and do not constitute a guarantee
              of any benefit. Refer to your policy document for exact terms.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
              <Button size="md" className="flex-1" onClick={() => setStep(4)}>Next →</Button>
            </div>
          </>
        )}

        {/* ── Step 4: Renewal date + nominee ── */}
        {step === 4 && (
          <>
            <h2 className="t-h3 text-navy">Renewal &amp; nominee</h2>
            <p className="t-body-sm text-muted">KIN will remind you before your policy lapses.</p>

            <div className="space-y-4">
              <div>
                <FieldLabel>Renewal / expiry date</FieldLabel>
                <input
                  type="date"
                  value={form.renewalDate}
                  onChange={e => patch({ renewalDate: e.target.value })}
                  className={[
                    'h-[56px] w-full rounded-sm border-2 bg-surface px-4 text-sm text-navy outline-none transition-colors duration-fast focus:border-teal',
                    form.renewalDate ? 'border-teal' : 'border-hairline',
                  ].join(' ')}
                />
              </div>

              <div>
                <FieldLabel>Link a nominee (optional)</FieldLabel>
                {nominees.length === 0 ? (
                  <Card className="p-3 border-amber/40 bg-[rgba(245,166,35,0.08)]">
                    <p className="t-body-sm text-amber">
                      No nominees added yet. Add nominees after saving this document.
                    </p>
                  </Card>
                ) : (
                  <select
                    value={form.nomineeId}
                    onChange={e => patch({ nomineeId: e.target.value })}
                    className={[
                      'h-[56px] w-full rounded-sm border-2 bg-surface px-4 text-sm text-navy outline-none transition-colors duration-fast focus:border-teal',
                      form.nomineeId ? 'border-teal' : 'border-hairline',
                    ].join(' ')}
                  >
                    <option value="">— No nominee linked —</option>
                    {nominees.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.relationship})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(3)}>← Back</Button>
              <Button size="md" className="flex-1" onClick={() => setStep(5)}>Next →</Button>
            </div>
          </>
        )}

        {/* ── Step 5: Notes + confirm ── */}
        {step === 5 && (
          <>
            <h2 className="t-h3 text-navy">Any notes?</h2>
            <p className="t-body-sm text-muted">Optional — add anything your family should know about this policy.</p>

            <textarea
              value={form.notes}
              onChange={e => patch({ notes: e.target.value })}
              placeholder="e.g. Policy document in Google Drive. Call 1800-XXX-XXXX for claims."
              rows={4}
              className={[
                'w-full rounded-sm border-2 bg-surface px-4 py-3 text-sm text-navy outline-none transition-colors duration-fast resize-none leading-relaxed focus:border-teal',
                form.notes ? 'border-teal' : 'border-hairline',
              ].join(' ')}
            />

            {/* Summary */}
            <Card className="space-y-2">
              <p className="t-micro text-muted mb-2">Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Type</span>
                <span className="font-semibold text-navy flex items-center gap-1.5">
                  {(() => { const Icon = DOCUMENT_TYPE_ICON[form.type as DocumentType]; return <Icon size={16} className="text-navy shrink-0" /> })()}
                  {DOCUMENT_TYPE_LABELS[form.type as DocumentType]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Insurer</span>
                <span className="font-semibold text-navy">{form.insurer || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Cover amount</span>
                <span className="font-semibold text-navy nums">
                  {form.sumAssured
                    ? `₹${(parseInt(form.sumAssured) / 100_000).toFixed(0)}L`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Renewal</span>
                <span className="font-semibold text-navy">{form.renewalDate || '—'}</span>
              </div>
            </Card>

            <p className="t-caption text-muted leading-relaxed">
              This document record is stored locally on your device. KIN does not share policy
              metadata with insurers. Conditions apply.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(4)}>← Back</Button>
              <Button
                size="md"
                className="flex-1"
                onClick={handleSave}
              >
                Save to Vault ✓
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
