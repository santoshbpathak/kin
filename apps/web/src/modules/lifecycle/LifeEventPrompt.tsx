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
    <div
      className="mx-5 rounded-2xl p-4 flex items-start gap-3 animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, white) 0%, color-mix(in srgb, var(--color-primary) 4%, white) 100%)',
        border: '1.5px solid color-mix(in srgb, var(--color-primary) 25%, white)',
      }}
    >
      <span className="text-2xl shrink-0">🔄</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-800 mb-0.5">Time to re-check your score</p>
        <p className="text-[11px] text-gray-600 leading-relaxed">{message}</p>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => navigate('/diagnose')}
            className="text-xs font-bold py-1.5 px-3 rounded-xl text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Re-check now →
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl text-gray-500 bg-white border border-gray-200"
          >
            Later
          </button>
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
      <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm font-extrabold text-green-700 mb-1">Life event recorded!</p>
        <p className="text-xs text-green-600 leading-relaxed mb-4">
          Your protection score may have changed. We recommend re-checking your gap map now.
        </p>
        <button
          onClick={() => navigate('/diagnose')}
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Re-check My Score →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-600 mb-3">What changed?</p>
        <div className="grid grid-cols-2 gap-2.5">
          {LIFE_EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className="flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: selected === type ? 'var(--color-primary)' : '#E5E7EB',
                backgroundColor: selected === type
                  ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                  : '#FAFAFA',
              }}
            >
              <span className="text-lg shrink-0">{LIFE_EVENT_EMOJI[type]}</span>
              <span
                className="text-[11px] font-semibold leading-snug"
                style={{ color: selected === type ? 'var(--color-primary)' : '#4B5563' }}
              >
                {LIFE_EVENT_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="animate-fade-in">
          <label className="text-xs font-bold text-gray-600 block mb-1.5">
            Any details? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Salary increased by ₹8L, took home loan of ₹60L"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 placeholder-gray-400 outline-none resize-none"
            style={{ borderColor: notes ? 'var(--color-primary)' : '#E5E7EB' }}
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity"
        style={{
          backgroundColor: 'var(--color-primary)',
          opacity: selected ? 1 : 0.4,
        }}
      >
        Record Life Change →
      </button>

      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        Recording a life event triggers a re-score recommendation. Your existing score
        is preserved — the new one replaces it only when you complete the check-in.
      </p>
    </div>
  )
}
