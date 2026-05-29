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
import { useNavigate } from 'react-router-dom'
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
import { Button, Card, PrivacyLine } from '@/components/ui'
import { IconGift, IconBuilding, IconShield, IconCard, IconShieldCheck, IconVault } from '@/components/ui/icons'

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
    <div className="rounded-md border border-teal/30 bg-mint p-4 flex items-start gap-4">
      <IconGift size={24} className="text-teal-deep shrink-0" />
      <div>
        <p className="t-body font-bold text-navy">
          {formatted} bonus cover found!
        </p>
        <p className="t-body-sm mt-1 text-slate leading-relaxed">
          {count} hidden cover{count > 1 ? 's' : ''} identified — most people never claim
          these because they don't know they have them. This is in addition to
          your KIN Protection Score.
        </p>
        <p className="t-micro mt-1.5 text-muted">
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
      <div className="rounded-sm border border-hairline bg-mint px-3 py-2.5 text-center">
        <p className="t-numeric-inline text-teal-deep">{active}</p>
        <p className="t-micro text-teal-deep leading-tight mt-0.5">Active / Likely</p>
      </div>
      <div className="rounded-sm border border-hairline bg-sand-deep px-3 py-2.5 text-center">
        <p className="t-numeric-inline text-navy">{actionable}</p>
        <p className="t-micro text-muted leading-tight mt-0.5">Can Activate</p>
      </div>
      <div className="rounded-sm border border-hairline bg-sand-deep px-3 py-2.5 text-center">
        <p className="t-numeric-inline text-amber">{check}</p>
        <p className="t-micro text-muted leading-tight mt-0.5">Verify</p>
      </div>
    </div>
  )
}

// ── Intro landing screen ─────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  const items = [
    { icon: <IconBuilding size={18} className="text-navy shrink-0" />, label: 'EDLI — ₹7L EPFO life cover (free)' },
    { icon: <IconShield size={18} className="text-navy shrink-0" />, label: 'PMSBY — ₹2L accident cover for ₹20/year' },
    { icon: <IconCard size={18} className="text-navy shrink-0" />, label: 'Motor PA — ₹15L mandatory in your policy' },
    { icon: <IconBuilding size={18} className="text-navy shrink-0" />, label: 'Employer group term life (2–5× salary)' },
    { icon: <IconCard size={18} className="text-navy shrink-0" />, label: 'Credit card travel accident insurance' },
  ]

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <IconGift size={48} className="text-teal-deep" />
        </div>
        <h1 className="t-h2 text-navy leading-tight mb-3">
          You probably have<br />cover you don't know about
        </h1>
        <p className="t-body-sm text-muted leading-relaxed max-w-xs mx-auto">
          8 questions · 2 minutes · surfaces hidden protection most families miss
        </p>
      </div>

      {/* Hidden coverage examples */}
      <Card className="mb-6">
        <p className="t-micro text-muted mb-3">
          What we look for
        </p>
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.icon}
              <p className="t-body-sm text-slate">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Trust signal */}
      <div className="rounded-sm border border-hairline bg-sand-deep p-4 mb-6">
        <p className="t-body-sm text-slate leading-relaxed">
          <strong className="text-navy">100% rule-based.</strong> KIN does not sell insurance in this module.
          We only surface what you already own or are eligible for, then help you
          verify it.
        </p>
      </div>

      {/* CTA */}
      <Button fullWidth onClick={onStart}>
        Start Discovery
      </Button>

      <PrivacyLine className="mt-3">
        Your answers are used only to identify cover. No data is shared with insurers without your consent. Conditions apply.
      </PrivacyLine>
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
          <Button
            variant="ghost"
            size="md"
            onClick={() => setPhase('intro')}
            className="-ml-2"
          >
            ← Back
          </Button>
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
      <div className="px-5 pt-6 pb-5">
        <Button
          variant="ghost"
          size="md"
          onClick={() => navigate('/score')}
          className="-ml-2 mb-3"
        >
          ← Your Score
        </Button>
        <p className="t-micro text-muted mb-1">
          Discovery complete
        </p>
        <h1 className="t-h2 text-navy leading-tight">
          Your Hidden Cover
        </h1>
        <p className="t-caption text-muted mt-1">
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
        <p className="rounded-sm border border-hairline bg-sand-deep/50 p-3 text-[11px] leading-relaxed text-muted">
          This discovery analysis is based on your self-reported answers and general eligibility rules.
          KIN does not verify actual policy status with insurers or government databases.
          Always verify cover directly with the relevant insurer, employer, or government portal.
          This is not financial advice. <strong>Conditions apply.</strong>
        </p>

        {/* Next steps */}
        <Card className="space-y-3">
          <p className="t-micro text-muted">
            Next steps
          </p>
          <Button
            fullWidth
            onClick={() => navigate('/recommend')}
          >
            <IconShieldCheck size={16} className="text-white shrink-0" /> Connect to an advisor
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/vault')}
          >
            <IconVault size={16} className="shrink-0" /> Store Documents in Vault
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setCoverages([])
              setPhase('intro')
              window.scrollTo({ top: 0 })
            }}
          >
            Redo Discovery
          </Button>
        </Card>

        <PrivacyLine className="pt-1">Your answers stay private until you choose to share them</PrivacyLine>
      </div>
    </div>
  )
}
