// ============================================================
// GamiPhysio AR — useSessionTimer Hook
// Countdown, elapsed timer, jitter-pause, and rest-period logic.
// ============================================================
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  COUNTDOWN_SECONDS,
  REST_PERIOD_SECONDS,
  JITTER_PAUSE_SECONDS,
  JITTER_FRAME_THRESHOLD,
} from '@/lib/constants'

export type TimerPhase = 'idle' | 'countdown' | 'active' | 'jitter_pause' | 'rest' | 'done'

export interface SessionTimerState {
  phase: TimerPhase
  elapsed: number          // seconds since session started
  countdown: number        // seconds remaining in countdown
  restRemaining: number    // seconds remaining in rest period
  jitterRemaining: number  // seconds remaining in jitter pause
}

export interface SessionTimerControls {
  start: () => void
  stop: () => void
  triggerJitterPause: () => void
  triggerRest: () => void
  resume: () => void
  reset: () => void
  state: SessionTimerState
}

export function useSessionTimer(): SessionTimerControls {
  const [state, setState] = useState<SessionTimerState>({
    phase: 'idle',
    elapsed: 0,
    countdown: COUNTDOWN_SECONDS,
    restRemaining: REST_PERIOD_SECONDS,
    jitterRemaining: JITTER_PAUSE_SECONDS,
  })

  const intervalRef   = useRef<NodeJS.Timeout | null>(null)
  const phaseRef      = useRef<TimerPhase>('idle')
  const startTimeRef  = useRef<number>(0)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Countdown → active
  const runCountdown = useCallback(() => {
    phaseRef.current = 'countdown'
    let remaining = COUNTDOWN_SECONDS

    setState(s => ({ ...s, phase: 'countdown', countdown: remaining }))
    clearTimer()

    intervalRef.current = setInterval(() => {
      remaining--
      setState(s => ({ ...s, countdown: remaining }))

      if (remaining <= 0) {
        clearTimer()
        phaseRef.current  = 'active'
        startTimeRef.current = Date.now()
        setState(s => ({ ...s, phase: 'active', countdown: 0 }))

        // Start elapsed counter
        intervalRef.current = setInterval(() => {
          if (phaseRef.current !== 'active') return
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setState(s => ({ ...s, elapsed }))
        }, 1000)
      }
    }, 1000)
  }, [])

  const start = useCallback(() => {
    if (phaseRef.current !== 'idle') return
    runCountdown()
  }, [runCountdown])

  const stop = useCallback(() => {
    clearTimer()
    phaseRef.current = 'done'
    setState(s => ({ ...s, phase: 'done' }))
  }, [])

  const triggerJitterPause = useCallback(() => {
    if (phaseRef.current !== 'active') return
    clearTimer()
    phaseRef.current = 'jitter_pause'

    let remaining = JITTER_PAUSE_SECONDS
    setState(s => ({ ...s, phase: 'jitter_pause', jitterRemaining: remaining }))

    intervalRef.current = setInterval(() => {
      remaining--
      setState(s => ({ ...s, jitterRemaining: remaining }))

      if (remaining <= 0) {
        clearTimer()
        phaseRef.current = 'active'
        setState(s => ({ ...s, phase: 'active', jitterRemaining: 0 }))

        // Resume elapsed counter
        intervalRef.current = setInterval(() => {
          if (phaseRef.current !== 'active') return
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setState(s => ({ ...s, elapsed }))
        }, 1000)
      }
    }, 1000)
  }, [])

  const triggerRest = useCallback(() => {
    if (phaseRef.current !== 'active') return
    clearTimer()
    phaseRef.current = 'rest'

    let remaining = REST_PERIOD_SECONDS
    setState(s => ({ ...s, phase: 'rest', restRemaining: remaining }))

    intervalRef.current = setInterval(() => {
      remaining--
      setState(s => ({ ...s, restRemaining: remaining }))

      if (remaining <= 0) {
        clearTimer()
        phaseRef.current = 'active'
        setState(s => ({ ...s, phase: 'active', restRemaining: 0 }))

        intervalRef.current = setInterval(() => {
          if (phaseRef.current !== 'active') return
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setState(s => ({ ...s, elapsed }))
        }, 1000)
      }
    }, 1000)
  }, [])

  const resume = useCallback(() => {
    if (phaseRef.current !== 'jitter_pause' && phaseRef.current !== 'rest') return
    clearTimer()
    phaseRef.current = 'active'
    setState(s => ({ ...s, phase: 'active' }))

    intervalRef.current = setInterval(() => {
      if (phaseRef.current !== 'active') return
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setState(s => ({ ...s, elapsed }))
    }, 1000)
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    phaseRef.current = 'idle'
    startTimeRef.current = 0
    setState({
      phase: 'idle',
      elapsed: 0,
      countdown: COUNTDOWN_SECONDS,
      restRemaining: REST_PERIOD_SECONDS,
      jitterRemaining: JITTER_PAUSE_SECONDS,
    })
  }, [])

  useEffect(() => () => clearTimer(), [])

  return { start, stop, triggerJitterPause, triggerRest, resume, reset, state }
}
