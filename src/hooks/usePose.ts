// ============================================================
// GamiPhysio AR — usePose Hook (v5.1 — Hardware Compatibility)
// Fixes: getUserMedia hang and Windows Driver conflicts.
// ============================================================
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { PoseEngineState, PoseLandmarks } from '@/types'
import { MIN_LANDMARK_VISIBILITY } from '@/lib/constants'
import { computeJitterScore } from '@/lib/angleMath'

const JITTER_WINDOW = 20
const FPS_WINDOW    = 30
const MP_POSE_VERSION = '0.5.1675469404'

export interface UsePoseOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  enabled: boolean
  onLandmarks?: (landmarks: PoseLandmarks) => void
}

export function usePose({
  videoRef,
  canvasRef,
  enabled,
  onLandmarks,
}: UsePoseOptions): PoseEngineState {
  const [state, setState] = useState<PoseEngineState>({
    landmarks: null,
    isDetected: false,
    fps: 0,
    jitterScore: 0,
    personCount: 0,
  })

  const poseRef        = useRef<any>(null)
  const rafRef         = useRef<number>(0)
  const streamRef      = useRef<MediaStream | null>(null)
  const angleHistory   = useRef<number[]>([])
  const fpsHistory     = useRef<number[]>([])
  const lastFrameTime  = useRef<number>(0)
  const isMounted      = useRef(true)
  const isProcessing   = useRef(false)
  const canvasSize     = useRef({ w: 0, h: 0 })
  const onResultsRef   = useRef<any>(null) // 🟢 Store onResults in ref

  const onResults = useCallback((results: any) => {
    isProcessing.current = false
    if (!isMounted.current) return

    const now   = performance.now()
    const delta = now - lastFrameTime.current
    lastFrameTime.current = now

    const fps = delta > 0 ? Math.round(1000 / delta) : 0
    fpsHistory.current = [...fpsHistory.current.slice(-(FPS_WINDOW - 1)), fps]
    const avgFps = Math.round(
      fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
    )

    const landmarks: PoseLandmarks | null = results.poseLandmarks ?? null
    const isDetected = landmarks
      ? landmarks.some((lm: any) => lm.visibility >= MIN_LANDMARK_VISIBILITY)
      : false

    let jitterScore = 0
    if (landmarks && isDetected) {
      const hipY = landmarks[23]?.y ?? 0
      angleHistory.current = [...angleHistory.current.slice(-(JITTER_WINDOW - 1)), hipY * 180]
      jitterScore = computeJitterScore(angleHistory.current)
    }

    if (canvasRef.current) {
      drawPoseOnCanvas(canvasRef.current, landmarks, canvasSize.current)
    }

    if (landmarks && isDetected && onLandmarks) onLandmarks(landmarks)

    setState({ landmarks, isDetected, fps: avgFps, jitterScore, personCount: isDetected ? 1 : 0 })
  }, [canvasRef, onLandmarks])

  // 🟢 Update ref when onResults changes, but don't trigger camera re-init
  useEffect(() => {
    onResultsRef.current = onResults
    if (poseRef.current) {
      poseRef.current.onResults(onResults)
    }
  }, [onResults])

  useEffect(() => {
    if (!enabled) return
    isMounted.current = true
    let cleanedUp = false

    async function init() {
      console.info('📷 [v5.1] Requesting ANY available video stream...')
      let stream: MediaStream
      try {
        // 🟢 Simplest possible request: no resolution constraints to avoid driver hangs
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        })
      } catch (err) {
        console.error('❌ [v5.1] Camera hardware failed to initialize:', err)
        return
      }

      if (cleanedUp) { 
        stream.getTracks().forEach(t => t.stop())
        return 
      }
      streamRef.current = stream

      const video = videoRef.current
      if (!video) return
      
      console.info('🔗 [v5.1] Attaching stream to element...')
      video.srcObject = stream
      
      await new Promise<void>((resolve) => {
        const check = () => {
          if (video.readyState >= 2) {
            video.play().then(() => {
              console.info('✅ [v5.1] Video is officially PLAYING.')
              resolve()
            }).catch(resolve)
          } else {
            setTimeout(check, 100)
          }
        }
        check()
      })

      if (cleanedUp) return

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        canvasSize.current = { w: rect.width, h: rect.height }
        canvasRef.current.width = rect.width
        canvasRef.current.height = rect.height
      }

      console.info('🧠 [v5.1] Loading MediaPipe...')
      await loadScript(`https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MP_POSE_VERSION}/pose.js`)
      
      const PoseClass = (window as any).Pose
      if (!PoseClass) return

      const pose = new PoseClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MP_POSE_VERSION}/${file}`,
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      pose.onResults(onResults)
      await pose.initialize()
      poseRef.current = pose
      console.info('🚀 [v5.1] Engine READY.')

      const sendFrame = async () => {
        if (cleanedUp || !isMounted.current) return
        const v = videoRef.current
        if (v && v.readyState >= 2 && !v.paused && !isProcessing.current && poseRef.current) {
          isProcessing.current = true
          try {
            await poseRef.current.send({ image: v })
          } catch {
            isProcessing.current = false
          }
        }
        rafRef.current = requestAnimationFrame(sendFrame)
      }
      rafRef.current = requestAnimationFrame(sendFrame)
    }

    init().catch(err => console.error('FATAL:', err))

    return () => {
      cleanedUp = true; isMounted.current = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      poseRef.current?.close?.()
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [enabled, videoRef])

  return state
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src; s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

function drawPoseOnCanvas(canvas: HTMLCanvasElement, landmarks: PoseLandmarks | null, size: { w: number, h: number }) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !landmarks) return
  ctx.clearRect(0, 0, size.w, size.h)

  const CONNECTIONS: [number, number][] = [
    [11, 12], [11, 23], [12, 24], [23, 24],
    [11, 13], [13, 15], [12, 14], [14, 16],
    [23, 25], [25, 27], [24, 26], [26, 28]
  ]

  ctx.lineWidth = 4; ctx.lineCap = 'round'
  ctx.strokeStyle = '#39FF14'

  for (const [i, j] of CONNECTIONS) {
    const a = landmarks[i]; const b = landmarks[j]
    if (!a || !b || a.visibility < 0.5 || b.visibility < 0.5) continue
    ctx.beginPath()
    ctx.moveTo((1 - a.x) * size.w, a.y * size.h)
    ctx.lineTo((1 - b.x) * size.w, b.y * size.h)
    ctx.stroke()
  }

  for (const lm of landmarks) {
    if (lm.visibility < 0.5) continue
    ctx.beginPath()
    ctx.arc((1 - lm.x) * size.w, lm.y * size.h, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#FFE500'; ctx.fill()
  }
}