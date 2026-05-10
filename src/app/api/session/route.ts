// ============================================================
// GamiPhysio AR — POST /api/session
// Saves a completed AR session to Supabase.
// The Supabase trigger auto-updates profile points + streak.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { saveSession } from '@/lib/supabase'
import type { Session } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Basic validation ─────────────────────────────────────
    const required = ['profile_id', 'mode', 'severity', 'total_score', 'reps_completed']
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const sessionData: Omit<Session, 'id' | 'created_at' | 'completed_at'> = {
      profile_id:       body.profile_id,
      exercise_id:      body.exercise_id ?? null,
      mode:             body.mode,
      severity:         body.severity,
      total_score:      Math.max(0, Number(body.total_score)),
      reps_completed:   Math.max(0, Number(body.reps_completed)),
      target_reps:      Number(body.target_reps) || 5,
      rep_scores:       Array.isArray(body.rep_scores) ? body.rep_scores : [],
      jitter_pauses:    Number(body.jitter_pauses) || 0,
      voice_stops:      Number(body.voice_stops) || 0,
      overachieved:     Boolean(body.overachieved),
      overachieve_bonus: Number(body.overachieve_bonus) || 0,
      duration_seconds: body.duration_seconds ? Number(body.duration_seconds) : null,
      session_date:     body.session_date ?? new Date().toISOString().split('T')[0],
    }

    const saved = await saveSession(sessionData)

    return NextResponse.json({ success: true, session: saved })
  } catch (err: any) {
    console.error('[Session] Error saving session:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to save session.' },
      { status: 500 }
    )
  }
}
