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
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_EMOJI, addDocument } from './vaultStore'

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
          <p className="text-xs font-semibold text-gray-500">Step {step} of {totalSteps}</p>
          <button onClick={onCancel} className="text-xs text-gray-400">Cancel</button>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }}
          />
        </div>
      </div>

      <div className="px-5 space-y-4 flex-1">

        {/* ── Step 1: Type ── */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-extrabold text-gray-900">What type of policy?</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {DOC_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => { patch({ type: t }); setStep(2) }}
                  className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-2xl border-2 transition-all"
                  style={{
                    borderColor: form.type === t ? 'var(--color-primary)' : '#E5E7EB',
                    backgroundColor: form.type === t
                      ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                      : '#FAFAFA',
                  }}
                >
                  <span className="text-2xl">{DOCUMENT_TYPE_EMOJI[t]}</span>
                  <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">
                    {DOCUMENT_TYPE_LABELS[t]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Insurer + policy number ── */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-extrabold text-gray-900">
              {DOCUMENT_TYPE_EMOJI[form.type as DocumentType]} {DOCUMENT_TYPE_LABELS[form.type as DocumentType]}
            </h2>
            <p className="text-xs text-gray-400">Insurer name and policy number — from your policy document.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Insurer / Company name *
                </label>
                <input
                  type="text"
                  value={form.insurer}
                  onChange={e => patch({ insurer: e.target.value })}
                  placeholder="e.g. HDFC Life, LIC, Niva Bupa"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                  style={{ borderColor: form.insurer ? 'var(--color-primary)' : '#E5E7EB' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Policy number
                </label>
                <input
                  type="text"
                  value={form.policyNumber}
                  onChange={e => patch({ policyNumber: e.target.value })}
                  placeholder="e.g. 123456789"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm font-mono outline-none"
                  style={{ borderColor: form.policyNumber ? 'var(--color-primary)' : '#E5E7EB' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Document / file name (for your reference)
                </label>
                <input
                  type="text"
                  value={form.fileName}
                  onChange={e => patch({ fileName: e.target.value })}
                  placeholder="e.g. HDFC Term Plan 2024"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: form.fileName ? 'var(--color-primary)' : '#E5E7EB' }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-[11px] text-blue-700 leading-relaxed">
                📁 <strong>MVP Note:</strong> KIN stores policy metadata only — not the PDF file.
                Document upload (encrypted) will be available in the next release.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.insurer.trim()}
                className="flex-2 flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', opacity: form.insurer.trim() ? 1 : 0.4 }}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Sum assured + premium ── */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-extrabold text-gray-900">Coverage amounts</h2>
            <p className="text-xs text-gray-400">From your policy schedule page. Leave blank if unsure.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Sum Assured (₹)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.sumAssured}
                  onChange={e => patch({ sumAssured: e.target.value })}
                  placeholder="e.g. 10000000 for ₹1 Cr"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: form.sumAssured ? 'var(--color-primary)' : '#E5E7EB' }}
                />
                {form.sumAssured && parseInt(form.sumAssured) >= 100_000 && (
                  <p className="text-[11px] text-green-600 mt-1 font-semibold">
                    = ₹{(parseInt(form.sumAssured) / 100_000).toFixed(0)} Lakh
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Annual Premium (₹)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.annualPremium}
                  onChange={e => patch({ annualPremium: e.target.value })}
                  placeholder="e.g. 12000"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: form.annualPremium ? 'var(--color-primary)' : '#E5E7EB' }}
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              Conditions apply. Amounts are for your reference only and do not constitute a guarantee
              of any benefit. Refer to your policy document for exact terms.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: 'var(--color-primary)' }}>Next →</button>
            </div>
          </>
        )}

        {/* ── Step 4: Renewal date + nominee ── */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-extrabold text-gray-900">Renewal & nominee</h2>
            <p className="text-xs text-gray-400">KIN will remind you before your policy lapses.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Renewal / expiry date
                </label>
                <input
                  type="date"
                  value={form.renewalDate}
                  onChange={e => patch({ renewalDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: form.renewalDate ? 'var(--color-primary)' : '#E5E7EB' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Link a nominee (optional)
                </label>
                {nominees.length === 0 ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs text-amber-700">
                      No nominees added yet. Add nominees after saving this document.
                    </p>
                  </div>
                ) : (
                  <select
                    value={form.nomineeId}
                    onChange={e => patch({ nomineeId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white"
                    style={{ borderColor: form.nomineeId ? 'var(--color-primary)' : '#E5E7EB' }}
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
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500">← Back</button>
              <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: 'var(--color-primary)' }}>Next →</button>
            </div>
          </>
        )}

        {/* ── Step 5: Notes + confirm ── */}
        {step === 5 && (
          <>
            <h2 className="text-lg font-extrabold text-gray-900">Any notes?</h2>
            <p className="text-xs text-gray-400">Optional — add anything your family should know about this policy.</p>

            <textarea
              value={form.notes}
              onChange={e => patch({ notes: e.target.value })}
              placeholder="e.g. Policy document in Google Drive. Call 1800-XXX-XXXX for claims."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none resize-none leading-relaxed"
              style={{ borderColor: form.notes ? 'var(--color-primary)' : '#E5E7EB' }}
            />

            {/* Summary */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Summary</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold text-gray-800">
                  {DOCUMENT_TYPE_EMOJI[form.type as DocumentType]} {DOCUMENT_TYPE_LABELS[form.type as DocumentType]}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Insurer</span>
                <span className="font-semibold text-gray-800">{form.insurer || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Sum Assured</span>
                <span className="font-semibold text-gray-800">
                  {form.sumAssured
                    ? `₹${(parseInt(form.sumAssured) / 100_000).toFixed(0)}L`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Renewal</span>
                <span className="font-semibold text-gray-800">{form.renewalDate || '—'}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              This document record is stored locally on your device. KIN does not share policy
              metadata with insurers. Conditions apply.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500">← Back</button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Save to Vault ✓
              </button>
            </div>
          </>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
