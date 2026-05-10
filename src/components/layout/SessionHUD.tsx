// ============================================================
// GamiPhysio AR — SessionHUD
// In-session heads-up display: score, reps, timer, milestone.
// ============================================================
'use client'

import { ScoreRing } from '@/components/ui/Badge'
import type { SessionState, Exercise, RepScore } from '@/types'
import type { SessionTimerState } from '@/hooks/useSessionTimer'
import { SCORE_COLORS, POINTS_PER_SCORE } from '@/lib/constants'
import clsx from 'clsx'

interface SessionHUDProps {
  sessionState: SessionState
  timerState: SessionTimerState
  exercise: Exercise
  onStop: () => void
}

export function SessionHUD({
  sessionState,
  timerState,
  exercise,
  onStop,
}: SessionHUDProps) {
  const {
    currentRep,
    currentSet,
    totalScore,
    repResults,
    isInTargetZone,
    holdProgress,
    overachieving,
    currentAngle,
    targetAngle,
  } = sessionState

  const totalTarget = exercise.target_reps * exercise.target_sets
  const lastScore   = repResults[repResults.length - 1]?.score as RepScore | undefined
  const sessionPct  = Math.min(100, (currentRep / totalTarget) * 100)

  return (
    <>
      {/* ── Top-left: Set / Rep counter ────────────────────── */}
      <div className="session-hud absolute top-4 left-4 px-4 py-3 min-w-[140px]">
        <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-1">Progress</p>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-black text-warm-cream">{currentRep}</span>
          <span className="text-carbon-500 font-mono text-sm">/ {totalTarget} reps</span>
        </div>
        <div className="text-xs font-mono text-warm-sand mt-0.5">
          Set {currentSet} of {exercise.target_sets}
        </div>
        {overachieving && (
          <div className="mt-1 text-xs font-mono text-neon-yellow animate-pulse">
            ⭐ Overachieving!
          </div>
        )}
      </div>

      {/* ── Top-right: Total score + last rep score ─────────── */}
      <div className="session-hud absolute top-4 right-4 px-4 py-3 text-right">
        <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-1">Score</p>
        <p className="font-display text-4xl font-black score-gradient-text">{totalScore}</p>
        {lastScore && (
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs font-mono text-warm-sand">Last rep:</span>
            <ScoreRing score={lastScore} size={32} showLabel={false} />
          </div>
        )}
      </div>

      {/* ── Centre bottom: Angle + Hold ring ────────────────── */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">

        {/* Hold progress ring */}
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1E252D" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={isInTargetZone ? '#39FF14' : '#374250'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - holdProgress)}`}
              className="progress-ring-circle"
              style={{ filter: isInTargetZone ? 'drop-shadow(0 0 8px #39FF14)' : undefined }}
            />
            <text
              x="50" y="46"
              textAnchor="middle"
              fontSize="20"
              fontWeight="900"
              fontFamily="'Barlow Condensed', sans-serif"
              fill={isInTargetZone ? '#39FF14' : '#FFE500'}
            >
              {currentAngle !== null ? `${currentAngle}°` : '—'}
            </text>
            <text
              x="50" y="62"
              textAnchor="middle"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fill="#374250"
            >
              target {targetAngle}°
            </text>
          </svg>

          {/* In-zone flash */}
          {isInTargetZone && (
            <div className="absolute inset-0 rounded-full border-2 border-neon-green animate-pulse opacity-40" />
          )}
        </div>

        <p className={clsx(
          'text-sm font-mono font-bold uppercase tracking-wider transition-colors',
          isInTargetZone ? 'text-neon-green' : 'text-warm-sand'
        )}>
          {isInTargetZone ? '✓ Hold position' : 'Move to target zone'}
        </p>
      </div>

      {/* ── Bottom: Milestone bar + STOP button ─────────────── */}
      <div className="session-hud absolute bottom-4 left-4 right-4 px-4 py-3 flex items-center gap-4">

        {/* Milestone bar */}
        <div className="flex-1">
          <div className="flex justify-between text-xs font-mono text-carbon-500 mb-1.5">
            <span>Milestone Progress</span>
            <span className="text-neon-green font-bold">{Math.round(sessionPct)}%</span>
          </div>
          <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                overachieving ? 'bg-neon-yellow' : 'bg-neon-green'
              )}
              style={{
                width: `${sessionPct}%`,
                boxShadow: sessionPct > 0 ? `0 0 8px ${overachieving ? '#FFE500' : '#39FF14'}` : undefined,
              }}
            />
          </div>
          {/* Rep score dots */}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {repResults.map((r, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: SCORE_COLORS[r.score],
                  boxShadow: `0 0 4px ${SCORE_COLORS[r.score]}`,
                }}
                title={`Rep ${r.rep_number}: ${r.score}/5`}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center min-w-[60px]">
          <p className="font-mono text-xs text-carbon-500">Time</p>
          <p className="font-display text-xl font-black text-warm-cream">
            {formatTime(timerState.elapsed)}
          </p>
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="min-h-touch-lg min-w-touch-lg flex items-center justify-center rounded-xl bg-warm-coral/20 border border-warm-coral/40 text-warm-coral hover:bg-warm-coral/30 transition-colors font-display font-bold uppercase tracking-wide text-sm px-4"
          aria-label="Stop session"
        >
          ■ Stop
        </button>
      </div>

      {/* ── Jitter pause overlay ────────────────────────────── */}
      {timerState.phase === 'jitter_pause' && (
        <JitterPauseOverlay seconds={timerState.jitterRemaining} />
      )}

      {/* ── Rest period overlay ──────────────────────────────── */}
      {timerState.phase === 'rest' && (
        <RestOverlay seconds={timerState.restRemaining} />
      )}

      {/* ── Countdown overlay ───────────────────────────────── */}
      {timerState.phase === 'countdown' && (
        <CountdownOverlay count={timerState.countdown} />
      )}
    </>
  )
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function JitterPauseOverlay({ seconds }: { seconds: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-carbon-950/80 backdrop-blur-sm z-30">
      <div className="text-center glass-card rounded-xl2 px-10 py-8 jitter-shake border-warm-amber/30">
        <p className="text-5xl mb-3">⚠️</p>
        <p className="font-display text-3xl font-black text-warm-amber uppercase mb-2">Rest Prompt</p>
        <p className="text-warm-sand mb-4">High movement detected — take a breath.</p>
        <p className="font-display text-5xl font-black text-neon-green">{seconds}s</p>
      </div>
    </div>
  )
}

function RestOverlay({ seconds }: { seconds: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-carbon-950/75 backdrop-blur-sm z-30">
      <div className="text-center glass-card rounded-xl2 px-10 py-8">
        <p className="text-5xl mb-3">😤</p>
        <p className="font-display text-3xl font-black text-neon-green uppercase mb-2">Rest Period</p>
        <p className="text-warm-sand mb-4">Great set! Recover before the next one.</p>
        <p className="font-display text-6xl font-black text-neon-green">{seconds}s</p>
      </div>
    </div>
  )
}

function CountdownOverlay({ count }: { count: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <p
        className="font-display font-black text-neon-green text-neon-glow animate-score-pop"
        style={{ fontSize: '15vw' }}
        key={count}
      >
        {count > 0 ? count : 'GO!'}
      </p>
    </div>
  )
}
