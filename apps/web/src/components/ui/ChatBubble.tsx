import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Chat bubbles — Brand Guidelines §08 (chat-first diagnostic, UX Law 06).
 *  system (left)  white surface, slate text, hairline border, pointer bottom-left.
 *  user   (right) navy fill, sand text, pointer bottom-right.
 * Both max-width 82%, fade + rise on entry (§09).
 */
export function ChatBubble({
  from,
  children,
  className,
}: {
  from: 'system' | 'user'
  children: ReactNode
  className?: string
}) {
  const isUser = from === 'user'
  return (
    <div className={cn('flex w-full animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] px-[18px] py-3.5 text-[15px] leading-[22px]',
          isUser
            ? 'rounded-[18px_18px_4px_18px] bg-navy text-sand'
            : 'rounded-[18px_18px_18px_4px] border border-hairline bg-surface text-slate',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
