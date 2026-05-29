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
import { ChatBubble as KinBubble, ChoiceChip, Button } from '@/components/ui'
import { KinLogo } from '@/components/ui/KinLogo'
import { IconSparkle } from '@/components/ui/icons'

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

interface LegacyClientProfile {
  lifeStage: 'single' | 'married_no_kids' | 'married_with_kids' | 'parent_caregiver'
  incomeBand: 'lt_5l' | '5_10l' | '10_20l' | '20_40l' | 'gt_40l'
  dependantsCount: number
  monthlyObligationsBand: 'none' | 'lt_15k' | '15_40k' | '40_80k' | 'gt_80k'
  hasEmployerMediclaim: boolean
  hasPersonalHealth: boolean
  hasTermLife: boolean
  hasEndowment: boolean
  cityTier: 'T1' | 'T2' | 'T3'
  occupation: 'salaried_pf' | 'salaried_no_pf' | 'self_employed' | 'govt'
  edliEligible: boolean
  actualAnnualIncome?: number
  actualMonthlyObligations?: number
  actualPersonalLifeCover?: number
  actualEmployerGroupTerm?: number
  actualPersonalHealthCover?: number
  actualEmployerMediclaim?: number
  actualCiCover?: number
  actualIncomeProtectionCover?: number
}

interface CompleteResponse {
  userProfileId: string
  fieldsCollected: string[]
  estimatedFields: string[]
  unknownFields: string[]
  groupBCount: number
  legacyProfile: LegacyClientProfile
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
        // Legacy UserProfile shape: every downstream page (/score, /recommend,
        // /discover, lifecycle, streak, connect) reads this key and computes
        // scores client-side. Must be written or the pages render their empty
        // state.
        sessionStorage.setItem(
          'kin_diagnostic_profile',
          JSON.stringify(res.legacyProfile),
        )
        // Confidence sidecar for the ⓘ disclosure icons on the Score screen.
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
    <div className="flex min-h-[calc(100vh-60px)] flex-col bg-sand">
      {/* Top strip: Back · progress · Skip (archetype B) */}
      <div className="sticky top-0 z-40 shrink-0 bg-sand/85 px-5 pb-2 pt-3 backdrop-blur-md backdrop-saturate-150">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="touch-target -ml-2 rounded-pill text-navy"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="t-micro text-muted">{Math.round(progressFraction * 100)}% complete</span>
          <button
            onClick={onSkip}
            disabled={isAwaitingAgent || isBooting}
            className="t-micro touch-target -mr-2 rounded-pill text-muted disabled:opacity-40"
          >
            Skip
          </button>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-pill bg-sand-deep">
          <div
            className="h-full rounded-pill bg-teal transition-all duration-slow ease-out"
            style={{ width: `${progressFraction * 100}%` }}
            aria-label={`Diagnostic progress ${Math.round(progressFraction * 100)} percent`}
          />
        </div>
      </div>

      {/* Chat transcript */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-2">
        {isBooting && <TypingBubble />}
        {messages.map(msg =>
          msg.role === 'user' ? (
            <KinBubble key={msg.id} from="user">{msg.text}</KinBubble>
          ) : (
            <AssistantRow key={msg.id}>{msg.text}</AssistantRow>
          ),
        )}
        {isAwaitingAgent && <TypingBubble />}

        {/* Quick-select choice chips, docked under the question */}
        {!isAwaitingAgent && chips.length > 0 && !isCompleting && (
          <div className="flex flex-wrap gap-2 pl-9 pt-1">
            {chips.map(chip => (
              <ChoiceChip key={chip} onClick={() => onChipTap(chip)}>
                {chip}
              </ChoiceChip>
            ))}
          </div>
        )}

        {/* Completion animation */}
        {isCompleting && <CompletionPanel />}

        {/* Error state */}
        {errorState && !isCompleting && (
          <div className="space-y-2 rounded-md border border-coral/30 bg-[rgba(232,93,90,0.08)] p-4 text-[13px] text-[#9F2D2A]">
            <p>I had trouble processing that. Can you try again?</p>
            <button onClick={onRetry} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      {!isCompleting && (
        <div className="shrink-0 border-t border-hairline bg-surface px-4 pb-4 pt-3 safe-bottom">
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
              placeholder="Type your answer…"
              rows={1}
              disabled={isAwaitingAgent || isBooting}
              className="flex-1 resize-none rounded-md border-[1.5px] border-hairline-strong bg-surface px-4 py-3.5 text-[15px] text-slate placeholder:text-muted focus:border-teal focus:outline-none disabled:opacity-50"
            />
            <Button
              size="md"
              onClick={onSend}
              disabled={!draft.trim() || isAwaitingAgent || isBooting}
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

/** KIN assistant avatar — Locked mark as a quiet watermark on navy (§03). */
function Avatar() {
  return (
    <div
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-navy"
      aria-label="KIN assistant"
    >
      <KinLogo wordmark={false} size={16} tone="sand" />
    </div>
  )
}

/** Assistant row = avatar + system bubble (left). */
function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <KinBubble from="system">{children}</KinBubble>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex animate-fade-in items-start gap-2">
      <Avatar />
      <div className="rounded-[18px_18px_18px_4px] border border-hairline bg-surface px-[18px] py-3.5">
        <div className="flex h-4 items-center gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-pill bg-muted"
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
    <div className="space-y-2 rounded-md border border-hairline bg-surface p-5 text-center shadow-card animate-fade-in">
      <IconSparkle size={32} className="mx-auto text-teal-deep" />
      <p className="t-h3 text-navy">Calculating your Protection Score…</p>
      <p className="t-body-sm text-muted">Hold on — almost there.</p>
    </div>
  )
}

function makeId(): string {
  return Math.random().toString(36).slice(2)
}
