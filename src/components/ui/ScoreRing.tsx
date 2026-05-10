// ============================================================
// GamiPhysio AR — UI: ScoreRing (Client Component)
// Animated circular rep score display (1–5).
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { SCORE_COLORS, SCORE_LABELS } from '@/lib/constants'
import type { RepScore } from '@/types'

interface ScoreRingProps {
  score: RepScore | null
  size?: number
  animate?: boolean
  showLabel?: boolean
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreRing({
  score,
  size = 100,
  animate = true,
  showLabel = true,
}: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (score === null) { setDisplayed(0); return }
    if (animate) {
      const t = setTimeout(() => setDisplayed(score), 50)
      return () => clearTimeout(t)
    }
    setDisplayed(score)
  }, [score, animate])

  const fraction = displayed / 5
  const offset   = CIRCUMFERENCE * (1 - fraction)
  const color    = score ? SCORE_COLORS[score] : '#374250'
  const label    = score ? SCORE_LABELS[score] : '—'

  return (
    <div className="flex flex-col items-center gap-1 animate-score-pop">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke="#1E252D"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="progress-ring-circle"
          style={{
            filter: score === 5 ? `drop-shadow(0 0 6px ${color})` : undefined,
            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease',
          }}
        />
        {/* Score number */}
        <text
          x="50" y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="24"
          fontWeight="900"
          fontFamily="'Barlow Condensed', sans-serif"
          fill={color}
        >
          {score ?? '?'}
        </text>
      </svg>
      {showLabel && (
        <span
          className="text-xs font-mono font-bold uppercase tracking-wider"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
