/**
 * AddNomineeFlow.tsx — Module 7: Protection Vault
 *
 * Single-screen form to add a nominee.
 *
 * DPDP compliance:
 *   - Aadhaar field: accepts only last 4 digits (UI enforced)
 *   - No DOB stored (not required for MVP nominee record)
 *   - Minimal PII: name, relationship, phone, email, Aadhaar-last-4 only
 */

import { useState } from 'react'
import type { Relationship } from './vaultStore'
import { RELATIONSHIP_LABELS, addNominee } from './vaultStore'

const RELATIONSHIPS: Relationship[] = ['spouse', 'child', 'parent', 'sibling', 'other']

type Props = {
  onComplete: () => void
  onCancel: () => void
}

export function AddNomineeFlow({ onComplete, onCancel }: Props) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState<Relationship | ''>('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [aadhaarLast4, setAadhaarLast4] = useState('')

  const canSave = name.trim().length >= 2 && relationship !== ''

  function handleSave() {
    if (!canSave) return
    addNominee({
      name: name.trim(),
      relationship: relationship as Relationship,
      phone: phone.trim(),
      email: email.trim(),
      aadhaarLast4: aadhaarLast4.trim(),
    })
    onComplete()
  }

  return (
    <div className="flex flex-col px-5 pt-5 pb-10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">Add Nominee</h2>
        <button onClick={onCancel} className="text-xs text-gray-400">Cancel</button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed -mt-2">
        Your nominee is the person who should be contacted first in case of a claim.
        Store minimum details — no sensitive documents needed here.
      </p>

      {/* Name */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1.5">
          Full name *
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
          style={{ borderColor: name.trim().length >= 2 ? 'var(--color-primary)' : '#E5E7EB' }}
          autoCapitalize="words"
        />
      </div>

      {/* Relationship */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1.5">
          Relationship *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {RELATIONSHIPS.map(r => (
            <button
              key={r}
              onClick={() => setRelationship(r)}
              className="py-2.5 px-2 rounded-xl border-2 text-xs font-semibold text-center transition-all"
              style={{
                borderColor: relationship === r ? 'var(--color-primary)' : '#E5E7EB',
                backgroundColor: relationship === r
                  ? 'color-mix(in srgb, var(--color-primary) 10%, white)'
                  : '#FAFAFA',
                color: relationship === r ? 'var(--color-primary)' : '#6B7280',
              }}
            >
              {RELATIONSHIP_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1.5">
          Mobile number
        </label>
        <div className="flex items-center border-2 rounded-xl overflow-hidden"
          style={{ borderColor: phone ? 'var(--color-primary)' : '#E5E7EB' }}
        >
          <span className="px-3 py-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-100">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
            placeholder="10-digit number"
            className="flex-1 px-3 py-3 text-sm outline-none"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1.5">
          Email address
        </label>
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="e.g. priya@email.com"
          className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
          style={{ borderColor: email ? 'var(--color-primary)' : '#E5E7EB' }}
        />
      </div>

      {/* Aadhaar last 4 */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1.5">
          Aadhaar — last 4 digits only
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={aadhaarLast4}
          onChange={e => setAadhaarLast4(e.target.value.replace(/\D/g, '').substring(0, 4))}
          placeholder="e.g. 4523"
          className="w-full px-4 py-3 rounded-xl border-2 text-sm font-mono outline-none"
          style={{ borderColor: aadhaarLast4.length === 4 ? 'var(--color-primary)' : '#E5E7EB' }}
        />
        <p className="text-[10px] text-gray-400 mt-1">
          🔒 DPDP Act 2023 — KIN stores only the last 4 digits. Never enter your full Aadhaar here.
        </p>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity"
        style={{ backgroundColor: 'var(--color-primary)', opacity: canSave ? 1 : 0.4 }}
      >
        Save Nominee ✓
      </button>

      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        Nominee data is stored locally on your device only. KIN does not share
        this information with insurers or third parties. You can delete at any time.
      </p>
    </div>
  )
}
