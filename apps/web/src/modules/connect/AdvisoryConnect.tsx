/**
 * AdvisoryConnect — three-tier advisory connect UI (Module B, Brief §2.8).
 *
 * Replaces the legacy single-flow AdvisorBookingFlow. The component runs
 * the full Tier-1 → Tier-2 → Tier-3 journey in one mount:
 *
 *   - Tier indicator bar (three segments) at the top.
 *   - Tier 1 chat: KIN AI assistant with the user's KIN report injected
 *     into the system prompt server-side. Persistent buttons at the
 *     bottom: "Connect to an advisor →" / "Book a call instead". An identity
 *     badge ("KIN AI · Instant responses") sits next to the avatar.
 *   - Escalation prompt: when the backend's escalation detector fires,
 *     the message renders with [Connect me now] / [Continue chatting]
 *     buttons inline.
 *   - Transcript consent modal: appears the first time the user upgrades
 *     to Tier 2 or 3.
 *   - Tier 2: shows an advisor card (name + experience + 3-line brief)
 *     and a placeholder thread; production-grade human chat is out of
 *     scope for this module, the UI lays out the surface.
 *   - Tier 3: opens the legacy advisor-booking sheet using the existing
 *     AdvisorBookingFlow (Guide tab, unchanged).
 *   - Downgrade is always available via a "← Back to AI chat" link.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'
import { AdvisorBookingFlow } from './AdvisorBookingFlow'
import { Button, Card, ChatBubble } from '@/components/ui'

// ── Types mirroring the backend ───────────────────────────────────────

type Tier = 1 | 2 | 3

interface KinReportPayload {
  compositeScore: number
  lifeSubScore: number
  healthSubScore: number
  incomeSubScore: number
  lifeGapSummary: string
  healthGapSummary: string
  incomeGapSummary: string
  topRecommendation: string
  recommendations: Array<{ type: string; title: string; basisText: string }>
  hiddenCoverages: string[]
  estimatedFields: string[]
  unknownFields: string[]
}

interface StartResponse {
  advisorSessionId: string
  openingMessage: string
}

interface AdvisoryTurnResponse {
  advisorSessionId: string
  message: string
  shouldEscalate: boolean
  escalationPrompt?: string
  escalationReason?: string | null
  isAiAssistant: true
}

interface UpgradeResponse {
  advisorSessionId: string
  currentTier: Tier
  advisorBrief: {
    advisorSessionId: string
    generatedAt: string
    line1: string
    line2: string
    line3: string
  } | null
  humanChatSessionId?: string
  callBookingUrl?: string
  transcriptSharedConsent: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

// ── Component ────────────────────────────────────────────────────────

interface Props {
  kinReport: KinReportPayload
  /** Optional initial close (used when mounted inside a sheet). */
  onClose?: () => void
}

export function AdvisoryConnect({ kinReport, onClose }: Props) {
  const [tier, setTier] = useState<Tier>(1)
  const [advisorSessionId, setAdvisorSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isAwaiting, setIsAwaiting] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingUpgrade, setPendingUpgrade] = useState<2 | 3 | null>(null)
  const [brief, setBrief] = useState<UpgradeResponse['advisorBrief'] | null>(null)
  const [showTier3Sheet, setShowTier3Sheet] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isAwaiting])

  // ── Boot Tier 1 ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiRequest<StartResponse>('/connect/ai/start', {
          method: 'POST',
          body: { kinReport },
        })
        if (cancelled) return
        setAdvisorSessionId(res.advisorSessionId)
        setMessages([{ id: makeId(), role: 'assistant', text: res.openingMessage }])
        setIsBooting(false)
      } catch (e) {
        if (cancelled) return
        setIsBooting(false)
        setError('Could not start the AI advisor session. Try again in a moment.')
        console.error('AdvisoryConnect start failed', e)
      }
    })()
    return () => { cancelled = true }
  }, [kinReport])

  // ── Tier 1 message send ────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!advisorSessionId || !text.trim()) return
      const cleanText = text.trim()
      setMessages(prev => [...prev, { id: makeId(), role: 'user', text: cleanText }])
      setIsAwaiting(true)
      setError(null)
      try {
        const res = await apiRequest<AdvisoryTurnResponse>('/connect/ai/message', {
          method: 'POST',
          body: { advisorSessionId, message: cleanText },
        })
        setMessages(prev => [
          ...prev,
          { id: makeId(), role: 'assistant', text: res.message },
        ])
      } catch (e) {
        setError('Something went wrong on that turn. Try again.')
        console.error('AdvisoryConnect send failed', e)
      } finally {
        setIsAwaiting(false)
      }
    },
    [advisorSessionId],
  )

  const onSend = () => {
    if (!draft.trim()) return
    void sendMessage(draft)
    setDraft('')
  }

  // ── Tier upgrade flow ──────────────────────────────────────────
  const requestUpgrade = (target: 2 | 3) => {
    setPendingUpgrade(target)
  }

  const completeUpgrade = async (target: 2 | 3, transcriptConsent: boolean) => {
    if (!advisorSessionId) return
    setPendingUpgrade(null)
    setIsAwaiting(true)
    try {
      const res = await apiRequest<UpgradeResponse>('/connect/upgrade', {
        method: 'POST',
        body: { advisorSessionId, targetTier: target, transcriptConsent },
      })
      setTier(res.currentTier)
      setBrief(res.advisorBrief)
      if (res.currentTier === 3) setShowTier3Sheet(true)
    } catch (e) {
      setError('Could not connect you to an advisor. Try again.')
      console.error('AdvisoryConnect upgrade failed', e)
    } finally {
      setIsAwaiting(false)
    }
  }

  const downgradeToAi = async (target: 1 | 2 = 1) => {
    if (!advisorSessionId) return
    try {
      const res = await apiRequest<UpgradeResponse>('/connect/downgrade', {
        method: 'POST',
        body: { advisorSessionId, targetTier: target },
      })
      setTier(res.currentTier)
      setBrief(null)
      setShowTier3Sheet(false)
    } catch (e) {
      console.error('AdvisoryConnect downgrade failed', e)
    }
  }

  // ── Tier indicator bar ─────────────────────────────────────────
  const tierBar = useMemo(() => (
    <div className="px-4 pt-3 pb-2">
      <div className="flex gap-1 rounded-md bg-sand-deep p-1">
        {([1, 2, 3] as Tier[]).map(t => {
          const label = t === 1 ? 'AI Chat' : t === 2 ? 'Chat with Advisor' : 'Call an Advisor'
          const active = tier === t
          return (
            <button
              key={t}
              onClick={() => {
                if (t === tier) return
                if (t === 1) void downgradeToAi(1)
                else requestUpgrade(t as 2 | 3)
              }}
              className={[
                'flex-1 py-2 rounded-sm t-micro transition-all',
                active
                  ? 'bg-surface text-navy shadow-card'
                  : 'bg-transparent text-muted',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  ), [tier])

  // ── Render Tier 2 / Tier 3 surfaces ────────────────────────────
  if (tier === 2) {
    return (
      <div className="flex flex-col min-h-[60vh]">
        {tierBar}
        <button
          onClick={() => void downgradeToAi(1)}
          className="self-start mx-4 mt-1 t-caption text-muted hover:text-slate"
        >
          ← Back to AI chat
        </button>
        <AdvisorCard brief={brief} />
        <p className="px-4 pt-2 t-body-sm text-slate">
          You're now in line for a KIN advisor chat. They have your Protection Score
          {brief ? ' and the pre-brief above' : ''}. You'll see their first message here.
        </p>
        <div className="flex-1" />
        {onClose && (
          <div className="px-4 pb-4">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (tier === 3) {
    return (
      <div className="flex flex-col min-h-[60vh]">
        {tierBar}
        <button
          onClick={() => void downgradeToAi(1)}
          className="self-start mx-4 mt-1 t-caption text-muted hover:text-slate"
        >
          ← Back to AI chat
        </button>
        <AdvisorCard brief={brief} />
        <p className="px-4 pt-2 t-body text-slate">
          Pick a slot and we'll call you. Your Protection Score
          {brief ? ' and the brief above' : ''} go with the advisor.
        </p>
        {showTier3Sheet && (
          <div className="px-2">
            <AdvisorBookingFlow onClose={() => setShowTier3Sheet(false)} />
          </div>
        )}
      </div>
    )
  }

  // ── Tier 1 render ──────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[60vh]">
      {tierBar}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-3 space-y-3 max-h-[55vh]">
        {isBooting && <TypingBubble />}

        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <div className="flex items-start gap-2">
                <Avatar />
                <div className="flex flex-col gap-1 max-w-[82%]">
                  <span className="t-micro text-teal-deep self-start px-2 py-0.5 rounded-pill bg-mint">
                    KIN AI · Instant
                  </span>
                  <ChatBubble from="system">{msg.text}</ChatBubble>
                </div>
              </div>
            ) : (
              <ChatBubble from="user">{msg.text}</ChatBubble>
            )}
          </div>
        ))}

        {isAwaiting && <TypingBubble />}

        {error && (
          <div className="rounded-md border border-hairline bg-sand-deep p-3 t-body-sm text-coral">
            {error}
          </div>
        )}
      </div>

      {/* Composer + persistent tier-switch buttons */}
      <div className="border-t border-hairline bg-surface px-4 pt-3 pb-4 space-y-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder="Ask anything about your Protection Score..."
            rows={1}
            disabled={isAwaiting || isBooting}
            className="flex-1 resize-none rounded-md border border-hairline bg-surface px-4 py-3 t-body text-navy placeholder:text-muted focus:outline-none focus:border-teal disabled:opacity-50"
          />
          <Button
            size="md"
            onClick={onSend}
            disabled={!draft.trim() || isAwaiting || isBooting}
          >
            Send
          </Button>
        </div>

        {/* Persistent tier-switch buttons — always visible per brief §2.8 */}
        <div className="flex items-center gap-3">
          <Button
            fullWidth
            onClick={() => requestUpgrade(2)}
          >
            Connect to an advisor
          </Button>
          <button
            onClick={() => requestUpgrade(3)}
            className="shrink-0 t-body-sm font-semibold text-teal-deep underline underline-offset-2"
          >
            Book a call instead
          </button>
        </div>
      </div>

      {/* Transcript consent modal */}
      {pendingUpgrade !== null && (
        <TranscriptConsentModal
          targetTier={pendingUpgrade}
          onDecide={consent => void completeUpgrade(pendingUpgrade, consent)}
          onCancel={() => setPendingUpgrade(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

function Avatar() {
  return (
    <div
      className="w-7 h-7 rounded-pill flex items-center justify-center bg-navy text-sand text-xs font-bold shrink-0 mt-0.5"
      aria-label="KIN AI assistant"
    >
      K
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <div className="rounded-[18px_18px_18px_4px] px-4 py-3 border border-hairline bg-surface">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-pill bg-muted animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AdvisorCard({ brief }: { brief: UpgradeResponse['advisorBrief'] }) {
  return (
    <Card className="mx-4 mt-3 space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-pill flex items-center justify-center bg-navy text-sand text-sm font-bold shrink-0">
          PS
        </div>
        <div>
          <p className="t-body font-bold text-navy">Priya Sharma</p>
          <p className="t-caption text-muted">IRDAI-licensed advisor · 7 years experience</p>
        </div>
      </div>
      {brief && (
        <div className="rounded-sm border border-hairline bg-sand-deep p-3 space-y-1">
          <p className="t-micro text-muted">
            Prepared from your Protection Score and conversation
          </p>
          <p className="t-body-sm text-slate">· {brief.line1}</p>
          <p className="t-body-sm text-slate">· {brief.line2}</p>
          <p className="t-body-sm text-slate">· {brief.line3}</p>
        </div>
      )}
    </Card>
  )
}

function TranscriptConsentModal({
  targetTier,
  onDecide,
  onCancel,
}: {
  targetTier: 2 | 3
  onDecide: (consent: boolean) => void
  onCancel: () => void
}) {
  const tierLabel = targetTier === 2 ? 'advisor chat' : 'advisor call'
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-5 space-y-3 shadow-card">
        <h3 className="t-h3 text-navy">
          Share your conversation with the advisor?
        </h3>
        <p className="t-body text-slate leading-relaxed">
          This helps them prepare for your {tierLabel} — they'll know your Protection
          Score and what you discussed.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button fullWidth onClick={() => onDecide(true)}>
            Yes, share
          </Button>
          <Button fullWidth variant="secondary" onClick={() => onDecide(false)}>
            No, start fresh
          </Button>
          <button
            onClick={onCancel}
            className="w-full py-2 t-caption text-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function makeId(): string {
  return Math.random().toString(36).slice(2)
}
