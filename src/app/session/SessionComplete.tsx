// ============================================================
// GamiPhysio AR — Session Complete Screen
// Post-session summary with scores, saves to Supabase.
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation' // 🟢 Added for direct navigation
import type { Exercise, SessionState, UserMode } from '@/types'
import { ScoreRing } from '@/components/ui/ScoreRing' // 🟢 Ensure correct import path
import { SeverityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SCORE_COLORS, OVERACHIEVE_BONUS_PER_REP } from '@/lib/constants'

interface SessionCompleteProps {
  exercise: Exercise
  sessionState: SessionState
  elapsed: number
  profileId: string | null
  onRestart: () => void
  onExit: () => void
}

export default function SessionComplete({
  exercise,
  sessionState,
  elapsed,
  profileId,
  onRestart,
  onExit,
}: SessionCompleteProps) {
  const router = useRouter() // 🟢 Initialize router locally
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)

  const mode = (sessionStorage.getItem('gamiphysio_session_mode') ?? 'solo') as UserMode

  const overachieveBonusReps = Math.max(
    0,
    sessionState.currentRep - exercise.target_reps * exercise.target_sets
  )
  const overachieveBonus = overachieveBonusReps * OVERACHIEVE_BONUS_PER_REP
  const grandTotal = sessionState.totalScore + overachieveBonus

  const gradeCounts = [1, 2, 3, 4, 5].map(s =>
    sessionState.repResults.filter(r => r.score === s).length
  )

  // Save session on mount
  useEffect(() => {
    if (!profileId || saved || saving) return
    setSaving(true)

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id:       profileId,
        exercise_id:      exercise.id,
        mode,
        severity:         exercise.severity,
        total_score:      sessionState.totalScore,
        reps_completed:   sessionState.currentRep,
        target_reps:      exercise.target_reps * exercise.target_sets,
        rep_scores:       sessionState.repResults.map(r => r.score),
        jitter_pauses:    sessionState.jitterPauses,
        voice_stops:      sessionState.voiceStops,
        overachieved:     overachieveBonusReps > 0,
        overachieve_bonus: overachieveBonus,
        duration_seconds: elapsed,
        session_date:     new Date().toISOString().split('T')[0],
      }),
    })
      .then(() => setSaved(true))
      .catch(err => console.error('[Supabase Save Error]:', err))
      .finally(() => setSaving(false))
  }, [profileId, exercise.id, mode, sessionState, overachieveBonusReps, overachieveBonus, elapsed, saved, saving])

  // 🟢 Handle navigation directly for better reliability
  const handleViewProgress = () => {
    router.push('/profile')
  }

  return (
    <div className="fixed inset-0 bg-carbon-950 flex items-center justify-center p-4 overflow-y-auto z-50">
      <div className="max-w-lg w-full space-y-6 py-8 animate-slide-up">

        {/* Header */}
        <div className="text-center">
          <p className="text-6xl mb-3">{overachieveBonusReps > 0 ? '🏆' : '✅'}</p>
          <h1 className="font-display text-5xl font-black text-warm-cream uppercase">
            {overachieveBonusReps > 0 ? 'Outstanding!' : 'Session Done!'}
          </h1>
          <p className="text-warm-sand mt-2">{exercise.name}</p>
          <div className="flex justify-center mt-2">
            <SeverityBadge severity={exercise.severity} />
          </div>
        </div>

        {/* Grand total score */}
        <div className="glass-card rounded-xl2 p-6 text-center border border-carbon-800">
          <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-2">
            Total Score
          </p>
          <p className="font-display text-7xl font-black text-neon-green">
            {grandTotal}
          </p>
          {overachieveBonus > 0 && (
            <p className="text-neon-yellow text-sm font-mono mt-1 animate-pulse">
              +{overachieveBonus} overachieve bonus ⭐
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Reps"     value={sessionState.currentRep.toString()} color="text-neon-green" />
          <StatBox label="Duration" value={formatTime(elapsed)}                color="text-neon-yellow" />
          <StatBox label="Pauses"   value={sessionState.jitterPauses.toString()} color="text-warm-sand" />
        </div>

        {/* Rep-by-rep breakdown */}
        {sessionState.repResults.length > 0 && (
          <div className="glass-card rounded-xl p-4 border border-carbon-800">
            <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-3">
              Rep Breakdown
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {sessionState.repResults.map((r, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <ScoreRing score={r.score} size={48} showLabel={false} />
                  <span className="text-[10px] font-mono text-carbon-500">#{r.rep_number}</span>
                </div>
              ))}
            </div>

            {/* Grade bar */}
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono w-8 text-right" style={{ color: SCORE_COLORS[s] }}>
                    {s}pts
                  </span>
                  <div className="flex-1 h-1.5 bg-carbon-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: sessionState.repResults.length
                          ? `${(gradeCounts[s - 1] / sessionState.repResults.length) * 100}%`
                          : '0%',
                        backgroundColor: SCORE_COLORS[s],
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-carbon-500 w-4">{gradeCounts[s - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save status */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-center text-xs font-mono text-carbon-500">
            {saving ? '⏳ Saving to profile…' : saved ? '✓ Saved to your recovery calendar' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button 
            size="xl" 
            variant="primary" 
            onClick={onRestart} 
            className="w-full bg-neon-green text-carbon-950 font-bold"
          >
            ↻ Repeat Session
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={handleViewProgress} 
            className="w-full border border-carbon-700 text-warm-cream hover:bg-carbon-900"
          >
            View Recovery Progress →
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-3 text-center border border-carbon-800">
      <p className={`font-display text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] font-mono text-carbon-500 uppercase mt-0.5">{label}</p>
    </div>
  )
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}