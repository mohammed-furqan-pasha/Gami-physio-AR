// ============================================================
// GamiPhysio AR — useVoiceSafety Hook
// Web Speech API continuous background listener.
// Fires callback on "STOP" or "HELP" keywords.
// Zero server impact — runs entirely in the browser.
// ============================================================
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { VoiceSafetyEvent } from '@/types'
import { VOICE_STOP_KEYWORDS, VOICE_HELP_KEYWORDS } from '@/lib/constants'

export interface UseVoiceSafetyOptions {
  enabled: boolean
  onStop?: (event: VoiceSafetyEvent) => void
  onHelp?: (event: VoiceSafetyEvent) => void
}

export interface VoiceSafetyState {
  isListening: boolean
  isSupported: boolean
  lastEvent: VoiceSafetyEvent | null
  error: string | null
}

export function useVoiceSafety({
  enabled,
  onStop,
  onHelp,
}: UseVoiceSafetyOptions): VoiceSafetyState {
  const [state, setState] = useState<VoiceSafetyState>({
    isListening: false,
    isSupported: false,
    lastEvent: null,
    error: null,
  })

  const recognitionRef = useRef<any>(null)
  const enabledRef     = useRef(enabled)
  const isMounted      = useRef(true)

  useEffect(() => { enabledRef.current = enabled }, [enabled])

  const handleResult = useCallback((event: any) => {
    if (!isMounted.current) return

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (!result.isFinal) continue

      const transcript = result[0].transcript.trim().toUpperCase()
      const confidence = result[0].confidence

      const isStop = VOICE_STOP_KEYWORDS.some(kw =>
        transcript.includes(kw.toUpperCase())
      )
      const isHelp = VOICE_HELP_KEYWORDS.some(kw =>
        transcript.includes(kw.toUpperCase())
      )

      if (isStop || isHelp) {
        const safetyEvent: VoiceSafetyEvent = {
          keyword: isStop ? 'STOP' : 'HELP',
          timestamp: Date.now(),
          confidence,
        }

        setState(s => ({ ...s, lastEvent: safetyEvent }))
        if (isStop) onStop?.(safetyEvent)
        if (isHelp) onHelp?.(safetyEvent)
      }
    }
  }, [onStop, onHelp])

  useEffect(() => {
    isMounted.current = true

    // Check support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setState(s => ({
        ...s,
        isSupported: false,
        error: 'Web Speech API not supported in this browser.',
      }))
      return
    }

    setState(s => ({ ...s, isSupported: true }))

    if (!enabled) return

    const recognition = new SpeechRecognition()
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.lang            = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      if (isMounted.current) setState(s => ({ ...s, isListening: true, error: null }))
    }

    recognition.onend = () => {
      if (!isMounted.current) return
      setState(s => ({ ...s, isListening: false }))
      // Auto-restart if still enabled (browsers stop after silence)
      if (enabledRef.current) {
        try { recognition.start() } catch { /* already starting */ }
      }
    }

    recognition.onerror = (e: any) => {
      if (!isMounted.current) return
      if (e.error === 'no-speech' || e.error === 'aborted') return  // Benign
      setState(s => ({
        ...s,
        isListening: false,
        error: `Speech error: ${e.error}`,
      }))
    }

    recognition.onresult = handleResult

    try {
      recognition.start()
    } catch (err) {
      setState(s => ({ ...s, error: 'Could not start microphone.', isListening: false }))
    }

    recognitionRef.current = recognition

    return () => {
      isMounted.current = false
      try { recognition.stop() } catch { /* already stopped */ }
      recognitionRef.current = null
    }
  }, [enabled, handleResult])

  return state
}
