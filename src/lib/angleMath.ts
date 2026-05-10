// ============================================================
// GamiPhysio AR — Joint Angle Math Utilities
// Uses MediaPipe normalized landmark coordinates.
// ============================================================

import type { PoseLandmark, PoseLandmarks, RepScore } from '@/types'
import { LANDMARK_INDEX } from '@/types'

// ── Vector math ────────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number }

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function magnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

/**
 * Calculate the angle (degrees) at the vertex joint B,
 * formed by points A → B → C.
 */
export function angleBetween(a: Vec3, b: Vec3, c: Vec3): number {
  const ba = subtract(a, b)
  const bc = subtract(c, b)
  const cosTheta = dot(ba, bc) / (magnitude(ba) * magnitude(bc) + 1e-8)
  const clamped  = Math.max(-1, Math.min(1, cosTheta))
  return Math.round((Math.acos(clamped) * 180) / Math.PI)
}

// ── Landmark extractors ────────────────────────────────────────

function lm(landmarks: PoseLandmarks, index: number): PoseLandmark {
  return landmarks[index]
}

/** Returns false if any landmark's visibility is below threshold */
function isVisible(lms: PoseLandmark[], threshold = 0.5): boolean {
  return lms.every(l => l.visibility >= threshold)
}

// ── Per-joint angle extractors ─────────────────────────────────

/** Left knee angle (hip → knee → ankle) */
export function leftKneeAngle(landmarks: PoseLandmarks): number | null {
  const hip   = lm(landmarks, LANDMARK_INDEX.LEFT_HIP)
  const knee  = lm(landmarks, LANDMARK_INDEX.LEFT_KNEE)
  const ankle = lm(landmarks, LANDMARK_INDEX.LEFT_ANKLE)

  if (!isVisible([hip, knee, ankle])) return null
  return angleBetween(hip, knee, ankle)
}

/** Right knee angle (hip → knee → ankle) */
export function rightKneeAngle(landmarks: PoseLandmarks): number | null {
  const hip   = lm(landmarks, LANDMARK_INDEX.RIGHT_HIP)
  const knee  = lm(landmarks, LANDMARK_INDEX.RIGHT_KNEE)
  const ankle = lm(landmarks, LANDMARK_INDEX.RIGHT_ANKLE)

  if (!isVisible([hip, knee, ankle])) return null
  return angleBetween(hip, knee, ankle)
}

/** Left elbow / shoulder angle (shoulder → elbow → wrist) */
export function leftElbowAngle(landmarks: PoseLandmarks): number | null {
  const shoulder = lm(landmarks, LANDMARK_INDEX.LEFT_SHOULDER)
  const elbow    = lm(landmarks, LANDMARK_INDEX.LEFT_ELBOW)
  const wrist    = lm(landmarks, LANDMARK_INDEX.LEFT_WRIST)

  if (!isVisible([shoulder, elbow, wrist])) return null
  return angleBetween(shoulder, elbow, wrist)
}

/** Shoulder elevation angle (hip → shoulder → wrist, simplified abduction) */
export function leftShoulderAngle(landmarks: PoseLandmarks): number | null {
  const hip      = lm(landmarks, LANDMARK_INDEX.LEFT_HIP)
  const shoulder = lm(landmarks, LANDMARK_INDEX.LEFT_SHOULDER)
  const wrist    = lm(landmarks, LANDMARK_INDEX.LEFT_WRIST)

  if (!isVisible([hip, shoulder, wrist])) return null
  return angleBetween(hip, shoulder, wrist)
}

/** Neck lateral flexion proxy (left ear → nose → right ear angle deviation) */
export function neckLateralAngle(landmarks: PoseLandmarks): number | null {
  const leftEar  = lm(landmarks, LANDMARK_INDEX.LEFT_EYE)   // close proxy
  const nose     = lm(landmarks, LANDMARK_INDEX.NOSE)
  const rightEar = lm(landmarks, LANDMARK_INDEX.RIGHT_EYE)  // close proxy

  if (!isVisible([leftEar, nose, rightEar], 0.4)) return null

  // Compute left shoulder midpoint as neck base
  const lShoulder = lm(landmarks, LANDMARK_INDEX.LEFT_SHOULDER)
  const rShoulder = lm(landmarks, LANDMARK_INDEX.RIGHT_SHOULDER)
  const neckBase  = {
    x: (lShoulder.x + rShoulder.x) / 2,
    y: (lShoulder.y + rShoulder.y) / 2,
    z: (lShoulder.z + rShoulder.z) / 2,
    visibility: 1,
  }

  return angleBetween(nose, neckBase, { x: neckBase.x, y: neckBase.y - 0.5, z: neckBase.z })
}

/** Hip angle proxy for back exercises (shoulder → hip → knee) */
export function leftHipAngle(landmarks: PoseLandmarks): number | null {
  const shoulder = lm(landmarks, LANDMARK_INDEX.LEFT_SHOULDER)
  const hip      = lm(landmarks, LANDMARK_INDEX.LEFT_HIP)
  const knee     = lm(landmarks, LANDMARK_INDEX.LEFT_KNEE)

  if (!isVisible([shoulder, hip, knee])) return null
  return angleBetween(shoulder, hip, knee)
}

/** Ankle dorsiflexion proxy (knee → ankle → foot index) */
export function leftAnkleAngle(landmarks: PoseLandmarks): number | null {
  const knee     = lm(landmarks, LANDMARK_INDEX.LEFT_KNEE)
  const ankle    = lm(landmarks, LANDMARK_INDEX.LEFT_ANKLE)
  const footTip  = lm(landmarks, LANDMARK_INDEX.LEFT_FOOT_INDEX)

  if (!isVisible([knee, ankle, footTip])) return null
  return angleBetween(knee, ankle, footTip)
}

// ── Joint selector: picks the right extractor per body part ───

import type { BodyPart } from '@/types'

export function getPrimaryAngle(
  landmarks: PoseLandmarks,
  bodyPart: BodyPart
): number | null {
  switch (bodyPart) {
    case 'neck':      return neckLateralAngle(landmarks)
    case 'back':      return leftHipAngle(landmarks)
    case 'shoulders': return leftShoulderAngle(landmarks)
    case 'knees':     return leftKneeAngle(landmarks) ?? rightKneeAngle(landmarks)
    case 'ankles':    return leftAnkleAngle(landmarks)
    default:          return null
  }
}

// ── Rep scoring ────────────────────────────────────────────────

/**
 * Grades a rep 1–5 based on how close the peak angle is
 * to the target angle, using the exercise's score_bands config.
 *
 * score_bands = [poor±, fair±, good±, great±, perfect±] (tolerance in degrees)
 */
export function gradeRep(
  peakAngle: number,
  targetAngle: number,
  scoreBands: [number, number, number, number, number]
): RepScore {
  const delta = Math.abs(peakAngle - targetAngle)

  if (delta <= scoreBands[4]) return 5  // Perfect
  if (delta <= scoreBands[3]) return 4  // Great
  if (delta <= scoreBands[2]) return 3  // Good
  if (delta <= scoreBands[1]) return 2  // Fair
  return 1                               // Poor
}

// ── Jitter detection ────────────────────────────────────────────

/**
 * Computes a jitter score (0–100) from a rolling window of angles.
 * High jitter = large variance in recent frames → trigger rest prompt.
 */
export function computeJitterScore(recentAngles: number[]): number {
  if (recentAngles.length < 5) return 0

  const mean = recentAngles.reduce((a, b) => a + b, 0) / recentAngles.length
  const variance = recentAngles.reduce((sum, a) => sum + (a - mean) ** 2, 0) / recentAngles.length
  const stdDev = Math.sqrt(variance)

  // Normalize: stdDev of ~15° → score 100
  return Math.min(100, Math.round((stdDev / 15) * 100))
}

// ── Target angle from AngleConfig ──────────────────────────────

/** Returns the midpoint of the acceptable angle range as the target */
export function getTargetAngle(minAngle: number, maxAngle: number): number {
  return Math.round((minAngle + maxAngle) / 2)
}

/** Whether current angle is within the acceptable range */
export function isInTargetZone(angle: number, min: number, max: number): boolean {
  return angle >= min && angle <= max
}
