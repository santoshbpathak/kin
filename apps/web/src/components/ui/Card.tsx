import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Card — Brand Guidelines §08.
 * White surface on the Sand canvas · radius md (14) · 20 padding ·
 * 1px hairline border · soft elevation.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md border border-hairline bg-surface p-5 shadow-card',
        className,
      )}
      {...props}
    />
  )
}
