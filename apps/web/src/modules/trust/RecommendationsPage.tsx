/**
 * RecommendationsPage — Module 5 (Trust Layer)
 *
 * Assembles:
 *   - Ranked recommendation cards (RecommendationCard)
 *   - "See the Math" bottom-sheet drawer (SeeTheMathDrawer)
 *   - IRDAI compliance summary + PDF stub (ComplianceSummary)
 *   - Context-aware disclaimer banner (DisclaimerBanner) — CG-2
 *
 * Compliance:
 *   - No recommendations shown until score is calculated (gates on sessionStorage)
 *   - Every recommendation has "See the Math" (non-optional per PRD + CG-2)
 *   - All mandatory disclaimers per CG-2 and CG-4 injected via DisclaimerBanner
 *   - ULIP recommendations gated OFF (isUlip: false, feature flag)
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateRecommendations, type Recommendation } from './recommendationEngine'
import { RecommendationCard } from './RecommendationCard'
import { SeeTheMathDrawer } from './SeeTheMathDrawer'
import { ComplianceSummary } from './ComplianceSummary'
import { DisclaimerBanner } from './DisclaimerBanner'
import { calculateScore } from '../score/scoreEngine'
import type { UserProfile } from '../diagnostic/parser'
import { apiRequest, ApiError } from '../../lib/apiClient'
import { Button, Card, NavHeader, StateChip, PrivacyLine } from '@/components/ui'
import { IconSearch, IconGift } from '@/components/ui/icons'

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

export function RecommendationsPage() {
  const navigate = useNavigate()
  const profile = useDiagnosticProfile()

  // "See the Math" drawer state
  const [mathRec, setMathRec] = useState<Recommendation | null>(null)

  // Guard: no profile → redirect to diagnosis
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-6 text-center gap-4">
        <IconSearch size={48} className="text-muted" />
        <h2 className="t-h2 text-navy">Complete your check-in first</h2>
        <p className="t-body text-muted">
          KIN generates personalised recommendations only after your protection score is calculated.
        </p>
        <Button onClick={() => navigate('/diagnose')}>Start 2-minute check-in</Button>
      </div>
    )
  }

  const score = calculateScore(profile)
  const recommendations = generateRecommendations(profile, score)

  // Derive a stable session reference from profile timestamp or fallback UUID
  const sessionId: string = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('kin_session_id')
      if (raw) return raw
      const id = crypto.randomUUID()
      sessionStorage.setItem('kin_session_id', id)
      return id
    } catch {
      return 'session-unknown'
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Audit-trail upload (IRDAI CG-8) ────────────────────────────────────
  // Persist the score + each recommendation the user just saw to the immutable
  // recommendation_audits table. We do this once per session+rec set. Failure
  // is logged but does not block the UI - the local UX still works for the user
  // and we retry on next page mount.
  const [, setRecIdToAuditId] = useState<Record<string, string>>({})
  const auditedRef = useRef(false)
  useEffect(() => {
    if (auditedRef.current) return
    if (!profile) return // narrowing for closure (the early return above means this is a no-op at runtime)
    auditedRef.current = true
    const p = profile

    async function logAudit() {
      try {
        const saved = await apiRequest<{ scoreId: string }>('/score/save', {
          method: 'POST',
          body: {
            compositeScore: score.compositeScore,
            lifeSubScore: score.lifeScore.score,
            healthSubScore: score.healthScore.score,
            incomeSubScore: score.incomeScore.score,
            hiddenCoverageTotal: 0,
            ruleVersion: score.ruleVersion,
            inputsSnapshot: {
              // Profile snapshot for audit (PII scrubbed server-side)
              incomeBand: p.incomeBand,
              lifeStage: p.lifeStage,
              dependantsCount: p.dependantsCount,
              monthlyObligationsBand: p.monthlyObligationsBand,
              cityTier: p.cityTier,
              occupation: p.occupation,
              hasTermLife: p.hasTermLife,
              hasEmployerMediclaim: p.hasEmployerMediclaim,
              hasPersonalHealth: p.hasPersonalHealth,
              hasEndowment: p.hasEndowment,
              edliEligible: p.edliEligible,
            },
          },
        })

        const logged = await apiRequest<{
          logged: number
          audits: Array<{ recommendationId: string; auditId: string }>
        }>('/trust/recommendations', {
          method: 'POST',
          body: {
            scoreId: saved.scoreId,
            recommendations: recommendations.map(r => ({
              id: r.id,
              recommendationType: r.productCategory,
              basisText: `${r.basisText}\n\nFormula:\n${r.formula}`,
              irdaiRuleReference: r.irdaiRuleReference,
            })),
            profileSnapshot: {
              incomeBand: p.incomeBand,
              lifeStage: p.lifeStage,
              dependantsCount: p.dependantsCount,
              monthlyObligationsBand: p.monthlyObligationsBand,
              cityTier: p.cityTier,
              occupation: p.occupation,
            },
          },
        })

        const map: Record<string, string> = {}
        for (const a of logged.audits) map[a.recommendationId] = a.auditId
        setRecIdToAuditId(map)
        sessionStorage.setItem('kin_audit_ids', JSON.stringify(map))
      } catch (err) {
        // Audit logging failure should not break the UX, but it MUST be visible.
        // In production this is reported by Sentry via the apiClient.
        if (err instanceof ApiError) {
          // eslint-disable-next-line no-console
          console.warn('[audit] failed to log recommendations to backend:', err.status, err.message)
        } else {
          // eslint-disable-next-line no-console
          console.warn('[audit] failed to log recommendations:', err)
        }
      }
    }
    void logAudit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle "Take Action" tap — in MVP1 navigates to Connect or external link
  const handleAction = (rec: Recommendation) => {
    if (rec.productCategory === 'pmsby_activation') {
      // PMSBY — direct to bank (no KIN purchase)
      window.open('https://www.jansuraksha.gov.in', '_blank', 'noopener,noreferrer')
    } else if (rec.productCategory === 'edli_awareness') {
      // EPFO portal
      window.open('https://unifiedportal-mem.epfindia.gov.in', '_blank', 'noopener,noreferrer')
    } else {
      // All insurance recommendations → KIN Connect (advisor call) in MVP1
      navigate('/connect')
    }
  }

  // Derive score chip tone from band
  const scoreTone =
    score.band === 'critical' ? 'critical' : score.band === 'significant' ? 'moderate' : 'positive'

  return (
    <>
      <div className="flex flex-col pb-10">
        {/* ── Page header ───────────────────────────────────────────── */}
        <NavHeader
          title="Recommendations"
          onBack={() => navigate('/score')}
          showBack
        />

        <div className="px-5 pt-5 pb-4">
          <p className="t-micro text-muted mb-1">Personalised for you</p>
          <h1 className="t-h2 text-navy leading-tight">
            Your Protection<br />Recommendations
          </h1>
          <p className="t-body-sm text-muted mt-1.5 leading-relaxed">
            {recommendations.length} rule-based actions ranked by their impact on your score ·
            Rule {score.ruleVersion}
          </p>
        </div>

        {/* ── Score recap strip ─────────────────────────────────────── */}
        <div className="px-5 mb-4">
          <Card className="flex items-center gap-3 p-3.5">
            <div className="w-12 h-12 rounded-md bg-teal flex items-center justify-center shrink-0">
              <span className="t-numeric-inline text-navy nums font-extrabold">{score.compositeScore}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-body font-bold text-navy">{score.bandLabel}</p>
              <p className="t-body-sm text-muted leading-snug">
                Life {score.lifeScore.score} · Health {score.healthScore.score} · Income {score.incomeScore.score}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StateChip tone={scoreTone}>{score.bandLabel}</StateChip>
              <Link
                to="/score"
                className="t-caption text-teal-deep font-semibold underline"
              >
                View score
              </Link>
            </div>
          </Card>
        </div>

        {/* ── Recommendation cards ──────────────────────────────────── */}
        <div className="px-5 space-y-4">
          {recommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onSeeTheMath={setMathRec}
              onAction={handleAction}
            />
          ))}
        </div>

        {/* ── CG-2 disclaimer banner — recommendation context ────────── */}
        <div className="px-5 mt-5">
          <DisclaimerBanner context="recommendation" hasTaxMention={false} />
        </div>

        {/* ── IRDAI Compliance Summary + PDF ────────────────────────── */}
        <div className="px-5 mt-5">
          <ComplianceSummary
            score={score}
            recommendations={recommendations}
            sessionId={sessionId}
          />
        </div>

        {/* ── Secondary action: discover hidden coverage ─────────────── */}
        <div className="px-5 mt-5">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/discover')}
          >
            <IconGift size={18} className="shrink-0" /> Discover your hidden cover
          </Button>
        </div>

        {/* ── Rule transparency footer ───────────────────────────────── */}
        <div className="px-5 mt-4">
          <div className="rounded-md border border-hairline bg-sand-deep p-3">
            <p className="t-caption text-muted leading-relaxed text-center">
              Recommendations are <strong>100% rule-based</strong> — no AI black-box decisions.
              Same inputs always produce the same outputs. Rule version {score.ruleVersion} ·
              Retained for IRDAI audit (5 years).
            </p>
          </div>
        </div>

        <PrivacyLine className="px-5 pt-4">Your answers stay private until you choose to share them</PrivacyLine>
      </div>

      {/* ── See the Math drawer — rendered outside scroll container ─── */}
      <SeeTheMathDrawer
        recommendation={mathRec}
        onClose={() => setMathRec(null)}
      />
    </>
  )
}
