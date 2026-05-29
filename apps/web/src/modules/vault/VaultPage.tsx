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

import React, { useState, useCallback } from 'react'
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
import { Button, Card, PrivacyLine } from '@/components/ui'
import { IconClock, IconVault, IconDoc, IconUser, IconLock, IconHome, IconBulb } from '@/components/ui/icons'

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
        <p className="t-micro text-muted mb-1">Protection Vault</p>
        <h1 className="t-h2 text-navy leading-tight">
          Your Policies &amp; Nominees
        </h1>
        <p className="t-body-sm text-muted mt-1">
          Stored locally · Private · Emergency-ready
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => onTab('documents')}
          className="rounded-md border border-hairline bg-surface p-3.5 text-center shadow-card active:scale-95 transition-transform"
        >
          <p className="t-numeric-inline text-navy nums">{summary.documentCount}</p>
          <p className="t-micro text-muted mt-0.5">Policies</p>
        </button>
        <button
          onClick={() => onTab('nominees')}
          className="rounded-md border border-hairline bg-surface p-3.5 text-center shadow-card active:scale-95 transition-transform"
        >
          <p className="t-numeric-inline text-navy nums">{summary.nomineeCount}</p>
          <p className="t-micro text-muted mt-0.5">Nominees</p>
        </button>
        <div className="rounded-md border border-hairline bg-surface p-3.5 text-center shadow-card">
          <p className="t-body font-bold text-navy leading-tight nums">
            {formatAmount(summary.totalSumAssured)}
          </p>
          <p className="t-micro text-muted mt-0.5">Covered</p>
        </div>
      </div>

      {/* Expiry alerts */}
      {summary.expiringSoon.length > 0 && (
        <div className="rounded-md border border-hairline-strong bg-sand-deep p-4 space-y-2">
          <p className="t-body-sm font-bold text-amber flex items-center gap-1.5">
            <IconClock size={16} className="text-amber shrink-0" />
            {summary.expiringSoon.length} polic{summary.expiringSoon.length > 1 ? 'ies' : 'y'} expiring soon
          </p>
          {summary.expiringSoon.map(doc => (
            <div key={doc.id} className="flex items-center justify-between">
              <span className="t-body-sm text-slate">{doc.insurer || doc.type}</span>
              <span className="t-body-sm font-semibold text-navy nums">
                {new Date(doc.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <Card className="border-dashed text-center py-8">
          <div className="mb-3 flex justify-center"><IconVault size={40} className="text-muted" /></div>
          <p className="t-body font-bold text-navy mb-1">Your vault is empty</p>
          <p className="t-body-sm text-muted leading-relaxed mb-5">
            Add your insurance policies and nominees so your family always knows what coverage exists.
          </p>
          <Button size="md" onClick={() => onTab('documents')}>
            Add first policy
          </Button>
        </Card>
      )}

      {/* Quick actions */}
      <div className="space-y-2.5">
        <p className="t-micro text-muted">Quick actions</p>
        {[
          { icon: <IconDoc size={20} className="text-navy shrink-0" />, label: 'Manage Policies', sub: `${summary.documentCount} stored`, tab: 'documents' as Tab },
          { icon: <IconUser size={20} className="text-navy shrink-0" />, label: 'Manage Nominees', sub: `${summary.nomineeCount} added`, tab: 'nominees' as Tab },
          { icon: <IconLock size={20} className="text-navy shrink-0" />, label: 'Emergency Access Letter', sub: 'Download for family', tab: 'unlock' as Tab },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => onTab(item.tab)}
            className="w-full flex items-center gap-3 bg-surface rounded-md border border-hairline px-4 py-3.5 shadow-card text-left active:bg-sand-deep transition-colors"
          >
            {item.icon}
            <div className="flex-1 min-w-0">
              <p className="t-body font-semibold text-navy">{item.label}</p>
              <p className="t-body-sm text-muted">{item.sub}</p>
            </div>
            <span className="text-muted text-sm">›</span>
          </button>
        ))}
      </div>

      {/* DPDP data safety note */}
      <div className="rounded-md border border-teal/30 bg-mint p-3">
        <p className="t-body-sm text-teal-deep leading-relaxed flex items-start gap-1.5">
          <IconLock size={16} className="text-teal-deep shrink-0 mt-0.5" /><span><strong>Your data stays on your device.</strong> KIN does not upload vault
          contents to any server in MVP. Encrypted cloud sync is coming in the next release.
          You can delete all vault data at any time.</span>
        </p>
      </div>

      <PrivacyLine />
    </div>
  )
}

// ── Tab bar ──────────────────────────────────────────────────────
function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <IconHome size={18} />, label: 'Home' },
    { id: 'documents', icon: <IconDoc size={18} />, label: 'Policies' },
    { id: 'nominees', icon: <IconUser size={18} />, label: 'Nominees' },
    { id: 'unlock', icon: <IconLock size={18} />, label: 'Access' },
  ]

  return (
    <div className="flex border-b border-hairline bg-surface sticky top-0 z-10">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
            tab === t.id ? 'text-teal-deep' : 'text-muted'
          }`}
        >
          {t.icon}
          <span className="t-micro">
            {t.label}
          </span>
          {tab === t.id && (
            <div className="h-0.5 w-6 rounded-pill mt-0.5 bg-teal" />
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
        <h2 className="t-h3 text-navy">Policies ({docs.length})</h2>
        <Button size="md" onClick={() => setSubView('add')}>
          + Add policy
        </Button>
      </div>

      {docs.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <div className="flex justify-center mb-1"><IconDoc size={48} className="text-muted" /></div>
          <p className="t-body font-semibold text-slate">No policies stored yet</p>
          <p className="t-body-sm text-muted">Tap "Add policy" to store your first insurance document.</p>
          <Button size="md" onClick={() => setSubView('add')}>
            Add first policy
          </Button>
        </Card>
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
        <h2 className="t-h3 text-navy">Nominees ({nominees.length})</h2>
        <Button size="md" onClick={() => setSubView('add')}>
          + Add nominee
        </Button>
      </div>

      {nominees.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <div className="flex justify-center mb-1"><IconUser size={48} className="text-muted" /></div>
          <p className="t-body font-semibold text-slate">No nominees added yet</p>
          <p className="t-body-sm text-muted">Add your nominee so KIN can generate your emergency access letter.</p>
          <Button size="md" onClick={() => setSubView('add')}>
            Add first nominee
          </Button>
        </Card>
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

      <div className="rounded-md border border-hairline bg-sand-deep p-3">
        <p className="t-body-sm text-amber leading-relaxed flex items-start gap-1.5">
          <IconBulb size={16} className="text-amber shrink-0 mt-0.5" /><span>After adding a nominee, go to <strong>Policies</strong> and link them
          to each policy using the renewal &amp; nominee step.</span>
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
          className="t-body-sm text-muted touch-target -ml-1 active:text-navy transition-colors"
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
