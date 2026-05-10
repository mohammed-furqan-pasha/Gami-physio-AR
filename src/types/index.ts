// ============================================================
// GamiPhysio AR — Shared TypeScript Types
// ============================================================

// ── Enums (mirror Supabase ENUMs) ─────────────────────────────
export type BodyPart = 'neck' | 'back' | 'shoulders' | 'knees' | 'ankles'
export type SeverityLevel = 'mild' | 'moderate' | 'severe'
export type UserMode = 'solo' | 'guardian'

// ── Biomechanical config (stored as JSONB in Supabase) ─────────
export interface AngleConfig {
  joint: string
  min_angle: number
  max_angle: number
  hold_seconds: number
  /** Tolerance bands for scoring 1-5: [poor±, fair±, good±, great±, perfect±] */
  score_bands: [number, number, number, number, number]
}

// ── Exercise (from Supabase exercises table) ────────────────────
export interface Exercise {
  id: string
  name: string
  body_part: BodyPart
  severity: SeverityLevel
  angle_config: AngleConfig
  keywords: string[]
  gif_asset: string | null
  description: string | null
  target_reps: number
  target_sets: number
  tempo_seconds: number
  requires_guardian: boolean
  created_at: string
}

// ── Rep scoring ────────────────────────────────────────────────
export type RepScore = 1 | 2 | 3 | 4 | 5

export interface RepResult {
  rep_number: number
  score: RepScore
  peak_angle: number
  target_angle: number
  timestamp_ms: number
}

// ── Session (from Supabase sessions table) ─────────────────────
export interface Session {
  id: string
  profile_id: string
  exercise_id: string | null
  mode: UserMode
  severity: SeverityLevel
  total_score: number
  reps_completed: number
  target_reps: number
  rep_scores: number[]
  jitter_pauses: number
  voice_stops: number
  overachieved: boolean
  overachieve_bonus: number
  duration_seconds: number | null
  session_date: string
  completed_at: string | null
  created_at: string
}

// ── Profile (from Supabase profiles table) ─────────────────────
export interface Profile {
  id: string
  display_name: string
  total_points: number
  streak_days: number
  last_active: string | null
  created_at: string
}

// ── Daily summary (from Supabase daily_summary view) ───────────
export interface DailySummary {
  profile_id: string
  session_date: string
  session_count: number
  day_points: number
  total_reps: number
  last_session_at: string
}

// ── Gemini OCR extraction result ───────────────────────────────
export interface OcrExtractionResult {
  detected_body_part: BodyPart | null
  detected_severity: SeverityLevel | null
  detected_keywords: string[]
  matched_exercises: Exercise[]
  extraction_notes: string
  raw_gemini_response: string
}

// ── MediaPipe Pose landmark ────────────────────────────────────
export interface PoseLandmark {
  x: number          // normalized 0–1
  y: number          // normalized 0–1
  z: number          // depth (relative)
  visibility: number // 0–1
}

export type PoseLandmarks = PoseLandmark[]

/** MediaPipe landmark indices we care about */
export const LANDMARK_INDEX = {
  // Face
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  // Shoulders
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  // Elbows
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  // Wrists
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  // Hips
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  // Knees
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  // Ankles
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  // Heels
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  // Foot
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

// ── Pose engine state ──────────────────────────────────────────
export interface PoseEngineState {
  landmarks: PoseLandmarks | null
  isDetected: boolean
  fps: number
  jitterScore: number   // 0–100; >70 triggers rest prompt
  personCount: number   // 1 = solo, 2+ = guardian detected
}

// ── Session engine state (live during AR session) ──────────────
export interface SessionState {
  phase: 'idle' | 'countdown' | 'active' | 'rest' | 'complete'
  currentRep: number
  currentSet: number
  repResults: RepResult[]
  totalScore: number
  currentAngle: number | null
  targetAngle: number
  isInTargetZone: boolean
  holdProgress: number   // 0–1 for hold timer
  countdown: number      // seconds left in countdown
  jitterPauses: number
  voiceStops: number
  sessionStartMs: number | null
  overachieving: boolean
}

// ── Voice safety event ─────────────────────────────────────────
export interface VoiceSafetyEvent {
  keyword: 'STOP' | 'HELP'
  timestamp: number
  confidence: number
}

// ── Three.js AR overlay config ─────────────────────────────────
export interface AROverlayConfig {
  showSkeleton: boolean
  showTargetZone: boolean
  showBoundingBox: boolean
  showAngleLabel: boolean
  targetZoneColor: string
  skeletonColor: string
  jointColor: string
}

// ── Report extraction state (upload flow) ──────────────────────
export interface UploadState {
  file: File | null
  preview: string | null
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  result: OcrExtractionResult | null
  error: string | null
}
