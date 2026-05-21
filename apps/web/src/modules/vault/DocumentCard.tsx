/**
 * DocumentCard.tsx — Module 7: Protection Vault
 *
 * Displays a stored VaultDocument with:
 *   - Type icon + insurer name
 *   - Sum assured + renewal date
 *   - Linked nominee badge
 *   - Expiry warning if renewing within 60 days
 *   - Delete action (with confirmation)
 */

import { useState } from 'react'
import type { VaultDocument, VaultNominee } from './vaultStore'
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_EMOJI,
  deleteDocument,
} from './vaultStore'

function formatAmount(n: number): string {
  if (n <= 0) return '—'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function daysUntil(iso: string): number {
  if (!iso) return Infinity
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

type Props = {
  doc: VaultDocument
  nominee: VaultNominee | undefined
  onDeleted: () => void
}

export function DocumentCard({ doc, nominee, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)

  const days = daysUntil(doc.renewalDate)
  const expiringSoon = days >= 0 && days <= 60
  const expired = days < 0

  function handleDelete() {
    deleteDocument(doc.id)
    onDeleted()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Expiry warning stripe */}
      {(expiringSoon || expired) && (
        <div
          className="px-4 py-1.5 text-xs font-semibold"
          style={{
            backgroundColor: expired ? '#FEF2F2' : '#FFF7ED',
            color: expired ? '#DC2626' : '#C2410C',
          }}
        >
          {expired
            ? '⚠️ Policy may have expired — please verify'
            : `⏰ Renewal in ${days} day${days === 1 ? '' : 's'} — renew before it lapses`}
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">
            {DOCUMENT_TYPE_EMOJI[doc.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              {DOCUMENT_TYPE_LABELS[doc.type]}
            </p>
            <p className="text-sm font-bold text-gray-900 truncate">{doc.insurer || '—'}</p>
            {doc.policyNumber && (
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                {doc.policyNumber}
              </p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Sum Assured</p>
            <p className="text-sm font-extrabold text-gray-800">{formatAmount(doc.sumAssured)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Renewal</p>
            <p
              className="text-sm font-extrabold"
              style={{ color: expired ? '#DC2626' : expiringSoon ? '#C2410C' : '#1F2937' }}
            >
              {formatDate(doc.renewalDate)}
            </p>
          </div>
        </div>

        {/* Nominee badge */}
        {nominee ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2 mb-3">
            <span className="text-sm">👤</span>
            <div className="min-w-0">
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Nominee</p>
              <p className="text-xs font-semibold text-green-800 truncate">{nominee.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mb-3">
            <span className="text-sm">⚠️</span>
            <p className="text-xs text-amber-700">No nominee linked — add one in Nominees</p>
          </div>
        )}

        {/* Notes */}
        {doc.notes && (
          <p className="text-[11px] text-gray-400 mb-3 italic leading-relaxed">{doc.notes}</p>
        )}

        {/* Delete */}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
          >
            Remove from vault
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-xs text-red-600 font-semibold">Remove this document?</p>
            <button
              onClick={handleDelete}
              className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-semibold"
            >
              Yes, remove
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
