// ============================================================
// GamiPhysio AR — GifPreview
// Side-by-side .gif demonstration panel shown during session.
// ============================================================
'use client'

import Image from 'next/image'
import type { Exercise } from '@/types'

interface GifPreviewProps {
  exercise: Exercise
  compact?: boolean
}

export function GifPreview({ exercise, compact = false }: GifPreviewProps) {
  const gifSrc = exercise.gif_asset
    ? `/gifs/${exercise.gif_asset}`
    : null

  if (compact) {
    return (
      <div className="glass-card rounded-xl overflow-hidden w-32 h-32 flex-shrink-0">
        {gifSrc ? (
          <img
            src={gifSrc}
            alt={`${exercise.name} demonstration`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-carbon-500 text-3xl">
            🏃
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl2 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-carbon-700 flex items-center gap-2">
        <span className="text-xs font-mono text-neon-green uppercase tracking-wider">
          Demo
        </span>
        <span className="text-xs text-carbon-500">— follow this movement</span>
      </div>

      {/* GIF */}
      <div className="relative aspect-square bg-carbon-900">
        {gifSrc ? (
          <img
            src={gifSrc}
            alt={`${exercise.name} demonstration`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-carbon-500">
            <span className="text-5xl">🏃</span>
            <p className="text-xs font-mono">No preview available</p>
            <p className="text-xs text-carbon-600">
              Add: /public/gifs/{exercise.gif_asset ?? 'exercise.gif'}
            </p>
          </div>
        )}

        {/* Looping badge */}
        {gifSrc && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-carbon-950/80 text-neon-green text-xs font-mono border border-neon-green/20">
            ↻ Loop
          </div>
        )}
      </div>

      {/* Exercise info */}
      <div className="px-4 py-3 space-y-1">
        <p className="font-display font-bold text-warm-cream text-sm leading-tight">
          {exercise.name}
        </p>
        {exercise.description && (
          <p className="text-xs text-warm-sand leading-relaxed line-clamp-2">
            {exercise.description}
          </p>
        )}
        <div className="flex gap-3 pt-1">
          <Chip label={`${exercise.target_reps} reps`} />
          <Chip label={`${exercise.target_sets} sets`} />
          <Chip label={`${exercise.tempo_seconds}s/rep`} />
        </div>
      </div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded bg-carbon-700 text-warm-sand">
      {label}
    </span>
  )
}
