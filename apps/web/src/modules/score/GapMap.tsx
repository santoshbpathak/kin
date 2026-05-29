import { useEffect, useState } from 'react'
import type { SubScore } from './scoreEngine'

interface GapBarProps {
  sub: SubScore
  delay?: number
}

function formatCover(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)}L`
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`
  return n === 0 ? '₹0' : `₹${n}`
}

function GapBar({ sub, delay = 0 }: GapBarProps) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(sub.score), delay + 200)
    return () => clearTimeout(t)
  }, [sub.score, delay])

  // Score colour follows value (Brand §04): ≥75 Teal · 45–74 Amber · <45 Coral
  const colour =
    sub.score >= 75 ? 'var(--kin-teal)' : sub.score >= 45 ? 'var(--kin-amber)' : 'var(--kin-coral)'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="t-body font-semibold text-navy">{sub.label}</span>
        <span className="nums text-[15px] font-bold" style={{ color: colour }}>
          {sub.score}
          <span className="text-[12px] font-normal text-muted">/100</span>
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-3 overflow-hidden rounded-pill bg-sand-deep">
        <div
          className="absolute inset-y-0 left-0 rounded-pill transition-all"
          style={{
            width: `${width}%`,
            backgroundColor: colour,
            transitionDuration: '800ms',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      {/* Cover amounts */}
      <div className="flex items-center justify-between text-[12px] text-muted">
        <span>
          Have: <span className="font-medium text-slate">{formatCover(sub.currentCover)}</span>
        </span>
        {sub.gap > 0 && (
          <span className="font-semibold text-coral">Gap: {formatCover(sub.gap)}</span>
        )}
        <span>
          Need: <span className="font-medium text-slate">{formatCover(sub.recommendedCover)}</span>
        </span>
      </div>
    </div>
  )
}

interface GapMapProps {
  life: SubScore
  health: SubScore
  income: SubScore
}

export function GapMap({ life, health, income }: GapMapProps) {
  return (
    <div className="space-y-5">
      <GapBar sub={life}   delay={0}   />
      <GapBar sub={health} delay={120} />
      <GapBar sub={income} delay={240} />
    </div>
  )
}
