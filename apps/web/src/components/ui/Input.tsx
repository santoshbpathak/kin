import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Input — Brand Guidelines §08.
 * 56h · radius md · white surface · 1.5px hairline-strong border that turns
 * Teal on focus. Label sits above (uppercase caption, muted); helper below.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-[56px] w-full rounded-md border-[1.5px] border-hairline-strong bg-surface px-4 text-[15px] text-slate',
          'placeholder:text-muted focus:border-teal focus:outline-none',
          className,
        )}
        {...props}
      />
      {helper && <p className="text-[12px] text-muted">{helper}</p>}
    </div>
  )
})
