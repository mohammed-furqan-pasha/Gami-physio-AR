// ============================================================
// GamiPhysio AR — GifPreview
// Side-by-side .gif demonstration panel shown during session.
// ============================================================
'use client'

import type { Exercise } from '@/types'

interface GifPreviewProps {
  exercise: Exercise
  compact?: boolean
}

export function GifPreview({ exercise, compact = false }: GifPreviewProps) {
  // 🟢 Updated: Use the full URL from Supabase directly
  const gifSrc = exercise.gif_asset || null

  if (compact) {
    return (
      <div className="glass-card rounded-xl overflow-hidden w-32 h-32 flex-shrink-0 border border-carbon-800">
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
    <div className="glass-card rounded-xl2 overflow-hidden border border-carbon-800 bg-carbon-950/40 backdrop-blur-md">
      {/* Header */}
      <div className="px-4 py-3 border-b border-carbon-800 flex items-center gap-2">
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
            <p className="text-[10px] text-carbon-600 px-4 text-center">
              Check Supabase Storage: exercise-gifs bucket
            </p>
          </div>
        )}

        {/* Looping badge */}
        {gifSrc && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-carbon-950/80 text-neon-green text-[10px] font-mono border border-neon-green/20">
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
          <p className="text-[11px] text-warm-sand leading-relaxed line-clamp-2">
            {exercise.description}
          </p>
        )}
        <div className="flex gap-2 pt-1 overflow-x-hidden">
          <Chip label={`${exercise.target_reps}r`} />
          <Chip label={`${exercise.target_sets}s`} />
          <Chip label={`${exercise.tempo_seconds}s`} />
        </div>
      </div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-carbon-800 text-warm-sand border border-carbon-700">
      {label}
    </span>
  )
}