import { cn } from '@/lib/cn'

/**
 * Privacy line — UX Law 03 (privacy visible by design).
 * A quiet, centred reassurance that belongs on Entry and Score screens.
 */
export function PrivacyLine({
  children = 'Anonymous until you choose to save your results',
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-center text-[12px] text-muted', className)}>{children}</p>
  )
}
