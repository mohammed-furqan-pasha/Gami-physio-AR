// ============================================================
// GamiPhysio AR — Supabase Client (Anon)
// ============================================================
import { createClient } from '@supabase/supabase-js'
import type { Profile, Exercise, Session, DailySummary, BodyPart, SeverityLevel } from '@/types'
import { PROFILE_STORAGE_KEY } from './constants'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    'Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ── Profile helpers ────────────────────────────────────────────

/**
 * Gets or creates an anonymous profile.
 * ID is persisted in localStorage so the user keeps their progress.
 */
export async function getOrCreateProfile(): Promise<Profile> {
  // Only runs client-side
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateProfile must be called client-side')
  }

  const storedId = localStorage.getItem(PROFILE_STORAGE_KEY)

  if (storedId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', storedId)
      .single()

    if (!error && data) return data as Profile
    // If not found (e.g. DB was reset), fall through to create new
  }

  // Create a new profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({ display_name: 'Athlete' })
    .select()
    .single()

  if (error || !data) throw new Error('Failed to create profile: ' + error?.message)

  localStorage.setItem(PROFILE_STORAGE_KEY, data.id)
  return data as Profile
}

export async function updateDisplayName(profileId: string, name: string) {
  return supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', profileId)
}

// ── Exercise helpers ───────────────────────────────────────────

export async function getExercises(
  bodyPart?: BodyPart,
  severity?: SeverityLevel
): Promise<Exercise[]> {
  let query = supabase.from('exercises').select('*')

  if (bodyPart) query = query.eq('body_part', bodyPart)
  if (severity) query = query.eq('severity', severity)

  const { data, error } = await query.order('name')
  if (error) throw error
  return (data ?? []) as Exercise[]
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Exercise
}

/**
 * Keyword-based fuzzy match against the exercises table.
 * Used after Gemini OCR extracts keywords from the report.
 */
export async function matchExercisesByKeywords(
  keywords: string[],
  bodyPart?: BodyPart | null,
  severity?: SeverityLevel | null
): Promise<Exercise[]> {
  let query = supabase
    .from('exercises')
    .select('*')
    .overlaps('keywords', keywords)

  if (bodyPart) query = query.eq('body_part', bodyPart)
  if (severity) query = query.eq('severity', severity)

  const { data, error } = await query.order('name')
  if (error) throw error
  return (data ?? []) as Exercise[]
}

// ── Session helpers ────────────────────────────────────────────

export async function saveSession(
  session: Omit<Session, 'id' | 'created_at' | 'completed_at'>
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()

  if (error) throw error
  return data as Session
}

export async function getSessionHistory(
  profileId: string,
  limit = 50
): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .order('session_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Session[]
}

// ── Calendar / heatmap helpers ─────────────────────────────────

export async function getDailySummaries(
  profileId: string,
  fromDate: string,   // YYYY-MM-DD
  toDate: string      // YYYY-MM-DD
): Promise<DailySummary[]> {
  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('profile_id', profileId)
    .gte('session_date', fromDate)
    .lte('session_date', toDate)
    .order('session_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as DailySummary[]
}
