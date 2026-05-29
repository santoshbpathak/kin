/**
 * DocumentCard.tsx — Module 7: Protection Vault
 *
 * Displays a stored VaultDocument with:
 *   - Type icon + insurer name
 *   - Cover amount + renewal date
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
import { Button, Card, StateChip } from '@/components/ui'
import { IconAlert, IconClock, IconUser } from '@/components/ui/icons'

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
    <Card className="overflow-hidden p-0">
      {/* Expiry warning stripe */}
      {(expiringSoon || expired) && (
        <div className={`px-4 py-1.5 t-micro ${expired ? 'bg-coral/10 text-coral' : 'bg-amber/10 text-amber'}`}>
          {expired ? (
            <><IconAlert size={14} className="inline-block mr-1 shrink-0 text-coral" /> Policy may have expired — please verify</>
          ) : (
            <><IconClock size={14} className="inline-block mr-1 shrink-0 text-amber" /> Renewal in {days} day{days === 1 ? '' : 's'} — renew before it lapses</>
          )}
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-sm bg-sand-deep border border-hairline flex items-center justify-center text-xl shrink-0">
            {DOCUMENT_TYPE_EMOJI[doc.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="t-micro text-muted">
              {DOCUMENT_TYPE_LABELS[doc.type]}
            </p>
            <p className="t-body font-bold text-navy truncate">{doc.insurer || '—'}</p>
            {doc.policyNumber && (
              <p className="t-caption text-muted font-mono mt-0.5">
                {doc.policyNumber}
              </p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-sm bg-sand-deep px-3 py-2">
            <p className="t-micro text-muted">Cover</p>
            <p className="t-body-sm font-extrabold text-navy nums">{formatAmount(doc.sumAssured)}</p>
          </div>
          <div className="rounded-sm bg-sand-deep px-3 py-2">
            <p className="t-micro text-muted">Renewal</p>
            <p className={`t-body-sm font-extrabold nums ${expired ? 'text-coral' : expiringSoon ? 'text-amber' : 'text-navy'}`}>
              {formatDate(doc.renewalDate)}
            </p>
          </div>
        </div>

        {/* Nominee badge */}
        {nominee ? (
          <div className="flex items-center gap-2 rounded-sm bg-mint border border-hairline px-3 py-2 mb-3">
            <IconUser size={16} className="text-teal-deep shrink-0" />
            <div className="min-w-0">
              <p className="t-micro text-teal-deep">Nominee</p>
              <p className="t-caption font-semibold text-navy truncate">{nominee.name}</p>
            </div>
            <span className="ml-auto shrink-0"><StateChip tone="positive">Linked</StateChip></span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-sm bg-amber/10 border border-hairline px-3 py-2 mb-3">
            <IconAlert size={16} className="text-amber shrink-0" />
            <p className="t-caption text-amber">No nominee linked — add one in Nominees</p>
          </div>
        )}

        {/* Notes */}
        {doc.notes && (
          <p className="t-caption text-muted mb-3 italic leading-relaxed">{doc.notes}</p>
        )}

        {/* Delete */}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="t-caption text-muted hover:text-coral transition-colors min-h-[44px] flex items-center"
          >
            Remove from vault
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="t-caption text-coral font-semibold">Remove this document?</p>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
            >
              Yes, remove
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
      </div>
    </Card>
  )
}
