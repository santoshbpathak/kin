import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { calculateScore } from './scoreEngine'
import { ScoreDial } from './ScoreDial'
import { GapMap } from './GapMap'
import { ScoreBreakdown } from './ScoreBreakdown'
import type { UserProfile } from '../diagnostic/parser'

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

// ── Peer benchmark mock (real data comes from backend cohort aggregation) ─
function PeerBenchmarkChip({ score, cityTier }: { score: number; cityTier: string }) {
  // Simulated peer average — backend will replace with real cohort query
  const peerAvg = cityTier === 'T1' ? 52 : cityTier === 'T2' ? 48 : 44
  const diff = score - peerAvg
  const better = diff >= 0

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
      <span className="text-lg">👥</span>
      <div className="flex-1">
        <p className="text-xs text-gray-500">
          Peers like you (
          {cityTier === 'T1' ? 'metro' : cityTier === 'T2' ? 'Tier-2 city' : 'Tier-3 city'}
          ) average
          <span className="font-semibold text-gray-700"> {peerAvg}</span>
        </p>
        <p className={['text-xs font-semibold', better ? 'text-green-600' : 'text-red-500'].join(' ')}>
          {better
            ? `You are ${diff} points ahead of your peers`
            : `You are ${Math.abs(diff)} points behind your peers`}
        </p>
      </div>
      <span className="text-lg">{better ? '🏆' : '📈'}</span>
    </div>
  )
}

// ── Hidden coverage bonus banner ──────────────────────────────────────────
function HiddenCoverageBanner({ total, edliEligible }: { total: number; edliEligible: boolean }) {
  if (total === 0) return null
  return (
    <div className="rounded-2xl border-2 border-dashed p-4"
      style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, white)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🎁</span>
        <div>
          <p className="text-sm font-bold text-gray-800">
            Bonus Coverage: ₹{(total / 100_000).toFixed(0)}L detected!
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {edliEligible && 'Your EPFO membership includes ₹7L EDLI life cover — most people don\'t know this exists.'}
            {' '}This is NOT counted in your score (it\'s a bonus). Tap below to discover all hidden coverage.
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Conditions apply. As per EPFO EDLI Scheme 1976.</p>
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-6 text-center gap-4">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-bold text-gray-900">No diagnostic data found</h2>
        <p className="text-sm text-gray-500">Complete the 2-minute check-in to see your score.</p>
        <Link
          to="/diagnose"
          className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Start Check-in
        </Link>
      </div>
    )
  }

  const result = calculateScore(profile)

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
          Your KIN Protection Score
        </p>
        <p className="text-xs text-gray-400">
          Rule version {result.ruleVersion} · Calculated just now
        </p>
      </div>

      {/* Score Dial — centrepiece */}
      <div className="flex justify-center pt-2 pb-4">
        <ScoreDial
          score={result.compositeScore}
          colour={result.bandColour}
          bandLabel={result.bandLabel}
          size={220}
        />
      </div>

      {/* Score headline text */}
      <div className="px-6 pb-4 text-center">
        {result.band === 'critical' && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Your family has <span className="font-bold text-red-500">significant exposure</span> right now.
            The good news: 2–3 simple actions can close most of the gap.
          </p>
        )}
        {result.band === 'significant' && (
          <p className="text-sm text-gray-600 leading-relaxed">
            You have a foundation, but there are <span className="font-bold text-orange-500">meaningful gaps</span> that need attention.
          </p>
        )}
        {result.band === 'moderate' && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Decent base coverage — a few <span className="font-bold text-yellow-600">optimisations</span> will make a real difference.
          </p>
        )}
        {(result.band === 'well' || result.band === 'full') && (
          <p className="text-sm text-gray-600 leading-relaxed">
            You are <span className="font-bold text-green-600">well covered</span>. Focus on maintaining and inflation-adjusting your cover.
          </p>
        )}
      </div>

      <div className="px-6 space-y-5">
        {/* Peer benchmark */}
        <PeerBenchmarkChip
          score={result.compositeScore}
          cityTier={profile.cityTier}
        />

        {/* Hidden coverage bonus */}
        <HiddenCoverageBanner
          total={result.hiddenCoverageTotal}
          edliEligible={result.edliEligible}
        />

        {/* Gap Map */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Gap map
          </p>
          <GapMap
            life={result.lifeScore}
            health={result.healthScore}
            income={result.incomeScore}
          />
        </div>

        {/* Score breakdown accordion with "See the Math" */}
        <ScoreBreakdown
          life={result.lifeScore}
          health={result.healthScore}
          income={result.incomeScore}
        />

        {/* Compliance disclaimer — CG-2 mandatory */}
        <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            This score is indicative of your protection position based on the information you provided.
            It does not constitute financial advice. For more details on risk factors, terms and conditions,
            please consult a licensed insurance advisor before concluding a sale.{' '}
            <strong>Conditions apply.</strong>
          </p>
        </div>

        {/* Primary CTA — See Recommendations */}
        <Link
          to="/recommend"
          className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          🛡️ See My Recommendations →
        </Link>

        {/* Secondary CTA */}
        <Link
          to="/discover"
          className="w-full py-3 rounded-2xl border-2 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          🎁 Discover Hidden Coverage
        </Link>

        <button
          onClick={() => navigate('/diagnose')}
          className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-2xl"
        >
          Retake Check-in
        </button>
      </div>
    </div>
  )
}
