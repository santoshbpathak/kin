import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * "See the Math" card — Brand Guidelines §08 (signature transparency component).
 * The math is a hero feature, never a footnote: every score/gap is one tap from
 * its calculation. Teal left border, rows of label→value, a separated total row.
 * Collapsible so it can sit "one tap away" per UX Law 05.
 */

export interface MathRow {
  label: string
  value: string
}

interface SeeTheMathProps {
  /** Eyebrow header, e.g. "How we got this". */
  title?: string
  rows: MathRow[]
  total?: MathRow
  /** Start expanded (default false — opens on tap). */
  defaultOpen?: boolean
  className?: string
}

export function SeeTheMath({
  title = 'See the math',
  rows,
  total,
  defaultOpen = false,
  className,
}: SeeTheMathProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'rounded-md border border-hairline bg-surface shadow-card',
        'border-l-[3px] border-l-teal',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-touch w-full items-center justify-between px-[18px] py-4"
        aria-expanded={open}
      >
        <span className="t-micro text-muted">{title}</span>
        <span
          className={cn('text-muted transition-transform duration-base ease-out', open && 'rotate-180')}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-[18px] pb-4">
          <dl>
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  'flex items-center justify-between py-2.5 text-[15px]',
                  i > 0 && 'border-t border-hairline',
                )}
              >
                <dt className="text-slate">{row.label}</dt>
                <dd className="nums font-semibold text-navy">{row.value}</dd>
              </div>
            ))}
          </dl>

          {total && (
            <div className="mt-1 flex items-center justify-between border-t border-hairline-strong pt-3">
              <span className="t-micro text-muted">{total.label}</span>
              <span className="nums text-[22px] font-bold text-navy">{total.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
