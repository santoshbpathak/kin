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
import { Button, Card, NavHeader, StateChip } from '@/components/ui'
import {
  IconSparkle,
  IconBulb,
  IconPin,
  IconScore,
  IconChart,
  IconRefresh,
  IconCheckCircle,
  IconTrophy,
  IconDoc,
  IconClose,
} from '@/components/ui/icons'

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
          className={`flex-1 h-1.5 rounded-pill transition-all duration-500 ${i < current ? 'bg-teal' : 'bg-sand-deep'}`}
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
      <p className="t-micro text-muted mb-2">
        Question {qIndex + 1} of {total}
      </p>

      {/* Scenario */}
      <h2 className="t-h3 text-navy leading-snug mb-5">
        {question.scenario}
      </h2>

      {/* Options */}
      <div className="space-y-2.5 mb-5">
        {question.options.map(opt => {
          const isChosen = answer?.chosen === opt.id
          const isCorrectOpt = opt.id === question.correctOptionId
          const revealed = answer?.revealed

          let optionClass = 'w-full text-left px-4 py-3.5 rounded-md border-2 t-body-sm font-semibold transition-all duration-200 '

          if (revealed) {
            if (isCorrectOpt) {
              optionClass += 'bg-mint border-teal-deep text-teal-deep'
            } else if (isChosen && !isCorrectOpt) {
              optionClass += 'bg-[rgba(232,93,90,0.10)] border-coral text-coral'
            } else {
              optionClass += 'bg-sand-deep border-hairline text-muted'
            }
          } else if (isChosen) {
            optionClass += 'bg-[rgba(0,183,172,0.10)] border-teal text-teal-deep'
          } else {
            optionClass += 'bg-surface border-hairline text-slate'
          }

          const badgeClass = revealed && isCorrectOpt
            ? 'bg-teal-deep text-sand'
            : revealed && isChosen && !isCorrectOpt
            ? 'bg-coral text-sand'
            : 'bg-sand-deep text-slate'

          return (
            <button
              key={opt.id}
              onClick={() => handleOption(opt.id)}
              disabled={!!revealed}
              className={optionClass}
            >
              <span className="inline-flex items-center gap-2.5">
                <span
                  className={`text-[10px] font-bold w-5 h-5 rounded-pill flex items-center justify-center shrink-0 ${badgeClass}`}
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
            className={`rounded-md p-3 flex items-start gap-2.5 border-l-4 ${isCorrect ? 'bg-mint border-teal-deep' : 'bg-[rgba(232,93,90,0.10)] border-coral'}`}
          >
            {isCorrect
              ? <IconSparkle size={20} className="text-teal-deep shrink-0" />
              : <IconBulb size={20} className="text-coral shrink-0" />
            }
            <div>
              <p className={`t-body-sm font-extrabold mb-0.5 ${isCorrect ? 'text-teal-deep' : 'text-coral'}`}>
                {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
              </p>
              <p className={`text-[11px] leading-relaxed ${isCorrect ? 'text-teal-deep' : 'text-coral'}`}>
                {question.explanation}
              </p>
            </div>
          </div>

          {/* Learning hook */}
          <div className="rounded-md bg-sand-deep border border-hairline px-3 py-2.5 flex items-start gap-2">
            <IconPin size={18} className="text-muted shrink-0" />
            <p className="text-[11px] text-slate font-semibold leading-relaxed">
              {question.learningHook}
            </p>
          </div>

          {/* Source */}
          <p className="t-micro text-muted text-center">
            Source: {question.source}
          </p>

          {/* Next button */}
          <Button fullWidth onClick={() => onNext(answer.chosen, isCorrect)}>
            {qIndex + 1 < total ? 'Next Question →' : 'See Results →'}
          </Button>
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
    correctCount === 3 ? 'Perfect Score!' :
    correctCount === 2 ? 'Well Done!' :
    correctCount === 1 ? 'Keep Learning' :
    'Try Again Next Week'

  const scoreTone: 'positive' | 'moderate' | 'critical' =
    correctCount === 3 ? 'positive' :
    correctCount === 2 ? 'positive' :
    correctCount === 1 ? 'moderate' :
    'critical'

  return (
    <div className="flex flex-col pb-10">

      {/* Header */}
      <NavHeader
        title="KIN IQ Quiz"
        showBack
        onBack={() => navigate('/engage')}
        action={
          <p className="t-micro text-muted">Week {weekNumber}</p>
        }
      />

      <div className="px-5 pt-5">

        {/* Phase: Intro */}
        {phase === 'intro' && (
          <div className="space-y-5">
            {/* IQ meter */}
            <Card className="flex flex-col items-center py-6">
              <KinIqMeter score={iqRecord.score} size="lg" showLabel animated />
              <p className="t-body-sm text-muted mt-3 text-center px-2">
                Your cumulative financial literacy score. Grows every week you complete the quiz.
              </p>
            </Card>

            {/* What to expect */}
            <Card className="space-y-2.5">
              <p className="t-body-sm font-bold text-navy mb-1">This week: 3 scenario questions</p>
              {[
                { icon: <IconScore size={18} className="text-teal-deep shrink-0" />, text: 'Real-life insurance scenarios — no trick questions' },
                { icon: <IconBulb size={18} className="text-amber shrink-0" />, text: 'Instant explanation after each answer' },
                { icon: <IconChart size={18} className="text-teal-deep shrink-0" />, text: `+${correctCount === 3 ? 8 : 5} KIN IQ points for a strong score` },
                { icon: <IconRefresh size={18} className="text-muted shrink-0" />, text: 'New questions every week' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  {item.icon}
                  <p className="t-body-sm text-slate">{item.text}</p>
                </div>
              ))}
            </Card>

            {/* Already done this week */}
            {alreadyDone ? (
              <Card className="text-center">
                <p className="t-body font-bold text-teal-deep mb-1 flex items-center justify-center gap-1.5">
                  <IconCheckCircle size={18} className="text-teal-deep shrink-0" /> Quiz completed this week!
                </p>
                <p className="t-body-sm text-slate">
                  Come back next week for 3 new questions. Your KIN IQ has been updated.
                </p>
                <div className="mt-3">
                  <KinIqMeter score={iqRecord.score} size="sm" showLabel={false} animated={false} />
                </div>
              </Card>
            ) : (
              <Button fullWidth onClick={() => setPhase('quiz')}>
                Start This Week's Quiz →
              </Button>
            )}

            {/* History */}
            {iqRecord.history.length > 0 && (
              <div>
                <p className="t-body-sm font-bold text-muted mb-2">Recent weeks</p>
                <div className="space-y-2">
                  {iqRecord.history.slice(-4).reverse().map((h, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-sand-deep border border-hairline px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="t-body-sm text-muted">Week {h.weekNumber}</span>
                      <div className="flex items-center gap-3">
                        <span className="t-body-sm font-semibold text-navy">
                          {h.score}/3 correct
                        </span>
                        {h.delta > 0 && (
                          <StateChip tone="positive">+{h.delta} IQ</StateChip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase: Quiz */}
        {phase === 'quiz' && questions.length > 0 && (
          <QuestionCard
            key={qIndex}
            question={questions[qIndex]}
            qIndex={qIndex}
            total={questions.length}
            onNext={handleAnswer}
          />
        )}

        {/* Phase: Results */}
        {phase === 'results' && (
          <div className="space-y-5">
            {/* Score hero */}
            <Card className="text-center py-6">
              <div className="flex justify-center mb-3">
                {correctCount === 3
                  ? <IconTrophy size={48} className="text-amber" />
                  : correctCount === 2
                  ? <IconScore size={48} className="text-teal-deep" />
                  : correctCount === 1
                  ? <IconDoc size={48} className="text-muted" />
                  : <IconBulb size={48} className="text-muted" />
                }
              </div>
              <h2 className="t-h2 text-navy mb-2">{scoreLabel}</h2>
              <StateChip tone={scoreTone}>
                {correctCount} out of {questions.length} correct
              </StateChip>
              <div className="flex items-center justify-center gap-6 mt-5">
                <div>
                  <p className="t-micro text-muted mb-1">KIN IQ</p>
                  <p className="t-numeric-hero text-navy nums">{iqRecord.score}</p>
                </div>
                {finalDelta > 0 && (
                  <div className="rounded-md bg-mint px-4 py-3">
                    <p className="t-micro text-teal-deep mb-0.5">Earned</p>
                    <p className="t-numeric-inline text-teal-deep nums">+{finalDelta}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Per-question review */}
            <div>
              <p className="t-body-sm font-bold text-slate mb-3">Question Review</p>
              <div className="space-y-2.5">
                {questions.map((q, i) => {
                  const chosen = answers[q.id]
                  const correct = chosen === q.correctOptionId
                  const correctOption = q.options.find(o => o.id === q.correctOptionId)
                  return (
                    <div
                      key={q.id}
                      className={`rounded-md border p-3 ${correct ? 'border-teal/40 bg-mint' : 'bg-[rgba(232,93,90,0.07)] border-coral/30'}`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {correct
                          ? <IconCheckCircle size={18} className="text-teal-deep shrink-0" />
                          : <IconClose size={18} className="text-coral shrink-0" />
                        }
                        <p className="t-body-sm font-semibold text-navy leading-snug">
                          Q{i + 1}: {q.scenario.slice(0, 70)}…
                        </p>
                      </div>
                      {!correct && (
                        <p className="text-[10px] text-muted ml-7">
                          Correct: <span className="font-semibold text-slate">{correctOption?.text}</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next actions */}
            <Card className="space-y-3">
              <p className="t-body-sm font-bold text-navy">What's next?</p>
              <Button fullWidth onClick={() => navigate('/engage')}>
                Back to Streak &amp; Milestones
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/recommend')}>
                View My Recommendations →
              </Button>
            </Card>

            {/* Compliance footer */}
            <div className="rounded-sm border border-hairline bg-sand-deep/50 p-3">
              <p className="text-[10px] text-muted leading-relaxed">
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
