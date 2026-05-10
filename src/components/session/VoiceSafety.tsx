// ============================================================
// GamiPhysio AR — VoiceSafety Component
// Visual indicator for voice safety listener status.
// Actual logic lives in useVoiceSafety hook.
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import type { VoiceSafetyState, VoiceSafetyEvent } from '@/types'

interface VoiceSafetyProps {
  voiceState: VoiceSafetyState
  lastEvent: VoiceSafetyEvent | null
  onDismiss?: () => void
}

export function VoiceSafety({ voiceState, lastEvent, onDismiss }: VoiceSafetyProps) {
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (lastEvent) {
      setShowAlert(true)
      const t = setTimeout(() => {
        setShowAlert(false)
        onDismiss?.()
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [lastEvent, onDismiss])

  // ── Voice stop/help alert ──────────────────────────────────
  if (showAlert && lastEvent) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <div className="bg-warm-coral text-white px-8 py-6 rounded-xl2 text-center shadow-2xl border-2 border-white/20 animate-slide-up pointer-events-auto">
          <p className="font-display text-5xl font-black mb-2">
            {lastEvent.keyword === 'STOP' ? '🛑 STOP' : '🆘 HELP'}
          </p>
          <p className="text-lg font-semibold">
            Voice command detected — session paused
          </p>
          <p className="text-sm mt-1 opacity-80">
            Keyword: "{lastEvent.keyword}" · Confidence: {Math.round(lastEvent.confidence * 100)}%
          </p>
          <button
            onClick={() => { setShowAlert(false); onDismiss?.() }}
            className="mt-4 px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors font-bold"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // ── Compact mic status indicator ──────────────────────────
  if (!voiceState.isSupported) return null

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono
        transition-colors duration-300
        ${voiceState.isListening
          ? 'text-neon-green border border-neon-green/30 bg-neon-green/5'
          : 'text-carbon-500 border border-carbon-700'
        }
      `}
      title={voiceState.isListening ? 'Voice safety active — say "STOP" or "HELP"' : 'Microphone inactive'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${voiceState.isListening ? 'bg-neon-green animate-pulse' : 'bg-carbon-600'}`}
      />
      {voiceState.isListening ? 'MIC ACTIVE' : 'MIC OFF'}
    </div>
  )
}
