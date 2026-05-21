import { useEffect, useRef, useState } from 'react'

interface ScoreDialProps {
  score: number        // 0–100
  colour: string       // hex
  bandLabel: string
  size?: number        // px, default 220
}

const RADIUS = 80
const STROKE = 14
const CX = 110
const CY = 110
// Arc spans 270° — starts at 135° (bottom-left) sweeps clockwise to 45° (bottom-right)
const START_ANGLE = 135
const SWEEP = 270

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(cx, cy, r, startDeg)
  const e = polarToXY(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

// Band colour stops at positions along the arc
const BAND_STOPS = [
  { at: 0,   colour: '#EF4444' },  // Critical
  { at: 30,  colour: '#F97316' },  // Significant
  { at: 55,  colour: '#EAB308' },  // Moderate
  { at: 75,  colour: '#22C55E' },  // Well
  { at: 90,  colour: '#14B8A6' },  // Full
]

export function ScoreDial({ score, colour, bandLabel, size = 220 }: ScoreDialProps) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef<number>(0)

  // Animate counter and arc from 0 → score over ~900ms
  useEffect(() => {
    const duration = 900
    const start = performance.now()
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(eased * score))
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [score])

  const endAngle = START_ANGLE + (displayed / 100) * SWEEP
  const trackEnd = START_ANGLE + SWEEP

  // Tick marks at each band boundary
  const ticks = [30, 55, 75, 90].map((v) => {
    const angle = START_ANGLE + (v / 100) * SWEEP
    const inner = polarToXY(CX, CY, RADIUS - STROKE / 2 - 2, angle)
    const outer = polarToXY(CX, CY, RADIUS + STROKE / 2 + 2, angle)
    return { inner, outer, angle }
  })

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size * 0.88}
        viewBox="0 0 220 195"
        aria-label={`Protection score: ${score} out of 100`}
        role="img"
      >
        {/* Track (background arc) */}
        <path
          d={describeArc(CX, CY, RADIUS, START_ANGLE, trackEnd)}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Filled arc — single colour of current band */}
        {displayed > 0 && (
          <path
            d={describeArc(CX, CY, RADIUS, START_ANGLE, endAngle)}
            fill="none"
            stroke={colour}
            strokeWidth={STROKE}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        )}

        {/* Band tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.inner.x} y1={t.inner.y}
            x2={t.outer.x} y2={t.outer.y}
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Score number */}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
          style={{
            fontSize: 46,
            fontWeight: 800,
            fill: colour,
            fontFamily: 'var(--font-family, Inter)',
            transition: 'fill 0.3s ease',
          }}
        >
          {displayed}
        </text>

        {/* "/100" label */}
        <text
          x={CX}
          y={CY + 34}
          textAnchor="middle"
          style={{ fontSize: 13, fill: '#9CA3AF', fontFamily: 'var(--font-family, Inter)' }}
        >
          out of 100
        </text>
      </svg>

      {/* Band label pill */}
      <div
        className="px-4 py-1.5 rounded-full text-white text-sm font-semibold -mt-2 shadow-sm"
        style={{ backgroundColor: colour }}
      >
        {bandLabel}
      </div>
    </div>
  )
}
