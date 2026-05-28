/**
 * DiagnosticChat — KIN's GPT-4o powered conversational intake UI
 * (Module A, PRD v1.4 §1.9).
 *
 * Replaces the legacy 7-question DiagnosticFlow. Responsibilities:
 *   1. Open a conversation via POST /diagnostic/start.
 *   2. Render chat bubbles (user right, agent left + KIN avatar).
 *   3. Surface 3-6 quick-select chips per agent turn; tapping a chip
 *      sends it as the user message and the chips disappear.
 *   4. Free-text input pinned to bottom (Enter to send).
 *   5. "Skip this question" link below the input — sends a sentinel
 *      "skip" message to the backend.
 *   6. Subtle progress bar at the top driven by Group A completion %.
 *   7. Typing indicator while a turn is in-flight.
 *   8. Graceful error state with a retry button on API failure.
 *   9. On isComplete: short "Calculating your Protection Score..."
 *      animation, then call POST /diagnostic/complete and navigate to
 *      /score with the estimated/unknown field lists in sessionStorage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/lib/apiClient'

type Role = 'user' | 'assistant'

interface ChatBubble {
  id: string
  role: Role
  text: string
}

interface AgentTurnResponse {
  conversationId: string
  message: string
  quickSelectOptions: string[]
  isComplete: boolean
  progressPercent: number
  collectedFieldCount: number
}

interface CompleteResponse {
  userProfileId: string
  fieldsCollected: string[]
  estimatedFields: string[]
  unknownFields: string[]
  groupBCount: number
}

const SKIP_MESSAGE = "I'd like to skip this question."
const QUICK_SELECT_TYPE_FREE = "I'll type it"

export function DiagnosticChat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatBubble[]>([])
  const [chips, setChips] = useState<string[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isAwaitingAgent, setIsAwaitingAgent] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [errorState, setErrorState] = useState<null | { lastUserMessage: string | null }>(null)
  const [draft, setDraft] = useState('')

  const scrollRef = useRef<HTMLDivElement | null>(null)

  // ── Auto-scroll on new message ───────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isAwaitingAgent, isCompleting])

  // ── Open conversation on mount ────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiRequest<AgentTurnResponse>('/diagnostic/start', {
          method: 'POST',
          body: {},
        })
        if (cancelled) return
        setConversationId(res.conversationId)
        setMessages([{ id: makeId(), role: 'assistant', text: res.message }])
        setChips(res.quickSelectOptions ?? [])
        setProgress(res.progressPercent)
        setIsBooting(false)
      } catch (err) {
        if (cancelled) return
        setIsBooting(false)
        setErrorState({ lastUserMessage: null })
        console.error('DiagnosticChat start failed', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Send a user turn ──────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !text.trim()) return
      const cleanText = text.trim()

      setMessages(prev => [...prev, { id: makeId(), role: 'user', text: cleanText }])
      setChips([])
      setIsAwaitingAgent(true)
      setErrorState(null)

      try {
        const res = await apiRequest<AgentTurnResponse>('/diagnostic/message', {
          method: 'POST',
          body: { conversationId, message: cleanText },
        })
        setMessages(prev => [...prev, { id: makeId(), role: 'assistant', text: res.message }])
        setChips(res.quickSelectOptions ?? [])
        setProgress(res.progressPercent)
        if (res.isComplete) {
          void finalise()
        } else {
          setIsAwaitingAgent(false)
        }
      } catch (err) {
        setIsAwaitingAgent(false)
        setErrorState({ lastUserMessage: cleanText })
        console.error('DiagnosticChat message failed', err)
      }
    },
    // finalise is defined below; safe because the callback is invoked async
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId],
  )

  // ── Finalise: extract + map profile, then navigate to /score ──────
  const finalise = useCallback(async () => {
    if (!conversationId) return
    setIsCompleting(true)
    try {
      const res = await apiRequest<CompleteResponse>('/diagnostic/complete', {
        method: 'POST',
        body: { conversationId },
      })
      try {
        // Hand the disclosure lists to the Score screen so it can show
        // the small ⓘ icon next to estimated/unknown sub-scores.
        sessionStorage.setItem(
          'kin_diagnostic_confidence',
          JSON.stringify({
            estimatedFields: res.estimatedFields,
            unknownFields: res.unknownFields,
            userProfileId: res.userProfileId,
          }),
        )
      } catch {
        // sessionStorage may be unavailable in private mode — non-fatal
      }
      navigate('/score')
    } catch (err) {
      setIsCompleting(false)
      setErrorState({ lastUserMessage: null })
      console.error('DiagnosticChat complete failed', err)
    }
  }, [conversationId, navigate])

  // ── Handlers ──────────────────────────────────────────────────────
  const onChipTap = (chip: string) => {
    if (chip === QUICK_SELECT_TYPE_FREE) {
      // Just clear chips and let the user use the input field
      setChips([])
      return
    }
    void sendMessage(chip)
  }

  const onSend = () => {
    if (!draft.trim()) return
    void sendMessage(draft)
    setDraft('')
  }

  const onSkip = () => {
    void sendMessage(SKIP_MESSAGE)
  }

  const onRetry = () => {
    const last = errorState?.lastUserMessage
    setErrorState(null)
    if (last) void sendMessage(last)
    else window.location.reload()
  }

  // ── Render ────────────────────────────────────────────────────────
  const progressFraction = useMemo(() => Math.min(100, Math.max(0, progress)) / 100, [progress])

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      {/* Top progress bar */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progressFraction * 100}%`,
              backgroundColor: 'var(--color-primary)',
            }}
            aria-label={`Diagnostic progress ${Math.round(progressFraction * 100)} percent`}
          />
        </div>
      </div>

      {/* Chat transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
        {isBooting && <TypingBubble />}
        {messages.map(msg => (
          <Bubble key={msg.id} role={msg.role}>{msg.text}</Bubble>
        ))}
        {isAwaitingAgent && <TypingBubble />}

        {/* Quick-select chips */}
        {!isAwaitingAgent && chips.length > 0 && !isCompleting && (
          <div className="flex flex-wrap gap-2 pt-1 pl-9">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => onChipTap(chip)}
                className="text-sm px-3 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Completion animation */}
        {isCompleting && <CompletionPanel />}

        {/* Error state */}
        {errorState && !isCompleting && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 space-y-2">
            <p>I had trouble processing that. Can you try again?</p>
            <button
              onClick={onRetry}
              className="text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      {!isCompleting && (
        <div className="border-t border-gray-100 bg-white px-4 pt-3 pb-4 shrink-0">
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
              placeholder="Type your answer..."
              rows={1}
              disabled={isAwaitingAgent || isBooting}
              className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50"
              style={{
                // Tailwind ring-color can't be set via style; we accept default
                // focus ring colour.
              }}
            />
            <button
              onClick={onSend}
              disabled={!draft.trim() || isAwaitingAgent || isBooting}
              className="rounded-2xl px-4 py-3 text-white text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Send
            </button>
          </div>
          <button
            onClick={onSkip}
            disabled={isAwaitingAgent || isBooting}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            Skip this question →
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

function Bubble({ role, children }: { role: Role; children: React.ReactNode }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-white"
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
      <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm bg-gray-50 text-gray-800 border border-gray-100">
        {children}
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
      style={{ backgroundColor: 'var(--color-primary)' }}
      aria-label="KIN assistant"
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

function CompletionPanel() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center space-y-2">
      <div className="text-2xl">✨</div>
      <p className="text-sm font-semibold text-gray-800">
        Calculating your Protection Score...
      </p>
      <p className="text-xs text-gray-500">Hold on — almost there.</p>
    </div>
  )
}

function makeId(): string {
  return Math.random().toString(36).slice(2)
}
