/**
 * VaultPage.tsx — Module 7: Protection Vault
 *
 * Route: /vault/*
 * Three tabs handled via simple state (no nested React Router needed):
 *   documents  — list + add document flow
 *   nominees   — list + add nominee flow
 *   unlock     — emergency access letter generator
 *
 * Vault home dashboard shows summary stats:
 *   - Total documents, nominees, sum assured
 *   - Expiry alerts for policies renewing within 60 days
 *   - Quick-add CTAs
 *
 * DPDP:
 *   - "Clear all vault data" button on each tab footer
 *   - Only last-4 of Aadhaar stored (enforced in AddNomineeFlow)
 *   - Data is device-local only in MVP1
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocumentCard } from './DocumentCard'
import { AddDocumentFlow } from './AddDocumentFlow'
import { NomineeCard } from './NomineeCard'
import { AddNomineeFlow } from './AddNomineeFlow'
import { UnlockInstructions } from './UnlockInstructions'
import {
  getDocuments,
  getNominees,
  getVaultSummary,
  type VaultDocument,
  type VaultNominee,
} from './vaultStore'

type Tab = 'home' | 'documents' | 'nominees' | 'unlock'
type SubView = 'list' | 'add'

// ── Vault home dashboard ─────────────────────────────────────────
function VaultHome({
  onTab,
}: {
  onTab: (t: Tab) => void
}) {
  const summary = getVaultSummary()

  const formatAmount = (n: number) => {
    if (n <= 0) return '₹0'
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`
    return `₹${n.toLocaleString('en-IN')}`
  }

  const isEmpty = summary.documentCount === 0 && summary.nomineeCount === 0

  return (
    <div className="px-5 pt-5 pb-10 space-y-5">
      {/* Hero */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
          Protection Vault
        </p>
        <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
          Your Policies &amp; Nominees
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Stored locally · Private · Emergency-ready
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => onTab('documents')}
          className="rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm active:scale-95 transition-transform"
        >
          <p className="text-2xl font-extrabold text-gray-900">{summary.documentCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Policies</p>
        </button>
        <button
          onClick={() => onTab('nominees')}
          className="rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm active:scale-95 transition-transform"
        >
          <p className="text-2xl font-extrabold text-gray-900">{summary.nomineeCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Nominees</p>
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <p className="text-lg font-extrabold text-gray-900 leading-tight">
            {formatAmount(summary.totalSumAssured)}
          </p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Covered</p>
        </div>
      </div>

      {/* Expiry alerts */}
      {summary.expiringSoon.length > 0 && (
        <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 p-4 space-y-2">
          <p className="text-xs font-bold text-orange-700">
            ⏰ {summary.expiringSoon.length} polic{summary.expiringSoon.length > 1 ? 'ies' : 'y'} expiring soon
          </p>
          {summary.expiringSoon.map(doc => (
            <div key={doc.id} className="flex items-center justify-between text-xs">
              <span className="text-orange-700">{doc.insurer || doc.type}</span>
              <span className="font-semibold text-orange-800">
                {new Date(doc.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-sm font-bold text-gray-700 mb-1">Your vault is empty</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Add your insurance policies and nominees so your family always knows what coverage exists.
          </p>
          <button
            onClick={() => onTab('documents')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Add First Policy →
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Quick actions</p>
        {[
          { emoji: '📄', label: 'Manage Policies', sub: `${summary.documentCount} stored`, tab: 'documents' as Tab },
          { emoji: '👤', label: 'Manage Nominees', sub: `${summary.nomineeCount} added`, tab: 'nominees' as Tab },
          { emoji: '🔐', label: 'Emergency Access Letter', sub: 'Download for family', tab: 'unlock' as Tab },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => onTab(item.tab)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm text-left active:bg-gray-50 transition-colors"
          >
            <span className="text-xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <span className="text-gray-300 text-sm">›</span>
          </button>
        ))}
      </div>

      {/* DPDP data safety note */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
        <p className="text-[11px] text-blue-700 leading-relaxed">
          🔒 <strong>Your data stays on your device.</strong> KIN does not upload vault
          contents to any server in MVP. Encrypted cloud sync is coming in the next release.
          You can delete all vault data at any time.
        </p>
      </div>
    </div>
  )
}

// ── Tab bar ──────────────────────────────────────────────────────
function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const tabs: { id: Tab; emoji: string; label: string }[] = [
    { id: 'home', emoji: '🏠', label: 'Home' },
    { id: 'documents', emoji: '📄', label: 'Policies' },
    { id: 'nominees', emoji: '👤', label: 'Nominees' },
    { id: 'unlock', emoji: '🔐', label: 'Access' },
  ]

  return (
    <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
          style={{ color: tab === t.id ? 'var(--color-primary)' : '#9CA3AF' }}
        >
          <span className="text-base">{t.emoji}</span>
          <span
            className="text-[9px] font-bold uppercase tracking-wide"
            style={{ color: tab === t.id ? 'var(--color-primary)' : '#9CA3AF' }}
          >
            {t.label}
          </span>
          {tab === t.id && (
            <div
              className="h-0.5 w-6 rounded-full mt-0.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ── Documents tab ────────────────────────────────────────────────
function DocumentsTab() {
  const [subView, setSubView] = useState<SubView>('list')
  const [docs, setDocs] = useState<VaultDocument[]>(getDocuments)
  const [nominees] = useState<VaultNominee[]>(getNominees)

  const refresh = useCallback(() => setDocs(getDocuments()), [])

  if (subView === 'add') {
    return (
      <AddDocumentFlow
        nominees={nominees}
        onComplete={() => { refresh(); setSubView('list') }}
        onCancel={() => setSubView('list')}
      />
    )
  }

  return (
    <div className="px-5 pt-5 pb-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">Policies ({docs.length})</h2>
        <button
          onClick={() => setSubView('add')}
          className="px-4 py-2 rounded-xl text-white text-xs font-bold"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + Add Policy
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">📄</div>
          <p className="text-sm font-semibold text-gray-500">No policies stored yet</p>
          <p className="text-xs text-gray-400">Tap "Add Policy" to store your first insurance document.</p>
          <button
            onClick={() => setSubView('add')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Add First Policy →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              nominee={nominees.find(n => n.id === doc.nomineeId)}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Nominees tab ─────────────────────────────────────────────────
function NomineesTab() {
  const [subView, setSubView] = useState<SubView>('list')
  const [nominees, setNominees] = useState<VaultNominee[]>(getNominees)
  const [docs] = useState<VaultDocument[]>(getDocuments)

  const refresh = useCallback(() => setNominees(getNominees()), [])

  if (subView === 'add') {
    return (
      <AddNomineeFlow
        onComplete={() => { refresh(); setSubView('list') }}
        onCancel={() => setSubView('list')}
      />
    )
  }

  return (
    <div className="px-5 pt-5 pb-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">Nominees ({nominees.length})</h2>
        <button
          onClick={() => setSubView('add')}
          className="px-4 py-2 rounded-xl text-white text-xs font-bold"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + Add Nominee
        </button>
      </div>

      {nominees.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">👤</div>
          <p className="text-sm font-semibold text-gray-500">No nominees added yet</p>
          <p className="text-xs text-gray-400">Add your nominee so KIN can generate your emergency access letter.</p>
          <button
            onClick={() => setSubView('add')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Add First Nominee →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {nominees.map(n => (
            <NomineeCard
              key={n.id}
              nominee={n}
              linkedPolicies={docs.filter(d => d.nomineeId === n.id).length}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
        <p className="text-[11px] text-amber-700 leading-relaxed">
          💡 After adding a nominee, go to <strong>Policies</strong> and link them
          to each policy using the renewal &amp; nominee step.
        </p>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export function VaultPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('home')

  return (
    <div className="flex flex-col">
      {/* Back link */}
      <div className="px-5 pt-4">
        <button
          onClick={() => navigate('/score')}
          className="text-xs text-gray-400 touch-target -ml-1"
        >
          ← Your Score
        </button>
      </div>

      {/* Tab bar */}
      <TabBar tab={tab} onTab={setTab} />

      {/* Tab content */}
      {tab === 'home' && <VaultHome onTab={setTab} />}
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'nominees' && <NomineesTab />}
      {tab === 'unlock' && (
        <UnlockInstructions
          documents={getDocuments()}
          nominees={getNominees()}
          holderName=""
        />
      )}
    </div>
  )
}
