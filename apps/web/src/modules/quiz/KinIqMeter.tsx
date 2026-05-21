/**
 * KinIqMeter.tsx — Module 8B: KIN IQ Weekly Quiz
 *
 * Visual gauge showing the user's cumulative KIN IQ score (0–100).
 * Separate from the Protection Score — measures financial literacy.
 *
 * Bands:
 *   0–25:   Beginner (grey)
 *   26–50:  Learning (amber)
 *   51–75:  Informed (blue)
 *   76–100: KIN Expert (green/teal)
 */

type Props = {
  score: number
  size?: 'sm' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

type Band = {
  label: string
  colour: string
  bg: string
  min: number
}

const BANDS: Band[] = [
  { label: 'Beginner',   colour: '#9CA3AF', bg: '#F3F4F6', min: 0  },
  { label: 'Learning',   colour: '#D97706', bg: '#FEF3C7', min: 26 },
  { label: 'Informed',   colour: '#2563EB', bg: '#DBEAFE', min: 51 },
  { label: 'KIN Expert', colour: '#059669', bg: '#D1FAE5', min: 76 },
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
      <div style={{ position: 'relative', width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          {/* Background track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="#E5E7EB"
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
            stroke={band.colour}
            strokeWidth={stroke}
            strokeDasharray={`${dashArray} ${circ - dashArray}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${dim / 2} ${dim / 2})`}
            style={animated ? { transition: 'stroke-dashoffset 1s ease-out' } : {}}
          />
        </svg>

        {/* Centre text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: size === 'lg' ? 26 : 15,
              fontWeight: 900,
              color: band.colour,
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          {size === 'lg' && (
            <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
              KIN IQ
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <span
          className="text-xs font-bold px-3 py-1 rounded-full mt-1"
          style={{ backgroundColor: band.bg, color: band.colour }}
        >
          {band.label}
        </span>
      )}
    </div>
  )
}
