import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * Nav header — Brand Guidelines §08.
 * 56h, sand background with a frosted blur, centred h3 Navy title, optional
 * back affordance (left) and action slot (right). Sticky to the top.
 */
interface NavHeaderProps {
  title?: string
  /** Show a back chevron on the left (defaults to history back). */
  onBack?: () => void
  showBack?: boolean
  /** Right-aligned action (icon button, link, etc.). */
  action?: ReactNode
  className?: string
}

export function NavHeader({ title, onBack, showBack = true, action, className }: NavHeaderProps) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate(-1))

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-5',
        'bg-sand/85 backdrop-blur-md backdrop-saturate-150',
        className,
      )}
    >
      <div className="flex w-10 justify-start">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="touch-target -ml-2 rounded-pill text-navy"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {title && <h1 className="t-h3 truncate text-navy">{title}</h1>}

      <div className="flex w-10 justify-end">{action}</div>
    </header>
  )
}
