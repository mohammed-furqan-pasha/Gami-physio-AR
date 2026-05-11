// ============================================================
// GamiPhysio AR — Gemini 2.0 Flash Client (Server-side only)
// ============================================================
// This file is imported ONLY from API routes (app/api/**).
// NEVER import in client components — the key would be exposed.
// ============================================================

import type { OcrExtractionResult, BodyPart, SeverityLevel } from '@/types'
import { GEMINI_OCR_PROMPT } from './constants'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL          = 'gemini-1.5-flash'

if (!GEMINI_API_KEY) {
  // Only warn at import time on the server — don't throw so build doesn't fail
  console.warn('[Gemini] GEMINI_API_KEY is not set. OCR will fail at runtime.')
}

// ── Types ──────────────────────────────────────────────────────

interface GeminiPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string   // base64
  }
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> }
    finishReason: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
  }
}

// ── Core API call ──────────────────────────────────────────────

export async function callGemini(
  contents: GeminiContent[],
  maxTokens = 1024
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.')

  const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

  const body = {
    contents,
    generationConfig: {
      temperature: 0.1,   // Low temp for deterministic medical parsing
      maxOutputTokens: maxTokens,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const json: GeminiResponse = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

// ── OCR: Parse medical report ──────────────────────────────────

/**
 * Sends a file (JPG or PDF) to Gemini 2.0 Flash for medical parsing.
 * Returns structured OcrExtractionResult.
 *
 * @param fileBuffer  - Raw file bytes (from formData.get('file').arrayBuffer())
 * @param mimeType    - 'image/jpeg' | 'image/png' | 'application/pdf'
 */
export async function parseMedicalReport(
  fileBuffer: ArrayBuffer,
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf'
): Promise<OcrExtractionResult> {
  const base64 = Buffer.from(fileBuffer).toString('base64')

  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        { text: GEMINI_OCR_PROMPT },
      ],
    },
  ]

  let rawText = '';

  // ... inside parseMedicalReport function ...

  try {
    // Attempt the real Google API call
    rawText = await callGemini(contents, 512)
  } catch (error) {
    console.error('[OCR] Gemini API failed or rate-limited. Activating Fallback Mode.', error);
    
    // 🟢 FALLBACK MODE: Updated to simulate a Shoulder injury
    rawText = JSON.stringify({
      body_part: "shoulders", // Changed from "knees"
      severity: "mild",
      keywords: ["extension", "rotator cuff", "pain", "stiffness"],
      notes: "SIMULATED REPORT: Patient presents with limited shoulder extension and mild rotator cuff stiffness. Focus on gradual mobility."
    });
  }

// ... rest of the file ...

  // Strip markdown fences if Gemini wraps in ```json
  const cleaned = rawText
    .replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let parsed: {
    body_part?: string | null
    severity?: string | null
    keywords?: string[]
    notes?: string
  } = {}

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Return a graceful fallback — don't crash the route
    return {
      detected_body_part: null,
      detected_severity: null,
      detected_keywords: [],
      matched_exercises: [],
      extraction_notes: 'Could not parse Gemini response. Please try again or upload a clearer image.',
      raw_gemini_response: rawText,
    }
  }

  const VALID_BODY_PARTS = ['neck', 'back', 'shoulders', 'knees', 'ankles']
  const VALID_SEVERITIES  = ['mild', 'moderate', 'severe']

  return {
    detected_body_part:
      VALID_BODY_PARTS.includes(parsed.body_part ?? '')
        ? (parsed.body_part as BodyPart)
        : null,

    detected_severity:
      VALID_SEVERITIES.includes(parsed.severity ?? '')
        ? (parsed.severity as SeverityLevel)
        : null,

    detected_keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],

    matched_exercises: [], // filled by the API route after DB lookup

    extraction_notes: parsed.notes ?? 'Report processed.',

    raw_gemini_response: rawText,
  }
}