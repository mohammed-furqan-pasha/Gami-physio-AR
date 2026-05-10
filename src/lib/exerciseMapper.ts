// ============================================================
// GamiPhysio AR — Exercise Mapper
// Maps Gemini OCR output → Supabase exercise records
// ============================================================

import { matchExercisesByKeywords, getExercises } from './supabase'
import type { Exercise, BodyPart, SeverityLevel } from '@/types'

/**
 * Main mapping function called after Gemini OCR extraction.
 * 1. Try keyword overlap match in Supabase
 * 2. Fall back to body_part + severity filter if no keyword matches
 * 3. Return up to 5 best-matched exercises
 */
export async function mapExercisesFromExtraction(
  keywords: string[],
  bodyPart: BodyPart | null,
  severity: SeverityLevel | null
): Promise<Exercise[]> {
  let results: Exercise[] = []

  // Step 1: keyword match (most specific)
  if (keywords.length > 0) {
    try {
      results = await matchExercisesByKeywords(keywords, bodyPart, severity)
    } catch (err) {
      console.error('[exerciseMapper] Keyword match failed:', err)
    }
  }

  // Step 2: fallback — filter by body part + severity only
  if (results.length === 0 && (bodyPart || severity)) {
    try {
      results = await getExercises(bodyPart ?? undefined, severity ?? undefined)
    } catch (err) {
      console.error('[exerciseMapper] Fallback filter failed:', err)
    }
  }

  // Step 3: last resort — return all exercises for the body part
  if (results.length === 0 && bodyPart) {
    try {
      results = await getExercises(bodyPart)
    } catch (err) {
      console.error('[exerciseMapper] Body-part-only fallback failed:', err)
    }
  }

  // Prioritize: guardian-required exercises last (safer defaults first)
  results.sort((a, b) => {
    if (a.requires_guardian && !b.requires_guardian) return 1
    if (!a.requires_guardian && b.requires_guardian) return -1
    return 0
  })

  // Return max 5 exercises
  return results.slice(0, 5)
}

/**
 * Scores keyword overlap between exercise keywords and extracted keywords.
 * Used for ranking when multiple matches exist.
 */
export function scoreKeywordMatch(
  exerciseKeywords: string[],
  extractedKeywords: string[]
): number {
  const extracted = extractedKeywords.map(k => k.toLowerCase())
  let matches = 0

  for (const ek of exerciseKeywords) {
    if (extracted.some(k => k.includes(ek.toLowerCase()) || ek.toLowerCase().includes(k))) {
      matches++
    }
  }

  return matches
}
