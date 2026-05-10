// ============================================================
// GamiPhysio AR — Calendar Heatmap
// Recovery calendar pulling from daily_summary view.
// ============================================================
'use client'

import { useMemo } from 'react'
import CalendarHeatmapLib from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { format, subDays, startOfDay } from 'date-fns'
import type { DailySummary } from '@/types'

interface CalendarHeatmapProps {
  data: DailySummary[]
  totalDays?: number
}

export function CalendarHeatmap({ data, totalDays = 180 }: CalendarHeatmapProps) {
  const today = startOfDay(new Date())
  const endDate = today
  const startDate = subDays(today, totalDays)

  const dataMap = useMemo(() => {
    const map = new Map<string, DailySummary>()
    for (const d of data) map.set(d.session_date, d)
    return map
  }, [data])

  const heatmapValues = useMemo(() => {
    const values: any[] = [] // 🟢 Use any[] here to prevent generic mismatch
    let d = new Date(startDate)
    while (d <= endDate) {
      const key = format(d, 'yyyy-MM-dd')
      const summary = dataMap.get(key)
      values.push({
        date: key,
        count:  summary?.session_count ?? 0,
        points: summary?.day_points    ?? 0,
        reps:   summary?.total_reps    ?? 0,
      })
      d = new Date(d.getTime() + 86400000)
    }
    return values
  }, [dataMap, startDate, endDate])

  const totalPoints = data.reduce((s, d) => s + d.day_points, 0)
  const activeDays = data.length
  const longestStreak = computeStreak(data)

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Points" value={totalPoints.toLocaleString()} color="text-neon-green" />
        <StatCard label="Active Days"  value={activeDays.toString()}         color="text-neon-yellow" />
        <StatCard label="Best Streak"  value={`${longestStreak}d`}           color="text-warm-amber" />
      </div>

      {/* Heatmap */}
      <div className="glass-card rounded-xl2 p-6 overflow-x-auto border border-carbon-800">
        <p className="text-xs font-mono text-carbon-500 mb-4 uppercase tracking-wider">
          Last {totalDays} days
        </p>
        <CalendarHeatmapLib
          startDate={startDate}
          endDate={endDate}
          values={heatmapValues}
          // 🟢 FIXED: Using (value: any) bypasses the library's strict generic checking
          classForValue={(value: any) => {
            if (!value || value.points === 0) return 'color-empty'
            if (value.points < 15) return 'color-scale-1'
            if (value.points < 30) return 'color-scale-2'
            if (value.points < 50) return 'color-scale-3'
            return 'color-scale-4'
          }}
          tooltipDataAttrs={(value: any) => {
            if (!value || !value.date) return {} as any
            return {
              'data-tip': value.points
                ? `${value.date}: ${value.points} pts, ${value.reps} reps`
                : value.date,
            } as any
          }}
          showWeekdayLabels
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs font-mono text-carbon-500">
        <span>Less</span>
        {['#1E252D', '#1a3a1a', '#2d6e2d', '#39FF1499', '#39FF14'].map((c, i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-sm"
            style={{ backgroundColor: c }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center border border-carbon-800">
      <p className={`font-display text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-warm-sand mt-1 font-mono uppercase tracking-wider">{label}</p>
    </div>
  )
}

function computeStreak(data: DailySummary[]): number {
  if (data.length === 0) return 0
  const sorted = [...data].sort((a, b) => b.session_date.localeCompare(a.session_date))
  let streak = 1
  let best = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].session_date)
    const curr = new Date(sorted[i].session_date)
    const diff = (prev.getTime() - curr.getTime()) / 86400000
    if (Math.round(diff) === 1) {
      streak++
      best = Math.max(best, streak)
    } else {
      streak = 1
    }
  }
  return best
}