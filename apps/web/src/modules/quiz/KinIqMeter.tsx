/**
 * KinIqMeter.tsx — Module 8B: KIN IQ Weekly Quiz
 *
 * Visual gauge showing the user's cumulative KIN IQ score (0–100).
 * Separate from the Protection Score — measures financial literacy.
 *
 * Bands:
 *   0–25:   Beginner (muted)
 *   26–50:  Learning (amber)
 *   51–75:  Informed (teal-deep)
 *   76–100: KIN Expert (teal)
 */

import { StateChip } from '@/components/ui'

type Props = {
  score: number
  size?: 'sm' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

type Band = {
  label: string
  /** CSS token value used for SVG stroke */
  strokeColour: string
  /** StateChip tone or null for neutral */
  tone: 'positive' | 'moderate' | null
  min: number
}

const BANDS: Band[] = [
  { label: 'Beginner',   strokeColour: 'var(--kin-muted)',      tone: null,       min: 0  },
  { label: 'Learning',   strokeColour: 'var(--kin-amber)',      tone: 'moderate', min: 26 },
  { label: 'Informed',   strokeColour: 'var(--kin-teal-deep)',  tone: 'positive', min: 51 },
  { label: 'KIN Expert', strokeColour: 'var(--kin-teal)',       tone: 'positive', min: 76 },
]

function getBand(score: number): Band {
  return [...BANDS].reverse().find(b => score >= b.min) ?? BANDS[0]
}

export function KinIqMeter({ score, size = 'lg', showLabel = true, animated = true }: Props) {
  const band = getBand(score)
  const pct = Math.min(100, Math.max(0, score))

  const dim = size === 'lg' ? 120 : 72
  const stroke = size === 'lg' ? 10 : 7
  const r = (dim / 2) - stroke
  const circ = 2 * Math.PI * r
  // Arc: 75% of circle (from 7 o'clock to 5 o'clock), bottom gap
  const arcFraction = 0.75
  const dashArray = circ * arcFraction
  const dashOffset = dashArray - (dashArray * pct) / 100

  // Rotate so arc starts at bottom-left (135°) and ends at bottom-right
  const rotation = 135

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          {/* Background track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="var(--kin-hairline-strong)"
            strokeWidth={stroke}
            strokeDasharray={`${dashArray} ${circ - dashArray}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${dim / 2} ${dim / 2})`}
          />
          {/* Filled arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={band.strokeColour}
            strokeWidth={stroke}
            strokeDasharray={`${dashArray} ${circ - dashArray}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${dim / 2} ${dim / 2})`}
            style={animated ? { transition: 'stroke-dashoffset 1s ease-out' } : {}}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={size === 'lg' ? 't-numeric-hero' : 't-numeric-inline nums'}
            style={{ color: band.strokeColour, lineHeight: 1 }}
          >
            {score}
          </span>
          {size === 'lg' && (
            <span className="t-micro text-muted" style={{ marginTop: 2 }}>
              KIN IQ
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        band.tone ? (
          <StateChip tone={band.tone}>{band.label}</StateChip>
        ) : (
          <span className="inline-flex h-8 items-center rounded-pill border border-hairline px-3 t-caption text-muted font-semibold mt-1">
            {band.label}
          </span>
        )
      )}
    </div>
  )
}
