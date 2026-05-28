/**
 * AdvisoryConnect — three-tier advisory connect UI (Module B, Brief §2.8).
 *
 * Replaces the legacy single-flow AdvisorBookingFlow. The component runs
 * the full Tier-1 → Tier-2 → Tier-3 journey in one mount:
 *
 *   - Tier indicator bar (three segments) at the top.
 *   - Tier 1 chat: KIN AI assistant with the user's KIN report injected
 *     into the system prompt server-side. Persistent buttons at the
 *     bottom: "Talk to a person →" / "Book a call instead". An identity
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

interface ChatBubble {
  id: string
  role: 'user' | 'assistant'
  text: string
  escalation?: { prompt: string; resolved?: 'connect' | 'continue' }
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
  const [messages, setMessages] = useState<ChatBubble[]>([])
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
          {
            id: makeId(),
            role: 'assistant',
            text: res.message,
            escalation: res.shouldEscalate && res.escalationPrompt
              ? { prompt: res.escalationPrompt }
              : undefined,
          },
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

  // ── Escalation inline buttons ──────────────────────────────────
  const resolveEscalation = (bubbleId: string, choice: 'connect' | 'continue') => {
    setMessages(prev =>
      prev.map(m =>
        m.id === bubbleId && m.escalation
          ? { ...m, escalation: { ...m.escalation, resolved: choice } }
          : m,
      ),
    )
    if (choice === 'connect') requestUpgrade(2)
  }

  // ── Tier indicator bar ─────────────────────────────────────────
  const tierBar = useMemo(() => (
    <div className="px-4 pt-3 pb-2">
      <div className="flex gap-1 rounded-2xl bg-gray-100 p-1">
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
              className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={{
                backgroundColor: active ? 'white' : 'transparent',
                color: active ? 'var(--color-primary)' : '#9CA3AF',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
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
          className="self-start mx-4 mt-1 text-xs text-gray-400 hover:text-gray-600"
        >
          ← Back to AI chat
        </button>
        <AdvisorCard brief={brief} />
        <div className="px-4 pt-2 text-xs text-gray-500">
          You're now in line for a KIN advisor chat. They have your KIN report
          {brief ? ' and the pre-brief above' : ''}. You'll see their first message here.
        </div>
        <div className="flex-1" />
        {onClose && (
          <div className="px-4 pb-4">
            <button onClick={onClose} className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold">
              Close
            </button>
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
          className="self-start mx-4 mt-1 text-xs text-gray-400 hover:text-gray-600"
        >
          ← Back to AI chat
        </button>
        <AdvisorCard brief={brief} />
        <div className="px-4 pt-2 text-sm text-gray-600">
          Pick a slot and we'll call you. Your KIN report
          {brief ? ' and the brief above' : ''} go with the advisor.
        </div>
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
            <Bubble role={msg.role}>
              {msg.text}
            </Bubble>
            {msg.escalation && (
              <EscalationActions
                resolved={msg.escalation.resolved}
                onChoose={choice => resolveEscalation(msg.id, choice)}
              />
            )}
          </div>
        ))}

        {isAwaiting && <TypingBubble />}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Composer + persistent tier-switch buttons */}
      <div className="border-t border-gray-100 bg-white px-4 pt-3 pb-4 space-y-3 shrink-0">
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
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={!draft.trim() || isAwaiting || isBooting}
            className="rounded-2xl px-4 py-3 text-white text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Send
          </button>
        </div>

        {/* Persistent tier-switch buttons — always visible per brief §2.8 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => requestUpgrade(2)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Talk to a person →
          </button>
          <button
            onClick={() => requestUpgrade(3)}
            className="text-xs font-semibold underline"
            style={{ color: 'var(--color-primary)' }}
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

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-white whitespace-pre-wrap"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <div className="flex flex-col gap-1 max-w-[85%]">
        <span
          className="text-[9px] font-bold uppercase tracking-wider self-start px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, white)',
            color: 'var(--color-primary)',
          }}
        >
          KIN AI · Instant
        </span>
        <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm bg-gray-50 text-gray-800 border border-gray-100 whitespace-pre-wrap">
          {children}
        </div>
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
      style={{ backgroundColor: 'var(--color-primary)' }}
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
      <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-gray-50 border border-gray-100">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function EscalationActions({
  resolved,
  onChoose,
}: {
  resolved?: 'connect' | 'continue'
  onChoose: (choice: 'connect' | 'continue') => void
}) {
  if (resolved) {
    return (
      <p className="text-[11px] text-gray-400 pl-9 pt-1">
        {resolved === 'connect' ? 'Connecting you...' : "Got it — let's keep chatting."}
      </p>
    )
  }
  return (
    <div className="flex gap-2 pl-9 pt-2">
      <button
        onClick={() => onChoose('connect')}
        className="px-3 py-2 rounded-xl text-xs font-bold text-white"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Connect me now
      </button>
      <button
        onClick={() => onChoose('continue')}
        className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white"
      >
        Continue chatting
      </button>
    </div>
  )
}

function AdvisorCard({ brief }: { brief: UpgradeResponse['advisorBrief'] }) {
  return (
    <div className="mx-4 mt-3 rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          PS
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Priya Sharma</p>
          <p className="text-[11px] text-gray-500">IRDAI-licensed advisor · 7 years experience</p>
        </div>
      </div>
      {brief && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-700 space-y-1">
          <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wide">
            Prepared from your KIN report and conversation
          </p>
          <p>· {brief.line1}</p>
          <p>· {brief.line2}</p>
          <p>· {brief.line3}</p>
        </div>
      )}
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 space-y-3">
        <h3 className="text-base font-bold text-gray-900">
          Share your conversation with the advisor?
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          This helps them prepare for your {tierLabel} — they'll know your Protection
          Score and what you discussed.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => onDecide(true)}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Yes, share
          </button>
          <button
            onClick={() => onDecide(false)}
            className="w-full py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold"
          >
            No, start fresh
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-xs text-gray-400"
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
