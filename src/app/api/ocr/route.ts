// ============================================================
// GamiPhysio AR — POST /api/ocr
// Receives a JPG/PDF medical report, calls Gemini 2.0 Flash,
// maps results to exercises, stores extraction in Supabase.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { parseMedicalReport } from '@/lib/gemini'
import { mapExercisesFromExtraction } from '@/lib/exerciseMapper'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 30  // Vercel Hobby: 30s limit

const ALLOWED_TYPES: Record<string, 'image/jpeg' | 'image/png' | 'application/pdf'> = {
  'image/jpeg':      'image/jpeg',
  'image/jpg':       'image/jpeg',
  'image/png':       'image/png',
  'application/pdf': 'application/pdf',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const profileId = formData.get('profile_id') as string | null

    // ── Validation ───────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 })
    }

    const mimeType = ALLOWED_TYPES[file.type]
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a JPG, PNG, or PDF.' },
        { status: 415 }
      )
    }

    // ── Gemini OCR ───────────────────────────────────────────
    const fileBuffer = await file.arrayBuffer()
    const extraction = await parseMedicalReport(fileBuffer, mimeType)

    // ── Exercise Mapping ─────────────────────────────────────
    const exercises = await mapExercisesFromExtraction(
      extraction.detected_keywords,
      extraction.detected_body_part,
      extraction.detected_severity
    )
    extraction.matched_exercises = exercises

    // ── Persist to Supabase (optional — skip if no profile) ──
    if (profileId) {
      const { error } = await supabase.from('report_extractions').insert({
        profile_id: profileId,
        raw_gemini_json: { response: extraction.raw_gemini_response },
        detected_body_part: extraction.detected_body_part,
        detected_severity: extraction.detected_severity,
        matched_exercise_ids: exercises.map(e => e.id),
        extraction_notes: extraction.extraction_notes,
        purge_ready: false,
      })

      if (error) {
        console.error('[OCR] Failed to save extraction:', error)
        // Non-fatal — still return the result
      }
    }

    // ── Response ─────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      body_part:   extraction.detected_body_part,
      severity:    extraction.detected_severity,
      keywords:    extraction.detected_keywords,
      notes:       extraction.extraction_notes,
      exercises:   exercises,
    })
  } catch (err: any) {
    console.error('[OCR] Unhandled error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error.' },
      { status: 500 }
    )
  }
}
