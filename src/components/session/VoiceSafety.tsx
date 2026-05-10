// ============================================================
// GamiPhysio AR — VoiceSafety Component
// Visual indicator for voice commands (STOP/HELP).
// ============================================================
'use client'

import React from 'react'
import type { VoiceSafetyState, VoiceSafetyEvent } from '@/types'

interface VoiceSafetyProps {
  voiceState: VoiceSafetyState
  lastEvent: VoiceSafetyEvent | null
}

export function VoiceSafety({ voiceState, lastEvent }: VoiceSafetyProps) {
  // If no event is active, just show the status indicator
  if (!lastEvent) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-carbon-900/60 backdrop-blur-sm border border-carbon-800">
        <div 
          className={`w-2 h-2 rounded-full animate-pulse ${
            voiceState.status === 'active' ? 'bg-neon-green' : 'bg-carbon-600'
          }`} 
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-carbon-400">
          {voiceState.status === 'active' ? 'Mic Active' : 'Mic Off'}
        </span>
      </div>
    )
  }

  // ── Emergency Overlay ───────────────────────────────────────
  // This shows up when a command is detected
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none p-6">
      <div className="bg-warm-coral text-white px-8 py-6 rounded-xl2 text-center shadow-2xl border-2 border-white/20 animate-slide-up pointer-events-auto">
        <p className="font-display text-5xl font-black mb-2">
          {/* 🟢 Updated from .keyword === 'STOP' to .type === 'stop' */}
          {lastEvent.type === 'stop' ? '🛑 STOP' : '🆘 HELP'}
        </p>
        <p className="text-lg font-semibold">
          Voice command detected — session paused
        </p>
        <p className="text-sm opacity-80 mt-1">
          Stay still until medical assistance or reset.
        </p>
      </div>
    </div>
  )
}