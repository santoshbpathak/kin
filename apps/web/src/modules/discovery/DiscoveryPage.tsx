/**
 * DiscoveryPage.tsx — Module 6: Hidden Coverage Discovery Engine
 *
 * Route: /discover
 *
 * Three-phase flow:
 *   INTRO   → landing screen explaining what "hidden coverage" means
 *   FLOW    → 8-question DiscoveryFlow wizard
 *   RESULTS → CoverageResultCard list + BonusBanner + compliance footer
 *
 * Compliance:
 *   - CG-4: All coverage amounts shown with "Conditions apply"
 *   - CG-2: General disclaimer in results footer
 *   - CG-9: No IRDAI endorsement implied — government scheme links are
 *            to official .gov.in sources
 *   - Results stored in sessionStorage('kin_discovery_results') for
 *     cross-module reference (Vault, Connect)
 */

import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DiscoveryFlow } from './DiscoveryFlow'
import { CoverageResultCard } from './CoverageResultCard'
import {
  discoverCoverages,
  totalBonusCover,
  DISCOVERY_RULE_VERSION,
  type DiscoveryAnswers,
  type DiscoveredCoverage,
} from './discoveryEngine'
import type { UserProfile } from '../diagnostic/parser'

type Phase = 'intro' | 'flow' | 'results'

function useDiagnosticProfile(): UserProfile | null {
  return useMemo(() => {
    try {
      const raw = sessionStorage.getItem('kin_diagnostic_profile')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])
}

// ── Bonus coverage banner ────────────────────────────────────────
function BonusBanner({ total, count }: { total: number; count: number }) {
  if (total === 0 || count === 0) return null

  const formatted = total >= 10_000_000
    ? `₹${(total / 10_000_000).toFixed(1)} Cr`
    : `₹${(total / 100_000).toFixed(0)} L`

  return (
    <div
      className="rounded-2xl border-2 border-dashed p-5 flex items-start gap-4"
      style={{
        borderColor: 'var(--color-accent)',
        background: 'color-mix(in srgb, var(--color-accent) 6%, white)',
      }}
    >
      <span className="text-3xl shrink-0">🎁</span>
      <div>
        <p className="text-base font-extrabold text-gray-900">
          {formatted} bonus coverage found!
        </p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {count} hidden coverage{count > 1 ? 's' : ''} identified — most people never claim
          these because they don't know they have them. This is in addition to
          your KIN Protection Score.
        </p>
        <p className="text-[10px] text-gray-400 mt-1.5">
          Conditions apply. Amounts subject to scheme eligibility and claim conditions.
        </p>
      </div>
    </div>
  )
}

// ── Status summary chips ─────────────────────────────────────────
function StatusSummary({ coverages }: { coverages: DiscoveredCoverage[] }) {
  const active = coverages.filter(c => c.status === 'active' || c.status === 'likely_active').length
  const actionable = coverages.filter(c => c.status === 'not_activated').length
  const check = coverages.filter(c => c.status === 'check_required').length

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-2.5 text-center">
        <p className="text-lg font-extrabold text-green-700">{active}</p>
        <p className="text-[10px] text-green-600 font-medium leading-tight">Active / Likely</p>
      </div>
      <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2.5 text-center">
        <p className="text-lg font-extrabold text-orange-600">{actionable}</p>
        <p className="text-[10px] text-orange-500 font-medium leading-tight">Can Activate</p>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-center">
        <p className="text-lg font-extrabold text-amber-600">{check}</p>
        <p className="text-[10px] text-amber-500 font-medium leading-tight">Verify</p>
      </div>
    </div>
  )
}

// ── Intro landing screen ─────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  const items = [
    { emoji: '🏛️', label: 'EDLI — ₹7L EPFO life cover (free)' },
    { emoji: '🦺', label: 'PMSBY — ₹2L accident cover for ₹20/year' },
    { emoji: '🚗', label: 'Motor PA — ₹15L mandatory in your policy' },
    { emoji: '🏢', label: 'Employer group term life (2–5× salary)' },
    { emoji: '💳', label: 'Credit card travel accident insurance' },
  ]

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎁</div>
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-3">
          You probably have<br />coverage you don't know about
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          8 questions · 2 minutes · surfaces hidden insurance most Indians miss
        </p>
      </div>

      {/* Hidden coverage examples */}
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">
          What we look for
        </p>
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <p className="text-sm text-gray-700">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust signal */}
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 mb-6">
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>100% rule-based.</strong> KIN does not sell insurance in this module.
          We only surface what you already own or are eligible for — then help you
          verify it.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-4 rounded-2xl text-white font-bold text-base"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Start Discovery →
      </button>

      <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
        Your answers are used only to identify coverage. No data is shared with
        insurers without your consent. Conditions apply.
      </p>
    </div>
  )
}

// ── Main page component ──────────────────────────────────────────
export function DiscoveryPage() {
  const navigate = useNavigate()
  const profile = useDiagnosticProfile()

  const [phase, setPhase] = useState<Phase>('intro')
  const [coverages, setCoverages] = useState<DiscoveredCoverage[]>([])

  function handleFlowComplete(answers: DiscoveryAnswers) {
    const results = discoverCoverages(answers, profile ?? {
      lifeStage: 'single',
      incomeBand: '5_10l',
      dependantsCount: 0,
      monthlyObligationsBand: 'lt_15k',
      hasTermLife: false,
      hasEmployerMediclaim: false,
      hasPersonalHealth: false,
      hasEndowment: false,
      cityTier: 'T2',
	      occupation: 'salaried_pf',
	      edliEligible: false,
    })

    // Persist for Vault / Connect cross-module
    try {
      sessionStorage.setItem('kin_discovery_results', JSON.stringify(results))
    } catch {
      // ignore
    }

    setCoverages(results)
    setPhase('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const bonusTotal = totalBonusCover(coverages)
  const bonusCount = coverages.filter(
    c => c.isBonus && (c.status === 'active' || c.status === 'likely_active')
  ).length

  // Action handler for CoverageResultCard
  function handleAction(coverage: DiscoveredCoverage) {
    if (coverage.actionIsExternal) {
      window.open(coverage.actionUrl, '_blank', 'noopener,noreferrer')
    } else {
      navigate(coverage.actionUrl)
    }
  }

  // ── Render: INTRO ──
  if (phase === 'intro') {
    return <IntroScreen onStart={() => setPhase('flow')} />
  }

  // ── Render: FLOW ──
  if (phase === 'flow') {
    return (
      <div className="flex flex-col">
        <div className="px-5 pt-5 pb-2">
          <button
            onClick={() => setPhase('intro')}
            className="text-xs text-gray-400 mb-2 touch-target -ml-1"
          >
            ← Back to intro
          </button>
        </div>
        <DiscoveryFlow
          profile={profile}
          onComplete={handleFlowComplete}
        />
      </div>
    )
  }

  // ── Render: RESULTS ──
  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-5"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 6%, white) 0%, white 100%)',
        }}
      >
        <button
          onClick={() => navigate('/score')}
          className="text-xs text-gray-400 mb-4 flex items-center gap-1 touch-target -ml-1"
        >
          ← Your Score
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
          Discovery complete
        </p>
        <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
          Your Hidden Coverage
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {coverages.length} coverages analysed · Rule {DISCOVERY_RULE_VERSION}
        </p>
      </div>

      <div className="px-5 space-y-4">
        {/* Status summary */}
        <StatusSummary coverages={coverages} />

        {/* Bonus banner */}
        <BonusBanner total={bonusTotal} count={bonusCount} />

        {/* Coverage cards */}
        <div className="space-y-3">
          {coverages.map((c, i) => (
            <CoverageResultCard
              key={c.id}
              coverage={c}
              index={i}
              onAction={handleAction}
            />
          ))}
        </div>

        {/* CG-2 disclaimer */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            This discovery analysis is based on your self-reported answers and general eligibility rules.
            KIN does not verify actual policy status with insurers or government databases.
            Always verify coverage directly with the relevant insurer, employer, or government portal.
            This is not financial advice. <strong>Conditions apply.</strong>
          </p>
        </div>

        {/* Next steps */}
        <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">
            Next steps
          </p>
          <Link
            to="/recommend"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            🛡️ View My Recommendations
          </Link>
          <Link
            to="/vault"
            className="w-full py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            📁 Store Documents in Vault
          </Link>
          <button
            onClick={() => {
              setCoverages([])
              setPhase('intro')
              window.scrollTo({ top: 0 })
            }}
            className="w-full py-3 text-sm text-gray-400 border border-gray-100 rounded-xl"
          >
            Redo Discovery
          </button>
        </div>
      </div>
    </div>
  )
}
