import { useState } from 'react'
import type { SubScore } from './scoreEngine'

interface AccordionItemProps {
  sub: SubScore
  weight: string
}

function AccordionItem({ sub, weight }: AccordionItemProps) {
  const [open, setOpen] = useState(false)

  // Score colour follows value (Brand §04): ≥75 Teal · 45–74 Amber · <45 Coral
  const colour =
    sub.score >= 75 ? 'var(--kin-teal)' : sub.score >= 45 ? 'var(--kin-amber)' : 'var(--kin-coral)'

  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-touch w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        {/* Score pill */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-[15px] font-bold text-white"
          style={{ backgroundColor: colour }}
        >
          <span className="nums">{sub.score}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="t-body font-semibold text-navy">{sub.label}</p>
          <p className="t-body-sm text-muted">{weight} of composite score</p>
        </div>

        <span className={['text-muted transition-transform duration-base', open ? 'rotate-180' : ''].join(' ')}>
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline bg-sand px-4 pb-4 pt-3">
          <p className="t-body-sm text-slate">{sub.description}</p>

          {/* "See the Math" — CG-2 compliance: always present (UX Law 05) */}
          <div className="mt-3 rounded-sm border border-hairline border-l-[3px] border-l-teal bg-surface p-3">
            <p className="t-micro mb-1.5 text-muted">See the math</p>
            <dl className="space-y-1 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-slate">Current cover</dt>
                <dd className="nums font-semibold text-navy">₹{sub.currentCover.toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Recommended</dt>
                <dd className="nums font-semibold text-navy">₹{sub.recommendedCover.toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between border-t border-hairline-strong pt-1.5">
                <dt className="text-slate">Score = (have ÷ need) × 100</dt>
                <dd className="nums font-bold text-navy">{sub.score} / 100</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-muted">
              Indicative. Conditions apply. Read the sales brochure before concluding a sale.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface ScoreBreakdownProps {
  life: SubScore
  health: SubScore
  income: SubScore
}

export function ScoreBreakdown({ life, health, income }: ScoreBreakdownProps) {
  return (
    <div className="space-y-2">
      <p className="t-micro mb-3 px-1 text-muted">Score breakdown</p>
      <AccordionItem sub={life}   weight="40%" />
      <AccordionItem sub={health} weight="35%" />
      <AccordionItem sub={income} weight="25%" />
    </div>
  )
}
