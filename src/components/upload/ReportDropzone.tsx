// ============================================================
// GamiPhysio AR — ReportDropzone
// Drag-and-drop or click to upload JPG/PNG/PDF medical reports.
// ============================================================
'use client'

import { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import type { UploadState } from '@/types'

interface ReportDropzoneProps {
  onFileSelected: (file: File) => void
  uploadState: UploadState
}

const ACCEPTED = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_MB   = 10

export function ReportDropzone({ onFileSelected, uploadState }: ReportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      alert('Please upload a JPG, PNG, or PDF file.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_MB}MB.`)
      return
    }
    onFileSelected(file)
  }, [onFileSelected])

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // allow re-upload same file
  }

  const { status, preview, file } = uploadState
  const isProcessing = status === 'uploading' || status === 'processing'

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-xl2 p-10 text-center transition-all duration-200 cursor-pointer select-none',
          isDragging
            ? 'border-neon-green bg-neon-green/10 shadow-neon-md'
            : 'border-carbon-600 hover:border-neon-green/50 hover:bg-carbon-800/50',
          isProcessing && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={onInputChange}
          className="hidden"
          aria-label="Upload medical report"
        />

        {/* Preview */}
        {preview && file?.type.startsWith('image') ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Report preview"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            <p className="text-sm text-warm-sand font-mono">{file.name}</p>
          </div>
        ) : file ? (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-carbon-700 rounded-xl flex items-center justify-center text-3xl">
              📄
            </div>
            <p className="text-sm text-warm-sand font-mono">{file.name}</p>
            <p className="text-xs text-carbon-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">🏥</div>
            <p className="font-display text-xl font-bold text-warm-cream">
              Drop your report here
            </p>
            <p className="text-sm text-warm-sand">
              JPG, PNG, or PDF up to {MAX_MB}MB
            </p>
            <p className="text-xs text-carbon-500 font-mono">
              X-rays • Discharge summaries • Physiotherapy referrals
            </p>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-carbon-950/80 rounded-xl2">
            <div className="w-12 h-12 rounded-full border-4 border-carbon-700 border-t-neon-green animate-spin mb-3" />
            <p className="font-display text-lg font-bold text-neon-green">
              {status === 'uploading' ? 'Uploading…' : 'Analyzing with Gemini…'}
            </p>
            <p className="text-sm text-warm-sand mt-1">This takes 5–15 seconds</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isProcessing && uploadState.progress > 0 && (
        <div className="h-1.5 bg-carbon-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-neon-green rounded-full transition-all duration-300"
            style={{ width: `${uploadState.progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {status === 'error' && uploadState.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warm-coral/10 border border-warm-coral/30 text-warm-coral text-sm">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p>{uploadState.error}</p>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-xs text-carbon-500 text-center font-mono">
        🔒 Your report is processed by Gemini AI and never stored permanently.
        Only the extracted exercise list is saved.
      </p>
    </div>
  )
}
