import { Link } from 'react-router-dom'
import type { Recommendation } from './recommendationEngine'
import type { ScoreResult } from '../score/scoreEngine'

interface ComplianceSummaryProps {
  score: ScoreResult
  recommendations: Recommendation[]
  sessionId: string
}

export function ComplianceSummary({ score, recommendations, sessionId }: ComplianceSummaryProps) {
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* IRDAI compliance header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)' }}
      >
        <span className="text-lg">🏛️</span>
        <div>
          <p className="text-xs font-bold text-gray-800">IRDAI Suitability Record</p>
          <p className="text-[10px] text-gray-500">Generated {timestamp} · Rule {score.ruleVersion}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Suitability statement */}
        <p className="text-xs text-gray-600 leading-relaxed">
          Based on the information you provided, KIN has generated the above recommendations in
          accordance with IRDAI Suitability of Life Insurance Products Guidelines 2023. All
          recommendations are rule-based and deterministic — no automated black-box decisions have
          been made. This record is retained for audit purposes.
        </p>

        {/* Summary table */}
        <div className="rounded-xl bg-gray-50 p-3 space-y-1.5">
          {[
            { label: 'Composite score', value: `${score.compositeScore}/100` },
            { label: 'Band', value: score.bandLabel },
            { label: 'Recommendations generated', value: `${recommendations.length}` },
            { label: 'Rule version', value: score.ruleVersion },
            { label: 'Session reference', value: sessionId.slice(0, 8) + '…' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center text-xs">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-800 font-mono">{value}</span>
            </div>
          ))}
        </div>

        {/* Download PDF stub */}
        <button
          onClick={handleDownloadPdf}
          className="w-full py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          ⬇ Download Suitability Summary
        </button>

        {/* Mandatory compliance footer — CG-2 */}
        <p className="text-[10px] text-gray-400 leading-relaxed">
          This document is generated for IRDAI audit trail purposes. It is not a policy document
          and has no monetary value. For details on risk factors, terms and conditions, please read
          the sales brochure carefully before concluding a sale.{' '}
          <strong>Conditions apply.</strong> Retained for 5 years per IRDAI guidelines.
        </p>

        {/* Advisor booking CTA */}
        <Link
          to="/connect"
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          📞 Book a Free Advisor Call
        </Link>
      </div>
    </div>
  )
}
