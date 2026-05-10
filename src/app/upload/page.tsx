// ============================================================
// GamiPhysio AR — /upload Page
// Medical report upload → Gemini OCR → exercise plan preview
// ============================================================
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ReportDropzone } from '@/components/upload/ReportDropzone'
import { SeverityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { UploadState, OcrExtractionResult, Exercise } from '@/types'
import { BODY_PARTS } from '@/lib/constants'

const INITIAL_STATE: UploadState = {
  file: null,
  preview: null,
  status: 'idle',
  progress: 0,
  result: null,
  error: null,
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_STATE)
  const [profileId, setProfileId] = useState<string | null>(null)

  // Get or create profile
  useEffect(() => {
    async function init() {
      const { getOrCreateProfile } = await import('@/lib/supabase')
      try {
        const profile = await getOrCreateProfile()
        setProfileId(profile.id)
      } catch (err) {
        console.error('Profile init failed:', err)
      }
    }
    init()
  }, [])

  const handleFileSelected = useCallback(async (file: File) => {
    // Preview
    const preview = file.type.startsWith('image')
      ? URL.createObjectURL(file)
      : null

    setUploadState({ ...INITIAL_STATE, file, preview, status: 'uploading', progress: 10 })

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (profileId) formData.append('profile_id', profileId)

      setUploadState(s => ({ ...s, progress: 30, status: 'processing' }))

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      setUploadState(s => ({ ...s, progress: 80 }))

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'OCR failed')
      }

      const data = await res.json()

      const result: OcrExtractionResult = {
        detected_body_part:  data.body_part,
        detected_severity:   data.severity,
        detected_keywords:   data.keywords ?? [],
        matched_exercises:   data.exercises ?? [],
        extraction_notes:    data.notes ?? '',
        raw_gemini_response: '',
      }

      setUploadState(s => ({ ...s, progress: 100, status: 'done', result }))

      // Save to sessionStorage for the /plan page
      sessionStorage.setItem('gamiphysio_ocr_result', JSON.stringify(result))

    } catch (err: any) {
      setUploadState(s => ({
        ...s,
        status: 'error',
        error: err.message ?? 'Something went wrong. Please try again.',
        progress: 0,
      }))
    }
  }, [profileId])

  const handleContinue = () => {
    router.push('/plan')
  }

  const handleReset = () => {
    setUploadState(INITIAL_STATE)
    sessionStorage.removeItem('gamiphysio_ocr_result')
  }

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-5xl font-black text-warm-cream mb-2">
          Upload <span className="text-neon-green">Report</span>
        </h1>
        <p className="text-warm-sand">
          Upload your medical report and Gemini AI will extract your personalized exercise plan.
        </p>
      </div>

      {/* Dropzone */}
      <ReportDropzone
        onFileSelected={handleFileSelected}
        uploadState={uploadState}
      />

      {/* Result */}
      {uploadState.status === 'done' && uploadState.result && (
        <ExtractionResult
          result={uploadState.result}
          onContinue={handleContinue}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

function ExtractionResult({
  result,
  onContinue,
  onReset,
}: {
  result: OcrExtractionResult
  onContinue: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Summary */}
      <div className="glass-card rounded-xl2 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-neon-green text-xl">✓</span>
          <h2 className="font-display text-xl font-bold text-warm-cream uppercase">
            Report Analysed
          </h2>
        </div>

        {/* Detection row */}
        <div className="flex flex-wrap gap-3">
          {result.detected_body_part && (
            <DetectionChip
              label="Body Part"
              value={BODY_PARTS[result.detected_body_part].label}
              icon={BODY_PARTS[result.detected_body_part].icon}
            />
          )}
          {result.detected_severity && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-carbon-500 uppercase tracking-wider">Severity</span>
              <SeverityBadge severity={result.detected_severity} size="lg" />
            </div>
          )}
        </div>

        {/* Notes */}
        {result.extraction_notes && (
          <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-700">
            <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-1">
              AI Summary
            </p>
            <p className="text-sm text-warm-sand leading-relaxed">{result.extraction_notes}</p>
          </div>
        )}

        {/* Keywords */}
        {result.detected_keywords.length > 0 && (
          <div>
            <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-2">
              Detected Keywords
            </p>
            <div className="flex flex-wrap gap-2">
              {result.detected_keywords.map(kw => (
                <span key={kw} className="px-2 py-0.5 bg-carbon-700 rounded-full text-xs font-mono text-warm-sand">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Exercises found */}
        <div>
          <p className="text-xs font-mono text-carbon-500 uppercase tracking-wider mb-2">
            Matched Exercises ({result.matched_exercises.length})
          </p>
          {result.matched_exercises.length === 0 ? (
            <p className="text-sm text-warm-sand italic">
              No exercises matched. You can browse all exercises on the plan page.
            </p>
          ) : (
            <ul className="space-y-1">
              {result.matched_exercises.map(ex => (
                <li key={ex.id} className="flex items-center gap-2 text-sm text-warm-cream">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green flex-shrink-0" />
                  {ex.name}
                  {ex.requires_guardian && (
                    <span className="text-xs text-warm-coral font-mono">🛡️ Guardian</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button size="lg" variant="primary" onClick={onContinue} className="flex-1">
          View Exercise Plan →
        </Button>
        <Button size="lg" variant="ghost" onClick={onReset}>
          Upload Different
        </Button>
      </div>
    </div>
  )
}

function DetectionChip({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-mono text-carbon-500 uppercase tracking-wider">{label}</span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-carbon-700 rounded-xl border border-carbon-600 font-display font-bold text-warm-cream text-sm">
        {icon} {value}
      </span>
    </div>
  )
}
