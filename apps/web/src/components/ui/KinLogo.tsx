import { cn } from '@/lib/cn'

/**
 * KIN "Shelter" lockup — Brand Guidelines §03 / §11. OFFICIAL locked mark.
 *
 * A roof (shelter) over three family dots with a foundation line. The mark
 * body is Navy (or Sand on dark surfaces); the centre dot is always Teal —
 * the locked accent. Vector recreation of docs/brand/KIN_Logo.png so it stays
 * crisp at any size and recolours with the theme.
 *
 * Rules honoured: always horizontal, flat (no shadow/gradient/glow), never
 * tilted, only the locked palette, wordmark in Manrope.
 */

type Tone = 'navy' | 'sand'

function ShelterMark({ size = 40, tone = 'navy' }: { size?: number; tone?: Tone }) {
  const body = tone === 'sand' ? 'var(--kin-sand)' : 'var(--kin-navy)'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 94"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      {/* Roof — the shelter */}
      <path
        d="M16 52 L50 20 L84 52"
        stroke={body}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Family dots — centre is always the Teal accent */}
      <circle cx="32" cy="65" r="7" fill={body} />
      <circle cx="50" cy="65" r="7" fill="var(--kin-teal)" />
      <circle cx="68" cy="65" r="7" fill={body} />
      {/* Foundation */}
      <path d="M17 82 L83 82" stroke={body} strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

interface KinLogoProps {
  /** Show the "kin" wordmark beside the mark (default true). */
  wordmark?: boolean
  /** Pixel height of the Shelter mark (auto-swaps to mark-only below 24). */
  size?: number
  /** Use Sand body on dark surfaces. */
  tone?: Tone
  className?: string
}

export function KinLogo({ wordmark = true, size = 40, tone = 'navy', className }: KinLogoProps) {
  // §03: below 24px the lockup drops to the Pure mark only.
  const showWordmark = wordmark && size >= 24
  const wordColor = tone === 'sand' ? 'var(--kin-sand)' : 'var(--kin-navy)'

  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: 10 }}>
      <ShelterMark size={size} tone={tone} />
      {showWordmark && (
        <span
          className="font-sans font-bold lowercase"
          style={{
            color: wordColor,
            fontSize: size * 0.74,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          kin
        </span>
      )}
    </span>
  )
}
