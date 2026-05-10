// ============================================================
// GamiPhysio AR — App-wide Constants
// ============================================================

import type { BodyPart, SeverityLevel, AROverlayConfig } from '@/types'

// ── Body part metadata ─────────────────────────────────────────
export const BODY_PARTS: Record<BodyPart, { label: string; icon: string; primaryJoints: string[] }> = {
  neck: {
    label: 'Neck',
    icon: '🦴',
    primaryJoints: ['neck'],
  },
  back: {
    label: 'Back',
    icon: '🔙',
    primaryJoints: ['lumbar', 'thoracic', 'spine'],
  },
  shoulders: {
    label: 'Shoulders',
    icon: '💪',
    primaryJoints: ['glenohumeral', 'scapula', 'shoulder'],
  },
  knees: {
    label: 'Knees',
    icon: '🦵',
    primaryJoints: ['knee', 'patella'],
  },
  ankles: {
    label: 'Ankles',
    icon: '🦶',
    primaryJoints: ['ankle', 'subtalar'],
  },
}

// ── Severity metadata ──────────────────────────────────────────
export const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; color: string; tailwind: string; description: string; forceGuardian: boolean }
> = {
  mild: {
    label: 'Mild',
    color: '#39FF14',
    tailwind: 'text-severity-mild border-severity-mild bg-severity-mild/10',
    description: 'Solo mode. Standard exercise tempo.',
    forceGuardian: false,
  },
  moderate: {
    label: 'Moderate',
    color: '#FFE500',
    tailwind: 'text-severity-moderate border-severity-moderate bg-severity-moderate/10',
    description: 'Solo mode with increased monitoring and rest prompts.',
    forceGuardian: false,
  },
  severe: {
    label: 'Severe',
    color: '#FF6B6B',
    tailwind: 'text-severity-severe border-severity-severe bg-severity-severe/10',
    description: 'Guardian Protocol required. Two people must be in frame.',
    forceGuardian: true,
  },
}

// ── Scoring ────────────────────────────────────────────────────
export const SCORE_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Perfect',
}

export const SCORE_COLORS: Record<number, string> = {
  1: '#FF4444',
  2: '#FF8C00',
  3: '#FFE500',
  4: '#B5F01A',
  5: '#39FF14',
}

export const SCORE_TAILWIND: Record<number, string> = {
  1: 'text-score-poor',
  2: 'text-score-fair',
  3: 'text-score-good',
  4: 'text-score-great',
  5: 'text-score-perfect',
}

/** Points earned per rep score */
export const POINTS_PER_SCORE: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
}

/** Bonus points for each rep beyond the target (overachieve) */
export const OVERACHIEVE_BONUS_PER_REP = 2

// ── Session thresholds ─────────────────────────────────────────
export const JITTER_FRAME_THRESHOLD =
  Number(process.env.NEXT_PUBLIC_JITTER_FRAME_THRESHOLD) || 30

export const MIN_REP_SCORE =
  Number(process.env.NEXT_PUBLIC_MIN_REP_SCORE) || 2

/** Landmark visibility below this → consider not detected */
export const MIN_LANDMARK_VISIBILITY = 0.6

/** Guardian mode: require at least 2 people detected in frame */
export const GUARDIAN_MIN_PERSONS = 2

/** Countdown seconds before session starts */
export const COUNTDOWN_SECONDS = 3

/** Rest period between sets (seconds) */
export const REST_PERIOD_SECONDS = 30

/** Jitter pause duration (seconds) */
export const JITTER_PAUSE_SECONDS = 10

// ── AR Overlay defaults ─────────────────────────────────────────
export const DEFAULT_AR_CONFIG: AROverlayConfig = {
  showSkeleton: true,
  showTargetZone: true,
  showBoundingBox: true,
  showAngleLabel: true,
  targetZoneColor: '#39FF14',
  skeletonColor: '#FFFFFF',
  jointColor: '#FFE500',
}

// ── Voice safety keywords ──────────────────────────────────────
export const VOICE_STOP_KEYWORDS = ['stop', 'STOP', 'Stop']
export const VOICE_HELP_KEYWORDS = ['help', 'HELP', 'Help']

// ── Gemini prompt ──────────────────────────────────────────────
export const GEMINI_OCR_PROMPT = `You are a medical report parser for a physiotherapy rehabilitation app.

Analyze the provided medical document (X-ray report, physiotherapy referral, or discharge summary) and extract the following information in JSON format ONLY. Do not include any preamble or markdown.

Return this exact JSON structure:
{
  "body_part": "<one of: neck | back | shoulders | knees | ankles | null>",
  "severity": "<one of: mild | moderate | severe | null>",
  "keywords": ["<movement or condition keyword>", ...],
  "notes": "<brief plain-English summary of what was found>"
}

Severity mapping guide:
- mild: minor sprains, muscle strain, early-stage conditions, no structural damage
- moderate: partial tears, disc bulge, moderate impingement, post-immobilization
- severe: fractures, complete tears, post-surgical, neurological involvement, significant instability

Keyword examples: flexion, extension, rotation, traction, isometric, ROM, arthritis, ACL, rotator cuff, disc herniation, impingement, stenosis, etc.

If a field cannot be determined, use null. Always return valid JSON.`

// ── Profile localStorage key ───────────────────────────────────
export const PROFILE_STORAGE_KEY =
  process.env.NEXT_PUBLIC_PROFILE_KEY || 'gamiphysio_profile_id'

// ── Calendar heatmap ────────────────────────────────────────────
export const HEATMAP_COLOR_SCALE = [
  { threshold: 0,   color: '#1E252D' }, // no activity
  { threshold: 1,   color: '#1a3a1a' }, // low
  { threshold: 15,  color: '#2d6e2d' }, // medium-low
  { threshold: 30,  color: '#39FF14' }, // medium-high
  { threshold: 50,  color: '#B5F01A' }, // high (overachieved)
]

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90]
