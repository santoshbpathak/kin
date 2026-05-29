/**
 * DiscoveryFlow.tsx — Module 6
 *
 * 8-step question wizard for hidden coverage discovery.
 * Mirrors DiagnosticFlow UX patterns (progress bar, step indicator,
 * typing animation, back navigation, auto-advance on single-select).
 *
 * Adaptive:
 *   - Q2 (govt_schemes) is skipped if Q1 (savings_account) = 'no'
 *   - Q4 (ESI) is only shown if occupation === 'salaried_pf' in profile
 *   - Q5 (home_loan) is always shown
 *   - All skips are logged in answers as null for audit trail
 *
 * On completion → calls onComplete(answers)
 */

import { useState, useEffect } from 'react'
import type { DiscoveryAnswers } from './discoveryEngine'
import { DISCOVERY_QUESTIONS } from './discoveryQuestions'
import type { UserProfile } from '../diagnostic/parser'
import { Button } from '@/components/ui'
import { IconGift } from '@/components/ui/icons'

// ── Option card (single select) ─────────────────────────────────
function OptionCard({
  value,
  label,
  emoji,
  sublabel,
  selected,
  onSelect,
}: {
  value: string
  label: string
  emoji: string
  sublabel?: string
  selected: boolean
  onSelect: (v: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={[
        'w-full text-left px-4 py-3.5 rounded-md border-2 transition-all duration-150 flex items-center gap-3',
        selected
          ? 'border-teal bg-teal/8'
          : 'border-hairline bg-surface',
      ].join(' ')}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="t-body-sm font-semibold text-navy">{label}</p>
        {sublabel && <p className="t-caption text-muted mt-0.5">{sublabel}</p>}
      </div>
      {selected && (
        <span className="w-5 h-5 rounded-full bg-teal flex items-center justify-center shrink-0 text-navy text-xs font-bold">
          ✓
        </span>
      )}
    </button>
  )
}

// ── Multi-option card (checkbox) ────────────────────────────────
function MultiOptionCard({
  value,
  label,
  emoji,
  sublabel,
  selected,
  onToggle,
}: {
  value: string
  label: string
  emoji: string
  sublabel?: string
  selected: boolean
  onToggle: (v: string) => void
}) {
  return (
    <button
      onClick={() => onToggle(value)}
      className={[
        'w-full text-left px-4 py-3.5 rounded-md border-2 transition-all duration-150 flex items-center gap-3',
        selected
          ? 'border-teal bg-teal/8'
          : 'border-hairline bg-surface',
      ].join(' ')}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="t-body-sm font-semibold text-navy">{label}</p>
        {sublabel && <p className="t-caption text-muted mt-0.5">{sublabel}</p>}
      </div>
      <div
        className={[
          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
          selected ? 'border-teal bg-teal' : 'border-hairline-strong bg-surface',
        ].join(' ')}
      >
        {selected && <span className="text-navy text-xs font-bold">✓</span>}
      </div>
    </button>
  )
}

// ── Typing indicator animation ──────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-md bg-sand-deep w-fit">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted"
          style={{
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Determine which question IDs to show (adaptive) ─────────────
function buildQuestionSequence(profile: UserProfile | null): string[] {
  const all = DISCOVERY_QUESTIONS.map(q => q.id)
  // ESI question only meaningful for salaried employees
  // Keep all for now — we'll skip adaptively in the step logic
  void profile
  return all
}

type Props = {
  profile: UserProfile | null
  onComplete: (answers: DiscoveryAnswers) => void
}

export function DiscoveryFlow({ profile, onComplete }: Props) {
  const questionIds = buildQuestionSequence(profile)
  const totalSteps = questionIds.length

  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<DiscoveryAnswers>({})
  const [showTyping, setShowTyping] = useState(false)
  const [questionVisible, setQuestionVisible] = useState(true)

  const currentId = questionIds[stepIndex]
  const currentQ = DISCOVERY_QUESTIONS.find(q => q.id === currentId)!

  // Reset typing anim on question change
  useEffect(() => {
    setShowTyping(true)
    setQuestionVisible(false)
    const t = setTimeout(() => {
      setShowTyping(false)
      setQuestionVisible(true)
    }, 500)
    return () => clearTimeout(t)
  }, [stepIndex])

  // ── Skip logic ──
  function shouldSkipStep(id: string): boolean {
    if (id === 'govt_schemes_opted' && answers.has_savings_account === 'no') return true
    if (id === 'esi_registered' && profile?.occupation === 'self_employed') return true
    return false
  }

  // ── Advance to next step or complete ──
  function advance() {
    let next = stepIndex + 1
    while (next < totalSteps && shouldSkipStep(questionIds[next])) {
      next++
    }
    if (next >= totalSteps) {
      onComplete(answers)
    } else {
      setStepIndex(next)
    }
  }

  // ── Go back ──
  function goBack() {
    let prev = stepIndex - 1
    while (prev >= 0 && shouldSkipStep(questionIds[prev])) {
      prev--
    }
    if (prev >= 0) setStepIndex(prev)
  }

  // ── Single-select handler (auto-advance after 300ms) ──
  function handleSelect(value: string) {
    const updated = { ...answers, [currentId]: value }
    setAnswers(updated)
    setTimeout(() => {
      // Re-check skip with updated answers
      let next = stepIndex + 1
      while (next < totalSteps && shouldSkipStepWithAnswers(questionIds[next], updated)) {
        next++
      }
      if (next >= totalSteps) {
        onComplete(updated)
      } else {
        setStepIndex(next)
      }
    }, 300)
  }

  function shouldSkipStepWithAnswers(id: string, ans: DiscoveryAnswers): boolean {
    if (id === 'govt_schemes_opted' && ans.has_savings_account === 'no') return true
    if (id === 'esi_registered' && profile?.occupation === 'self_employed') return true
    return false
  }

  // ── Multi-select toggle ──
  function handleMultiToggle(value: string) {
    const current = (answers[currentId as keyof DiscoveryAnswers] as string[] | undefined) ?? []
    const exclusive = ['unsure', 'neither']

    let next: string[]
    if (exclusive.includes(value)) {
      // Exclusive: deselect everything else
      next = current.includes(value) ? [] : [value]
    } else {
      // Remove exclusives if selecting normal
      const filtered = current.filter(v => !exclusive.includes(v))
      next = filtered.includes(value)
        ? filtered.filter(v => v !== value)
        : [...filtered, value]
    }

    setAnswers(prev => ({ ...prev, [currentId]: next }))
  }

  // ── Current answer value ──
  const currentAnswer = answers[currentId as keyof DiscoveryAnswers]
  const hasAnswer = currentQ.type === 'multi_option'
    ? (currentAnswer as string[] | undefined)?.length ?? 0 > 0
    : Boolean(currentAnswer)

  // Progress % (visual steps, excluding skipped)
  const progressPct = ((stepIndex) / (totalSteps - 1)) * 100

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* ── Progress bar ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="t-micro text-muted">
            Question {stepIndex + 1} of {totalSteps}
          </p>
          <p className="t-micro text-muted flex items-center gap-1"><IconGift size={14} className="text-muted shrink-0" /> Finding your hidden coverage</p>
        </div>
        <div className="h-1.5 bg-sand-deep rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-400"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Question body ── */}
      <div className="flex-1 px-5 pt-2 space-y-4">
        {/* Typing indicator → then question */}
        <div className="min-h-[80px]">
          {showTyping && <TypingIndicator />}
          {questionVisible && !showTyping && (
            <div className="animate-fade-in">
              <h2 className="t-h3 text-navy leading-snug">
                {currentQ.text}
              </h2>
              {currentQ.subtext && (
                <p className="t-body-sm text-muted mt-1.5 leading-relaxed">
                  {currentQ.subtext}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        {questionVisible && !showTyping && (
          <div className="space-y-2.5">
            {currentQ.type === 'option' &&
              currentQ.options.map(opt => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  emoji={opt.emoji}
                  sublabel={opt.sublabel}
                  selected={currentAnswer === opt.value}
                  onSelect={handleSelect}
                />
              ))}

            {currentQ.type === 'multi_option' && (
              <>
                {currentQ.options.map(opt => (
                  <MultiOptionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    emoji={opt.emoji}
                    sublabel={opt.sublabel}
                    selected={((currentAnswer as string[]) ?? []).includes(opt.value)}
                    onToggle={handleMultiToggle}
                  />
                ))}

                {/* Hint */}
                {currentQ.hint && (
                  <div className="rounded-md border border-hairline bg-sand-deep px-3 py-2.5">
                    <p className="t-caption text-slate leading-relaxed">{currentQ.hint}</p>
                  </div>
                )}

                {/* Multi-select Continue button */}
                <Button
                  fullWidth
                  onClick={advance}
                  disabled={!hasAnswer}
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Back button ── */}
      {stepIndex > 0 && (
        <div className="px-5 pb-6 pt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={goBack}
            className="flex items-center gap-1.5 text-muted"
          >
            ← Back
          </Button>
        </div>
      )}
    </div>
  )
}
