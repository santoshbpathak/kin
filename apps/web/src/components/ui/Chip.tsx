import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Chips — Brand Guidelines §08.
 *  TrustChip   entry / privacy strip — hairline outline, muted text.
 *  ChoiceChip  conversation answers — sand-deep fill, navy text, 40h, tappable.
 *  StateChip   positive / moderate / critical status pills.
 * All chips are pill-radius and meet the 44px hit target via touch padding.
 */

export function TrustChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center rounded-pill border border-hairline-strong px-3 text-[12px] font-medium text-muted">
      {children}
    </span>
  )
}

interface ChoiceChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export function ChoiceChip({ selected, className, children, ...props }: ChoiceChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 min-h-touch items-center rounded-pill px-4 text-[14px] font-semibold transition-colors duration-fast ease-out active:scale-[0.98]',
        selected ? 'bg-navy text-sand' : 'bg-sand-deep text-navy',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

type StateTone = 'positive' | 'moderate' | 'critical'

const stateStyles: Record<StateTone, string> = {
  positive: 'bg-mint text-teal-deep',
  moderate: 'bg-[rgba(245,166,35,0.14)] text-[#8A5A07]',
  critical: 'bg-[rgba(232,93,90,0.12)] text-[#9F2D2A]',
}

export function StateChip({ tone, children }: { tone: StateTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center rounded-pill px-3 text-[12px] font-semibold',
        stateStyles[tone],
      )}
    >
      {children}
    </span>
  )
}
