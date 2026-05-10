// ============================================================
// GamiPhysio AR — /plan Page
// Review extracted exercise plan, select an exercise, start AR session.
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SeverityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GifPreview } from '@/components/session/GifPreview'
import type { Exercise, OcrExtractionResult, BodyPart, SeverityLevel, UserMode } from '@/types'
import { BODY_PARTS, SEVERITY_CONFIG } from '@/lib/constants'
import clsx from 'clsx'

export default function PlanPage() {
  const router = useRouter()
  const [ocrResult, setOcrResult]     = useState<OcrExtractionResult | null>(null)
  const [exercises, setExercises]     = useState<Exercise[]>([])
  const [selected, setSelected]       = useState<Exercise | null>(null)
  const [mode, setMode]               = useState<UserMode>('solo')
  const [loading, setLoading]         = useState(true)
  const [filterBody, setFilterBody]   = useState<BodyPart | 'all'>('all')
  const [filterSev, setFilterSev]     = useState<SeverityLevel | 'all'>('all')

  useEffect(() => {
    async function init() {
      // Try to load OCR result from sessionStorage
      const stored = sessionStorage.getItem('gamiphysio_ocr_result')
      if (stored) {
        try {
          const result: OcrExtractionResult = JSON.parse(stored)
          setOcrResult(result)
          setExercises(result.matched_exercises)
          if (result.detected_body_part) setFilterBody(result.detected_body_part)
          if (result.detected_severity)  setFilterSev(result.detected_severity)
        } catch { /* ignore */ }
      }

      // If no OCR result, or no exercises matched, load all from DB
      const stored2 = sessionStorage.getItem('gamiphysio_ocr_result')
      const parsed  = stored2 ? JSON.parse(stored2) : null
      if (!parsed || !parsed.matched_exercises?.length) {
        const { getExercises } = await import('@/lib/supabase')
        const all = await getExercises()
        setExercises(all)
      }

      setLoading(false)
    }
    init()
  }, [])

  const filtered = exercises.filter(ex => {
    if (filterBody !== 'all' && ex.body_part !== filterBody) return false
    if (filterSev  !== 'all' && ex.severity  !== filterSev)  return false
    return true
  })

  const handleStartSession = () => {
    if (!selected) return
    sessionStorage.setItem('gamiphysio_session_exercise', JSON.stringify(selected))
    sessionStorage.setItem('gamiphysio_session_mode', mode)
    router.push('/session')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-carbon-700 border-t-neon-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-5xl font-black text-warm-cream mb-1">
            Exercise <span className="text-neon-green">Plan</span>
          </h1>
          {ocrResult && (
            <p className="text-warm-sand text-sm">
              Based on your report — {ocrResult.extraction_notes}
            </p>
          )}
        </div>
        {ocrResult?.detected_severity && (
          <SeverityBadge severity={ocrResult.detected_severity} size="lg" />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterGroup
          label="Body Part"
          value={filterBody}
          options={[
            { value: 'all', label: 'All' },
            ...Object.entries(BODY_PARTS).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` })),
          ]}
          onChange={v => setFilterBody(v as BodyPart | 'all')}
        />
        <FilterGroup
          label="Severity"
          value={filterSev}
          options={[
            { value: 'all', label: 'All' },
            ...(['mild','moderate','severe'] as SeverityLevel[]).map(s => ({
              value: s,
              label: SEVERITY_CONFIG[s].label,
            })),
          ]}
          onChange={v => setFilterSev(v as SeverityLevel | 'all')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercise list */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-card rounded-xl2 p-10 text-center text-carbon-500">
              <p className="text-4xl mb-3">🔍</p>
              <p>No exercises match these filters.</p>
            </div>
          ) : (
            filtered.map(ex => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                isSelected={selected?.id === ex.id}
                onClick={() => setSelected(ex)}
              />
            ))
          )}
        </div>

        {/* Selected exercise panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <GifPreview exercise={selected} />

              {/* Mode selector */}
              <div className="glass-card rounded-xl p-4 space-y-3">
                <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider">Mode</p>
                {selected.requires_guardian ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-warm-coral/40 bg-warm-coral/5 text-warm-coral text-sm">
                    <span>🛡️</span>
                    <span className="font-semibold">Guardian Protocol required</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(['solo', 'guardian'] as UserMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={clsx(
                          'py-2 rounded-lg border text-sm font-display font-bold uppercase tracking-wider transition-all',
                          mode === m
                            ? 'border-neon-green bg-neon-green/10 text-neon-green'
                            : 'border-carbon-600 text-warm-sand hover:border-carbon-500'
                        )}
                      >
                        {m === 'solo' ? '👤 Solo' : '👥 Guardian'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                size="xl"
                variant={selected.requires_guardian ? 'guardian' : 'primary'}
                onClick={handleStartSession}
                fullWidth
              >
                {selected.requires_guardian ? '🛡️ Start with Guardian' : '▶ Start AR Session'}
              </Button>
            </>
          ) : (
            <div className="glass-card rounded-xl2 p-8 text-center text-carbon-500">
              <p className="text-3xl mb-3">👆</p>
              <p className="text-sm">Select an exercise to see details and start your session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise,
  isSelected,
  onClick,
}: {
  exercise: Exercise
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left glass-card rounded-xl p-4 transition-all duration-150 border',
        isSelected
          ? 'border-neon-green bg-neon-green/5 shadow-neon-sm'
          : 'border-carbon-700 hover:border-carbon-500'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display font-bold text-warm-cream">{exercise.name}</span>
            {exercise.requires_guardian && (
              <span className="text-xs font-mono text-warm-coral">🛡️</span>
            )}
          </div>
          {exercise.description && (
            <p className="text-xs text-warm-sand line-clamp-2 leading-relaxed">
              {exercise.description}
            </p>
          )}
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs font-mono px-2 py-0.5 bg-carbon-700 rounded text-warm-sand">
              {BODY_PARTS[exercise.body_part].icon} {BODY_PARTS[exercise.body_part].label}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 bg-carbon-700 rounded text-warm-sand">
              {exercise.target_reps}×{exercise.target_sets} reps
            </span>
          </div>
        </div>
        <SeverityBadge severity={exercise.severity} size="sm" className="flex-shrink-0" />
      </div>
    </button>
  )
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-mono text-carbon-500 uppercase tracking-wider">{label}:</span>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-3 py-1 rounded-full text-xs font-mono border transition-all min-h-touch',
            value === opt.value
              ? 'border-neon-green text-neon-green bg-neon-green/10'
              : 'border-carbon-600 text-warm-sand hover:border-carbon-500'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
