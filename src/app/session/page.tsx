'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Exercise, PoseLandmarks, UserMode, RepResult, SessionState } from '@/types'
import { usePose }          from '@/hooks/usePose'
import { useScoring }       from '@/hooks/useScoring'
import { useSessionTimer }  from '@/hooks/useSessionTimer'
import { useVoiceSafety }   from '@/hooks/useVoiceSafety'
import { SessionHUD }       from '@/components/layout/SessionHUD'
import { VoiceSafety }      from '@/components/session/VoiceSafety'
import { GuardianOverlay }  from '@/components/session/GuardianOverlay'
import { GifPreview }       from '@/components/session/GifPreview'
import { ARCanvas }         from '@/components/session/ARCanvas'

// ── Session Complete Screen ────────────────────────────────────
const SessionComplete = dynamic(() => import('./SessionComplete'), { ssr: false })

export default function SessionPage() {
  const router = useRouter()
  const isDev = process.env.NODE_ENV === 'development' // 🟢 Dev bypass flag

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

  useEffect(() => {
    const ex   = sessionStorage.getItem('gamiphysio_session_exercise')
    const md   = sessionStorage.getItem('gamiphysio_session_mode') as UserMode | null

    if (!ex) { router.push('/plan'); return }

    try {
      const parsed: Exercise = JSON.parse(ex)
      setExercise(parsed)
      setMode(md ?? (parsed.requires_guardian ? 'guardian' : 'solo'))
      if (parsed.requires_guardian || md === 'guardian') {
        setShowGuardianGate(true)
      }
      setReady(true)
    } catch {
      router.push('/plan')
    }

    import('@/lib/supabase').then(({ getOrCreateProfile }) => {
      getOrCreateProfile().then(p => setProfileId(p.id)).catch(console.error)
    })
  }, [router])

  useEffect(() => {
    function update() {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        })
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
    onSetComplete: (_set: number) => {
      timer.triggerRest()
    },
  })

  const handleLandmarks = useCallback((landmarks: PoseLandmarks) => {
    // Only process for scoring if session is active
    if (timer.state.phase === 'active') {
      scoring.processFrame(landmarks)
    }
  }, [timer.state.phase, scoring])

  const pose = usePose({
    videoRef,
    canvasRef,
    enabled: ready && !sessionComplete,
    onLandmarks: handleLandmarks,
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

  const handleGuardianProceed = () => {
    setShowGuardianGate(false)
    timer.start()
    scoring.reset()
  }

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
      {/* ── Camera feed ───────────────────────────────────── */}
      <video
        ref={videoRef}
        className="ar-video absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        width="1280" 
        height="720"
      />

      {/* ── 2D skeleton canvas ────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={dimensions.w}
        height={dimensions.h}
        className="ar-canvas absolute inset-0 z-10 pointer-events-none"
      />

      {/* ── Three.js AR overlay ───────────────────────────── */}
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

      {timer.state.phase === 'active' && (
        <div className="absolute top-20 right-4 z-20 w-36">
          <GifPreview exercise={exercise} compact />
        </div>
      )}

      {showGuardianGate && (
        <GuardianOverlay
          personCount={pose.personCount}
          onProceed={handleGuardianProceed}
          onCancel={() => router.push('/plan')}
          isActive={false}
        />
      )}

      {!showGuardianGate && mode === 'guardian' && timer.state.phase === 'active' && (
        <GuardianOverlay
          personCount={pose.personCount}
          onProceed={() => {}}
          onCancel={() => {}}
          isActive
        />
      )}

      {/* ── Idle: Start prompt ────────────────────────────── */}
      {timer.state.phase === 'idle' && !showGuardianGate && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center space-y-6">
            <p className="font-display text-5xl font-black text-warm-cream">
              {exercise.name}
            </p>
            <p className="text-warm-sand max-w-xs mx-auto text-sm leading-relaxed px-4">
              {exercise.description}
            </p>
            
            {/* 🟢 Improved status message */}
            {!pose.isDetected && !isDev && (
              <p className="text-warm-amber text-sm font-mono animate-pulse">
                Step into frame to begin…
              </p>
            )}
            {isDev && !pose.isDetected && (
              <p className="text-neon-green/50 text-xs font-mono">
                [Dev Mode: Bypass Active]
              </p>
            )}

            <button
              onClick={handleStart}
              // 🟢 The Fix: Allow click if in Dev mode OR person detected
              disabled={!pose.isDetected && !isDev}
              className={`px-12 py-5 rounded-xl2 bg-neon-green text-carbon-950 font-display font-black text-2xl uppercase tracking-widest shadow-neon-lg hover:shadow-neon-lg transition-all active:scale-95 min-h-touch-lg ${
                (!pose.isDetected && !isDev) ? "opacity-40 cursor-not-allowed" : "opacity-100 cursor-pointer"
              }`}
            >
              ▶ Begin
            </button>
          </div>
        </div>
      )}

      {/* ── Session HUD ───────────────────────────────────── */}
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
        <VoiceSafety
          voiceState={voiceSafety}
          lastEvent={voiceSafety.lastEvent}
        />
      </div>

      {isDev && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-mono text-carbon-400 bg-carbon-950/50 px-2 py-1 rounded">
          {pose.fps} fps · jitter {pose.jitterScore} · detected: {pose.isDetected ? 'YES' : 'NO'}
        </div>
      )}
    </div>
  )
}