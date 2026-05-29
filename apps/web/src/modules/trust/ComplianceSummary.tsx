import { useNavigate } from 'react-router-dom'
import type { Recommendation } from './recommendationEngine'
import type { ScoreResult } from '../score/scoreEngine'
import { Button, Card } from '@/components/ui'
import { IconBuilding, IconDownload, IconPhone } from '@/components/ui/icons'

interface ComplianceSummaryProps {
  score: ScoreResult
  recommendations: Recommendation[]
  sessionId: string
}

export function ComplianceSummary({ score, recommendations, sessionId }: ComplianceSummaryProps) {
  const navigate = useNavigate()

  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  // Simulate PDF download — real implementation uses SuitabilityPdfService (backend)
  const handleDownloadPdf = () => {
    const content = [
      'KIN PROTECTION SUITABILITY SUMMARY',
      `Generated: ${timestamp}`,
      `Session: ${sessionId}`,
      `Rule Version: ${score.ruleVersion}`,
      '',
      `COMPOSITE SCORE: ${score.compositeScore}/100 (${score.bandLabel})`,
      `Life Protection: ${score.lifeScore.score}/100`,
      `Health Protection: ${score.healthScore.score}/100`,
      `Income Protection: ${score.incomeScore.score}/100`,
      '',
      'RECOMMENDATIONS',
      ...recommendations.map((r, i) =>
        `${i + 1}. [${r.id}] ${r.headline}\n   Basis: ${r.basisText}\n   IRDAI Ref: ${r.irdaiRuleReference}`
      ),
      '',
      'DISCLAIMER',
      'This document is auto-generated for IRDAI suitability audit purposes.',
      'It does not constitute financial advice.',
      'For details on risk factors, terms and conditions, please read the sales brochure.',
      'Conditions apply.',
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `KIN-Suitability-${sessionId.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* IRDAI compliance header */}
      <div className="flex items-center gap-2 bg-sand-deep px-4 py-3">
        <IconBuilding size={20} className="text-navy shrink-0" />
        <div>
          <p className="t-body-sm font-bold text-navy">IRDAI Suitability Record</p>
          <p className="t-micro text-muted">Generated {timestamp} · Rule {score.ruleVersion}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Suitability statement */}
        <p className="t-caption text-slate leading-relaxed">
          Based on the information you provided, KIN has generated the above recommendations in
          accordance with IRDAI Suitability of Life Insurance Products Guidelines 2023. All
          recommendations are rule-based and deterministic — no automated black-box decisions have
          been made. This record is retained for audit purposes.
        </p>

        {/* Summary table */}
        <div className="rounded-sm border border-hairline bg-sand-deep p-3 space-y-1.5">
          {[
            { label: 'Composite score', value: `${score.compositeScore}/100` },
            { label: 'Band', value: score.bandLabel },
            { label: 'Recommendations generated', value: `${recommendations.length}` },
            { label: 'Rule version', value: score.ruleVersion },
            { label: 'Session reference', value: sessionId.slice(0, 8) + '…' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="t-caption text-muted">{label}</span>
              <span className="t-caption nums font-semibold text-navy">{value}</span>
            </div>
          ))}
        </div>

        {/* Download summary stub */}
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleDownloadPdf}
        >
          <IconDownload size={16} className="text-navy shrink-0" /> Download Suitability Summary
        </Button>

        {/* Mandatory compliance footer — CG-2 */}
        <p className="t-micro text-muted leading-relaxed">
          This document is generated for IRDAI audit trail purposes. It is not a policy document
          and has no monetary value. For details on risk factors, terms and conditions, please read
          the sales brochure carefully before concluding a sale.{' '}
          <strong>Conditions apply.</strong> Retained for 5 years per IRDAI guidelines.
        </p>

        {/* Advisor connection CTA */}
        <Button fullWidth onClick={() => navigate('/connect')}>
          <IconPhone size={16} className="text-navy shrink-0" /> Connect to an advisor
        </Button>
      </div>
    </Card>
  )
}
