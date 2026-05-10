// ============================================================
// GamiPhysio AR — useVoiceSafety Hook
// Web Speech API continuous background listener.
// ============================================================
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { VoiceSafetyState, VoiceSafetyEvent } from '@/types' // 🟢 Use central types
import { VOICE_STOP_KEYWORDS, VOICE_HELP_KEYWORDS } from '@/lib/constants'

export interface UseVoiceSafetyOptions {
  enabled: boolean
  onStop?: (event: VoiceSafetyEvent) => void
  onHelp?: (event: VoiceSafetyEvent) => void
}

export function useVoiceSafety({
  enabled,
  onStop,
  onHelp,
}: UseVoiceSafetyOptions): VoiceSafetyState {
  const [state, setState] = useState<VoiceSafetyState>({
    status: 'idle', // 🟢 Required by global type
    isListening: false,
    lastEvent: null,
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
        // 🟢 Aligning with VoiceSafetyEvent global type
        const safetyEvent: VoiceSafetyEvent = {
          type: isStop ? 'stop' : 'help',
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

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setState(s => ({
        ...s,
        status: 'unavailable',
        isListening: false,
      }))
      return
    }

    if (!enabled) {
      setState(s => ({ ...s, status: 'idle', isListening: false }))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.lang            = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      if (isMounted.current) setState(s => ({ ...s, status: 'active', isListening: true }))
    }

    recognition.onend = () => {
      if (!isMounted.current) return
      setState(s => ({ ...s, isListening: false }))
      
      if (enabledRef.current) {
        try { recognition.start() } catch { /* already starting */ }
      }
    }

    recognition.onerror = (e: any) => {
      if (!isMounted.current) return
      if (e.error === 'no-speech' || e.error === 'aborted') return
      
      setState(s => ({
        ...s,
        status: 'error',
        isListening: false,
      }))
    }

    recognition.onresult = handleResult

    try {
      recognition.start()
    } catch (err) {
      setState(s => ({ ...s, status: 'error', isListening: false }))
    }

    recognitionRef.current = recognition

    return () => {
      isMounted.current = false
      try { recognition.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
  }, [enabled, handleResult])

  return state
}