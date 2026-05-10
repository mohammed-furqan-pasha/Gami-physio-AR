// ============================================================
// GamiPhysio AR — /profile Page
// Recovery calendar heatmap, total points, streaks.
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarHeatmap } from '@/components/ui/CalendarHeatmap'
import { SeverityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Profile, DailySummary, Session } from '@/types'
import { STREAK_MILESTONES } from '@/lib/constants'
import { format, subDays } from 'date-fns'

export default function ProfilePage() {
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [summaries, setSummaries]     = useState<DailySummary[]>([])
  const [recentSessions, setRecent]   = useState<Session[]>([])
  const [loading, setLoading]         = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput]     = useState('')

  useEffect(() => {
    async function init() {
      const {
        getOrCreateProfile,
        getDailySummaries,
        getSessionHistory,
        updateDisplayName,
      } = await import('@/lib/supabase')

      try {
        const p = await getOrCreateProfile()
        setProfile(p)
        setNameInput(p.display_name)

        const today = format(new Date(), 'yyyy-MM-dd')
        const from  = format(subDays(new Date(), 180), 'yyyy-MM-dd')

        const [sums, hist] = await Promise.all([
          getDailySummaries(p.id, from, today),
          getSessionHistory(p.id, 20),
        ])

        setSummaries(sums)
        setRecent(hist)
      } catch (err) {
        console.error('Profile load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleNameSave = async () => {
    if (!profile || !nameInput.trim()) return
    const { updateDisplayName } = await import('@/lib/supabase')
    await updateDisplayName(profile.id, nameInput.trim())
    setProfile(p => p ? { ...p, display_name: nameInput.trim() } : p)
    setEditingName(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-carbon-700 border-t-neon-green animate-spin" />
      </div>
    )
  }

  const nextMilestone = STREAK_MILESTONES.find(m => m > (profile?.streak_days ?? 0))

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-12 space-y-10">

      {/* ── Profile header ────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                className="font-display text-3xl font-black bg-carbon-800 border border-neon-green/40 rounded-lg px-3 py-1 text-warm-cream outline-none"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                className="text-neon-green text-sm font-mono hover:underline"
              >
                Save
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="text-carbon-500 text-sm font-mono hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="group flex items-center gap-2"
            >
              <h1 className="font-display text-5xl font-black text-warm-cream group-hover:text-neon-green transition-colors">
                {profile?.display_name ?? 'Athlete'}
              </h1>
              <span className="text-carbon-500 text-sm group-hover:text-neon-green transition-colors">✏️</span>
            </button>
          )}
          <p className="text-warm-sand text-sm mt-1 font-mono">
            Recovery Profile · Member since {profile?.created_at
              ? format(new Date(profile.created_at), 'MMM yyyy')
              : '—'}
          </p>
        </div>

        <Link href="/upload">
          <Button size="lg" variant="primary">+ New Session</Button>
        </Link>
      </div>

      {/* ── Stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BigStat
          label="Total Points"
          value={(profile?.total_points ?? 0).toLocaleString()}
          icon="⚡"
          color="text-neon-green"
        />
        <BigStat
          label="Current Streak"
          value={`${profile?.streak_days ?? 0}d`}
          icon="🔥"
          color="text-warm-amber"
          sub={nextMilestone ? `Next milestone: ${nextMilestone}d` : '🏆 Max milestone!'}
        />
        <BigStat
          label="Sessions"
          value={recentSessions.length.toString()}
          icon="💪"
          color="text-neon-yellow"
          sub="Last 20 shown"
        />
        <BigStat
          label="Active Days"
          value={summaries.length.toString()}
          icon="📅"
          color="text-warm-sand"
          sub="Last 180 days"
        />
      </div>

      {/* ── Streak milestones ──────────────────────────────── */}
      <div className="glass-card rounded-xl2 p-5">
        <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-4">
          Streak Milestones
        </p>
        <div className="flex gap-3 flex-wrap">
          {STREAK_MILESTONES.map(m => {
            const achieved = (profile?.streak_days ?? 0) >= m
            return (
              <div
                key={m}
                className={`
                  flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all
                  ${achieved
                    ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                    : 'border-carbon-700 text-carbon-500'
                  }
                `}
              >
                <span className="text-xl">{achieved ? '🏅' : '🔒'}</span>
                <span className="font-display font-black text-lg">{m}d</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Recovery Calendar ─────────────────────────────── */}
      <div>
        <h2 className="font-display text-2xl font-black text-warm-cream mb-4 uppercase">
          Recovery <span className="text-neon-green">Calendar</span>
        </h2>
        <CalendarHeatmap data={summaries} />
      </div>

      {/* ── Recent sessions ───────────────────────────────── */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-black text-warm-cream mb-4 uppercase">
            Recent <span className="text-neon-green">Sessions</span>
          </h2>
          <div className="space-y-2">
            {recentSessions.map(s => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BigStat({
  label, value, icon, color, sub,
}: {
  label: string; value: string; icon: string; color: string; sub?: string
}) {
  return (
    <div className="glass-card rounded-xl2 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-display text-4xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-carbon-500 font-mono mt-1">{sub}</p>}
    </div>
  )
}

function SessionRow({ session }: { session: Session }) {
  const repScores = Array.isArray(session.rep_scores) ? session.rep_scores : []
  const avgScore  = repScores.length
    ? (repScores.reduce((a: number, b: number) => a + b, 0) / repScores.length).toFixed(1)
    : '—'

  return (
    <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-[160px]">
        <p className="font-mono text-xs text-carbon-500">
          {format(new Date(session.session_date), 'MMM d, yyyy')}
        </p>
        <p className="text-sm font-semibold text-warm-cream capitalize">
          {session.severity} · {session.mode} mode
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm font-mono">
        <span className="text-neon-green font-bold">+{session.total_score + session.overachieve_bonus} pts</span>
        <span className="text-warm-sand">{session.reps_completed} reps</span>
        <span className="text-carbon-500">avg {avgScore}</span>
        {session.overachieved && <span className="text-neon-yellow">⭐</span>}
      </div>
      <SeverityBadge severity={session.severity} size="sm" />
    </div>
  )
}
