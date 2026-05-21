import { useState } from 'react'
import type { SubScore } from './scoreEngine'

interface AccordionItemProps {
  sub: SubScore
  weight: string
}

function AccordionItem({ sub, weight }: AccordionItemProps) {
  const [open, setOpen] = useState(false)

  const colour =
    sub.score <= 30 ? '#EF4444'
    : sub.score <= 55 ? '#F97316'
    : sub.score <= 75 ? '#EAB308'
    : sub.score <= 90 ? '#22C55E'
    : '#14B8A6'

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        {/* Score pill */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: colour }}
        >
          {sub.score}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{sub.label}</p>
          <p className="text-xs text-gray-400">{weight} of composite score</p>
        </div>

        <span className={['text-gray-400 text-sm transition-transform', open ? 'rotate-180' : ''].join(' ')}>
          ↓
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed">{sub.description}</p>

          {/* "See the Math" section — CG-2 compliance: always present */}
          <div className="mt-3 rounded-xl border border-dashed border-gray-200 p-3 bg-white">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              🔍 See the Math
            </p>
            <div className="text-xs text-gray-600 space-y-0.5 font-mono">
              <p>Current cover: ₹{sub.currentCover.toLocaleString('en-IN')}</p>
              <p>Recommended: ₹{sub.recommendedCover.toLocaleString('en-IN')}</p>
              <p>Score = ({sub.currentCover.toLocaleString('en-IN')} ÷ {sub.recommendedCover.toLocaleString('en-IN')}) × 100</p>
              <p className="font-bold text-gray-800">= {sub.score} / 100</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              This information is indicative. Conditions apply. For details read the sales brochure before concluding a sale.
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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">
        Score breakdown
      </p>
      <AccordionItem sub={life}   weight="40%" />
      <AccordionItem sub={health} weight="35%" />
      <AccordionItem sub={income} weight="25%" />
    </div>
  )
}
