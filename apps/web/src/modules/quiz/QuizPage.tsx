/**
 * QuizPage.tsx — Module 8B: KIN IQ Weekly Quiz
 *
 * Route: /quiz
 *
 * Phases:
 *   intro    → Hero + current KIN IQ meter + "Start Quiz" CTA
 *   quiz     → 3 questions one at a time, answer → immediate reveal
 *   results  → Score summary + IQ delta + next steps
 *
 * Features:
 *   - Answer tap → immediate correct/wrong reveal with colour
 *   - Wrong answer: full explanation + learning hook shown inline
 *   - Correct: green flash + explanation still shown (reinforce)
 *   - 3/3 = perfect badge; 0/3 = encouragement
 *   - KIN IQ updated in localStorage, streak action signal set
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getWeeklyQuestions,
  getKinIq,
  saveAttempt,
  hasCompletedThisWeek,
  getCurrentWeekNumber,
  type QuizQuestion,
} from './quizData'
import { KinIqMeter } from './KinIqMeter'

type Phase = 'intro' | 'quiz' | 'results'

type AnswerState = {
  chosen: string
  revealed: boolean
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full transition-all duration-500"
          style={{ backgroundColor: i < current ? 'var(--color-primary)' : '#E5E7EB' }}
        />
      ))}
    </div>
  )
}

function QuestionCard({
  question,
  qIndex,
  total,
  onNext,
}: {
  question: QuizQuestion
  qIndex: number
  total: number
  onNext: (chosenId: string, correct: boolean) => void
}) {
  const [answer, setAnswer] = useState<AnswerState | null>(null)

  function handleOption(optionId: string) {
    if (answer?.revealed) return
    setAnswer({ chosen: optionId, revealed: true })
  }

  const isCorrect = answer?.chosen === question.correctOptionId

  return (
    <div className="flex flex-col">
      <ProgressBar current={qIndex} total={total} />

      {/* Q counter */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
        Question {qIndex + 1} of {total}
      </p>

      {/* Scenario */}
      <h2 className="text-sm font-extrabold text-gray-900 leading-snug mb-5">
        {question.scenario}
      </h2>

      {/* Options */}
      <div className="space-y-2.5 mb-5">
        {question.options.map(opt => {
          const isChosen = answer?.chosen === opt.id
          const isCorrectOpt = opt.id === question.correctOptionId
          const revealed = answer?.revealed

          let bg = '#FAFAFA'
          let border = '#E5E7EB'
          let textColor = '#374151'

          if (revealed) {
            if (isCorrectOpt) { bg = '#D1FAE5'; border = '#059669'; textColor = '#065F46' }
            else if (isChosen && !isCorrectOpt) { bg = '#FEE2E2'; border = '#EF4444'; textColor = '#991B1B' }
            else { bg = '#F9FAFB'; border = '#E5E7EB'; textColor = '#9CA3AF' }
          } else if (isChosen) {
            bg = 'color-mix(in srgb, var(--color-primary) 10%, white)'
            border = 'var(--color-primary)'
            textColor = 'var(--color-primary)'
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleOption(opt.id)}
              disabled={!!revealed}
              className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200"
              style={{ backgroundColor: bg, borderColor: border, color: textColor }}
            >
              <span className="inline-flex items-center gap-2.5">
                <span
                  className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: revealed && isCorrectOpt ? '#059669' : revealed && isChosen && !isCorrectOpt ? '#EF4444' : border,
                    color: revealed ? 'white' : textColor,
                  }}
                >
                  {opt.id.toUpperCase()}
                </span>
                {opt.text}
                {revealed && isCorrectOpt && <span className="ml-auto shrink-0">✓</span>}
                {revealed && isChosen && !isCorrectOpt && <span className="ml-auto shrink-0">✗</span>}
              </span>
            </button>
          )
        })}
      </div>

      {/* Reveal: explanation + learning hook */}
      {answer?.revealed && (
        <div className="space-y-3 mb-5 animate-fade-in">
          {/* Result banner */}
          <div
            className="rounded-xl p-3 flex items-start gap-2.5"
            style={{
              backgroundColor: isCorrect ? '#D1FAE5' : '#FEE2E2',
              borderLeft: `4px solid ${isCorrect ? '#059669' : '#EF4444'}`,
            }}
          >
            <span className="text-lg shrink-0">{isCorrect ? '🎉' : '💡'}</span>
            <div>
              <p className="text-xs font-extrabold mb-0.5" style={{ color: isCorrect ? '#065F46' : '#991B1B' }}>
                {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: isCorrect ? '#047857' : '#7F1D1D' }}>
                {question.explanation}
              </p>
            </div>
          </div>

          {/* Learning hook */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 flex items-start gap-2">
            <span className="text-base shrink-0">📌</span>
            <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              {question.learningHook}
            </p>
          </div>

          {/* Source */}
          <p className="text-[9px] text-gray-400 text-center">
            Source: {question.source}
          </p>

          {/* Next button */}
          <button
            onClick={() => onNext(answer.chosen, isCorrect)}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {qIndex + 1 < total ? 'Next Question →' : 'See Results →'}
          </button>
        </div>
      )}
    </div>
  )
}

export function QuizPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions] = useState(getWeeklyQuestions)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [correctCount, setCorrectCount] = useState(0)
  const [iqRecord, setIqRecord] = useState(getKinIq)
  const [finalDelta, setFinalDelta] = useState(0)
  const alreadyDone = hasCompletedThisWeek()
  const weekNumber = getCurrentWeekNumber()

  // Set quiz completed signal for streak
  useEffect(() => {
    if (phase === 'results') {
      localStorage.setItem('kin_quiz_completed_week', String(weekNumber))
    }
  }, [phase, weekNumber])

  function handleAnswer(chosenId: string, correct: boolean) {
    const q = questions[qIndex]
    const newAnswers = { ...answers, [q.id]: chosenId }
    const newCorrect = correctCount + (correct ? 1 : 0)

    setAnswers(newAnswers)
    setCorrectCount(newCorrect)

    if (qIndex + 1 >= questions.length) {
      // Save and move to results
      const attempt = saveAttempt(
        questions.map(q => q.id),
        newAnswers,
        newCorrect,
      )
      setFinalDelta(attempt.kinIqDelta)
      setIqRecord(getKinIq())
      setPhase('results')
    } else {
      setQIndex(i => i + 1)
    }
  }

  const scoreLabel =
    correctCount === 3 ? 'Perfect Score! 🏆' :
    correctCount === 2 ? 'Well Done! 🎯' :
    correctCount === 1 ? 'Keep Learning 📚' :
    'Try Again Next Week 💪'

  const scoreBg =
    correctCount === 3 ? 'linear-gradient(135deg, #065F46 0%, #059669 100%)' :
    correctCount === 2 ? 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)' :
    'linear-gradient(135deg, #374151 0%, #6B7280 100%)'

  return (
    <div className="flex flex-col pb-10">

      {/* ── Header ── */}
      <div
        className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-white border-b border-gray-50"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 5%, white) 0%, white 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Module 8B · Week {weekNumber}
            </p>
            <h1 className="text-xl font-extrabold text-gray-900">KIN IQ Quiz</h1>
          </div>
          <button
            onClick={() => navigate('/engage')}
            className="text-sm text-gray-400 font-medium"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">

        {/* ── Phase: Intro ── */}
        {phase === 'intro' && (
          <div className="space-y-5">
            {/* IQ meter */}
            <div className="flex flex-col items-center py-6 rounded-3xl bg-gray-50 border border-gray-100">
              <KinIqMeter score={iqRecord.score} size="lg" showLabel animated />
              <p className="text-xs text-gray-500 mt-3 text-center px-6">
                Your cumulative financial literacy score. Grows every week you complete the quiz.
              </p>
            </div>

            {/* What to expect */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2.5">
              <p className="text-xs font-bold text-gray-600 mb-1">This week: 3 scenario questions</p>
              {[
                { emoji: '🎯', text: 'Real-life insurance scenarios — no trick questions' },
                { emoji: '💡', text: 'Instant explanation after each answer' },
                { emoji: '📈', text: `+${correctCount === 3 ? 8 : 5} KIN IQ points for a strong score` },
                { emoji: '🔁', text: 'New questions every week' },
              ].map(item => (
                <div key={item.emoji} className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">{item.emoji}</span>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Already done this week */}
            {alreadyDone ? (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
                <p className="text-sm font-bold text-green-700 mb-1">
                  ✅ Quiz completed this week!
                </p>
                <p className="text-xs text-green-600">
                  Come back next week for 3 new questions. Your KIN IQ has been updated.
                </p>
                <div className="mt-3">
                  <KinIqMeter score={iqRecord.score} size="sm" showLabel={false} animated={false} />
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPhase('quiz')}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Start This Week's Quiz →
              </button>
            )}

            {/* History */}
            {iqRecord.history.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Recent weeks</p>
                <div className="space-y-2">
                  {iqRecord.history.slice(-4).reverse().map((h, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-xs text-gray-500">Week {h.weekNumber}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-700">
                          {h.score}/3 correct
                        </span>
                        {h.delta > 0 && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            +{h.delta} IQ
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Phase: Quiz ── */}
        {phase === 'quiz' && questions.length > 0 && (
          <QuestionCard
            key={qIndex}
            question={questions[qIndex]}
            qIndex={qIndex}
            total={questions.length}
            onNext={handleAnswer}
          />
        )}

        {/* ── Phase: Results ── */}
        {phase === 'results' && (
          <div className="space-y-5">
            {/* Score hero */}
            <div
              className="rounded-3xl p-6 text-white text-center"
              style={{ background: scoreBg }}
            >
              <div className="text-5xl mb-3">
                {correctCount === 3 ? '🏆' : correctCount === 2 ? '🎯' : correctCount === 1 ? '📚' : '💪'}
              </div>
              <h2 className="text-xl font-extrabold mb-1">{scoreLabel}</h2>
              <p className="text-sm opacity-90 mb-4">
                {correctCount} out of {questions.length} correct
              </p>
              <div className="flex items-center justify-center gap-6">
                <div>
                  <p className="text-[10px] opacity-70 uppercase tracking-wide mb-1">KIN IQ</p>
                  <p className="text-3xl font-black">{iqRecord.score}</p>
                </div>
                {finalDelta > 0 && (
                  <div className="bg-white/20 rounded-xl px-4 py-3">
                    <p className="text-[10px] opacity-80 uppercase tracking-wide mb-0.5">Earned</p>
                    <p className="text-2xl font-black">+{finalDelta}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Per-question review */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-3">Question Review</p>
              <div className="space-y-2.5">
                {questions.map((q, i) => {
	                  const chosen = answers[q.id]
	                  const correct = chosen === q.correctOptionId
	                  const correctOption = q.options.find(o => o.id === q.correctOptionId)
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: correct ? '#BBF7D0' : '#FECACA',
                        backgroundColor: correct ? '#F0FDF4' : '#FFF5F5',
                      }}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-base shrink-0">{correct ? '✅' : '❌'}</span>
                        <p className="text-[11px] font-semibold text-gray-700 leading-snug">
                          Q{i + 1}: {q.scenario.slice(0, 70)}…
                        </p>
                      </div>
                      {!correct && (
                        <p className="text-[10px] text-gray-500 ml-7">
                          Correct: <span className="font-semibold text-gray-700">{correctOption?.text}</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next actions */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-600">What's next?</p>
              <button
                onClick={() => navigate('/engage')}
                className="w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Back to Streak & Milestones
              </button>
              <button
                onClick={() => navigate('/recommend')}
                className="w-full py-3 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200"
              >
                View My Recommendations →
              </button>
            </div>

            {/* Compliance footer */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                KIN IQ quiz questions are for educational purposes only and do not constitute
                financial or legal advice. All question content is reviewed against IRDAI
                circulars and government scheme documentation. Conditions apply.
              </p>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  )
}
