import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateScore } from './scoreEngine'
import { GapMap } from './GapMap'
import { ScoreBreakdown } from './ScoreBreakdown'
import type { UserProfile } from '../diagnostic/parser'
import { Button, Card, ScoreRing, StateChip, PrivacyLine } from '@/components/ui'
import { IconGift, IconSearch } from '@/components/ui/icons'

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

// ── Peer benchmark (real data comes from backend cohort aggregation) ──────
function PeerBenchmarkChip({ score, cityTier }: { score: number; cityTier: string }) {
  const peerAvg = cityTier === 'T1' ? 52 : cityTier === 'T2' ? 48 : 44
  const diff = score - peerAvg
  const better = diff >= 0
  const place = cityTier === 'T1' ? 'metro' : cityTier === 'T2' ? 'Tier-2 city' : 'Tier-3 city'

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex-1">
        <p className="t-body-sm text-muted">
          Families like yours ({place}) average{' '}
          <span className="nums font-semibold text-navy">{peerAvg}</span>
        </p>
        <p className="t-body-sm mt-0.5 font-semibold text-navy">
          {better
            ? `You're ${diff} points ahead of them`
            : `You're ${Math.abs(diff)} points behind them`}
        </p>
      </div>
      <StateChip tone={better ? 'positive' : 'moderate'}>{better ? 'Ahead' : 'Catching up'}</StateChip>
    </Card>
  )
}

// ── Hidden coverage bonus banner ──────────────────────────────────────────
function HiddenCoverageBanner({ total, edliEligible }: { total: number; edliEligible: boolean }) {
  if (total === 0) return null
  return (
    <div className="rounded-md border border-teal/30 bg-mint p-4">
      <div className="flex items-start gap-3">
        <IconGift size={24} className="shrink-0 text-teal-deep" />
        <div>
          <p className="t-body font-bold text-navy">
            Hidden cover found: ₹{(total / 100_000).toFixed(0)}L
          </p>
          <p className="t-body-sm mt-1 text-slate">
            {edliEligible &&
              'Your EPFO membership includes ₹7L EDLI life cover — most people never know it exists.'}{' '}
            This is a bonus on top of your score. Tap below to see all your hidden cover.
          </p>
          <p className="mt-1 text-[11px] text-muted">Conditions apply. As per EPFO EDLI Scheme 1976.</p>
        </div>
      </div>
    </div>
  )
}

export function ScorePage() {
  const navigate = useNavigate()
  const profile = useDiagnosticProfile()

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center gap-4 px-6 text-center">
        <IconSearch size={48} className="text-muted" />
        <h2 className="t-h2 text-navy">No protection check yet</h2>
        <p className="t-body text-muted">Complete the two-minute check to see your score.</p>
        <Button onClick={() => navigate('/diagnose')}>Start the check</Button>
      </div>
    )
  }

  const result = calculateScore(profile)

  const stateLine =
    result.band === 'critical'
      ? 'Serious gap — but closeable.'
      : result.band === 'significant'
        ? 'Meaningful gaps to close.'
        : result.band === 'moderate'
          ? 'A few optimisations away.'
          : 'Your family is well covered.'

  const explanation =
    result.band === 'critical'
      ? 'Your family has significant exposure right now. The good news: 2–3 simple steps close most of the gap.'
      : result.band === 'significant'
        ? 'You have a foundation, but there are meaningful gaps that need attention.'
        : result.band === 'moderate'
          ? 'Decent base cover — a few changes will make a real difference for your family.'
          : 'Focus on maintaining and inflation-adjusting the cover you already have.'

  return (
    <div className="flex flex-col px-5 pb-8 pt-6">
      {/* Eyebrow */}
      <p className="t-micro text-center text-muted">Your Protection Score</p>

      {/* Score ring — centrepiece */}
      <div className="flex justify-center pt-4">
        <ScoreRing value={result.compositeScore} variant="hero" />
      </div>

      {/* State line + explanation */}
      <h1 className="t-h3 mt-3.5 text-center text-navy">{stateLine}</h1>
      <p className="t-body-sm mx-auto mt-2.5 max-w-sm text-center text-slate">{explanation}</p>
      <p className="mt-2 text-center text-[11px] text-muted">
        Rule version {result.ruleVersion} · calculated just now
      </p>

      <div className="mt-6 space-y-4">
        <PeerBenchmarkChip score={result.compositeScore} cityTier={profile.cityTier} />

        <HiddenCoverageBanner total={result.hiddenCoverageTotal} edliEligible={result.edliEligible} />

        {/* Gap map */}
        <Card>
          <p className="t-micro mb-4 text-muted">Where the gaps are</p>
          <GapMap life={result.lifeScore} health={result.healthScore} income={result.incomeScore} />
        </Card>

        {/* Score breakdown — each row one tap from its math (UX Law 05) */}
        <ScoreBreakdown
          life={result.lifeScore}
          health={result.healthScore}
          income={result.incomeScore}
        />

        {/* Compliance disclaimer — CG-2 mandatory */}
        <p className="rounded-sm border border-hairline bg-sand-deep/50 p-3 text-[11px] leading-relaxed text-muted">
          This score is indicative of your protection position based on the information you provided.
          It does not constitute financial advice. For risk factors, terms and conditions, please
          consult a licensed insurance advisor before concluding a sale. <strong>Conditions apply.</strong>
        </p>

        {/* Primary action = next step */}
        <Button fullWidth onClick={() => navigate('/recommend')}>
          Show me how to close it
        </Button>

        {/* Secondary + ghost */}
        <Button variant="secondary" fullWidth onClick={() => navigate('/discover')}>
          Discover hidden cover
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navigate('/diagnose')}>
          Retake the check
        </Button>

        <PrivacyLine className="pt-1">Your answers stay private until you choose to share them</PrivacyLine>
      </div>
    </div>
  )
}
