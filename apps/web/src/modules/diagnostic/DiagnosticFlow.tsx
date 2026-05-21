import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUESTIONS } from './questions'
import { parseAnswers, type DiagnosticAnswers } from './parser'
import { OptionCards } from './inputs/OptionCards'
import { MultiOptionCards } from './inputs/MultiOptionCards'
import { CityInput } from './inputs/CityInput'

const TOTAL = QUESTIONS.length  // 7

export function DiagnosticFlow() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)  // 0-indexed
  const [answers, setAnswers] = useState<DiagnosticAnswers>({})
  const [multiSelected, setMultiSelected] = useState<string[]>([])
  const [cityValue, setCityValue] = useState('')
  const [showTyping, setShowTyping] = useState(true)  // 800ms typing indicator on question reveal

  const question = QUESTIONS[currentStep]

  // Typing indicator on every step change
  useEffect(() => {
    setShowTyping(true)
    const t = setTimeout(() => setShowTyping(false), 600)
    return () => clearTimeout(t)
  }, [currentStep])

  // Restore multi/city state when navigating back
  useEffect(() => {
    if (question.type === 'multi_option') {
      setMultiSelected((answers.existing_cover as string[]) ?? [])
    }
    if (question.type === 'city') {
      setCityValue(answers.city_tier ?? '')
    }
  }, [currentStep, question.type, answers])

  const currentAnswer = answers[question.id as keyof DiagnosticAnswers]

  const saveAndAdvance = useCallback((value: string | string[]) => {
    const updated: DiagnosticAnswers = { ...answers, [question.id]: value }
    setAnswers(updated)

    if (currentStep < TOTAL - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      // All 7 questions answered — parse profile and navigate to score
      const profile = parseAnswers(updated)
      // Store profile in sessionStorage so ScorePage can read it
      sessionStorage.setItem('kin_diagnostic_profile', JSON.stringify(profile))
      sessionStorage.setItem('kin_diagnostic_answers', JSON.stringify(updated))
      navigate('/score')
    }
  }, [answers, currentStep, question.id, navigate])

  const handleOptionSelect = useCallback((id: string) => {
    // Auto-advance on selection for single-option questions
    saveAndAdvance(id)
  }, [saveAndAdvance])

  const handleMultiToggle = useCallback((id: string) => {
    setMultiSelected((prev) => {
      if (id === 'none_cover') return ['none_cover']
      const without = prev.filter((x) => x !== 'none_cover')
      return without.includes(id) ? without.filter((x) => x !== id) : [...without, id]
    })
  }, [])

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  const canContinue = () => {
    if (question.type === 'multi_option') return multiSelected.length > 0
    if (question.type === 'city') return cityValue.trim().length >= 2
    return false
  }

  const handleContinue = () => {
    if (question.type === 'multi_option') saveAndAdvance(multiSelected)
    if (question.type === 'city') saveAndAdvance(cityValue.trim())
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={handleBack}
            className={['text-gray-400 touch-target -ml-2 pr-2 transition-opacity', currentStep === 0 ? 'opacity-0 pointer-events-none' : ''].join(' ')}
            aria-label="Back"
          >
            ←
          </button>
          <div className="flex gap-1 flex-1">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= currentStep ? 'var(--color-primary)' : '#E5E7EB' }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 shrink-0 ml-1">
            {currentStep + 1} / {TOTAL}
          </span>
        </div>

        {/* Typing indicator → question text */}
        {showTyping ? (
          <div className="flex gap-1 items-center h-8 mb-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 leading-snug mb-1">
              {question.text}
            </h2>
            {question.subtext && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{question.subtext}</p>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {!showTyping && (
          <>
            {(question.type === 'option' || question.type === 'income_range') && question.options && (
              <OptionCards
                options={question.options}
                selected={(currentAnswer as string) ?? null}
                onSelect={handleOptionSelect}
              />
            )}
            {question.type === 'multi_option' && question.options && (
              <MultiOptionCards
                options={question.options}
                selected={multiSelected}
                onToggle={handleMultiToggle}
              />
            )}
            {question.type === 'city' && (
              <CityInput
                value={cityValue}
                onChange={setCityValue}
                placeholder={question.inputPlaceholder}
                helper={question.inputHelper}
              />
            )}
          </>
        )}
      </div>

      {/* Continue button — only for multi-select and city (others auto-advance) */}
      {(question.type === 'multi_option' || question.type === 'city') && !showTyping && (
        <div className="px-6 pb-6 pt-2 shrink-0">
          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {currentStep === TOTAL - 1 ? 'See My Protection Score →' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}
