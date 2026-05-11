// ============================================================
// GamiPhysio AR — /session Page (v5 — Visual Fix)
// Fixes: Black screen masking and autoPlay race conditions.
// ============================================================
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Exercise, PoseLandmarks, UserMode, SessionState } from '@/types'
import { usePose }          from '@/hooks/usePose'
import { useScoring }       from '@/hooks/useScoring'
import { useSessionTimer }  from '@/hooks/useSessionTimer'
import { useVoiceSafety }   from '@/hooks/useVoiceSafety'
import { SessionHUD }       from '@/components/layout/SessionHUD'
import { VoiceSafety }      from '@/components/session/VoiceSafety'
import { GuardianOverlay }  from '@/components/session/GuardianOverlay'
import { GifPreview }       from '@/components/session/GifPreview'
import { ARCanvas }         from '@/components/session/ARCanvas'

const SessionComplete = dynamic(() => import('./SessionComplete'), { ssr: false })

export default function SessionPage() {
  const router = useRouter()
  const isDev = process.env.NODE_ENV === 'development'

  // ── State ──────────────────────────────────────────────────
  const [exercise, setExercise]     = useState<Exercise | null>(null)
  const [mode, setMode]             = useState<UserMode>('solo')
  const [ready, setReady]           = useState(false)
  const [profileId, setProfileId]   = useState<string | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [finalSessionState, setFinalSessionState] = useState<SessionState | null>(null)
  const [dimensions, setDimensions] = useState({ w: 1280, h: 720 })
  const [showGuardianGate, setShowGuardianGate] = useState(false)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Load exercise + mode ────────────────────────────────────
  useEffect(() => {
    const ex = sessionStorage.getItem('gamiphysio_session_exercise')
    const md = sessionStorage.getItem('gamiphysio_session_mode') as UserMode | null
    if (!ex) { router.push('/plan'); return }
    try {
      const parsed: Exercise = JSON.parse(ex)
      setExercise(parsed)
      setMode(md ?? (parsed.requires_guardian ? 'guardian' : 'solo'))
      if (parsed.requires_guardian || md === 'guardian') setShowGuardianGate(true)
      setReady(true)
    } catch { router.push('/plan') }

    import('@/lib/supabase').then(({ getOrCreateProfile }) => {
      getOrCreateProfile().then(p => setProfileId(p.id)).catch(console.error)
    })
  }, [router])

  // ── Sync Dimensions ──────────────────────────────────────────
  useEffect(() => {
    function update() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        setDimensions({ w, h })
        if (canvasRef.current) {
          canvasRef.current.width = w
          canvasRef.current.height = h
        }
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const timer = useSessionTimer()

  const handleSessionComplete = useCallback((finalState: SessionState) => {
    timer.stop()
    setFinalSessionState(finalState)
    setSessionComplete(true)
  }, [timer])

  const scoring = useScoring({
    exercise: exercise!,
    onSessionComplete: handleSessionComplete,
    onSetComplete: (_set: number) => { timer.triggerRest() },
  })

  // ── Pose Hook Integration ──
  const pose = usePose({
    videoRef,
    canvasRef,
    enabled: ready && !sessionComplete,
    onLandmarks: (landmarks) => {
      if (timer.state.phase === 'active') {
        scoring.processFrame(landmarks)
      }
    },
  })

  useEffect(() => {
    if (pose.jitterScore > 70 && timer.state.phase === 'active') {
      timer.triggerJitterPause()
    }
  }, [pose.jitterScore, timer])

  const voiceSafety = useVoiceSafety({
    enabled: ready && !sessionComplete,
    onStop: () => {
      timer.stop()
      setFinalSessionState({ ...scoring.state, voiceStops: scoring.state.voiceStops + 1 })
      setSessionComplete(true)
    },
    onHelp: () => {
      timer.stop()
      setFinalSessionState({ ...scoring.state, voiceStops: scoring.state.voiceStops + 1 })
      setSessionComplete(true)
    },
  })

  const handleStart = () => {
    if (showGuardianGate) return
    timer.start()
    scoring.reset()
  }

  if (!ready || !exercise) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-carbon-950">
        <div className="w-12 h-12 rounded-full border-4 border-carbon-700 border-t-neon-green animate-spin" />
      </div>
    )
  }

  if (sessionComplete && finalSessionState) {
    return (
      <SessionComplete
        exercise={exercise}
        sessionState={finalSessionState}
        elapsed={timer.state.elapsed}
        profileId={profileId}
        onRestart={() => {
          setSessionComplete(false)
          setFinalSessionState(null)
          scoring.reset()
          timer.reset()
        }}
        onExit={() => router.push('/profile')}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-carbon-950 overflow-hidden" ref={containerRef}>
      
      {/* ── 1. Video Layer: High Visibility ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ 
          transform: 'scaleX(-1)', 
          opacity: 1,
          // 🔴 Removed backgroundColor: '#000' as it can mask the hardware stream
        }}
        playsInline
        muted
        // 🟢 autoPlay removed: controlled manually by usePose init sequence
      />

      {/* ── 2. Skeleton Canvas (Not Mirrored in CSS) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      {/* ── 3. AR Overlays ── */}
      {pose.landmarks && (
        <ARCanvas
          landmarks={pose.landmarks}
          bodyPart={exercise.body_part}
          minAngle={exercise.angle_config.min_angle}
          maxAngle={exercise.angle_config.max_angle}
          isInZone={scoring.state.isInTargetZone}
          width={dimensions.w}
          height={dimensions.h}
        />
      )}

      {/* ── 4. UI Components ── */}
      {timer.state.phase === 'active' && (
        <div className="absolute top-20 right-4 z-20 w-36">
          <GifPreview exercise={exercise} compact />
        </div>
      )}

      {showGuardianGate && (
        <GuardianOverlay
          personCount={pose.personCount}
          onProceed={() => { setShowGuardianGate(false); timer.start(); scoring.reset(); }}
          onCancel={() => router.push('/plan')}
          isActive={false}
        />
      )}

      {/* Idle / Start State */}
      {timer.state.phase === 'idle' && !showGuardianGate && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-carbon-950/20 backdrop-blur-sm">
          <div className="text-center space-y-6 px-4">
            <h1 className="font-display text-4xl md:text-5xl font-black text-warm-cream uppercase">
              {exercise.name}
            </h1>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono transition-colors ${
              pose.isDetected ? 'border-neon-green/40 text-neon-green bg-neon-green/10' : 'border-warm-amber/40 text-warm-amber bg-warm-amber/10 animate-pulse'
            }`}>
              <span className={`w-2 h-2 rounded-full ${pose.isDetected ? 'bg-neon-green' : 'bg-warm-amber animate-pulse'}`} />
              {pose.isDetected ? 'Subject detected — Ready' : 'Stand back to initialize camera...'}
            </div>

            <button
              onClick={handleStart}
              disabled={!pose.isDetected && !isDev}
              className={`px-12 py-5 rounded-xl2 bg-neon-green text-carbon-950 font-display font-black text-2xl uppercase tracking-widest shadow-neon-lg transition-all active:scale-95 block mx-auto ${
                (!pose.isDetected && !isDev) ? "opacity-40 cursor-not-allowed" : "opacity-100 cursor-pointer"
              }`}
            >
              ▶ Begin
            </button>
          </div>
        </div>
      )}

      {timer.state.phase !== 'idle' && (
        <SessionHUD
          sessionState={scoring.state}
          timerState={timer.state}
          exercise={exercise}
          onStop={() => {
            timer.stop()
            setFinalSessionState(scoring.state)
            setSessionComplete(true)
          }}
        />
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <VoiceSafety voiceState={voiceSafety} lastEvent={voiceSafety.lastEvent} />
      </div>

      {isDev && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 text-[10px] font-mono bg-carbon-950/80 px-3 py-1 rounded-full text-carbon-400">
          {pose.fps} fps · jitter {pose.jitterScore} · detected: {pose.isDetected ? 'YES' : 'NO'}
        </div>
      )}
    </div>
  )
}