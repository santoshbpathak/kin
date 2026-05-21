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

  const colour =
    sub.score <= 30 ? '#EF4444'
    : sub.score <= 55 ? '#F97316'
    : sub.score <= 75 ? '#EAB308'
    : sub.score <= 90 ? '#22C55E'
    : '#14B8A6'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{sub.label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: colour }}>
          {sub.score}
          <span className="text-xs text-gray-400 font-normal">/100</span>
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${width}%`,
            backgroundColor: colour,
            transitionDuration: '800ms',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      {/* Cover amounts */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Have: <span className="font-medium text-gray-600">{formatCover(sub.currentCover)}</span>
        </span>
        {sub.gap > 0 && (
          <span className="text-red-400 font-medium">
            Gap: {formatCover(sub.gap)}
          </span>
        )}
        <span>
          Need: <span className="font-medium text-gray-600">{formatCover(sub.recommendedCover)}</span>
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
