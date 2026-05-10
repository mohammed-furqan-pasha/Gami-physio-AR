// ============================================================
// GamiPhysio AR — useScoring Hook
// Rep detection, grading, cumulative score management.
// ============================================================
'use client'

import { useState, useRef, useCallback } from 'react'
import type { Exercise, RepResult, RepScore, SessionState } from '@/types'
import { gradeRep, getPrimaryAngle, getTargetAngle, isInTargetZone } from '@/lib/angleMath'
import type { PoseLandmarks } from '@/types'
import { POINTS_PER_SCORE, OVERACHIEVE_BONUS_PER_REP, MIN_REP_SCORE } from '@/lib/constants'

export interface UseScoringOptions {
  exercise: Exercise | null | undefined // 🟢 Allow null while loading
  onRepComplete?: (result: RepResult) => void
  onSetComplete?: (setNumber: number) => void
  onSessionComplete?: (finalState: SessionState) => void
}

export interface ScoringControls {
  processFrame: (landmarks: PoseLandmarks) => void
  reset: () => void
  skipRep: () => void
  state: SessionState
}

const HOLD_FRAME_THRESHOLD = 15  // frames to hold in target zone = 1 rep

export function useScoring({
  exercise,
  onRepComplete,
  onSetComplete,
  onSessionComplete,
}: UseScoringOptions): ScoringControls {
  
  // 🟢 Safely calculate target angle only if exercise exists
  const targetAngle = exercise?.angle_config
    ? getTargetAngle(exercise.angle_config.min_angle, exercise.angle_config.max_angle)
    : 0

  const makeInitialState = (): SessionState => ({
    phase: 'idle',
    currentRep: 0,
    currentSet: 1,
    repResults: [],
    totalScore: 0,
    currentAngle: null,
    targetAngle,
    isInTargetZone: false,
    holdProgress: 0,
    countdown: 3,
    jitterPauses: 0,
    voiceStops: 0,
    sessionStartMs: null,
    overachieving: false,
  })

  const [state, setState] = useState<SessionState>(makeInitialState())

  // Mutable tracking refs (avoid stale closures in processFrame)
  const holdFrames    = useRef(0)
  const peakAngle     = useRef<number | null>(null)
  const wasInZone     = useRef(false)
  const repCountRef   = useRef(0)
  const setCountRef   = useRef(1)
  const resultsRef    = useRef<RepResult[]>([])
  const totalScoreRef = useRef(0)

  const reset = useCallback(() => {
    holdFrames.current    = 0
    peakAngle.current     = null
    wasInZone.current     = false
    repCountRef.current   = 0
    setCountRef.current   = 1
    resultsRef.current    = []
    totalScoreRef.current = 0
    setState(makeInitialState())
  }, [])

  const processFrame = useCallback((landmarks: PoseLandmarks) => {
    setState(prev => {
      // 🟢 Early return if exercise data hasn't loaded yet
      if (!exercise || prev.phase !== 'active') return prev

      const angle = getPrimaryAngle(landmarks, exercise.body_part)
      if (angle === null) return { ...prev, currentAngle: null }

      const inZone = isInTargetZone(
        angle,
        exercise.angle_config.min_angle,
        exercise.angle_config.max_angle
      )

      // Track peak angle
      if (peakAngle.current === null || angle > peakAngle.current) {
        peakAngle.current = angle
      }

      // Hold-frame counting
      if (inZone) {
        holdFrames.current++
      } else {
        // If leaving zone after being in it, check rep completion
        if (wasInZone.current && holdFrames.current >= HOLD_FRAME_THRESHOLD) {
          const peak = peakAngle.current ?? angle
          const score = gradeRep(peak, targetAngle, exercise.angle_config.score_bands)

          // Only count if score meets minimum
          if (score >= MIN_REP_SCORE) {
            const newRep = repCountRef.current + 1
            repCountRef.current = newRep

            const repResult: RepResult = {
              rep_number: newRep,
              score,
              peak_angle: peak,
              target_angle: targetAngle,
              timestamp_ms: Date.now(),
            }

            resultsRef.current = [...resultsRef.current, repResult]
            totalScoreRef.current += POINTS_PER_SCORE[score]
            onRepComplete?.(repResult)

            // Check if set is done
            if (newRep >= exercise.target_reps * setCountRef.current) {
              const setDone = setCountRef.current
              onSetComplete?.(setDone)

              if (setDone >= exercise.target_sets) {
                // Session complete
                const finalState: SessionState = {
                  ...prev,
                  phase: 'complete',
                  currentRep: newRep,
                  currentSet: setDone,
                  repResults: resultsRef.current,
                  totalScore: totalScoreRef.current,
                  currentAngle: angle,
                  isInTargetZone: false,
                  holdProgress: 0,
                  overachieving: newRep > exercise.target_reps * exercise.target_sets,
                }
                onSessionComplete?.(finalState)
                return finalState
              }

              // Advance to next set
              setCountRef.current++
            }
          }

          holdFrames.current = 0
          peakAngle.current  = null
        } else {
          holdFrames.current = 0
        }
      }

      wasInZone.current = inZone

      const totalTargetFrames = HOLD_FRAME_THRESHOLD
      const holdProgress = Math.min(1, holdFrames.current / totalTargetFrames)

      const currentRep  = repCountRef.current
      const totalTarget = exercise.target_reps * exercise.target_sets

      return {
        ...prev,
        currentAngle: angle,
        isInTargetZone: inZone,
        holdProgress,
        currentRep,
        currentSet: setCountRef.current,
        repResults: resultsRef.current,
        totalScore: totalScoreRef.current,
        overachieving: currentRep > totalTarget,
      }
    })
  }, [exercise, targetAngle, onRepComplete, onSetComplete, onSessionComplete])

  const skipRep = useCallback(() => {
    holdFrames.current = 0
    peakAngle.current  = null
    wasInZone.current  = false
  }, [])

  return { processFrame, reset, skipRep, state }
}