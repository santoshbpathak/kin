/**
 * StreakCard.tsx — Module 8A
 *
 * Displays the user's current engagement streak:
 *   - Flame icon + current streak count (animated on mount)
 *   - "Longest streak" and "Total days active" sub-stats
 *   - 7-day activity calendar dots (filled = visited, empty = missed)
 *   - Motivational message keyed to streak length
 */

import { useEffect, useState } from 'react'
import type { StreakRecord } from './streakStore'

function getMessage(streak: number): { text: string; emoji: string } {
  if (streak === 0) return { text: 'Open KIN every day to build your streak', emoji: '💡' }
  if (streak === 1) return { text: "Day 1 — great start! Come back tomorrow", emoji: '🌱' }
  if (streak < 3) return { text: `${streak} days and building — keep it going!`, emoji: '🔥' }
  if (streak < 7) return { text: `${streak}-day streak — you're developing a habit!`, emoji: '🔥' }
  if (streak < 14) return { text: `${streak} days! Weekly Warrior unlocked 🏆`, emoji: '🔥' }
  if (streak < 30) return { text: `${streak} days — extraordinary consistency!`, emoji: '⚡' }
  return { text: `${streak} days — you're a KIN champion!`, emoji: '🏆' }
}

// Last 7 days as ISO strings, newest first
function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
}

function DayDot({ date, visited }: { date: string; visited: boolean }) {
  const dayName = new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0)
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        style={{
          backgroundColor: visited ? 'var(--color-primary)' : '#F3F4F6',
          color: visited ? '#fff' : '#D1D5DB',
        }}
      >
        {visited ? '✓' : ''}
      </div>
      <span className="text-[9px] text-gray-400 font-medium">{dayName}</span>
    </div>
  )
}

type Props = {
  streak: StreakRecord
}

export function StreakCard({ streak }: Props) {
  const [displayCount, setDisplayCount] = useState(0)
  const msg = getMessage(streak.currentStreak)
  const days = last7Days()
  const visitSet = new Set(streak.visitDates)

  // Count-up animation
  useEffect(() => {
    if (streak.currentStreak === 0) return
    const total = streak.currentStreak
    const duration = Math.min(total * 60, 800) // max 800ms
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayCount(Math.round(eased * total))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [streak.currentStreak])

  const flameSize = streak.currentStreak >= 7 ? 'text-5xl' : streak.currentStreak >= 3 ? 'text-4xl' : 'text-3xl'

  return (
    <div
      className="rounded-2xl p-5 overflow-hidden relative"
      style={{
        background: streak.currentStreak >= 3
          ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
          : 'linear-gradient(135deg, #374151 0%, #4B5563 100%)',
      }}
    >
      {/* Background glow for high streaks */}
      {streak.currentStreak >= 7 && (
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-8 translate-x-8"
          style={{ background: 'radial-gradient(circle, #F97316, transparent)' }}
        />
      )}

      {/* Main content */}
      <div className="relative flex items-start gap-4 mb-4">
        {/* Flame + count */}
        <div className="flex flex-col items-center min-w-[60px]">
          <span className={`${flameSize} leading-none`}>🔥</span>
          <span className="text-3xl font-extrabold text-white leading-tight mt-1">
            {displayCount}
          </span>
          <span className="text-[10px] text-white/60 font-medium">
            {streak.currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Message + sub-stats */}
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-snug mb-2">
            {msg.emoji} {msg.text}
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wide font-medium">Best</p>
              <p className="text-sm font-bold text-white/80">{streak.longestStreak}d</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wide font-medium">Total</p>
              <p className="text-sm font-bold text-white/80">{streak.totalDaysActive}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-day calendar */}
      <div className="bg-white/10 rounded-xl px-3 py-2.5">
        <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-2">
          Last 7 days
        </p>
        <div className="flex justify-between">
          {days.reverse().map(d => (
            <DayDot key={d} date={d} visited={visitSet.has(d)} />
          ))}
        </div>
      </div>
    </div>
  )
}
