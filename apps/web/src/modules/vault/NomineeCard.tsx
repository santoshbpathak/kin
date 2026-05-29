/**
 * NomineeCard.tsx — Module 7: Protection Vault
 *
 * Displays a VaultNominee with:
 *   - Name + relationship + contact
 *   - Aadhaar last-4 (DPDP: never full number)
 *   - Delete with confirmation
 */

import { useState } from 'react'
import type { VaultNominee } from './vaultStore'
import { RELATIONSHIP_LABELS, deleteNominee } from './vaultStore'
import { Button, Card, StateChip } from '@/components/ui'
import { IconFamily, IconUser, IconPhone, IconMail, IconCard } from '@/components/ui/icons'

const RELATIONSHIP_ICON: Record<string, typeof IconFamily> = {
  spouse: IconFamily,
  child: IconFamily,
  parent: IconFamily,
  sibling: IconFamily,
  other: IconUser,
}

type Props = {
  nominee: VaultNominee
  linkedPolicies: number
  onDeleted: () => void
}

export function NomineeCard({ nominee, linkedPolicies, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    deleteNominee(nominee.id)
    onDeleted()
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-md border border-hairline bg-sand-deep flex items-center justify-center shrink-0">
          {(() => { const Icon = RELATIONSHIP_ICON[nominee.relationship] ?? IconUser; return <Icon size={24} className="text-navy" /> })()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="t-body font-bold text-navy truncate">{nominee.name}</p>
          <p className="t-micro text-muted capitalize">
            {RELATIONSHIP_LABELS[nominee.relationship]}
          </p>
        </div>
        {linkedPolicies > 0 && (
          <StateChip tone="positive">
            {linkedPolicies} polic{linkedPolicies > 1 ? 'ies' : 'y'}
          </StateChip>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-3">
        {nominee.phone && (
          <div className="flex items-center gap-2 t-body-sm text-slate">
            <IconPhone size={16} className="text-muted shrink-0" />
            <span className="font-mono">{nominee.phone}</span>
          </div>
        )}
        {nominee.email && (
          <div className="flex items-center gap-2 t-body-sm text-slate">
            <IconMail size={16} className="text-muted shrink-0" />
            <span className="truncate">{nominee.email}</span>
          </div>
        )}
        {nominee.aadhaarLast4 && (
          <div className="flex items-center gap-2 t-body-sm text-slate">
            <IconCard size={16} className="text-muted shrink-0" />
            <span className="font-mono">Aadhaar: XXXX-XXXX-{nominee.aadhaarLast4}</span>
          </div>
        )}
      </div>

      {/* No policies warning */}
      {linkedPolicies === 0 && (
        <div className="rounded-md border border-hairline bg-sand-deep px-3 py-2 mb-3">
          <p className="t-body-sm text-amber">
            Not linked to any policy — link from the Documents tab.
          </p>
        </div>
      )}

      {/* Delete */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="t-micro text-muted hover:text-coral transition-colors min-h-[44px] flex items-center"
        >
          Remove nominee
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="t-body-sm text-coral font-semibold">Remove {nominee.name}?</p>
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
          >
            Remove
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </Card>
  )
}
