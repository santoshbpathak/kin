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
import { Button, Card, Input, ChoiceChip, NavHeader, PrivacyLine } from '@/components/ui'
import { IconLock, IconCheck } from '@/components/ui/icons'

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
    <div className="flex flex-col pb-10">
      {/* Header */}
      <NavHeader
        title="Add Nominee"
        showBack={false}
        action={
          <button
            type="button"
            onClick={onCancel}
            className="t-body-sm text-teal-deep"
          >
            Cancel
          </button>
        }
      />

      <div className="flex flex-col px-5 pt-4 space-y-5">
        <p className="t-body-sm text-slate leading-relaxed">
          Your nominee is the person who should be contacted first in case of a claim.
          Store minimum details — no sensitive documents needed here.
        </p>

        <Card className="space-y-5">
          {/* Name */}
          <Input
            label="Full name *"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            autoCapitalize="words"
          />

          {/* Relationship */}
          <div className="flex flex-col gap-1.5">
            <span className="t-micro text-muted">
              Relationship *
            </span>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map(r => (
                <ChoiceChip
                  key={r}
                  selected={relationship === r}
                  onClick={() => setRelationship(r)}
                >
                  {RELATIONSHIP_LABELS[r]}
                </ChoiceChip>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <span className="t-micro text-muted">
              Mobile number
            </span>
            <div className="flex items-center rounded-md border-[1.5px] border-hairline-strong bg-surface focus-within:border-teal overflow-hidden">
              <span className="px-3 h-[56px] flex items-center t-body-sm text-muted bg-sand-deep border-r border-hairline">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                placeholder="10-digit number"
                className="flex-1 px-3 h-[56px] text-[15px] text-slate bg-surface outline-none placeholder:text-muted"
              />
            </div>
          </div>

          {/* Email */}
          <Input
            label="Email address"
            type="email"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="e.g. priya@email.com"
          />

          {/* Aadhaar last 4 */}
          <Input
            label="Aadhaar — last 4 digits only"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={aadhaarLast4}
            onChange={e => setAadhaarLast4(e.target.value.replace(/\D/g, '').substring(0, 4))}
            placeholder="e.g. 4523"
            className="font-mono"
            helper={<span className="flex items-center gap-1"><IconLock size={14} className="text-muted shrink-0" /> DPDP Act 2023 — KIN stores only the last 4 digits. Never enter your full Aadhaar here.</span>}
          />
        </Card>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={!canSave}
          fullWidth
        >
          Save Nominee <IconCheck size={16} className="text-current" />
        </Button>

        <PrivacyLine>
          Nominee data is stored locally on your device only. KIN does not share
          this information with insurers or third parties. You can delete at any time.
        </PrivacyLine>
      </div>
    </div>
  )
}
