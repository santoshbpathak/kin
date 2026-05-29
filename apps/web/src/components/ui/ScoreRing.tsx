import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Protection Score Ring — Brand Guidelines §08.
 * Progress colour follows value: ≥75 Teal · 45–74 Amber · <45 Coral.
 * Hero 220 (stroke 14) / inline 96 (stroke 6). Animates 0→value over 800ms
 * spring on first reveal only — static when prefers-reduced-motion.
 */

function bandColor(value: number) {
  if (value >= 75) return 'var(--kin-teal)'
  if (value >= 45) return 'var(--kin-amber)'
  return 'var(--kin-coral)'
}

interface ScoreRingProps {
  value: number // 0–100
  variant?: 'hero' | 'inline'
  /** Caption under the number (hero only), e.g. "PROTECTION SCORE". */
  label?: string
  className?: string
}

export function ScoreRing({ value, variant = 'hero', label, className }: ScoreRingProps) {
  const size = variant === 'hero' ? 220 : 96
  const stroke = variant === 'hero' ? 14 : 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const [shown, setShown] = useState(reduced ? clamped : 0)
  useEffect(() => {
    if (reduced) {
      setShown(clamped)
      return
    }
    const id = requestAnimationFrame(() => setShown(clamped))
    return () => cancelAnimationFrame(id)
  }, [clamped, reduced])

  const offset = circumference - (shown / 100) * circumference
  const color = bandColor(clamped)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Protection score ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(16,42,67,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn('nums text-navy', variant === 'hero' ? 't-numeric-hero' : 't-numeric-inline')}
        >
          {Math.round(shown)}
        </span>
        {variant === 'hero' && label && (
          <span className="t-micro mt-1 text-muted">{label}</span>
        )}
      </div>
    </div>
  )
}
