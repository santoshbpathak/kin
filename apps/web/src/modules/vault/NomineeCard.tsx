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

const RELATIONSHIP_EMOJI: Record<string, string> = {
  spouse: '💑',
  child: '👶',
  parent: '👨‍👩‍👧',
  sibling: '👫',
  other: '👤',
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0">
          {RELATIONSHIP_EMOJI[nominee.relationship] ?? '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{nominee.name}</p>
          <p className="text-[11px] text-gray-400 capitalize">
            {RELATIONSHIP_LABELS[nominee.relationship]}
          </p>
        </div>
        {linkedPolicies > 0 && (
          <div className="rounded-full bg-green-50 border border-green-100 px-2.5 py-1">
            <p className="text-[10px] font-bold text-green-700">
              {linkedPolicies} policy{linkedPolicies > 1 ? 'ies' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-3">
        {nominee.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-gray-300">📞</span>
            <span className="font-mono">{nominee.phone}</span>
          </div>
        )}
        {nominee.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-gray-300">✉️</span>
            <span className="truncate">{nominee.email}</span>
          </div>
        )}
        {nominee.aadhaarLast4 && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-gray-300">🪪</span>
            <span className="font-mono">Aadhaar: XXXX-XXXX-{nominee.aadhaarLast4}</span>
          </div>
        )}
      </div>

      {/* No policies warning */}
      {linkedPolicies === 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mb-3">
          <p className="text-[11px] text-amber-700">
            Not linked to any policy — link from the Documents tab.
          </p>
        </div>
      )}

      {/* Delete */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
        >
          Remove nominee
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-xs text-red-600 font-semibold">Remove {nominee.name}?</p>
          <button
            onClick={handleDelete}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-semibold"
          >
            Remove
          </button>
          <button onClick={() => setConfirming(false)} className="text-xs text-gray-400">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
