/**
 * LifeEventPrompt.tsx — Module 11: Lifecycle Layer
 *
 * Banner/modal shown when a re-score signal is active.
 * Also contains the LifeEventLogger — lets the user record a life change
 * that triggers a re-score recommendation.
 *
 * Shown on: HomePage (banner), SettingsPage (full list)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getRescoreSignal,
  dismissRescoreSignal,
  recordLifeEvent,
  LIFE_EVENT_LABELS,
  LIFE_EVENT_EMOJI,
  type LifeEventType,
} from './lifecycleStore'
import { Button, Card } from '@/components/ui'
import { IconRefresh, IconCheckCircle } from '@/components/ui/icons'

const LIFE_EVENT_TYPES = Object.keys(LIFE_EVENT_LABELS) as LifeEventType[]

// ── Re-score nudge banner (shown on HomePage) ─────────────────
export function RescoreBanner() {
  const navigate = useNavigate()
  const signal = getRescoreSignal()
  const [dismissed, setDismissed] = useState(signal?.dismissed ?? true)

  if (dismissed || !signal || signal.dismissed) return null

  const message =
    signal.reason === 'life_event'
      ? "Something important changed in your life. Your protection score needs a re-check."
      : signal.reason === 'time_elapsed'
      ? "It has been over 90 days since your last check-in. Your score may have changed."
      : "Time to re-check your protection score."

  function handleDismiss() {
    dismissRescoreSignal()
    setDismissed(true)
  }

  return (
    <div className="mx-5 rounded-md border border-hairline bg-surface shadow-card p-4 flex items-start gap-3 animate-fade-in">
      <IconRefresh size={24} className="text-teal-deep shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="t-body-sm font-bold text-navy mb-0.5">Time to re-check your score</p>
        <p className="t-caption text-muted leading-relaxed">{message}</p>
        <div className="flex gap-2 mt-3">
          <Button
            size="md"
            variant="primary"
            onClick={() => navigate('/diagnose')}
          >
            Re-check now
          </Button>
          <Button
            size="md"
            variant="ghost"
            onClick={handleDismiss}
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Life event logger (used in SettingsPage) ──────────────────
type LoggerProps = {
  onRecorded?: () => void
}

export function LifeEventLogger({ onRecorded }: LoggerProps) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<LifeEventType | null>(null)
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit() {
    if (!selected) return
    recordLifeEvent(selected, notes.trim())
    setDone(true)
    onRecorded?.()
  }

  if (done) {
    return (
      <Card className="text-center py-6">
        <div className="mb-2 flex justify-center"><IconCheckCircle size={32} className="text-teal-deep" /></div>
        <p className="t-body font-extrabold text-navy mb-1">Life event recorded</p>
        <p className="t-body-sm text-muted leading-relaxed mb-5">
          Your protection score may have changed. We recommend re-checking your gap map now.
        </p>
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/diagnose')}
        >
          Re-check my score
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="t-micro text-muted mb-3">What changed?</p>
        <div className="grid grid-cols-2 gap-2.5">
          {LIFE_EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className={`flex items-start gap-2 p-3 rounded-md border-[1.5px] text-left transition-colors ${
                selected === type
                  ? 'border-teal bg-mint'
                  : 'border-hairline bg-surface'
              }`}
            >
              <span className="text-lg shrink-0">{LIFE_EVENT_EMOJI[type]}</span>
              <span
                className={`t-body-sm font-semibold leading-snug ${
                  selected === type ? 'text-teal-deep' : 'text-slate'
                }`}
              >
                {LIFE_EVENT_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="animate-fade-in">
          <label className="t-caption font-bold text-slate block mb-1.5">
            Any details? <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Salary increased by ₹8L, took home loan of ₹60L"
            className={`w-full px-3 py-2.5 rounded-md border t-body-sm text-slate placeholder:text-muted outline-none resize-none bg-surface ${
              notes ? 'border-teal' : 'border-hairline'
            }`}
          />
        </div>
      )}

      <Button
        size="lg"
        fullWidth
        onClick={handleSubmit}
        disabled={!selected}
      >
        Record life change
      </Button>

      <p className="t-micro text-muted text-center leading-relaxed">
        Recording a life event triggers a re-score recommendation. Your existing score
        is preserved — the new one replaces it only when you complete the check-in.
      </p>
    </div>
  )
}
