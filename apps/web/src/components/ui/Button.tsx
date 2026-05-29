import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Button — Brand Guidelines §08.
 *  primary   bg Teal · text Navy            (the one action on a screen)
 *  secondary transparent · 1.5px Navy border
 *  ghost     text only · Navy 600
 *  danger    bg Coral · text Sand           (rare, destructive only)
 *
 * Sizes: lg = 56h (default, full-width CTAs) · md = 44h.
 * Pressed state scales to 0.985; focus ring handled globally (§13).
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'lg' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2.5 font-bold transition-transform duration-fast ease-out active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none select-none'

const sizes: Record<Size, string> = {
  lg: 'h-[56px] px-[22px] rounded-md text-[16px] tracking-[-0.01em]',
  md: 'h-[44px] px-[18px] rounded-sm text-[14px] tracking-[-0.01em]',
}

const variants: Record<Variant, string> = {
  primary: 'bg-teal text-navy active:bg-teal-deep',
  secondary: 'bg-transparent text-navy border-[1.5px] border-navy',
  ghost: 'text-navy font-semibold',
  danger: 'bg-coral text-sand',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'lg', fullWidth, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], fullWidth && 'w-full', className)}
      {...props}
    />
  )
})
